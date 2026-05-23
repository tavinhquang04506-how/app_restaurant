import '../Models/FoodModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class FavoriteRepository extends HttpRepository {
  Future<FavoriteFoodListResponse> getFavorites() async {
    final json = await getJson(Utils.favoritesApi);
    final res = FavoriteFoodListResponse.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<void> addFavorite(String foodId) async {
    final json = await postJson(Utils.favoritesApi, body: {'foodId': foodId});
    final statusCode = (json['statusCode'] as num).toInt();
    final message = json['message'] as String?;
    if (statusCode < 200 || statusCode >= 300) {
      throw Exception(message != null && message.isNotEmpty ? message : 'Không thể thêm yêu thích');
    }
  }

  Future<void> removeFavorite(String foodId) async {
    final json = await deleteJson(Utils.favoriteByFoodIdApi(foodId));
    final statusCode = (json['statusCode'] as num).toInt();
    final message = json['message'] as String?;
    if (statusCode < 200 || statusCode >= 300) {
      throw Exception(message != null && message.isNotEmpty ? message : 'Không thể xoá yêu thích');
    }
  }
}
