import 'package:flutter/material.dart';

/// Overlay loading che toàn màn hình.
class LoadingOverlay extends StatelessWidget {
  final Color? backgroundColor;
  final Color? indicatorColor;

  const LoadingOverlay({
    super.key,
    this.backgroundColor,
    this.indicatorColor,
  });

  @override
  Widget build(BuildContext context) {
    return Positioned.fill(
      child: Container(
        color: backgroundColor ?? Colors.black45,
        child: Center(
          child: CircularProgressIndicator(
            strokeWidth: 3,
            color: indicatorColor ?? Colors.white,
          ),
        ),
      ),
    );
  }
}

/// Hiển thị loading overlay lên trên content.
/// Sử dụng: LoadingStack(isLoading: _isLoading, child: YourContent())
class LoadingStack extends StatelessWidget {
  final bool isLoading;
  final Widget child;
  final Color? overlayColor;
  final Color? indicatorColor;

  const LoadingStack({
    super.key,
    required this.isLoading,
    required this.child,
    this.overlayColor,
    this.indicatorColor,
  });

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        child,
        if (isLoading)
          LoadingOverlay(
            backgroundColor: overlayColor,
            indicatorColor: indicatorColor,
          ),
      ],
    );
  }
}

