# Mobile Payment Transfer

A secure money-transfer module for a digital banking app, built with React Native, Expo (SDK 58) and TypeScript. You can send money to a saved recipient or a looked-up bank account, confirm with Face ID / Touch ID / fingerprint (with an in-app PIN fallback), and browse your full transaction history.

- **Design write-up:** [WRITEUP.md](WRITEUP.md), covering architecture, security, decisions and challenges
- **Decision log:** [DECISIONS.md](DECISIONS.md), with every "A over B" choice and why

## Running it

You'll need Node.js (I used v24) and npm.

```bash
npm install
```

### Option 1: development build (recommended, needed for Face ID)

Face ID isn't available in Expo Go on iOS, so the full experience needs a development build. This needs Xcode for iOS, or Android Studio for Android.

```bash
npm run ios       # = npx expo run:ios
npm run android   # = npx expo run:android
```

To use Face ID in the iOS Simulator:
1. Choose **Features → Face ID → Enrolled**.
2. When the prompt appears, choose **Features → Face ID → Matching Face** to pass, or **Non-matching Face** to fail.

After failed attempts, the prompt's **Use PIN** button switches to the in-app PIN.

### Option 2: Expo Go (quickest look)

```bash
npx expo start
```

Then scan the QR code with Expo Go. Everything works, except that the app skips biometrics and confirms transfers with the in-app PIN. It says so on screen.

## Demo data

The backend is a mock that runs in memory inside the app (`src/services/mock-api.ts`). It **resets every time the app reloads**.

| | |
|---|---|
| Starting balance | RM 12,480.50 |
| Daily transfer limit | RM 10,000, with RM 2,500 already spent today (RM 7,500 left) |
| Minimum transfer | RM 1.00 |
| App PIN | **`246810`**. 5 wrong attempts lock transfers until the app reloads |
| History | About 1,000 generated transactions over roughly 6 months, the same for everyone |

### Trying the error cases

| To see… | Do this |
|---|---|
| Over the daily limit (shown live) | Type `800000` (the amount fills from the right: RM 8,000.00) |
| More than the balance (shown live) | Type `1300000` (RM 13,000.00) |
| Required-field errors | Tap **Review** on an empty form |
| Network error (money not moved) | Send to **Test: Network error** |
| Timeout, then a safe retry | Send to **Test: Timeout**, then tap **Try again**. The money moves exactly once |
| Insufficient funds (balance changed elsewhere) | Send to **Test: Insufficient funds** |
| Account lookup: found | In the recipient picker, type any 10–16 digit number and pick a bank |
| Account lookup: not found | A number starting with `000` |
| Account lookup: network error | A number starting with `999` |
| Wrong PIN, then lockout | Enter any other 6 digits; the 5th wrong attempt locks |
| Balance or history fails to load | Set `simulateAccountLoadFailure` or `simulateHistoryLoadFailure` to `true` in `mockSettings` (`src/services/mock-api.ts`) |

## Checks

```bash
npm test             # Jest: 90 tests (business logic, mock API, and one screen-level flow)
npx expo lint        # ESLint
npx tsc --noEmit     # TypeScript
```

## Project structure

```
src/
  app/            Screens and navigation (Expo Router, file-based)
    transfer/     The transfer flow, presented as one modal: send → review → success
  components/     UI components; ui/ holds the design-system primitives
  hooks/          Server-state hooks (TanStack Query), theme, shake animation
  services/       Mock backend, API types and errors, biometric authorization
  store/          Client state for the in-progress transfer (Zustand)
  utils/          Pure business logic: money, validation, transfers, history
  constants/      Design tokens and the bank list
```

Business rules (money, validation, limits, idempotency) live in plain TypeScript under `services/` and `utils/`, with no React imports, and are unit-tested on their own.

## Assumptions

- **One currency:** Malaysian Ringgit (MYR). Amounts are stored as integer sen (1 RM = 100 sen) to avoid floating-point errors.
- **Mock backend:** it re-checks the balance, the daily limit and the PIN itself, as a real server would. The client's checks are only for user experience.
- **Generated history** isn't reconciled with the balance. It's there to exercise a large list.
- **Transfers are free** (fee RM 0.00) and happen instantly.
- **Platforms:** iOS and Android. The web target was removed, because biometrics are mobile-only.
- **Known gap:** Android's "Use PIN" button behavior (`user_fallback`) follows the documented API, but I haven't verified it on a device.
