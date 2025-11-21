# E-Donor

E-Donor is a cross-platform Expo application that helps donors and administrators coordinate blood donations, manage requests, and stay informed through a modern mobile experience.

## Features

- **Public experience**: donor onboarding, profile management, notifications, and donation history.
- **Admin experience**: manage donors, hospitals, inventory, requests, and outbound notifications.
- **Firebase backend**: authentication powered by Firebase Auth and profile data persisted with Cloud Firestore.
- **Expo Router + TypeScript**: file-based routing with a strongly typed UI layer.

## Requirements

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- A Firebase project with Authentication and Firestore enabled

## Firebase Setup

1. Create a Firebase project and register iOS, Android, and Web apps (web registration exposes the config snippet).
2. Enable **Email/Password** in Firebase Authentication.
3. Create a **Firestore Database** (production or test mode).
4. Add the following security rule so each user controls their own profile:
   ```txt
   rules_version = '2';
   service cloud.firestore {
     match /databases/{db}/documents {
       match /profiles/{userId} {
         allow read, write: if request.auth != null && request.auth.uid == userId;
       }
     }
   }
   ```
5. Copy your Firebase config into `.env` (or use `app.json.extra.firebase`):
   ```env
   EXPO_PUBLIC_FIREBASE_API_KEY=...
   EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
   EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
   EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
   EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
   EXPO_PUBLIC_FIREBASE_APP_ID=...
   ```

## Installation

```bash
git clone <repo>
cd E-Donor
npm install
```

## Development

```bash
npx expo start
```

Use the QR code with Expo Go or launch the iOS/Android simulators directly from the CLI menu.

To clear caches:

```bash
npx expo start --clear
```

## Admin Access

- Launch the app and tap **Admin Portal**.
- Use demo credentials `admin@gmail.com / admin`.
- The admin interface is a local-only mock; hook it to Firestore/Cloud Functions when you are ready for production.

## Project Structure

- `app/` – screens and layouts (Expo Router).
- `app/contexts/` – shared React contexts (appearance, localization, user/auth).
- `app/services/` – Firestore-facing helpers.
- `components/` – reusable UI elements.
- `lib/` – Firebase client configuration.
- `assets/` – static images, icons, and fonts.

## Documentation

| File                        | Description                                   |
|-----------------------------|-----------------------------------------------|
| `ADMIN_PANEL_README.md`     | Admin-specific setup & feature overview       |
| `ADMIN_DESIGN_GUIDE.md`     | Visual reference for the admin experience     |
| `ADMIN_IMPLEMENTATION_SUMMARY.md` | Inventory of admin modules & screens    |
| `QUICK_START.md`            | Fast reference for developers/admin testers   |

## Contributing

1. Branch from `main`.
2. Run `npm run lint` before pushing.
3. Include screenshots or screen recordings when modifying UI.

## License

Internal project – contact the project maintainer before sharing externally.
