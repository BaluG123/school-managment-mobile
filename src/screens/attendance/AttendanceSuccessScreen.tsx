import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import LinearGradient from 'react-native-linear-gradient';
import { Button } from '../../components/Button';
import { celebrateAttendance } from '../../services/feedback';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../theme/ThemeContext';
import { LOTTIE_SUCCESS } from '../../constants/config';
import { RootStackParamList } from '../../types';
import { borderRadius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AttendanceSuccess'>;

export const AttendanceSuccessScreen: React.FC<Props> = ({ navigation, route }) => {
  const { studentName, rollNumber, checkInTime, confidence } = route.params;
  const { colors } = useTheme();
  const soundEnabled = useAppSelector(s => s.settings.soundEnabled);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (soundEnabled) celebrateAttendance();

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const time = format(new Date(checkInTime), 'hh:mm a');
  const date = format(new Date(checkInTime), 'dd MMM yyyy');

  return (
    <LinearGradient
      colors={[colors.phonePeGreen, colors.phonePeGreenDark]}
      style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.checkCircle}>
          <LottieView
            source={{ uri: LOTTIE_SUCCESS }}
            autoPlay
            loop={false}
            style={styles.lottie}
          />
        </View>

        <Text style={styles.successTitle}>Attendance Marked!</Text>
        <Text style={styles.successSub}>You're all set for today</Text>

        <View style={styles.card}>
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Student</Text>
            <Text style={styles.cardValue}>{studentName}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Roll Number</Text>
            <Text style={styles.cardValue}>{rollNumber}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Time</Text>
            <Text style={styles.cardValue}>{time}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Date</Text>
            <Text style={styles.cardValue}>{date}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.cardRow}>
            <Text style={styles.cardLabel}>Match Confidence</Text>
            <Text style={[styles.cardValue, styles.confidence]}>{confidence}%</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          ✅ Done! Come back tomorrow — just show your face, no forms needed.
        </Text>

        <Button
          title="Mark Next Student"
          onPress={() => navigation.pop(2)}
          variant="outline"
          style={styles.btn}
        />
        <Button
          title="Go to Dashboard"
          onPress={() => navigation.popToTop()}
          style={styles.btn}
        />
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  checkCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg },
  lottie: { width: 100, height: 100 },
  successTitle: { color: '#FFF', fontSize: 28, fontWeight: '800', marginBottom: spacing.xs },
  successSub: { color: 'rgba(255,255,255,0.85)', ...typography.body, marginBottom: spacing.xl },
  card: { backgroundColor: '#FFF', borderRadius: borderRadius.xl, padding: spacing.lg, width: '100%', marginBottom: spacing.lg },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
  cardLabel: { ...typography.body, color: '#64748B' },
  cardValue: { ...typography.bodyBold, color: '#0F172A' },
  confidence: { color: '#00BFA5' },
  divider: { height: 1, backgroundColor: '#F1F5F9' },
  hint: { color: 'rgba(255,255,255,0.9)', ...typography.caption, textAlign: 'center', marginBottom: spacing.lg, lineHeight: 20 },
  btn: { width: '100%', marginBottom: spacing.sm },
});
