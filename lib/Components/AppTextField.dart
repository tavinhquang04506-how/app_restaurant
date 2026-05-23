import 'package:flutter/material.dart';

/// TextField chung với style nhất quán cho toàn app.
class AppTextField extends StatelessWidget {
  final TextEditingController? controller;
  final String? hint;
  final String? label;
  final TextInputType keyboardType;
  final String? Function(String?)? validator;
  final bool autofocus;
  final TextInputAction? textInputAction;
  final void Function(String)? onSubmitted;

  const AppTextField({
    super.key,
    this.controller,
    this.hint,
    this.label,
    this.keyboardType = TextInputType.text,
    this.validator,
    this.autofocus = false,
    this.textInputAction,
    this.onSubmitted,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade300),
        ),
      ),
      child: TextFormField(
        controller: controller,
        keyboardType: keyboardType,
        autofocus: autofocus,
        textInputAction: textInputAction,
        onFieldSubmitted: onSubmitted,
        decoration: InputDecoration(
          hintText: hint,
          labelText: label,
          hintStyle: const TextStyle(color: Colors.grey),
          border: InputBorder.none,
        ),
        validator: validator,
      ),
    );
  }
}

/// PasswordField với toggle show/hide password.
class AppPasswordField extends StatefulWidget {
  final TextEditingController? controller;
  final String? hint;
  final String? label;
  final String? Function(String?)? validator;
  final TextInputAction? textInputAction;
  final void Function(String)? onSubmitted;

  const AppPasswordField({
    super.key,
    this.controller,
    this.hint,
    this.label,
    this.validator,
    this.textInputAction,
    this.onSubmitted,
  });

  @override
  State<AppPasswordField> createState() => _AppPasswordFieldState();
}

class _AppPasswordFieldState extends State<AppPasswordField> {
  bool _obscureText = true;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(10),
        border: Border(
          bottom: BorderSide(color: Colors.grey.shade300),
        ),
      ),
      child: TextFormField(
        controller: widget.controller,
        obscureText: _obscureText,
        textInputAction: widget.textInputAction,
        onFieldSubmitted: widget.onSubmitted,
        decoration: InputDecoration(
          hintText: widget.hint,
          labelText: widget.label,
          hintStyle: const TextStyle(color: Colors.grey),
          border: InputBorder.none,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureText ? Icons.visibility_off : Icons.visibility,
              color: Colors.grey,
            ),
            onPressed: () => setState(() => _obscureText = !_obscureText),
          ),
        ),
        validator: widget.validator,
      ),
    );
  }
}

