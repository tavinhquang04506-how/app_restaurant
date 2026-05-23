import '../Utils/AppSession.dart';

class BaseRepository {
  void handleStatus(int statusCode) {
    if (statusCode == 401) {
      // Chỉ sign out khi đang có phiên, tránh đè thông báo khi login sai.
      if (AppSession.accessToken != null) {
        AppSession.signOut();
        throw Exception('Phien dang nhap da het han, vui long dang nhap lai.');
      }
    }
  }
}
