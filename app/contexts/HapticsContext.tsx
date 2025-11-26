import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = '@e_donor_haptics_enabled';

interface HapticsContextValue {
  enabled: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
  impact: (style?: Haptics.ImpactFeedbackStyle) => Promise<void>;
  notification: (type?: Haptics.NotificationFeedbackType) => Promise<void>;
  selection: () => Promise<void>;
}

const HapticsContext = createContext<HapticsContextValue | undefined>(undefined);

export function HapticsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const loadPreference = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          setEnabledState(stored === 'true');
        }
      } catch (error) {
        console.error('Failed to load haptics preference', error);
      } finally {
        setHydrated(true);
      }
    };

    void loadPreference();
  }, []);

  const setEnabled = async (nextEnabled: boolean) => {
    setEnabledState(nextEnabled);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextEnabled ? 'true' : 'false');
    } catch (error) {
      console.error('Failed to save haptics preference', error);
    }
  };

  const runIfEnabled = (fn: () => Promise<void>): Promise<void> => {
    if (!enabled || !hydrated) {
      return Promise.resolve();
    }

    return fn().catch((error) => {
      console.error('Haptics action failed', error);
    });
  };

  const value = useMemo(
    () => ({
      enabled,
      setEnabled,
      impact: (style = Haptics.ImpactFeedbackStyle.Light) =>
        runIfEnabled(() => Haptics.impactAsync(style)),
      notification: (type = Haptics.NotificationFeedbackType.Success) =>
        runIfEnabled(() => Haptics.notificationAsync(type)),
      selection: () => runIfEnabled(() => Haptics.selectionAsync()),
    }),
    [enabled, hydrated],
  );

  return <HapticsContext.Provider value={value}>{children}</HapticsContext.Provider>;
}

export function useHaptics() {
  const context = useContext(HapticsContext);
  if (!context) {
    throw new Error('useHaptics must be used within a HapticsProvider');
  }
  return context;
}

// Added to silence Expo Router route warnings; this file is not a screen.
export default function IgnoreHapticsRoute() {
  return null;
}
