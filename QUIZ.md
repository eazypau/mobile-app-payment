# Quiz Log

End-of-slice quizzes on the code we wrote. Each question has my answer as I gave it, then the model answer. Use it to revise before the debrief.

**Verdicts:** ✅ correct · 🟡 partly right · ❌ missed

---

## Slice 0: Clean slate (themed app shell)

### 1. On web, you'd set `color` once on a parent `div`. Why doesn't that work in RN, and how does `AppText` get around it?

**My answer:** because the styling are handled individually by each components itself unlike web..?

**Verdict:** 🟡 right instinct, missing the precise rule

**Answer:** React Native has **no style inheritance between `View`s**. Only a `Text` nested inside another `Text` inherits text styles like `color` and `fontSize`, so `<View style={{ color: 'red' }}>` does nothing to the text inside it. `AppText` puts the token color directly on every `Text`, so no screen can forget it.

### 2. `Screen` applies only the `bottom` safe-area edge. What would go wrong visually if it also applied `top`? What would go wrong on an iPhone with a home indicator if `SafeAreaView` were removed entirely?

**My answer:** if applied top, it may overlapped with fixed headers. For iphone, it might went beyong and eat innto the dynamic island row

**Verdict:** 🟡 right idea, directions flipped

**Answer:**
- **Adding `top`** would *double* the inset, not overlap. The Stack header already pushes content below the notch or Dynamic Island, so the content would get an extra empty gap under the header.
- **Removing `SafeAreaView`** is a problem at the **bottom**. The home indicator is the bar at the bottom of the screen, so bottom-pinned buttons would sit under it, where the swipe-home gesture fights with taps. The Dynamic Island is at the top, which the header already handles.

### 3. `Button` blocks presses while `loading` is true. What bug in the transfer flow does that prevent? Why do we still need an idempotency key on top of it?

**My answer:** prevents user from spamming. Because it is to make sure it is secure and prevent duplicate calls

**Verdict:** 🟡 first half right, second half vague

**Answer:** Blocking presses stops a double-tap from sending **two requests at once**. The idempotency key covers a case the button can't:
1. The first request times out.
2. The button re-enables, and the user taps "Try again".
3. But the server *had* processed the first request, so without a key the user pays twice.

With the key, the server recognizes the retry as the same transfer and returns the original result. It's about correctness (exactly one transfer) more than security.

### 4. In `_layout.tsx`, why pass our tokens into React Navigation's `ThemeProvider`, instead of just styling our own screens?

**My answer:** I have no idea...

**Verdict:** ❌

**Answer:** React Navigation draws UI that we never render ourselves:
- the header bar's background
- the title text color
- the back-button tint
- the screen background that shows during push and modal animations

Without our tokens, dark mode would show our dark screens under a white header, with a white flash on every navigation. The `ThemeProvider` is how those native parts get our colors.

### 5. `CLAUDE.md` says to avoid unnecessary custom hooks, yet there's a `useTheme()`. Argue for or against keeping it.

**My answer:** keep it as it is actually for project configuration. not sure whether this is the right answer

**Verdict:** 🟡 right conclusion, weak reason

**Answer:** Keep it, because it **removes real duplication**. Every themed component (4 primitives already, with more coming) would otherwise repeat `useColorScheme()` plus the `Colors[...]` lookup. It has to be a hook rather than a plain function because it calls `useColorScheme()`, and the rules of hooks only allow that inside components or other hooks. An *unnecessary* custom hook is one that wraps a single use, or hides `useState`/`useEffect` logic that would read more clearly inline.

---

## Slice 1: Money + Send form UI

### 1. The `formatSen` tests failed under Jest even though plain Node printed `RM 12,480.50`. Why, and what could go wrong on a real phone if we'd kept `style: 'currency'`?

**My answer:** because web DOM and mobile process it differently, if kept style: currency, mobile might break

**Verdict:** 🟡 right conclusion, wrong cause (it isn't the DOM)

**Answer:** Neither environment involves the DOM. `Intl.NumberFormat` gets its output from each **JavaScript engine's ICU locale data**. Under Jest, it put a non-breaking space (`U+00A0`) between "RM" and the number, while plain Node used a regular space. I didn't pin down exactly why the Jest environment differs from Node. On a phone, Hermes has its own `Intl` implementation, backed by the platform's locale data, so it could produce yet another variant (`RM50.00`, `MYR 50.00`, a different space). The tests would pass while the phone showed something else. Building the `RM ` prefix ourselves makes the output identical everywhere.

### 2. In `RecipientPicker`, what would a user experience if `keyboardShouldPersistTaps="handled"` were removed?

**My answer:** the keyboard might end up closing when user taps out of input field

**Verdict:** 🟡 close, but missing the actual bug

**Answer:** The default (`"never"`) means **a tap while the keyboard is open only dismisses the keyboard, and never reaches what you tapped**. So after typing a search, the first tap on a recipient row just closes the keyboard, and the user has to tap a *second* time to select. With `"handled"`, a tap on a pressable row goes straight through and selects it.

### 3. Trace `parseAmountInput`. The display shows `12.34`, and the user presses backspace. What string arrives in `onChangeText`, and what's the new amount in sen? Then they type `9`: what now?

**My answer:** it will be 1.23 then after user type 9, it will be 12.39

**Verdict:** ✅ correct

**Answer:**
1. Backspace sends `"12.3"`. The digits are `"123"`, so the amount is `123` sen, and the display re-formats to `1.23`.
2. Typing `9` sends `"1.239"`. The digits are `"1239"`, so the amount is `1239` sen, and the display shows `12.39`.

### 4. Why does Expo's guide now say to use `behavior="padding"` on Android too, when older advice was iOS-only?

**My answer:** i dont know

**Verdict:** ❌

**Answer:** Android used to **resize the app window** when the keyboard opened (`adjustResize`), so content moved up on its own, and `KeyboardAvoidingView` was only needed on iOS. Modern Android apps, and all Expo apps, are **edge-to-edge**: the app draws behind the status and navigation bars, and the window no longer resizes for the keyboard. So Android now needs the same padding as iOS, or the keyboard covers the bottom of the form (our Review button).

### 5. `RecipientPicker` clears `query` on both close and select. What would the user see next time they open it if it didn't?

**My answer:** if it didnt clear, they might see previous slected values

**Verdict:** 🟡 right idea, slightly off target

**Answer:** The picker would reopen with the **old search text still typed in** and the list still filtered by it, possibly showing "No recipients match", which looks like the recipients vanished. The selected recipient itself lives in the Send screen's state, not the picker's, so it isn't the thing that leaks. The picker's `useState` survives because the `Modal` stays mounted inside the Send screen and is only hidden.

---

## Slice 2: Validation

### 1. Errors are computed on every render (`const errors = validateTransfer(...)`) instead of being kept in `useState`. What bug would storing them invite?

**My answer:** if the app didnt rerender accordingly, it may not see the latest error. Either that, if setError is forgot to be used, it will easily missed out the latest error

**Verdict:** 🟡 the second half is the real answer

**Answer:** Stored errors **go stale**. Every code path that changes an input (recipient, amount, note), and later the *account itself* (a balance refresh after a transfer), would have to remember to call `setErrors`. Any missed path leaves an outdated message on screen. Deriving them means there's one source of truth: the inputs. The errors can't disagree with what's on screen, and there's no extra render from a `setErrors` call. The first half isn't the issue, because changing an input already re-renders the screen.

### 2. Why does the shake fire from `handleAmountChange` instead of a `useEffect` that watches `limitError`? Name one behavior that would differ with the effect.

**My answer:** if using useEffect, it may only shake once and thats it...?

**Verdict:** 🟡 one real difference, unexplained

**Answer:** A shake is a reaction to a **user event**, and effects are for syncing with external systems (React's "You Might Not Need an Effect" guidance). An effect would behave differently in two ways:
- **It shakes too often.** `limitError` is a *string*. Going from the balance message to the daily-limit message changes it, so the effect fires again even though the amount was already invalid.
- **It can't shake when it should.** Tapping Review while the error is already showing doesn't change `limitError`, so the effect never re-runs. This is the "only once" you sensed.

The handler compares "was allowed" against "is allowed", so it fires exactly on the valid → invalid transition, and `handleReview` can shake on purpose.

### 3. Why does the shake offset use Reanimated's `useSharedValue` instead of `useState`? What would `useState` cost during the animation?

**My answer:** useState would trigger rerender while useShredValue doesnt

**Verdict:** ✅ correct; here's the deeper reason

**Answer:** With `useState`, every animation frame (60–120 per second) would be a `setState` → re-render → layout on the **JS thread**. If the JS thread is busy (validation, a network response), frames drop and the shake stutters. A shared value lives on the **UI thread**: `offset.set(withSequence(...))` hands the whole animation to native once, and React never re-renders while it runs. This is a core RN-vs-web difference, because on web a CSS animation is already off the main JS thread.

### 4. With a RM 12,480.50 balance and RM 7,500 left today, the user types RM 13,000, then backspaces down to RM 8,000. Which message shows at each point, and does it shake again at RM 8,000?

**My answer:** At 13000, shakes and error message showing exceed balance will display. At 8000, it will be the same as in 13000

**Verdict:** 🟡 the first half is right, and the question had a trap I didn't intend

**Answer:**
- **At RM 13,000** it shakes once and shows the **balance** message ✅. Typing `1 3 0 0 0 0 0` goes RM 1,300.00 (allowed) → RM 13,000.00 (too much), so that's one crossing.
- **My question was flawed:** with a cash-register input, **backspace divides by 10**. Backspacing from RM 13,000.00 gives RM 1,300.00 (allowed), so you can't backspace to RM 8,000. You'd clear the field and retype `8 0 0 0 0 0`, which goes RM 800.00 (allowed) → RM 8,000.00. That **shakes again**, because it's a new valid → invalid crossing.
- **The message at RM 8,000 is different:** "over your daily limit… RM 7,500.00 more today". RM 8,000 is within the balance, so the balance check passes, and the daily-limit check is what fails.
- **The edge case:** if the amount could ever jump *directly* from RM 13,000 to RM 8,000 (for example a prefill in a future "send again" feature), it would be invalid → invalid. The message would change, but there'd be **no shake**.

### 5. The note has both `maxLength={140}` on the `TextInput` *and* a Zod `.max(140)`. Is the Zod rule dead code? Argue it.

**My answer:** I would take it as a safety net instead of the dead code. Also, maxlength in Textinput might not cover edge cases like if user copy paste from somewhere else

**Verdict:** ✅ right call; the paste reason is shaky

**Answer:** It's defense in depth, not dead code. `maxLength` is a **UI convenience**, and the schema is the **rule**:
- The rule must hold for notes that *don't* come through this `TextInput`, such as a "send again" prefill from history, or the same schema reused at the API boundary.
- If someone later removes or changes `maxLength`, the rule still holds.
- Zod checks *after trimming*, which `maxLength` can't do.

On paste: I believe RN's native `maxLength` also truncates pasted text on both platforms, so paste probably isn't the gap. I haven't verified it on a device.

---

## Slice 3a: Mock API reads + server state

_Not answered at the time. Model answers recorded for later reading._

### 1. `queryClient` is created at the top level of `_layout.tsx`, outside `RootLayout`. What would break if it were `const queryClient = new QueryClient()` *inside* the component?

**My answer:** _(skipped)_

**Answer:** Every re-render of `RootLayout` would create a **brand-new, empty cache**. `RootLayout` re-renders whenever the color scheme changes, among other things. The cached balance and recipients would vanish, every screen would show skeletons again and refetch, and an in-flight request's result would land in a cache nobody reads anymore. Module scope means one client for the app's lifetime. (Inside a component, you'd need `useState(() => new QueryClient())` to keep it stable.)

### 2. When a background refresh fails, Home keeps the old balance with "Couldn't refresh" instead of showing the error card. What's the argument for that in a banking app, and what's the risk?

**My answer:** _(skipped)_

**Answer:**
- **For it:** A brief network blip shouldn't blank out the user's money. Losing the balance looks alarming ("where did my money go?"), and the last known value is still useful.
- **The risk:** **Stale money data.** The balance might have changed elsewhere, through a card payment or another device. So the stale value must be clearly labelled, which is the "Couldn't refresh" line. It must also never be trusted for decisions: the server re-checks the balance on every transfer, and client-side checks are only for UX.

### 3. In `AccountLookup`, what bug does the `isSettled` check prevent? You typed `1234567890` and TAN WEI JIE appeared, then you change the last digit to `1`.

**My answer:** _(skipped)_

**Answer:** For the 500ms debounce window after the edit, `settledNumber` is still `1234567890`, so the query (keyed by the *settled* number) still holds TAN WEI JIE. Without `isSettled`, the screen would show **TAN WEI JIE under the new number `1234567891`**. The user could tap "Send to this account" and pay a name that was never looked up for that number. That's exactly the kind of mismatch name enquiry exists to prevent. `isSettled` shows "Looking up…" until the input and the looked-up number agree.

### 4. Lookups retry network errors once but never retry "not found", and in slice 3b transfers will have retries *off*. Why the difference?

**My answer:** _(skipped)_

**Answer:** Retrying only makes sense when a retry can succeed **and** is safe:
- **"Not found"** is a definite answer. Retrying gives the same result and just wastes a paid name enquiry.
- **A network error on a lookup** might be a blip, and a lookup is a *read*, so repeating it has no side effects.
- **A transfer** is a *write* that moves money. An automatic retry after a timeout could pay twice. It's only safe with the same idempotency key, and the user should decide to retry ("Try again") with the outcome shown, not have the library do it silently.

### 5. Why does a lookup result stay cached for 5 minutes, while the account balance uses the default `staleTime` of `0`?

**My answer:** _(skipped)_

**Answer:** They change at very different rates and cost different amounts:
- **An account holder's name** for a given number practically never changes, and each name enquiry may cost the bank money. Reusing it for 5 minutes avoids repeat lookups when someone retypes the same number.
- **The balance** can change at any moment (incoming money, card payments), and showing a wrong balance is a trust problem. With `staleTime: 0`, it's always considered stale, so it refetches whenever a screen mounts or the app returns to the foreground.

---

## Slice 3b: Transfer, Review, Success

_Model answers recorded for later reading._

### 1. Review goes to Success with `router.replace('/transfer/success')`, not `router.push`. Why?

**My answer:** _(skipped)_

**Answer:** `push` would leave Review underneath Success in the stack, so back (the header button, the swipe, or Android's hardware back) would land on a Review screen for a transfer that's **already done**, with a "Confirm and send" button on it. `replace` swaps Review out, so the stack is `[Send, Success]`. Success then also hides its back button, disables the swipe, and treats Android back as Done, so the only exit is closing the whole flow.

### 2. Walk through sending to "Test: Timeout": what happens on the server and in the app, from "Confirm and send" to "Try again"?

**My answer:** _(skipped)_

**Answer:**
1. The app sends the draft with idempotency key `K`. The server checks that `K` is new, deducts the money, records the receipt under `K`, then **returns `TIMEOUT`**, as if the response got lost.
2. The app can't know whether money moved. `getTransferRecovery` says `'retry'`, the message says "we can't confirm this transfer yet… you won't be charged twice", and `onSettled` refetches the balance.
3. "Try again" resends **the same draft with the same `K`**. The server finds `K` and returns the original receipt **without deducting again**, and the app shows Success. The `TIMEOUT` test in `mock-api.test.ts` proves the balance drops exactly once.

### 3. `saveDraft` keeps the idempotency key if the draft hasn't changed. What double payment would a brand-new key on every Review tap allow?

**My answer:** _(skipped)_

**Answer:** You confirm, get a `TIMEOUT` (but the money moved), go back to Send, and tap Review again *without changing anything*. With a fresh key, the server would see a new transfer and **pay a second time**. Keeping the key for an identical draft means the server recognizes it as the same transfer. A *changed* draft (a different amount, recipient or note) really is a different transfer, so it gets a new key.

### 4. The transfer mutation invalidates the account query in `onSettled`, not just `onSuccess`. Why?

**My answer:** _(skipped)_

**Answer:** A failure can change the balance too, or reveal that the app's copy is stale:
- After a `TIMEOUT`, the money **did** move, so the balance must refresh even though the call "failed".
- `INSUFFICIENT_FUNDS` means the balance changed elsewhere, so the Send screen's live limit checks need the real number when the user taps "Edit transfer".

`onSettled` runs after both outcomes, so the cached balance is never trusted after any transfer attempt.

### 5. Why does Home reset the store when a new transfer starts, instead of a `useEffect` cleanup on Success?

**My answer:** _(skipped)_

**Answer:** Starting a new transfer is a **user event**, so the reset belongs in its handler (React's "You Might Not Need an Effect"). An unmount cleanup has timing risks. In development, React can mount, clean up and re-mount effects to surface bugs, which would run `reset()` while Success is still on screen, wiping the receipt and redirecting Home. Resetting at the start of a new flow has no such timing. Any stale draft left in memory is harmless: its idempotency key could only replay the original receipt, never pay again.

---

## Slice 4: Biometrics + PIN fallback

_Model answers recorded for later reading._

### 1. `authenticateAsync` is called with `disableDeviceFallback: true`. What would the user be able to do without it, and why is that a problem for a bank?

**My answer:** _(skipped)_

**Answer:** Without it, after failed biometric attempts the OS offers the **phone's passcode** instead, and a correct passcode returns `success: true`. Anyone who knows or shoulder-surfs the passcode (a partner, a phone thief) could then approve transfers. Banks keep a **separate app PIN** for this reason. With the flag on, the prompt's fallback button becomes our "Use PIN", which returns `user_fallback`, and the PIN is checked by *our* server, with our own lockout.

### 2. Why does `toAuthorizationResult` treat `user_cancel` as `cancelled` rather than an error?

**My answer:** _(skipped)_

**Answer:** The user backed out **on purpose**, perhaps because they spotted a mistake on the Review screen. Showing a red "authentication failed" error would scold them for being careful. So Review just stays as it was, with the button re-enabled. `system_cancel` (a phone call, or the app going to the background) and `app_cancel` get the same treatment, because nothing went wrong from the user's point of view.

### 3. The PIN attempt counter lives in `mock-api.ts` (the "server"), not in the PIN sheet's state or on the device. Why?

**My answer:** _(skipped)_

**Answer:** Anything on the device can be reset by the attacker holding it. They could kill the app (which loses component state), reinstall it, or edit app storage on a rooted phone. Then the "5 attempts" limit becomes unlimited guesses at a 6-digit PIN, which only has 1,000,000 combinations. A server-side counter survives all of that. The same reasoning is why a real server stores only a salted hash of the PIN and never the PIN itself.

### 4. Why does the PIN sheet use its own 0–9 keypad instead of a `TextInput` with `secureTextEntry` and a number pad?

**My answer:** _(skipped)_

**Answer:** A `TextInput` sends keystrokes through whatever **keyboard app** is installed. On Android, users can install third-party keyboards, and a malicious or leaky one can log what's typed, PINs included. Our own `Pressable` keypad never involves a keyboard app. As a side benefit, it looks the same on iOS and Android, and it auto-submits at 6 digits.

### 5. `authorizeTransfer()` returns a status, but the PIN sheet isn't inside it. Where does the PIN step happen, and how does that fit with "only this function changes in production"?

**My answer:** _(skipped)_

**Answer:** The PIN step needs UI, and service files can't render, so `authorizeTransfer()` returns `needs_pin` and the **Review screen** opens the `PinSheet`. The server then checks the PIN through `verifyPin`. The production upgrade still sits behind the same seam: `authorizeTransfer()` would sign a server challenge with a biometric-protected device key, instead of trusting the OS's yes/no. The PIN path is *already* server-verified, which makes it, interestingly, the more "production-shaped" of the two today.

---

## Slice 5: History, lists, quick re-send

_Model answers recorded for later reading._

### 1. FlashList *recycles* row views. What bug would appear if `TransactionRow` had `const [expanded, setExpanded] = useState(false)` and you expanded one row, then scrolled?

**My answer:** _(skipped)_

**Answer:** When the expanded row scrolls off-screen, FlashList reuses **that same component instance** to show a different transaction further down. Its state comes along, so some unrelated transaction appears expanded, and the one you actually expanded shows collapsed when you scroll back. FlatList unmounts and remounts rows instead, so it doesn't have this problem (but it's slower). The fix is to keep rows pure: per-item UI state lives in the parent, keyed by transaction id, and is passed down as props.

### 2. What does `getItemType={(row) => row.type}` buy us?

**My answer:** _(skipped)_

**Answer:** FlashList keeps a separate pool of recycled views per type. Without it, a short date-header view could be recycled into a tall transaction row, or the reverse. Every recycle would then mean rebuilding the view's structure and re-measuring its layout, which causes jank and possibly flicker. With types, headers are only reused as headers and rows only as rows, so recycling is cheap: same structure, new text.

### 3. Why is the pagination cursor "the id of the last item I have" instead of a page number or offset?

**My answer:** _(skipped)_

**Answer:** New transfers are added at the **top** of the history. Say you've loaded items 1–20 and then make a transfer, so it becomes the new #1. With offset pagination, "give me items 21–40" now starts with your old #20, a **duplicate** row. (Deletions would *skip* a row instead.) "Everything older than transaction X" doesn't depend on positions, so it stays correct. `mock-api.test.ts` has a test that inserts a transfer between two page loads to prove it.

### 4. `onEndReached` calls `fetchNextPage()` only if `hasNextPage && !isFetchingNextPage && !isFetchNextPageError`. Why each condition?

**My answer:** _(skipped)_

**Answer:** `onEndReached` can fire several times while you're near the bottom (scroll bounce, re-layout):
- `hasNextPage`: don't request past the last page (`nextCursor` is `null`).
- `!isFetchingNextPage`: don't start a second request for the same page while one is in flight.
- `!isFetchNextPageError`: after a failure, **don't silently retry in a loop** every time the list bounces. Show the "Try again" row and let the user decide.

### 5. Tapping a past transfer pre-fills Send through the store's `prefill`, not `router.push('/transfer/send?to=r1&amount=5000')`. Why, given that `prefill` is only a *suggestion*?

**My answer:** _(skipped)_

**Answer:** Expo Router routes are **deep links**. If Send read its recipient and amount from URL params, anyone could send the user a link like `mobileapppayment://transfer/send?to=<scammer>&amount=500000` that opens a ready-made transfer. It still needs Review and biometrics, but it's a social-engineering gift ("just tap confirm"). With the store, only code inside the app can pre-fill a transfer. It also keeps one consistent rule for the whole flow: transfer data never travels in URLs.

---

## Slice 6: Screen test, README, write-up

_Model answers recorded for later reading._

### 1. Why does the screen-level test render the real route with `renderRouter('src/app', { initialUrl: '/transfer/send' })` instead of rendering `<SendForm>` directly?

**My answer:** _(skipped)_

**Answer:** The real route brings along everything the screen depends on in production: the root layout's `QueryClientProvider`, the navigation context (`useHeaderHeight` throws without it), and the account loading from the mock API. Rendering the component alone would mean hand-building those providers, and the test could pass while the real wiring is broken. It also caught a real bug. Deep-linking into the modal left nothing underneath it, which led to the `unstable_settings.anchor` fix.

### 2. In RNTL 14, why must `fireEvent.press(...)` be awaited, and what went wrong when it wasn't?

**My answer:** _(skipped)_

**Answer:** In v14, `fireEvent` is asynchronous: it wraps the event in an async `act()`, so React finishes every state update and effect before the test continues. Without `await`, the next interaction started while the previous `act()` was still open ("overlapping act() calls"). One test then leaked into the next, which is why the limit test passed alone but failed alongside the other.

### 3. Reanimated's official Jest mock was broken, so we wrote our own. What's the risk of a hand-written mock, and why is it acceptable here?

**My answer:** _(skipped)_

**Answer:** **The risk:** a mock can drift from the real API. Tests would keep passing while real animations broke, or a newly used Reanimated API would be missing from the mock. **Why it's acceptable here:** the tests assert on *behavior* (which errors show, and when), not on animations. The mock covers exactly the six APIs the app uses, and an unmocked one fails loudly (`... is not a function`) rather than silently. The comment says why it exists, so it can be deleted once Reanimated's mock is fixed.

### 4. The write-up calls the biometric check "event-bound". In one sentence each, what's the attack, and what's the fix?

**My answer:** _(skipped)_

**Answer:**
- **The attack:** on a rooted or jailbroken phone, a tool like Frida hooks the app so `authenticateAsync` always returns `success: true`, and the server never knows biometrics didn't actually pass.
- **The fix:** generate a key pair in the Secure Enclave / Keystore that's unlocked only by biometrics, register the public key with the server, and have the device *sign a server-issued challenge* for each transfer. The server then verifies the signature itself, and all of this fits inside `authorizeTransfer()`.

### 5. A reviewer asks: "Why not just retry failed transfers automatically, like the history query does?" Answer them.

**My answer:** _(skipped)_

**Answer:** A history read is **safe to repeat**: fetching twice changes nothing. A transfer is a **write that moves money**, and after a timeout the app can't know whether it already went through. An automatic retry is only safe *because* of the idempotency key, and even then the user should see what happened ("we can't confirm this yet") and choose to retry, rather than have money move silently in the background. So reads retry once automatically, and transfers use `retry: false` plus an explicit "Try again" with the same key.
