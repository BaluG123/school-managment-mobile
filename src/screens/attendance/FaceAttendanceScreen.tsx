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
import {
  useGetFacePhotosQuery,
  useMatchAndMarkAttendanceMutation,
} from '../../api/baseApi';
import LivenessModule from '../../native/LivenessModule';
import { LoadingOverlay } from '../../components/EmptyState';
import { getApiErrorMessage } from '../../utils/apiError';
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

  const { data: faceData, isLoading: loadingRefs, refetch } = useGetFacePhotosQuery(
    classroomId,
  );
  const [matchAndMark] = useMatchAndMarkAttendanceMutation();

  const withPhotos = faceData?.with_photos ?? 0;
  const studentCount = faceData?.count ?? 0;

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
    if (withPhotos === 0) {
      Alert.alert(
        'No Face Photos',
        studentCount === 0
          ? 'This classroom has no students. Register students with a face photo first.'
          : 'Students exist but have no face photos. Edit each student and upload a face photo.',
      );
      return;
    }

    setStep('blink');
    setInstruction('Blink your eyes naturally...');
    const frames: string[] = [];

    for (let i = 0; i < 5; i++) {
      await new Promise<void>(resolve => setTimeout(resolve, 400));
      const path = await captureFrame();
      if (path) frames.push(path);
    }

    setStep('capturing');

    try {
      const liveness = await LivenessModule.detectBlinkFromFrames(frames);
      if (!liveness.blinkDetected) {
        Alert.alert('Liveness Check Failed', liveness.message, [
          { text: 'Try Again', onPress: () => setStep('ready') },
        ]);
        return;
      }

      setInstruction('Matching face on server...');
      setStep('matching');

      const lastFrame = frames[frames.length - 1];
      if (!lastFrame) {
        Alert.alert('Capture Failed', 'Could not capture photo. Try again.', [
          { text: 'Retry', onPress: () => setStep('ready') },
        ]);
        return;
      }

      const quality = await LivenessModule.validateFaceQuality(lastFrame);
      if (!quality.valid) {
        Alert.alert('Face Quality', quality.message, [
          { text: 'Retry', onPress: () => setStep('ready') },
        ]);
        return;
      }

      const fd = new FormData();
      fd.append('classroom_id', String(classroomId));
      fd.append('status', 'present');
      fd.append('capture_photo', {
        uri: lastFrame,
        type: 'image/jpeg',
        name: 'capture.jpg',
      } as any);

      const result = await matchAndMark(fd).unwrap();

      navigation.replace('AttendanceSuccess', {
        studentName: result.student.full_name,
        rollNumber: result.student.roll_number,
        checkInTime: result.attendance.check_in_time,
        confidence: result.confidence,
      });
    } catch (err: any) {
      Alert.alert(
        'Attendance Failed',
        getApiErrorMessage(err, 'Could not match face. Try again.'),
        [{ text: 'Retry', onPress: () => setStep('ready') }],
      );
    }
  };

  if (!device || loadingRefs) {
    return <LoadingOverlay message="Loading classroom faces..." />;
  }

  if (!hasPermission) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.permText, { color: colors.text }]}>
          Camera permission is required for face attendance
        </Text>
        <TouchableOpacity onPress={requestPermission}>
          <Text style={{ color: colors.primary, fontWeight: '700' }}>
            Grant Permission
          </Text>
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
        <Text style={styles.refCount}>
          {withPhotos} face photo{withPhotos === 1 ? '' : 's'} ready
          {studentCount > withPhotos
            ? ` (${studentCount - withPhotos} missing photo)`
            : ''}
        </Text>

        <View style={styles.faceOval} />
        <Text style={styles.instruction}>{instruction}</Text>

        {step === 'ready' && (
          <>
            <TouchableOpacity
              style={[
                styles.startBtn,
                {
                  backgroundColor:
                    withPhotos > 0 ? colors.phonePeGreen : '#64748B',
                },
              ]}
              onPress={startLivenessCheck}
              disabled={withPhotos === 0}>
              <Text style={styles.startText}>
                {withPhotos > 0 ? 'Start Face Scan' : 'No Photos to Match'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => refetch()} style={styles.refreshBtn}>
              <Text style={styles.cancelText}>Refresh face list</Text>
            </TouchableOpacity>
          </>
        )}

        {(step === 'blink' || step === 'capturing' || step === 'matching') && (
          <View style={styles.processingBox}>
            <Text style={styles.processingText}>
              {step === 'blink'
                ? '👁️ Blink now...'
                : step === 'matching'
                  ? '🔍 Matching face...'
                  : '⏳ Processing...'}
            </Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  classLabel: {
    position: 'absolute',
    top: 60,
    color: '#FFF',
    ...typography.h3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  refCount: {
    position: 'absolute',
    top: 110,
    color: '#FFF',
    ...typography.caption,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.full,
  },
  faceOval: {
    width: 260,
    height: 320,
    borderRadius: 130,
    borderWidth: 3,
    borderColor: '#00BFA5',
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  instruction: {
    color: '#FFF',
    ...typography.bodyBold,
    marginTop: spacing.lg,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  startBtn: {
    position: 'absolute',
    bottom: 120,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  startText: { color: '#FFF', ...typography.bodyBold, fontSize: 18 },
  processingBox: {
    position: 'absolute',
    bottom: 120,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  processingText: { color: '#FFF', ...typography.h3 },
  cancelBtn: { position: 'absolute', bottom: 50 },
  refreshBtn: { position: 'absolute', bottom: 175 },
  cancelText: { color: 'rgba(255,255,255,0.7)', ...typography.body },
});
