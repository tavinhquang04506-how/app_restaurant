import 'package:flutter/material.dart';

class FoodImagePlaceholder extends StatelessWidget {
  const FoodImagePlaceholder({
    super.key,
    this.width,
    this.height,
    this.borderRadius,
    this.iconSize,
  });

  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final double? iconSize;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(16);
    final resolvedIconSize = iconSize ?? _resolveIconSize();

    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: const Color(0xFF2B0F11),
        borderRadius: radius,
      ),
      child: Center(
        child: Icon(
          Icons.restaurant_menu,
          color: const Color(0xFFC7BBB0),
          size: resolvedIconSize,
        ),
      ),
    );
  }

  double _resolveIconSize() {
    final base = width ?? height ?? 80;
    final computed = base * 0.4;
    if (computed < 20) {
      return 20;
    }
    if (computed > 36) {
      return 36;
    }
    return computed;
  }
}
