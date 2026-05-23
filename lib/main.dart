import 'package:android/Views/Home/food/FoodMenuPage.dart';
import 'package:android/Views/Home/user/UserPage.dart';
import 'package:android/Views/Home/user/support/ContactSupportPage.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:android/Views/Auth/IntroPage.dart';
import 'package:android/Views/Auth/LoginPage.dart';
import 'package:android/Views/Auth/RegisterPage.dart';
import 'package:android/Views/Home/HomePage.dart';
import 'package:android/Views/Home/booking/BookingHistoryPage.dart';
import 'package:android/Views/Home/booking/BookingMainPage.dart';
import 'package:android/Service/PushNotificationService.dart';
import 'package:android/Service/NotificationSocketService.dart';
import 'package:android/Utils/AppSession.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Giữ portrait
  await SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
  ]);

  // Tải session đã lưu để tự đăng nhập lại nếu còn token
  await AppSession.loadPersistedSession();

  // Khởi tạo push notification service
  await PushNotificationService().initialize();

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final NotificationSocketService _socketService = NotificationSocketService();

  @override
  void initState() {
    super.initState();
    // Listen user login/logout để connect/disconnect socket
    AppSession.currentUser.addListener(_onUserChanged);
    // Nếu đã login sẵn thì connect
    if (AppSession.isLoggedIn) {
      _socketService.connect();
    }
  }

  @override
  void dispose() {
    AppSession.currentUser.removeListener(_onUserChanged);
    _socketService.disconnect();
    super.dispose();
  }

  void _onUserChanged() {
    if (AppSession.isLoggedIn) {
      _socketService.reconnect();
    } else {
      _socketService.disconnect();
    }
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorSchemeSeed: const Color(0xFF6750A4),
        inputDecorationTheme: const InputDecorationTheme(
          border: OutlineInputBorder(),
        ),
      ),
      home: AppSession.isLoggedIn ? const HomePage() : const IntroPage(),
      routes: {
        '/intropage': (context) => const IntroPage(),
        '/home': (context) => const HomePage(),
        '/login': (context) => const LoginPage(),
        '/register': (context) => const RegisterPage(),
        '/user': (context) => const UserPage(),
        '/contact': (context) => const ContactSupportPage(),
        '/datban': (context) => const BookingMainPage(),
        '/thucdon': (context) => const FoodMenu(),
        '/booking-history': (context) => const BookingHistoryPage(),
      },
    );
  }
}
