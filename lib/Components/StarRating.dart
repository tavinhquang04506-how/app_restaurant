import 'package:flutter/material.dart';

class StarRating extends StatelessWidget {
  final double rating;
  final double starSize;
  final bool showNumber;
  final Color starColor;

  const StarRating({
    super.key,
    required this.rating,
    this.starSize = 16,
    this.showNumber = false,
    this.starColor = Colors.orangeAccent,
  });

  @override
  Widget build(BuildContext context) {
    final int fullStars = rating.floor();
    final bool hasHalfStar = (rating - fullStars) >= 0.5;
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (int i = 0; i < 5; i++) ...[
          Icon(
            i < fullStars
                ? Icons.star
                : (i == fullStars && hasHalfStar)
                    ? Icons.star_half
                    : Icons.star_border,
            color: starColor,
            size: starSize,
          ),
        ],
        if (showNumber) ...[
          const SizedBox(width: 4),
          Text(
            rating.toStringAsFixed(1),
            style: TextStyle(
              color: Colors.white70,
              fontSize: starSize * 0.75,
            ),
          ),
        ],
      ],
    );
  }
}

