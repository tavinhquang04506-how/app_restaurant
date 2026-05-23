import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:android/Style/styles.dart';
import 'ClosePageButton.dart';
import 'LoadingOverlay.dart';

/// Layout chung cho các trang Auth (Login, Register, ForgotPassword).
/// 
/// Bao gồm:
/// - Background image hoặc gradient
/// - Dark overlay (tùy chọn)
/// - Header với title và subtitle (có animation)
/// - Card trắng bo góc chứa form
/// - Close button
/// - Loading overlay
class AuthPageLayout extends StatelessWidget {
  final String title;
  final String subtitle;
  final Widget child;
  final bool isLoading;
  final String? backgroundImage;
  final Gradient? backgroundGradient;
  final bool showDarkOverlay;
  final String closeButtonRoute;
  final Color cardColor;
  final Widget? headerExtra; // Logo hoặc widget thêm bên cạnh title

  const AuthPageLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.child,
    this.isLoading = false,
    this.backgroundImage,
    this.backgroundGradient,
    this.showDarkOverlay = true,
    this.closeButtonRoute = '/intropage',
    this.cardColor = AppColors.background,
    this.headerExtra,
  });

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Background
          _buildBackground(),
          
          // Dark overlay (optional)
          if (showDarkOverlay) _buildDarkOverlay(),
          
          // Main content
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 60),
              
              // Close button
              Align(
                alignment: Alignment.topRight,
                child: Padding(
                  padding: const EdgeInsets.only(right: 20),
                  child: ClosePageButton(navigateTo: closeButtonRoute),
                ),
              ),
              
              const SizedBox(height: 10),
              
              // Header
              _buildHeader(),
              
              const SizedBox(height: 20),
              
              // Card form
              Expanded(child: _buildCard()),
            ],
          ),
          
          // Loading overlay
          if (isLoading) const LoadingOverlay(),
        ],
      ),
    );
  }

  Widget _buildBackground() {
    if (backgroundImage != null) {
      return Positioned.fill(
        child: Image.asset(
          backgroundImage!,
          fit: BoxFit.cover,
        ),
      );
    }
    
    if (backgroundGradient != null) {
      return Positioned.fill(
        child: Container(
          decoration: BoxDecoration(gradient: backgroundGradient),
        ),
      );
    }
    
    // Default gradient
    return Positioned.fill(
      child: Container(
        decoration: const BoxDecoration(gradient: AppColors.primaryGradient),
      ),
    );
  }

  Widget _buildDarkOverlay() {
    return Positioned.fill(
      child: Container(color: AppColors.overlay),
    );
  }

  Widget _buildHeader() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 30),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          FadeInDown(
            duration: const Duration(milliseconds: 900),
            child: Row(
              children: [
                Expanded(
                  child: Text(title, style: AppTextStyles.heading1),
                ),
                if (headerExtra != null) ...[
                  const SizedBox(width: 15),
                  headerExtra!,
                ],
              ],
            ),
          ),
          const SizedBox(height: 8),
          FadeInDown(
            duration: const Duration(milliseconds: 1200),
            child: Text(subtitle, style: AppTextStyles.subtitle1),
          ),
        ],
      ),
    );
  }

  Widget _buildCard() {
    return Container(
      decoration: BoxDecoration(
        color: cardColor,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(60),
          topRight: Radius.circular(60),
        ),
      ),
      child: SingleChildScrollView(
        child: Padding(
          padding: const EdgeInsets.all(30),
          child: child,
        ),
      ),
    );
  }
}

/// Button submit form trong auth pages
class AuthSubmitButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final Color? color;
  final int animationDuration;

  const AuthSubmitButton({
    super.key,
    required this.text,
    this.onPressed,
    this.isLoading = false,
    this.color,
    this.animationDuration = 1800,
  });

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      duration: Duration(milliseconds: animationDuration),
      child: MaterialButton(
        onPressed: isLoading ? null : onPressed,
        height: 50,
        minWidth: double.infinity,
        color: color ?? AppColors.primary,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(999),
        ),
        child: isLoading
            ? const SizedBox(
                height: 20,
                width: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                ),
              )
            : Text(text, style: AppTextStyles.button),
      ),
    );
  }
}

/// Link text trong auth pages (vd: "Đã có tài khoản? Đăng nhập")
class AuthLinkText extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final Color? color;

  const AuthLinkText({
    super.key,
    required this.text,
    this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Text(
        text,
        style: AppTextStyles.link.copyWith(color: color),
      ),
    );
  }
}

/// Animated text field wrapper
class AnimatedTextField extends StatelessWidget {
  final Widget child;
  final int duration;

  const AnimatedTextField({
    super.key,
    required this.child,
    this.duration = 1400,
  });

  @override
  Widget build(BuildContext context) {
    return FadeInUp(
      duration: Duration(milliseconds: duration),
      child: child,
    );
  }
}

