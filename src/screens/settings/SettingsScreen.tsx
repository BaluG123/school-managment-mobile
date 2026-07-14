import React, { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary } from 'react-native-image-picker';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  setBiometricEnabled,
  setHapticEnabled,
  setProfileImage,
  setSoundEnabled,
  setThemeMode,
} from '../../store/slices/settingsSlice';
import { logout } from '../../store/slices/authSlice';
import { clearTokens } from '../../services/storage';
import { isBiometricAvailable, promptBiometric } from '../../services/biometrics';
import { useTheme } from '../../theme/ThemeContext';
import { STORAGE_KEYS } from '../../constants/config';
import { borderRadius, spacing, typography } from '../../theme';
import type { ThemeMode } from '../../types';

export const SettingsScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const dispatch = useAppDispatch();
  const settings = useAppSelector(s => s.settings);
  const user = useAppSelector(s => s.auth.user);
  const [biometryType, setBiometryType] = useState<string | null>(null);

  React.useEffect(() => {
    isBiometricAvailable().then(({ biometryType: type }) => setBiometryType(type));
  }, []);

  const toggleBiometric = async (value: boolean) => {
    if (value) {
      const success = await promptBiometric('Enable biometric lock for the app');
      if (!success) return;
    }
    dispatch(setBiometricEnabled(value));
    await AsyncStorage.setItem(STORAGE_KEYS.BIOMETRIC_ENABLED, String(value));
  };

  const setTheme = async (mode: ThemeMode) => {
    dispatch(setThemeMode(mode));
    await AsyncStorage.setItem(STORAGE_KEYS.THEME_MODE, mode);
  };

  const pickProfileImage = async () => {
    const result = await launchImageLibrary({ mediaType: 'photo', quality: 0.7 });
    if (result.assets?.[0]?.uri) {
      dispatch(setProfileImage(result.assets[0].uri));
      await AsyncStorage.setItem(STORAGE_KEYS.PROFILE_IMAGE, result.assets[0].uri);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await clearTokens();
          dispatch(logout());
        },
      },
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.profileSection}>
        <TouchableOpacity onPress={pickProfileImage}>
          {settings.profileImage ? (
            <Image source={{ uri: settings.profileImage }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>
                {user?.username?.[0]?.toUpperCase() || 'H'}
              </Text>
            </View>
          )}
          <Text style={[styles.changePhoto, { color: colors.primary }]}>Change Photo</Text>
        </TouchableOpacity>
        <Text style={[styles.username, { color: colors.text }]}>{user?.username}</Text>
        <Text style={[styles.role, { color: colors.textSecondary }]}>
          {user?.role} • {user?.school_name || 'No school'}
        </Text>
      </View>

      <SettingSection title="Appearance" colors={colors}>
        <ThemeOption label="Light" selected={settings.themeMode === 'light'} onPress={() => setTheme('light')} colors={colors} />
        <ThemeOption label="Dark" selected={settings.themeMode === 'dark'} onPress={() => setTheme('dark')} colors={colors} />
        <ThemeOption label="System" selected={settings.themeMode === 'system'} onPress={() => setTheme('system')} colors={colors} />
      </SettingSection>

      <SettingSection title="Security" colors={colors}>
        <SettingRow
          label={`${biometryType || 'Biometric'} Lock`}
          subtitle="Require biometric after login"
          colors={colors}
          right={
            <Switch
              value={settings.biometricEnabled}
              onValueChange={toggleBiometric}
              trackColor={{ true: colors.primary }}
            />
          }
        />
      </SettingSection>

      <SettingSection title="Feedback" colors={colors}>
        <SettingRow
          label="Success Sound"
          colors={colors}
          right={
            <Switch
              value={settings.soundEnabled}
              onValueChange={v => { dispatch(setSoundEnabled(v)); }}
              trackColor={{ true: colors.primary }}
            />
          }
        />
        <SettingRow
          label="Haptic Feedback"
          colors={colors}
          right={
            <Switch
              value={settings.hapticEnabled}
              onValueChange={v => { dispatch(setHapticEnabled(v)); }}
              trackColor={{ true: colors.primary }}
            />
          }
        />
      </SettingSection>

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: colors.error }]}
        onPress={handleLogout}>
        <Text style={[styles.logoutText, { color: colors.error }]}>Logout</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const SettingSection: React.FC<{ title: string; children: React.ReactNode; colors: any }> = ({
  title, children, colors,
}) => (
  <View style={styles.section}>
    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
    <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {children}
    </View>
  </View>
);

const SettingRow: React.FC<{
  label: string; subtitle?: string; right: React.ReactNode; colors: any;
}> = ({ label, subtitle, right, colors }) => (
  <View style={[styles.row, { borderBottomColor: colors.border }]}>
    <View style={{ flex: 1 }}>
      <Text style={[styles.rowLabel, { color: colors.text }]}>{label}</Text>
      {subtitle && <Text style={[styles.rowSub, { color: colors.textMuted }]}>{subtitle}</Text>}
    </View>
    {right}
  </View>
);

const ThemeOption: React.FC<{
  label: string; selected: boolean; onPress: () => void; colors: any;
}> = ({ label, selected, onPress, colors }) => (
  <TouchableOpacity
    style={[styles.themeOption, selected && { backgroundColor: colors.primary + '20', borderColor: colors.primary }]}
    onPress={onPress}>
    <Text style={[styles.themeLabel, { color: selected ? colors.primary : colors.text }]}>
      {label === 'Light' ? '☀️' : label === 'Dark' ? '🌙' : '📱'} {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: { flex: 1 },
  profileSection: { alignItems: 'center', padding: spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: '700' },
  changePhoto: { ...typography.caption, textAlign: 'center', marginTop: spacing.xs, fontWeight: '600' },
  username: { ...typography.h2, marginTop: spacing.md },
  role: { ...typography.caption, marginTop: 4 },
  section: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  sectionTitle: { ...typography.caption, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm },
  sectionCard: { borderRadius: borderRadius.lg, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth },
  rowLabel: { ...typography.body },
  rowSub: { ...typography.small, marginTop: 2 },
  themeOption: { padding: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: 'transparent', borderWidth: 2 },
  themeLabel: { ...typography.bodyBold },
  logoutBtn: { margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 2, alignItems: 'center' },
  logoutText: { ...typography.bodyBold },
});
