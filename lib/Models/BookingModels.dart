import 'BaseResponse.dart';
import 'FoodModels.dart';
import 'BranchModels.dart';
import 'PromotionModels.dart';

// ==================== BookingTableModel ====================
class BookingTableModel {
  BookingTableModel({
    required this.id,
    required this.tableCode,
    required this.capacity,
    this.location,
    this.status,
  });

  final String id;
  final String tableCode;
  final int capacity;
  final String? location;
  final String? status;

  factory BookingTableModel.fromJson(Map<String, dynamic> json) {
    return BookingTableModel(
      id: json['id'] as String,
      tableCode: json['tableCode'] as String,
      capacity: (json['capacity'] as num).toInt(),
      location: json['location'] as String?,
      status: json['status'] as String?,
    );
  }
}

// ==================== TableAvailabilityModel ====================
class TableAvailabilityModel {
  TableAvailabilityModel({
    required this.tableId,
    required this.tableCode,
    required this.capacity,
    required this.status,
    required this.booked,
    this.reservedFrom,
    this.reservedTo,
  });

  final String tableId;
  final String tableCode;
  final int capacity;
  final String status;
  final bool booked;
  final DateTime? reservedFrom;
  final DateTime? reservedTo;

  factory TableAvailabilityModel.fromJson(Map<String, dynamic> json) {
    DateTime? parseDate(String? input) =>
        input == null ? null : DateTime.parse(input);

    return TableAvailabilityModel(
      tableId: json['tableId'] as String,
      tableCode: json['tableCode'] as String,
      capacity: (json['capacity'] as num).toInt(),
      status: json['status'] as String,
      booked: json['booked'] as bool,
      reservedFrom: parseDate(json['reservedFrom'] as String?),
      reservedTo: parseDate(json['reservedTo'] as String?),
    );
  }
}

// ==================== BookingDishModel ====================
class BookingDishModel {
  BookingDishModel({
    required this.id,
    required this.quantity,
    required this.unitPrice,
    required this.servingOrder,
    this.specialNote,
    this.food,
  });

  final String id;
  final int quantity;
  final int unitPrice;
  final int servingOrder;
  final String? specialNote;
  final FoodModel? food;

  int get totalPrice => quantity * unitPrice;

  factory BookingDishModel.fromJson(Map<String, dynamic> json) {
    final food = json['food'] as Map<String, dynamic>?;
    return BookingDishModel(
      id: json['id'] as String,
      quantity: (json['quantity'] as num).toInt(),
      unitPrice: (json['unitPrice'] as num).toInt(),
      servingOrder: (json['servingOrder'] as num).toInt(),
      specialNote: json['specialNote'] as String?,
      food: food != null ? FoodModel.fromJson(food) : null,
    );
  }
}

// ==================== BookingDishPayload ====================
class BookingDishPayload {
  BookingDishPayload({
    required this.foodId,
    required this.quantity,
    required this.servingOrder,
    this.specialNote,
  });

  final String foodId;
  final int quantity;
  final int servingOrder;
  final String? specialNote;

  Map<String, dynamic> toJson() => {
        'foodId': foodId,
        'quantity': quantity,
        'servingOrder': servingOrder,
        if (specialNote != null && specialNote!.isNotEmpty)
          'specialNote': specialNote,
      };
}

// ==================== BookingRequestPayload ====================
class BookingRequestPayload {
  BookingRequestPayload({
    required this.bookingTime,
    required this.guests,
    required this.tableId,
    required this.branchId,
    this.specialRequest,
    this.dishes = const [],
    this.promotionCode,
    this.durationMinutes = 120,
  });

  final DateTime bookingTime;
  final int guests;
  final String tableId;
  final String branchId;
  final String? specialRequest;
  final List<BookingDishPayload> dishes;
  final String? promotionCode;
  final int durationMinutes;

  Map<String, dynamic> toJson() => {
        'bookingTime': bookingTime.toIso8601String(),
        'guests': guests,
        'tableId': tableId,
        'branchId': branchId,
        'durationMinutes': durationMinutes,
        if (specialRequest != null && specialRequest!.isNotEmpty)
          'specialRequest': specialRequest,
        if (dishes.isNotEmpty) 'dishes': dishes.map((e) => e.toJson()).toList(),
        if (promotionCode != null && promotionCode!.isNotEmpty)
          'promotionCode': promotionCode,
      };
}

// ==================== BookingResponseModel ====================
class BookingResponseModel {
  BookingResponseModel({
    required this.id,
    required this.reservedFrom,
    required this.reservedTo,
    required this.guests,
    required this.status,
    this.specialRequest,
    this.branch,
    this.table,
    this.subtotalAmount,
    this.discountAmount,
    this.totalAmount,
    this.promotion,
    this.dishes = const [],
  });

  final String id;
  final DateTime reservedFrom;
  final DateTime reservedTo;
  final int guests;
  final String status;
  final String? specialRequest;
  final BranchModel? branch;
  final BookingTableModel? table;
  final int? subtotalAmount;
  final int? discountAmount;
  final int? totalAmount;
  final PromotionModel? promotion;
  final List<BookingDishModel> dishes;

  String get branchName => branch?.name ?? '';
  String get tableCode => table?.tableCode ?? '';

  int get computedSubtotal {
    if (subtotalAmount != null) return subtotalAmount!;
    return dishes.fold<int>(0, (sum, dish) => sum + dish.totalPrice);
  }

  int get computedDiscount => discountAmount ?? 0;

  int get computedTotal {
    if (totalAmount != null) return totalAmount!;
    final value = computedSubtotal - computedDiscount;
    return value < 0 ? 0 : value;
  }

  factory BookingResponseModel.fromJson(Map<String, dynamic> json) {
    final table = json['table'] as Map<String, dynamic>?;
    final branch = json['branch'] as Map<String, dynamic>?;
    final dishes = json['dishes'] as List<dynamic>? ?? [];
    final promotion = json['promotion'] as Map<String, dynamic>?;
    return BookingResponseModel(
      id: json['id'] as String,
      reservedFrom: DateTime.parse(json['reservedFrom'] as String),
      reservedTo: DateTime.parse(json['reservedTo'] as String),
      guests: (json['guests'] as num).toInt(),
      status: json['status'] as String,
      specialRequest: json['specialRequest'] as String?,
      branch: branch != null ? BranchModel.fromJson(branch) : null,
      table: table != null ? BookingTableModel.fromJson(table) : null,
      subtotalAmount: (json['subtotalAmount'] as num?)?.toInt(),
      discountAmount: (json['discountAmount'] as num?)?.toInt(),
      totalAmount: (json['totalAmount'] as num?)?.toInt(),
      promotion: promotion != null ? PromotionModel.fromJson(promotion) : null,
      dishes: dishes
          .map((e) => BookingDishModel.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

// ==================== BookingListResponse ====================
class BookingListResponse extends BaseResponse {
  late List<BookingResponseModel> data;

  BookingListResponse({
    required int statusCode,
    required String message,
    List<BookingResponseModel> data = const [],
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory BookingListResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final list = raw is List ? raw : const [];
    return BookingListResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(BookingResponseModel.fromJson)
          .toList(),
    );
  }
}

// ==================== BookingResponseWrapper ====================
class BookingResponseWrapper extends BaseResponse {
  BookingResponseModel? data;

  BookingResponseWrapper({
    required int statusCode,
    required String message,
    this.data,
  }) : super(statusCode: statusCode, message: message);

  factory BookingResponseWrapper.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    return BookingResponseWrapper(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: payload is Map<String, dynamic>
          ? BookingResponseModel.fromJson(payload)
          : null,
    );
  }
}

// ==================== TableAvailabilityListResponse ====================
class TableAvailabilityListResponse extends BaseResponse {
  late List<TableAvailabilityModel> data;

  TableAvailabilityListResponse({
    required int statusCode,
    required String message,
    List<TableAvailabilityModel> data = const [],
  }) : super(statusCode: statusCode, message: message) {
    this.data = data;
  }

  factory TableAvailabilityListResponse.fromJson(Map<String, dynamic> json) {
    final raw = json['data'];
    final list = raw is List ? raw : const [];
    return TableAvailabilityListResponse(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: list
          .whereType<Map<String, dynamic>>()
          .map(TableAvailabilityModel.fromJson)
          .toList(),
    );
  }
}

