import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../Models/NotificationModels.dart';

/// Service để hiển thị push notification (banner) trên thiết bị.
class PushNotificationService {
  // Singleton
  static final PushNotificationService _instance = PushNotificationService._internal();
  factory PushNotificationService() => _instance;
  PushNotificationService._internal();

  final FlutterLocalNotificationsPlugin _plugin = FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  /// Khởi tạo notification service (gọi 1 lần trong main)
  Future<void> initialize() async {
    if (_initialized) return;

    // Android settings
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    // iOS settings
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    // Request permissions cho iOS
    await _requestPermissions();

    _initialized = true;
    debugPrint('PushNotificationService initialized');
  }

  Future<void> _requestPermissions() async {
    // iOS
    await _plugin
        .resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>()
        ?.requestPermissions(alert: true, badge: true, sound: true);

    // Android 13+
    await _plugin
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>()
        ?.requestNotificationsPermission();
  }

  /// Callback khi user bấm vào notification
  void _onNotificationTapped(NotificationResponse response) {
    debugPrint('Notification tapped: ${response.payload}');
    // TODO: Navigate to appropriate screen based on payload
  }

  /// Hiển thị notification từ NotificationModel
  Future<void> showNotification(NotificationModel notification) async {
    if (!_initialized) {
      debugPrint('PushNotificationService not initialized');
      return;
    }

    final androidDetails = AndroidNotificationDetails(
      _getChannelId(notification.type),
      _getChannelName(notification.type),
      channelDescription: 'Thông báo từ nhà hàng',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
      largeIcon: notification.image != null 
          ? const DrawableResourceAndroidBitmap('@mipmap/ic_launcher')
          : null,
      styleInformation: BigTextStyleInformation(
        notification.message ?? '',
        contentTitle: notification.title,
        summaryText: _getTypeSummary(notification.type),
      ),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _plugin.show(
      notification.id.hashCode, // Unique ID
      notification.title,
      notification.message,
      details,
      payload: notification.id, // Pass ID to handle tap
    );
  }

  /// Hiển thị notification đơn giản
  Future<void> show({
    required String title,
    required String body,
    String? payload,
  }) async {
    if (!_initialized) return;

    const androidDetails = AndroidNotificationDetails(
      'general_channel',
      'Thông báo chung',
      channelDescription: 'Thông báo từ nhà hàng',
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _plugin.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );
  }

  String _getChannelId(String type) {
    switch (type) {
      case 'PROMOTION':
        return 'promotion_channel';
      case 'BOOKING_REMINDER':
        return 'booking_channel';
      case 'BOOKING_CREATED':
        return 'booking_channel';
      default:
        return 'general_channel';
    }
  }

  String _getChannelName(String type) {
    switch (type) {
      case 'PROMOTION':
        return 'Khuyến mãi';
      case 'BOOKING_REMINDER':
        return 'Nhắc đặt bàn';
      case 'BOOKING_CREATED':
        return 'Đặt bàn';
      default:
        return 'Thông báo chung';
    }
  }

  String _getTypeSummary(String type) {
    switch (type) {
      case 'PROMOTION':
        return 'Ưu đãi mới';
      case 'BOOKING_REMINDER':
        return 'Nhắc lịch';
      case 'BOOKING_CREATED':
        return 'Đặt bàn thành công';
      default:
        return 'Thông báo';
    }
  }
}

