import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../theme/ThemeContext';
import { borderRadius, spacing, typography } from '../theme';
import type { Student } from '../types';
import { format } from 'date-fns';

interface StudentIdCardProps {
  student: Student;
  schoolName?: string;
}

export const StudentIdCard: React.FC<StudentIdCardProps> = ({
  student,
  schoolName,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[colors.idCardGradientStart, colors.idCardGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}>
        <View style={styles.header}>
          <Text style={styles.schoolName}>
            {schoolName || student.school_name || 'School'}
          </Text>
          <Text style={styles.cardLabel}>STUDENT ID CARD</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.photoContainer}>
            {student.face_photo ? (
              <Image
                source={{ uri: student.face_photo }}
                style={styles.photo}
              />
            ) : (
              <View style={[styles.photo, styles.photoPlaceholder]}>
                <Text style={styles.initials}>
                  {student.first_name[0]}
                  {student.last_name[0]}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.info}>
            <Text style={styles.name}>{student.full_name}</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Roll No</Text>
              <Text style={styles.value}>{student.roll_number}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Class</Text>
              <Text style={styles.value}>
                {student.classroom_name || 'N/A'}
              </Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Admission</Text>
              <Text style={styles.value}>{student.admission_number}</Text>
            </View>
            {student.date_of_birth && (
              <View style={styles.row}>
                <Text style={styles.label}>DOB</Text>
                <Text style={styles.value}>
                  {format(new Date(student.date_of_birth), 'dd MMM yyyy')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Valid for Academic Year {new Date().getFullYear()}-
            {new Date().getFullYear() + 1}
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginVertical: spacing.md,
  },
  gradient: {
    padding: spacing.lg,
    minHeight: 220,
  },
  header: {
    marginBottom: spacing.md,
  },
  schoolName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.9,
  },
  cardLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    marginTop: 4,
    opacity: 0.7,
  },
  body: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  photoContainer: {
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  photo: {
    width: 90,
    height: 110,
    borderRadius: borderRadius.sm,
  },
  photoPlaceholder: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: '#FFFFFF',
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: spacing.sm,
  },
  footerText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    textAlign: 'center',
  },
});
