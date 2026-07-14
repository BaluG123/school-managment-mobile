import React, { useState } from 'react';
import {
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
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useGetStudentsQuery({
    search: search || undefined,
    is_active: true,
  });

  const students = Array.isArray(data) ? data : (data?.results || []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.searchRow}>
        <TextInput
          style={[styles.search, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
          placeholder="Search by name or roll number..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => navigation.navigate('AddStudent', {})}>
          <Text style={styles.addText}>+</Text>
        </TouchableOpacity>
      </View>

      {students.length === 0 && !isLoading ? (
        <EmptyState
          title="No Students Yet"
          message="Register students with their face photo. Next time they just show their face to mark attendance!"
        />
      ) : (
        <FlatList
          data={students}
          keyExtractor={item => String(item.id)}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => navigation.navigate('StudentDetail', { studentId: item.id })}>
              {item.face_photo ? (
                <Image source={{ uri: item.face_photo }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
                  <Text style={styles.initials}>
                    {item.full_name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
              )}
              <View style={styles.info}>
                <Text style={[styles.name, { color: colors.text }]}>{item.full_name}</Text>
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
  searchRow: { flexDirection: 'row', padding: spacing.md, gap: spacing.sm },
  search: { flex: 1, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, height: 48 },
  addBtn: { width: 48, height: 48, borderRadius: borderRadius.md, alignItems: 'center', justifyContent: 'center' },
  addText: { color: '#FFF', fontSize: 24, fontWeight: '600' },
  list: { padding: spacing.md, paddingTop: 0 },
  card: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.sm },
  avatar: { width: 50, height: 50, borderRadius: 25 },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  info: { flex: 1, marginLeft: spacing.md },
  name: { ...typography.bodyBold },
  roll: { ...typography.caption, marginTop: 2 },
  arrow: { fontSize: 24 },
});
