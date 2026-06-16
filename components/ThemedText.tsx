import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export type ThemedTextProps = TextProps & {
  type?: 'default' | 'title' | 'subtitle' | 'caption' | 'bold' | 'error' | 'success';
};

export function ThemedText({ style, type = 'default', ...props }: ThemedTextProps) {
  const { theme } = useTheme();

  let textStyle = styles.default;
  let color = theme.text;

  switch (type) {
    case 'title':
      textStyle = styles.title;
      break;
    case 'subtitle':
      textStyle = styles.subtitle;
      color = theme.textMuted;
      break;
    case 'caption':
      textStyle = styles.caption;
      color = theme.textMuted;
      break;
    case 'bold':
      textStyle = styles.bold;
      break;
    case 'error':
      color = theme.error;
      break;
    case 'success':
      color = theme.success;
      break;
  }

  return <Text style={[{ color }, textStyle, style]} {...props} />;
}

const styles = StyleSheet.create({
  default: {
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 34,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    letterSpacing: -0.5,
  },
  caption: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    lineHeight: 16,
  },
  bold: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 24,
    letterSpacing: -0.2,
  },
});
