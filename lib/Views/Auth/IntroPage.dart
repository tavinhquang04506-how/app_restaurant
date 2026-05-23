import 'package:flutter/material.dart';
import 'package:android/Components/components.dart';
import 'package:android/Style/styles.dart';

class IntroPage extends StatelessWidget {
  const IntroPage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Stack(
        children: [
          // HÌNH NỀN
          Positioned.fill(
            child: Image.asset(
              'assets/images/noodle.png',
              fit: BoxFit.cover,
            ),
          ),

          // LỚP TỐI PHỦ LÊN
          Positioned.fill(
            child: Container(color: AppColors.overlayLight),
          ),

          // Ô TRẮNG Ở DƯỚI
          Align(
            alignment: Alignment.bottomCenter,
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.fromLTRB(20, 24, 20, 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Tiêu đề
                    const Text(
                      'Chào mừng đến với nhà\nhàng 3 Ships',
                      style: TextStyle(
                        fontSize: 25,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Mô tả
                    Text(
                      'Đăng nhập để nhận ưu đãi độc quyền và '
                          'quản lý đặt bàn một cách dễ dàng.',
                      style: TextStyle(
                        color: Colors.grey.shade700,
                        height: 1.4,
                      ),
                    ),

                    const SizedBox(height: 24),

                    // NÚT ĐĂNG NHẬP
                    AppButton.small(
                      text: 'Đăng nhập',
                      showArrow: false,
                      width: double.infinity,
                      onTap: () => Navigator.pushNamed(context, '/login'),
                    ),

                    const SizedBox(height: 12),

                    // NÚT TIẾP TỤC VỚI TƯ CÁCH KHÁCH
                    AppButton.small(
                      text: 'Tiếp tục với tư cách khách',
                      color: Colors.grey.shade800,
                      showArrow: false,
                      width: double.infinity,
                      onTap: () => Navigator.pushNamed(context, '/home'),
                    ),

                    const SizedBox(height: 12),

                    // Link "Chưa có tài khoản? Đăng ký"
                    GestureDetector(
                      onTap: () => Navigator.pushNamed(context, '/register'),
                      child: Center(
                        child: RichText(
                          text: TextSpan(
                            text: 'Chưa có tài khoản? ',
                            style: TextStyle(
                              color: Colors.grey.shade700,
                              fontSize: 13,
                            ),
                            children: const [
                              TextSpan(
                                text: 'Đăng ký',
                                style: TextStyle(
                                  color: Colors.red,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),

                    const SizedBox(height: 8),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
