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
import { useLoginMutation } from '../../api/baseApi';
import { useAppDispatch } from '../../store/hooks';
import { setCredentials } from '../../store/slices/authSlice';
import { saveTokens } from '../../services/storage';
import { useTheme } from '../../theme/ThemeContext';
import { AuthStackParamList } from '../../types';
import { APP_NAME, API_BASE_URL } from '../../constants/config';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const { colors } = useTheme();
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [login, { isLoading }] = useLoginMutation();

  const validate = () => {
    const e: Record<string, string> = {};
    if (!username.trim()) e.username = 'Username is required';
    if (!password) e.password = 'Password is required';
    else if (password.length < 6) e.password = 'Minimum 6 characters';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    try {
      const result = await login({ username: username.trim(), password }).unwrap();
      await saveTokens(result.access, result.refresh);

      const profileRes = await fetch(`${API_BASE_URL}/auth/profile/`, {
        headers: { Authorization: `Bearer ${result.access}` },
      });
      const user = await profileRes.json();

      dispatch(
        setCredentials({
          user,
          accessToken: result.access,
          refreshToken: result.refresh,
        }),
      );
    } catch (err: any) {
      Alert.alert(
        'Login Failed',
        err?.data?.detail || 'Invalid username or password',
      );
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled">
        <Text style={styles.emoji}>🎓</Text>
        <Text style={[styles.title, { color: colors.text }]}>{APP_NAME}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to manage your school attendance
        </Text>

        <View style={styles.form}>
          <Input
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            error={errors.username}
            placeholder="Enter your username"
          />
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            error={errors.password}
            placeholder="Enter your password"
          />
          <Button title="Sign In" onPress={handleLogin} loading={isLoading} />
        </View>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={[styles.link, { color: colors.primary }]}>
            Don't have an account? Sign Up
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  emoji: { fontSize: 48, textAlign: 'center', marginBottom: spacing.sm },
  title: { ...typography.h1, textAlign: 'center' },
  subtitle: { ...typography.body, textAlign: 'center', marginTop: spacing.sm, marginBottom: spacing.xl },
  form: { marginBottom: spacing.lg },
  link: { ...typography.body, textAlign: 'center', fontWeight: '600' },
});
