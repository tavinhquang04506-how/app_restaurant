import '../Models/CategoryModels.dart';
import '../Repository/CategoryRepository.dart';

class CategoryService {
  late CategoryRepository categoryRepository;

  CategoryService() {
    categoryRepository = CategoryRepository();
  }

  Future<CategoryListResponse> getCategories() async {
    return await categoryRepository.getCategories();
  }
}
