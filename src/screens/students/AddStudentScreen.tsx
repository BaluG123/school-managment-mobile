import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import {
  useCreateStudentMutation,
  useGetClassroomsQuery,
} from '../../api/baseApi';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { borderRadius, spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'AddStudent'>;

export const AddStudentScreen: React.FC<Props> = ({ navigation, route }) => {
  const { colors } = useTheme();
  const { data: classrooms } = useGetClassroomsQuery();
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
  const [facePhoto, setFacePhoto] = useState<{
    uri: string;
    type: string;
    name: string;
  } | null>(null);

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const pickPhoto = async (fromCamera: boolean) => {
    const result = fromCamera
      ? await launchCamera({ mediaType: 'photo', cameraType: 'front', quality: 0.8 })
      : await launchImageLibrary({ mediaType: 'photo', quality: 0.8 });

    if (result.assets?.[0]?.uri) {
      const asset = result.assets[0];
      setFacePhoto({
        uri: asset.uri!,
        type: asset.type || 'image/jpeg',
        name: asset.fileName || 'face.jpg',
      });
    }
  };

  const handleSubmit = async () => {
    if (!form.first_name || !form.roll_number || !form.admission_number || !form.parent_phone) {
      Alert.alert('Required', 'Please fill all required fields');
      return;
    }
    if (!facePhoto) {
      Alert.alert('Face Photo Required', 'Please capture a clear front-facing photo for attendance matching');
      return;
    }

    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (v) fd.append(k, v);
    });
    if (form.classroom) fd.append('classroom', form.classroom);
    fd.append('face_photo', {
      uri: facePhoto.uri,
      type: facePhoto.type,
      name: facePhoto.name,
    } as any);

    try {
      const student = await createStudent(fd).unwrap();
      Alert.alert(
        'Student Registered! 🎉',
        `${student.full_name} is now registered. Next time they just show their face to mark attendance — takes only 3 seconds!`,
        [{ text: 'View Profile', onPress: () => {
          navigation.replace('StudentDetail', { studentId: student.id });
        }}],
      );
    } catch (err: any) {
      const msg = Object.values(err?.data || {}).flat().join('\n') || 'Registration failed';
      Alert.alert('Error', String(msg));
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Register Student</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Capture a clear face photo — this is used for daily attendance matching
        </Text>

        <TouchableOpacity
          style={[styles.photoBox, { borderColor: colors.primary, backgroundColor: colors.inputBg }]}
          onPress={() => Alert.alert('Face Photo', 'Choose source', [
            { text: 'Camera', onPress: () => pickPhoto(true) },
            { text: 'Gallery', onPress: () => pickPhoto(false) },
            { text: 'Cancel', style: 'cancel' },
          ])}>
          {facePhoto ? (
            <Image source={{ uri: facePhoto.uri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <Text style={styles.photoEmoji}>📸</Text>
              <Text style={[styles.photoText, { color: colors.primary }]}>
                Tap to capture face photo
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Input label="First Name *" value={form.first_name} onChangeText={v => update('first_name', v)} />
        <Input label="Last Name" value={form.last_name} onChangeText={v => update('last_name', v)} />
        <Input label="Roll Number *" value={form.roll_number} onChangeText={v => update('roll_number', v)} />
        <Input label="Admission Number *" value={form.admission_number} onChangeText={v => update('admission_number', v)} />
        <Input label="Parent Name" value={form.parent_name} onChangeText={v => update('parent_name', v)} />
        <Input label="Parent Phone *" value={form.parent_phone} onChangeText={v => update('parent_phone', v)} keyboardType="phone-pad" />
        <Input label="Address" value={form.address} onChangeText={v => update('address', v)} multiline />

        {classrooms && classrooms.length > 0 && (
          <View style={styles.classList}>
            <Text style={[styles.classLabel, { color: colors.textSecondary }]}>Classroom</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {classrooms.map(c => (
                <TouchableOpacity
                  key={c.id}
                  style={[
                    styles.classChip,
                    {
                      backgroundColor: form.classroom === String(c.id) ? colors.primary : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => update('classroom', String(c.id))}>
                  <Text style={{
                    color: form.classroom === String(c.id) ? '#FFF' : colors.text,
                    fontWeight: '600',
                  }}>
                    {c.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <Button title="Register Student" onPress={handleSubmit} loading={isLoading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg },
  title: { ...typography.h2 },
  subtitle: { ...typography.caption, marginBottom: spacing.lg, marginTop: spacing.xs, lineHeight: 20 },
  photoBox: { height: 180, borderRadius: borderRadius.lg, borderWidth: 2, borderStyle: 'dashed', overflow: 'hidden', marginBottom: spacing.lg, alignItems: 'center', justifyContent: 'center' },
  photo: { width: '100%', height: '100%' },
  photoPlaceholder: { alignItems: 'center' },
  photoEmoji: { fontSize: 40 },
  photoText: { ...typography.bodyBold, marginTop: spacing.sm },
  classList: { marginBottom: spacing.md },
  classLabel: { ...typography.caption, fontWeight: '600', marginBottom: spacing.sm },
  classChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: borderRadius.full, borderWidth: 1, marginRight: spacing.sm },
});
