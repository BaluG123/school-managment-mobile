import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setCredentials, setLoading } from '../store/slices/authSlice';
import { loadSettings } from '../store/slices/settingsSlice';
import { getTokens, loadSettingsFromStorage } from '../services/storage';
import { useGetProfileQuery } from '../api/baseApi';
import { APP_NAME } from '../constants/config';
import { typography } from '../theme';

export const SplashScreen: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const dispatch = useAppDispatch();
  const accessToken = useAppSelector(s => s.auth.accessToken);
  const refreshToken = useAppSelector(s => s.auth.refreshToken);
  const isLoading = useAppSelector(s => s.auth.isLoading);

  useEffect(() => {
    async function init() {
      try {
        const settings = await loadSettingsFromStorage();
        dispatch(loadSettings(settings));
        const tokens = await getTokens();
        if (tokens.access && tokens.refresh) {
          dispatch(
            setCredentials({
              user: {} as any,
              accessToken: tokens.access,
              refreshToken: tokens.refresh,
            }),
          );
        } else {
          dispatch(setLoading(false));
        }
      } catch {
        dispatch(setLoading(false));
      }
    }
    init();
  }, [dispatch]);

  const { isSuccess, isError, data } = useGetProfileQuery(undefined, {
    skip: !accessToken,
  });

  useEffect(() => {
    if (!accessToken && !isLoading) {
      const t = setTimeout(onReady, 600);
      return () => clearTimeout(t);
    }
    if (isSuccess && data && accessToken) {
      dispatch(
        setCredentials({
          user: data,
          accessToken,
          refreshToken: refreshToken || '',
        }),
      );
      const t = setTimeout(onReady, 500);
      return () => clearTimeout(t);
    }
    if (isError) {
      dispatch(setLoading(false));
      const t = setTimeout(onReady, 400);
      return () => clearTimeout(t);
    }
  }, [accessToken, isLoading, isSuccess, isError, data, refreshToken, dispatch, onReady]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🎓</Text>
      <Text style={styles.title}>{APP_NAME}</Text>
      <Text style={styles.subtitle}>Smart School Attendance</Text>
      <ActivityIndicator color="#FFF" style={styles.loader} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5B21B6',
  },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { color: '#FFF', ...typography.h1, fontSize: 32 },
  subtitle: { color: 'rgba(255,255,255,0.8)', ...typography.body, marginTop: 8 },
  loader: { marginTop: 32 },
});
