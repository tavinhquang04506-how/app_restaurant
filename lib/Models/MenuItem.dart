import 'package:flutter/foundation.dart';
import 'package:intl/intl.dart';

import 'package:android/Utils/AppSession.dart';
import 'FoodModels.dart';
import 'BranchModels.dart';

final NumberFormat menuCurrencyFormatter = NumberFormat.currency(
  locale: 'vi_VN',
  symbol: 'đ',
  decimalDigits: 0,
);

class MenuItem {
  MenuItem({
    required this.id,
    required this.name,
    required this.price,
    required this.category,
    this.description,
    this.imageUrl,
    this.categoryId,
    this.isFavorite = false,
    this.avgRating,
    this.ratingCount,
  });

  final String id;
  final String name;
  final int price;
  final String category;
  final String? categoryId;
  final String? description;
  final String? imageUrl;
  bool isFavorite;
  final double? avgRating;
  final int? ratingCount;

  String get formattedPrice => menuCurrencyFormatter.format(price);
  String get subtitle =>
      (description?.isNotEmpty ?? false) ? description! : 'Hương vị đặc trưng';

  factory MenuItem.fromFoodModel(FoodModel model) {
    return MenuItem(
      id: model.id,
      name: model.name,
      price: model.price,
      category: model.categoryName ?? 'Món ăn',
      categoryId: model.categoryId,
      description: model.description,
      imageUrl: model.imageUrl,
      avgRating: model.avgRating,
      ratingCount: model.ratingCount,
    );
  }

  factory MenuItem.fromBranchFood(BranchFoodModel model) {
    return MenuItem(
      id: model.food.id,
      name: model.food.name,
      price: model.price,
      category: model.food.categoryName ?? 'Món ăn',
      categoryId: model.food.categoryId,
      description: model.food.description,
      imageUrl: model.food.imageUrl,
      avgRating: model.food.avgRating,
      ratingCount: model.food.ratingCount,
    );
  }

  MenuItem copyWith({
    String? id,
    String? name,
    int? price,
    String? category,
    String? categoryId,
    String? description,
    String? imageUrl,
    bool? isFavorite,
    double? avgRating,
    int? ratingCount,
  }) {
    return MenuItem(
      id: id ?? this.id,
      name: name ?? this.name,
      price: price ?? this.price,
      category: category ?? this.category,
      categoryId: categoryId ?? this.categoryId,
      description: description ?? this.description,
      imageUrl: imageUrl ?? this.imageUrl,
      isFavorite: isFavorite ?? this.isFavorite,
      avgRating: avgRating ?? this.avgRating,
      ratingCount: ratingCount ?? this.ratingCount,
    );
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is MenuItem && runtimeType == other.runtimeType && other.id == id;

  @override
  int get hashCode => id.hashCode;
}

class FavoriteManager {
  FavoriteManager._();

  static final ValueNotifier<List<MenuItem>> favorites =
      ValueNotifier<List<MenuItem>>(<MenuItem>[]);
  static bool _initialized = false;

  static void _ensureInit() {
    if (_initialized) return;
    _initialized = true;
    AppSession.currentUser.addListener(() {
      if (!AppSession.isLoggedIn) {
        clear();
      }
    });
  }

  static bool isFavorite(String id) {
    _ensureInit();
    return favorites.value.any((item) => item.id == id);
  }

  static void setFavorite(MenuItem item, bool favorite) {
    _ensureInit();
    final current = List<MenuItem>.from(favorites.value);
    final index = current.indexWhere((element) => element.id == item.id);
    if (favorite) {
      final entry = item.copyWith(isFavorite: true);
      if (index == -1) {
        current.add(entry);
      } else {
        current[index] = entry;
      }
    } else if (index != -1) {
      current.removeAt(index);
    }
    favorites.value = List<MenuItem>.from(current);
  }

  static void replaceAll(List<MenuItem> items) {
    _ensureInit();
    favorites.value =
        items.map((item) => item.copyWith(isFavorite: true)).toList();
  }

  static void clear() {
    _ensureInit();
    if (favorites.value.isNotEmpty) {
      favorites.value = const [];
    }
  }
}
