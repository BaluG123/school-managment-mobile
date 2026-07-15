import React from 'react';
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format } from 'date-fns';
import { Card } from '../../components/Card';
import { AddClassroomCard } from '../../components/AddClassroomCard';
import { useGetDashboardQuery, useGetClassroomsQuery } from '../../api/baseApi';
import { useAppSelector } from '../../store/hooks';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { borderRadius, spacing, typography } from '../../theme';

export const HomeScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const user = useAppSelector(s => s.auth.user);
  const today = format(new Date(), 'yyyy-MM-dd');

  const { data: dashboard, refetch: refetchDashboard, isFetching } = useGetDashboardQuery({ date: today });
  const { data: classrooms, refetch: refetchClassrooms } = useGetClassroomsQuery();

  const onRefresh = () => {
    refetchDashboard();
    refetchClassrooms();
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={isFetching} onRefresh={onRefresh} tintColor={colors.primary} />
      }>
      <View style={styles.header}>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>
          Welcome back,
        </Text>
        <Text style={[styles.name, { color: colors.text }]}>
          {user?.username || 'Headmaster'} 👋
        </Text>
        <Text style={[styles.school, { color: colors.primary }]}>
          {user?.school_name || 'Your School'}
        </Text>
      </View>

      <Card style={styles.statsCard} elevated>
        <Text style={[styles.statsTitle, { color: colors.textSecondary }]}>
          Today's Attendance
        </Text>
        <Text style={[styles.percentage, { color: colors.secondary }]}>
          {dashboard?.overall_percentage ?? 0}%
        </Text>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>
              {dashboard?.total_present ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Present</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: colors.text }]}>
              {dashboard?.total_students ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total</Text>
          </View>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Quick Actions
      </Text>
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.primary }]}
          onPress={() => (navigation as any).navigate('Main', { screen: 'Attendance' })}>
          <Text style={styles.actionEmoji}>📸</Text>
          <Text style={styles.actionText}>Mark Attendance</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('AddStudent', {})}>
          <Text style={styles.actionEmoji}>➕</Text>
          <Text style={styles.actionText}>Add Student</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Classrooms ({classrooms?.length ?? 0})
      </Text>
      <AddClassroomCard />
      {(classrooms || []).map(cls => (
        <Card key={cls.id} style={styles.classCard}>
          <View style={styles.classRow}>
            <Text style={[styles.className, { color: colors.text }]}>
              {cls.name}
            </Text>
            <Text style={[styles.classPct, { color: colors.secondary }]}>
              {cls.student_count ?? 0} students
            </Text>
          </View>
          <Text style={[styles.classSub, { color: colors.textMuted }]}>
            Grade {cls.grade}
            {cls.section ? `-${cls.section}` : ''} • {cls.academic_year}
          </Text>
        </Card>
      ))}

      {(!classrooms || classrooms.length === 0) && (
        <Text style={[styles.classSub, { color: colors.textMuted, marginHorizontal: spacing.lg }]}>
          No classrooms yet. Tap "+ Add Classroom" above.
        </Text>
      )}

      <Card style={StyleSheet.flatten([styles.tipCard, { backgroundColor: colors.successBg }])}>
        <Text style={[styles.tipTitle, { color: colors.secondary }]}>💡 Daily Tip</Text>
        <Text style={[styles.tipText, { color: colors.text }]}>
          Students only need to show their face once daily. After registration,
          attendance takes just 3 seconds — blink, scan, done!
        </Text>
      </Card>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: spacing.lg, paddingTop: spacing.md },
  greeting: { ...typography.body },
  name: { ...typography.h2, marginTop: 4 },
  school: { ...typography.bodyBold, marginTop: 4 },
  statsCard: { marginHorizontal: spacing.lg, alignItems: 'center', paddingVertical: spacing.lg },
  statsTitle: { ...typography.caption, textTransform: 'uppercase', letterSpacing: 1 },
  percentage: { fontSize: 48, fontWeight: '800', marginVertical: spacing.sm },
  statsRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  stat: { alignItems: 'center', paddingHorizontal: spacing.xl },
  statNum: { ...typography.h2 },
  statLabel: { ...typography.caption },
  divider: { width: 1, height: 40 },
  sectionTitle: { ...typography.h3, marginHorizontal: spacing.lg, marginTop: spacing.lg, marginBottom: spacing.sm },
  actions: { flexDirection: 'row', paddingHorizontal: spacing.lg, gap: spacing.md },
  actionCard: { flex: 1, borderRadius: borderRadius.lg, padding: spacing.md, alignItems: 'center' },
  actionEmoji: { fontSize: 28, marginBottom: spacing.xs },
  actionText: { color: '#FFF', ...typography.bodyBold },
  classCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  classRow: { flexDirection: 'row', justifyContent: 'space-between' },
  className: { ...typography.bodyBold },
  classPct: { ...typography.bodyBold },
  classSub: { ...typography.caption, marginTop: 4 },
  tipCard: { margin: spacing.lg, borderWidth: 0 },
  tipTitle: { ...typography.bodyBold, marginBottom: spacing.xs },
  tipText: { ...typography.caption, lineHeight: 20 },
});
