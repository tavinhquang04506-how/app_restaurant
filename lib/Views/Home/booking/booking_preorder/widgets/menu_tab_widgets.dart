import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';

class MenuTabWidgets {
  static Widget buildSearchField(TextEditingController controller) {
    return TextField(
      controller: controller,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        prefixIcon: const Icon(Icons.search, color: Colors.white70),
        hintText: 'Tìm kiếm món theo tên hoặc danh mục',
        hintStyle: const TextStyle(color: Colors.white38),
        filled: true,
        fillColor: const Color(0xFF1E1E1E),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(24),
          borderSide: BorderSide.none,
        ),
      ),
    );
  }

  static Widget buildCategoryFilter({
    required List<CategoryModel> categories,
    required String? selectedCategoryId,
    required bool loadingCategories,
    required Function(String?) onCategorySelected,
  }) {
    if (categories.isEmpty && !loadingCategories) {
      return const SizedBox.shrink();
    }

    final chips = <Widget>[
      _buildCategoryChip(
        label: 'Tất cả',
        selected: selectedCategoryId == null,
        onTap: () => onCategorySelected(null),
      ),
      const SizedBox(width: 12),
    ];

    for (final category in categories) {
      chips.add(
        _buildCategoryChip(
          label: category.name,
          selected: selectedCategoryId == category.id,
          onTap: () => onCategorySelected(category.id),
        ),
      );
      chips.add(const SizedBox(width: 12));
    }

    if (loadingCategories) {
      chips.add(
        const SizedBox(
          height: 24,
          width: 24,
          child: Padding(
            padding: EdgeInsets.only(left: 8),
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: Colors.white54,
            ),
          ),
        ),
      );
    }

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(children: chips),
    );
  }

  static Widget _buildCategoryChip({
    required String label,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: selected ? Colors.redAccent : const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          label,
          style: TextStyle(
            color: selected ? Colors.white : Colors.white70,
            fontWeight: FontWeight.w600,
            fontSize: 13,
          ),
        ),
      ),
    );
  }

  static Widget buildFoodCard({
    required BranchFoodModel item,
    required int quantity,
    required Function(BranchFoodModel) onIncrease,
    required Function(BranchFoodModel) onDecrease,
    required NumberFormat currency,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildFoodImage(
            item.food.imageUrl,
            width: 96,
            height: 96,
            borderRadius: BorderRadius.circular(12),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.food.name,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.food.description.isNotEmpty
                      ? item.food.description
                      : (item.food.categoryName ?? 'Món ăn'),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white54,
                    fontSize: 12,
                    height: 1.4,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      currency.format(item.price),
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    _buildQuantityAction(
                      quantity: quantity,
                      item: item,
                      onIncrease: onIncrease,
                      onDecrease: onDecrease,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget _buildQuantityAction({
    required int quantity,
    required BranchFoodModel item,
    required Function(BranchFoodModel) onIncrease,
    required Function(BranchFoodModel) onDecrease,
  }) {
    if (quantity <= 0) {
      return GestureDetector(
        onTap: () => onIncrease(item),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: const BoxDecoration(
            color: Color(0xFF2962FF),
            shape: BoxShape.circle,
          ),
          child: const Icon(Icons.add, color: Colors.white, size: 18),
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        color: const Color(0xFF2C2C2C),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            onPressed: () => onDecrease(item),
            icon: const Icon(Icons.remove, color: Colors.white, size: 18),
          ),
          Text(
            '$quantity',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          IconButton(
            onPressed: () => onIncrease(item),
            icon: const Icon(Icons.add, color: Colors.white, size: 18),
          ),
        ],
      ),
    );
  }

  static Widget _buildFoodImage(
    String? url, {
    double width = 80,
    double height = 80,
    BorderRadius? borderRadius,
  }) {
    final radius = borderRadius ?? BorderRadius.circular(12);
    final placeholder = FoodImagePlaceholder(
      width: width,
      height: height,
      borderRadius: radius,
    );

    if (url == null || url.isEmpty) {
      return placeholder;
    }

    if (url.startsWith('http')) {
      return ClipRRect(
        borderRadius: radius,
        child: Image.network(
          url,
          width: width,
          height: height,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) => placeholder,
        ),
      );
    }

    return ClipRRect(
      borderRadius: radius,
      child: Image.asset(
        url,
        width: width,
        height: height,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => placeholder,
      ),
    );
  }
}

