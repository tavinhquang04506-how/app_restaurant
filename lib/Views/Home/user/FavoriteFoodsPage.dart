import 'package:flutter/material.dart';

import 'package:android/Utils/AppSession.dart';
import 'package:android/Components/FoodImage.dart';
import 'package:android/Service/FavoriteHelper.dart';
import '../food/FoodMenuPage.dart';
import 'package:android/Models/MenuItem.dart';
import '../food/FoodDetailPage.dart';
import 'package:android/Service/FavoriteService.dart';

class FavoriteFoodsPage extends StatefulWidget {
  const FavoriteFoodsPage({super.key});

  @override
  State<FavoriteFoodsPage> createState() => _FavoriteFoodsPageState();
}

class _FavoriteFoodsPageState extends State<FavoriteFoodsPage> {
  final FavoriteService _favoriteService = FavoriteService();
  bool _loading = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _refreshFavorites();
  }

  Future<void> _refreshFavorites() async {
    if (!AppSession.isLoggedIn) {
      FavoriteManager.clear();
      setState(() => _loading = false);
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await FavoriteHelper.syncFromServer(api: _favoriteService);
    } catch (err) {
      setState(() {
        _error = err.toString();
      });
    } finally {
      setState(() => _loading = false);
    }
  }

  bool _ensureHasBooking(BuildContext context) {
    final booking = AppSession.currentBooking.value;
    if (booking == null || booking.tableId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng chọn bàn trước khi thêm món.'),
        ),
      );
      Navigator.pushNamed(context, '/datban');
      return false;
    }
    return true;
  }

  void _addOne(BuildContext context, MenuItem item) {
    if (!_ensureHasBooking(context)) return;
    globalCart[item] = (globalCart[item] ?? 0) + 1;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Đã thêm ${item.name} vào món đã chọn.'),
      ),
    );
  }

  Future<void> _updateFavorite(MenuItem item, bool favorite) async {
    await FavoriteHelper.setFavorite(
      context: context,
      api: _favoriteService,
      item: item,
      favorite: favorite,
      onLocalChanged: (value) => item.isFavorite = value,
    );
  }

  Future<bool> _toggleFavoriteFromDetail(MenuItem item, bool newValue) async {
    await _updateFavorite(item, newValue);
    return FavoriteManager.isFavorite(item.id);
  }

  void _openDetail(BuildContext context, MenuItem item) {
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
  }

  @override
  Widget build(BuildContext context) {
    final loggedIn = AppSession.isLoggedIn;
    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      appBar: AppBar(
        title: const Text('Món ăn yêu thích'),
        backgroundColor: const Color(0xFF2A0E0E),
        foregroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Colors.white),
        titleTextStyle: const TextStyle(
          color: Colors.white,
          fontSize: 18,
          fontWeight: FontWeight.w600,
        ),
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _refreshFavorites,
            icon: const Icon(Icons.refresh),
          ),
        ],
      ),
      body: loggedIn
          ? ValueListenableBuilder<List<MenuItem>>(
              valueListenable: FavoriteManager.favorites,
              builder: (context, favorites, _) {
                if (_loading) {
                  return const Center(
                    child: CircularProgressIndicator(),
                  );
                }
                if (_error != null) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          _error!,
                          style: const TextStyle(color: Colors.white70),
                        ),
                        const SizedBox(height: 12),
                        ElevatedButton(
                          onPressed: _refreshFavorites,
                          child: const Text('Thử lại'),
                        ),
                      ],
                    ),
                  );
                }
                if (favorites.isEmpty) {
                  return const Center(
                    child: Text(
                      'Bạn chưa lưu món nào.',
                      style: TextStyle(color: Colors.white70),
                    ),
                  );
                }
                return Padding(
                  padding: const EdgeInsets.all(16),
                  child: GridView.builder(
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: 2,
                      childAspectRatio: 0.75,
                      crossAxisSpacing: 16,
                      mainAxisSpacing: 16,
                    ),
                    itemCount: favorites.length,
                    itemBuilder: (context, index) {
                      final item = favorites[index];
                      return GestureDetector(
                        onTap: () => _openDetail(context, item),
                        child: Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFF1B1B1F),
                            borderRadius: BorderRadius.circular(18),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                child: Stack(
                                  children: [
                                    Positioned.fill(
                                      child: FoodImage(
                                        source: item.imageUrl,
                                        borderRadius: BorderRadius.circular(16),
                                      ),
                                    ),
                                    Positioned(
                                      top: 8,
                                      right: 8,
                                      child: GestureDetector(
                                        onTap: () => _updateFavorite(item, false),
                                        child: CircleAvatar(
                                          backgroundColor: Colors.black
                                              .withValues(alpha: 0.4),
                                          child: const Icon(
                                            Icons.favorite,
                                            color: Colors.redAccent,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Padding(
                                padding: const EdgeInsets.all(12.0),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item.name,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w600,
                                        fontSize: 16,
                                      ),
                                    ),
                                    const SizedBox(height: 4),
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
                              Padding(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 12,
                                  vertical: 8,
                                ),
                                child: Align(
                                  alignment: Alignment.centerRight,
                                  child: GestureDetector(
                                    onTap: () => _addOne(context, item),
                                    child: Container(
                                      padding: const EdgeInsets.all(10),
                                      decoration: BoxDecoration(
                                        color: Colors.redAccent,
                                        borderRadius: BorderRadius.circular(20),
                                      ),
                                      child: const Icon(Icons.add,
                                          color: Colors.white),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                );
              },
            )
          : Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Text(
                    'Đăng nhập để lưu món yêu thích.',
                    style: TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 12),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.pushNamed(context, '/login');
                    },
                    child: const Text('Đăng nhập'),
                  ),
                ],
              ),
            ),
    );
  }
}

