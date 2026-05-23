import '../Models/AuthModels.dart';
import '../Models/SimpleResponse.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class AuthRepository extends HttpRepository {
  Future<LoginResponseWrapper> login(String email, String password) async {
    final json = await postJson(
      Utils.loginApi,
      body: {
        'username': email,
        'password': password,
      },
    );
    final res = LoginResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<SimpleResponse> register({
    required String username,
    required String email,
    required String phone,
    required String password,
    required String confirmPassword,
  }) async {
    final json = await postJson(
      Utils.registerApi,
      body: {
        'username': username,
        'email': email,
        'phone': phone,
        'password': password,
        'confirmPassword': confirmPassword,
      },
    );
    final res = SimpleResponse.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<SimpleResponse> logout(String refreshToken) async {
    final json = await postJson(
      Utils.logoutApi,
      body: {
        'refreshToken': refreshToken,
      },
    );
    final res = SimpleResponse.fromJson(json);
    if (!res.status && res.statusCode != 204) throw Exception(res.message);
    return res;
  }

  Future<SimpleResponse> requestPasswordOtp(String email) async {
    final json = await postJson(
      Utils.forgotPasswordRequestApi,
      body: {'email': email},
    );
    final res = SimpleResponse.fromJson(json);
    if (!res.status && res.statusCode != 204) throw Exception(res.message);
    return res;
  }

  Future<SimpleResponse> verifyPasswordOtp(String email, String otp) async {
    final json = await postJson(
      Utils.forgotPasswordVerifyApi,
      body: {'email': email, 'otp': otp},
    );
    final res = SimpleResponse.fromJson(json);
    if (!res.status && res.statusCode != 204) throw Exception(res.message);
    return res;
  }

  Future<SimpleResponse> resetPassword({
    required String email,
    required String otp,
    required String password,
    required String confirmPassword,
  }) async {
    final json = await postJson(
      Utils.forgotPasswordResetApi,
      body: {
        'email': email,
        'otp': otp,
        'password': password,
        'confirmPassword': confirmPassword,
      },
    );
    final res = SimpleResponse.fromJson(json);
    if (!res.status && res.statusCode != 204) throw Exception(res.message);
    return res;
  }

  Future<LoginResponseWrapper> loginWithGoogleIdToken(String idToken) async {
    final json = await postJson(
      '/auth/google',
      body: {'idToken': idToken},
    );
    final res = LoginResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }
}
