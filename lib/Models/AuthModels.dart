import 'BaseResponse.dart';

// ==================== SessionUserModel ====================
class SessionUserModel {
  SessionUserModel({
    required this.id,
    required this.username,
    required this.email,
    this.phone,
    this.avatar,
    this.gender,
  });

  final String id;
  final String username;
  final String email;
  final String? phone;
  final String? avatar;
  final String? gender; // backend: MALE/FEMALE

  factory SessionUserModel.fromJson(Map<String, dynamic> json) {
    final id = json['id'] as String?;
    final username = json['username'] as String?;
    final email = json['email'] as String?;
    if (id == null || username == null || email == null) {
      throw Exception('Thiếu thông tin người dùng từ backend (id/username/email).');
    }
    return SessionUserModel(
      id: id,
      username: username,
      email: email,
      phone: json['phone'] as String?,
      avatar: json['avatar'] as String?,
      gender: json['gender'] as String?,
    );
  }
}

// ==================== LoginResult ====================
class LoginResult {
  LoginResult({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final SessionUserModel user;
  final String accessToken;
  final String refreshToken;

  factory LoginResult.fromJson(Map<String, dynamic> json) {
    final accessToken = json['accessToken'] as String?;
    final refreshToken = json['refreshToken'] as String?;
    if (accessToken == null || refreshToken == null) {
      throw Exception('Thiếu token đăng nhập từ backend.');
    }
    return LoginResult(
      user: SessionUserModel.fromJson(json['user'] as Map<String, dynamic>),
      accessToken: accessToken,
      refreshToken: refreshToken,
    );
  }
}

// ==================== LoginResponseWrapper ====================
class LoginResponseWrapper extends BaseResponse {
  LoginResult? data;

  LoginResponseWrapper({
    required int statusCode,
    required String message,
    this.data,
  }) : super(statusCode: statusCode, message: message);

  factory LoginResponseWrapper.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    return LoginResponseWrapper(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: payload is Map<String, dynamic> ? LoginResult.fromJson(payload) : null,
    );
  }
}

// ==================== UserResponseWrapper ====================
class UserResponseWrapper extends BaseResponse {
  SessionUserModel? data;

  UserResponseWrapper({
    required int statusCode,
    required String message,
    this.data,
  }) : super(statusCode: statusCode, message: message);

  factory UserResponseWrapper.fromJson(Map<String, dynamic> json) {
    final payload = json['data'];
    return UserResponseWrapper(
      statusCode: (json['statusCode'] as num).toInt(),
      message: json['message'] as String,
      data: payload is Map<String, dynamic>
          ? SessionUserModel.fromJson(payload)
          : null,
    );
  }
}

