# Project State

An index of what exists. Reasoning lives in `DECISIONS.md`.

_Last updated: 2026-11-25 (slice 3a: mock API reads + server state)_

## Routes
- `/` — `src/app/index.tsx` — Home: balance via `useAccount` (skeleton / error card / stale notice), pull-to-refresh, "Send money" → `/transfer/send`
- Root layout — `src/app/_layout.tsx` — `QueryClientProvider` + `AppState` focus wiring, `Stack` in a token-fed `ThemeProvider`; `transfer` group presented as a modal
- `/transfer/*` layout — `src/app/transfer/_layout.tsx` — nested `Stack` for the transfer flow (closing it discards the flow)
- `/transfer/send` — `src/app/transfer/send.tsx` — waits for `useAccount`, then `SendForm`: recipient, cash-register amount, note (local `useState`), inline validation errors

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
- `FieldError` — `src/components/field-error.tsx` — inline danger message with icon, announced to screen readers

## Hooks
- `useTheme` — `src/hooks/use-theme.ts` — returns the light/dark color tokens for the system scheme
- `useShake` — `src/hooks/use-shake.ts` — Reanimated horizontal shake: `{ style, shake }`
- `useAccount`, `useRecipients`, `useAccountLookup`, `queryKeys` — `src/hooks/queries.ts` — all TanStack Query reads

## Services & utils
- `src/utils/money.ts` — `formatSen`, `formatSenPlain`, `parseAmountInput`, `SEN_PER_RINGGIT`, `MAX_INPUT_SEN` — integer-sen money helpers
- `src/utils/recipient.ts` — `maskAccountNumber`, `getInitials`, `filterRecipients`
- `src/utils/validation.ts` — `validateTransfer`, `checkTransferAllowed`, `getRemainingDailyLimit`, `hasErrors`, `MIN_TRANSFER_SEN`, `NOTE_MAX_LENGTH` — Zod shape rules + balance/limit rules
- `src/utils/recipient.ts` (added) — `looksLikeAccountNumber`, `isAccountNumberFormat`
- `src/services/types.ts` — `Recipient`, `Account`, `Bank`, `ApiErrorCode`, `ApiResult<T>`
- `src/services/mock-api.ts` — `getAccount`, `getRecipients`, `lookupAccount`, `mockSettings` — in-memory backend with latency + magic-value failures
- `src/services/api-error.ts` — `ApiRequestError`, `unwrap`, `isApiErrorCode`, `getErrorMessage`
- `src/services/mock-data.ts` — `MOCK_ACCOUNT`, `MOCK_RECIPIENTS`, `MOCK_ACCOUNT_HOLDER_NAMES` seed data (only `mock-api.ts` imports it)
- Tests: `src/utils/*.test.ts` (Jest, `jest-expo` preset; `npm test`)

## Native capabilities
- `expo-symbols` — `SymbolView` icons (SF Symbols iOS / Material Symbols Android) — dev build? n
- `expo-haptics` — error haptic on invalid amount / Review — dev build? n

## Dependencies
- `expo` ~58.0.26, `react-native` 0.88.1, `react` 19.3.0 — platform
- `expo-router` ~58.0.32 — file-based navigation (Stack)
- `react-native-safe-area-context` ~5.11.1 — `SafeAreaView` in `Screen`
- `expo-status-bar` ~58.0.5 — status bar style follows light/dark
- `react-native-reanimated` 4.7.1 + `react-native-worklets` 0.13.0 — `useShake`; planned: success check animation
- `expo-symbols` ~58.0.5 — icons
- `expo-haptics` ~58.0.8 — haptic feedback
- `zod` ^4.6.7 — shape validation for the transfer form
- `@tanstack/react-query` ^5.108.4 — server state (account, recipients, lookups)
- `eslint` ^9 + `eslint-config-expo` ~58.0.4 (dev) — `npx expo lint`
- `jest` ~30.5.2 + `jest-expo` ~58.0.15 + `@types/jest` 30.0.0 + `@testing-library/react-native` ^14.1.0 (dev) — unit/component tests
- Kept from template (router peers or likely needed): `expo-constants`, `expo-font`, `expo-linking`, `expo-system-ui`, `react-native-gesture-handler`

## Theme (`src/constants/theme.ts`)
- `Colors.light` / `Colors.dark` — background, surface, border, text, textMuted, primary, primarySoft, onPrimary, success, danger, dangerSoft
- `Spacing` — xs 4, sm 8, md 16, lg 24, xl 32, xxl 48
- `Radius` — sm 8, md 12, lg 20, pill 999
- `src/constants/banks.ts` — `BANKS` reference list for account-number transfers

## Conventions
- File names are kebab-case (`app-text.tsx`), and components are named exports (screens are default exports)
- Screens use `Screen`/`AppText`/`Button`/`Card` and token values only, never raw colors or sizes
- Targets iOS + Android only, no web
- Money is always integer sen; only `utils/money.ts` converts to ringgit text
- Tests sit next to the code as `*.test.ts`; `src/app/` holds routes only
- Form errors are derived on render from `validateTransfer`, never stored in state
- Server data comes only through `hooks/queries.ts`; UI never imports `mock-data.ts`. Zustand is reserved for the draft (slice 3b)
