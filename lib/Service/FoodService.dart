import '../Models/FoodModels.dart';
import '../Models/BranchModels.dart';
import '../Repository/FoodRepository.dart';

class FoodService {
  late FoodRepository foodRepository;

  FoodService() {
    foodRepository = FoodRepository();
  }

  Future<FoodPageResponse> getFoods({
    int page = 1,
    int size = 20,
    String? name,
    String? categoryId,
  }) async {
    return await foodRepository.getFoods(
      page: page,
      size: size,
      name: name,
      categoryId: categoryId,
    );
  }

  Future<BranchFoodPageResponse> getBranchFoods({
    required String branchId,
    int page = 1,
    int size = 20,
    String? keyword,
    String? categoryId,
  }) async {
    return await foodRepository.getBranchFoods(
      branchId: branchId,
      page: page,
      size: size,
      keyword: keyword,
      categoryId: categoryId,
    );
  }
}
