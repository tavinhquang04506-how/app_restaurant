import 'package:flutter/material.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Models/backend_models.dart';
import 'TableSelectionPage.dart';
import 'BookingDetailPage.dart';
import 'package:android/Service/BranchService.dart';
import 'package:android/Service/BookingService.dart';

class BookingMainPage extends StatefulWidget {
  const BookingMainPage({super.key});

  @override
  State<BookingMainPage> createState() => _BookingMainPage();
}

class _BookingMainPage extends State<BookingMainPage> {
  final BranchService _branchService = BranchService();
  final BookingService _bookingService = BookingService();
  final TextEditingController _noteController = TextEditingController();

  List<BranchModel> _branches = [];
  String? _selectedBranchId;
  bool _loadingBranches = false;
  String? _branchError;

  // Booking gần nhất từ lịch sử
  BookingResponseModel? _latestBooking;
  bool _loadingBooking = false;

  late DateTime _date;
  late TimeOfDay _time;
  int _guestCount = 4;
  int _durationMinutes = 120; // Mặc định 2 giờ

  BranchModel? get _currentBranch {
    try {
      return _branches.firstWhere((b) => b.id == _selectedBranchId);
    } catch (_) {
      return null;
    }
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();

    final args =
        ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
    if (args?['needBookingSnack'] == true) {
      final foodName = args?['foodName'] as String?;
      WidgetsBinding.instance.addPostFrameCallback((_) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              foodName != null && foodName.trim().isNotEmpty
                  ? 'Vui lòng đặt bàn để thưởng thức "$foodName".\n'
                      'Sau khi chọn bàn, bạn có thể đặt món trong phần đặt trước.'
                  : 'Vui lòng đặt bàn trước để thanh toán\n'
                      'Hoặc bấm "Chọn bàn khi đặt" ở mục Món đã chọn.',
            ),
          ),
        );
      });
    }
  }

  @override
  void initState() {
    super.initState();
    _initializeDefaultDateTime();
    _loadBranches();
    _loadLatestBooking();
  }

  void _initializeDefaultDateTime() {
    final now = DateTime.now().add(const Duration(minutes: 30));
    _date = DateTime(now.year, now.month, now.day);
    _time = TimeOfDay(hour: now.hour, minute: now.minute);
  }

  DateTime _combine(DateTime date, TimeOfDay time) {
    return DateTime(date.year, date.month, date.day, time.hour, time.minute);
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  Future<void> _loadBranches() async {
    setState(() {
      _loadingBranches = true;
      _branchError = null;
    });
    try {
      final res = await _branchService.getBranches();
      final data = res.data;
      setState(() {
        _branches = data;
        _selectedBranchId ??= data.isNotEmpty ? data.first.id : null;
      });
    } catch (error) {
      setState(() {
        _branchError = error.toString();
      });
    } finally {
      if (mounted) setState(() => _loadingBranches = false);
    }
  }

  Future<void> _loadLatestBooking() async {
    if (!AppSession.isLoggedIn) return;

    setState(() => _loadingBooking = true);

    try {
      final res = await _bookingService.getMyBookings();
      final bookings = res.data;
      bookings.sort((a, b) => b.reservedFrom.compareTo(a.reservedFrom));
      setState(() {
        _latestBooking = bookings.isNotEmpty ? bookings.first : null;
      });
    } catch (error) {
      setState(() => _latestBooking = null);
    } finally {
      if (mounted) setState(() => _loadingBooking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (!AppSession.isLoggedIn) {
      return Scaffold(
        backgroundColor: const Color(0xFF2B0C0C),
        appBar: AppBar(
          backgroundColor: const Color(0xFF2B0C0C),
          foregroundColor: Colors.white,
          title: const Text('Đặt Bàn'),
        ),
        body: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Spacer(),
              const Center(
                child: Text(
                  'Bạn cần đăng nhập để sử dụng tính năng đặt bàn.',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.white70, fontSize: 16),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/login');
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.redAccent,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Đăng nhập',
                    style: TextStyle(color: Colors.white, fontSize: 16),
                  ),
                ),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () {
                    Navigator.pushNamed(context, '/register');
                  },
                  style: OutlinedButton.styleFrom(
                    side: const BorderSide(color: Colors.white54),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Đăng ký',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
              const Spacer(),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFF2B0C0C),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2B0C0C),
        foregroundColor: Colors.white,
        title: const Text('Đặt Bàn'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 12),
            const Text(
              'Lịch đặt bàn của bạn',
              style: TextStyle(color: Colors.white, fontSize: 16),
            ),
            const SizedBox(height: 12),

            // ====== 1 LỊCH ĐANG CÓ (HOẶC CHƯA CÓ) ======
            _buildBookingSection(),

            const SizedBox(height: 24),

            // ==== Form chọn chi nhánh / ngày / giờ / số khách ====
            _buildForm(),

            const Spacer(),

            // Nút Đặt Bàn -> sang trang chọn bàn
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _onTapDatBan(context),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: const Text(
                  'Đặt Bàn Ngay',
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ====== PHẦN HIỂN THỊ 1 LỊCH ======
  Widget _buildBookingSection() {
    if (_loadingBooking) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.white24),
        ),
        child: const Center(
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Colors.white,
          ),
        ),
      );
    }

    if (_latestBooking == null) {
      return _buildNoBookingCard();
    }

    return _buildBookingCard(_latestBooking!);
  }

  Widget _buildBookingCard(BookingResponseModel booking) {
    final isUpcoming = booking.reservedFrom.isAfter(DateTime.now());
    final statusText = isUpcoming ? 'Sắp tới' : 'Đã qua';
    final statusColor = isUpcoming ? Colors.red : Colors.white54;

    return GestureDetector(
      onTap: () async {
        // Navigate đến trang chi tiết
        final changed = await Navigator.push<bool>(
          context,
          MaterialPageRoute(
            builder: (_) => BookingDetailPage(booking: booking),
          ),
        );
        if (changed == true) {
          _loadLatestBooking();
        }
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: isUpcoming ? Colors.red.shade300 : Colors.white24),
          color: isUpcoming ? Colors.red.withValues(alpha: 0.1) : Colors.white.withValues(alpha: 0.05),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Thông tin lịch đặt
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(
                        statusText,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: _getStatusColor(booking.status).withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(
                          _getStatusText(booking.status),
                          style: TextStyle(
                            color: _getStatusColor(booking.status),
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    booking.branch?.name ?? 'Chưa có thông tin chi nhánh',
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${booking.reservedFrom.day}/${booking.reservedFrom.month}/${booking.reservedFrom.year} - ${booking.reservedFrom.hour}:${booking.reservedFrom.minute.toString().padLeft(2, '0')}',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  Text(
                    '${booking.guests} người',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  if (booking.table != null)
                    Text(
                      'Bàn: ${booking.table!.tableCode}${booking.table!.location != null ? ' - ${booking.table!.location}' : ''}',
                      style: const TextStyle(color: Colors.white70),
                    ),
                ],
              ),
            ),

            // Icon mũi tên
            const Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
          ],
        ),
      ),
    );
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'PENDING':
        return 'Chờ xác nhận';
      case 'CONFIRMED':
        return 'Đã xác nhận';
      case 'COMPLETED':
        return 'Hoàn thành';
      case 'CANCELLED':
        return 'Đã hủy';
      default:
        return status;
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'CONFIRMED':
        return Colors.green;
      case 'COMPLETED':
        return Colors.blue;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildNoBookingCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: Colors.white24),
      ),
      child: const Text(
        'Bạn chưa có lịch đặt bàn nào.\n'
        'Hãy đặt trước để giữ chỗ và nhận ưu đãi thành viên.',
        style: TextStyle(color: Colors.white60),
      ),
    );
  }

  // --------- FORM ---------
  Widget _buildForm() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Chọn chi nhánh', style: TextStyle(color: Colors.white)),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF3A1C1C),
            borderRadius: BorderRadius.circular(8),
          ),
          child: _loadingBranches
              ? const Padding(
                  padding: EdgeInsets.all(12),
                  child: Center(
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: Colors.white,
                    ),
                  ),
                )
              : DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedBranchId,
                    dropdownColor: const Color(0xFF3A1C1C),
                    iconEnabledColor: Colors.white,
                    hint: const Text(
                      'Chọn chi nhánh',
                      style: TextStyle(color: Colors.white54),
                    ),
                    items: _branches
                        .map(
                          (branch) => DropdownMenuItem(
                            value: branch.id,
                            child: Text(
                              branch.name,
                              style: const TextStyle(color: Colors.white),
                            ),
                          ),
                        )
                        .toList(),
                    onChanged: (value) {
                      setState(() => _selectedBranchId = value);
                    },
                  ),
                ),
        ),
        if (_branchError != null) ...[
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: Text(
                  'Không thể tải chi nhánh: $_branchError',
                  style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                ),
              ),
              TextButton(
                onPressed: _loadBranches,
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ],
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(child: _buildDateField()),
            const SizedBox(width: 12),
            Expanded(child: _buildTimeField()),
          ],
        ),
        const SizedBox(height: 16),

        Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Số lượng khách', style: TextStyle(color: Colors.white)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.group, color: Colors.white),
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            if (_guestCount > 1) _guestCount--;
                          });
                        },
                        icon: const Icon(
                          Icons.remove_circle_outline,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        '$_guestCount',
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _guestCount++;
                          });
                        },
                        icon: const Icon(Icons.add_circle_outline, color: Colors.white),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Thời gian ở lại', style: TextStyle(color: Colors.white)),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Icon(Icons.access_time, color: Colors.white),
                      const SizedBox(width: 12),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            if (_durationMinutes > 30) {
                              _durationMinutes -= 30;
                            }
                          });
                        },
                        icon: const Icon(
                          Icons.remove_circle_outline,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        _formatDuration(_durationMinutes),
                        style: const TextStyle(color: Colors.white, fontSize: 16),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            // Giới hạn tối đa 2h30p = 150 phút
                            if (_durationMinutes < 150) {
                              _durationMinutes += 30;
                              // Đảm bảo không vượt quá 150 phút
                              if (_durationMinutes > 150) {
                                _durationMinutes = 150;
                              }
                            }
                          });
                        },
                        icon: const Icon(Icons.add_circle_outline, color: Colors.white),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        const Text(
          'Ghi chú cho nhà hàng',
          style: TextStyle(color: Colors.white),
        ),
        const SizedBox(height: 8),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFF3A1C1C),
            borderRadius: BorderRadius.circular(8),
          ),
          child: TextField(
            controller: _noteController,
            maxLines: 2,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Ví dụ: Bàn gần cửa sổ, chuẩn bị bánh sinh nhật...',
              hintStyle: TextStyle(color: Colors.white54),
              border: InputBorder.none,
              contentPadding: EdgeInsets.symmetric(
                horizontal: 12,
                vertical: 12,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildDateField() {
    return GestureDetector(
      onTap: () async {
        final picked = await showDatePicker(
          context: context,
          initialDate: _date,
          firstDate: DateTime.now(),
          lastDate: DateTime.now().add(const Duration(days: 365)),
        );
        if (picked != null) {
          setState(() => _date = picked);
          _ensureFutureSelection(showMessage: true);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF3A1C1C),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Text(
              '${_date.month}/${_date.day}/${_date.year}',
              style: const TextStyle(color: Colors.white),
            ),
            const Spacer(),
            const Icon(Icons.calendar_today, color: Colors.white),
          ],
        ),
      ),
    );
  }

  Widget _buildTimeField() {
    return GestureDetector(
      onTap: () async {
        final picked = await showTimePicker(
          context: context,
          initialTime: _time,
        );
        if (picked != null) {
          final combined = _combine(_date, picked);
          if (combined.isBefore(DateTime.now())) {
            _showTimeWarning();
            return;
          }
          setState(() => _time = picked);
        }
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
        decoration: BoxDecoration(
          color: const Color(0xFF3A1C1C),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Text(
              _time.format(context),
              style: const TextStyle(color: Colors.white),
            ),
            const Spacer(),
            const Icon(Icons.access_time, color: Colors.white),
          ],
        ),
      ),
    );
  }

  // --------- ĐẶT BÀN (CHUYỂN QUA CHỌN BÀN) ----------
  void _onTapDatBan(BuildContext context) {
    final branch = _currentBranch ?? _branches.first;
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => TableSelectionPage(
          branch: branch,
          date: _date,
          time: _time,
          guests: _guestCount,
          specialRequest: _noteController.text.trim(),
          durationMinutes: _durationMinutes,
        ),
      ),
    );
  }

  bool _ensureFutureSelection({bool showMessage = false}) {
    final combined = _combine(_date, _time);
    if (combined.isBefore(DateTime.now())) {
      if (showMessage) {
        _showTimeWarning();
      }
      return false;
    }
    return true;
  }

  void _showTimeWarning() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Vui lòng chọn thời gian sau thời điểm hiện tại.'),
      ),
    );
  }

  String _formatDuration(int minutes) {
    final hours = minutes ~/ 60;
    final mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return '${hours}h${mins}p';
    } else if (hours > 0) {
      return '${hours}h';
    } else {
      return '${mins}p';
    }
  }
}
