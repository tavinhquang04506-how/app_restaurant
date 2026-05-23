import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Models/backend_models.dart';
import 'booking_preorder/BookingPreorderPage.dart';
import 'package:android/Service/BookingService.dart';

class TableSelectionPage extends StatefulWidget {
  final BranchModel branch;
  final DateTime date;
  final TimeOfDay time;
  final int guests;
  final String? specialRequest;
  final int durationMinutes;

  const TableSelectionPage({
    super.key,
    required this.branch,
    required this.date,
    required this.time,
    required this.guests,
    this.specialRequest,
    this.durationMinutes = 120,
  });

  @override
  State<TableSelectionPage> createState() => _TableSelectionPageState();
}

class _TableSelectionPageState extends State<TableSelectionPage> {
  final BookingService _bookingService = BookingService();
  List<TableAvailabilityModel> _tables = [];
  bool _loading = true;
  String? _error;
  TableAvailabilityModel? _selectedTable;
  int _filterIndex = 0;

  final DateFormat _timeFormatter = DateFormat('HH:mm');

  List<TableAvailabilityModel> get _filteredTables {
    switch (_filterIndex) {
      case 1:
        return _tables.where((table) => !table.booked).toList();
      case 2:
        return _tables.where((table) => table.booked).toList();
      default:
        return _tables;
    }
  }

  DateTime get _reservedFrom => DateTime(
        widget.date.year,
        widget.date.month,
        widget.date.day,
        widget.time.hour,
        widget.time.minute,
      );

  @override
  void initState() {
    super.initState();
    _loadAvailability();
  }

  Future<void> _loadAvailability() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final res = await _bookingService.getTableAvailability(
        branchId: widget.branch.id,
        start: _reservedFrom,
        guests: widget.guests,
        durationMinutes: widget.durationMinutes,
      );
      setState(() {
        _tables = res.data;
        _selectedTable = null;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
      });
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        elevation: 0,
        foregroundColor: Colors.white,
        title: const Text("Chọn Bàn Của Bạn"),
      ),
      body: Column(
        children: [
          _buildHeaderInfo(),
          Row(
            children: [
              Expanded(child: _buildAreaTabs()),
              IconButton(
                onPressed: _loadAvailability,
                icon: const Icon(Icons.refresh, color: Colors.white),
              ),
            ],
          ),
          Expanded(child: _buildTableGrid()),
          if (_selectedTable != null) _buildBottomConfirm(),
        ],
      ),
    );
  }

  // Header thong tin dat ban
  Widget _buildHeaderInfo() {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _iconText(
              Icons.calendar_today,
              "${widget.date.day}/${widget.date.month}"),
          _iconText(Icons.access_time, widget.time.format(context)),
          _iconText(Icons.people, "${widget.guests} người"),
          _iconText(Icons.store_mall_directory,
              widget.branch.name),
        ],
      ),
    );
  }

  Widget _iconText(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, color: Colors.white60, size: 18),
        const SizedBox(width: 4),
        Text(
          text,
          style: const TextStyle(color: Colors.white, fontSize: 13),
        ),
      ],
    );
  }

  // Tab khu vuc: tat ca / trong / da dat
  Widget _buildAreaTabs() {
    const filters = ["Tất cả", "Đang trống", "Đã đặt"];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: Row(
        children: filters.asMap().entries.map((entry) {
          final index = entry.key;
          final label = entry.value;
          final bool active = _filterIndex == index;
          return GestureDetector(
            onTap: () {
              setState(() => _filterIndex = index);
            },
            child: Container(
              margin: const EdgeInsets.only(right: 8),
              padding:
                  const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: active ? Colors.red : Colors.grey.shade800,
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                label,
                style: TextStyle(
                  color: active ? Colors.white : Colors.white70,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // Luoi danh sach ban
  Widget _buildTableGrid() {
    if (_loading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Không thể tải danh sách bàn.',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: const TextStyle(color: Colors.white38, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            ElevatedButton(
              onPressed: _loadAvailability,
              child: const Text('Thử lại'),
            ),
          ],
        ),
      );
    }

    if (_tables.isEmpty) {
      return const Center(
        child: Text(
          'Chưa có bàn nào cho thời gian này.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    final tables = _filteredTables;
    if (tables.isEmpty) {
      return const Center(
        child: Text(
          'Không có bàn phù hợp với bộ lọc hiện tại.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    return GridView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: tables.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1,
      ),
      itemBuilder: (context, index) {
        final table = tables[index];
        final bool isSelected = _selectedTable?.tableId == table.tableId;
        final bool isBooked = table.booked;

        return GestureDetector(
          onTap: isBooked
              ? null
              : () {
                  setState(() => _selectedTable = table);
                },
          child: Container(
            decoration: BoxDecoration(
              color: isSelected
                  ? Colors.amber.shade700
                  : isBooked
                      ? Colors.grey.shade800
                      : Colors.green.shade700,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: isSelected ? Colors.amberAccent : Colors.transparent,
                width: 2,
              ),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  table.tableCode,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${table.capacity} khách',
                  style: const TextStyle(color: Colors.white70, fontSize: 12),
                ),
                if (isBooked && table.reservedFrom != null &&
                    table.reservedTo != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 4),
                    child: Text(
                      '${_formatTime(table.reservedFrom!)} - ${_formatTime(table.reservedTo!)}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 10,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        );
      },
    );
  }

  // Thanh duoi: xac nhan ban da chon
  Widget _buildBottomConfirm() {
    final table = _selectedTable;
    if (table == null) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(color: Color(0xFF1A1A1A)),
      child: Row(
        children: [
          Expanded(
            child: ElevatedButton(
              onPressed: _confirmTable,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.amber.shade700,
              ),
              child: Text("Xác nhận ${table.tableCode}"),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final vietnamTime = dateTime.toUtc().add(const Duration(hours: 7));
    return _timeFormatter.format(vietnamTime);
  }

  // Tao booking va chuyen sang buoc preorder
  void _confirmTable() {
    final table = _selectedTable!;

    final booking = Booking(
      branch: widget.branch.name,
      branchId: widget.branch.id,
      date: widget.date,
      time: widget.time,
      guestCount: widget.guests,
      tableId: table.tableId,
      tableCode: table.tableCode,
      area: table.status,
      tableDescription: 'Bàn ${table.tableCode} - ${table.capacity} khách',
      specialRequest: widget.specialRequest,
      durationMinutes: widget.durationMinutes,
    );

    // Luu lich + ban vao session de cho khac dung (Thuc don, Mon da chon...)
    AppSession.setBooking(booking);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => BookingPreOrderPage(
          branch: widget.branch,
          date: widget.date,
          time: widget.time,
          guests: widget.guests,
          table: table,
          specialRequest: widget.specialRequest,
          durationMinutes: widget.durationMinutes,
        ),
      ),
    );
  }
}
