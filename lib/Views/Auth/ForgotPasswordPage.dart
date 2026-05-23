import 'package:flutter/material.dart';
import 'package:android/Repository/AuthRepository.dart';
import 'package:android/Components/components.dart';
import 'package:android/Style/styles.dart';
import 'package:android/Utils/Validators.dart';

class ForgetPasswordPage extends StatefulWidget {
  const ForgetPasswordPage({super.key});

  @override
  State<ForgetPasswordPage> createState() => _ForgetPasswordPageState();
}

class _ForgetPasswordPageState extends State<ForgetPasswordPage> {
  final _emailController = TextEditingController();
  final _otpController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmController = TextEditingController();
  final _formKey = GlobalKey<FormState>();
  final _authRepository = AuthRepository();

  int _step = 0; // 0: email, 1: otp, 2: reset
  bool _loading = false;

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _passwordController.dispose();
    _confirmController.dispose();
    super.dispose();
  }

  String get _subtitle {
    switch (_step) {
      case 0:
        return 'Nhập email để nhận mã OTP';
      case 1:
        return 'Nhập mã OTP 6 số đã gửi email';
      default:
        return 'Đặt lại mật khẩu mới';
    }
  }

  String get _buttonText {
    switch (_step) {
      case 0:
        return 'Gửi mã OTP';
      case 1:
        return 'Xác nhận OTP';
      default:
        return 'Đặt lại mật khẩu';
    }
  }

  Future<void> _onSubmit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);
    try {
      if (_step == 0) {
        await _authRepository.requestPasswordOtp(_emailController.text.trim());
        setState(() => _step = 1);
        _showSnack('Đã gửi mã OTP, vui lòng kiểm tra email');
      } else if (_step == 1) {
        await _authRepository.verifyPasswordOtp(
          _emailController.text.trim(),
          _otpController.text.trim(),
        );
        setState(() => _step = 2);
        _showSnack('OTP hợp lệ, đặt mật khẩu mới');
      } else {
        await _authRepository.resetPassword(
          email: _emailController.text.trim(),
          otp: _otpController.text.trim(),
          password: _passwordController.text.trim(),
          confirmPassword: _confirmController.text.trim(),
        );
        _showSnack('Đặt lại mật khẩu thành công');
        Navigator.pop(context);
      }
    } catch (e) {
      _showSnack(e.toString());
    } finally {
      setState(() => _loading = false);
    }
  }

  void _showSnack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  Widget build(BuildContext context) {
    return AuthPageLayout(
      title: 'Quên mật khẩu',
      subtitle: _subtitle,
      isLoading: _loading,
      backgroundGradient: AppColors.forgotPasswordGradient,
      showDarkOverlay: false,
      child: Form(
        key: _formKey,
        child: Column(
          children: [
            const SizedBox(height: 40),
            
            // Step fields
            _buildStepFields(),
            const SizedBox(height: 40),
            
            // Submit button
            AuthSubmitButton(
              text: _buttonText,
              isLoading: _loading,
              onPressed: _onSubmit,
              animationDuration: 1600,
            ),
            const SizedBox(height: 20),
            
            // Back to login
            AuthLinkText(
              text: 'Quay lại đăng nhập',
              onTap: () => Navigator.pop(context),
            ),
            const SizedBox(height: 50),
          ],
        ),
      ),
    );
  }

  Widget _buildStepFields() {
    switch (_step) {
      case 0:
        return AnimatedTextField(
          duration: 1400,
          child: AppTextField(
            controller: _emailController,
            hint: 'Email của bạn',
            keyboardType: TextInputType.emailAddress,
            validator: Validators.email,
          ),
        );
      case 1:
        return Column(
          children: [
            AnimatedTextField(
              child: AppTextField(
                controller: _emailController,
                hint: 'Email',
              ),
            ),
            const SizedBox(height: 16),
            AnimatedTextField(
              duration: 1500,
              child: AppTextField(
                controller: _otpController,
                hint: 'Nhập mã OTP 6 số',
                keyboardType: TextInputType.number,
                validator: Validators.otp,
              ),
            ),
          ],
        );
      default:
        return Column(
          children: [
            AnimatedTextField(
              child: AppPasswordField(
                controller: _passwordController,
                hint: 'Mật khẩu mới',
                validator: (value) => Validators.password(value, minLength: 8, requireUppercase: true),
              ),
            ),
            const SizedBox(height: 16),
            AnimatedTextField(
              duration: 1500,
              child: AppPasswordField(
                controller: _confirmController,
                hint: 'Xác nhận mật khẩu',
                validator: Validators.confirmPassword(
                  () => _passwordController.text,
                ),
              ),
            ),
          ],
        );
    }
  }
}
