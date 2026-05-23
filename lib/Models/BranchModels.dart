import 'BaseResponse.dart';
import 'FoodModels.dart';

// ==================== BranchModel ====================
class BranchModel {
  BranchModel({
    required this.id,
    required this.name,
    required this.address,
    required this.phone,
    this.imageUrl,
    this.openTime,
    this.closeTime,
  });

  final String id;
  final String name;
  final String address;
  final String phone;
  final String? imageUrl;
  final String? openTime;
  final String? closeTime;

  factory BranchModel.fromJson(Map<String, dynamic> json) {
    return BranchModel(
      id: json['id'] as String,
      name: json['name'] as String,
      address: json['address'] as String,
      phone: json['phone'] as String,
      imageUrl: json['imageUrl'] as String?,
      openTime: json['openTime'] as String?,
      closeTime: json['closeTime'] as String?,
    );
  }
}

// ==================== BranchFoodModel ====================
class BranchFoodModel {
  BranchFoodModel({
    required this.id,
    required this.price,
    required this.active,
    required this.branch,
    required this.food,
  });

  final String id;
  final int price;
  final bool active;
  final BranchModel branch;
  final FoodModel food;

  factory BranchFoodModel.fromJson(Map<String, dynamic> json) {
    return BranchFoodModel(
      id: json['id'] as String,
      price: (json['price'] as num).toInt(),
      active: json['active'] as bool,
      branch: BranchModel.fromJson(json['branch'] as Map<String, dynamic>),
      food: FoodModel.fromJson(json['food'] as Map<String, dynamic>),
    );
  }
}

// ==================== BranchListResponse ====================
class BranchListResponse extends BaseResponse {
  late List<BranchModel> data;

  BranchListResponse({
    required int statusCode,
    required String message,
    List<BranchModel> data = const [],
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory BranchListResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final list = raw is List ? raw : const [];
    return BranchListResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(BranchModel.fromJson)
          .toList(),
    );
  }
}

// ==================== BranchFoodPageResponse ====================
class BranchFoodPageResponse extends BaseResponse {
  late List<BranchFoodModel> data;
  PaginationMeta? meta;

  BranchFoodPageResponse({
    required int statusCode,
    required String message,
    List<BranchFoodModel> data = const [],
    this.meta,
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory BranchFoodPageResponse.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    final dataMap = payload is Map<String, dynamic> ? payload : <String, dynamic>{};
    final result = dataMap['result'];
    final list = result is List ? result : const [];
    final metaRaw = dataMap['meta'];
    return BranchFoodPageResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      meta: metaRaw is Map<String, dynamic> ? PaginationMeta.fromJson(metaRaw) : null,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(BranchFoodModel.fromJson)
          .toList(),
    );
  }
}

