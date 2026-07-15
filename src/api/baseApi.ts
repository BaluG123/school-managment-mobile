import {
  BaseQueryFn,
  createApi,
  FetchArgs,
  fetchBaseQuery,
  FetchBaseQueryError,
} from '@reduxjs/toolkit/query/react';
import { API_BASE_URL } from '../constants/config';
import { RootState } from '../store';
import { setTokens, logout } from '../store/slices/authSlice';
import type {
  Attendance,
  ClassReport,
  ClassRoom,
  DashboardData,
  School,
  Student,
  User,
} from '../types';

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.accessToken;
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  },
});

const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  if (result.error?.status === 401) {
    const refreshToken = (api.getState() as RootState).auth.refreshToken;
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh/',
          method: 'POST',
          body: { refresh: refreshToken },
        },
        api,
        extraOptions,
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { access: string; refresh?: string };
        api.dispatch(
          setTokens({
            accessToken: data.access,
            refreshToken: data.refresh,
          }),
        );
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } else {
      api.dispatch(logout());
    }
  }

  return result;
};

export const api = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User', 'School', 'Classroom', 'Student', 'Attendance', 'Dashboard'],
  endpoints: builder => ({
    // Auth
    signup: builder.mutation<
      { message: string; user: User },
      {
        username: string;
        password: string;
        password_confirm: string;
        email?: string;
        phone?: string;
        role?: string;
      }
    >({
      query: body => ({ url: '/auth/signup/', method: 'POST', body }),
    }),
    login: builder.mutation<
      { access: string; refresh: string },
      { username: string; password: string }
    >({
      query: body => ({ url: '/auth/login/', method: 'POST', body }),
    }),
    getProfile: builder.query<User, void>({
      query: () => '/auth/profile/',
      providesTags: ['User'],
    }),
    changePassword: builder.mutation<
      { message: string },
      { old_password: string; new_password: string; new_password_confirm: string }
    >({
      query: body => ({ url: '/auth/change-password/', method: 'POST', body }),
    }),

    // Schools
    getSchools: builder.query<School[], void>({
      query: () => '/schools/',
      transformResponse: (response: School[] | { results: School[] }) =>
        Array.isArray(response) ? response : response.results || [],
      providesTags: ['School'],
    }),
    createSchool: builder.mutation<School, Partial<School>>({
      query: body => ({ url: '/schools/', method: 'POST', body }),
      invalidatesTags: ['School', 'User'],
    }),
    updateSchool: builder.mutation<School, { id: number; data: Partial<School> }>({
      query: ({ id, data }) => ({ url: `/schools/${id}/`, method: 'PATCH', body: data }),
      invalidatesTags: ['School'],
    }),

    // Classrooms
    getClassrooms: builder.query<ClassRoom[], void>({
      query: () => '/schools/classrooms/',
      transformResponse: (response: ClassRoom[] | { results: ClassRoom[] }) =>
        Array.isArray(response) ? response : response.results || [],
      providesTags: ['Classroom'],
    }),
    createClassroom: builder.mutation<
      ClassRoom,
      { name: string; grade: string; section?: string; academic_year: string }
    >({
      query: body => ({ url: '/schools/classrooms/', method: 'POST', body }),
      invalidatesTags: ['Classroom', 'School'],
    }),

    // Students
    getStudents: builder.query<
      { results: Student[]; count: number } | Student[],
      { classroom?: number; search?: string; is_active?: boolean }
    >({
      query: params => ({
        url: '/students/',
        params,
      }),
      transformResponse: (response: Student[] | { results: Student[] }) => {
        if (Array.isArray(response)) {
          return { results: response, count: response.length };
        }
        return { results: response.results || [], count: response.results?.length || 0 };
      },
      providesTags: ['Student'],
    }),
    getStudent: builder.query<Student, number>({
      query: id => `/students/${id}/`,
      providesTags: (_r, _e, id) => [{ type: 'Student', id }],
    }),
    createStudent: builder.mutation<Student, FormData>({
      query: formData => ({
        url: '/students/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Student', 'School', 'Classroom', 'Dashboard'],
    }),
    updateStudent: builder.mutation<Student, { id: number; data: FormData | Partial<Student> }>({
      query: ({ id, data }) => ({
        url: `/students/${id}/`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Student', 'Classroom'],
    }),
    getFacePhotos: builder.query<
      {
        classroom: string | number;
        count: number;
        with_photos: number;
        students: Array<{
          id: number;
          full_name: string;
          roll_number: string;
          face_photo: string | null;
          has_face_photo: boolean;
        }>;
      },
      number
    >({
      query: classroomId => ({
        url: '/students/face-photos/',
        params: { classroom: classroomId },
      }),
      // Support old array responses and new wrapped response
      transformResponse: (response: any) => {
        if (Array.isArray(response)) {
          return {
            classroom: 0,
            count: response.length,
            with_photos: response.filter((s: any) => s.face_photo).length,
            students: response,
          };
        }
        return response;
      },
    }),

    // Attendance
    markAttendance: builder.mutation<
      { message: string; attendance: Attendance },
      FormData
    >({
      query: formData => ({
        url: '/attendance/mark/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Attendance', 'Dashboard'],
    }),
    matchAndMarkAttendance: builder.mutation<
      {
        message: string;
        matched: boolean;
        confidence: number;
        student: { id: number; full_name: string; roll_number: string };
        attendance: Attendance;
      },
      FormData
    >({
      query: formData => ({
        url: '/attendance/match/',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Attendance', 'Dashboard', 'Classroom'],
    }),
    getAttendance: builder.query<
      Attendance[],
      { date?: string; classroom?: number; student?: number }
    >({
      query: params => ({ url: '/attendance/', params }),
      transformResponse: (response: Attendance[] | { results: Attendance[] }) => {
        if (Array.isArray(response)) return response;
        return response.results || [];
      },
      providesTags: ['Attendance'],
    }),
    getClassReport: builder.query<ClassReport, { classroom: number; date?: string }>({
      query: params => ({ url: '/attendance/class-report/', params }),
      providesTags: ['Attendance'],
    }),
    getStudentReport: builder.query<
      {
        student_id: number;
        student_name: string;
        roll_number: string;
        summary: {
          total_days: number;
          present_days: number;
          absent_days: number;
          late_days: number;
          attendance_percentage: number;
        };
        records: Attendance[];
      },
      { student: number; from?: string; to?: string }
    >({
      query: params => ({ url: '/attendance/student-report/', params }),
    }),
    getDashboard: builder.query<DashboardData, { date?: string }>({
      query: params => ({ url: '/attendance/dashboard/', params }),
      providesTags: ['Dashboard'],
    }),
    healthCheck: builder.query<{ status: string }, void>({
      query: () => '/health/',
    }),
  }),
});

export const {
  useSignupMutation,
  useLoginMutation,
  useGetProfileQuery,
  useChangePasswordMutation,
  useGetSchoolsQuery,
  useCreateSchoolMutation,
  useUpdateSchoolMutation,
  useGetClassroomsQuery,
  useCreateClassroomMutation,
  useGetStudentsQuery,
  useGetStudentQuery,
  useCreateStudentMutation,
  useUpdateStudentMutation,
  useGetFacePhotosQuery,
  useMarkAttendanceMutation,
  useMatchAndMarkAttendanceMutation,
  useGetAttendanceQuery,
  useGetClassReportQuery,
  useGetStudentReportQuery,
  useGetDashboardQuery,
  useHealthCheckQuery,
} = api;
