import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ImageLibraryOptions,
  CameraOptions,
  launchCamera,
  launchImageLibrary,
} from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  useCreateStudentMutation,
  useGetClassroomsQuery,
} from '../../api/baseApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { borderRadius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddStudent'>;

const PHOTO_OPTIONS: CameraOptions & ImageLibraryOptions = {
  mediaType: 'photo',
  cameraType: 'front',
  quality: 0.85,
  maxWidth: 800,
  maxHeight: 800,
  includeBase64: false,
  saveToPhotos: false,
};

async function requestCameraPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'SAttendance needs camera access to capture student face photos',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

async function requestGalleryPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  try {
    // Android 13+ uses READ_MEDIA_IMAGES; older uses READ_EXTERNAL_STORAGE
    const permission =
      typeof Platform.Version === 'number' && Platform.Version >= 33
        ? PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
        : PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE;

    if (!permission) return true;

    const granted = await PermissionsAndroid.request(permission, {
      title: 'Photo Permission',
      message: 'SAttendance needs access to photos for student face images',
      buttonPositive: 'Allow',
      buttonNegative: 'Deny',
    });
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return true;
  }
}

export const AddStudentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { data: classrooms = [] } = useGetClassroomsQuery();
  const [createStudent, { isLoading }] = useCreateStudentMutation();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    roll_number: '',
    admission_number: '',
    parent_name: '',
    parent_phone: '',
    address: '',
    gender: 'male',
    classroom: route.params?.classroomId?.toString() || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [facePhoto, setFacePhoto] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  const update = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const pickPhoto = async (fromCamera: boolean) => {
    if (fromCamera) {
      const ok = await requestCameraPermission();
      if (!ok) {
        Alert.alert(
          'Camera Permission',
          'Please allow camera access in Settings to capture student photos.',
        );
        return;
      }
    } else {
      const ok = await requestGalleryPermission();
      if (!ok) {
        Alert.alert(
          'Gallery Permission',
          'Please allow photo access in Settings to pick student photos.',
        );
        return;
      }
    }

    try {
      const result = fromCamera
        ? await launchCamera(PHOTO_OPTIONS)
        : await launchImageLibrary(PHOTO_OPTIONS);

      if (result.didCancel) return;

      if (result.errorCode) {
        Alert.alert(
          'Camera Error',
          result.errorMessage ||
            (result.errorCode === 'permission'
              ? 'Permission denied. Enable camera in phone Settings.'
              : 'Could not open camera/gallery.'),
        );
        return;
      }

      const asset = result.assets?.[0];
      if (!asset?.uri) {
        Alert.alert('Error', 'No photo selected. Please try again.');
        return;
      }

      setFacePhoto({
        uri: asset.uri,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || `face_${Date.now()}.jpg`,
      });
      if (errors.face_photo) {
        setErrors(prev => {
          const next = { ...prev };
          delete next.face_photo;
          return next;
        });
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to open camera/gallery');
    }
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.first_name.trim()) e.first_name = 'First name is required';
    if (!form.roll_number.trim()) e.roll_number = 'Roll number is required';
    if (!form.admission_number.trim()) {
      e.admission_number = 'Admission number is required';
    }
    if (!form.parent_phone.trim()) e.parent_phone = 'Parent phone is required';
    else if (!/^[\d+\-\s]{7,15}$/.test(form.parent_phone.trim())) {
      e.parent_phone = 'Enter a valid phone number (7–15 digits)';
    }
    if (!form.classroom) e.classroom = 'Please select a classroom';
    if (!facePhoto) e.face_photo = 'Face photo is required (1:1 square)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Check Form', 'Please fix the highlighted fields');
      return;
    }

    const fd = new FormData();
    fd.append('first_name', form.first_name.trim());
    fd.append('last_name', form.last_name.trim());
    fd.append('roll_number', form.roll_number.trim());
    fd.append('admission_number', form.admission_number.trim());
    fd.append('parent_name', form.parent_name.trim());
    fd.append('parent_phone', form.parent_phone.trim());
    fd.append('address', form.address.trim());
    fd.append('gender', form.gender);
    fd.append('classroom', form.classroom);
    fd.append('face_photo', {
      uri: facePhoto!.uri,
      type: facePhoto!.type,
      name: facePhoto!.name,
    } as any);

    try {
      const student = await createStudent(fd).unwrap();
      Alert.alert(
        'Student Registered!',
        `${student.full_name} is registered. Next time they just show their face to mark attendance.`,
        [
          {
            text: 'View Profile',
            onPress: () =>
              navigation.replace('StudentDetail', { studentId: student.id }),
          },
        ],
      );
    } catch (err: any) {
      Alert.alert('Registration Failed', getApiErrorMessage(err, 'Could not register student'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.text }]}>Register Student</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Capture a clear square (1:1) face photo for daily attendance matching
        </Text>

        <TouchableOpacity
          style={[
            styles.photoBox,
            {
              borderColor: errors.face_photo ? colors.error : colors.primary,
              backgroundColor: colors.inputBg,
            },
          ]}
          onPress={() =>
            Alert.alert('Face Photo (1:1)', 'Choose source', [
              { text: 'Camera', onPress: () => pickPhoto(true) },
              { text: 'Gallery', onPress: () => pickPhoto(false) },
              { text: 'Cancel', style: 'cancel' },
            ])
          }>
          {facePhoto ? (
            <Image source={{ uri: facePhoto.uri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>📸</Text>
              <Text style={[styles.photoText, { color: colors.primary }]}>
                Tap for 1:1 face photo
              </Text>
            </View>
          )}
        </TouchableOpacity>
        {errors.face_photo ? (
          <Text style={[styles.errorText, { color: colors.error }]}>
            {errors.face_photo}
          </Text>
        ) : null}

        <Input
          label="First Name *"
          value={form.first_name}
          onChangeText={v => update('first_name', v)}
          error={errors.first_name}
          placeholder="e.g. Rahul"
        />
        <Input
          label="Last Name"
          value={form.last_name}
          onChangeText={v => update('last_name', v)}
          placeholder="e.g. Sharma"
        />
        <Input
          label="Roll Number *"
          value={form.roll_number}
          onChangeText={v => update('roll_number', v)}
          error={errors.roll_number}
          placeholder="e.g. 12"
        />
        <Input
          label="Admission Number *"
          value={form.admission_number}
          onChangeText={v => update('admission_number', v)}
          error={errors.admission_number}
          placeholder="e.g. ADM2026001"
        />
        <Input
          label="Parent Name"
          value={form.parent_name}
          onChangeText={v => update('parent_name', v)}
        />
        <Input
          label="Parent Phone *"
          value={form.parent_phone}
          onChangeText={v => update('parent_phone', v)}
          keyboardType="phone-pad"
          error={errors.parent_phone}
          placeholder="9876543210"
        />
        <Input
          label="Address"
          value={form.address}
          onChangeText={v => update('address', v)}
          multiline
        />

        <View style={styles.classList}>
          <Text style={[styles.classLabel, { color: colors.textSecondary }]}>
            Classroom *
          </Text>
          {classrooms.length === 0 ? (
            <Text style={[styles.hint, { color: colors.warning }]}>
              No classrooms yet. Go to Dashboard and create a classroom first.
            </Text>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {classrooms.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.classChip,
                    {
                      backgroundColor:
                        form.classroom === String(c.id)
                          ? colors.primary
                          : colors.inputBg,
                      borderColor:
                        errors.classroom && !form.classroom
                          ? colors.error
                          : colors.border,
                    },
                  ]}
                  onPress={() => update('classroom', String(c.id))}>
                  <Text
                    style={{
                      color:
                        form.classroom === String(c.id) ? '#FFF' : colors.text,
                      fontWeight: '600',
                    }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
          {errors.classroom ? (
            <Text style={[styles.errorText, { color: colors.error }]}>
              {errors.classroom}
            </Text>
          ) : null}
        </View>

        <View style={styles.genderRow}>
          <Text style={[styles.classLabel, { color: colors.textSecondary }]}>
            Gender
          </Text>
          {(['male', 'female', 'other'] as const).map(g => (
            <TouchableOpacity
              key={g}
              style={[
                styles.classChip,
                {
                  backgroundColor:
                    form.gender === g ? colors.primary : colors.inputBg,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => update('gender', g)}>
              <Text
                style={{
                  color: form.gender === g ? '#FFF' : colors.text,
                  fontWeight: '600',
                  textTransform: 'capitalize',
                }}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button
          title="Register Student"
          onPress={handleSubmit}
          loading={isLoading}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, paddingBottom: spacing.xxl },
  title: { ...typography.h2 },
  subtitle: {
    ...typography.caption,
    marginBottom: spacing.lg,
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  photoBox: {
    width: 180,
    height: 180,
    alignSelf: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderStyle: 'dashed',
    overflow: 'hidden',
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { width: '100%', height: '100%', resizeMode: 'cover' },
  photoPlaceholder: { alignItems: 'center', padding: spacing.sm },
  photoEmoji: { fontSize: 40 },
  photoText: { ...typography.caption, marginTop: spacing.sm, textAlign: 'center' },
  errorText: { ...typography.small, marginBottom: spacing.md, textAlign: 'center' },
  classList: { marginBottom: spacing.md },
  classLabel: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  classChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  hint: { ...typography.caption, marginBottom: spacing.sm },
  genderRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
});
