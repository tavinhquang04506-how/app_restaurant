import 'package:flutter/material.dart';

import 'package:android/Utils/AppSession.dart';
import 'package:android/Utils/Utils.dart';
import 'package:android/Models/MenuItem.dart';
import 'package:android/Service/FavoriteService.dart';

/// Helper class gom các thao tác favorite để tránh lặp try/catch + rollback + snackbar.
/// 
/// Phân biệt với [FavoriteService] (API layer):
/// - [FavoriteService]: gọi API trực tiếp
/// - [FavoriteHelper]: helper UI với error handling, snackbar, optimistic update
class FavoriteHelper {
  FavoriteHelper._();

  /// Đồng bộ danh sách favorites từ server về `FavoriteManager`.
  ///
  /// - Nếu chưa đăng nhập: clear local favorites và return.
  /// - Nếu `silent = true`: nuốt lỗi (phù hợp với sync nền).
  static Future<void> syncFromServer({
    required FavoriteService api,
    bool silent = false,
  }) async {
    if (!AppSession.isLoggedIn) {
      FavoriteManager.clear();
      return;
    }
    try {
      final favorites = await api.getFavoriteFoods();
      FavoriteManager.replaceAll(
        favorites.data.map(MenuItem.fromFoodModel).toList(),
      );
    } catch (error) {
      if (!silent) rethrow;
    }
  }

  /// Set trạng thái favorite của 1 món + gọi API.
  ///
  /// Trả về trạng thái cuối cùng đã commit (đã rollback nếu lỗi).
  static Future<bool> setFavorite({
    required BuildContext context,
    required FavoriteService api,
    required MenuItem item,
    required bool favorite,
    bool navigateToLogin = true,
    void Function(bool value)? onLocalChanged,
  }) async {
    if (!AppSession.isLoggedIn) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Vui lòng đăng nhập để sử dụng tính năng này.'),
        ),
      );
      if (navigateToLogin) {
        Navigator.pushNamed(context, '/login');
      }
      return FavoriteManager.isFavorite(item.id);
    }

    final previous = FavoriteManager.isFavorite(item.id);

    // optimistic update
    onLocalChanged?.call(favorite);
    FavoriteManager.setFavorite(item, favorite);

    try {
      if (favorite) {
        await api.addFavorite(item.id);
      } else {
        await api.removeFavorite(item.id);
      }
      return favorite;
    } catch (error) {
      // rollback
      onLocalChanged?.call(previous);
      FavoriteManager.setFavorite(item, previous);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(extractErrorMessage(error)),
          ),
        );
      }
      return previous;
    }
  }
}

