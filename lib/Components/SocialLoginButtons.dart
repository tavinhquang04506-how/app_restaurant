import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

/// Buttons đăng nhập qua mạng xã hội (Facebook, Google).
class SocialLoginButtons extends StatelessWidget {
  final VoidCallback? onFacebookTap;
  final VoidCallback? onGoogleTap;

  const SocialLoginButtons({
    super.key,
    this.onFacebookTap,
    this.onGoogleTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: _SocialButton(
            icon: Icons.facebook,
            label: 'Facebook',
            color: Colors.blue,
            onTap: onFacebookTap,
          ),
        ),
        const SizedBox(width: 20),
        Expanded(
          child: _SocialButton(
            icon: FontAwesomeIcons.google,
            label: 'Gmail',
            color: Colors.red,
            onTap: onGoogleTap,
            useFaIcon: true,
          ),
        ),
      ],
    );
  }
}

class _SocialButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback? onTap;
  final bool useFaIcon;

  const _SocialButton({
    required this.icon,
    required this.label,
    required this.color,
    this.onTap,
    this.useFaIcon = false,
  });

  @override
  Widget build(BuildContext context) {
    return MaterialButton(
      onPressed: onTap ?? () {},
      height: 50,
      color: color,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(50),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          useFaIcon
              ? FaIcon(icon, color: Colors.white)
              : Icon(icon, color: Colors.white),
          const SizedBox(width: 10),
          Text(
            label,
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }
}

