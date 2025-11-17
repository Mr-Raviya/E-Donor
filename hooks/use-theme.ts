import { useAppearance } from '../app/contexts/AppearanceContext';
import { Colors } from '../constants/theme';

export function useTheme() {
  const { currentColorScheme, fontSize } = useAppearance();
  const colors = Colors[currentColorScheme];

  return {
    colors,
    fontSize,
    isDark: currentColorScheme === 'dark',
  };
}
