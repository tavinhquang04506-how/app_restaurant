import 'package:flutter/material.dart';

import 'FoodImagePlaceHolder.dart';

/// Hiển thị ảnh món ăn từ URL (http/https) hoặc asset path.
/// Tự fallback về `FoodImagePlaceholder` khi rỗng/lỗi.
class FoodImage extends StatelessWidget {
  const FoodImage({
    super.key,
    required this.source,
    this.width,
    this.height,
    this.borderRadius,
    this.fit = BoxFit.cover,
    this.placeholderIconSize,
  });

  final String? source;
  final double? width;
  final double? height;
  final BorderRadius? borderRadius;
  final BoxFit fit;
  final double? placeholderIconSize;

  @override
  Widget build(BuildContext context) {
    final radius = borderRadius ?? BorderRadius.circular(16);
    final placeholder = FoodImagePlaceholder(
      width: width,
      height: height,
      borderRadius: radius,
      iconSize: placeholderIconSize,
    );

    final src = source;
    if (src == null || src.isEmpty) {
      return placeholder;
    }

    Widget image;
    if (src.startsWith('http')) {
      image = Image.network(
        src,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (context, error, stackTrace) => placeholder,
      );
    } else {
      image = Image.asset(
        src,
        width: width,
        height: height,
        fit: fit,
        errorBuilder: (context, error, stackTrace) => placeholder,
      );
    }

    return ClipRRect(
      borderRadius: radius,
      child: image,
    );
  }
}


