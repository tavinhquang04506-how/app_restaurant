import 'package:flutter/material.dart';

class NotificationItem {
  final IconData icon;
  final String title;
  final String description;
  final String time;
  final bool isPromo;
  final String? image;

  NotificationItem({
    required this.icon,
    required this.title,
    required this.description,
    required this.time,
    this.isPromo = false,
    this.image,
  });
}


