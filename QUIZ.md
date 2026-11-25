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
