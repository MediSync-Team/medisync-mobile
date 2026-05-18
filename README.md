# MediSync Mobile

Mobile app for MediSync — a multi-tenant healthcare platform connecting patients with professionals.

Built with [Expo](https://expo.dev) (React Native) for iOS and Android.

## Setup

```bash
npm install
```

## Environment

Copy `.env.example` to `.env.local` and set `EXPO_PUBLIC_API_URL` to the backend API URL.

| Variable | Default | Description |
|----------|---------|-------------|
| `EXPO_PUBLIC_API_URL` | `http://localhost:4000/api` | Backend API base URL |

## Run

```bash
npm start          # Expo dev server
npm run ios        # Open in iOS Simulator
npm run android    # Open in Android emulator
```

## Build

```bash
eas build --platform ios
eas build --platform android
eas submit --platform ios  # Submit to App Store
eas submit --platform android  # Submit to Google Play
```

## Project Structure

```
src/
├── api/           # API client and types
├── contexts/      # Auth, Theme, Language contexts
├── i18n/          # Translations (ES/EN)
├── navigation/    # Stack and tab navigators
├── screens/       # Screen components
│   ├── auth/
│   ├── patient/
│   ├── professional/
│   ├── clinic/
│   └── admin/
└── theme/         # Colors, spacing, typography
```

## API

The mobile app reuses the existing `medisync-api` backend. All endpoints follow the same contract:

```json
{
  "success": true,
  "data": { ... }
}
```

JWT tokens are stored securely via `expo-secure-store`.
