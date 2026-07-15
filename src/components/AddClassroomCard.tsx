import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from './Button';
import { Input } from './Input';
import { useCreateClassroomMutation } from '../api/baseApi';
import { getApiErrorMessage } from '../utils/apiError';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

export const AddClassroomCard: React.FC = () => {
  const { colors } = useTheme();
  const [expanded, setExpanded] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: '',
    grade: '',
    section: '',
    academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
  });
  const [createClassroom, { isLoading }] = useCreateClassroomMutation();

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

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Classroom name is required';
    if (!form.grade.trim()) e.grade = 'Grade is required';
    if (!form.academic_year.trim()) {
      e.academic_year = 'Academic year is required';
    } else if (!/^\d{4}-\d{4}$/.test(form.academic_year.trim())) {
      e.academic_year = 'Use format YYYY-YYYY (e.g. 2025-2026)';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    if (!validate()) {
      Alert.alert('Check Form', 'Please fix the highlighted fields');
      return;
    }
    try {
      await createClassroom({
        name: form.name.trim(),
        grade: form.grade.trim(),
        section: form.section.trim(),
        academic_year: form.academic_year.trim(),
      }).unwrap();
      Alert.alert('Success', 'Classroom created!');
      setExpanded(false);
      setErrors({});
      setForm({
        name: '',
        grade: '',
        section: '',
        academic_year: `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
      });
    } catch (err: any) {
      Alert.alert(
        'Failed',
        getApiErrorMessage(err, 'Failed to create classroom'),
      );
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
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}>
      <Text style={[styles.title, { color: colors.text }]}>New Classroom</Text>
      <Input
        label="Name *"
        value={form.name}
        onChangeText={v => update('name', v)}
        placeholder="Class 10-A"
        error={errors.name}
      />
      <Input
        label="Grade *"
        value={form.grade}
        onChangeText={v => update('grade', v)}
        placeholder="10"
        error={errors.grade}
      />
      <Input
        label="Section"
        value={form.section}
        onChangeText={v => update('section', v)}
        placeholder="A"
      />
      <Input
        label="Academic Year *"
        value={form.academic_year}
        onChangeText={v => update('academic_year', v)}
        placeholder="2025-2026"
        error={errors.academic_year}
      />
      <Button title="Create" onPress={handleCreate} loading={isLoading} />
      <Button
        title="Cancel"
        onPress={() => {
          setExpanded(false);
          setErrors({});
        }}
        variant="outline"
        style={{ marginTop: spacing.sm }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  btn: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  card: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
  },
  title: { ...typography.h3, marginBottom: spacing.sm },
});
