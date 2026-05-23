import 'package:flutter/material.dart';

/// Nút đóng trang (thường dùng ở góc phải trên).
class ClosePageButton extends StatelessWidget {
  final VoidCallback? onTap;
  final String? navigateTo;
  final Color? backgroundColor;
  final Color? iconColor;
  final double size;

  const ClosePageButton({
    super.key,
    this.onTap,
    this.navigateTo,
    this.backgroundColor,
    this.iconColor,
    this.size = 24,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap ??
          () {
            if (navigateTo != null) {
              Navigator.pushNamedAndRemoveUntil(
                context,
                navigateTo!,
                (route) => false,
              );
            } else {
              Navigator.pop(context);
            }
          },
      child: Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(
          color: backgroundColor ?? Colors.black.withValues(alpha: 0.4),
          shape: BoxShape.circle,
        ),
        child: Icon(
          Icons.close,
          color: iconColor ?? Colors.white,
          size: size,
        ),
      ),
    );
  }
}

