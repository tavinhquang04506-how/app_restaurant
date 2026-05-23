import '../Models/PromotionModels.dart';
import '../Repository/PromotionRepository.dart';

class PromotionService {
  late PromotionRepository promotionRepository;

  PromotionService() {
    promotionRepository = PromotionRepository();
  }

  Future<PromotionListResponse> getAvailablePromotions() async {
    return await promotionRepository.getAvailablePromotions();
  }
}
