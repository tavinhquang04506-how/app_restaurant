import 'package:flutter/material.dart';

class QuantityControl extends StatelessWidget {
  const QuantityControl({
    super.key,
    required this.quantity,
    required this.onAdd,
    this.onRemove,
  });

  final int quantity;
  final VoidCallback? onRemove;
  final VoidCallback onAdd;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        IconButton(
          onPressed: onRemove,
          icon: const Icon(Icons.remove_circle_outline),
          color: onRemove == null ? Colors.white24 : Colors.white,
        ),
        Text(
          '$quantity',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        IconButton(
          onPressed: onAdd,
          icon: const Icon(Icons.add_circle_outline),
          color: Colors.redAccent,
        ),
      ],
    );
  }
}

