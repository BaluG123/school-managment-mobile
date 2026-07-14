import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import { STORAGE_KEYS } from '../constants/config';

export async function saveTokens(access: string, refresh: string) {
  await Keychain.setGenericPassword('tokens', JSON.stringify({ access, refresh }));
  await AsyncStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, access);
  await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh);
}

export async function getTokens(): Promise<{
  access: string | null;
  refresh: string | null;
}> {
  try {
    const credentials = await Keychain.getGenericPassword();
    if (credentials) {
      const parsed = JSON.parse(credentials.password);
      return { access: parsed.access, refresh: parsed.refresh };
    }
  } catch {
    // fallback to async storage
  }
  const access = await AsyncStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  const refresh = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  return { access, refresh };
}

export async function clearTokens() {
  await Keychain.resetGenericPassword();
  await AsyncStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
  await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export async function loadSettingsFromStorage() {
  const biometric = await AsyncStorage.getItem(STORAGE_KEYS.BIOMETRIC_ENABLED);
  const theme = await AsyncStorage.getItem(STORAGE_KEYS.THEME_MODE);
  const profile = await AsyncStorage.getItem(STORAGE_KEYS.PROFILE_IMAGE);

  return {
    biometricEnabled: biometric === 'true',
    themeMode: (theme as 'light' | 'dark' | 'system') || 'system',
    profileImage: profile || null,
  };
}
