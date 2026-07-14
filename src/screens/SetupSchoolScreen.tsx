import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useCreateSchoolMutation } from '../api/baseApi';
import { useTheme } from '../theme/ThemeContext';
import { spacing, typography } from '../theme';

export const SetupSchoolScreen: React.FC<{ onComplete: () => void }> = ({
  onComplete,
}) => {
  const { colors } = useTheme();
  const [form, setForm] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
  });
  const [createSchool, { isLoading }] = useCreateSchoolMutation();

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const handleCreate = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      Alert.alert('Required', 'School name and phone are required');
      return;
    }
    try {
      await createSchool(form).unwrap();
      Alert.alert('Success', 'School created successfully!', [
        { text: 'Continue', onPress: onComplete },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.detail || 'Failed to create school');
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>🏫</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Set Up Your School
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Add your school details to get started with digital attendance
        </Text>

        <Input label="School Name *" value={form.name} onChangeText={v => update('name', v)} placeholder="e.g. Green Valley School" />
        <Input label="Phone *" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
        <Input label="Email" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Address" value={form.address} onChangeText={v => update('address', v)} multiline />
        <Input label="City" value={form.city} onChangeText={v => update('city', v)} />
        <Input label="State" value={form.state} onChangeText={v => update('state', v)} />
        <Input label="Pincode" value={form.pincode} onChangeText={v => update('pincode', v)} keyboardType="number-pad" maxLength={6} />

        <Button title="Create School" onPress={handleCreate} loading={isLoading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: spacing.sm },
  title: { ...typography.h2, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', marginBottom: spacing.xl, marginTop: spacing.sm },
});
