@AGENTS.md

# Mobile Payment Transfer — Take-Home

This is an interview take-home: a mobile payment transfer module with biometric authentication.

I'm a senior React/TypeScript **web** developer, new to React Native. The goal is code I can fully explain in a debrief, not the most code in the least time.

## How we work: 3 steps, every slice

### 1. Design and trade-offs first (no code)

- Use the `plan-with-me` skill. Don't write code until I approve the plan.
- For every architectural or library decision, give me **2–3 options** with concrete pros, cons, and why one fits a **fintech app** best (security, correctness, auditability, failure handling). A table is fine here.
- Include UI design suggestions, such as screen layout, states (empty, loading, error, success), and the interaction flow. ASCII mockups are fine.
- Once I pick an option, log it in `DECISIONS.md` (format below).

### 2. Scaffold incrementally

- **Never generate the full app at once.** Build one vertical slice at a time, for example: Form UI → Validation → Mock API → Biometrics → Transaction list.
- Within a slice, keep changes small enough to review in one sitting.
- Before calling a slice done, run `npx expo lint` and `npx tsc --noEmit` and tell me the result.

### 3. Interrogate the output

- At the end of every slice, quiz me with 3–5 questions on the code you just wrote. Cover RN-vs-web differences, why we made each decision, and edge cases.
- Wait for my answers before giving yours. Then correct me or go deeper.

## Code rules

- **Idiomatic, readable TypeScript.** No clever abstractions, no unnecessary custom hooks, no heavy boilerplate. If a plain function or inline state works, use it.
- **Separation of concerns:** business logic lives in pure TypeScript under `src/services/` and `src/utils/`. That covers balance checks, transfer validation, the mock API, and money formatting. These files must not import `react` or `react-native`, so they can be unit-tested on their own.
- UI components in `src/components/` and screens in `src/app/` call into services. They never re-implement business rules.
- **Explain RN-specific APIs.** Whenever you use one (e.g. `KeyboardAvoidingView`, `FlatList`/`FlashList`, `Pressable`, `SafeAreaView`, `StyleSheet`), add a short note in your reply on how it differs from web React. Keep it out of code comments unless it's non-obvious.

## No "magic" libraries

- State: standard React state first, then Zustand if shared state is really needed. No XState or other state-machine libraries.
- Animation: `Animated` or simple Reanimated transitions only.
- If you think a more complex library is worth it, propose it as an option in step 1 with the trade-off. Never slip it in during step 2.
- Prefer Expo modules (e.g. `expo-local-authentication`, `expo-secure-store`) over third-party ones, per `AGENTS.md`.

## DECISIONS.md

Every time we pick Option A over Option B, append an entry to `DECISIONS.md`:

```
## <Decision title> — <YYYY-MM-DD>
**Chose:** A over B (and C).
<Two sentences on why, framed for an interview debrief.>
```

This file is my cheat sheet for the debrief, so keep the reasoning crisp and honest about the trade-offs.

## Commits

- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat(transfer): add amount validation`, `fix(biometrics): handle cancelled prompt`, `docs: log state-management decision`, `chore: ...`, `test: ...`, `refactor: ...`.
- Keep commits small and atomic, one logical change each. A reviewer should be able to read `git log` like a story of the build.
- **Propose the commit message and wait for my go-ahead.** Never commit on your own.
- Work goes straight to `main`. No feature branches or PRs unless I ask.
- Only commit after lint and typecheck pass.
