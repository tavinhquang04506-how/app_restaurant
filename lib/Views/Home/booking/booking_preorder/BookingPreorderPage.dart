import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import 'package:android/Models/backend_models.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Utils/Utils.dart';
import 'package:android/Service/BookingUiService.dart';
import 'package:android/Service/BookingService.dart';
import 'package:android/Service/FoodService.dart';
import 'package:android/Service/PromotionService.dart';
import 'package:android/Service/CategoryService.dart';
import 'models/booking_cart_item.dart';
import 'widgets/booking_summary_widgets.dart';
import 'widgets/menu_tab_widgets.dart';
import 'widgets/cart_tab_widgets.dart';

class BookingPreOrderPage extends StatefulWidget {
  const BookingPreOrderPage({
    super.key,
    required this.branch,
    required this.date,
    required this.time,
    required this.guests,
    required this.table,
    this.specialRequest,
    this.durationMinutes = 120,
  });

  final BranchModel branch;
  final DateTime date;
  final TimeOfDay time;
  final int guests;
  final TableAvailabilityModel table;
  final String? specialRequest;
  final int durationMinutes;

  @override
  State<BookingPreOrderPage> createState() => _BookingPreOrderPageState();
}

class _BookingPreOrderPageState extends State<BookingPreOrderPage>
    with SingleTickerProviderStateMixin {
  final FoodService _foodService = FoodService();
  final PromotionService _promotionService = PromotionService();
  final BookingService _bookingService = BookingService();
  final CategoryService _categoryService = CategoryService();
  final TextEditingController _searchController = TextEditingController();
  late final TabController _tabController = TabController(
    length: 2,
    vsync: this,
  );
  final NumberFormat _currency = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: 'đ',
    decimalDigits: 0,
  );

  bool _loadingFoods = false;
  bool _submitting = false;
  bool _loadingPromotions = false;
  bool _loadingCategories = false;
  String? _error;
  List<BranchFoodModel> _foods = [];
  final Map<String, BookingCartItem> _cart = {};
  final List<String> _cartOrder = [];
  List<PromotionModel> _promotions = [];
  PromotionModel? _selectedPromotion;
  String? _promotionError;
  List<CategoryModel> _categories = [];
  String? _selectedCategoryId;

  @override
  void initState() {
    super.initState();
    _loadFoods();
    _loadPromotions();
    _loadCategories();
    _searchController.addListener(() => setState(() {}));
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    for (final item in _cart.values) {
      item.dispose();
    }
    super.dispose();
  }

  Future<void> _loadFoods() async {
    setState(() {
      _loadingFoods = true;
      _error = null;
    });
    try {
      final res = await _foodService.getBranchFoods(
        branchId: widget.branch.id,
        size: 100,
      );
      setState(() {
        _foods = res.data.where((item) => item.active).toList();
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
        _foods = [];
      });
    } finally {
      if (mounted) setState(() => _loadingFoods = false);
    }
  }

  Future<void> _loadPromotions() async {
    setState(() {
      _loadingPromotions = true;
      _promotionError = null;
    });
    try {
      final res = await _promotionService.getAvailablePromotions();
      setState(() {
        _promotions = res.data.where((promo) => promo.hasStock).toList();
      });
    } catch (error) {
      setState(() {
        _promotionError = error.toString();
        _promotions = [];
        _selectedPromotion = null;
      });
    } finally {
      if (mounted) setState(() => _loadingPromotions = false);
    }
  }

  Future<void> _loadCategories() async {
    setState(() {
      _loadingCategories = true;
    });
    try {
      final res = await _categoryService.getCategories();
      setState(() {
        _categories = res.data;
      });
    } catch (error) {
      setState(() {
        _categories = [];
      });
    } finally {
      if (mounted) setState(() => _loadingCategories = false);
    }
  }

  List<BranchFoodModel> get _displayFoods {
    var filtered = _foods;
    
    if (_selectedCategoryId != null) {
      filtered = filtered.where((item) {
        return item.food.categoryId == _selectedCategoryId;
      }).toList();
    }
    
    final query = _searchController.text.trim();
    if (query.isEmpty) return filtered;
    
    final normalizedQuery = normalizeVietnamese(query);
    return filtered.where((item) {
      final name = normalizeVietnamese(item.food.name);
      final category = normalizeVietnamese(item.food.categoryName ?? '');
      return name.contains(normalizedQuery) || category.contains(normalizedQuery);
    }).toList();
  }

  void _increase(BranchFoodModel item) {
    setState(() {
      if (!_cart.containsKey(item.food.id)) {
        _cart[item.food.id] = BookingCartItem(food: item);
        _cartOrder.add(item.food.id);
      }
      _cart[item.food.id]!.quantity++;
    });
  }

  void _decrease(BranchFoodModel item) {
    if (!_cart.containsKey(item.food.id)) return;
    setState(() {
      final current = _cart[item.food.id]!;
      current.quantity--;
      if (current.quantity <= 0) {
        _cart.remove(item.food.id);
        _cartOrder.remove(item.food.id);
      }
      _resetPromotionIfEmpty();
    });
  }

  void _removeItem(String foodId) {
    if (!_cart.containsKey(foodId)) return;
    setState(() {
      final removed = _cart.remove(foodId);
      removed?.dispose();
      _cartOrder.remove(foodId);
      _resetPromotionIfEmpty();
    });
  }

  void _clearCart() {
    setState(() {
      for (final item in _cart.values) {
        item.dispose();
      }
      _cart.clear();
      _cartOrder.clear();
      _selectedPromotion = null;
    });
  }

  void _resetPromotionIfEmpty() {
    if (_cart.isEmpty) {
      _selectedPromotion = null;
    }
  }

  void _clearPromotion() {
    setState(() {
      _selectedPromotion = null;
    });
  }

  void _onReorderCart(int oldIndex, int newIndex) {
    setState(() {
      if (newIndex > oldIndex) newIndex -= 1;
      final id = _cartOrder.removeAt(oldIndex);
      _cartOrder.insert(newIndex, id);
    });
  }

  List<BookingCartItem> get _orderedItems =>
      _cartOrder.where(_cart.containsKey).map((id) => _cart[id]!).toList();

  int _getQuantity(BranchFoodModel item) => _cart[item.food.id]?.quantity ?? 0;

  int get _subTotal => _cart.values.fold(
        0,
        (sum, item) => sum + item.quantity * item.food.price,
      );

  int get _discountAmount {
    if (_selectedPromotion == null) return 0;
    return (_subTotal * _selectedPromotion!.discountPercent) ~/ 100;
  }

  int get _totalAmount {
    final total = _subTotal - _discountAmount;
    return total < 0 ? 0 : total;
  }

  DateTime get _reservedFrom => DateTime(
    widget.date.year,
    widget.date.month,
    widget.date.day,
    widget.time.hour,
    widget.time.minute,
  );

  Future<void> _submitBooking() async {
    setState(() => _submitting = true);

    final ok = await BookingUiService.createBookingWithFeedback(
      context: context,
      api: _bookingService,
      payload: BookingRequestPayload(
        bookingTime: _reservedFrom,
        guests: widget.guests,
        tableId: widget.table.tableId,
        branchId: widget.branch.id,
        specialRequest: widget.specialRequest,
        promotionCode: _selectedPromotion?.code,
        durationMinutes: widget.durationMinutes,
        dishes: [
          for (var i = 0; i < _orderedItems.length; i++)
            BookingDishPayload(
              foodId: _orderedItems[i].food.food.id,
              quantity: _orderedItems[i].quantity,
              servingOrder: i + 1,
              specialNote: _orderedItems[i].note,
            ),
        ],
      ),
    );

    setState(() => _submitting = false);

    if (ok) {
      AppSession.clearBooking();
      Navigator.of(context).pushNamedAndRemoveUntil('/home', (route) => false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF121212),
      appBar: AppBar(
        backgroundColor: const Color(0xFF121212),
        foregroundColor: Colors.white,
        title: const Text('Chọn món trước khi đến'),
      ),
      body: Column(
        children: [
          BookingSummaryCard(
            branch: widget.branch,
            date: widget.date,
            time: widget.time,
            guests: widget.guests,
            table: widget.table,
          ),
          TabBar(
            controller: _tabController,
            indicatorColor: Colors.redAccent,
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white54,
            tabs: const [
              Tab(text: 'Chọn món'),
              Tab(text: 'Món đã chọn'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [_buildMenuTab(), _buildCartTab()],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMenuTab() {
    if (_loadingFoods) {
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
              'Không thể tải thực đơn chi nhánh này.',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: const TextStyle(color: Colors.white38, fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            ElevatedButton(onPressed: _loadFoods, child: const Text('Thử lại')),
          ],
        ),
      );
    }

    if (_foods.isEmpty) {
      return const Center(
        child: Text(
          'Chi nhánh chưa có thực đơn khả dụng.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    }

    final foods = _displayFoods;

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        MenuTabWidgets.buildSearchField(_searchController),
        const SizedBox(height: 12),
        MenuTabWidgets.buildCategoryFilter(
          categories: _categories,
          selectedCategoryId: _selectedCategoryId,
          loadingCategories: _loadingCategories,
          onCategorySelected: (categoryId) {
            setState(() {
              _selectedCategoryId = categoryId;
            });
          },
        ),
        const SizedBox(height: 16),
        if (foods.isEmpty)
          const Padding(
            padding: EdgeInsets.only(top: 32),
            child: Center(
              child: Text(
                'Không tìm thấy món phù hợp.',
                style: TextStyle(color: Colors.white70),
              ),
            ),
          ),
        ...foods.map((food) => MenuTabWidgets.buildFoodCard(
              item: food,
              quantity: _getQuantity(food),
              onIncrease: _increase,
              onDecrease: _decrease,
              currency: _currency,
            )),
        const SizedBox(height: 80),
      ],
    );
  }

  Widget _buildCartTab() {
    if (_cart.isEmpty) {
      return Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Chưa có món nào được chọn.',
              style: TextStyle(color: Colors.white70),
            ),
            const SizedBox(height: 8),
            OutlinedButton(
              onPressed: () => _tabController.animateTo(0),
              child: const Text('Chọn món ngay'),
            ),
          ],
        ),
      );
    }

    final items = _orderedItems;

    return Column(
      children: [
        Expanded(
          child: ReorderableListView.builder(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 24),
            header: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CartTabWidgets.buildPromotionCard(
                  selectedPromotion: _selectedPromotion,
                  loadingPromotions: _loadingPromotions,
                  hasCart: _cart.isNotEmpty,
                  noPromoAvailable: !_loadingPromotions && _promotions.isEmpty,
                  onTap: _cart.isNotEmpty ? _openPromotionPicker : null,
                  onClearPromotion: _clearPromotion,
                ),
                if (_promotionError != null)
                  Padding(
                    padding: const EdgeInsets.only(top: 8),
                    child: Text(
                      _promotionError!,
                      style: const TextStyle(color: Colors.redAccent, fontSize: 12),
                    ),
                  ),
                const SizedBox(height: 16),
                _buildCartSectionTitle(items.length),
              ],
            ),
            buildDefaultDragHandles: false,
            itemCount: items.length,
            onReorder: _onReorderCart,
            itemBuilder: (_, index) => CartTabWidgets.buildCartCard(
              item: items[index],
              index: index,
              currency: _currency,
              onRemove: _removeItem,
              onIncrease: _increase,
              onDecrease: _decrease,
              onNoteChanged: (value) {
                setState(() {
                  items[index].note = value;
                });
              },
            ),
          ),
        ),
        CartTabWidgets.buildCartSummary(
          cartLength: _cart.length,
          subTotal: _subTotal,
          discountAmount: _discountAmount,
          totalAmount: _totalAmount,
          submitting: _submitting,
          loadingPromotions: _loadingPromotions,
          promotionsEmpty: _promotions.isEmpty,
          currency: _currency,
          onSubmit: _submitBooking,
        ),
      ],
    );
  }

  Widget _buildCartSectionTitle(int count) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          'Thứ tự ra món ($count món)',
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
            fontSize: 16,
          ),
        ),
        TextButton(
          onPressed: _cart.isEmpty ? null : _clearCart,
          child: const Text(
            'Xoá tất cả',
            style: TextStyle(color: Colors.redAccent),
          ),
        ),
      ],
    );
  }

  Future<void> _openPromotionPicker() async {
    if (_cart.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Vui lòng thêm món trước khi áp dụng mã.')),
      );
      return;
    }
    if (!_loadingPromotions && _promotions.isEmpty) {
      await _loadPromotions();
    }
    if (_promotions.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Hiện chưa có mã ưu đãi khả dụng.')),
      );
      return;
    }

    const clearSignal = '__clear__';

    final result = await showModalBottomSheet<String>(
      context: context,
      isScrollControlled: true,
      backgroundColor: const Color(0xFF1B1B1F),
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (sheetContext) => CartTabWidgets.buildPromotionSheet(
        sheetContext: sheetContext,
        promotions: _promotions,
        selectedCode: _selectedPromotion?.code,
        clearSignal: clearSignal,
        onPromotionSelected: (code) {
          Navigator.of(sheetContext).pop(code);
        },
        onClearPromotion: () {
          Navigator.of(sheetContext).pop(clearSignal);
        },
        formatPromotionPeriod: _formatPromotionPeriod,
      ),
    );

    if (result == null) return;
    if (result == clearSignal) {
      _clearPromotion();
      return;
    }

    PromotionModel? selected;
    for (final promo in _promotions) {
      if (promo.code == result) {
        selected = promo;
        break;
      }
    }
    if (selected != null) {
      setState(() {
        _selectedPromotion = selected;
      });
    }
  }

  String _formatPromotionPeriod(PromotionModel promo) {
    final formatter = DateFormat('HH:mm dd/MM/yyyy');
    final start =
        promo.startDate != null ? formatter.format(promo.startDate!.toLocal()) : 'Bất kỳ';
    final end =
        promo.endDate != null ? formatter.format(promo.endDate!.toLocal()) : 'Không giới hạn';
    return 'Áp dụng: $start - $end';
  }
}
