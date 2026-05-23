import 'package:flutter/material.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';
import 'package:android/Service/FavoriteHelper.dart';
import 'package:android/Service/BookingUiService.dart';
import 'FoodDetailPage.dart';
import 'FoodMenuPage.dart';
import 'package:android/Service/FavoriteService.dart';
import 'package:android/Service/BookingService.dart';

class SelectedFoodsPage extends StatefulWidget {
  final Map<MenuItem, int> cart;
  final bool isEditing; // false = tạo mới, true = sửa

  const SelectedFoodsPage({
    super.key,
    required this.cart,
    this.isEditing = false,
  });

  @override
  State<SelectedFoodsPage> createState() => _SelectedFoodsPageState();
}

class _SelectedFoodsPageState extends State<SelectedFoodsPage> {
  final FavoriteService _favoriteService = FavoriteService();
  final BookingService _bookingService = BookingService();
  bool _submitting = false;

  @override
  void initState() {
    super.initState();
  }

  Future<bool> _toggleFavoriteFromDetail(MenuItem item, bool targetState) async {
    return FavoriteHelper.setFavorite(
      context: context,
      api: _favoriteService,
      item: item,
      favorite: targetState,
      onLocalChanged: (value) => item.isFavorite = value,
    );
  }

  // ====== HÀM TÍNH TIỀN ======
  String _formatCurrency(int amount) {
    final s = amount.toString();
    final buffer = StringBuffer();
    for (int i = 0; i < s.length; i++) {
      final posFromEnd = s.length - i;
      buffer.write(s[i]);
      if (posFromEnd > 1 && posFromEnd % 3 == 1) {
        buffer.write('.');
      }
    }
    return '${buffer.toString()}đ';
  }

  int get _subTotal {
    int total = 0;
    widget.cart.forEach((item, qty) {
      total += item.price * qty;
    });
    return total;
  }

  int get _finalTotal => _subTotal;

  // ====== XÁC NHẬN ĐẶT BÀN / THAY ĐỔI ======
  Future<void> _onTapThanhToan(BuildContext context) async {
    // Nếu chưa đăng nhập thì vẫn chặn
    if (!AppSession.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập trước khi sử dụng tính năng này.'),
        ),
      );
      Navigator.pushNamed(context, '/login');
      return;
    }

    // Nếu chưa có món
    if (widget.cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn món ở tab Thực đơn trước khi xác nhận.'),
        ),
      );
      return;
    }

    // Hộp thoại xác nhận
    final bool? confirm = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: Text(
            widget.isEditing ? 'Xác nhận thay đổi' : 'Xác nhận đặt bàn',
          ),
          content: Text(
            widget.isEditing
                ? 'Bạn có chắc chắn muốn xác nhận thay đổi cho lịch này?'
                : 'Bạn có chắc chắn muốn xác nhận đặt bàn với các món đã chọn?',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Không'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.pop(context, true),
              child: const Text('Có'),
            ),
          ],
        );
      },
    );

    if (confirm != true) return;

    await _createBooking();
  }

  // ====== HÀM XỬ LÝ SỐ LƯỢNG ======
  void _addOne(MenuItem item) {
    setState(() {
      widget.cart[item] = (widget.cart[item] ?? 0) + 1;
    });
  }

  void _removeOne(MenuItem item) {
    setState(() {
      final current = widget.cart[item] ?? 0;
      if (current <= 1) {
        widget.cart.remove(item);
      } else {
        widget.cart[item] = current - 1;
      }
    });
  }

  void _removeAll() {
    setState(() {
      widget.cart.clear();
    });

    final current = AppSession.currentBooking.value;
    if (current != null) {
      final updated = Booking(
        branch: current.branch,
        date: current.date,
        time: current.time,
        guestCount: current.guestCount,
        tableId: current.tableId,
        area: current.area,
        tableDescription: current.tableDescription,
      );
      AppSession.setBooking(updated);
    }
  }

  void _openMenuScreen() {
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => const FoodMenu()),
    );
  }

  Future<void> _createBooking() async {
    final booking = AppSession.currentBooking.value!;

    final dishes = widget.cart.entries
        .where((e) => e.key.id.isNotEmpty)
        .toList()
        .asMap()
        .entries
        .map((e) => BookingDishPayload(
              foodId: e.value.key.id,
              quantity: e.value.value,
              servingOrder: e.key + 1,
            ))
        .toList();

    setState(() => _submitting = true);

    final ok = await BookingUiService.createBookingWithFeedback(
      context: context,
      api: _bookingService,
      payload: BookingRequestPayload(
        bookingTime: booking.reservedDateTime,
        guests: booking.guestCount,
        tableId: booking.tableId!,
        branchId: booking.branchId!,
        specialRequest: booking.specialRequest ?? booking.tableDescription,
        dishes: dishes,
        durationMinutes: booking.durationMinutes,
      ),
    );

    setState(() => _submitting = false);

    if (ok) {
      widget.cart.clear();
      globalCart.clear();
      AppSession.clearBooking();
      Navigator.popUntil(context, ModalRoute.withName('/home'));
    }
  }

  // ====== WIDGET PHẦN THÔNG TIN ĐẶT BÀN ======
  Widget _buildBookingInfoCard() {
    final Booking? booking = AppSession.currentBooking.value;
    final User? user = AppSession.currentUser.value;

    String branch = 'Chưa chọn';
    String time = 'Chưa chọn';
    String guest = 'Chưa chọn';
    String position = 'Chưa chọn';
    String customer = user?.name ?? 'Chưa có';

    if (booking != null) {
      branch = booking.branch;
      time =
          '${booking.date.day}/${booking.date.month}/${booking.date.year} - ${booking.time.format(context)}';
      guest = '${booking.guestCount} khách';

      if (booking.tableId != null) {
        final code = booking.tableCode ?? booking.tableId;
        final area = booking.area != null && booking.area!.isNotEmpty
            ? ' - ${booking.area}'
            : '';
        position = 'Bàn $code$area';
      }
    }

    Widget buildRow(IconData icon, String title, String value) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(icon, color: Colors.white70, size: 20),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(color: Colors.white60, fontSize: 12),
                  ),
                  Text(
                    value,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F1F),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          buildRow(Icons.store_mall_directory, 'Nhà hàng', branch),
          const SizedBox(height: 4),
          buildRow(Icons.access_time, 'Thời gian', time),
          const SizedBox(height: 4),
          buildRow(Icons.person_outline, 'Số lượng khách', guest),
          const SizedBox(height: 4),
          buildRow(Icons.location_on_outlined, 'Vị trí', position),
          const SizedBox(height: 4),
          buildRow(Icons.account_circle_outlined, 'Khách hàng', customer),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: OutlinedButton(
              onPressed: () {
                if (!AppSession.isLoggedIn) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text(
                        'Vui lòng đăng nhập trước khi sử dụng tính năng này.',
                      ),
                    ),
                  );
                  Navigator.pushNamed(context, '/login');
                  return;
                }
                Navigator.pushNamed(context, '/datban');
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.white24),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 10,
                ),
              ),
              child: const Text('Chọn bàn khi đặt'),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.start,
            children: [
              const Text(
                'Bạn có thể tiếp tục chọn món ở tab',
                style: TextStyle(color: Colors.white54, fontSize: 11),
              ),
              const SizedBox(width: 4),
              GestureDetector(
                onTap: () {
                  _openMenuScreen();
                },
                child: const Text(
                  'Thực đơn.',
                  style: TextStyle(
                    color: Colors.red,
                    fontSize: 11,
                    decoration: TextDecoration.underline,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ====== KHUNG KHI CHƯA CÓ MÓN ======
  Widget _buildEmptyCartBox() {
    return GestureDetector(
      onTap: () {
        _openMenuScreen();
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1F1F1F),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: Colors.white24),
        ),
        child: Row(
          children: const [
            Icon(Icons.restaurant_menu, color: Colors.white70),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Vui lòng chọn món ở tab Thực đơn trước khi tiếp tục.',
                style: TextStyle(color: Colors.white70),
              ),
            ),
            Icon(Icons.arrow_forward_ios, color: Colors.white54, size: 16),
          ],
        ),
      ),
    );
  }

  // ====== CARD MÓN ĐÃ CHỌN ======
  Widget _buildFoodCard(int index, MenuItem item, int qty) {
    final order = index + 1;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1F1F),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // dòng "Thứ tự ra món: 1" + menu 3 chấm
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Thứ tự ra món: $order',
                style: const TextStyle(color: Colors.white70, fontSize: 12),
              ),
              IconButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => DishDetailPage(
                        image: item.imageUrl,
                        name: item.name,
                        price: item.formattedPrice,
                        description: item.subtitle,
                        ingredients: const [],
                        isFavorite: FavoriteManager.isFavorite(item.id),
                        avgRating: item.avgRating,
                        ratingCount: item.ratingCount,
                        onFavoriteChangedAsync: (value) =>
                            _toggleFavoriteFromDetail(item, value),
                      ),
                    ),
                  );
                },
                icon: const Icon(Icons.more_vert, color: Colors.white54),
              ),
            ],
          ),
          const SizedBox(height: 6),

          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: _buildCartImage(item.imageUrl),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.category,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${item.formattedPrice} / phần',
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Ghi chú món ăn: ít nước tương.',
                      style: TextStyle(color: Colors.white38, fontSize: 11),
                    ),
                  ],
                ),
              ),
            ],
          ),

          const SizedBox(height: 10),

          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Ghi chú thêm cho món này',
                style: TextStyle(color: Colors.white38, fontSize: 11),
              ),
              Row(
                children: [
                  GestureDetector(
                    onTap: () => _removeOne(item),
                    child: Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: Colors.white10,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(
                        Icons.remove,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    '$qty',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(width: 8),
                  GestureDetector(
                    onTap: () => _addOne(item),
                    child: Container(
                      width: 26,
                      height: 26,
                      decoration: BoxDecoration(
                        color: Colors.redAccent,
                        borderRadius: BorderRadius.circular(13),
                      ),
                      child: const Icon(
                        Icons.add,
                        color: Colors.white,
                        size: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        widget.cart.remove(item);
                      });
                    },
                    child: const Icon(
                      Icons.delete_outline,
                      color: Colors.white54,
                      size: 20,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCartImage(String? url) {
    final borderRadius = BorderRadius.circular(12);
    final placeholder = FoodImagePlaceholder(
      width: 60,
      height: 60,
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
          width: 60,
          height: 60,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      );
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: Image.asset(
        url,
        width: 60,
        height: 60,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      ),
    );
  }

  // ====== BUILD ======
  @override
  Widget build(BuildContext context) {
    final entries = widget.cart.entries.toList();

    // Khi CHƯA có món
    if (entries.isEmpty) {
      return Scaffold(
        backgroundColor: const Color(0xFF121212),
        appBar: AppBar(
          backgroundColor: const Color(0xFF121212),
          elevation: 0,
          title: const Text('Món đã chọn'),
          foregroundColor: const Color(0xFFDDD9D9),
        ),
        body: Column(
          children: [
            Expanded(
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  _buildBookingInfoCard(),
                  const SizedBox(height: 16),
                  _buildEmptyCartBox(),
                ],
              ),
            ),
          ],
        ),
      );
    }

    // Khi ĐÃ có món
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        elevation: 0,
        title: const Text('Món đã chọn'),
        foregroundColor: const Color(0xFFDDD9D9),
        actions: [
          TextButton(
            onPressed: _removeAll,
            child: const Text(
              'Xoá tất cả',
              style: TextStyle(color: Colors.redAccent),
            ),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                _buildBookingInfoCard(),
                const SizedBox(height: 16),

                Text(
                  'Thứ tự ra món (${entries.length} món)',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                const Divider(color: Colors.white12),

                const SizedBox(height: 8),
                // danh sách card món
                ...entries.asMap().entries.map(
                  (e) => _buildFoodCard(e.key, e.value.key, e.value.value),
                ),

                const SizedBox(height: 8),

                // ưu đãi
                const SizedBox(height: 8),
              ],
            ),
          ),

          // Thanh tổng cộng + nút xác nhận
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: const BoxDecoration(
              color: Color(0xFF302F2F),
              boxShadow: [
                BoxShadow(
                  color: Colors.black54,
                  blurRadius: 6,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tạm tính',
                      style: TextStyle(color: Colors.white70),
                    ),
                    Text(
                      _formatCurrency(_subTotal),
                      style: const TextStyle(color: Colors.white, fontSize: 14),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                const Divider(color: Colors.white24),
                const SizedBox(height: 4),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Tổng cộng',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      _formatCurrency(_finalTotal),
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity,
                  height: 46,
                  child: ElevatedButton(
                    onPressed: _submitting
                        ? null
                        : () => _onTapThanhToan(context),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.redAccent,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                    ),
                    child: _submitting
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : Text(
                            widget.isEditing
                                ? 'Xác nhận thay đổi'
                                : 'Xác nhận đặt bàn',
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 14,
                            ),
                          ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
