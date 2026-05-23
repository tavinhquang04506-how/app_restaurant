import 'package:flutter/material.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Utils/AppSession.dart';
import 'package:android/Utils/Utils.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';
import 'package:android/Components/StarRating.dart';
import 'package:android/Service/FavoriteHelper.dart';
import 'FoodDetailPage.dart';
import 'package:android/Service/BranchService.dart';
import 'package:android/Service/CategoryService.dart';
import 'package:android/Service/FavoriteService.dart';
import 'package:android/Service/FoodService.dart';

final Map<MenuItem, int> globalCart = {};

class FoodMenu extends StatefulWidget {
  const FoodMenu({super.key});

  @override
  State<FoodMenu> createState() => _FoodMenuState();
}

class _FoodMenuState extends State<FoodMenu> {
  final TextEditingController _searchController = TextEditingController();
  String _searchText = '';

  late BuildContext _pageContext;

  final ScrollController _scrollController = ScrollController();

  static const int _pageSize = 20;
  int get totalItemsInCart =>
      globalCart.values.fold(0, (sum, qty) => sum + qty);

  final BranchService _branchService = BranchService();
  final CategoryService _categoryService = CategoryService();
  final FoodService _foodService = FoodService();
  final FavoriteService _favoriteService = FavoriteService();
  List<MenuItem> _allItems = [];
  List<CategoryModel> _categories = [];
  List<BranchModel> _branches = [];
  BranchModel? _selectedBranch;
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _isRefreshing = false;
  bool _loadingCategories = false;
  bool _loadingBranches = false;
  String? _error;
  String? _currentBranchId;
  String? _selectedCategoryId;
  bool _filterFavorites = false;
  int _currentPage = 1;
  bool _hasMore = true;
  VoidCallback? _bookingListener;
  VoidCallback? _userListener;

  @override
  void initState() {
    super.initState();
    _userListener = _handleUserChanged;
    AppSession.currentUser.addListener(_userListener!);
    if (AppSession.isLoggedIn) {
      _syncFavoritesFromServer();
    } else {
      FavoriteManager.clear();
    }
    _loadCategories();
    _loadBranches();
    _scrollController.addListener(_onScroll);
    _loadFoods(reset: true);
    _searchController.addListener(() {
      setState(() {
        _searchText = _searchController.text;
      });
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    if (_userListener != null) {
      AppSession.currentUser.removeListener(_userListener!);
    }
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (!_scrollController.hasClients ||
        _searchText.isNotEmpty ||
        !_hasMore ||
        _isLoading ||
        _isLoadingMore ||
        _error != null) {
      return;
    }
    final position = _scrollController.position;
    if (position.pixels >= position.maxScrollExtent - 200) {
      _loadFoods();
    }
  }

  void _handleUserChanged() {
    if (AppSession.isLoggedIn) {
      _syncFavoritesFromServer();
    } else {
      FavoriteManager.clear();
      setState(() {
        for (final item in _allItems) {
          item.isFavorite = false;
        }
      });
    }
  }

  Future<void> _syncFavoritesFromServer() async {
    if (!AppSession.isLoggedIn) return;
    await FavoriteHelper.syncFromServer(api: _favoriteService, silent: true);
    setState(() {
      for (final item in _allItems) {
        item.isFavorite = FavoriteManager.isFavorite(item.id);
      }
    });
  }

  Future<void> _loadCategories() async {
    setState(() => _loadingCategories = true);
    try {
      final res = await _categoryService.getCategories();
      setState(() {
        _categories = res.data;
      });
    } catch (_) {
      // ignore category errors
    } finally {
      setState(() => _loadingCategories = false);
    }
  }

  Future<void> _loadBranches() async {
    if (_loadingBranches) return;
    setState(() => _loadingBranches = true);
    try {
      final res = await _branchService.getBranches();
      setState(() {
        _branches = res.data;
      });
    } catch (error) {
      print('Failed to load branches: $error');
    } finally {
      if (mounted) setState(() => _loadingBranches = false);
    }
  }

  Future<void> _loadFoods({bool reset = false}) async {
    if (_isLoading || _isLoadingMore) return;

    if (reset) {
      _currentPage = 1;
      _hasMore = true;
    } else if (!_hasMore) {
      return;
    }

    setState(() {
      _isLoading = _currentPage == 1 && _allItems.isEmpty;
      _isRefreshing = _currentPage == 1 && _allItems.isNotEmpty;
      _isLoadingMore = _currentPage > 1;
      _error = null;
    });

    try {
      final List<MenuItem> items;
      if (_currentBranchId != null) {
        final res = await _foodService.getBranchFoods(
          branchId: _currentBranchId!,
          page: _currentPage,
          size: _pageSize,
          categoryId: _selectedCategoryId,
        );
        items = res.data
            .where((food) => food.active)
            .map(MenuItem.fromBranchFood)
            .toList();
      } else {
        final res = await _foodService.getFoods(
          page: _currentPage,
          size: _pageSize,
          categoryId: _selectedCategoryId,
        );
        items = res.data.map(MenuItem.fromFoodModel).toList();
      }

      for (final item in items) {
        item.isFavorite = FavoriteManager.isFavorite(item.id);
      }

      setState(() {
        if (_currentPage == 1) {
          _allItems = items;
        } else {
          _allItems.addAll(items);
        }
        _currentPage++;
        _hasMore = items.length == _pageSize;
      });
    } catch (error) {
      setState(() {
        _error = error.toString();
        if (reset) _allItems = [];
      });
    } finally {
      setState(() {
        _isLoading = false;
        _isLoadingMore = false;
        _isRefreshing = false;
      });
    }
  }

  // Ho tro gio mon
  void _addOne(MenuItem item) {
    Navigator.pushNamed(_pageContext, '/datban');
  }

  Future<void> _toggleFavorite(MenuItem item, [bool? newValue]) async {
    final targetState = newValue ?? !item.isFavorite;

    await FavoriteHelper.setFavorite(
      context: _pageContext,
      api: _favoriteService,
      item: item,
      favorite: targetState,
      onLocalChanged: (value) {
        setState(() => item.isFavorite = value);
      },
    );
  }

  Future<bool> _toggleFavoriteFromDetail(MenuItem item, bool newValue) async {
    await _toggleFavorite(item, newValue);
    return item.isFavorite;
  }

  // Loc theo tab + search
  List<MenuItem> get _displayItems {
    List<MenuItem> base = _allItems;

    if (_filterFavorites) {
      base = base.where((e) => e.isFavorite).toList();
    }

    final query = _searchText.trim();

    if (query.isEmpty) return base;

    final normalizedQuery = normalizeVietnamese(query);
    return base.where((item) {
      final name = normalizeVietnamese(item.name);
      return name.contains(normalizedQuery);
    }).toList();
  }

  // Thanh tim kiem + luu mon
  Widget _buildSearchRow() {
    return Row(
      children: [
        // O tim kiem
        Expanded(
          child: Container(
            height: 48,
            decoration: BoxDecoration(
              color: Colors.brown.shade800,
              borderRadius: BorderRadius.circular(24),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                const Icon(Icons.search, color: Colors.white70),
                const SizedBox(width: 8),
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Tìm món ăn bạn yêu thích...',
                      border: InputBorder.none,
                      hintStyle: TextStyle(color: Colors.white54),
                    ),
                    style: const TextStyle(color: Colors.white),
                  ),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(width: 8),

        // Nut loc theo chi nhanh
        _buildBranchFilterButton(),
      ],
    );
  }

  Widget _buildBranchFilterButton() {
    // Dang load danh sach chi nhanh
    if (_loadingBranches) {
      return Container(
        height: 40,
        width: 40,
        decoration: BoxDecoration(
          color: Colors.brown.shade600,
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Padding(
          padding: EdgeInsets.all(8),
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Colors.white,
          ),
        ),
      );
    }

    // Chua co du lieu chi nhanh: bam de thu load lai
    if (_branches.isEmpty) {
      return GestureDetector(
        onTap: _loadBranches,
        child: Container(
          height: 40,
          width: 40,
          decoration: BoxDecoration(
            color: Colors.brown.shade600,
            borderRadius: BorderRadius.circular(12),
          ),
          child: const Icon(
            Icons.store_mall_directory,
            color: Colors.white,
            size: 22,
          ),
        ),
      );
    }

    const String allBranchesValue = '__all__';
    final bool isFiltering = _currentBranchId != null;
    final String label =
        _selectedBranch?.name ?? (isFiltering ? 'Đang lọc' : 'Chọn chi nhánh');

    return PopupMenuButton<String>(
      color: const Color(0xFF2A0E0E),
      onSelected: (value) {
        if (value == allBranchesValue) {
          setState(() {
            _selectedBranch = null;
            _currentBranchId = null;
          });
        } else {
          final next = _branches.firstWhere(
            (b) => b.id == value,
            orElse: () => _branches.first,
          );
          setState(() {
            _selectedBranch = next;
            _currentBranchId = next.id;
          });
        }
        _loadFoods(reset: true);
      },
      itemBuilder: (context) => <PopupMenuEntry<String>>[
        const PopupMenuItem<String>(
          value: allBranchesValue,
          child: Text(
            'Tất cả chi nhánh',
            style: TextStyle(color: Colors.white),
          ),
        ),
        ..._branches.map(
          (b) => PopupMenuItem<String>(
            value: b.id,
            child: Text(
              b.name,
              style: const TextStyle(color: Colors.white),
            ),
          ),
        ),
      ],
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF8D1A1A),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              label,
              style: const TextStyle(
                color: Colors.white,
                fontSize: 13,
              ),
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(width: 4),
            const Icon(
              Icons.keyboard_arrow_down,
              color: Colors.white,
              size: 18,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChips() {
    final chips = <Widget>[
      _buildFilterChip(
        label: 'Tất cả',
        selected: !_filterFavorites && _selectedCategoryId == null,
        onTap: () {
          setState(() {
            _filterFavorites = false;
            _selectedCategoryId = null;
          });
          _loadFoods(reset: true);
        },
      ),
      const SizedBox(width: 12),
      _buildFilterChip(
        label: 'Món yêu thích',
        selected: _filterFavorites,
        onTap: () {
          setState(() {
            _filterFavorites = true;
            _selectedCategoryId = null;
          });
        },
      ),
      const SizedBox(width: 12),
    ];

    for (final category in _categories) {
      chips.add(
        _buildFilterChip(
          label: category.name,
          selected:
              !_filterFavorites && _selectedCategoryId == category.id,
          onTap: () {
            setState(() {
              _filterFavorites = false;
              _selectedCategoryId = category.id;
            });
            _loadFoods(reset: true);
          },
        ),
      );
      chips.add(const SizedBox(width: 12));
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: [
          ...chips,
          if (_loadingCategories)
            const SizedBox(
              height: 24,
              width: 24,
              child: Padding(
                padding: EdgeInsets.only(left: 8),
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildFilterChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? Colors.red : const Color(0xFF241010),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.white70,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  // Card goi y (list ngang)
  Widget _buildSuggestionCard(BuildContext context, MenuItem item) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DishDetailPage(
              image: item.imageUrl,
              name: item.name,
              price: item.formattedPrice,
              description: item.subtitle,
              ingredients: const [],
              isFavorite: item.isFavorite,
              avgRating: item.avgRating,
              ratingCount: item.ratingCount,
              onFavoriteChangedAsync: (value) =>
                  _toggleFavoriteFromDetail(item, value),
            ),
          ),
        );
      },
      child: Container(
        width: 200,
        decoration: BoxDecoration(
          color: const Color(0xFF1B1B1F),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SizedBox(
              height: 110,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: _buildDishImage(
                      item.imageUrl,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        topRight: Radius.circular(16),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 8,
                    right: 8,
                    child: GestureDetector(
                      onTap: () {
                        _toggleFavorite(item);
                      },
                      child: CircleAvatar(
                        radius: 14,
                        backgroundColor: Colors.black.withValues(alpha: 0.4),
                        child: Icon(
                          item.isFavorite
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: item.isFavorite
                              ? Colors.redAccent
                              : Colors.white70,
                          size: 18,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: Text(
                item.name,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                ),
              ),
            ),
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8.0),
              child: Text(
                item.category,
                style: const TextStyle(color: Colors.greenAccent, fontSize: 11),
              ),
            ),
            if (item.avgRating != null) ...[
              const SizedBox(height: 4),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8.0),
                child: StarRating(
                  rating: item.avgRating!,
                  starSize: 12,
                  showNumber: false,
                ),
              ),
            ],
            const SizedBox(height: 4),
            Padding(
              padding: const EdgeInsets.only(right: 8, bottom: 8),
              child: Align(
                alignment: Alignment.bottomRight,
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 3,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.red,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: GestureDetector(
                    onTap: () => _addOne(item),
                    child: const Icon(
                      Icons.add,
                      color: Colors.white,
                      size: 18,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Item danh sach mon doc
  Widget _buildMenuItem(BuildContext context, MenuItem item) {
    return InkWell(
      borderRadius: BorderRadius.circular(16),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DishDetailPage(
              image: item.imageUrl,
              name: item.name,
              price: item.formattedPrice,
              description: item.subtitle,
              ingredients: const [],
              isFavorite: item.isFavorite,
              avgRating: item.avgRating,
              ratingCount: item.ratingCount,
              onFavoriteChangedAsync: (value) =>
                  _toggleFavoriteFromDetail(item, value),
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1B1B1F),
          borderRadius: BorderRadius.circular(16),
        ),
        child: Row(
          children: [
            SizedBox(
              width: 90,
              height: 90,
              child: Stack(
                children: [
                  Positioned.fill(
                    child: _buildDishImage(
                      item.imageUrl,
                      borderRadius: const BorderRadius.only(
                        topLeft: Radius.circular(16),
                        bottomLeft: Radius.circular(16),
                      ),
                    ),
                  ),
                  Positioned(
                    top: 6,
                    right: 6,
                    child: GestureDetector(
                      onTap: () {
                        _toggleFavorite(item);
                      },
                      child: CircleAvatar(
                        radius: 13,
                        backgroundColor: Colors.black.withValues(alpha: 0.4),
                        child: Icon(
                          item.isFavorite
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: item.isFavorite
                              ? Colors.redAccent
                              : Colors.white70,
                          size: 17,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.category,
                    style: const TextStyle(
                      color: Colors.greenAccent,
                      fontSize: 12,
                    ),
                  ),
                  if (item.avgRating != null) ...[
                    const SizedBox(height: 4),
                    StarRating(
                      rating: item.avgRating!,
                      starSize: 14,
                      showNumber: true,
                    ),
                  ],
                  const SizedBox(height: 8),
                  Text(
                    item.formattedPrice,
                    style: const TextStyle(
                      color: Colors.orangeAccent,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: Colors.red,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: GestureDetector(
                  onTap: () => _addOne(item),
                  child: const Icon(
                    Icons.add,
                    color: Colors.white,
                    size: 20,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDishImage(
    String? url, {
    BorderRadius borderRadius = BorderRadius.zero,
    double? width,
    double? height,
  }) {
    final placeholder = FoodImagePlaceholder(
      width: width,
      height: height,
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
          fit: BoxFit.cover,
          width: width,
          height: height,
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      );
    }

    return ClipRRect(
      borderRadius: borderRadius,
      child: Image.asset(
        url,
        fit: BoxFit.cover,
        width: width,
        height: height,
        errorBuilder: (context, error, stackTrace) => placeholder,
      ),
    );
  }

  // Build
  @override
  Widget build(BuildContext context) {
    _pageContext = context;
    final suggestions = _allItems.take(4).toList();

    Widget body;
    if (_isLoading) {
      body = const Center(
        child: CircularProgressIndicator(color: Colors.white),
      );
    } else if (_error != null) {
      body = Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                'Không thể tải thực đơn',
                style: TextStyle(color: Colors.white70, fontSize: 16),
              ),
              const SizedBox(height: 8),
              Text(
                _error!,
                style: const TextStyle(color: Colors.white38, fontSize: 12),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => _loadFoods(reset: true),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      );
    } else if (_allItems.isEmpty) {
      body = const Center(
        child: Text(
          'Hiện chưa có món nào.',
          style: TextStyle(color: Colors.white70),
        ),
      );
    } else {
      body = Stack(
        children: [
          ListView(
            controller: _scrollController,
            padding: const EdgeInsets.all(16),
            children: [
              _buildSearchRow(),
              const SizedBox(height: 16),
              const Text(
                'Gợi ý từ Bếp trưởng',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 12),
              if (suggestions.isEmpty)
                const Text(
                  'Chưa có món nổi bật để gợi ý.',
                  style: TextStyle(color: Colors.white54),
                )
              else
                SizedBox(
                  height: 210,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: suggestions.length,
                    separatorBuilder: (context, index) => const SizedBox(width: 12),
                    itemBuilder: (context, index) {
                      final item = suggestions[index];
                      return _buildSuggestionCard(context, item);
                    },
                  ),
                ),
              const SizedBox(height: 20),
              _buildFilterChips(),
              const SizedBox(height: 16),
              ..._displayItems.map(
                (item) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _buildMenuItem(context, item),
                ),
              ),
              if (_isLoadingMore)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(
                    child: CircularProgressIndicator(color: Colors.white),
                  ),
                ),
              if (!_isLoadingMore && !_hasMore && _allItems.isNotEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 12),
                  child: Center(
                    child: Text(
                      'Đã hiển thị toàn bộ món.',
                      style: TextStyle(color: Colors.white54),
                    ),
                  ),
                ),
            ],
          ),
          if (_isRefreshing)
            Positioned(
              top: 0,
              left: 0,
              right: 0,
              child: LinearProgressIndicator(
                backgroundColor: Colors.transparent,
                color: Colors.redAccent,
                minHeight: 3,
              ),
            ),
        ],
      );
    }

    // Boc bang Scaffold de co Material cho TextField, InkWell, ...
    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2A0E0E),
        foregroundColor: Colors.white,
        title: const Text('Thực đơn'),
      ),
      body: body,
    );
  }

}
