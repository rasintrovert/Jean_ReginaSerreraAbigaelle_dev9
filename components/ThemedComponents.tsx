import { useTheme } from '@/theme';
import React from 'react';
import {
  Text as RNText,
  TextInput as RNTextInput,
  Pressable as RNPressable,
  View as RNView,
  StyleSheet,
  TextInputProps,
  TextStyle,
  PressableProps,
  ViewStyle
} from 'react-native';

// Types pour les props des composants
interface ThemedTextProps extends Omit<TextStyle, 'color'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'disabled' | 'error' | 'success';
  size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  accessibilityLabel?: string;
  style?: TextStyle;
}

interface ThemedViewProps extends ViewStyle {
  children: React.ReactNode;
  variant?: 'background' | 'surface' | 'surfaceVariant' | 'transparent';
  accessibilityLabel?: string;
  style?: ViewStyle;
}

interface ThemedButtonProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  accessibilityLabel?: string;
  style?: ViewStyle | ((pressed: boolean) => ViewStyle);
}

interface ThemedInputProps extends TextInputProps {
  variant?: 'default' | 'error' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  style?: TextStyle;
}

// Composant Text thématique avec accessibilité
export function ThemedText({ 
  children, 
  variant = 'primary', 
  size = 'base', 
  weight = 'normal',
  accessibilityLabel,
  style,
  ...props 
}: ThemedTextProps) {
  const theme = useTheme();
  
  const getTextColor = () => {
    switch (variant) {
      case 'primary': return theme.colors.text;
      case 'secondary': return theme.colors.textSecondary;
      case 'disabled': return theme.colors.textDisabled;
      case 'error': return theme.colors.error;
      case 'success': return theme.colors.success;
      default: return theme.colors.text;
    }
  };
  
  const textStyle: TextStyle = {
    color: getTextColor(),
    fontSize: theme.typography.fontSize[size],
    fontWeight: theme.typography.fontWeight[weight],
    lineHeight: theme.typography.fontSize[size] * theme.typography.lineHeight.normal,
  };
  
  return (
    <RNText
      style={[textStyle, style]}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </RNText>
  );
}

// Composant View thématique avec accessibilité
export function ThemedView({ 
  children, 
  variant = 'background', 
  accessibilityLabel,
  style,
  ...props 
}: ThemedViewProps) {
  const theme = useTheme();
  
  const getBackgroundColor = () => {
    if (variant === 'transparent') return 'transparent';
    
    switch (variant) {
      case 'background': return theme.colors.background;
      case 'surface': return theme.colors.surface;
      case 'surfaceVariant': return theme.colors.surfaceVariant;
      default: return theme.colors.background;
    }
  };
  
  // Si backgroundColor est défini dans style, il prend priorité
  const viewStyle: ViewStyle = {};
  
  // Vérifier si backgroundColor est déjà défini dans style
  // style peut être un objet, un tableau, ou undefined
  const hasBackgroundColorInStyle = () => {
    if (!style) return false;
    if (Array.isArray(style)) {
      return style.some(s => s && typeof s === 'object' && 'backgroundColor' in s);
    }
    return typeof style === 'object' && 'backgroundColor' in style;
  };
  
  // Seulement ajouter backgroundColor si pas défini dans style
  if (!hasBackgroundColorInStyle()) {
    viewStyle.backgroundColor = getBackgroundColor();
  }
  
  return (
    <RNView
      style={[viewStyle, style]}
      accessibilityLabel={accessibilityLabel}
      {...props}
    >
      {children}
    </RNView>
  );
}

// Composant Button thématique avec accessibilité et cibles tactiles larges
export function ThemedButton({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  accessibilityLabel,
  style,
  disabled,
  ...props 
}: ThemedButtonProps) {
  const theme = useTheme();
  
  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
    };
    
    // Tailles avec cibles tactiles minimales de 44px
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = theme.spacing.sm;
        baseStyle.paddingHorizontal = theme.spacing.md;
        baseStyle.minHeight = 44;
        break;
      case 'md':
        baseStyle.paddingVertical = theme.spacing.md;
        baseStyle.paddingHorizontal = theme.spacing.lg;
        baseStyle.minHeight = 48;
        break;
      case 'lg':
        baseStyle.paddingVertical = theme.spacing.lg;
        baseStyle.paddingHorizontal = theme.spacing.xl;
        baseStyle.minHeight = 52;
        break;
    }
    
    // Largeur complète
    if (fullWidth) {
      baseStyle.width = '100%';
    }
    
    // Variantes de couleur
    switch (variant) {
      case 'primary':
        baseStyle.backgroundColor = disabled ? theme.colors.disabled : theme.colors.primary;
        break;
      case 'secondary':
        baseStyle.backgroundColor = disabled ? theme.colors.disabled : theme.colors.secondary;
        break;
      case 'outline':
        baseStyle.backgroundColor = 'transparent';
        baseStyle.borderWidth = 1;
        baseStyle.borderColor = disabled ? theme.colors.border : theme.colors.primary;
        break;
      case 'ghost':
        baseStyle.backgroundColor = 'transparent';
        break;
    }
    
    return baseStyle;
  };
  
  const getTextColor = (): string => {
    if (disabled) return theme.colors.textDisabled;
    
    switch (variant) {
      case 'primary':
      case 'secondary':
        return '#ffffff';
      case 'outline':
      case 'ghost':
        return theme.colors.primary;
      default:
        return '#ffffff';
    }
  };
  
  return (
    <RNPressable
      style={({ pressed }) => {
        const baseStyle = getButtonStyle();
        const opacityStyle = pressed && !disabled ? { opacity: 0.7 } : {};
        const customStyle = typeof style === 'function' ? style(pressed) : style;
        return [baseStyle, opacityStyle, customStyle];
      }}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      {...props}
    >
      <ThemedText 
        weight="semibold"
        size={size === 'sm' ? 'sm' : 'base'}
        style={{ color: getTextColor() }}
      >
        {children}
      </ThemedText>
    </RNPressable>
  );
}

// Composant Input thématique avec accessibilité
export function ThemedInput({ 
  variant = 'default',
  size = 'md',
  fullWidth = false,
  style,
  ...props 
}: ThemedInputProps) {
  const theme = useTheme();
  
  const getInputStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      borderWidth: 1,
      borderRadius: theme.borderRadius.md,
      paddingHorizontal: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
    };
    
    // Tailles
    switch (size) {
      case 'sm':
        baseStyle.paddingVertical = theme.spacing.sm;
        baseStyle.fontSize = theme.typography.fontSize.sm;
        baseStyle.minHeight = 44;
        break;
      case 'md':
        baseStyle.paddingVertical = theme.spacing.md;
        baseStyle.fontSize = theme.typography.fontSize.base;
        baseStyle.minHeight = 48;
        break;
      case 'lg':
        baseStyle.paddingVertical = theme.spacing.lg;
        baseStyle.fontSize = theme.typography.fontSize.lg;
        baseStyle.minHeight = 52;
        break;
    }
    
    // Largeur complète
    if (fullWidth) {
      baseStyle.width = '100%';
    }
    
    // Variantes
    switch (variant) {
      case 'default':
        baseStyle.borderColor = theme.colors.border;
        break;
      case 'error':
        baseStyle.borderColor = theme.colors.error;
        break;
      case 'success':
        baseStyle.borderColor = theme.colors.success;
        break;
    }
    
    return baseStyle;
  };
  
  return (
    <RNTextInput
      style={[getInputStyle(), style]}
      placeholderTextColor={theme.colors.textSecondary}
      accessibilityRole="text"
      {...props}
    />
  );
}

// Composant Card thématique
export function ThemedCard({ 
  children, 
  style,
  ...props 
}: ThemedViewProps) {
  const theme = useTheme();
  
  const cardStyle: ViewStyle = {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  };
  
  return (
    <ThemedView style={StyleSheet.flatten([cardStyle, style])} {...props}>
      {children}
    </ThemedView>
  );
}
