import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetStudentsQuery } from '../../api/baseApi';
import { EmptyState } from '../../components/EmptyState';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { borderRadius, spacing, typography } from '../../theme';

export const StudentsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');

  // One fast fetch — search is filtered locally (no API hang on every keypress)
  const { data, isLoading, isFetching, refetch } = useGetStudentsQuery(
    { is_active: true },
    { refetchOnMountOrArgChange: false },
  );

  const students = useMemo(() => {
    const all = Array.isArray(data) ? data : data?.results || [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      s =>
        s.full_name?.toLowerCase().includes(q) ||
        s.roll_number?.toLowerCase().includes(q) ||
        s.admission_number?.toLowerCase().includes(q),
    );
  }, [data, search]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchRow}>
        <TextInput
          style={[
            styles.search,
            {
              backgroundColor: colors.inputBg,
              color: colors.text,
              borderColor: colors.border,
            },
          ]}
          placeholder="Search name or roll…"
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          autoCorrect={false}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddStudent', {})}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.primary} />
          <Text style={{ color: colors.textSecondary, marginTop: 8 }}>
            Loading students…
          </Text>
        </View>
      ) : students.length === 0 ? (
        <EmptyState
          title={search ? 'No matches' : 'No Students Yet'}
          message={
            search
              ? 'Try a different name or roll number'
              : 'Register students with their face photo.'
          }
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews
          onRefresh={refetch}
          refreshing={isFetching && !isLoading}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
              ]}
              onPress={() =>
                navigation.navigate('StudentDetail', { studentId: item.id })
              }>
              {item.face_photo ? (
                <Image
                  source={{ uri: item.face_photo }}
                  style={styles.avatar}
                  // faster first paint
                  defaultSource={undefined}
                />
              ) : (
                <View
                  style={[
                    styles.avatar,
                    styles.avatarPlaceholder,
                    { backgroundColor: colors.primary },
                  ]}>
                  <Text style={styles.initials}>
                    {item.full_name
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .slice(0, 2)}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>
                  {item.full_name}
                </Text>
                <Text style={[styles.roll, { color: colors.textSecondary }]}>
                  Roll: {item.roll_number} • {item.classroom_name || 'No class'}
                </Text>
              </View>
              <Text style={[styles.arrow, { color: colors.textMuted }]}>›</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchRow: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.sm,
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  addBtn: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: { color: '#FFF', fontSize: 24, fontWeight: '600' },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md, paddingTop: 0 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.bodyBold },
  roll: { ...typography.caption, marginTop: 2 },
  arrow: { fontSize: 24 },
});
