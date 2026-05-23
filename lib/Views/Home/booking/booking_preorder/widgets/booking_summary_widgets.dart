import 'package:flutter/material.dart';
import 'package:android/Models/backend_models.dart';

class BookingSummaryCard extends StatelessWidget {
  const BookingSummaryCard({
    super.key,
    required this.branch,
    required this.date,
    required this.time,
    required this.guests,
    required this.table,
  });

  final BranchModel branch;
  final DateTime date;
  final TimeOfDay time;
  final int guests;
  final TableAvailabilityModel table;

  String _formatDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            branch.name,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            '${_formatDate(date)} • ${time.format(context)}',
            style: const TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 2),
          Text(
            'Chi nhánh: ${branch.address}',
            style: const TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 2),
          Text(
            'Bàn: ${table.tableCode ?? 'Chưa chọn'} • $guests khách',
            style: const TextStyle(color: Colors.white60, fontSize: 13),
          ),
          const SizedBox(height: 12),
          const Text(
            'Bạn có thể tiếp tục chọn món ở tab Thực đơn.',
            style: TextStyle(color: Colors.white38, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

class CompactBookingChip extends StatelessWidget {
  const CompactBookingChip({
    super.key,
    required this.branch,
    required this.date,
    required this.time,
    required this.guests,
    required this.table,
  });

  final BranchModel branch;
  final DateTime date;
  final TimeOfDay time;
  final int guests;
  final TableAvailabilityModel table;

  String _formatDate(DateTime date) =>
      '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}';

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF242427),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.white12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            branch.name,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 15,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            '${_formatDate(date)} • ${time.format(context)}',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 2),
          Text(
            '$guests khách • Bàn ${table.tableCode ?? 'Chưa chọn'}',
            style: const TextStyle(color: Colors.white54, fontSize: 12),
          ),
        ],
      ),
    );
  }
}

