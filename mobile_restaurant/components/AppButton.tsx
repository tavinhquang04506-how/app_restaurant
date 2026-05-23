import React from 'react';
import {
  TouchableOpacity, Text, StyleSheet, ActivityIndicator,
  type ViewStyle, type TextStyle,
} from 'react-native';
import { AppColors } from '../styles/AppColors';

interface AppButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'text';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function AppButton({
  title, onPress, loading, disabled,
  variant = 'primary', style, textStyle,
}: AppButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        variant === 'primary' && styles.primary,
        variant === 'outline' && styles.outline,
        variant === 'text' && styles.text,
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#fff' : AppColors.primary} />
      ) : (
        <Text style={[
          styles.label,
          variant === 'primary' && styles.primaryLabel,
          variant === 'outline' && styles.outlineLabel,
          variant === 'text' && styles.textLabel,
          textStyle,
        ]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primary: { backgroundColor: AppColors.primary },
  outline: { backgroundColor: 'transparent', borderWidth: 2, borderColor: AppColors.primary },
  text: { backgroundColor: 'transparent' },
  disabled: { opacity: 0.6 },
  label: { fontSize: 16, fontWeight: 'bold' },
  primaryLabel: { color: '#fff' },
  outlineLabel: { color: AppColors.primary },
  textLabel: { color: AppColors.primary },
});
