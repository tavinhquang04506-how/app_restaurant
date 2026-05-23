/// Centralized validators for form fields.
class Validators {
  Validators._(); // Prevent instantiation

  static final RegExp _emailRegex = RegExp(r'^[\w\-\.]+@([\w\-]+\.)+[\w\-]{2,4}$');

  // ==================== Email ====================
  static String? email(String? value, {String? fieldName}) {
    final name = fieldName ?? 'Email';
    if (value == null || value.trim().isEmpty) {
      return 'Vui long nhap $name';
    }
    if (!_emailRegex.hasMatch(value.trim())) {
      return '$name khong hop le';
    }
    return null;
  }

  // ==================== Password ====================
  static String? password(String? value, {int minLength = 6, String? fieldName, bool requireUppercase = false}) {
    final name = fieldName ?? 'Mat khau';
    if (value == null || value.trim().isEmpty) {
      return 'Vui long nhap $name';
    }
    final v = value.trim();
    if (v.length < minLength) {
      return '$name toi thieu $minLength ky tu';
    }
    if (requireUppercase && !RegExp(r'[A-Z]').hasMatch(v)) {
      return '$name phai co it nhat 1 ky tu in hoa';
    }
    return null;
  }

  /// Validator cho xac nhan mat khau
  static String? Function(String?) confirmPassword(
    String Function() getPassword, {
    String? fieldName,
  }) {
    return (String? value) {
      final name = fieldName ?? 'Xac nhan mat khau';
      if (value == null || value.trim().isEmpty) {
        return 'Vui long nhap $name';
      }
      if (value.trim() != getPassword().trim()) {
        return 'Mat khau nhap lai khong khop';
      }
      return null;
    };
  }

  // ==================== Phone ====================
  static String? phone(String? value, {String? fieldName}) {
    final name = fieldName ?? 'So dien thoai';
    if (value == null || value.trim().isEmpty) {
      return 'Vui long nhap $name';
    }
    final cleaned = value.trim().replaceAll(RegExp(r'[^0-9]'), '');
    if (cleaned.length < 9 || cleaned.length > 11) {
      return '$name khong hop le';
    }
    return null;
  }

  // ==================== Required ====================
  static String? required(String? value, {String? fieldName}) {
    final name = fieldName ?? 'Truong nay';
    if (value == null || value.trim().isEmpty) {
      return 'Vui long nhap $name';
    }
    return null;
  }

  // ==================== Name ====================
  static String? name(String? value, {String? fieldName}) {
    final name = fieldName ?? 'Ho ten';
    if (value == null || value.trim().isEmpty) {
      return 'Vui long nhap $name';
    }
    if (value.trim().length < 2) {
      return '$name qua ngan';
    }
    return null;
  }

  // ==================== OTP ====================
  static String? otp(String? value, {int length = 6, String? fieldName}) {
    final name = fieldName ?? 'Ma OTP';
    if (value == null || value.trim().isEmpty) {
      return 'Vui long nhap $name';
    }
    if (value.trim().length != length) {
      return '$name phai $length so';
    }
    return null;
  }

  // ==================== Min Length ====================
  static String? Function(String?) minLength(int min, {String? fieldName}) {
    return (String? value) {
      final name = fieldName ?? 'Truong nay';
      if (value == null || value.trim().isEmpty) {
        return 'Vui long nhap $name';
      }
      if (value.trim().length < min) {
        return '$name toi thieu $min ky tu';
      }
      return null;
    };
  }

  // ==================== Combine Validators ====================
  /// Ket hop nhieu validators thanh 1
  static String? Function(String?) combine(List<String? Function(String?)> validators) {
    return (String? value) {
      for (final validator in validators) {
        final error = validator(value);
        if (error != null) return error;
      }
      return null;
    };
  }
}
