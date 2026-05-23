import 'package:android/Views/Home/food/FoodDetailPage.dart';
import 'package:flutter/material.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';
import 'package:android/Components/StarRating.dart';
import 'package:android/Service/FavoriteHelper.dart';
import 'package:android/Service/NotificationManager.dart';
import 'package:intl/intl.dart';
import 'DetailPromotionPage.dart';
import 'NotificationPage.dart';
import 'package:android/Service/BranchService.dart';
import 'package:android/Service/FavoriteService.dart';
import 'package:android/Service/FoodService.dart';
import 'package:android/Service/PromotionService.dart';

class InHomePage extends StatefulWidget {
  const InHomePage({super.key});

  @override
  State<InHomePage> createState() => _HomePageState();
}

class _HomePageState extends State<InHomePage> {
  int _currentBanner = 0;

  late Future<PromotionListResponse> _promotionsFuture;
  final PromotionService _promotionService = PromotionService();
  final BranchService _branchService = BranchService();
  final FoodService _foodService = FoodService();
  final FavoriteService _favoriteService = FavoriteService();
  final NotificationManager _notificationManager = NotificationManager();

  static final NumberFormat _currency = NumberFormat.currency(
    locale: 'vi_VN',
    symbol: 'đ',
    decimalDigits: 0,
  );

  List<BranchModel> _branches = [];
  BranchModel? _selectedBranch;
  bool _loadingBranches = false;
  String? _branchError;

  List<BranchFoodModel> _featuredFoods = [];
  bool _loadingFeaturedFoods = false;
  String? _featuredError;

  Future<bool> _toggleFavoriteFromDetail({
    required MenuItem item,
    required bool targetState,
  }) async {
    if (!mounted) return !targetState;
    return FavoriteHelper.setFavorite(
      context: context,
      api: _favoriteService,
      item: item,
      favorite: targetState,
      onLocalChanged: (value) => item.isFavorite = value,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      body: SingleChildScrollView(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SizedBox(height: 20),
            _header(),
            const SizedBox(height: 20),
            _bannerCarousel(),
            const SizedBox(height: 30),
            const Text(
              "Món ăn nổi bật",
              style: TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            _featuredFoodsSection(),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _promotionsFuture = _promotionService.getAvailablePromotions();
    _loadBranches();
    
    // Load notifications và listen thay đổi
    _notificationManager.loadNotifications();
    _notificationManager.addListener(_onNotificationChanged);
  }

  void _onNotificationChanged() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      setState(() {});
    });
  }

  @override
  void dispose() {
    _notificationManager.removeListener(_onNotificationChanged);
    super.dispose();
  }

  // Header giữ nguyên
  Widget _header() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const CircleAvatar(
          radius: 28,
          backgroundColor: Colors.white,
          child: Icon(Icons.restaurant, color: Colors.brown, size: 32),
        ),
        const SizedBox(width: 12),
        const Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text("Xin chào, Admin 👋",
                  style: TextStyle(color: Colors.white70, fontSize: 14)),
              SizedBox(height: 4),
              Text("Bạn muốn dùng món gì hôm nay?",
                  style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.bold)),
            ],
          ),
        ),

        _branchSelector(),

    const SizedBox(width: 8),
        _notificationBell(),

      ],
    );
  }

  Widget _notificationBell() {
    final unreadCount = _notificationManager.unreadCount;
    
    return GestureDetector(
      onTap: () async {
        await Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const NotificationPage()),
        );
        // Refresh sau khi quay về
        setState(() {});
      },
      child: Stack(
        children: [
          const Icon(Icons.notifications, color: Colors.white, size: 28),
          if (unreadCount > 0)
            Positioned(
              right: 0,
              top: 0,
              child: Container(
                padding: const EdgeInsets.all(2),
                constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                decoration: const BoxDecoration(
                  color: Colors.red,
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(
                    unreadCount > 99 ? '99+' : unreadCount.toString(),
                    style: const TextStyle(
                      fontSize: 10,
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _branchSelector() {
    final label = _selectedBranch?.name ?? 'Chọn chi nhánh';

    if (_loadingBranches) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFF8D1A1A),
          borderRadius: BorderRadius.circular(10),
        ),
        child: const SizedBox(
          width: 18,
          height: 18,
          child: CircularProgressIndicator(
            strokeWidth: 2,
            color: Colors.white,
          ),
        ),
      );
    }

    if (_branches.isEmpty) {
      return GestureDetector(
        onTap: _loadBranches,
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF8D1A1A),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Row(
            children: const [
              Text(
                'Chưa có chi nhánh',
                style: TextStyle(color: Colors.white),
              ),
              SizedBox(width: 6),
              Icon(Icons.refresh, color: Colors.white, size: 18),
            ],
          ),
        ),
      );
    }

    return PopupMenuButton<String>(
      color: const Color(0xFF2A0E0E),
      onSelected: (branchId) {
        final next = _branches
            .where((b) => b.id == branchId)
            .cast<BranchModel?>()
            .firstWhere((b) => b != null, orElse: () => null);
        if (next == null) return;
        setState(() {
          _selectedBranch = next;
        });
        _loadFeaturedFoods(branchId: next.id);
      },
      itemBuilder: (context) => _branches
          .map(
            (b) => PopupMenuItem<String>(
              value: b.id,
              child: Text(b.name, style: const TextStyle(color: Colors.white)),
            ),
          )
          .toList(),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        decoration: BoxDecoration(
          color: const Color(0xFF8D1A1A),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          children: [
            Text(label, style: const TextStyle(color: Colors.white)),
            const Icon(Icons.keyboard_arrow_down, color: Colors.white),
          ],
        ),
      ),
    );
  }

  // Banner: bấm vào mở UuDaiPage
  Widget _bannerCarousel() {
    return FutureBuilder<PromotionListResponse>(
      future: _promotionsFuture,
      builder: (context, snapshot) {
        final promos = snapshot.data?.data ?? [];
        final hasData = promos.isNotEmpty;

        if (snapshot.connectionState == ConnectionState.waiting &&
            !snapshot.hasData) {
          return Container(
            height: 220,
            decoration: BoxDecoration(
              color: const Color(0xFF3C1A1A),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: CircularProgressIndicator(color: Colors.white),
            ),
          );
        }

        if (snapshot.hasError) {
          return GestureDetector(
            onTap: () {
              setState(() {
                _promotionsFuture = _promotionService.getAvailablePromotions();
              });
            },
            child: Container(
              height: 220,
              decoration: BoxDecoration(
                color: const Color(0xFF3C1A1A),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Center(
                child: Text(
                  'Không thể tải ưu đãi (bấm để thử lại)',
                  style: TextStyle(color: Colors.white70),
                ),
              ),
            ),
          );
        }

        if (!hasData) {
          return Container(
            height: 220,
            decoration: BoxDecoration(
              color: const Color(0xFF3C1A1A),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Center(
              child: Text(
                'Chưa có ưu đãi khả dụng',
                style: TextStyle(color: Colors.white70),
              ),
            ),
          );
        }

        return Column(
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(20),
              child: CarouselSlider.builder(
                itemCount: promos.length,
                itemBuilder: (context, index, realIndex) {
                  final p = promos[index];
                  return GestureDetector(
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => DetailPromotionPage(promo: p),
                        ),
                      );
                    },
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        _buildPromoImage(p.displayImageUrl),
                        // Dark gradient to keep title/description readable on bright images
                        Positioned.fill(
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  Colors.transparent,
                                  Color(0x99000000),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 16,
                          bottom: 24,
                          right: 16,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                p.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                  shadows: [
                                    Shadow(
                                      offset: Offset(0, 1),
                                      blurRadius: 3,
                                      color: Colors.black54,
                                    ),
                                  ],
                                ),
                              ),
                              if (p.description?.isNotEmpty == true)
                                const SizedBox(height: 4),
                              if (p.description?.isNotEmpty == true)
                                Text(
                                  p.description!,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 13,
                                    shadows: [
                                      Shadow(
                                        offset: Offset(0, 1),
                                        blurRadius: 2,
                                        color: Colors.black45,
                                      ),
                                    ],
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  );
                },
                options: CarouselOptions(
                  height: 220,
                  viewportFraction: 1,
                  autoPlay: true,
                  onPageChanged: (index, reason) {
                    setState(() => _currentBanner = index);
                  },
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                promos.length,
                    (index) => Container(
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: _currentBanner == index ? 12 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color:
                    _currentBanner == index ? Colors.white : Colors.white54,
                  ),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildPromoImage(String? url) {
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _bannerPlaceholder(),
      );
    }
    return _bannerPlaceholder();
  }

  Widget _bannerPlaceholder() {
    return Container(
      color: const Color(0xFF3C1A1A),
      width: double.infinity,
      height: double.infinity,
      child: const Center(
        child: Icon(Icons.local_offer, color: Colors.white54, size: 48),
      ),
    );
  }

  Widget _featuredFoodsSection() {
    if (_selectedBranch == null) {
      if (_branchError != null) {
        return GestureDetector(
          onTap: _loadBranches,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFF1C0C0C),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              'Không thể tải chi nhánh (bấm để thử lại)',
              style: TextStyle(color: Colors.white70),
              textAlign: TextAlign.center,
            ),
          ),
        );
      }

      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1C0C0C),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Text(
          'Vui lòng chọn chi nhánh để xem món.',
          style: TextStyle(color: Colors.white70),
          textAlign: TextAlign.center,
        ),
      );
    }

    if (_loadingFeaturedFoods) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: 24),
          child: CircularProgressIndicator(color: Colors.white),
        ),
      );
    }

    if (_featuredError != null) {
      return GestureDetector(
        onTap: () => _loadFeaturedFoods(branchId: _selectedBranch!.id),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: const Color(0xFF1C0C0C),
            borderRadius: BorderRadius.circular(16),
          ),
          child: const Text(
            'Không thể tải món theo chi nhánh (bấm để thử lại)',
            style: TextStyle(color: Colors.white70),
            textAlign: TextAlign.center,
          ),
        ),
      );
    }

    if (_featuredFoods.isEmpty) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1C0C0C),
          borderRadius: BorderRadius.circular(16),
        ),
        child: const Text(
          'Chi nhánh này chưa có món khả dụng.',
          style: TextStyle(color: Colors.white70),
          textAlign: TextAlign.center,
        ),
      );
    }

    final display = _featuredFoods.take(4).toList();
    return Column(
      children: [
        for (int i = 0; i < display.length; i++) ...[
          _featuredFoodCard(display[i]),
          if (i != display.length - 1) const SizedBox(height: 16),
        ],
      ],
    );
  }

  Widget _featuredFoodCard(BranchFoodModel item) {
    final imageUrl = item.food.imageUrl;
    final menuItem = MenuItem(
      id: item.food.id,
      name: item.food.name,
      price: item.price,
      category: item.food.categoryName ?? 'Món ăn',
      description: item.food.description,
      imageUrl: item.food.imageUrl,
      categoryId: item.food.categoryId,
      isFavorite: FavoriteManager.isFavorite(item.food.id),
      avgRating: item.food.avgRating,
      ratingCount: item.food.ratingCount,
    );
    final placeholder = FoodImagePlaceholder(
      width: double.infinity,
      height: 180,
      borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
    );

    Widget imageWidget;
    if (imageUrl != null && imageUrl.isNotEmpty && imageUrl.startsWith('http')) {
      imageWidget = Image.network(
        imageUrl,
        height: 180,
        width: double.infinity,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      );
    } else {
      imageWidget = placeholder;
    }

    return InkWell(
      borderRadius: BorderRadius.circular(22),
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (_) => DishDetailPage(
              image: imageUrl,
              name: item.food.name,
              price: _currency.format(item.price),
              description: item.food.description.isNotEmpty
                  ? item.food.description
                  : 'Hương vị đặc trưng',
              ingredients: const [],
              isFavorite: FavoriteManager.isFavorite(item.food.id),
              avgRating: item.food.avgRating,
              ratingCount: item.food.ratingCount,
              onFavoriteChangedAsync: (newValue) {
                return _toggleFavoriteFromDetail(
                  item: menuItem,
                  targetState: newValue,
                );
              },
            ),
          ),
        );
      },
      child: Container(
        decoration: BoxDecoration(
          color: const Color(0xFF1C0C0C),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(22)),
              child: imageWidget,
            ),
            Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    item.food.name,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    item.food.description.isNotEmpty
                        ? item.food.description
                        : 'Hương vị đặc trưng',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (item.food.avgRating != null) ...[
                    const SizedBox(height: 8),
                    StarRating(
                      rating: item.food.avgRating!,
                      starSize: 16,
                      showNumber: true,
                    ),
                  ],
                  const SizedBox(height: 12),
                  Text(
                    _currency.format(item.price),
                    style: const TextStyle(
                      color: Colors.red,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _loadBranches() async {
    if (_loadingBranches) return;
    setState(() {
      _loadingBranches = true;
      _branchError = null;
    });
    try {
      final res = await _branchService.getBranches();
      final data = res.data;
      setState(() {
        _branches = data;
        _selectedBranch ??= data.isNotEmpty ? data.first : null;
      });
      final branch = _selectedBranch;
      if (branch != null) {
        await _loadFeaturedFoods(branchId: branch.id);
      }
    } catch (error) {
      setState(() {
        _branchError = error.toString();
      });
    } finally {
      if (mounted) setState(() => _loadingBranches = false);
    }
  }

  Future<void> _loadFeaturedFoods({required String branchId}) async {
    if (_loadingFeaturedFoods) return;
    setState(() {
      _loadingFeaturedFoods = true;
      _featuredError = null;
    });
    try {
      final res = await _foodService.getBranchFoods(
        branchId: branchId,
        page: 1,
        size: 20,
      );
      setState(() {
        _featuredFoods = res.data.where((e) => e.active).toList();
      });
    } catch (error) {
      setState(() {
        _featuredError = error.toString();
        _featuredFoods = [];
      });
    } finally {
      if (mounted) setState(() => _loadingFeaturedFoods = false);
    }
  }
}
