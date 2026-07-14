import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useGetStudentQuery, useGetStudentReportQuery } from '../../api/baseApi';
import { StudentIdCard } from '../../components/StudentIdCard';
import { Card } from '../../components/Card';
import { LoadingOverlay } from '../../components/EmptyState';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { spacing, typography } from '../../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'StudentDetail'>;

export const StudentDetailScreen: React.FC<Props> = ({ route }) => {
  const { studentId } = route.params;
  const { colors } = useTheme();
  const { data: student, isLoading } = useGetStudentQuery(studentId);
  const { data: report } = useGetStudentReportQuery({ student: studentId });

  if (isLoading || !student) return <LoadingOverlay message="Loading student..." />;

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <StudentIdCard student={student} />

      {report && (
        <Card style={styles.statsCard} elevated>
          <Text style={[styles.statsTitle, { color: colors.text }]}>
            Attendance Summary
          </Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.secondary }]}>
                {report.summary.attendance_percentage}%
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Overall</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.text }]}>
                {report.summary.present_days}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Present</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statNum, { color: colors.error }]}>
                {report.summary.absent_days}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>Absent</Text>
            </View>
          </View>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Details</Text>
        <InfoRow label="Parent" value={student.parent_name || 'N/A'} colors={colors} />
        <InfoRow label="Parent Phone" value={student.parent_phone} colors={colors} />
        <InfoRow label="Gender" value={student.gender || 'N/A'} colors={colors} />
        <InfoRow label="Address" value={student.address || 'N/A'} colors={colors} />
      </Card>

      <Card style={StyleSheet.flatten([styles.tipCard, { backgroundColor: colors.successBg, borderWidth: 0 }])}>
        <Text style={[styles.tipTitle, { color: colors.secondary }]}>
          ✅ Registration Complete
        </Text>
        <Text style={[styles.tipText, { color: colors.text }]}>
          {student.first_name} is registered! From tomorrow, they just need to
          show their face at the attendance kiosk — no forms, no waiting.
          It takes only 3 seconds!
        </Text>
      </Card>
      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
};

const InfoRow: React.FC<{ label: string; value: string; colors: any }> = ({
  label, value, colors,
}) => (
  <View style={styles.row}>
    <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  statsCard: { marginBottom: spacing.md },
  statsTitle: { ...typography.h3, marginBottom: spacing.md },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  statBox: { alignItems: 'center' },
  statNum: { fontSize: 24, fontWeight: '700' },
  statLabel: { ...typography.caption, marginTop: 4 },
  infoCard: { marginBottom: spacing.md },
  sectionTitle: { ...typography.h3, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#E2E8F0' },
  label: { ...typography.body },
  value: { ...typography.bodyBold, maxWidth: '60%', textAlign: 'right' },
  tipCard: { marginBottom: spacing.md },
  tipTitle: { ...typography.bodyBold, marginBottom: spacing.xs },
  tipText: { ...typography.caption, lineHeight: 20 },
});
