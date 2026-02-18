import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTheme } from '../contexts/ThemeContext';
import { COLORS, SIZES, SPACING, FONTS } from '../theme/theme';
import { RootStackParamList, TabParamList } from '../types';
import SafeIcon from '../components/SafeIcon';

// Screens
import SplashScreen from '../screens/SplashScreen';
import LanguageSelectionScreen from '../screens/LanguageSelectionScreen';
import AuthScreen from '../screens/AuthScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import FavoriteTeamsScreen from '../screens/FavoriteTeamsScreen';
import HomeScreen from '../screens/HomeScreen';
import MatchesScreen from '../screens/MatchesScreen';
import MatchDetailScreen from '../screens/MatchDetailScreen';
import PredictionsScreen from '../screens/PredictionsScreen';
import ScoringScreen from '../screens/ScoringScreen';
import LeaderboardScreen from '../screens/LeaderboardScreen';
import ChatScreen from '../screens/ChatScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProfileSettingsScreen from '../screens/ProfileSettingsScreen';
import NotificationsScreen from '../screens/NotificationsScreen';
import ProUpgradeScreen from '../screens/ProUpgradeScreen';
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import DeleteAccountScreen from '../screens/DeleteAccountScreen';
import LegalDocumentsScreen from '../screens/LegalDocumentsScreen';
import LegalDocumentScreen from '../screens/LegalDocumentScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function BottomTabs() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: SIZES.tabBarHeight,
          paddingBottom: SPACING.sm,
          paddingTop: SPACING.sm,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SafeIcon name="home" size={size} color={color} />
          ),
          tabBarLabel: 'Ana Sayfa',
        }}
      />
      <Tab.Screen
        name="Scoring"
        component={ScoringScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SafeIcon name="stats-chart" size={size} color={color} />
          ),
          tabBarLabel: 'Puanlama',
        }}
      />
      <Tab.Screen
        name="Leaderboard"
        component={LeaderboardScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SafeIcon name="trophy" size={size} color={color} />
          ),
          tabBarLabel: 'Sıralama',
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SafeIcon name="chatbubbles" size={size} color={color} />
          ),
          tabBarLabel: 'Sohbet',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <SafeIcon name="person" size={size} color={color} />
          ),
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  // Navigation theme with fonts configuration
  const navigationTheme = {
    dark: theme === 'dark',
    colors: {
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      notification: colors.accent,
    },
    fonts: {
      regular: {
        fontFamily: FONTS.regular,
        fontWeight: '400' as const,
      },
      medium: {
        fontFamily: FONTS.medium,
        fontWeight: '500' as const,
      },
      bold: {
        fontFamily: FONTS.bold,
        fontWeight: '700' as const,
      },
      heavy: {
        fontFamily: FONTS.heavy,
        fontWeight: '900' as const,
      },
    },
  };

  return (
    <NavigationContainer theme={navigationTheme}>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen 
          name="Splash" 
          component={SplashScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LanguageSelection" 
          component={LanguageSelectionScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Auth" 
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Register" 
          component={RegisterScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ForgotPassword" 
          component={ForgotPasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="FavoriteTeams" 
          component={FavoriteTeamsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MainTabs" 
          component={BottomTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="MatchDetail" 
          component={MatchDetailScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ProfileSettings" 
          component={ProfileSettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={NotificationsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="ProUpgrade" 
          component={ProUpgradeScreen}
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePasswordScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="DeleteAccount" 
          component={DeleteAccountScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LegalDocuments" 
          component={LegalDocumentsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="LegalDocument" 
          component={LegalDocumentScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
