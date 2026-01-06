import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreenExpo from 'expo-splash-screen';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LanguageSelection from './src/screens/LanguageSelection';
import AuthScreens from './src/screens/AuthScreens';
import FavoriteTeams from './src/screens/FavoriteTeams';
import MatchList from './src/screens/MatchList';
import MatchDetail from './src/screens/MatchDetail';
import Profile from './src/screens/Profile';
import ProfileSettings from './src/screens/ProfileSettings';
import ProfileBadges from './src/screens/ProfileBadges';
import Notifications from './src/screens/Notifications';
import ProUpgrade from './src/screens/ProUpgrade';
import LegalDocuments from './src/screens/LegalDocuments';
import LegalDocumentScreen from './src/screens/LegalDocumentScreen';
import ChangePassword from './src/screens/ChangePassword';
import DeleteAccount from './src/screens/DeleteAccount';

// Icons
import { Ionicons } from '@expo/vector-icons';

// Theme
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';
import { COLORS } from './src/constants/theme';

// Navigation Types
export type RootStackParamList = {
  Splash: undefined;
  LanguageSelection: undefined;
  Auth: undefined;
  FavoriteTeams: undefined;
  MainTabs: undefined;
  MatchDetail: { matchId: string };
  ProfileSettings: undefined;
  ProfileBadges: undefined;
  Notifications: undefined;
  ProUpgrade: undefined;
  LegalDocuments: undefined;
  LegalDocument: { type: 'terms' | 'privacy' | 'cookies' };
  ChangePassword: undefined;
  DeleteAccount: undefined;
};

export type TabParamList = {
  Matches: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Keep splash screen visible
SplashScreenExpo.preventAutoHideAsync();

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
          height: 52,
          paddingBottom: 4,
          paddingTop: 4,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
      }}
    >
      <Tab.Screen
        name="Matches"
        component={MatchList}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="football-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Maçlar',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={Profile}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
          tabBarLabel: 'Profil',
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { theme } = useTheme();
  const colors = theme === 'dark' ? COLORS.dark : COLORS.light;

  return (
    <NavigationContainer
      theme={{
        dark: theme === 'dark',
        colors: {
          primary: colors.primary,
          background: colors.background,
          card: colors.surface,
          text: colors.text,
          border: colors.border,
          notification: colors.accent,
        },
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="LanguageSelection" component={LanguageSelection} />
        <Stack.Screen name="Auth" component={AuthScreens} />
        <Stack.Screen name="FavoriteTeams" component={FavoriteTeams} />
        <Stack.Screen name="MainTabs" component={BottomTabs} />
        <Stack.Screen 
          name="MatchDetail" 
          component={MatchDetail}
          options={{
            headerShown: true,
            headerTitle: 'Maç Detayı',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="ProfileSettings" 
          component={ProfileSettings}
          options={{
            headerShown: true,
            headerTitle: 'Ayarlar',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="ProfileBadges" 
          component={ProfileBadges}
          options={{
            headerShown: true,
            headerTitle: 'Rozetlerim',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="Notifications" 
          component={Notifications}
          options={{
            headerShown: true,
            headerTitle: 'Bildirimler',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="ProUpgrade" 
          component={ProUpgrade}
          options={{
            presentation: 'modal',
            headerShown: true,
            headerTitle: 'Pro Üyelik',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="LegalDocuments" 
          component={LegalDocuments}
          options={{
            headerShown: true,
            headerTitle: 'Yasal Dökümanlar',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="LegalDocument" 
          component={LegalDocumentScreen}
          options={{
            headerShown: true,
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="ChangePassword" 
          component={ChangePassword}
          options={{
            headerShown: true,
            headerTitle: 'Şifre Değiştir',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
        <Stack.Screen 
          name="DeleteAccount" 
          component={DeleteAccount}
          options={{
            headerShown: true,
            headerTitle: 'Hesabı Sil',
            headerStyle: {
              backgroundColor: colors.surface,
            },
            headerTintColor: colors.text,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load fonts, data, etc.
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
        await SplashScreenExpo.hideAsync();
      }
    }

    prepare();
  }, []);

  if (!appIsReady) {
    return null;
  }

  return (
    <ThemeProvider>
      <StatusBar style="auto" />
      <AppNavigator />
    </ThemeProvider>
  );
}
