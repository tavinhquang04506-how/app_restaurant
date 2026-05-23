import 'package:flutter/material.dart';
import 'AppColors.dart';

/// Centralized text styles for the entire app.
/// Sử dụng: AppTextStyles.heading1, AppTextStyles.body, etc.
class AppTextStyles {
  AppTextStyles._(); // Prevent instantiation

  // ==================== Headings ====================
  static const TextStyle heading1 = TextStyle(
    fontSize: 40,
    fontWeight: FontWeight.bold,
    color: AppColors.textOnPrimary,
  );

  static const TextStyle heading2 = TextStyle(
    fontSize: 30,
    fontWeight: FontWeight.w600,
    color: AppColors.textOnPrimary,
  );

  static const TextStyle heading3 = TextStyle(
    fontSize: 24,
    fontWeight: FontWeight.w600,
    color: AppColors.textPrimary,
  );

  // ==================== Subtitles ====================
  static const TextStyle subtitle1 = TextStyle(
    fontSize: 18,
    color: AppColors.textOnPrimary,
  );

  static const TextStyle subtitle2 = TextStyle(
    fontSize: 16,
    color: AppColors.textSecondary,
  );

  // ==================== Body Text ====================
  static const TextStyle body = TextStyle(
    fontSize: 16,
    color: AppColors.textPrimary,
  );

  static const TextStyle bodySmall = TextStyle(
    fontSize: 14,
    color: AppColors.textSecondary,
  );

  // ==================== Button Text ====================
  static const TextStyle button = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.textOnPrimary,
  );

  static const TextStyle buttonSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.w500,
    color: AppColors.textOnPrimary,
  );

  // ==================== Links ====================
  static const TextStyle link = TextStyle(
    fontSize: 16,
    fontWeight: FontWeight.bold,
    color: AppColors.textLink,
  );

  static const TextStyle linkSmall = TextStyle(
    fontSize: 14,
    fontWeight: FontWeight.bold,
    color: AppColors.textLink,
  );

  // ==================== Hint/Label ====================
  static const TextStyle hint = TextStyle(
    fontSize: 14,
    color: AppColors.textHint,
  );

  static const TextStyle label = TextStyle(
    fontSize: 12,
    color: AppColors.textSecondary,
  );

  // ==================== Error ====================
  static const TextStyle error = TextStyle(
    fontSize: 12,
    color: AppColors.error,
  );
}

