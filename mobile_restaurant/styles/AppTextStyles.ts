import { StyleSheet } from 'react-native';
import { AppColors } from './AppColors';

/**
 * Centralized text styles matching Flutter AppTextStyles.dart
 */
export const AppTextStyles = StyleSheet.create({
  heading1: { fontSize: 40, fontWeight: 'bold', color: AppColors.textOnPrimary },
  heading2: { fontSize: 30, fontWeight: '600', color: AppColors.textOnPrimary },
  heading3: { fontSize: 24, fontWeight: '600', color: AppColors.textPrimary },
  subtitle1: { fontSize: 18, color: AppColors.textOnPrimary },
  subtitle2: { fontSize: 16, color: AppColors.textSecondary },
  body: { fontSize: 16, color: AppColors.textPrimary },
  bodySmall: { fontSize: 14, color: AppColors.textSecondary },
  button: { fontSize: 16, fontWeight: 'bold', color: AppColors.textOnPrimary },
  buttonSmall: { fontSize: 14, fontWeight: '500', color: AppColors.textOnPrimary },
  link: { fontSize: 16, fontWeight: 'bold', color: AppColors.textLink },
  linkSmall: { fontSize: 14, fontWeight: 'bold', color: AppColors.textLink },
  hint: { fontSize: 14, color: AppColors.textHint },
  label: { fontSize: 12, color: AppColors.textSecondary },
  error: { fontSize: 12, color: AppColors.error },
});
