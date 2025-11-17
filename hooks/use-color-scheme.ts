import { useAppearance } from '@/app/contexts/AppearanceContext';
import { useColorScheme as rnUseColorScheme } from 'react-native';

// Return the app-wide theme if set, otherwise fall back to the OS color scheme.
export function useColorScheme() {
	const { theme } = useAppearance();

	// AppearanceProvider limits theme to 'light'|'dark', so prefer that.
	if (theme) return theme;

	return rnUseColorScheme();
}
