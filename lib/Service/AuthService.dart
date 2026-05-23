import 'package:android/Utils/AppSession.dart';
import 'package:android/Repository/AuthRepository.dart';
import 'package:google_sign_in/google_sign_in.dart';

class AuthService {
  AuthService({AuthRepository? repository})
      : _repository = repository ?? AuthRepository();

  final AuthRepository _repository;

  Future<bool> login(String email, String password) async {
    final res = await _repository.login(email, password);
    final result = res.data;
    if (result == null) throw Exception('Không thể đăng nhập');
    AppSession.setAuthSession(
      user: User.fromSessionModel(result.user),
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    );
    return true;
  }

  Future<void> register({
    required String username,
    required String email,
    required String phone,
    required String password,
    required String confirmPassword,
  }) {
    return _repository
        .register(
          username: username,
          email: email,
          phone: phone,
          password: password,
          confirmPassword: confirmPassword,
        )
        .then((_) => null);
  }

  Future<void> logout() async {
    final refreshToken = AppSession.refreshToken;
    if (refreshToken != null) {
      await _repository.logout(refreshToken);
    }
    AppSession.signOut();
  }

  Future<bool> loginWithGoogle() async {
    try {
      // 1. Khởi tạo GoogleSignIn với serverClientId để nhận ID token
      // QUAN TRỌNG: serverClientId phải là Web Client ID (không phải Android Client ID)
      // Web Client ID được dùng để backend verify ID token
      final GoogleSignIn googleSignIn = GoogleSignIn(
        scopes: ['email', 'profile'],
        // Web Client ID từ Google Cloud Console
        serverClientId: '1067479178626-2k9p2qnm3e7p7cuq5o4ko2n1dbl5lfcn.apps.googleusercontent.com',
      );

      // 2. Sign out trước để luôn hiển thị dialog chọn tài khoản (để demo)
      // Điều này sẽ xóa account đã lưu trong app, buộc user phải chọn lại
      await googleSignIn.signOut();

      // 3. Đăng nhập với Google và lấy ID token
      // Sau khi signOut, signIn sẽ luôn hiển thị dialog chọn tài khoản
      final GoogleSignInAccount? googleUser = await googleSignIn.signIn();
      if (googleUser == null) {
        throw Exception('Người dùng hủy đăng nhập');
      }

      // 4. Lấy authentication (chứa ID token)
      // Với serverClientId, Google sẽ trả về ID token
      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      if (googleAuth.idToken == null) {
        throw Exception('Không nhận được ID token từ Google. Vui lòng kiểm tra cấu hình serverClientId trong Google Cloud Console.');
      }

      // 5. Gửi ID token về backend để verify và lấy LoginResponse
      final res = await _repository.loginWithGoogleIdToken(googleAuth.idToken!);
      final result = res.data;
      if (result == null) throw Exception('Không thể hoàn tất đăng nhập');

      // 6. Set session
      AppSession.setAuthSession(
        user: User.fromSessionModel(result.user),
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      );

      return true;
    } catch (e) {
      throw Exception('Lỗi đăng nhập Google: $e');
    }
  }
}



