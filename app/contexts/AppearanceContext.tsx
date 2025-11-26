import React, { createContext, useContext, useEffect, useState } from 'react';
import { Appearance } from 'react-native';

type ThemeMode = 'light' | 'dark';

interface AppearanceContextType {
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  currentColorScheme: 'light' | 'dark';
}

const AppearanceContext = createContext<AppearanceContextType | undefined>(undefined);

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>(
    Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'
  );
  const [fontSize, setFontSizeState] = useState(15);

  // Log when theme or font size changes
  useEffect(() => {
    console.log('AppearanceContext state changed:', { themeMode, fontSize });
  }, [themeMode, fontSize]);

  const setThemeMode = (mode: ThemeMode) => {
    console.log('AppearanceContext: Setting theme mode to', mode);
    setThemeModeState(mode);
  };

  const setFontSize = (size: number) => {
    const clampedSize = Math.max(12, Math.min(24, size));
    console.log('AppearanceContext: Setting font size to', clampedSize);
    setFontSizeState(clampedSize);
  };

  // Determine the current color scheme based on mode
  const currentColorScheme: 'light' | 'dark' = themeMode;

  const value: AppearanceContextType = {
    themeMode,
    setThemeMode,
    fontSize,
    setFontSize,
    currentColorScheme,
  };

  return <AppearanceContext.Provider value={value}>{children}</AppearanceContext.Provider>;
}

export function useAppearance() {
  const context = useContext(AppearanceContext);
  if (context === undefined) {
    throw new Error('useAppearance must be used within an AppearanceProvider');
  }
  return context;
}

// Added to silence Expo Router route warnings; this file is not a screen.
export default function IgnoreAppearanceRoute() {
  return null;
}
