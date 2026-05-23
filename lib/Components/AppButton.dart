import 'package:animate_do/animate_do.dart';
import 'package:flutter/material.dart';

/// Button chung cho toàn app - có animation bounce.
/// Dùng [size] để chọn kích thước: small (padding 15), medium (padding 20), large (padding 25).
class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onTap;
  final Color? color;
  final Color? textColor;
  final IconData? icon;
  final bool showArrow;
  final AppButtonSize size;
  final bool isLoading;
  final double? width;

  const AppButton({
    super.key,
    required this.text,
    this.onTap,
    this.color,
    this.textColor,
    this.icon,
    this.showArrow = true,
    this.size = AppButtonSize.medium,
    this.isLoading = false,
    this.width,
  });

  /// Constructor cho button nhỏ (tương đương MyButton2 cũ)
  const AppButton.small({
    super.key,
    required this.text,
    this.onTap,
    this.color,
    this.textColor,
    this.icon,
    this.showArrow = true,
    this.isLoading = false,
    this.width,
  }) : size = AppButtonSize.small;

  /// Constructor cho button lớn
  const AppButton.large({
    super.key,
    required this.text,
    this.onTap,
    this.color,
    this.textColor,
    this.icon,
    this.showArrow = true,
    this.isLoading = false,
    this.width,
  }) : size = AppButtonSize.large;

  double get _padding {
    switch (size) {
      case AppButtonSize.small:
        return 15;
      case AppButtonSize.medium:
        return 20;
      case AppButtonSize.large:
        return 25;
    }
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: isLoading ? null : onTap,
      child: Bounce(
        duration: const Duration(milliseconds: 200),
        child: Container(
          width: width,
          decoration: BoxDecoration(
            color: color ?? Colors.red,
            borderRadius: BorderRadius.circular(40),
          ),
          padding: EdgeInsets.all(_padding),
          margin: const EdgeInsets.all(5),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: width == null ? MainAxisSize.min : MainAxisSize.max,
            children: [
              if (isLoading)
                const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              else ...[
                if (icon != null) ...[
                  Icon(icon, color: textColor ?? Colors.white),
                  const SizedBox(width: 8),
                ],
                Text(
                  text,
                  style: TextStyle(
                    color: textColor ?? Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                if (showArrow) ...[
                  const SizedBox(width: 8),
                  Icon(
                    Icons.arrow_right_alt_outlined,
                    color: textColor ?? Colors.white,
                  ),
                ],
              ],
            ],
          ),
        ),
      ),
    );
  }
}

enum AppButtonSize { small, medium, large }

