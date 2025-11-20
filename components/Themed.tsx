/**
 * Composants thématiques hérités - À migrer vers ThemedComponents.tsx
 * Ce fichier est conservé pour la compatibilité avec l'écran de login existant
 */

import Colors from '@/constants/Colors';
import { useTheme } from '@/theme';
import { darkTheme } from '@/theme';
import { Text as DefaultText, View as DefaultView } from 'react-native';

type ThemeProps = {
  lightColor?: string;
  darkColor?: string;
};

export type TextProps = ThemeProps & DefaultText['props'];
export type ViewProps = ThemeProps & DefaultView['props'];

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: keyof typeof Colors.light & keyof typeof Colors.dark
) {
  const theme = useTheme();
  
  const colorFromProps = props[theme === darkTheme ? 'dark' : 'light'];
  
  if (colorFromProps) {
    return colorFromProps;
  } else {
    return theme.colors[colorName as keyof typeof theme.colors] as string;
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return <DefaultText style={[{ color }, style]} {...otherProps} />;
}

export function View(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props;
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />;
}
