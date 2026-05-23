import 'package:android/Utils/ApiConfig.dart';
import 'BaseResponse.dart';

String? _resolveFoodImageUrl(String? fileName) {
  if (fileName == null || fileName.trim().isEmpty) return null;
  return '${buildApiBasePath()}/storage/food/${fileName.trim()}';
}

// ==================== FoodModel ====================
class FoodModel {
  FoodModel({
    required this.id,
    required this.name,
    required this.description,
    this.thumbUrl,
    required this.price,
    this.categoryId,
    this.categoryName,
    this.avgRating,
    this.ratingCount,
  });

  final String id;
  final String name;
  final String description;
  final String? thumbUrl;
  final int price;
  final String? categoryId;
  final String? categoryName;
   // rating trung bình và số lượt rating cho món
  final double? avgRating;
  final int? ratingCount;

  String? get imageUrl => _resolveFoodImageUrl(thumbUrl);

  factory FoodModel.fromJson(Map<String, dynamic> json) {
    final category = json['category'] as Map<String, dynamic>?;
    return FoodModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      thumbUrl: json['thumbUrl'] as String?,
      price: (json['price'] as num).toInt(),
      categoryId: category != null ? category['id'] as String? : null,
      categoryName: category != null ? category['name'] as String? : null,
      avgRating: (json['avgRating'] as num?)?.toDouble(),
      ratingCount: (json['ratingCount'] as num?)?.toInt(),
    );
  }
}

// ==================== PaginationMeta ====================
class PaginationMeta {
  PaginationMeta({
    required this.page,
    required this.pageSize,
    required this.pages,
    required this.total,
  });

  final int page;
  final int pageSize;
  final int pages;
  final int total;

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    return PaginationMeta(
      page: (json['page'] as num).toInt(),
      pageSize: (json['pageSize'] as num).toInt(),
      pages: (json['pages'] as num).toInt(),
      total: (json['total'] as num).toInt(),
    );
  }
}

// ==================== FoodPageResponse ====================
class FoodPageResponse extends BaseResponse {
  late List<FoodModel> data;
  PaginationMeta? meta;

  FoodPageResponse({
    required int statusCode,
    required String message,
    List<FoodModel> data = const [],
    this.meta,
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory FoodPageResponse.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    final dataMap = payload is Map<String, dynamic> ? payload : <String, dynamic>{};
    final result = dataMap['result'];
    final list = result is List ? result : const [];
    final metaRaw = dataMap['meta'];
    return FoodPageResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      meta: metaRaw is Map<String, dynamic> ? PaginationMeta.fromJson(metaRaw) : null,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(FoodModel.fromJson)
          .toList(),
    );
  }
}

// ==================== FavoriteFoodListResponse ====================
class FavoriteFoodListResponse extends BaseResponse {
  late List<FoodModel> data;

  FavoriteFoodListResponse({
    required int statusCode,
    required String message,
    List<FoodModel> data = const [],
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory FavoriteFoodListResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final list = raw is List ? raw : const [];
    return FavoriteFoodListResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(FoodModel.fromJson)
          .toList(),
    );
  }
}

