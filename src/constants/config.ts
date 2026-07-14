import { Platform } from 'react-native';

// ─── PRODUCTION: PythonAnywhere deployed API ───
const PRODUCTION_API = 'https://digitalattendance.pythonanywhere.com/api';

// Set to true when testing on a real phone with deployed backend
const USE_PRODUCTION = true;

// ─── LOCAL DEV (emulator / simulator) ───
const DEV_HOST = Platform.select({
  android: '10.0.2.2',
  ios: 'localhost',
  default: 'localhost',
});
const DEV_API = `http://${DEV_HOST}:8000/api`;

export const API_BASE_URL = USE_PRODUCTION ? PRODUCTION_API : DEV_API;

export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  BIOMETRIC_ENABLED: 'biometric_enabled',
  THEME_MODE: 'theme_mode',
  PROFILE_IMAGE: 'profile_image',
  ONBOARDING_DONE: 'onboarding_done',
} as const;

export const FACE_MATCH_THRESHOLD = 70;

export const LOTTIE_SUCCESS =
  'https://assets2.lottiefiles.com/packages/lf20_jbrwo3qv.json';

export const APP_NAME = 'SAttendance';
