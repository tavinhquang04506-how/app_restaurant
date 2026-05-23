import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:android/Service/AuthService.dart';
import 'package:android/Components/components.dart';
import 'package:android/Style/styles.dart';
import 'package:android/Utils/Validators.dart';
import 'package:android/Utils/Utils.dart';
import 'LoginPage.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  Future<void> _handleRegister() async {
    if (_isLoading || !_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);
    try {
      await _authService.register(
        username: _nameController.text.trim(),
        email: _emailController.text.trim(),
        phone: _phoneController.text.trim(),
        password: _passwordController.text.trim(),
        confirmPassword: _confirmController.text.trim(),
      );
      _showSnack('Đăng ký thành công, vui lòng đăng nhập');
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );
    } catch (e) {
      _showSnack(extractErrorMessage(e));
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageLayout(
      title: 'Đăng ký',
      subtitle: 'Tạo tài khoản',
      isLoading: _isLoading,
      backgroundImage: 'assets/images/Foods.png',
      backgroundGradient: AppColors.primaryGradientWithOpacity,
      showDarkOverlay: false,
      cardColor: Colors.white,
      headerExtra: Image.asset(
        'assets/images/chopsticks.png',
        height: 50,
        width: 50,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const SizedBox(height: 30),
            
            // Name
            AnimatedTextField(
              duration: 1400,
              child: AppTextField(
                controller: _nameController,
                hint: 'Họ và Tên',
                validator: Validators.name,
              ),
            ),
            const SizedBox(height: 20),
            
            // Email
            AnimatedTextField(
              duration: 1600,
              child: AppTextField(
                controller: _emailController,
                hint: 'Email',
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
            ),
            const SizedBox(height: 20),
            
            // Phone
            AnimatedTextField(
              duration: 1700,
              child: AppTextField(
                controller: _phoneController,
                hint: 'Số điện thoại',
                keyboardType: TextInputType.phone,
                validator: Validators.phone,
              ),
            ),
            const SizedBox(height: 20),
            
            // Password
            AnimatedTextField(
              duration: 1800,
              child: AppPasswordField(
                controller: _passwordController,
                hint: 'Mật khẩu',
                validator: (value) => Validators.password(value, minLength: 8, requireUppercase: true),
              ),
            ),
            const SizedBox(height: 20),
            
            // Confirm password
            AnimatedTextField(
              duration: 1900,
              child: AppPasswordField(
                controller: _confirmController,
                hint: 'Xác nhận mật khẩu',
                validator: Validators.confirmPassword(
                  () => _passwordController.text,
                ),
              ),
            ),
            const SizedBox(height: 30),
            
            // Register button
            AuthSubmitButton(
              text: 'Đăng Ký',
              isLoading: _isLoading,
              onPressed: _handleRegister,
              color: AppColors.primaryDark,
              animationDuration: 2000,
            ),
            const SizedBox(height: 10),
            
            // Login link
            AuthLinkText(
              text: 'Đã có tài khoản? Đăng nhập',
              onTap: () => Navigator.pushReplacement(
                context,
                MaterialPageRoute(builder: (_) => const LoginPage()),
              ),
            ),
            const SizedBox(height: 50),
          ],
        ),
      ),
    );
  }
}
