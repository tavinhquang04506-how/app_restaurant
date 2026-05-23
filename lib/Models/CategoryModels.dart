import 'BaseResponse.dart';

// ==================== CategoryModel ====================
class CategoryModel {
  CategoryModel({
    required this.id,
    required this.name,
    this.description,
  });

  final String id;
  final String name;
  final String? description;

  factory CategoryModel.fromJson(Map<String, dynamic> json) {
    return CategoryModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
    );
  }
}

// ==================== CategoryListResponse ====================
class CategoryListResponse extends BaseResponse {
  late List<CategoryModel> data;

  CategoryListResponse({
    required int statusCode,
    required String message,
    List<CategoryModel> data = const [],
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory CategoryListResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final list = raw is List ? raw : const [];
    return CategoryListResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(CategoryModel.fromJson)
          .toList(),
    );
  }
}

