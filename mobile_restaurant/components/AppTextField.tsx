import React from 'react';
import {
  View, Text, TextInput, StyleSheet,
  type TextInputProps, type ViewStyle, type TextStyle,
} from 'react-native';
import { AppColors } from '../styles/AppColors';

interface AppTextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
}

export function AppTextField({ label, error, containerStyle, labelStyle, style, ...props }: AppTextFieldProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      <TextInput
        style={[styles.input, error ? styles.inputError : null, style]}
        placeholderTextColor={AppColors.textHint}
        {...props}
      />
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: AppColors.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: AppColors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: AppColors.textPrimary,
    backgroundColor: '#fff',
  },
  inputError: { borderColor: AppColors.error },
  error: { fontSize: 12, color: AppColors.error, marginTop: 4 },
});
