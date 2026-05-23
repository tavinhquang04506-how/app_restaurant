import 'package:flutter/material.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';
import 'package:android/Components/StarRating.dart';

class DishDetailPage extends StatefulWidget {
  final String? image;
  final String name;
  final String price;
  final String description;
  final List<String> ingredients;
  final bool isFavorite;
  final double? avgRating;
  final int? ratingCount;
  final Future<bool> Function(bool newValue)? onFavoriteChangedAsync;

  const DishDetailPage({
    super.key,
    this.image,
    required this.name,
    required this.price,
    required this.description,
    required this.ingredients,
    required this.isFavorite,
    this.avgRating,
    this.ratingCount,
    this.onFavoriteChangedAsync,
  });

  @override
  State<DishDetailPage> createState() => _DishDetailPageState();
}

class _DishDetailPageState extends State<DishDetailPage> {
  late bool _isFavorite;

  @override
  void initState() {
    super.initState();
    _isFavorite = widget.isFavorite;
  }

  Widget _buildHeaderImage() {
    final source = widget.image;
    final placeholder = FoodImagePlaceholder(
      borderRadius: BorderRadius.circular(0),
    );

    if (source != null && source.startsWith('http')) {
      return Image.network(
        source,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      );
    }

    if (source != null && source.isNotEmpty) {
      return Image.asset(
        source,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      );
    }

    return placeholder;
  }

  void _toggleFavorite() {
    final target = !_isFavorite;
    setState(() {
      _isFavorite = target;
    });

    // Async handler (for home) to allow reverting on failure.
    final asyncHandler = widget.onFavoriteChangedAsync;
    if (asyncHandler != null) {
      asyncHandler(target).then((committedState) {
        if (committedState != _isFavorite) {
          setState(() {
            _isFavorite = committedState;
          });
        }
      });
      return;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      body: SafeArea(
        child: Column(
          children: [
            // ẢNH
            SizedBox(
              height: 350,
              width: double.infinity,
              child: Stack(
                children: [
                  Positioned.fill(child: _buildHeaderImage()),
                  Positioned.fill(
                    child: Container(
                      color: Colors.black.withValues(alpha: 0.25),
                    ),
                  ),
                  // nút back
                  Positioned(
                    top: 12,
                    left: 12,
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withValues(alpha: 0.4),
                      child: IconButton(
                        icon: const Icon(Icons.arrow_back, color: Colors.white),
                        onPressed: () => Navigator.pop(context),
                      ),
                    ),
                  ),
                  // nút yêu thích
                  Positioned(
                    top: 12,
                    right: 12,
                    child: CircleAvatar(
                      backgroundColor: Colors.black.withValues(alpha: 0.4),
                      child: IconButton(
                        icon: Icon(
                          _isFavorite ? Icons.favorite : Icons.favorite_border,
                          color: _isFavorite ? Colors.redAccent : Colors.white,
                        ),
                        onPressed: _toggleFavorite,
                      ),
                    ),
                  ),
                ],
              ),
            ),

            // NỘI DUNG
            Expanded(
              child: Container(
                color: const Color(0xFF2A0E0E),
                child: DefaultTabController(
                  length: 2,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Tên + giá
                      Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 16,
                          vertical: 12,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.center,
                              children: [
                                Expanded(
                                  child: Text(
                                    widget.name,
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontSize: 22,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                ),
                                if (widget.avgRating != null) ...[
                                  const SizedBox(width: 8),
                                  StarRating(
                                    rating: widget.avgRating!,
                                    starSize: 18,
                                    showNumber: false,
                                  ),
                                ],
                              ],
                            ),
                            const SizedBox(height: 4),
                            Text(
                              widget.price,
                              style: const TextStyle(
                                color: Colors.redAccent,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),

                      TabBar(
                        labelColor: Colors.white,
                        unselectedLabelColor: Colors.white54,
                        indicatorColor: Colors.redAccent,
                        tabs: [
                          const Tab(text: "Mô tả"),
                          Tab(text: "Đánh giá (${widget.ratingCount ?? 0})"),
                        ],
                      ),

                      Expanded(
                        child: TabBarView(
                          children: [
                            // TAB MÔ TẢ
                            SingleChildScrollView(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    widget.description,
                                    style: const TextStyle(
                                      color: Colors.white70,
                                      fontSize: 19,
                                      height: 1.5,
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  ...widget.ingredients.map(
                                    (ing) => Row(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        const Text(
                                          "• ",
                                          style: TextStyle(
                                            color: Colors.white70,
                                            fontSize: 14,
                                          ),
                                        ),
                                        Expanded(
                                          child: Text(
                                            ing,
                                            style: const TextStyle(
                                              color: Colors.white70,
                                              fontSize: 14,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                  const SizedBox(height: 16),
                                  const Text(
                                    "Ghi chú đặc biệt:",
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 12,
                                      vertical: 8,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF3C1A1A),
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const TextField(
                                      maxLines: 3,
                                      style: TextStyle(color: Colors.white),
                                      decoration: InputDecoration(
                                        hintText:
                                            "Ví dụ: ít cay, không hành...",
                                        hintStyle: TextStyle(
                                          color: Colors.white54,
                                        ),
                                        border: InputBorder.none,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),

                            // TAB ĐÁNH GIÁ
                            const Center(
                              child: Text(
                                "Chức năng đánh giá sẽ bổ sung sau.",
                                style: TextStyle(color: Colors.white70),
                                textAlign: TextAlign.center,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: const BoxDecoration(
          color: Color(0xFF2A0E0E),
          boxShadow: [
            BoxShadow(
              color: Colors.black54,
              blurRadius: 6,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: SizedBox(
          height: 48,
          child: ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, '/datban');
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.redAccent,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'Đặt bàn',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ),
        ),
      ),
    );
  }
}
