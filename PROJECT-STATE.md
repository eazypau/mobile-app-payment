# Project State

An index of what exists. Reasoning lives in `DECISIONS.md`.

_Last updated: 2026-11-24 (slice 0: clean slate)_

## Routes
- `/` — `src/app/index.tsx` — Home (placeholder balance card + disabled Send button), in the root Stack
- Root layout — `src/app/_layout.tsx` — `Stack` wrapped in a `ThemeProvider` fed from our tokens

## Components
- `Screen` — `src/components/ui/screen.tsx` — screen root: themed background, padding, bottom safe area
- `AppText` — `src/components/ui/app-text.tsx` — text with `variant` (title/heading/body/label/caption) and token `color`
- `Button` — `src/components/ui/button.tsx` — `Pressable` with primary/secondary/ghost, `disabled`, `loading`
- `Card` — `src/components/ui/card.tsx` — rounded surface container

## Hooks
- `useTheme` — `src/hooks/use-theme.ts` — returns the light/dark color tokens for the system scheme

## Services & utils
- _(none yet)_

## Native capabilities
- _(none added yet)_

## Dependencies
- `expo` ~58.0.26, `react-native` 0.88.1, `react` 19.3.0 — platform
- `expo-router` ~58.0.32 — file-based navigation (Stack)
- `react-native-safe-area-context` ~5.11.1 — `SafeAreaView` in `Screen`
- `expo-status-bar` ~58.0.5 — status bar style follows light/dark
- `react-native-reanimated` 4.7.1 + `react-native-worklets` 0.13.0 — planned: success/shake animations
- `eslint` ^9 + `eslint-config-expo` ~58.0.4 (dev) — `npx expo lint`
- Template leftovers, unused so far: `@expo/ui`, `expo-constants`, `expo-device`, `expo-font`, `expo-glass-effect`, `expo-image`, `expo-linking`, `expo-symbols`, `expo-system-ui`, `expo-web-browser`, `react-native-gesture-handler`

## Theme (`src/constants/theme.ts`)
- `Colors.light` / `Colors.dark` — background, surface, border, text, textMuted, primary, primarySoft, onPrimary, success, danger, dangerSoft
- `Spacing` — xs 4, sm 8, md 16, lg 24, xl 32, xxl 48
- `Radius` — sm 8, md 12, lg 20, pill 999

## Conventions
- File names are kebab-case (`app-text.tsx`), and components are named exports (screens are default exports)
- Screens use `Screen`/`AppText`/`Button`/`Card` and token values only, never raw colors or sizes
- Targets iOS + Android only, no web
