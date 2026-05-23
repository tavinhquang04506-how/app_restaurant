import 'package:flutter/material.dart';
import 'package:android/Models/backend_models.dart';
import 'DetailPromotionPage.dart';
import 'package:android/Service/PromotionService.dart';

class PromotionPage extends StatefulWidget {
  const PromotionPage({super.key});

  @override
  State<PromotionPage> createState() => _PromotionPage();
}

class _PromotionPage extends State<PromotionPage> {
  late Future<PromotionListResponse> _futurePromotions;
  final PromotionService _promotionService = PromotionService();

  @override
  void initState() {
    super.initState();
    _futurePromotions = _promotionService.getAvailablePromotions();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          "Ưu đãi",
          style: TextStyle(
            color: Colors.white,
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        centerTitle: true,
        backgroundColor: const Color(0xFF3C1A1A),
        elevation: 0,
        leading: IconButton(
          onPressed: () {
            Navigator.pop(context);
          },
          icon: const Icon(
            Icons.arrow_back,
            color: Colors.white,
          ),
        ),
      ),
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            colors: [Color(0xFF2A0E0E), Color(0xFF1C0C0C)],
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
          ),
        ),
        child: FutureBuilder<PromotionListResponse>(
          future: _futurePromotions,
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const Center(
                child: CircularProgressIndicator(color: Colors.redAccent),
              );
            }
            if (snapshot.hasError) {
              return Center(
                child: Text(
                  'Không thể tải ưu đãi: ${snapshot.error}',
                  style: const TextStyle(color: Colors.white),
                  textAlign: TextAlign.center,
                ),
              );
            }
            final promotions = snapshot.data?.data ?? [];
            if (promotions.isEmpty) {
              return const Center(
                child: Text(
                  'Chưa có ưu đãi khả dụng',
                  style: TextStyle(color: Colors.white70),
                ),
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
              itemCount: promotions.length,
              itemBuilder: (context, index) {
                final promo = promotions[index];
                return Card(
                  color: const Color(0xFF3C1A1A),
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  elevation: 4,
                  shadowColor: Colors.black54,
                  child: InkWell(
                    borderRadius: BorderRadius.circular(16),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (_) => DetailPromotionPage(promo: promo),
                        ),
                      );
                    },
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Row(
                        children: [
                          ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: _buildPromoImage(promo.displayImageUrl),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  promo.name,
                                  style: const TextStyle(
                                    color: Colors.white,
                                    fontSize: 18,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  promo.description ?? '',
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 14,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 6),
                                Text(
                                  _buildExpiryText(promo),
                                  style: const TextStyle(
                                    color: Colors.redAccent,
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                const SizedBox(height: 8),
                                Align(
                                  alignment: Alignment.bottomRight,
                                  child: ElevatedButton(
                                    onPressed: () {
                                      Navigator.push(
                                        context,
                                        MaterialPageRoute(
                                          builder: (_) =>
                                              DetailPromotionPage(promo: promo),
                                        ),
                                      );
                                    },
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: Colors.red.shade700,
                                      shape: RoundedRectangleBorder(
                                        borderRadius: BorderRadius.circular(12),
                                      ),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 16, vertical: 8),
                                      elevation: 2,
                                    ),
                                    child: const Text(
                                      "Xem chi tiết",
                                      style: TextStyle(fontSize: 14),
                                    ),
                                  ),
                                )
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildPromoImage(String? url) {
    if (url != null && url.isNotEmpty) {
      return Image.network(
        url,
        width: 100,
        height: 100,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _promoPlaceholder(),
      );
    }
    return _promoPlaceholder();
  }

  Widget _promoPlaceholder() {
    return Container(
      width: 100,
      height: 100,
      color: Colors.white10,
      child: const Icon(Icons.local_offer, color: Colors.white54),
    );
  }

  String _buildExpiryText(PromotionModel promo) {
    if (promo.endDate == null) return 'Không thời hạn';
    final now = DateTime.now();
    if (promo.endDate!.isBefore(now)) return 'Hết hạn';
    final diff = promo.endDate!.difference(now).inDays;
    if (diff <= 0) return 'Còn ít hơn 1 ngày';
    return 'Còn $diff ngày';
  }
}
