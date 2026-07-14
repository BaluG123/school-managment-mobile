import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../theme/ThemeContext';
import { LOTTIE_SUCCESS } from '../constants/config';
import { borderRadius, spacing, typography } from '../theme';

interface EmptyStateProps {
  title: string;
  message: string;
  icon?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  message,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.emoji]}>📋</Text>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textSecondary }]}>
        {message}
      </Text>
    </View>
  );
};

export const LoadingOverlay: React.FC<{ message?: string }> = ({
  message = 'Please wait...',
}) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.overlay, { backgroundColor: colors.overlay }]}>
      <View style={[styles.loadingBox, { backgroundColor: colors.surface }]}>
        <LottieView
          source={{ uri: 'https://assets5.lottiefiles.com/packages/lf20_usmfx6bp.json' }}
          autoPlay
          loop
          style={styles.lottie}
        />
        <Text style={[styles.loadingText, { color: colors.text }]}>
          {message}
        </Text>
      </View>
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
  emoji: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 22,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingBox: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    minWidth: 200,
  },
  lottie: {
    width: 80,
    height: 80,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.sm,
  },
});
