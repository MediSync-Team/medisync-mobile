# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Quick start
- `npm install`
- `npm start` — Expo dev server
- `npm run ios` — iOS Simulator
- `npm run android` — Android emulator

## Env
- Copy `.env.example` → `.env.local`
- `EXPO_PUBLIC_API_URL` (default: `http://localhost:4000/api`)

## Typecheck
- `npm run typecheck` (`tsc --noEmit`)
- Extends `expo/tsconfig.base`, strict mode enabled.

## Build & submit
- `eas build --platform ios`
- `eas build --platform android`
- `eas submit --platform ios|android`

## Stack
- Expo `~54.0.33`
- React Native `0.81.5`
- React `19.1.0`
- Navigation: `expo-router` (file-based, entry: `expo-router/entry`)
- Auth token storage: `expo-secure-store`
- Deep link scheme: `medisync` (configured in `app.json`)

## Project structure

Navigation is `expo-router` file-based under `app/` (there is **no** `src/navigation` or `src/screens`):

- `app/` — route tree: `_layout.tsx` (root), `index.tsx`, `video-call.tsx`, `video-call-waiting.tsx`
- `app/(auth)/` — `login`, `register`, `forgot-password`
- `app/(app)/` — authenticated screens: `dashboard`, `turno/`, `profesional/`, `pago/`, `preconsulta/`, `notifications/`; the patient/professional/clinic/admin role decides which dashboard renders

Shared (non-route) code lives in `src/`:

- `src/api/` — client + endpoints (mirrors web API surface)
- `src/components/` — shared UI
- `src/contexts/` — Auth, Theme, Language
- `src/hooks/` — shared hooks
- `src/i18n/` — translations (ES/EN)
- `src/lib/` — helpers
- `src/theme/` — colors, spacing, typography
