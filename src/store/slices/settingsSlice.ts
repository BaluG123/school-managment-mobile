import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ThemeMode } from '../../types';

interface SettingsState {
  themeMode: ThemeMode;
  biometricEnabled: boolean;
  profileImage: string | null;
  soundEnabled: boolean;
  hapticEnabled: boolean;
}

const initialState: SettingsState = {
  themeMode: 'system',
  biometricEnabled: false,
  profileImage: null,
  soundEnabled: true,
  hapticEnabled: true,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setThemeMode: (state, action: PayloadAction<ThemeMode>) => {
      state.themeMode = action.payload;
    },
    setBiometricEnabled: (state, action: PayloadAction<boolean>) => {
      state.biometricEnabled = action.payload;
    },
    setProfileImage: (state, action: PayloadAction<string | null>) => {
      state.profileImage = action.payload;
    },
    setSoundEnabled: (state, action: PayloadAction<boolean>) => {
      state.soundEnabled = action.payload;
    },
    setHapticEnabled: (state, action: PayloadAction<boolean>) => {
      state.hapticEnabled = action.payload;
    },
    loadSettings: (state, action: PayloadAction<Partial<SettingsState>>) => {
      return { ...state, ...action.payload };
    },
  },
});

export const {
  setThemeMode,
  setBiometricEnabled,
  setProfileImage,
  setSoundEnabled,
  setHapticEnabled,
  loadSettings,
} = settingsSlice.actions;
export default settingsSlice.reducer;
