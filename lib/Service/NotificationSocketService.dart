import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';
import '../Utils/ApiConfig.dart';
import '../Utils/AppSession.dart';
import '../Models/NotificationModels.dart';
import 'NotificationManager.dart';
import 'PushNotificationService.dart';

/// Service để nhận notification real-time qua WebSocket.
class NotificationSocketService {
  // Singleton
  static final NotificationSocketService _instance = NotificationSocketService._internal();
  factory NotificationSocketService() => _instance;
  NotificationSocketService._internal();

  StompClient? _stompClient;
  bool _isConnected = false;
  bool _isConnecting = false;

  final NotificationManager _notificationManager = NotificationManager();
  final PushNotificationService _pushService = PushNotificationService();

  bool get isConnected => _isConnected;

  String get _socketEndpoint {
    final base = apiBaseUrl.endsWith('/') ? apiBaseUrl.substring(0, apiBaseUrl.length - 1) : apiBaseUrl;
    return '$base/api/v1/ws-chat';
  }

  /// Kết nối WebSocket và subscribe notification channels
  Future<void> connect() async {
    if (_isConnected || _isConnecting) return;

    final token = AppSession.accessToken;
    if (token == null) {
      debugPrint('NotificationSocket: No token, skipping connect');
      return;
    }

    _isConnecting = true;
    debugPrint('NotificationSocket: Connecting to $_socketEndpoint (for notifications only)');

    _stompClient = StompClient(
      config: StompConfig.sockJS(
        url: _socketEndpoint,
        stompConnectHeaders: {'Authorization': 'Bearer $token'},
        webSocketConnectHeaders: {'Authorization': 'Bearer $token'},
        onConnect: _onConnected,
        onWebSocketError: (error) {
          debugPrint('NotificationSocket: WebSocket error: $error');
          _isConnecting = false;
          _isConnected = false;
        },
        onDisconnect: (frame) {
          debugPrint('NotificationSocket: Disconnected');
          _isConnected = false;
        },
        onStompError: (frame) {
          debugPrint('NotificationSocket: STOMP error: ${frame.body}');
        },
        reconnectDelay: const Duration(seconds: 5),
      ),
    );

    _stompClient?.activate();
  }

  void _onConnected(StompFrame frame) {
    _isConnected = true;
    _isConnecting = false;
    debugPrint('NotificationSocket: Connected!');

    // Subscribe kênh broadcast (GLOBAL notifications - promotions)
    _stompClient?.subscribe(
      destination: '/topic/notifications',
      callback: _onGlobalNotification,
    );
    debugPrint('NotificationSocket: Subscribed to /topic/notifications');

    // Subscribe kênh cá nhân (USER_ONLY notifications - booking)
    _stompClient?.subscribe(
      destination: '/user/queue/notifications',
      callback: _onUserNotification,
    );
    debugPrint('NotificationSocket: Subscribed to /user/queue/notifications');
  }

  /// Xử lý notification GLOBAL (promotion, sự kiện)
  void _onGlobalNotification(StompFrame frame) {
    if (frame.body == null) return;
    debugPrint('NotificationSocket: Received GLOBAL notification');

    try {
      final json = jsonDecode(frame.body!) as Map<String, dynamic>;
      final notification = NotificationModel.fromJson(json);

      // Thêm vào manager (cập nhật UI + badge)
      _notificationManager.addNotification(notification);

      // Hiện push notification banner
      _pushService.showNotification(notification);
    } catch (e) {
      debugPrint('NotificationSocket: Error parsing notification: $e');
    }
  }

  /// Xử lý notification USER_ONLY (booking reminder, etc.)
  void _onUserNotification(StompFrame frame) {
    if (frame.body == null) return;
    debugPrint('NotificationSocket: Received USER notification');

    try {
      final json = jsonDecode(frame.body!) as Map<String, dynamic>;
      final notification = NotificationModel.fromJson(json);

      // Thêm vào manager (cập nhật UI + badge)
      _notificationManager.addNotification(notification);

      // Hiện push notification banner
      _pushService.showNotification(notification);
    } catch (e) {
      debugPrint('NotificationSocket: Error parsing notification: $e');
    }
  }

  /// Ngắt kết nối
  void disconnect() {
    _stompClient?.deactivate();
    _stompClient = null;
    _isConnected = false;
    _isConnecting = false;
    debugPrint('NotificationSocket: Disconnected manually');
  }

  /// Kết nối lại (sau khi login)
  Future<void> reconnect() async {
    disconnect();
    await Future.delayed(const Duration(milliseconds: 500));
    await connect();
  }
}

