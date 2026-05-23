import 'package:android/Utils/ApiConfig.dart';
import 'BaseResponse.dart';

String? _resolvePromotionImageUrl(String? value) {
  if (value == null || value.trim().isEmpty) return null;
  return '${buildApiBasePath()}/storage/promotion/${value.trim()}';
}

// ==================== PromotionModel ====================
class PromotionModel {
  PromotionModel({
    required this.id,
    required this.code,
    required this.name,
    this.imageUrl,
    required this.discountPercent,
    required this.quantity,
    required this.remaining,
    required this.active,
    this.description,
    this.startDate,
    this.endDate,
  });

  final String id;
  final String code;
  final String name;
  final String? description;
  final String? imageUrl;
  final int discountPercent;
  final int quantity;
  final int remaining;
  final bool active;
  final DateTime? startDate;
  final DateTime? endDate;

  bool get hasStock => remaining > 0;
  String? get displayImageUrl => _resolvePromotionImageUrl(imageUrl);

  factory PromotionModel.fromJson(Map<String, dynamic> json) {
    return PromotionModel(
      id: json['id'] as String,
      code: json['code'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      imageUrl: json['imageUrl'] as String?,
      discountPercent: (json['discountPercent'] as num).toInt(),
      quantity: (json['quantity'] as num).toInt(),
      remaining: (json['remaining'] as num).toInt(),
      active: json['active'] as bool,
      startDate:
          json['startDate'] != null ? DateTime.parse(json['startDate']) : null,
      endDate:
          json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
    );
  }
}

// ==================== PromotionListResponse ====================
class PromotionListResponse extends BaseResponse {
  late List<PromotionModel> data;

  PromotionListResponse({
    required int statusCode,
    required String message,
    List<PromotionModel> data = const [],
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory PromotionListResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final list = raw is List ? raw : const [];
    return PromotionListResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(PromotionModel.fromJson)
          .toList(),
    );
  }
}

