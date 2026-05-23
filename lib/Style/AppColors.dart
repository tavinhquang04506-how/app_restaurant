import 'package:flutter/material.dart';

/// Centralized color constants for the entire app.
/// Sử dụng: AppColors.primary, AppColors.background, etc.
class AppColors {
  AppColors._(); // Prevent instantiation

  // ==================== Primary Colors ====================
  static const Color primary = Color(0xFFEC1325);       // Đỏ chính
  static const Color primaryDark = Color(0xFF603B3E);   // Nâu đậm
  static const Color primaryLight = Color(0xFF8A5A5E);  // Nâu nhạt
  static const Color accent = Color(0xFFB98C8F);        // Hồng nâu

  // ==================== Background Colors ====================
  static const Color background = Color(0xFFF3E7E4);    // Nền kem
  static const Color backgroundDark = Color(0xFF221012);
  static const Color backgroundLight = Color(0xFFF8F6F6);
  static const Color cardBackground = Colors.white;

  // ==================== Text Colors ====================
  static const Color textPrimary = Color(0xFF333333);
  static const Color textSecondary = Color(0xFF666666);
  static const Color textHint = Colors.grey;
  static const Color textOnPrimary = Colors.white;
  static const Color textLink = Colors.orange;

  // ==================== Status Colors ====================
  static const Color success = Color(0xFF4CAF50);
  static const Color error = Color(0xFFE53935);
  static const Color warning = Color(0xFFFF9800);
  static const Color info = Color(0xFF2196F3);

  // ==================== Border Colors ====================
  static const Color border = Color(0xFFE0E0E0);
  static Color get borderLight => Colors.grey.shade200;
  static Color get borderMedium => Colors.grey.shade300;

  // ==================== Overlay Colors ====================
  static Color get overlay => Colors.black.withOpacity(0.7);
  static Color get overlayLight => Colors.black45;

  // ==================== Gradients ====================
  static const LinearGradient primaryGradient = LinearGradient(
    begin: Alignment.topCenter,
    colors: [primaryDark, primaryLight, accent],
  );

  static LinearGradient get primaryGradientWithOpacity => LinearGradient(
    begin: Alignment.topCenter,
    colors: [
      primaryDark.withOpacity(0.8),
      primaryLight.withOpacity(0.8),
      accent.withOpacity(0.8),
    ],
  );

  static const LinearGradient forgotPasswordGradient = LinearGradient(
    begin: Alignment.topCenter,
    colors: [Color(0xFF8B5A3C), backgroundLight, backgroundDark],
  );
}

