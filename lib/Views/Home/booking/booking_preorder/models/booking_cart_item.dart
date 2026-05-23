import 'package:android/Models/backend_models.dart';
import 'package:flutter/material.dart';

class BookingCartItem {
  BookingCartItem({required this.food});

  final BranchFoodModel food;
  int quantity = 0;
  String? note;
  final TextEditingController noteController = TextEditingController();

  void dispose() {
    noteController.dispose();
  }
}

