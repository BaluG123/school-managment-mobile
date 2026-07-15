import React from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useGetClassroomsQuery } from '../../api/baseApi';
import { EmptyState } from '../../components/EmptyState';
import { Card } from '../../components/Card';
import { useTheme } from '../../theme/ThemeContext';
import { RootStackParamList } from '../../types';
import { spacing, typography } from '../../theme';

export const AttendanceScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { data: classrooms, isLoading } = useGetClassroomsQuery();

  if (!classrooms?.length && !isLoading) {
    return (
      <EmptyState
        title="No Classrooms"
        message="Create a classroom first, then register students to start marking attendance."
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Card style={styles.instructionCard}>
        <Text style={[styles.instructionTitle, { color: colors.primary }]}>
          📋 How Daily Attendance Works
        </Text>
        <Text style={[styles.step, { color: colors.text }]}>
          1. Select a classroom below
        </Text>
        <Text style={[styles.step, { color: colors.text }]}>
          2. Student stands in front of camera
        </Text>
        <Text style={[styles.step, { color: colors.text }]}>
          3. Blink when prompted (liveness check)
        </Text>
        <Text style={[styles.step, { color: colors.text }]}>
          4. Face matched → Attendance marked with time ✅
        </Text>
        <Text style={[styles.note, { color: colors.textSecondary }]}>
          Students only register once. Daily attendance takes ~3 seconds!
        </Text>
      </Card>

      <Text style={[styles.title, { color: colors.text }]}>Select Classroom</Text>
      <FlatList
        data={classrooms}
        keyExtractor={item => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              navigation.navigate('FaceAttendance', {
                classroomId: item.id,
                classroomName: item.name,
              })
            }>
            <Card style={styles.classCard} elevated>
              <Text style={[styles.className, { color: colors.text }]}>
                {item.name}
              </Text>
              <Text style={[styles.classInfo, { color: colors.textSecondary }]}>
                Grade {item.grade} • {item.student_count ?? 0} students
              </Text>
              {(item.student_count ?? 0) === 0 ? (
                <Text style={[styles.warn, { color: colors.warning }]}>
                  Add students with face photos before attendance
                </Text>
              ) : (
                <Text style={[styles.startBtn, { color: colors.primary }]}>
                  Start Attendance →
                </Text>
              )}
            </Card>
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: spacing.md },
  instructionCard: { marginBottom: spacing.md },
  instructionTitle: { ...typography.bodyBold, marginBottom: spacing.sm },
  step: { ...typography.caption, marginBottom: 4, lineHeight: 20 },
  note: { ...typography.small, marginTop: spacing.sm, fontStyle: 'italic' },
  title: { ...typography.h3, marginBottom: spacing.sm },
  list: { paddingBottom: spacing.xl },
  classCard: { marginBottom: spacing.sm },
  className: { ...typography.h3 },
  classInfo: { ...typography.caption, marginTop: 4 },
  startBtn: { ...typography.bodyBold, marginTop: spacing.sm },
  warn: { ...typography.caption, marginTop: spacing.sm, fontWeight: '600' },
});
