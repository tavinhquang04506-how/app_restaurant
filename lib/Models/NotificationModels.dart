import 'BaseResponse.dart';

/// Model cho notification từ backend
class NotificationModel {
  final String? id;
  final String type;       // PROMOTION | BOOKING_REMINDER
  final String title;
  final String? message;
  final String? image;
  final String? bookingId;
  final bool isRead;
  final DateTime? createdAt;

  NotificationModel({
    this.id,
    required this.type,
    required this.title,
    this.message,
    this.image,
    this.bookingId,
    this.isRead = false,
    this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] as String?,
      type: json['type'] as String,
      title: json['title'] as String,
      message: json['message'] as String?,
      image: json['image'] as String?,
      bookingId: json['bookingId'] as String?,
      isRead: (json['isRead'] as bool?) ?? (json['read'] as bool?) ?? false,
      createdAt: json['createdAt'] != null 
          ? DateTime.tryParse(json['createdAt'].toString())
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'type': type,
      'title': title,
      'message': message,
      'image': image,
      'bookingId': bookingId,
      'isRead': isRead,
      'createdAt': createdAt?.toIso8601String(),
    };
  }

  /// Kiểm tra loại notification
  bool get isPromotion => type == 'PROMOTION';
  bool get isBookingReminder => type == 'BOOKING_REMINDER';

  /// Format thời gian hiển thị
  String get timeAgo {
    if (createdAt == null) return '';
    final diff = DateTime.now().difference(createdAt!);
    if (diff.inMinutes < 1) return 'Vừa xong';
    if (diff.inMinutes < 60) return '${diff.inMinutes} phút trước';
    if (diff.inHours < 24) return '${diff.inHours} giờ trước';
    if (diff.inDays < 7) return '${diff.inDays} ngày trước';
    return '${createdAt!.day}/${createdAt!.month}/${createdAt!.year}';
  }
}

/// Pagination meta
class NotificationMeta {
  final int page;
  final int pages;
  final int pageSize;
  final int total;

  NotificationMeta({
    required this.page,
    required this.pages,
    required this.pageSize,
    required this.total,
  });

  factory NotificationMeta.fromJson(Map<String, dynamic> json) {
    return NotificationMeta(
      page: (json['page'] as num).toInt(),
      pages: (json['pages'] as num).toInt(),
      pageSize: (json['pageSize'] as num).toInt(),
      total: (json['total'] as num).toInt(),
    );
  }
}

/// Response wrapper cho danh sách notification
class NotificationListResponse extends BaseResponse {
  final List<NotificationModel> data;
  final NotificationMeta? meta;

  NotificationListResponse({
    required super.statusCode,
    required super.message,
    required this.data,
    this.meta,
  });

  factory NotificationListResponse.fromJson(Map<String, dynamic> json) {
    final dataJson = json['data'];
    List<NotificationModel> notifications = [];
    NotificationMeta? meta;

    if (dataJson is Map<String, dynamic>) {
      // Pagination response: { meta: {...}, result: [...] }
      final resultList = dataJson['result'] as List? ?? [];
      notifications = resultList
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
      if (dataJson['meta'] != null) {
        meta = NotificationMeta.fromJson(dataJson['meta'] as Map<String, dynamic>);
      }
    } else if (dataJson is List) {
      // Direct list response
      notifications = dataJson
          .map((e) => NotificationModel.fromJson(e as Map<String, dynamic>))
          .toList();
    }

    return NotificationListResponse(
      statusCode: json['statusCode'] as int,
      message: json['message'] as String,
      data: notifications,
      meta: meta,
    );
  }

  bool get hasMore => meta != null && meta!.page < meta!.pages;
}

