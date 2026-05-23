import '../Models/AuthModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class MeRepository extends HttpRepository {
  Future<UserResponseWrapper> getMe() async {
    final json = await getJson(Utils.meApi);
    final res = UserResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<UserResponseWrapper> updateMe({
    required String username,
    required String phone,
    String? avatarUrl,
    String? gender,
  }) async {
    final json = await putJson(
      Utils.meApi,
      body: {
        'username': username,
        'phone': phone,
        if (avatarUrl != null && avatarUrl.isNotEmpty) 'avatarUrl': avatarUrl,
        if (gender != null) 'gender': gender,
      },
    );
    final res = UserResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }
}
