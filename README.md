# SAttendance Mobile App

React Native app for school headmasters to manage student attendance with face recognition and liveness detection.

## Features

- JWT authentication (signup/login)
- Biometric lock after login (toggle in Settings)
- Dark / Light / System theme
- School & classroom setup
- Student registration with face photo
- Face attendance with native liveness (blink detection)
- PhonePe-style success confirmation with sound & Lottie
- Student ID card profile view
- Daily attendance dashboard

## Setup

```bash
cd headmaster
npm install

# iOS
cd ios && bundle install && bundle exec pod install && cd ..

# Start Metro
npm start

# Run Android
npm run android

# Run iOS
npm run ios
```

## Backend Connection

Update API URL in `src/constants/config.ts`:

| Environment | Host |
|-------------|------|
| Android Emulator | `10.0.2.2:8000` |
| iOS Simulator | `localhost:8000` |
| Physical Device | Your computer's local IP |

Make sure Django backend is running:
```bash
cd ../backend && source venv/bin/activate && python manage.py runserver 0.0.0.0:8000
```

## App Flow

1. **Sign up / Login** as headmaster
2. **Biometric unlock** (optional, enable in Settings)
3. **Create school** (first-time setup)
4. **Add classrooms** via API or Django admin
5. **Register students** with face photo
6. **Daily attendance**: Select class → Face scan → Blink → Match → Done!

## Native Liveness Module

- **Android**: `LivenessModule.kt` using Google ML Kit Face Detection
- **iOS**: `LivenessModule.swift` using Apple Vision framework

Detects natural eye blink across multiple camera frames to prevent photo spoofing.

## Project Structure

```
src/
├── api/           # RTK Query API layer
├── components/    # Reusable UI components
├── constants/     # Config & API URL
├── navigation/    # React Navigation setup
├── native/        # Native module bridges
├── screens/       # All app screens
├── services/      # Biometrics, face match, storage
├── store/         # Redux Toolkit store
├── theme/         # Colors, typography, dark mode
└── types/         # TypeScript types
```
