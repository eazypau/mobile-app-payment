# Design Write-up

This covers how the transfer module is put together, the main decisions and trade-offs, and what was hard. Every individual choice, with its alternatives, is logged in [DECISIONS.md](DECISIONS.md).

## The flow

```
Home ──► Send ──► Review ──► (Face ID / fingerprint, or app PIN) ──► Success
 │        │                                                      │
 │        └─ recipient picker: saved, recent, or account-number lookup
 └─ History (1,000 transactions, infinite scroll) ── tap a past transfer to send it again
```

The three transfer screens are presented as **one modal with its own stack**. Closing it throws away the whole flow, and Success replaces Review, so there's never a "back" into a transfer that already went through.

## Architecture

```
src/app, src/components     Screens and UI. No business rules.
        │
src/hooks/queries.ts        TanStack Query: every server call, cached and shared
src/store                   Zustand: the in-progress transfer only (draft + receipt)
        │
src/services, src/utils     Plain TypeScript: money, validation, limits, idempotency,
                            the mock API. No React, unit-tested on their own.
```

- **Server state and client state are separate.** The balance, recipients and history come from TanStack Query, so Home and Send read the same cache entry and can't show different balances. Zustand holds only what the server doesn't know yet: the draft being reviewed.
- **The mock API behaves like a real one.** It has latency, it returns typed results (`{ ok: true, data } | { ok: false, error: { code } }`), and it re-checks the balance, daily limit and PIN itself. A single `unwrap()` turns failures into thrown errors for TanStack Query, and `getErrorMessage()` covers every error code (adding a code without a message is a compile error).
- **Money is integer sen** (`5000` = RM 50.00), so there's no floating-point arithmetic, and it's only formatted at the edge.

## Security

**Biometrics.** `expo-local-authentication` with `disableDeviceFallback: true`. The phone's passcode is *not* accepted, because anyone who knows it could approve transfers. The fallback is a separate 6-digit **app PIN**, entered on our own keypad (third-party Android keyboards can log keystrokes) and **verified by the server**, which owns the 5-attempt lockout. On Android, only "strong" (Class 3) biometrics are accepted.

**An honest limitation.** The biometric check is *event-bound*: the OS says "yes, it's them" and the app trusts that answer. A tampered app could skip it, and the server can't verify it happened. Banks solve this by binding biometrics to a hardware key (Secure Enclave / Android Keystore) that **signs a server challenge**. I didn't fake that against a mock backend. Instead, all authorization goes through one function, `authorizeTransfer()`, so that upgrade would change one function body and nothing else.

**No double payments.** Every transfer carries an **idempotency key** (a UUID from `expo-crypto`). If a request times out after the bank processed it, "Try again" sends the same key, and the server returns the original receipt instead of paying twice. The key survives going back to Send and returning to Review unchanged, and an edited transfer gets a new key. Transfers are never retried automatically.

**Nothing sensitive in URLs.** Expo Router routes are deep links, so transfer details never travel in route params. Otherwise a link could open a pre-filled transfer to a stranger. Drafts, receipts and re-send prefills all go through the store, and screens reached without one redirect Home.

**Name confirmation.** A typed account number is looked up, and the holder's name is shown before you can send to it. The lookup is debounced and only runs once a bank is chosen and the number has 10+ digits. It also never shows a name for a number that isn't the one currently typed.

## User experience

- **Cash-register amount input.** Digits fill in from the right (`5 0 0 0` → RM 50.00), which maps directly onto integer sen. That avoids decimal parsing, comma-vs-dot locale bugs, and a third decimal place.
- **"Reward early, punish late" validation.** "More than your balance" and "over today's limit" appear *while typing*, with a shake and an error haptic. "Required field" errors wait until the first Review tap. Review is never disabled, so screen readers always get a reason.
- **Clear failure states.** Every error says what happened and what to do: "Try again" when the outcome is unknown (network, timeout), and "Edit transfer" when the bank said no. A network error explicitly says the money hasn't moved.
- **Small, purposeful motion.** A spring on the success checkmark, a shake on invalid input or a wrong PIN, and haptics. The animations use Reanimated, so they run on the UI thread.
- **Quick re-send.** "Recent" chips on Send fill in the recipient in one tap, and tapping a past transfer opens Send pre-filled. Both still go through validation, Review and authorization.

## Performance

- **The React Compiler is on**, so components are memoized automatically, without hand-written `useMemo` / `useCallback`.
- **State boundaries limit re-renders.** The Send form keeps keystrokes in local state and touches the store only on Review. Zustand selectors re-render only the components whose slice changed.
- **History uses FlashList**, which *recycles* row views instead of creating new ones. Rows are pure (no local state, which would leak between recycled rows), headers and rows are typed separately so they recycle into their own kind, and day headers are sticky.
- **Pagination uses an id cursor** ("older than transaction X"), not an offset, so a transfer arriving between page loads can't cause duplicate rows. A test covers this case.
- **Caching:** an account-name lookup is cached for 5 minutes (names don't change, and enquiries cost money), while the balance is always refetched when the app returns to the foreground.

## Testing

90 Jest tests across 9 suites:
- Money parsing and formatting
- Validation (shape rules with Zod, plus balance and limit rules)
- The mock API: idempotency, timeout-then-retry paying once, server-side checks, PIN lockout, pagination
- Mapping of biometric results
- History grouping
- One screen-level test that renders the real Send route and checks that errors appear at the right moments

## Challenges

- **iOS 26's "Liquid Glass" header** is transparent by default, and content was sitting underneath it, which hid the balance. The fix was the platform convention (`contentInsetAdjustmentBehavior="automatic"`), not hard-coded padding. History was trickier: its sticky day headers need the header height as an offset (`stickyHeaderConfig.offset`), or they pin *under* the glass. With both the offset and the automatic inset, the height was applied twice and left a large gap at the top. So History uses only the sticky offset, minus `Screen`'s top padding (the offset is measured from the list, not the screen), and only on iOS, since Android's header is opaque.
- **The OS dialog doesn't always offer our fallback.** We pass `fallbackLabel: 'Use PIN'`, but on the iOS 27 Simulator, the "Face Not Recognized" dialog showed only "Try Face ID Again" and Cancel. A user could get stuck retrying or cancelling. Review now shows its own "Use app PIN instead" button once biometrics are cancelled or fail.
- **`Intl` isn't identical everywhere.** Currency formatting put a non-breaking space after "RM" under Jest but a normal space in Node, and Hermes on a phone has its own `Intl` implementation. I now format the number with `Intl` and add the "RM " prefix myself.
- **A typed result union vs TanStack Query.** I wanted error codes the compiler checks, and TanStack Query wants query functions that throw. One `unwrap()` at the boundary gives both.
- **Reanimated's Jest mock is broken in 4.7.1.** It loads the real library, which throws under Jest, and Expo Router's test setup silently replaces it with an empty object. I added a small local mock covering only the APIs the app uses.
- **Writing a screen test surfaced a real bug.** Deep-linking straight into the transfer modal left nothing underneath it. Anchoring the root stack on Home (`unstable_settings.anchor`) fixed it.

## What I'd do next

1. **Bind biometrics to a server challenge** inside `authorizeTransfer()` (a device key in the Secure Enclave / Keystore, registered with the server).
2. **Pick recipients from the phone's contacts** (`expo-contacts`), using a phone number as a DuitNow ID, then the same name lookup. This was the second stretch goal, deferred for time.
3. **Replace the mock with a real API**, parsing responses with Zod at the network boundary.
4. **Add end-to-end tests with Maestro** for the full send flow on both platforms, and verify Android's PIN fallback on real devices.
5. **Production hardening:** jailbreak/root detection, blurring the screen in the app switcher, re-authentication after time in the background, and an audit log of authorization events.
