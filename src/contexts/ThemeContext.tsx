import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance, ColorSchemeName } from 'react-native';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark');

  useEffect(() => {
    loadTheme();
    
    // System tema değişikliklerini dinle
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      handleSystemThemeChange(colorScheme);
    });

    return () => subscription.remove();
  }, []);

  const loadTheme = async () => {
    try {
      const savedTheme = await AsyncStorage.getItem('@fan_manager_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setThemeState(savedTheme);
      } else {
        const systemTheme = Appearance.getColorScheme() || 'dark';
        setThemeState(systemTheme);
      }
    } catch (error) {
      console.error('Theme yükleme hatası:', error);
      setThemeState('dark'); // Varsayılan dark mode
    }
  };

  const handleSystemThemeChange = async (colorScheme: ColorSchemeName) => {
    try {
      const savedTheme = await AsyncStorage.getItem('@fan_manager_theme');
      // Kullanıcı manuel olarak tema seçmediyse sistem temasını kullan
      if (!savedTheme && colorScheme) {
        setThemeState(colorScheme);
      }
    } catch (error) {
      console.error('Sistem tema değişikliği hatası:', error);
    }
  };

  const setTheme = async (newTheme: Theme) => {
    try {
      setThemeState(newTheme);
      await AsyncStorage.setItem('@fan_manager_theme', newTheme);
    } catch (error) {
      console.error('Theme kaydetme hatası:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme hook ThemeProvider içinde kullanılmalıdır');
  }
  return context;
}
