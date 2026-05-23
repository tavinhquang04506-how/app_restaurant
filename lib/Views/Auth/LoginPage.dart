import 'package:flutter/material.dart';
import 'package:animate_do/animate_do.dart';
import 'package:android/Service/AuthService.dart';
import 'package:android/Components/components.dart';
import 'package:android/Utils/Validators.dart';
import 'package:android/Utils/Utils.dart';
import 'RegisterPage.dart';
import 'ForgotPasswordPage.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _authService = AuthService();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_isLoading || !_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final ok = await _authService.login(
        _emailController.text.trim(),
        _passwordController.text.trim(),
      );

      if (ok) {
        Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
        _showSnack('Đăng nhập thành công');
      } else {
        _showSnack('Sai tài khoản hoặc mật khẩu');
      }
    } catch (e) {
      _showSnack('Lỗi đăng nhập: ${extractErrorMessage(e)}');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleGoogleLogin() async {
    if (_isLoading) return;

    setState(() => _isLoading = true);

    try {
      final ok = await _authService.loginWithGoogle();

      if (ok) {
        Navigator.pushNamedAndRemoveUntil(context, '/home', (route) => false);
        _showSnack('Đăng nhập Google thành công');
      } else {
        _showSnack('Đăng nhập Google thất bại');
      }
    } catch (e) {
      _showSnack('Lỗi đăng nhập Google: ${extractErrorMessage(e)}');
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
      title: 'Đăng nhập',
      subtitle: 'Chào mừng đến với Three3Tau',
      isLoading: _isLoading,
      backgroundImage: 'assets/images/do_an.png',
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const SizedBox(height: 30),
            
            // Email field
            AnimatedTextField(
              duration: 1400,
              child: AppTextField(
                controller: _emailController,
                hint: 'Email',
                keyboardType: TextInputType.emailAddress,
                validator: Validators.email,
              ),
            ),
            const SizedBox(height: 20),
            
            // Password field
            AnimatedTextField(
              duration: 1600,
              child: AppPasswordField(
                controller: _passwordController,
                hint: 'Password',
                validator: (value) => Validators.required(value, fieldName: "Mat khau"),
              ),
            ),
            const SizedBox(height: 10),
            
            // Forgot password
            _buildForgotPassword(),
            const SizedBox(height: 30),
            
            // Login button
            AuthSubmitButton(
              text: 'Đăng Nhập',
              isLoading: _isLoading,
              onPressed: _handleLogin,
            ),
            const SizedBox(height: 10),
            
            // Register link
            AuthLinkText(
              text: 'Chưa có tài khoản? Đăng ký',
              onTap: () => Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const RegisterPage()),
              ),
            ),
            const SizedBox(height: 30),
            
            // Social login
            FadeInUp(
              duration: const Duration(milliseconds: 2000),
              child: const Text(
                'Các Phương Thức Đăng Nhập Khác',
                style: TextStyle(color: Colors.grey),
              ),
            ),
            const SizedBox(height: 20),
            SocialLoginButtons(
              onGoogleTap: _handleGoogleLogin,
            ),
            const SizedBox(height: 50),
          ],
        ),
      ),
    );
  }

  Widget _buildForgotPassword() {
    return Align(
      alignment: Alignment.centerRight,
      child: GestureDetector(
        onTap: () => Navigator.push(
          context,
          MaterialPageRoute(builder: (_) => const ForgetPasswordPage()),
        ),
        child: const Text(
          'Quên mật khẩu?',
          style: TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
        ),
      ),
    );
  }
}
