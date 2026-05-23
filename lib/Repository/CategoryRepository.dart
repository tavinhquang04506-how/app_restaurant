import '../Models/CategoryModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class CategoryRepository extends HttpRepository {
  Future<CategoryListResponse> getCategories() async {
    final json = await getJson(Utils.categoriesApi);
    final res = CategoryListResponse.fromJson(json);
    if (!res.status) {
      throw Exception(res.message);
    }
    return res;
  }
}
