import '../Models/FoodModels.dart';
import '../Models/BranchModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class FoodRepository extends HttpRepository {
  Future<FoodPageResponse> getFoods({
    int page = 1,
    int size = 20,
    String? name,
    String? categoryId,
  }) async {
    final json = await getJson(
      Utils.foodsApi,
      query: {
        'page': page,
        'size': size,
        if (name != null) 'name': name,
        if (categoryId != null) 'categoryId': categoryId,
      },
    );
    final res = FoodPageResponse.fromJson(json);
    if (!res.status) {
      throw Exception(res.message);
    }
    return res;
  }

  Future<BranchFoodPageResponse> getBranchFoods({
    required String branchId,
    int page = 1,
    int size = 20,
    String? keyword,
    String? categoryId,
  }) async {
    final json = await getJson(
      Utils.branchesFoodsApi,
      query: {
        'branchId': branchId,
        'page': page,
        'size': size,
        if (keyword != null) 'keyword': keyword,
        if (categoryId != null) 'categoryId': categoryId,
      },
    );
    final res = BranchFoodPageResponse.fromJson(json);
    if (!res.status) {
      throw Exception(res.message);
    }
    return res;
  }
}
