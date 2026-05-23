import 'package:flutter/material.dart';
import 'package:android/Utils/AppSession.dart';
import 'PersonalInformationPage.dart';
import '../booking/BookingHistoryPage.dart'; // <== THÊM
import 'FavoriteFoodsPage.dart';

class UserPage extends StatelessWidget {
  const UserPage({super.key});

  void _showAbout(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'Three3Tau Restaurant',
      applicationVersion: '1.0.0',
      applicationLegalese: '© 2025 Three3Tau Team',
      children: const [
        SizedBox(height: 8),
        Text(
          'Ứng dụng đặt bàn & gọi món Three3Tau.\n'
              'Giúp bạn đặt bàn nhanh chóng, xem menu và sử dụng ưu đãi dễ dàng.',
        ),
      ],
    );
  }


  @override
  Widget build(BuildContext context) {
    final loggedIn = AppSession.isLoggedIn;
    final user = AppSession.currentUser.value;

    return Scaffold(
      backgroundColor: const Color(0xFF2A0E0E),
      appBar: AppBar(
        backgroundColor: const Color(0xFF2A0E0E),
        elevation: 0,
        centerTitle: true,
        title: Text(
          loggedIn ? 'Tài khoản' : 'Chào mừng bạn',
          style: const TextStyle(color: Colors.white),
        ),
      ),
      body: loggedIn
          ? _buildLoggedInBody(context, user?.name ?? 'Người dùng')
          : _buildGuestBody(context),
    );
  }

  // ===== BODY KHI CHƯA ĐĂNG NHẬP =====
  Widget _buildGuestBody(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                Image.asset(
                  'assets/images/Foods.png', // đổi path nếu cần
                  height: 180,
                  width: double.infinity,
                  fit: BoxFit.cover,
                ),
                Positioned.fill(
                  child: Container(
                    color: Colors.black.withOpacity(0.35),
                  ),
                ),
                const Positioned(
                  left: 16,
                  bottom: 16,
                  child: Text(
                    'Khám phá ẩm thực Quảng Đông',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24),

          const Text(
            'Chào mừng bạn',
            style: TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Đăng nhập hoặc tạo tài khoản để tích điểm, nhận ưu đãi độc quyền và đặt bàn nhanh chóng.',
            style: TextStyle(
              color: Colors.white70,
              height: 1.4,
            ),
          ),

          const SizedBox(height: 24),

          // Nút Đăng nhập
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/login');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
              child: const Text(
                'Đăng nhập',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),

          const SizedBox(height: 12),

          // Nút Đăng ký
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/register');
              },
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Colors.white24),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
                backgroundColor: const Color(0xFF3A1B1B),
              ),
              child: const Text(
                'Đăng ký',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.white,
                ),
              ),
            ),
          ),

          const SizedBox(height: 32),

          _buildSectionCard(
            children: [
              _buildMenuRow(
                icon: Icons.apartment_outlined,
                text: 'Về chúng tôi',
                onTap: () => _showAbout(context)
              ),
              const Divider(height: 0, color: Colors.white10),
              _buildMenuRow(
                icon: Icons.support_agent_outlined,
                text: 'Liên hệ & Hỗ trợ',
                onTap: () {
                  Navigator.pushNamed(context, '/contact');
                },
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ===== BODY KHI ĐÃ ĐĂNG NHẬP =====
  Widget _buildLoggedInBody(BuildContext context, String name) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Column(
            children: [
              Container(
                width: 90,
                height: 90,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.redAccent, width: 3),
                  color: Colors.white12,
                ),
                child: const Icon(Icons.person, size: 50, color: Colors.white70),
              ),
              const SizedBox(height: 12),
              Text(
                name,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),

          const SizedBox(height: 24),

          // Khối 1: thông tin tài khoản
          _buildSectionCard(
            children: [
              _buildMenuRow(
                icon: Icons.person_outline,
                text: 'Thông tin cá nhân',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const PersonalInformationPage(),
                    ),
                  );
                },
              ),
              const Divider(height: 0, color: Colors.white10),

              // ====== LỊCH SỬ ĐẶT BÀN ======
              _buildMenuRow(
                icon: Icons.event_note_outlined,
                text: 'Lịch sử đặt bàn',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const BookingHistoryPage(),
                    ),
                  );
                },
              ),

              const Divider(height: 0, color: Colors.white10),
              _buildMenuRow(
                icon: Icons.favorite_border,
                text: 'Món ăn yêu thích',
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (_) => const FavoriteFoodsPage(),
                    ),
                  );
                },
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Khối 2: chung
          _buildSectionCard(
            children: [
              _buildMenuRow(
                icon: Icons.apartment_outlined,
                text: 'Về chúng tôi',
                onTap: () => _showAbout(context),
              ),
              const Divider(height: 0, color: Colors.white10),
              _buildMenuRow(
                icon: Icons.support_agent_outlined,
                text: 'Liên hệ & Hỗ trợ',
                onTap: () {
                  Navigator.pushNamed(context, '/contact');
                },
              ),

            ],
          ),

          const SizedBox(height: 24),

          // Nút Đăng xuất
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: () {
                AppSession.signOut();
                Navigator.pushNamedAndRemoveUntil(
                  context,
                  '/intropage',
                      (route) => false,
                );
              },
              icon: const Icon(Icons.logout),
              label: const Text(
                'Đăng xuất',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(30),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ===== WIDGET PHỤ =====
  Widget _buildSectionCard({required List<Widget> children}) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(vertical: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF1F1B1B),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(children: children),
    );
  }

  Widget _buildMenuRow({
    required IconData icon,
    required String text,
    VoidCallback? onTap,
  }) {
    return ListTile(
      leading: Icon(icon, color: Colors.white),
      title: Text(
        text,
        style: const TextStyle(color: Colors.white),
      ),
      trailing: const Icon(Icons.chevron_right, color: Colors.white54),
      onTap: onTap,
    );
  }
}
