# Project State

An index of what exists. Reasoning lives in `DECISIONS.md`.

_Last updated: 2026-11-25 (slice 6: screen test, README, write-up)_

## Routes
- `/` — `src/app/index.tsx` — Home: balance via `useAccount` (skeleton / error card / stale notice), 5 recent transactions (tap to re-send), "See all" → `/history`, pull-to-refresh, "Send money" → `/transfer/send`
- `/history` — `src/app/history.tsx` — FlashList of all transactions: sticky day headers, infinite scroll (20/page), footer spinner/retry/end, pull-to-refresh, tap to re-send
- Root layout — `src/app/_layout.tsx` — `unstable_settings.anchor = 'index'` (Home under deep-linked modals), `QueryClientProvider` + `AppState` focus wiring, `Stack` in a token-fed `ThemeProvider`; `transfer` group presented as a modal
- `/transfer/*` layout — `src/app/transfer/_layout.tsx` — nested `Stack` for the transfer flow (closing it discards the flow)
- `/transfer/send` — `src/app/transfer/send.tsx` — waits for `useAccount`, then `SendForm`: recipient, cash-register amount, note (local `useState`), inline validation errors; "Review" saves the draft
- `/transfer/review` — `src/app/transfer/review.tsx` — summary, `authorizeTransfer()` (biometrics) or `PinSheet` (also via "Use app PIN instead" after a cancel/failure), then `useSendTransfer`; inline errors with Try again / Edit transfer; back locked while busy; redirects Home without a draft
- `/transfer/success` — `src/app/transfer/success.tsx` — animated receipt, Share, Done (`router.dismissTo('/')`); no back; redirects Home without a receipt

## Components
- `Screen` — `src/components/ui/screen.tsx` — screen root: themed background, padding, bottom safe area
- `AppText` — `src/components/ui/app-text.tsx` — text with `variant` (title/heading/body/label/caption) and token `color`
- `Button` — `src/components/ui/button.tsx` — `Pressable` with primary/secondary/ghost, `disabled`, `loading`
- `Card` — `src/components/ui/card.tsx` — rounded surface container
- `AmountInput` — `src/components/amount-input.tsx` — cash-register `TextInput` (`number-pad`), value in sen
- `RecipientRow` — `src/components/recipient-row.tsx` — initials avatar, name, bank + masked account, optional chevron
- `RecipientPicker` — `src/components/recipient-picker.tsx` — RN `Modal` (iOS pageSheet): search saved recipients (`useRecipients`) + `FlatList`
- `AccountLookup` — `src/components/account-lookup.tsx` — bank chips + debounced, gated name lookup + confirm card
- `Skeleton` — `src/components/ui/skeleton.tsx` — grey placeholder bar while loading
- `HeaderCloseButton` — `src/components/header-close-button.tsx` — ✕ that closes the transfer modal
- `TransactionRow` — `src/components/transaction-row.tsx` — pure history row (FlashList-safe), signed amount, optional re-send and day label
- `RecentRecipients` — `src/components/recent-recipients.tsx` — one-tap chips on Send from cached history
- `PinSheet` — `src/components/pin-sheet.tsx` — RN `Modal` with a custom 6-digit keypad, server-checked PIN, shake on wrong PIN, lockout
- `DetailRow` — `src/components/detail-row.tsx` — label/value row for the Review summary and the receipt
- `FieldError` — `src/components/field-error.tsx` — inline danger message with icon, announced to screen readers

## Hooks
- `useTheme` — `src/hooks/use-theme.ts` — returns the light/dark color tokens for the system scheme
- `useShake` — `src/hooks/use-shake.ts` — Reanimated horizontal shake: `{ style, shake }`
- `useAccount`, `useRecipients`, `useAccountLookup`, `useTransactions` (infinite), `useSendTransfer`, `useVerifyPin`, `queryKeys` — `src/hooks/queries.ts` — all TanStack Query calls (transfer: `retry: false`, invalidates account + transactions)

## Store
- `useTransferStore` — `src/store/transfer-store.ts` — Zustand: `draft` (a `TransferRequest` with idempotency key), `receipt`, `prefill`, `saveDraft`, `setReceipt`, `reset`, `startResend`

## Services & utils
- `src/utils/money.ts` — `formatSen`, `formatSenPlain`, `parseAmountInput`, `SEN_PER_RINGGIT`, `MAX_INPUT_SEN` — integer-sen money helpers
- `src/utils/recipient.ts` — `maskAccountNumber`, `getInitials`, `filterRecipients`
- `src/utils/validation.ts` — `validateTransfer`, `checkTransferAllowed`, `getRemainingDailyLimit`, `hasErrors`, `MIN_TRANSFER_SEN`, `NOTE_MAX_LENGTH` — Zod shape rules + balance/limit rules
- `src/utils/recipient.ts` (added) — `looksLikeAccountNumber`, `isAccountNumberFormat`
- `src/services/types.ts` — `Recipient`, `Account`, `Bank`, `ApiErrorCode`, `ApiError` (with `attemptsRemaining`), `ApiResult<T>`, `TransferRequest`, `TransferReceipt`, `Transaction`, `TransactionPage`
- `src/services/mock-api.ts` — `getAccount`, `getRecipients`, `lookupAccount`, `transfer`, `verifyPin`, `getTransactions` (id cursor), `DEMO_PIN` (246810), `MAX_PIN_ATTEMPTS`, `mockSettings`, `resetMockServer` — in-memory backend with latency, idempotency, server-side checks and magic-value failures
- `src/services/auth.ts` — `authorizeTransfer(promptMessage)` — Expo Go check, hardware/enrollment check, biometric-only prompt
- `src/utils/biometrics.ts` — `toAuthorizationResult`, `getPinNotice`, `AuthorizationResult`, `PinReason`
- `src/utils/transfer.ts` — `isSameTransfer`, `getTransferRecovery`
- `src/utils/date.ts` — `formatDateTime`, `formatTime`
- `src/utils/transactions.ts` — `buildHistoryRows` (rows + `stickyHeaderIndices`), `formatDayLabel`, `getRecentRecipients`
- `src/utils/money.ts` (added) — `formatSignedSen`
- `src/services/mock-history.ts` — `generateHistory` — seeded (deterministic) ~1,000 transactions over ~6 months
- `src/services/api-error.ts` — `ApiRequestError`, `unwrap`, `isApiErrorCode`, `getErrorMessage`
- `src/services/mock-data.ts` — `MOCK_ACCOUNT`, `MOCK_RECIPIENTS` (incl. 3 "Test:" failure recipients), `MOCK_ACCOUNT_HOLDER_NAMES` seed data (only `mock-api.ts` imports it)
- Tests: `*.test.ts` next to the code, plus `src/__tests__/send-flow.test.tsx` (RNTL + `renderRouter` on the real route); 90 tests; `npm test`
- `jest/reanimated-mock.js` — minimal Reanimated mock, mapped via `moduleNameMapper` (the official 4.7.1 mock throws under Jest)

## Native capabilities
- `expo-symbols` — `SymbolView` icons (SF Symbols iOS / Material Symbols Android) — dev build? n
- `expo-haptics` — error/success haptics — dev build? n
- `expo-crypto` — `randomUUID()` idempotency keys — dev build? n
- `expo-local-authentication` — Face ID / Touch ID / fingerprint prompt; config plugin sets `NSFaceIDUsageDescription` — dev build? y for iOS Face ID (Expo Go uses the PIN)

## Dependencies
- `expo` ~58.0.26, `react-native` 0.88.1, `react` 19.3.0 — platform
- `expo-router` ~58.0.32 — file-based navigation (Stack)
- `react-native-safe-area-context` ~5.11.1 — `SafeAreaView` in `Screen`
- `expo-status-bar` ~58.0.5 — status bar style follows light/dark
- `react-native-reanimated` 4.7.1 + `react-native-worklets` 0.13.0 — `useShake`, `ZoomIn` success checkmark
- `expo-symbols` ~58.0.5 — icons
- `expo-haptics` ~58.0.8 — haptic feedback
- `zod` ^4.6.7 — shape validation for the transfer form
- `@tanstack/react-query` ^5.108.4 — server state (account, recipients, lookups, transfer mutation)
- `zustand` ^5.1.0 — client state for the transfer draft and receipt
- `expo-crypto` ~58.0.8 — idempotency keys
- `expo-local-authentication` ~58.0.3 — biometric authorization
- `@shopify/flash-list` 2.3.2 — recycling list for the history
- `eslint` ^9 + `eslint-config-expo` ~58.0.4 (dev) — `npx expo lint`
- `jest` ~30.5.2 + `jest-expo` ~58.0.15 + `@types/jest` 30.0.0 + `@testing-library/react-native` ^14.1.0 (dev) — unit/component tests
- Kept from template (router peers or likely needed): `expo-constants`, `expo-font`, `expo-linking`, `expo-system-ui`, `react-native-gesture-handler`

## Theme (`src/constants/theme.ts`)
- `Colors.light` / `Colors.dark` — background, surface, border, text, textMuted, primary, primarySoft, onPrimary, success, danger, dangerSoft
- `Spacing` — xs 4, sm 8, md 16, lg 24, xl 32, xxl 48
- `Radius` — sm 8, md 12, lg 20, pill 999
- `src/constants/banks.ts` — `BANKS` reference list for account-number transfers

## Docs
- `README.md` — setup, demo data, how to trigger each error
- `WRITEUP.md` — architecture, security, UX, performance, challenges, next steps
- `DECISIONS.md` — every A-over-B decision
- `QUIZ.md` — end-of-slice quizzes (kept in repo, not linked)

## Conventions
- File names are kebab-case (`app-text.tsx`), and components are named exports (screens are default exports)
- Screens use `Screen`/`AppText`/`Button`/`Card` and token values only, never raw colors or sizes
- Targets iOS + Android only, no web; `npm run ios` / `npm run android` build a development client (`expo run:*`)
- Money is always integer sen; only `utils/money.ts` converts to ringgit text
- Tests sit next to the code as `*.test.ts`; `src/app/` holds routes only
- Form errors are derived on render from `validateTransfer`, never stored in state
- Server data comes only through `hooks/queries.ts`; UI never imports `mock-data.ts`. Zustand holds only the draft and receipt
