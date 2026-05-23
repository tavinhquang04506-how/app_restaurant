import 'package:flutter/foundation.dart';
import '../Models/NotificationModels.dart';
import 'NotificationService.dart';

/// Singleton quản lý notification state trong toàn app.
/// - Lưu danh sách notification
/// - Track số chưa đọc (badge count)
/// - Notify UI khi có thay đổi
class NotificationManager extends ChangeNotifier {
  // Singleton
  static final NotificationManager _instance = NotificationManager._internal();
  factory NotificationManager() => _instance;
  NotificationManager._internal();

  final NotificationService _service = NotificationService();

  // State
  List<NotificationModel> _globalNotifications = [];
  List<NotificationModel> _myNotifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _error;

  // Getters
  List<NotificationModel> get globalNotifications => _globalNotifications;
  List<NotificationModel> get myNotifications => _myNotifications;
  List<NotificationModel> get allNotifications {
    final all = [..._globalNotifications, ..._myNotifications];
    all.sort((a, b) {
      final aTime = a.createdAt ?? DateTime(2000);
      final bTime = b.createdAt ?? DateTime(2000);
      return bTime.compareTo(aTime);
    });
    return all;
  }
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Load notification từ API
  Future<void> loadNotifications() async {
    if (_isLoading) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final results = await Future.wait([
        _service.getGlobalNotifications(page: 1, size: 50),
        _service.getMyNotifications(page: 1, size: 50),
      ]);

      _globalNotifications = results[0].data;
      _myNotifications = results[1].data;
      _updateUnreadCount();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Chỉ load global notifications (không cần login)
  Future<void> loadGlobalOnly() async {
    if (_isLoading) return;
    
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final res = await _service.getGlobalNotifications(page: 1, size: 50);
      _globalNotifications = res.data;
      _updateUnreadCount();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Đánh dấu notification đã đọc
  Future<void> markAsRead(String notificationId) async {
    try {
      await _service.markAsRead(notificationId);
      
      // Update local state
      bool updated = false;

      final myIndex = _myNotifications.indexWhere((n) => n.id == notificationId);
      if (myIndex != -1) {
        final old = _myNotifications[myIndex];
        _myNotifications[myIndex] = NotificationModel(
          id: old.id,
          type: old.type,
          title: old.title,
          message: old.message,
          image: old.image,
          bookingId: old.bookingId,
          isRead: true,
          createdAt: old.createdAt,
        );
        updated = true;
      }

      final globalIndex =
          _globalNotifications.indexWhere((n) => n.id == notificationId);
      if (globalIndex != -1) {
        final old = _globalNotifications[globalIndex];
        _globalNotifications[globalIndex] = NotificationModel(
          id: old.id,
          type: old.type,
          title: old.title,
          message: old.message,
          image: old.image,
          bookingId: old.bookingId,
          isRead: true,
          createdAt: old.createdAt,
        );
        updated = true;
      }
      
      _updateUnreadCount();
      if (updated) {
        notifyListeners();
      }
    } catch (e) {
      // Ignore error
    }
  }

  /// Thêm notification mới (từ WebSocket)
  void addNotification(NotificationModel notification) {
    if (notification.isPromotion) {
      _globalNotifications.insert(0, notification);
    } else {
      _myNotifications.insert(0, notification);
    }
    _updateUnreadCount();
    notifyListeners();
  }

  /// Clear tất cả (khi logout)
  void clear() {
    _globalNotifications = [];
    _myNotifications = [];
    _unreadCount = 0;
    _error = null;
    notifyListeners();
  }

  void _updateUnreadCount() {
    _unreadCount = allNotifications.where((n) => !n.isRead).length;
  }
}

