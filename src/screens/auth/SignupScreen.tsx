import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { useSignupMutation } from '../../api/baseApi';
import { getApiErrorMessage } from '../../utils/apiError';
import { useTheme } from '../../theme/ThemeContext';
import { AuthStackParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Signup'>;

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const [form, setForm] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirm: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [signup, { isLoading }] = useSignupMutation();

  const update = (key: string, value: string) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.username.trim()) e.username = 'Required';
    if (!form.password) e.password = 'Required';
    else if (form.password.length < 6) e.password = 'Min 6 characters';
    if (form.password !== form.password_confirm)
      e.password_confirm = 'Passwords do not match';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    try {
      await signup({
        username: form.username.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        password_confirm: form.password_confirm,
        role: 'headmaster',
      }).unwrap();
      Alert.alert('Success', 'Account created! Please sign in.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch (err: any) {
      Alert.alert('Signup Failed', getApiErrorMessage(err, 'Signup failed'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Register as headmaster or school staff
        </Text>

        <Input label="Username" value={form.username} onChangeText={v => update('username', v)} error={errors.username} autoCapitalize="none" />
        <Input label="Email" value={form.email} onChangeText={v => update('email', v)} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone" value={form.phone} onChangeText={v => update('phone', v)} keyboardType="phone-pad" />
        <Input label="Password" value={form.password} onChangeText={v => update('password', v)} secureTextEntry error={errors.password} />
        <Input label="Confirm Password" value={form.password_confirm} onChangeText={v => update('password_confirm', v)} secureTextEntry error={errors.password_confirm} />

        <Button title="Sign Up" onPress={handleSignup} loading={isLoading} />
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Already have an account? Sign In
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { ...typography.h2 },
  subtitle: { ...typography.body, marginBottom: spacing.lg, marginTop: spacing.xs },
  link: { ...typography.body, textAlign: 'center', marginTop: spacing.md, fontWeight: '600' },
});
