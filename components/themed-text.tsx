import { StyleSheet, Text, type TextProps } from 'react-native';

import { useAppearance } from '@/app/contexts/AppearanceContext';
import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const { fontSize: baseFontSize } = useAppearance();
  const scale = baseFontSize / 16;

  const scaledTypeStyle =
    type === 'default'
      ? { fontSize: 16 * scale, lineHeight: 24 * scale }
      : type === 'defaultSemiBold'
      ? { fontSize: 16 * scale, lineHeight: 24 * scale, fontWeight: '600' as const }
      : type === 'title'
      ? { fontSize: 32 * scale, fontWeight: 'bold' as const, lineHeight: 32 * scale }
      : type === 'subtitle'
      ? { fontSize: 20 * scale, fontWeight: 'bold' as const }
      : type === 'link'
      ? { fontSize: 16 * scale, lineHeight: 30 * scale }
      : undefined;

  return (
    <Text
      style={[
        { color },
        scaledTypeStyle,
        type === 'default' ? styles.default : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSemiBold: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
});
