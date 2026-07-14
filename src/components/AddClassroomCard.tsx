import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Input } from './Input';
import { useCreateClassroomMutation } from '../api/baseApi';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

export const AddClassroomCard: React.FC = () => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [form, setForm] = useState({
    name: '',
    grade: '',
    section: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });
  const [createClassroom, { isLoading }] = useCreateClassroomMutation();

  const handleCreate = async () => {
    if (!form.name || !form.grade || !form.academic_year) {
      Alert.alert('Required', 'Name, grade and academic year are required');
      return;
    }
    try {
      await createClassroom({
        name: form.name,
        grade: form.grade,
        section: form.section,
        academic_year: form.academic_year,
      }).unwrap();
      Alert.alert('Success', 'Classroom created!');
      setExpanded(false);
      setForm({
        name: '',
        grade: '',
        section: '',
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      });
    } catch (err: any) {
      Alert.alert('Error', err?.data?.detail || 'Failed to create classroom');
    }
  };

  if (!expanded) {
    return (
      <Button
        title="+ Add Classroom"
        onPress={() => setExpanded(true)}
        variant="outline"
        style={styles.btn}
      />
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.text }]}>New Classroom</Text>
      <Input label="Name" value={form.name} onChangeText={v => setForm(p => ({ ...p, name: v }))} placeholder="Class 10-A" />
      <Input label="Grade" value={form.grade} onChangeText={v => setForm(p => ({ ...p, grade: v }))} placeholder="10" />
      <Input label="Section" value={form.section} onChangeText={v => setForm(p => ({ ...p, section: v }))} placeholder="A" />
      <Input label="Academic Year" value={form.academic_year} onChangeText={v => setForm(p => ({ ...p, academic_year: v }))} />
      <Button title="Create" onPress={handleCreate} loading={isLoading} />
      <Button title="Cancel" onPress={() => setExpanded(false)} variant="outline" style={{ marginTop: spacing.sm }} />
    </View>
  );
};

const styles = StyleSheet.create({
  btn: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  card: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, borderRadius: 12, borderWidth: 1 },
  title: { ...typography.h3, marginBottom: spacing.sm },
});
