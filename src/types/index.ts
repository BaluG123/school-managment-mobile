export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  role: string;
  school_id: number | null;
  school_name: string | null;
}

export interface School {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
  email: string;
  logo: string | null;
  is_active: boolean;
  classroom_count: number;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface ClassRoom {
  id: number;
  school: number;
  school_name: string;
  name: string;
  grade: string;
  section: string;
  academic_year: string;
  is_active: boolean;
  student_count: number;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: number;
  school: number;
  school_name: string;
  classroom: number | null;
  classroom_name: string | null;
  first_name: string;
  last_name: string;
  full_name: string;
  roll_number: string;
  admission_number: string;
  date_of_birth: string | null;
  gender: string;
  parent_name: string;
  parent_phone: string;
  address: string;
  face_photo: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: number;
  student: number;
  student_name: string;
  roll_number: string;
  school: number;
  classroom: number | null;
  classroom_name: string | null;
  date: string;
  check_in_time: string;
  status: 'present' | 'absent' | 'late' | 'half_day';
  face_match_confidence: number | null;
  capture_photo: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface ClassReport {
  classroom_id: number;
  classroom_name: string;
  date: string;
  total_students: number;
  present: number;
  absent: number;
  late: number;
  half_day: number;
  unmarked: number;
  attendance_percentage: number;
  students: Array<{
    student_id: number;
    full_name: string;
    roll_number: string;
    status: string;
    check_in_time: string | null;
    face_match_confidence: number | null;
  }>;
}

export interface DashboardData {
  date: string;
  school_id: number;
  total_students: number;
  total_present: number;
  overall_percentage: number;
  classrooms: Array<{
    classroom_id: number;
    classroom_name: string;
    total_students: number;
    present: number;
    attendance_percentage: number;
  }>;
}

export type ThemeMode = 'light' | 'dark' | 'system';

export type RootStackParamList = {
  Splash: undefined;
  Auth: undefined;
  BiometricLock: undefined;
  Main: undefined;
  SetupSchool: undefined;
  AddStudent: { classroomId?: number };
  StudentDetail: { studentId: number };
  FaceAttendance: { classroomId: number; classroomName: string };
  AttendanceSuccess: {
    studentName: string;
    rollNumber: string;
    checkInTime: string;
    confidence: number;
  };
  ClassReport: { classroomId: number; classroomName: string };
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Students: undefined;
  Attendance: undefined;
  Settings: undefined;
};
