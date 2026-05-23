import '../Models/PromotionModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class PromotionRepository extends HttpRepository {
  Future<PromotionListResponse> getAvailablePromotions() async {
    final json = await getJson(Utils.promotionsAvailableApi);
    final res = PromotionListResponse.fromJson(json);
    if (!res.status) {
      throw Exception(res.message);
    }
    return res;
  }
}
