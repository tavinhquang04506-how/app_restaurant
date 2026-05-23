import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:android/Models/backend_models.dart';
import 'package:android/Utils/AppSession.dart';
import 'BookingDetailPage.dart';

import 'package:android/Service/BookingService.dart';

class BookingHistoryPage extends StatefulWidget {
  const BookingHistoryPage({super.key});

  @override
  State<BookingHistoryPage> createState() => _BookingHistoryPageState();
}

class _BookingHistoryPageState extends State<BookingHistoryPage>
    with SingleTickerProviderStateMixin {
  final BookingService _bookingService = BookingService();
  late DateFormat _dateFormatter;
  late DateFormat _timeFormatter;

  bool _loading = true;
  String? _error;
  List<BookingResponseModel> _upcoming = [];
  List<BookingResponseModel> _past = [];
  bool _localeReady = false;

  @override
  void initState() {
    super.initState();
    _initializeLocale();
  }

  Future<void> _initializeLocale() async {
    try {
      await initializeDateFormatting('vi_VN');
    } catch (_) {
      // ignore, fallback to default locale
    }

    if (!mounted) return;
    _dateFormatter = DateFormat('EEEE, dd MMMM', 'vi_VN');
    _timeFormatter = DateFormat('HH:mm', 'vi_VN');
    setState(() {
      _localeReady = true;
    });
    _loadBookings();
  }

  Future<void> _loadBookings() async {
    if (!_localeReady) {
      return;
    }

    if (!AppSession.isLoggedIn) {
      setState(() {
        _loading = false;
        _error = 'Vui lòng đăng nhập để xem lịch sử đặt bàn.';
        _upcoming = [];
        _past = [];
      });
      return;
    }

    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final res = await _bookingService.getMyBookings();
      final data = res.data;
      final now = DateTime.now();
      final upcoming = <BookingResponseModel>[];
      final past = <BookingResponseModel>[];

      for (final booking in data) {
        if (booking.reservedFrom.isAfter(now)) {
          upcoming.add(booking);
        } else {
          past.add(booking);
        }
      }

      upcoming.sort((a, b) => a.reservedFrom.compareTo(b.reservedFrom));
      past.sort((a, b) => b.reservedFrom.compareTo(a.reservedFrom));

      setState(() {
        _upcoming = upcoming;
        _past = past;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
        _upcoming = [];
        _past = [];
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 2,
      child: Scaffold(
        backgroundColor: const Color(0xFF1B0508),
        appBar: AppBar(
          backgroundColor: const Color(0xFF1B0508),
          foregroundColor: Colors.white,
          title: const Text("Lịch sử đặt bàn"),
          bottom: const TabBar(
            indicatorColor: Colors.red,
            labelColor: Colors.red,
            unselectedLabelColor: Colors.white70,
            tabs: [
              Tab(text: "Sắp tới"),
              Tab(text: "Đã qua"),
            ],
          ),
        ),
        body: _loading
            ? const Center(child: CircularProgressIndicator())
            : _error != null
            ? _buildError()
            : RefreshIndicator(
                onRefresh: _loadBookings,
                child: TabBarView(
                  children: [
                    _buildBookingList(_upcoming),
                    _buildBookingList(_past),
                  ],
                ),
              ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              _error ?? 'Không thể tải lịch sử đặt bàn',
              textAlign: TextAlign.center,
              style: const TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 12),
            ElevatedButton(
              onPressed: _loadBookings,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingList(List<BookingResponseModel> list) {
    if (list.isEmpty) {
      return const Center(
        child: Text(
          "Không có lịch sử",
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final item = list[index];
        return _buildBookingCard(item);
      },
    );
  }

  Widget _buildBookingCard(BookingResponseModel item) {
    final statusInfo = _statusDisplay(item.status);

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Material(
        color: const Color(0xFF2C1518),
        borderRadius: BorderRadius.circular(16),
        child: InkWell(
          borderRadius: BorderRadius.circular(16),
          onTap: () => _openDetail(item),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Expanded(
                      child: Text(
                        item.branchName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 16,
                        ),
                      ),
                    ),
                    if (statusInfo.label.isNotEmpty)
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 10,
                          vertical: 4,
                        ),
                        decoration: BoxDecoration(
                          color: statusInfo.color.withValues(alpha: 0.12),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              statusInfo.icon,
                              size: 14,
                              color: statusInfo.color,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              statusInfo.label,
                              style: TextStyle(
                                color: statusInfo.color,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Icon(
                      Icons.calendar_today,
                      size: 16,
                      color: Colors.white70,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _formatDate(item.reservedFrom),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(
                      Icons.access_time,
                      size: 16,
                      color: Colors.white70,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      _timeFormatter.format(item.reservedFrom.toLocal()),
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.person, size: 16, color: Colors.white70),
                    const SizedBox(width: 8),
                    Text(
                      '${item.guests} khách',
                      style: const TextStyle(
                        color: Colors.white70,
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: const [
                    Text(
                      "Xem chi tiết",
                      style: TextStyle(
                        color: Colors.red,
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    Icon(Icons.arrow_forward_ios, size: 14, color: Colors.red),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _openDetail(BookingResponseModel booking) async {
    final changed = await Navigator.of(context).push<bool>(
      MaterialPageRoute(builder: (_) => BookingDetailPage(booking: booking)),
    );
    if (changed == true) {
      _loadBookings();
    }
  }

  _StatusInfo _statusDisplay(String status) {
    switch (status) {
      case 'CONFIRMED':
      case 'CHECKED_IN':
        return _StatusInfo(
          color: Colors.green,
          label: 'Đã xác nhận',
          icon: Icons.check_circle,
        );
      case 'COMPLETED':
        return _StatusInfo(
          color: Colors.green,
          label: 'Đã hoàn thành',
          icon: Icons.task_alt,
        );
      case 'CANCELLED':
        return _StatusInfo(
          color: Colors.red,
          label: 'Đã hủy',
          icon: Icons.close,
        );
      default:
        return _StatusInfo(color: Colors.grey, label: '', icon: Icons.info);
    }
  }

  String _formatDate(DateTime value) {
    return _dateFormatter.format(value.toLocal());
  }
}

class _StatusInfo {
  const _StatusInfo({
    required this.color,
    required this.label,
    required this.icon,
  });

  final Color color;
  final String label;
  final IconData icon;
}
