import '../Models/FoodModels.dart';
import '../Repository/FavoriteRepository.dart';

class FavoriteService {
  late FavoriteRepository favoriteRepository;

  FavoriteService() {
    favoriteRepository = FavoriteRepository();
  }

  Future<FavoriteFoodListResponse> getFavoriteFoods() async {
    return await favoriteRepository.getFavorites();
  }

  Future<void> addFavorite(String foodId) async {
    await favoriteRepository.addFavorite(foodId);
  }

  Future<void> removeFavorite(String foodId) async {
    await favoriteRepository.removeFavorite(foodId);
  }
}
