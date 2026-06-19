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

JWT tokens are stored securely via `expo-secure-store` (key: `token`).

## Telemedicine (videocall) — local dev

The videocall feature uses **native WebRTC** (`react-native-webrtc`), which ships a
native module. This has consequences for how you must run and test it:

- **You cannot use Expo Go.** Expo Go does not include the `react-native-webrtc` native
  module, so the call screen will fail. You must run a **development build**:

  ```bash
  npx expo run:ios       # builds + installs a dev client on a simulator/device
  npx expo run:android
  ```

  After the first native build, `npm start` can drive the installed dev client.
  Use a physical device (or two) to actually exercise camera/mic and a real 1-to-1 call.

- **Backend signaling is single-instance.** The API keeps WebRTC rooms and join tickets
  **in memory** (`medisync-api/src/services/video-room.service.ts`). Therefore:
  - run exactly **one** API instance during videocall testing (no clustering / multiple
    replicas — peers on different instances never meet);
  - an API restart/redeploy **drops all active calls** (tickets + rooms are lost).

- **Join flow + window.** The client calls `GET /turnos/:id/video-token` (auth required)
  to get a short-lived ticket, then opens `ws(s)://<api>/ws/video?ticket=…`. The token is
  only issued for a **VIRTUAL** turno in `RESERVADO`/`CONFIRMADO` state **and** within the
  join window (from 15 min before `fechaHora` until `fechaHora + duracionMin`). Outside the
  window the endpoint returns `403 OUTSIDE_JOIN_WINDOW` — seed/reschedule a turno to "now"
  when testing.

- **ICE / TURN.** ICE defaults to **STUN-only**, which only works for peers on the same
  network. For cross-NAT calls set `CLOUDFLARE_TURN_TOKEN_ID` + `CLOUDFLARE_TURN_API_TOKEN`
  on the API (see `medisync-api/src/services/turn.service.ts`); credentials are minted
  per-call and never shipped in the app bundle.

> Note: the legacy Jitsi link is gone — virtual turnos no longer carry an external
> `linkVideollamada`; emails/calendar invites guide the user to log in to MediSync and
> join from the turno.
