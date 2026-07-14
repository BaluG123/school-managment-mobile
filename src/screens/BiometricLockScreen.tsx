import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setBiometricVerified } from '../store/slices/authSlice';
import {
  isBiometricAvailable,
  promptBiometric,
  createBiometricKeys,
} from '../services/biometrics';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

export const BiometricLockScreen: React.FC<{ onUnlock: () => void }> = ({
  onUnlock,
}) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const biometricEnabled = useAppSelector(s => s.settings.biometricEnabled);
  const [biometryType, setBiometryType] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!biometricEnabled) {
      dispatch(setBiometricVerified(true));
      onUnlock();
      return;
    }
    checkAndPrompt();
  }, []);

  const checkAndPrompt = async () => {
    const { available, biometryType: type } = await isBiometricAvailable();
    setBiometryType(type);
    if (!available) {
      dispatch(setBiometricVerified(true));
      onUnlock();
      return;
    }
    await createBiometricKeys();
    handleBiometric();
  };

  const handleBiometric = async () => {
    setLoading(true);
    const success = await promptBiometric(
      'Verify your identity to access SAttendance',
    );
    setLoading(false);
    if (success) {
      dispatch(setBiometricVerified(true));
      onUnlock();
    } else {
      Alert.alert('Authentication Failed', 'Please try again');
    }
  };

  if (!biometricEnabled) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={styles.icon}>
        {biometryType === 'Face ID' ? '🔐' : '👆'}
      </Text>
      <Text style={[styles.title, { color: colors.text }]}>
        {biometryType || 'Biometric'} Required
      </Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Verify your identity to continue using the app
      </Text>
      <Button
        title={`Unlock with ${biometryType || 'Biometrics'}`}
        onPress={handleBiometric}
        loading={loading}
        style={styles.button}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  icon: { fontSize: 64, marginBottom: spacing.lg },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  button: { width: '100%' },
});
