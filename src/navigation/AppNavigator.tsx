import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet } from 'react-native';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { BiometricLockScreen } from '../screens/BiometricLockScreen';
import { SetupSchoolScreen } from '../screens/SetupSchoolScreen';
import { HomeScreen } from '../screens/home/HomeScreen';
import { StudentsScreen } from '../screens/students/StudentsScreen';
import { StudentDetailScreen } from '../screens/students/StudentDetailScreen';
import { AddStudentScreen } from '../screens/students/AddStudentScreen';
import { AttendanceScreen } from '../screens/attendance/AttendanceScreen';
import { FaceAttendanceScreen } from '../screens/attendance/FaceAttendanceScreen';
import { AttendanceSuccessScreen } from '../screens/attendance/AttendanceSuccessScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { useTheme } from '../theme/ThemeContext';
import { useAppSelector } from '../store/hooks';
import {
  AuthStackParamList,
  MainTabParamList,
  RootStackParamList,
} from '../types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const TabIcon: React.FC<{ emoji: string; focused: boolean; color: string }> = ({
  emoji, focused, color,
}) => (
  <Text style={[styles.tabIcon, { opacity: focused ? 1 : 0.5 }]}>{emoji}</Text>
);

const MainTabs: React.FC = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarStyle: { backgroundColor: colors.tabBar, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="🏠" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Students"
        component={StudentsScreen}
        options={{
          title: 'Students',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="👨‍🎓" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Attendance"
        component={AttendanceScreen}
        options={{
          title: 'Attendance',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="📸" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused, color }) => <TabIcon emoji="⚙️" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

const AuthNavigator: React.FC = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Signup" component={SignupScreen} />
  </AuthStack.Navigator>
);

export const AppNavigator: React.FC = () => {
  const { colors } = useTheme();
  const { isAuthenticated, biometricVerified, user } = useAppSelector(s => s.auth);
  const [showBiometric, setShowBiometric] = React.useState(false);
  const [showSetupSchool, setShowSetupSchool] = React.useState(false);

  React.useEffect(() => {
    if (isAuthenticated && !biometricVerified) {
      setShowBiometric(true);
    }
    if (isAuthenticated && biometricVerified && !user?.school_id) {
      setShowSetupSchool(true);
    }
  }, [isAuthenticated, biometricVerified, user?.school_id]);

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  if (showBiometric) {
    return (
      <BiometricLockScreen
        onUnlock={() => {
          setShowBiometric(false);
          if (!user?.school_id) setShowSetupSchool(true);
        }}
      />
    );
  }

  if (showSetupSchool) {
    return (
      <SetupSchoolScreen
        onComplete={() => setShowSetupSchool(false)}
      />
    );
  }

  return (
    <RootStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <RootStack.Screen
        name="Main"
        component={MainTabs}
        options={{ headerShown: false }}
      />
      <RootStack.Screen
        name="AddStudent"
        component={AddStudentScreen}
        options={{ title: 'Register Student', presentation: 'modal' }}
      />
      <RootStack.Screen
        name="StudentDetail"
        component={StudentDetailScreen}
        options={{ title: 'Student Profile' }}
      />
      <RootStack.Screen
        name="FaceAttendance"
        component={FaceAttendanceScreen}
        options={{ title: 'Face Attendance', headerShown: false }}
      />
      <RootStack.Screen
        name="AttendanceSuccess"
        component={AttendanceSuccessScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
    </RootStack.Navigator>
  );
};

const styles = StyleSheet.create({
  tabIcon: { fontSize: 22 },
});
