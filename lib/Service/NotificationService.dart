import '../Repository/NotificationRepository.dart';
import '../Models/NotificationModels.dart';

class NotificationService {
  NotificationService({NotificationRepository? repository})
      : _repository = repository ?? NotificationRepository();

  final NotificationRepository _repository;

  /// Lấy notification GLOBAL (khuyến mãi, sự kiện)
  Future<NotificationListResponse> getGlobalNotifications({
    int page = 1,
    int size = 10,
  }) {
    return _repository.getGlobalNotifications(page: page, size: size);
  }

  /// Lấy notification của user (đặt bàn, nhắc lịch)
  Future<NotificationListResponse> getMyNotifications({
    int page = 1,
    int size = 10,
  }) {
    return _repository.getMyNotifications(page: page, size: size);
  }

  /// Lấy tất cả notification (GLOBAL + USER_ONLY) - gộp 2 API
  Future<List<NotificationModel>> getAllNotifications() async {
    final results = await Future.wait([
      _repository.getGlobalNotifications(page: 1, size: 50),
      _repository.getMyNotifications(page: 1, size: 50),
    ]);
    
    final globalList = results[0].data;
    final myList = results[1].data;
    
    // Gộp và sắp xếp theo thời gian
    final all = [...globalList, ...myList];
    all.sort((a, b) {
      final aTime = a.createdAt ?? DateTime(2000);
      final bTime = b.createdAt ?? DateTime(2000);
      return bTime.compareTo(aTime); // Mới nhất lên đầu
    });
    
    return all;
  }

  /// Đếm số notification chưa đọc
  Future<int> getUnreadCount() async {
    try {
      final all = await getAllNotifications();
      return all.where((n) => !n.isRead).length;
    } catch (_) {
      return 0;
    }
  }

  /// Đánh dấu đã đọc
  Future<void> markAsRead(String notificationId) {
    return _repository.markAsRead(notificationId);
  }
}

