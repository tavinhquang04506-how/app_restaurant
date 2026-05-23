import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:intl/date_symbol_data_local.dart';

import 'package:android/Models/backend_models.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';
import 'package:android/Service/BookingService.dart';
import 'package:android/Utils/ApiConfig.dart';
import 'package:android/Utils/Utils.dart';

class BookingDetailPage extends StatefulWidget {
  const BookingDetailPage({super.key, required this.booking});

  final BookingResponseModel booking;

  @override
  State<BookingDetailPage> createState() => _BookingDetailPageState();
}

class _BookingDetailPageState extends State<BookingDetailPage> {
  final BookingService _bookingService = BookingService();
  late NumberFormat _currency;
  late DateFormat _dateFormatter;
  late DateFormat _timeFormatter;
  bool _localeReady = false;
  bool _isCancelling = false;
  int _selectedRating = 5;

  @override
  void initState() {
    super.initState();
    _initializeLocale();
  }

  Future<void> _initializeLocale() async {
    try {
      await initializeDateFormatting('vi_VN');
    } catch (_) {
      // Fallback to default locale if vi_VN is not available
    }

    if (!mounted) return;

    _currency = NumberFormat.currency(
      locale: 'vi_VN',
      symbol: '',
      decimalDigits: 0,
    );
    _dateFormatter = DateFormat('EEEE, dd MMMM yyyy', 'vi_VN');
    _timeFormatter = DateFormat('HH:mm', 'vi_VN');

    setState(() {
      _localeReady = true;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (!_localeReady) {
      return Scaffold(
        backgroundColor: const Color(0xFF0F0506),
        appBar: AppBar(
          backgroundColor: const Color(0xFF0F0506),
          elevation: 0,
          foregroundColor: Colors.white,
          title: const Text('Chi tiết Đặt bàn'),
        ),
        body: const Center(
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }
    final statusInfo = _statusDisplay(widget.booking.status);
    final reservedDate = widget.booking.reservedFrom.toLocal();

    return Scaffold(
      backgroundColor: const Color(0xFF0F0506),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F0506),
        elevation: 0,
        foregroundColor: Colors.white,
        title: const Text('Chi tiết Đặt bàn'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildStatusBanner(statusInfo),
            const SizedBox(height: 16),
            _buildVenueCard(),
            const SizedBox(height: 16),
            _buildBookingInfo(reservedDate),
            if ((widget.booking.specialRequest ?? '').isNotEmpty) ...[
              const SizedBox(height: 16),
              _buildSpecialRequest(),
            ],
            const SizedBox(height: 16),
            _buildDishSection(),
            const SizedBox(height: 16),
            _buildSummarySection(),
            const SizedBox(height: 32),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomActions(context),
    );
  }

  Widget _buildStatusBanner(_StatusInfo info) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: info.color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Icon(info.icon, color: info.color, size: 28),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  info.title,
                  style: TextStyle(
                    color: info.color,
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  info.description,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildVenueCard() {
    final branch = widget.booking.branch;
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildHeroImage(),
          const SizedBox(height: 12),
          Text(
            branch?.name ?? 'Nhà hàng',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
          ),
          if ((branch?.address ?? '').isNotEmpty) ...[
            const SizedBox(height: 4),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on, color: Colors.white54, size: 16),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    branch!.address,
                    style: const TextStyle(color: Colors.white70, fontSize: 13),
                  ),
                ),
              ],
            ),
          ],
          if ((branch?.phone ?? '').isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              children: [
                const Icon(Icons.phone, color: Colors.white54, size: 16),
                const SizedBox(width: 6),
                Text(
                  branch!.phone,
                  style: const TextStyle(color: Colors.white70, fontSize: 13),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildHeroImage() {
    final imageUrl = _primaryImageUrl();
    final borderRadius = BorderRadius.circular(16);
    final placeholder = ClipRRect(
      borderRadius: borderRadius,
      child: FoodImagePlaceholder(
        height: 150,
        borderRadius: borderRadius,
        iconSize: 32,
      ),
    );

    if (imageUrl == null || imageUrl.isEmpty) {
      return placeholder;
    }

    if (imageUrl.startsWith('http')) {
      return ClipRRect(
        borderRadius: borderRadius,
        child: Image.network(
          imageUrl,
          height: 150,
          width: double.infinity,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      );
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: Image.asset(
        imageUrl,
        height: 150,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      ),
    );
  }

  Widget _buildBookingInfo(DateTime reservedDate) {
    final time = widget.booking.reservedFrom.toLocal();
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Chi tiết đặt bàn',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _buildInfoRow(
            Icons.calendar_today,
            _dateFormatter.format(reservedDate),
          ),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.access_time, _timeFormatter.format(time)),
          const SizedBox(height: 8),
          _buildInfoRow(Icons.person, '${widget.booking.guests} người'),
          const SizedBox(height: 8),
          _buildInfoRow(
            Icons.event_seat,
            widget.booking.tableCode.isNotEmpty ? 'Bàn ${widget.booking.tableCode}' : '--',
          ),
        ],
      ),
    );
  }

  Widget _buildSpecialRequest() {
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Ghi chú cho nhà hàng',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            widget.booking.specialRequest!.trim(),
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ],
      ),
    );
  }

  Widget _buildDishSection() {
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Các món đã chọn',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          if (widget.booking.dishes.isEmpty)
            const Text(
              'Không có món nào được đặt trước',
              style: TextStyle(color: Colors.white54, fontSize: 13),
            )
          else
            ...widget.booking.dishes.map((dish) {
              final isLast = widget.booking.dishes.last == dish;
              return Column(
                children: [
                  _buildDishTile(dish),
                  if (!isLast)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 12),
                      child: Divider(height: 1, color: Colors.white12),
                    ),
                ],
              );
            }),
        ],
      ),
    );
  }

  Widget _buildDishTile(BookingDishModel dish) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildDishImage(dish.food?.imageUrl),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                dish.food?.name ?? 'Món ăn',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                'Số lượng: ${dish.quantity}',
                style: const TextStyle(color: Colors.white54, fontSize: 12),
              ),
              if ((dish.specialNote ?? '').isNotEmpty)
                Text(
                  'Ghi chú: ${dish.specialNote}',
                  style: const TextStyle(color: Colors.white54, fontSize: 12),
                ),
            ],
          ),
        ),
        Text(
          _formatCurrency(dish.totalPrice),
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  Widget _buildDishImage(String? url) {
    final borderRadius = BorderRadius.circular(12);
    final placeholder = FoodImagePlaceholder(
      width: 56,
      height: 56,
      borderRadius: borderRadius,
    );

    if (url == null || url.isEmpty) {
      return placeholder;
    }

    if (url.startsWith('http')) {
      return ClipRRect(
        borderRadius: borderRadius,
        child: Image.network(
          url,
          width: 56,
          height: 56,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      );
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: Image.asset(
        url,
        width: 56,
        height: 56,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      ),
    );
  }

  Widget _buildSummarySection() {
    final subtotal = widget.booking.computedSubtotal;
    final discount = widget.booking.computedDiscount;
    final total = widget.booking.computedTotal;
    return _buildCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Tổng quan chi phí',
            style: TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 12),
          _buildAmountRow('Tạm tính', subtotal),
          const SizedBox(height: 8),
          _buildAmountRow('Ưu đãi áp dụng', discount, isDiscount: true),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Divider(height: 1, color: Colors.white12),
          ),
          _buildAmountRow('Tổng cộng', total, emphasize: true),
        ],
      ),
    );
  }

  Widget _buildBottomActions(BuildContext context) {
    final status = widget.booking.status;

    // Nếu booking còn "CONFIRMED" thì cho phép huỷ
    if (status == 'CONFIRMED' || status == 'CHECKED_IN') {
      return Container(
        padding: EdgeInsets.only(
          left: 16,
          right: 16,
          top: 12,
          bottom: 24 + MediaQuery.of(context).padding.bottom / 2,
        ),
        color: const Color(0xFF0F0506),
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton.icon(
            onPressed: _isCancelling ? null : () => _confirmAndCancel(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
            icon: _isCancelling
                ? const SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  )
                : const Icon(Icons.cancel_outlined),
            label: Text(_isCancelling ? 'Đang huỷ...' : 'Huỷ đặt bàn'),
          ),
        ),
      );
    }

    // Chỉ khi COMPLETED mới hiện như hiện tại (Đánh giá / Đặt lại)
    if (status != 'COMPLETED') {
      return const SizedBox.shrink();
    }

    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 12,
        bottom: 24 + MediaQuery.of(context).padding.bottom / 2,
      ),
      color: const Color(0xFF0F0506),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton(
              onPressed: () => _showRatingDialog(context),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.white,
                side: const BorderSide(color: Colors.white24),
              ),
              child: const Text('Đánh giá món ăn'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: ElevatedButton(
              onPressed: () =>
                  _showToast(context, 'Hãy đặt lại từ màn hình chính'),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFD43F31),
                foregroundColor: Colors.white,
              ),
              child: const Text('Đặt lại'),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _confirmAndCancel(BuildContext context) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: const Color(0xFF1E0F11),
        title: const Text('Huỷ đặt bàn', style: TextStyle(color: Colors.white)),
        content: const Text(
          'Bạn chắc chắn muốn huỷ đặt bàn này?',
          style: TextStyle(color: Colors.white70),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Không', style: TextStyle(color: Colors.white70)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              foregroundColor: Colors.white,
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Huỷ booking'),
          ),
        ],
      ),
    );

    if (ok != true) return;

    setState(() => _isCancelling = true);
    try {
      await _bookingService.cancelBooking(widget.booking.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Đã huỷ đặt bàn thành công.')),
      );
      Navigator.pop(context, true);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Huỷ đặt bàn thất bại: ${extractErrorMessage(e)}')),
      );
    } finally {
      setState(() => _isCancelling = false);
    }
  }

  Widget _buildCard({required Widget child}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E0F11),
        borderRadius: BorderRadius.circular(20),
      ),
      child: child,
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 16, color: Colors.white54),
        const SizedBox(width: 8),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(color: Colors.white70, fontSize: 13),
          ),
        ),
      ],
    );
  }

  Widget _buildAmountRow(
    String label,
    int value, {
    bool emphasize = false,
    bool isDiscount = false,
  }) {
    final displayValue = isDiscount && value > 0
        ? '-${_formatCurrency(value)}'
        : _formatCurrency(value);
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: Colors.white70,
            fontSize: 13,
            fontWeight: emphasize ? FontWeight.w600 : FontWeight.w500,
          ),
        ),
        Text(
          displayValue,
          style: TextStyle(
            color: emphasize ? Colors.redAccent : Colors.white,
            fontSize: emphasize ? 18 : 14,
            fontWeight: FontWeight.w600,
          ),
        ),
      ],
    );
  }

  String? _primaryImageUrl() {
    // Ưu tiên ảnh chi nhánh
    final branchImageUrl = widget.booking.branch?.imageUrl;
    if (branchImageUrl != null && branchImageUrl.isNotEmpty) {
      return _buildImageUrl(branchImageUrl, 'branch');
    }
    
    // Fallback: lấy ảnh từ món ăn đầu tiên
    for (final dish in widget.booking.dishes) {
      final url = dish.food?.imageUrl;
      if (url != null && url.isNotEmpty) {
        return _buildImageUrl(url, 'food');
      }
    }
    return null;
  }

  String _buildImageUrl(String fileName, String folder) {
    // Nếu đã là full URL thì trả về luôn
    if (fileName.startsWith('http://') || fileName.startsWith('https://')) {
      return fileName;
    }
    // Build URL từ storage
    final basePath = buildApiBasePath();
    return '$basePath/storage/$folder/$fileName';
  }

  String _formatCurrency(int value) => '${_currency.format(value)}đ';

  void _showToast(BuildContext context, String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  Future<void> _showRatingDialog(BuildContext context) async {
    int tempRating = _selectedRating;
    final commentController = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (ctx) {
        return AlertDialog(
          backgroundColor: const Color(0xFF1E0F11),
          title: const Text(
            'Đánh giá món ăn',
            style: TextStyle(color: Colors.white),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Đánh giá sẽ áp dụng cho tất cả món trong đơn này.',
                style: TextStyle(color: Colors.white70, fontSize: 13),
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(5, (index) {
                  final value = index + 1;
                  return IconButton(
                    icon: Icon(
                      Icons.star,
                      color: value <= tempRating
                          ? Colors.orangeAccent
                          : Colors.white24,
                    ),
                    onPressed: () {
                      tempRating = value;
                      (ctx as Element).markNeedsBuild();
                    },
                  );
                }),
              ),
              const SizedBox(height: 8),
              TextField(
                controller: commentController,
                maxLines: 3,
                style: const TextStyle(color: Colors.white),
                decoration: const InputDecoration(
                  hintText: 'Nhận xét thêm (không bắt buộc)',
                  hintStyle: TextStyle(color: Colors.white38),
                  filled: true,
                  fillColor: Color(0xFF2A181B),
                  border: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.white24),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.redAccent),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(ctx).pop(false),
              child: const Text(
                'Đóng',
                style: TextStyle(color: Colors.white70),
              ),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                foregroundColor: Colors.white,
              ),
              onPressed: () => Navigator.of(ctx).pop(true),
              child: const Text('Gửi đánh giá'),
            ),
          ],
        );
      },
    );

    if (result == true) {
      setState(() {
        _selectedRating = tempRating;
      });
      try {
        await _bookingService.rateFoodsInBooking(
          bookingId: widget.booking.id,
          rating: _selectedRating,
          comment: commentController.text.trim().isEmpty
              ? null
              : commentController.text.trim(),
        );
        _showToast(context, 'Đã gửi đánh giá thành công');
      } catch (e) {
        _showToast(context, 'Gửi đánh giá thất bại: $e');
      }
    }
  }

  _StatusInfo _statusDisplay(String status) {
    switch (status) {
      case 'CONFIRMED':
      case 'CHECKED_IN':
        return _StatusInfo(
          color: Colors.green,
          icon: Icons.check_circle_rounded,
          title: 'Đã xác nhận!',
          description: 'Nhà hàng đã sẵn sàng chào đón bạn.',
        );
      case 'COMPLETED':
        return _StatusInfo(
          color: Colors.green,
          icon: Icons.task_alt_rounded,
          title: 'Đã hoàn thành!',
          description: 'Cảm ơn bạn đã ghé thăm nhà hàng.',
        );
      case 'CANCELLED':
        return _StatusInfo(
          color: Colors.redAccent,
          icon: Icons.cancel_rounded,
          title: 'Đặt bàn đã hủy',
          description: 'Đặt bàn này đã bị hủy hoặc hết hiệu lực.',
        );
      default:
        return _StatusInfo(
          color: Colors.orangeAccent,
          icon: Icons.info_outline,
          title: 'Đang xử lý',
          description: 'Vui lòng đợi nhà hàng xác nhận.',
        );
    }
  }
}

class _StatusInfo {
  const _StatusInfo({
    required this.color,
    required this.icon,
    required this.title,
    required this.description,
  });

  final Color color;
  final IconData icon;
  final String title;
  final String description;
}
