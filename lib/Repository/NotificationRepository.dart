import '../Utils/Utils.dart';
import '../Models/NotificationModels.dart';
import 'HttpRepository.dart';

class NotificationRepository extends HttpRepository {
  
  /// Lấy notification GLOBAL (khuyến mãi, sự kiện chung)
  Future<NotificationListResponse> getGlobalNotifications({
    int page = 1,
    int size = 10,
  }) async {
    final json = await getJson(
      Utils.notificationsGlobalApi,
      query: {'page': page - 1, 'size': size},
    );
    return NotificationListResponse.fromJson(json);
  }

  /// Lấy notification USER_ONLY của user hiện tại (đặt bàn, nhắc lịch)
  Future<NotificationListResponse> getMyNotifications({
    int page = 1,
    int size = 10,
  }) async {
    final json = await getJson(
      Utils.notificationsApi,
      query: {'page': page - 1, 'size': size},
    );
    return NotificationListResponse.fromJson(json);
  }

  /// Đánh dấu notification đã đọc
  Future<void> markAsRead(String notificationId) async {
    await putJson(Utils.notificationMarkReadApi(notificationId));
  }
}

