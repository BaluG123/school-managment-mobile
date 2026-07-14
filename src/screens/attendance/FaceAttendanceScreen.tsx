import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetFacePhotosQuery, useMarkAttendanceMutation } from '../../api/baseApi';
import LivenessModule from '../../native/LivenessModule';
import { matchFaceWithReferences, validateCapturedFace } from '../../services/faceMatch';
import { LoadingOverlay } from '../../components/EmptyState';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { borderRadius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FaceAttendance'>;
type Step = 'ready' | 'blink' | 'capturing' | 'matching' | 'done';

export const FaceAttendanceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { classroomId, classroomName } = route.params;
  const { colors } = useTheme();
  const cameraRef = useRef<any>(null);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  const [step, setStep] = useState<Step>('ready');
  const [instruction, setInstruction] = useState('Position your face in the oval');
  const [framePaths, setFramePaths] = useState<string[]>([]);

  const { data: references, isLoading: loadingRefs } = useGetFacePhotosQuery(classroomId);
  const [markAttendance] = useMarkAttendanceMutation();

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  const captureFrame = useCallback(async (): Promise<string | null> => {
    try {
      const photo = await cameraRef.current?.takePhoto({ flash: 'off' });
      return photo?.path ? `file://${photo.path}` : null;
    } catch {
      return null;
    }
  }, []);

  const startLivenessCheck = async () => {
    setStep('blink');
    setInstruction('Blink your eyes naturally...');
    const frames: string[] = [];

    for (let i = 0; i < 5; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, 400));
      const path = await captureFrame();
      if (path) frames.push(path);
    }

    setFramePaths(frames);
    setStep('capturing');

    try {
      const liveness = await LivenessModule.detectBlinkFromFrames(frames);
      if (!liveness.blinkDetected) {
        Alert.alert('Liveness Check Failed', liveness.message, [
          { text: 'Try Again', onPress: () => setStep('ready') },
        ]);
        return;
      }

      setInstruction('Verifying identity...');
      setStep('matching');

      const lastFrame = frames[frames.length - 1];
      const quality = await LivenessModule.validateFaceQuality(lastFrame);
      if (!quality.valid) {
        Alert.alert('Face Quality', quality.message, [
          { text: 'Retry', onPress: () => setStep('ready') },
        ]);
        return;
      }

      const faceCheck = await validateCapturedFace(lastFrame);
      if (!faceCheck.valid) {
        Alert.alert('Face Error', faceCheck.message, [
          { text: 'Retry', onPress: () => setStep('ready') },
        ]);
        return;
      }

      const match = await matchFaceWithReferences(
        lastFrame,
        references || [],
      );

      if (!match.matched || !match.studentId) {
        Alert.alert(
          'No Match Found',
          `Could not match face (confidence: ${match.confidence}%). Make sure the student is registered in this class.`,
          [{ text: 'Try Again', onPress: () => setStep('ready') }],
        );
        return;
      }

      const fd = new FormData();
      fd.append('student_id', String(match.studentId));
      fd.append('status', 'present');
      fd.append('face_match_confidence', String(match.confidence));
      fd.append('capture_photo', {
        uri: lastFrame,
        type: 'image/jpeg',
        name: 'capture.jpg',
      } as any);

      const result = await markAttendance(fd).unwrap();
      const checkInTime = result.attendance.check_in_time;

      navigation.replace('AttendanceSuccess', {
        studentName: match.studentName!,
        rollNumber: match.rollNumber!,
        checkInTime,
        confidence: match.confidence,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.data?.detail || err?.message || 'Attendance failed', [
        { text: 'Retry', onPress: () => setStep('ready') },
      ]);
    }
  };

  if (!device || loadingRefs) {
    return <LoadingOverlay message="Preparing camera..." />;
  }

  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permText, { color: colors.text }]}>
          Camera permission is required for face attendance
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={step !== 'done'}
      />

      <View style={styles.overlay}>
        <Text style={styles.classLabel}>{classroomName}</Text>
        <View style={styles.faceOval} />
        <Text style={styles.instruction}>{instruction}</Text>

        {step === 'ready' && (
          <TouchableOpacity style={[styles.startBtn, { backgroundColor: colors.phonePeGreen }]} onPress={startLivenessCheck}>
            <Text style={styles.startText}>Start Face Scan</Text>
          </TouchableOpacity>
        )}

        {(step === 'blink' || step === 'capturing' || step === 'matching') && (
          <View style={styles.processingBox}>
            <Text style={styles.processingText}>
              {step === 'blink' ? '👁️ Blink now...' : step === 'matching' ? '🔍 Matching face...' : '⏳ Processing...'}
            </Text>
          </View>
        )}

        <TouchableOpacity style={styles.cancelBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  permText: { ...typography.body, textAlign: 'center', marginBottom: spacing.md },
  overlay: { ...StyleSheet.absoluteFill, alignItems: 'center', justifyContent: 'center' },
  classLabel: { position: 'absolute', top: 60, color: '#FFF', ...typography.h3, backgroundColor: 'rgba(0,0,0,0.5)', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full },
  faceOval: { width: 260, height: 320, borderRadius: 130, borderWidth: 3, borderColor: '#00BFA5', borderStyle: 'dashed', backgroundColor: 'transparent' },
  instruction: { color: '#FFF', ...typography.bodyBold, marginTop: spacing.lg, textAlign: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: borderRadius.md },
  startBtn: { position: 'absolute', bottom: 120, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full },
  startText: { color: '#FFF', ...typography.bodyBold, fontSize: 18 },
  processingBox: { position: 'absolute', bottom: 120, backgroundColor: 'rgba(0,0,0,0.7)', padding: spacing.lg, borderRadius: borderRadius.lg },
  processingText: { color: '#FFF', ...typography.h3 },
  cancelBtn: { position: 'absolute', bottom: 50 },
  cancelText: { color: 'rgba(255,255,255,0.7)', ...typography.body },
});
