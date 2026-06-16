import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Palettes, ThemeColors } from '../constants/palettes';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextType = {
  theme: ThemeColors;
  themeMode: ThemeMode;
  paletteName: string;
  setThemeMode: (mode: ThemeMode) => void;
  setPaletteName: (name: string) => void;
  isDark: boolean;
  isLoaded: boolean;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [paletteName, setPaletteNameState] = useState<string>('Default');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedMode = await AsyncStorage.getItem('member_ui_theme_mode');
        if (savedMode) {
          setThemeModeState(savedMode as ThemeMode);
        }
        
        const savedPalette = await AsyncStorage.getItem('member_ui_palette_name');
        if (savedPalette && Palettes[savedPalette]) {
          setPaletteNameState(savedPalette);
        }
      } catch (e) {
        console.error("Error loading theme settings:", e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadSettings();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    await AsyncStorage.setItem('member_ui_theme_mode', mode);
  };
  
  const setPaletteName = async (name: string) => {
    if (Palettes[name]) {
      setPaletteNameState(name);
      await AsyncStorage.setItem('member_ui_palette_name', name);
    }
  };

  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const currentPalette = Palettes[paletteName] || Palettes.Default;
  const theme = isDark ? currentPalette.dark : currentPalette.light;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      themeMode, 
      paletteName,
      setThemeMode, 
      setPaletteName,
      isDark, 
      isLoaded 
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
