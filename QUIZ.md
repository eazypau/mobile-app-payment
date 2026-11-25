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
