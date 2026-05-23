import 'package:flutter/material.dart';
import 'ChatSupportPage.dart';

class ContactSupportPage extends StatelessWidget {
  const ContactSupportPage({super.key});

  final Color bgDark = const Color(0xFF2A0E0E);      // màu nền userpage
  final Color cardDark = const Color(0xFF1F1B1B);    // màu card giống section userpage

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: bgDark,

      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.white),
          onPressed: () {
            // Dung ten route '/user' ma ban da khai bao trong main.dart
            // pushReplacementNamed thay trang hien tai, khong bi chong trang
            Navigator.pushReplacementNamed(context, '/home');
          },
        ),
        title: const Text("Liên Hệ & Hỗ Trợ"),
        backgroundColor: bgDark,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [

            // Thong tin lien he
            const Text(
              "Thông tin liên hệ",
              style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Colors.white
              ),
            ),
            const SizedBox(height: 12),

            _buildInfoTile(
              icon: Icons.phone,
              title: "Hotline",
              value: "0123 456 789",
            ),

            _buildInfoTile(
              icon: Icons.email,
              title: "Email hỗ trợ",
              value: "hotro@nhahang.com",
            ),

            _buildInfoTile(
              icon: Icons.location_on,
              title: "Địa chỉ",
              value: "123 Nguyễn Văn Cừ, Quận 5, TP.HCM",
            ),

            const SizedBox(height: 25),

            // Live chat
            const Text(
              "Live Chat hỗ trợ",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                icon: const Icon(Icons.chat_bubble_outline, color: Colors.white,),
                label: const Text("Bắt đầu trò chuyện", style: TextStyle(color: Colors.white),),
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (_) => const ChatHoTroPage()),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.redAccent,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                  textStyle: const TextStyle(fontSize: 16),
                ),
              ),
            ),

            const SizedBox(height: 30),

            // Gui phan hoi
            const Text(
              "Gửi phản hồi",
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),

            TextField(
              maxLines: 5,
              style: const TextStyle(color: Colors.white),
              decoration: InputDecoration(
                filled: true,
                fillColor: const Color(0xFF3A1B1B),
                hintText: "Nhập nội dung phản hồi...",
                hintStyle: const TextStyle(color: Colors.white54),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
            ),

            const SizedBox(height: 15),

            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text("Đã gửi phản hồi!")),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: bgDark,
                  padding: const EdgeInsets.symmetric(vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
                child: const Text(
                  "Gửi phản hồi",
                  style: TextStyle(fontSize: 16, color: Colors.white),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // Widget thong tin lien he
  Widget _buildInfoTile({
    required IconData icon,
    required String title,
    required String value,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF1F1B1B),
        borderRadius: BorderRadius.circular(12),
      ),
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(icon, color: Colors.redAccent, size: 28),
        title: Text(
          title,
          style: const TextStyle(
              fontWeight: FontWeight.bold,
              color: Colors.white
          ),
        ),
        subtitle: Text(
          value,
          style: const TextStyle(color: Colors.white70),
        ),
      ),
    );
  }
}
