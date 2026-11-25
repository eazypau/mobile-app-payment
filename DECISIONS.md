# Decisions

My cheat sheet for the interview debrief. Each entry is one choice and two sentences on why.

## Claude instructions: CLAUDE.md imports AGENTS.md — 2026-11-24
**Chose:** importing over merging or keeping two separate files.
The Expo rules stay in one place that other AI tools can also read, and `CLAUDE.md` only holds the take-home rules. This avoids two copies of the same rules drifting apart.

## Commit workflow: propose-then-approve on `main` — 2026-11-24
**Chose:** small Conventional Commits on `main` that I approve, over auto-commits or a branch and PR per slice.
Atomic, well-named commits let a reviewer follow how the module was built, and approving each one keeps me in control of what's in history. Branches and PRs would add ceremony without much value for a solo take-home.

## Screen flow: Home → Send → Review → Success — 2026-11-24
**Chose:** a single form with a separate Review screen, over a step-by-step wizard or a one-screen form with a bottom sheet.
The user sees exactly what they're authorizing before the biometric prompt, which is the core trust moment in a payment flow. It needs fewer screens and back-navigation edge cases than a wizard, and no bottom-sheet library.

## State management: Zustand — 2026-11-24
**Chose:** a small Zustand store over Context + `useReducer` or local state with route params.
Selectors like `useStore(s => s.balance)` re-render only the components whose slice changed, while Context re-renders every consumer. Keeping the draft transfer in the store, not in route params, matters because Expo Router params are deep-linkable URLs that someone outside the app could pre-fill.

## Money representation: integer minor units — 2026-11-24
**Chose:** integers in minor units (e.g. `5000` = $50.00) over a decimal library or plain floats.
Floats give `0.1 + 0.2 !== 0.3`, and add/compare is all this module needs, so a decimal dependency would be hard to justify. It's also how payment APIs like Stripe represent amounts, and formatting happens only at the UI edge.

## Currency: single currency, Malaysian Ringgit (MYR) — 2026-11-24
**Chose:** one MYR account over multi-wallet or cross-currency (FX) transfers.
The brief doesn't ask for multi-currency, and FX brings rate quotes, expiry and rounding rules that would pull time away from biometrics and error handling. Amounts stay as integer sen, and formatting goes through a single `Intl.NumberFormat('en-MY', { style: 'currency', currency: 'MYR' })` helper, so adding currencies later only touches the type and that helper.

## Biometric binding: `authenticateAsync` gate behind an `authorizeTransfer()` seam — 2026-11-24
**Chose:** an event-bound `expo-local-authentication` check wrapped in one service function, over `SecureStore` with `requireAuthentication` or native key signing.
It's simple and fully explainable, and its weakness is known: it's a client-side boolean that a hooked app could bypass and the server can't verify. In production, only the body of `authorizeTransfer()` changes, to a server-signed challenge.

## Not chosen: native key signing, even though banks use it — 2026-11-24
**Rejected:** a Secure Enclave / Android Keystore key that signs a server challenge after biometrics (e.g. via `react-native-biometrics`), which is the real-world standard for approving transactions.
It needs a third-party native module and a real backend that verifies signatures, and with a mock API that verification would be fake crypto, which is worse than an honest limitation. I'd build it once there's a server, and the `authorizeTransfer()` seam is where it plugs in.

## Fallback: in-app transaction PIN, verified by the API — 2026-11-24
**Chose:** a biometric-only prompt (`disableDeviceFallback: true`) with an in-app PIN fallback, over letting the OS fall back to the device passcode.
Anyone who knows a phone's passcode could approve transfers with OS fallback, which is why banks keep a separate app PIN. The PIN is checked by the (mock) server with a 5-attempt lockout rather than hashed on the device, because a 6-digit PIN's 1M combinations are trivial to brute-force offline.

## Mock API: plain async functions returning a result union — 2026-11-24
**Chose:** async functions in `services/mockApi.ts` returning `{ ok: true, data } | { ok: false, error: { code } }`, over thrown error classes or a real HTTP layer (MSW, Expo Router API routes).
A union lets TypeScript force the UI to handle every error code (a `switch` with a `never` check), while a thrown error reaches `catch` as `unknown`. Plain functions are pure TS, easy to unit-test, and work the same in Expo Go and a dev build, which a polyfilled MSW or a reachable dev server can't promise reviewers.

## Server owns the balance, and mock data lives in memory — 2026-11-24
**Chose:** taking the new balance from the API response, over updating the balance optimistically on the client.
Optimistic UI is fine for "likes", but showing money that might not have moved is a trust bug. The data is seeded in memory at startup (about 20 recipients and 1,000 transactions), so every reviewer starts from the same clean, repeatable state.

## Failure simulation: magic values — 2026-11-24
**Chose:** specific amounts or recipients that trigger specific failures, documented in the README, over a dev settings panel or a random failure rate.
It's the same idea as Stripe's test card numbers: every error scenario can be reproduced on demand with no extra UI. Random failures would mean reviewers might never see the error handling at all.

## Duplicate protection: idempotency key per transfer — 2026-11-24
**Chose:** a key created when Review opens and sent with the transfer, over only disabling the button while a request is in flight.
After a timeout, the server may have processed the transfer even though the app never heard back, so a naive retry could pay twice. With the key, the mock server returns the original result for a repeated key, which makes "Try again" always safe, the same pattern Stripe and banks use.

## Form state: local `useState`, committed to the store on "Review" — 2026-11-24
**Chose:** plain `useState` per field over `react-hook-form` or Formik.
On web, RHF is fast because it reads uncontrolled DOM inputs through refs, but React Native's `TextInput` isn't a DOM node, so RHF goes through a controlled `<Controller>` per field and most of that advantage disappears. Keeping keystrokes in local state and writing to Zustand only on "Review" means typing never re-renders anything outside the form.

## Amount input: cash-register style — 2026-11-24
**Chose:** a number pad where digits fill in from the right (`5 0 0 0` → RM 50.00), over a decimal-pad with string parsing or a custom on-screen keypad.
Each keypress is just `sen * 10 + digit`, so it maps directly onto integer sen, with no decimal parsing, no comma-vs-dot locale bugs, and no third decimal place. The trade-off is that users can't move the cursor into the middle of the number.

## Recipient: saved recipients plus account-number lookup — 2026-11-24
**Chose:** searching saved recipients, or typing an account number that a mock `lookupAccount()` resolves to the holder's name, over saved-only or free-text input.
It covers both "selection" and "input" from the brief. Showing the resolved name before sending (as DuitNow and Malaysian banking apps do) is the main anti-fraud check against typos and scams.

## Validation: Zod for shape rules, pure functions for business rules — 2026-11-24
**Chose:** a hybrid over Zod for everything or hand-written checks only.
Shape rules (positive integer amount, note ≤ 140 chars, account number format) depend only on the input, so a Zod schema gives the type, runtime check and messages in one place. Business rules (amount ≤ balance, daily limit) depend on server state the form doesn't own, so they stay as a plain `checkTransferAllowed()` function, mirroring how real systems split client validation from server-enforced rules.

## Lists: FlashList v2 — 2026-11-24
**Chose:** `@shopify/flash-list` over the built-in `FlatList`.
FlatList virtualizes by unmounting distant rows, while FlashList recycles row views the way iOS `UITableView` does, so it creates far fewer views and stays smooth through 1,000+ rows. The catch is that state inside a row survives recycling, so rows must be driven purely by props.

## History: cursor pagination, grouped by date — 2026-11-24
**Chose:** a "See all" screen that pages 20 transactions at a time with date headers, over loading all 1,000 rows at once.
Real banking APIs paginate, and it exercises the async parts the brief grades: a loading-more state, end-of-list detection, and a retry row when a page fails. Home only shows the 5 most recent transactions, so it stays fast.

## Motion and feedback: success check, error shake, haptics — 2026-11-24
**Chose:** three small, purposeful touches (a Reanimated checkmark on success, a shake on an over-balance amount or wrong PIN, and `expo-haptics` on key moments), over animating list rows too.
Each one confirms an outcome the user cares about, and the animations use Reanimated, which is already installed. I skipped list enter/exit animations because layout animations on recycled FlashList rows can misbehave, for little gain.

## Tests: services and utils, plus one Send-form flow — 2026-11-24
**Chose:** Jest (`jest-expo` preset) unit tests for `services/` and `utils/` plus one React Native Testing Library test of the Send form, over services-only or no tests.
Money math, validation, mock API failures and idempotency are where bugs cost real money, and keeping them in pure TS makes them cheap to test. One UI flow test proves the screen actually wires those rules up correctly, without snapshot-testing styles.

## Running the app: development build first, with Expo Go notes — 2026-11-24
**Chose:** a README that leads with `npx expo run:ios` / `run:android` and documents Expo Go's limits, over Expo Go only or publishing EAS builds.
Face ID doesn't work in Expo Go, so a dev build is the only way to see the main feature on iOS. In Expo Go the app shows a banner saying so, and the PIN fallback still works there.

## Styling: StyleSheet + design tokens + a few primitives — 2026-11-24
**Chose:** the built-in `StyleSheet` with tokens in `constants/theme.ts` and a few primitives (`Screen`, `AppText`, `Button`, `Card`, `AmountText`), over NativeWind or Unistyles/Tamagui.
Production fintech apps mostly win through a small in-house design system, and the engine underneath matters less. This is that pattern at take-home scale, with no build config, and it runs in Expo Go. It would grow into a shared design-system package, or move to Unistyles if strict variants became necessary.

## Platforms: iOS and Android only — 2026-11-24
**Chose:** dropping the web target (`react-native-web`, `react-dom`, `web` config) over keeping it with stubs.
Biometrics and the native modules this module depends on are iOS/Android only, so web would mean a fallback for every core feature. The brief is about a mobile banking app, and less surface area means less to maintain.

## Theme: light + dark, neutral surfaces with a violet brand color — 2026-11-24
**Chose:** two token tables picked by `useColorScheme()`, with a neutral + violet palette, over light-only or platform-native system colors.
With tokens, dark mode is mostly a second color table, and users expect it from a modern banking app. One brand color on neutral surfaces keeps red free to mean "error" or "debit" without competing.

## Transfer flow: a modal route group with its own Stack — 2026-11-24
**Chose:** `src/app/transfer/` presented as one modal (Send → Review → Success), over pushing each screen onto the root Stack.
Closing the modal throws away the whole flow, so after Success there is no "back" into Review where the same transfer could be confirmed again. With a flat stack, every exit path would need a hand-written `router.replace` guard.

## Recipient picker: an RN `<Modal>` inside the Send screen — 2026-11-24
**Chose:** a native `Modal` (an iOS `pageSheet`) over a separate picker route or an inline list.
Because the picker lives inside the Send screen, the selected recipient stays in local `useState`, which keeps the rule that the store is only written on "Review". An RN `Modal` is a separate native window rather than a `div` with a `z-index`, and it handles the Android back button through `onRequestClose`.

## Amount input: one visible, formatted `TextInput` — 2026-11-24
**Chose:** a `number-pad` `TextInput` whose value is the formatted amount (`"50.00"`), over a hidden input behind a large `Text`.
Stripping the non-digits from what the user typed gives the amount in sen directly (`"50.005"` → `50005`), so the cash-register behavior needs no state machine. A visible input also stays accessible to screen readers, at the cost of a possible brief cursor flicker on Android.

## Keyboard: built-in `KeyboardAvoidingView` — 2026-11-24
**Chose:** `KeyboardAvoidingView` with `behavior="padding"` on both platforms and the header height as its offset, over `react-native-keyboard-controller`.
This is what Expo's SDK 58 guide prescribes for Android edge-to-edge, where the window no longer resizes for the keyboard, and it runs in Expo Go. Keyboard-controller is smoother, but the guide says it needs a dev build, and one form doesn't need its extra control.

## Icons: `expo-symbols` — 2026-11-24
**Chose:** `SymbolView` from `expo-symbols` over `@expo/vector-icons` or `@react-native-vector-icons`.
`SymbolView` renders native SF Symbols on iOS and Material Symbols on Android, it's already installed, and it runs in Expo Go. Expo's icons guide says `@expo/vector-icons` "will be deprecated and is not recommended".

## Error timing: "reward early, punish late" — 2026-11-25
**Chose:** balance and limit errors shown live while typing, with "required" errors held back until the first Review tap, over validating on blur or only on submit.
Users need to know "you can't send that much" before they tap, but being scolded about a field they haven't reached yet feels hostile. Errors are derived on every render rather than stored, so fixing a field clears its message right away and can never go stale.

## Review button: always enabled — 2026-11-25
**Chose:** an enabled button that reveals errors (with an error haptic) when tapped, over disabling it until the form is valid.
A disabled button is common on web, but a screen reader just says "dimmed" without saying what's missing. Tapping it and seeing the errors explains itself to everyone.

## Transfer limits: RM 1.00 minimum and RM 10,000 per day — 2026-11-25
**Chose:** a minimum plus a daily limit (with RM 2,500 already spent in the seed data) over a separate per-transfer cap or a balance check only.
It covers the realistic failures a reviewer will try (too little, more than the balance, over the limit) without a redundant fourth rule. The balance is checked before the limit, and the seed numbers make both errors reachable: RM 8,000 hits the limit, and RM 13,000 hits the balance.

## Zod: the classic API — 2026-11-25
**Chose:** `zod` (`z.string().max(140)`) over `zod/mini` (`z.string().check(z.maxLength(140))`).
The chainable API is what reviewers recognize, and `zod/mini`'s size savings don't matter for one small schema.
