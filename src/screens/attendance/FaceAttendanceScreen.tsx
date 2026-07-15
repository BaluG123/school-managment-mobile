import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Camera,
  CommonResolutions,
  useCameraDevice,
  useCameraPermission,
  usePhotoOutput,
} from 'react-native-vision-camera';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import {
  useGetFacePhotosQuery,
  useMatchAndMarkAttendanceMutation,
} from '../../api/baseApi';
import LivenessModule from '../../native/LivenessModule';
import { getApiErrorMessage } from '../../utils/apiError';
import { RootStackParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'FaceAttendance'>;
type Step = 'align' | 'blink' | 'matching' | 'done' | 'error';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const CIRCLE = Math.min(SCREEN_W * 0.72, 300);
const MASK = Math.max(SCREEN_W, SCREEN_H);

export const FaceAttendanceScreen: React.FC<Props> = ({ navigation, route }) => {
  const { classroomId, classroomName } = route.params;
  const runningRef = useRef(false);
  const previewReadyRef = useRef(false);
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  // Fast, mid-res photo pipeline for liveness frames
  const photoOutput = usePhotoOutput({
    targetResolution: CommonResolutions.HD_4_3,
    quality: 0.7,
    qualityPrioritization: 'speed',
    containerFormat: 'jpeg',
  });

  const [step, setStep] = useState<Step>('align');
  const [statusText, setStatusText] = useState('Align your face in the circle');
  const [errorText, setErrorText] = useState('');
  const [previewReady, setPreviewReady] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  const { data: faceData, isLoading: loadingRefs } = useGetFacePhotosQuery(
    classroomId,
    { refetchOnMountOrArgChange: true },
  );
  const [matchAndMark] = useMatchAndMarkAttendanceMutation();

  const withPhotos = faceData?.with_photos ?? 0;

  useEffect(() => {
    if (!hasPermission) requestPermission();
  }, [hasPermission, requestPermission]);

  useEffect(() => {
    if (step !== 'blink') return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, {
          toValue: 0.15,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(blinkAnim, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [step, blinkAnim]);

  const captureFrame = useCallback(async (): Promise<string | null> => {
    try {
      const photo = await photoOutput.capturePhoto(
        { flashMode: 'off', enableShutterSound: false },
        {},
      );
      const path = await photo.saveToTemporaryFileAsync();
      photo.dispose();
      if (!path) return null;
      return path.startsWith('file://') ? path : `file://${path}`;
    } catch {
      return null;
    }
  }, [photoOutput]);

  const runAttendanceFlow = useCallback(async () => {
    if (runningRef.current) return;
    if (withPhotos === 0) {
      setStep('error');
      setErrorText('No face photos in this classroom. Register students first.');
      return;
    }

    runningRef.current = true;
    try {
      setStep('align');
      setStatusText('Hold still…');
      await new Promise<void>(r => setTimeout(r, 500));

      // Snapshot for server match before blink (eyes open)
      const matchSnapshot = await captureFrame();
      if (!matchSnapshot) {
        throw new Error('Camera not ready. Hold still and try again.');
      }

      setStep('blink');
      setStatusText('Blink your eyes once');

      const frames: string[] = [matchSnapshot];
      for (let i = 0; i < 7; i++) {
        await new Promise<void>(r => setTimeout(r, 280));
        const path = await captureFrame();
        if (path) frames.push(path);
      }

      if (frames.length < 4) {
        throw new Error('Could not capture face. Hold still and try again.');
      }

      let blinkOk = false;
      try {
        const liveness = await LivenessModule.detectBlinkFromFrames(frames);
        blinkOk = !!liveness.blinkDetected;
      } catch {
        blinkOk = false;
      }

      if (!blinkOk) {
        setStatusText('Blink once more…');
        const extra: string[] = [];
        for (let i = 0; i < 5; i++) {
          await new Promise<void>(r => setTimeout(r, 280));
          const path = await captureFrame();
          if (path) extra.push(path);
        }
        try {
          const again = await LivenessModule.detectBlinkFromFrames([
            ...frames.slice(-3),
            ...extra,
          ]);
          blinkOk = !!again.blinkDetected;
        } catch {
          blinkOk = false;
        }
      }

      if (!blinkOk) {
        throw new Error('Please look at the camera and blink naturally.');
      }

      setStep('matching');
      setStatusText('Liveness OK · Matching face…');

      const fd = new FormData();
      fd.append('classroom_id', String(classroomId));
      fd.append('status', 'present');
      fd.append('capture_photo', {
        uri: matchSnapshot,
        type: 'image/jpeg',
        name: 'capture.jpg',
      } as any);

      const result = await matchAndMark(fd).unwrap();
      setStep('done');
      navigation.replace('AttendanceSuccess', {
        studentName: result.student.full_name,
        rollNumber: result.student.roll_number,
        checkInTime: result.attendance.check_in_time,
        confidence: result.confidence,
      });
    } catch (err: any) {
      setStep('error');
      setErrorText(
        getApiErrorMessage(err, err?.message || 'Could not match face. Try again.'),
      );
    } finally {
      runningRef.current = false;
    }
  }, [withPhotos, captureFrame, classroomId, matchAndMark, navigation]);

  // Auto-start once camera preview + face refs are ready
  useEffect(() => {
    if (!hasPermission || loadingRefs || !device || !previewReady) return;
    if (withPhotos === 0) {
      setStep('error');
      setErrorText('No face photos ready for this classroom.');
      return;
    }
    const t = setTimeout(() => {
      runAttendanceFlow();
    }, 400);
    return () => clearTimeout(t);
  }, [
    hasPermission,
    loadingRefs,
    device,
    previewReady,
    withPhotos,
    runAttendanceFlow,
  ]);

  const circleTop = SCREEN_H * 0.2;
  const circleLeft = (SCREEN_W - CIRCLE) / 2;

  if (!device || loadingRefs) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#00BFA5" size="large" />
        <Text style={styles.loadingText}>Preparing face scan…</Text>
      </View>
    );
  }

  if (!hasPermission) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Camera permission needed</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.retryBtn}>
          <Text style={styles.retryText}>Allow Camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={step !== 'done'}
        outputs={[photoOutput]}
        onPreviewStarted={() => {
          previewReadyRef.current = true;
          setPreviewReady(true);
        }}
      />

      {/* True circular hole — thick border fills everything outside the circle */}
      <View
        pointerEvents="none"
        style={[
          styles.circleMask,
          {
            top: circleTop - MASK,
            left: circleLeft - MASK,
            width: CIRCLE + MASK * 2,
            height: CIRCLE + MASK * 2,
            borderRadius: (CIRCLE + MASK * 2) / 2,
            borderWidth: MASK,
          },
        ]}
      />

      {/* Guide ring */}
      <View
        pointerEvents="none"
        style={[
          styles.circleRing,
          {
            top: circleTop + 4,
            left: circleLeft + 4,
            width: CIRCLE - 8,
            height: CIRCLE - 8,
            borderRadius: (CIRCLE - 8) / 2,
            borderColor:
              step === 'blink'
                ? '#FBBF24'
                : step === 'matching'
                  ? '#00BFA5'
                  : step === 'error'
                    ? '#EF4444'
                    : '#FFFFFF',
          },
        ]}
      />

      <View style={styles.uiLayer} pointerEvents="box-none">
        <Text style={styles.className}>{classroomName}</Text>

        {step === 'blink' && (
          <Animated.Text
            style={[
              styles.blinkIcon,
              { top: circleTop + CIRCLE + 20, opacity: blinkAnim },
            ]}>
            👁️
          </Animated.Text>
        )}

        {step === 'matching' && (
          <ActivityIndicator
            color="#00BFA5"
            style={{ position: 'absolute', top: circleTop + CIRCLE + 28 }}
          />
        )}

        <Text style={styles.status}>{statusText}</Text>

        {step === 'error' && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorText}</Text>
            <TouchableOpacity
              style={styles.retryBtn}
              onPress={() => {
                setErrorText('');
                setStep('align');
                setStatusText('Align your face in the circle');
                runAttendanceFlow();
              }}>
              <Text style={styles.retryText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loading: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  loadingText: { color: '#FFF', ...typography.body, marginTop: spacing.md },
  circleMask: {
    position: 'absolute',
    borderColor: 'rgba(0,0,0,0.88)',
    backgroundColor: 'transparent',
  },
  circleRing: {
    position: 'absolute',
    borderWidth: 3,
    backgroundColor: 'transparent',
  },
  uiLayer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  className: {
    marginTop: spacing.xxl,
    color: 'rgba(255,255,255,0.85)',
    ...typography.bodyBold,
  },
  blinkIcon: {
    position: 'absolute',
    fontSize: 44,
    alignSelf: 'center',
  },
  status: {
    position: 'absolute',
    bottom: 120,
    color: '#FFF',
    ...typography.h3,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorBox: {
    position: 'absolute',
    bottom: 110,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  errorText: {
    color: '#FCA5A5',
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  retryBtn: {
    backgroundColor: '#00BFA5',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
  retryText: { color: '#FFF', ...typography.bodyBold },
  closeBtn: { position: 'absolute', bottom: 40 },
  closeText: { color: 'rgba(255,255,255,0.65)', ...typography.body },
});
