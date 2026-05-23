// HomePage.dart
import 'package:android/Views/Home/food/FoodMenuPage.dart';
import 'package:android/Views/Home/home/HomePage.dart';
import 'package:android/Views/Home/user/UserPage.dart';
import 'package:flutter/material.dart';
import 'package:curved_navigation_bar/curved_navigation_bar.dart';
import 'package:android/Utils/AppSession.dart';
import 'booking/BookingMainPage.dart';
class HomePage extends StatefulWidget {
  const HomePage({super.key});

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  int _currentIndex = 0;

  final List<String> _titles = [
    "Trang chủ",
    "Thực Đơn",
    "Đặt Bàn",
    "Tài khoản",
  ];

  // ===== AppBar của HomePage =====
  PreferredSizeWidget? _buildHomeAppBar() {
    // ẩn AppBar của Home khi ở tab Thực Đơn (1) hoặc Đặt Bàn (2)
    if (_currentIndex != 0) {
      return null;
    }

    return AppBar(
      backgroundColor: Colors.brown,
      foregroundColor: Colors.white,
      centerTitle: true,
      title: Text(_titles[_currentIndex]),

      leading: AppSession.isLoggedIn
          ? null
          : IconButton(
        icon: const Icon(Icons.arrow_back),
        onPressed: () {
          Navigator.pushNamedAndRemoveUntil(
            context,
            '/intropage', // route intro
                (route) => false,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final List<Widget> screens = [
      const InHomePage(),
      const FoodMenu(),
      const BookingMainPage(),
      const UserPage(),
    ];

    return Scaffold(
      backgroundColor: Colors.blueAccent,
      appBar: _buildHomeAppBar(),
      body: screens[_currentIndex],
      floatingActionButton: Padding(
        padding: const EdgeInsets.only(bottom: 80),
        child: FloatingActionButton(
          onPressed: () {
            Navigator.pushNamedAndRemoveUntil(
              context,
              '/contact', // route intro
                  (route) => false,
            );
          },
          backgroundColor: Colors.red,
          child: const Icon(Icons.phone, color: Colors.white),
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.endDocked,
      bottomNavigationBar: CurvedNavigationBar(
        index: _currentIndex,
        backgroundColor: const Color(0xFF2A0E0E),
        color: Colors.white,
        buttonBackgroundColor: Colors.white,
        height: 60,
        animationDuration: const Duration(milliseconds: 300),
        items: const [
          Icon(Icons.home, size: 30, color: Colors.black),
          Icon(Icons.restaurant_menu, size: 30, color: Colors.black),
          Icon(Icons.table_bar_sharp, size: 30, color: Colors.black),
          Icon(Icons.person, size: 30, color: Colors.black),
        ],
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
      ),
    );
  }
}
