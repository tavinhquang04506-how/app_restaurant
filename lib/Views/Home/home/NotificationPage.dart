import 'package:flutter/material.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Service/NotificationManager.dart';
import 'DetailPromotionPage.dart';

class NotificationPage extends StatefulWidget {
  const NotificationPage({super.key});

  @override
  State<NotificationPage> createState() => _NotificationPageState();
}

class _NotificationPageState extends State<NotificationPage> {
  final NotificationManager _manager = NotificationManager();

  @override
  void initState() {
    super.initState();
    _manager.loadNotifications();
    _manager.addListener(_onManagerChanged);
  }

  @override
  void dispose() {
    _manager.removeListener(_onManagerChanged);
    super.dispose();
  }

  void _onManagerChanged() {
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    return DefaultTabController(
      length: 3,
      child: Scaffold(
        backgroundColor: const Color(0xFF2A0E0E),
        appBar: AppBar(
          backgroundColor: const Color(0xFF2A0E0E),
          elevation: 0,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back, color: Colors.white),
            onPressed: () => Navigator.pop(context),
          ),
          title: const Text(
            "Thông báo",
            style: TextStyle(color: Colors.white),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh, color: Colors.white),
              onPressed: () => _manager.loadNotifications(),
            ),
          ],
          bottom: const TabBar(
            labelColor: Colors.white,
            unselectedLabelColor: Colors.white54,
            indicatorColor: Colors.redAccent,
            tabs: [
              Tab(text: "Tất cả"),
              Tab(text: "Ưu đãi"),
              Tab(text: "Cá nhân"),
            ],
          ),
        ),
        body: _manager.isLoading
            ? const Center(child: CircularProgressIndicator(color: Colors.white))
            : _manager.error != null
                ? _buildError()
                : TabBarView(
                    children: [
                      _AllNotificationsTab(notifications: _manager.allNotifications),
                      _PromoNotificationsTab(notifications: _manager.globalNotifications),
                      _PersonalNotificationsTab(notifications: _manager.myNotifications),
                    ],
                  ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, color: Colors.white54, size: 48),
          const SizedBox(height: 16),
          Text(
            'Không thể tải thông báo',
            style: const TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 8),
          ElevatedButton(
            onPressed: () => _manager.loadNotifications(),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.redAccent),
            child: const Text('Thử lại'),
          ),
        ],
      ),
    );
  }
}

// ================ Tab Tất cả ================
class _AllNotificationsTab extends StatelessWidget {
  final List<NotificationModel> notifications;

  const _AllNotificationsTab({required this.notifications});

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return const _EmptyState(message: 'Chưa có thông báo nào');
    }

    // Chia thành "Mới" và "Trước đó"
    final now = DateTime.now();
    final newNotifs = notifications.where((n) {
      final diff = now.difference(n.createdAt ?? now);
      return diff.inHours < 24;
    }).toList();
    final oldNotifs = notifications.where((n) {
      final diff = now.difference(n.createdAt ?? now);
      return diff.inHours >= 24;
    }).toList();

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        if (newNotifs.isNotEmpty) ...[
          const Text("Mới", style: TextStyle(color: Colors.white, fontSize: 16)),
          const SizedBox(height: 10),
          ...newNotifs.map((n) => _NotificationCard(notification: n)),
        ],
        if (oldNotifs.isNotEmpty) ...[
          const SizedBox(height: 20),
          const Text("Trước đó", style: TextStyle(color: Colors.white, fontSize: 16)),
          const SizedBox(height: 10),
          ...oldNotifs.map((n) => _NotificationCard(notification: n)),
        ],
      ],
    );
  }
}

// ================ Tab Ưu đãi (GLOBAL) ================
class _PromoNotificationsTab extends StatelessWidget {
  final List<NotificationModel> notifications;

  const _PromoNotificationsTab({required this.notifications});

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return const _EmptyState(message: 'Chưa có ưu đãi nào');
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: notifications.map((n) => _NotificationCard(notification: n)).toList(),
    );
  }
}

// ================ Tab Cá nhân (USER_ONLY) ================
class _PersonalNotificationsTab extends StatelessWidget {
  final List<NotificationModel> notifications;

  const _PersonalNotificationsTab({required this.notifications});

  @override
  Widget build(BuildContext context) {
    if (notifications.isEmpty) {
      return const _EmptyState(message: 'Chưa có thông báo cá nhân');
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: notifications.map((n) => _NotificationCard(notification: n)).toList(),
    );
  }
}

// ================ Empty State ================
class _EmptyState extends StatelessWidget {
  final String message;

  const _EmptyState({required this.message});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.notifications_off_outlined, color: Colors.white54, size: 48),
          const SizedBox(height: 16),
          Text(message, style: const TextStyle(color: Colors.white70)),
        ],
      ),
    );
  }
}

// ================ Notification Card ================
class _NotificationCard extends StatelessWidget {
  final NotificationModel notification;

  const _NotificationCard({required this.notification});

  IconData get _icon {
    switch (notification.type) {
      case 'PROMOTION':
        return Icons.local_offer_outlined;
      case 'BOOKING_REMINDER':
        return Icons.event_available_outlined;
      default:
        return Icons.notifications_outlined;
    }
  }

  @override
  Widget build(BuildContext context) {
    final isPromo = notification.isPromotion;
    
    return GestureDetector(
      onTap: () => _handleTap(context),
      child: Container(
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: isPromo ? const Color(0xFF3C1A1A) : const Color(0xFF1E0A0A),
          borderRadius: BorderRadius.circular(12),
          border: notification.isRead 
              ? null 
              : Border.all(color: Colors.redAccent.withOpacity(0.5), width: 1),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(_icon, color: Colors.white70),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    notification.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 15,
                      fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
                    ),
                  ),
                ),
                if (!notification.isRead)
                  Container(
                    width: 8,
                    height: 8,
                    decoration: const BoxDecoration(
                      color: Colors.redAccent,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
            if (notification.message != null && notification.message!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(
                notification.message!,
                style: const TextStyle(color: Colors.white70, height: 1.3),
                maxLines: 3,
                overflow: TextOverflow.ellipsis,
              ),
            ],
            const SizedBox(height: 8),
            Text(
              notification.timeAgo,
              style: const TextStyle(color: Colors.redAccent, fontSize: 12),
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _handleTap(BuildContext context) async {
    // Mark as read
    if (!notification.isRead && notification.id != null) {
      await NotificationManager().markAsRead(notification.id!);
    }
    if (!context.mounted) return;

    // Navigate based on type
    if (notification.isPromotion) {
      final promo = PromotionModel(
        id: notification.id ?? '',
        code: notification.title,
        name: notification.title,
        description: notification.message,
        imageUrl: notification.image,
        discountPercent: 0,
        quantity: 0,
        remaining: 0,
        active: true,
        startDate: null,
        endDate: null,
      );
      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => DetailPromotionPage(promo: promo)),
      );
    } else if (notification.isBookingReminder && notification.bookingId != null) {
      // TODO: Navigate to booking detail
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Đặt bàn: ${notification.bookingId}')),
      );
    }
  }
}
