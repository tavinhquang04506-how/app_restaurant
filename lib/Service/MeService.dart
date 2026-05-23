import '../Models/AuthModels.dart';
import '../Repository/MeRepository.dart';

class MeService {
  late MeRepository meRepository;

  MeService() {
    meRepository = MeRepository();
  }

  Future<UserResponseWrapper> getMe() async {
    return await meRepository.getMe();
  }

  Future<UserResponseWrapper> updateMe({
    required String username,
    required String phone,
    String? avatarUrl,
    String? gender,
  }) async {
    return await meRepository.updateMe(
      username: username,
      phone: phone,
      avatarUrl: avatarUrl,
      gender: gender,
    );
  }
}
