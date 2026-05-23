import 'package:flutter/material.dart';
import 'package:android/Models/backend_models.dart';

class DetailPromotionPage extends StatelessWidget {
  final PromotionModel promo;

  const DetailPromotionPage({super.key, required this.promo});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF2A0E0E),
        foregroundColor: Colors.white,
        title: Text(promo.name.isNotEmpty ? promo.name : "Chi tiết ưu đãi"),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF2A0E0E), Color(0xFF1C0C0C)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: _buildImage(promo.displayImageUrl),
            ),
            const SizedBox(height: 16),
            Text(
              promo.name,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 22,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              promo.description ?? 'Không có mô tả',
              style: const TextStyle(
                color: Colors.white70,
                fontSize: 16,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              _buildDateRange(promo),
              style: const TextStyle(
                color: Colors.redAccent,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImage(String? url) {
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        height: 220,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _placeholder(),
      );
    }
    return _placeholder();
  }

  Widget _placeholder() {
    return Container(
      height: 220,
      color: Colors.white10,
      child: const Icon(Icons.local_offer, color: Colors.white54, size: 48),
    );
  }

  String _buildDateRange(PromotionModel p) {
    final start = p.startDate;
    final end = p.endDate;
    if (start == null && end == null) return 'Không thời hạn';
    String startStr = start != null
        ? '${start.day}/${start.month}/${start.year}'
        : 'Từ nay';
    String endStr =
        end != null ? '${end.day}/${end.month}/${end.year}' : 'Không giới hạn';
    return '$startStr - $endStr';
  }
}
