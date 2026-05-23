import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:android/Models/backend_models.dart';
import 'package:android/Components/FoodImagePlaceHolder.dart';
import '../models/booking_cart_item.dart';
import 'quantity_control.dart';
import 'booking_summary_widgets.dart';

class CartTabWidgets {
  static Widget buildFoodImage(
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

  static Widget buildCartCard({
    required BookingCartItem item,
    required int index,
    required NumberFormat currency,
    required Function(String) onRemove,
    required Function(BranchFoodModel) onIncrease,
    required Function(BranchFoodModel) onDecrease,
    required Function(String) onNoteChanged,
  }) {
    return Container(
      key: ValueKey(item.food.food.id),
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF1E1E1E),
        borderRadius: BorderRadius.circular(18),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: buildFoodImage(
                  item.food.food.imageUrl,
                  width: 72,
                  height: 72,
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Thứ tự ra món: ${index + 1}',
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.food.food.name,
                      style: const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.food.food.description.isNotEmpty
                          ? item.food.food.description
                          : (item.food.food.categoryName ?? 'Món ăn'),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Colors.white54,
                        fontSize: 12,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      currency.format(item.food.price),
                      style: const TextStyle(
                        color: Colors.redAccent,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              Column(
                children: [
                  ReorderableDragStartListener(
                    index: index,
                    child: const Icon(Icons.drag_indicator, color: Colors.white38),
                  ),
                  const SizedBox(height: 16),
                  IconButton(
                    onPressed: () => onRemove(item.food.food.id),
                    icon: const Icon(Icons.close, color: Colors.white38, size: 20),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              QuantityControl(
                quantity: item.quantity,
                onAdd: () => onIncrease(item.food),
                onRemove: () => onDecrease(item.food),
              ),
              Text(
                currency.format(item.quantity * item.food.price),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          TextField(
            controller: item.noteController,
            maxLines: 2,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(
              hintText: 'Ghi chú cho món này (ví dụ: ít cay, thêm sốt...)',
              hintStyle: TextStyle(color: Colors.white38, fontSize: 12),
              filled: true,
              fillColor: Color(0xFF2A2A2A),
              border: OutlineInputBorder(borderSide: BorderSide.none),
              contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            ),
            onChanged: onNoteChanged,
          ),
        ],
      ),
    );
  }

  static Widget buildPromotionCard({
    required PromotionModel? selectedPromotion,
    required bool loadingPromotions,
    required bool hasCart,
    required bool noPromoAvailable,
    required VoidCallback? onTap,
    required VoidCallback onClearPromotion,
  }) {
    final title = selectedPromotion != null ? 'Đã áp dụng mã ưu đãi' : 'Áp dụng mã ưu đãi';
    final subtitle = selectedPromotion != null
        ? '${selectedPromotion.name} • Giảm ${selectedPromotion.discountPercent}% hóa đơn'
        : noPromoAvailable
            ? 'Hiện chưa có mã ưu đãi khả dụng.'
            : 'Khuyến mãi dùng chung cho toàn bộ người dùng';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: const Color(0xFF1E1E1E),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: selectedPromotion != null ? Colors.greenAccent : Colors.white12,
          ),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFF2F2F33),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.local_offer, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(color: Colors.white54, fontSize: 12),
                  ),
                  if (selectedPromotion != null)
                    TextButton(
                      onPressed: onClearPromotion,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        minimumSize: const Size(0, 0),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                      ),
                      child: const Text(
                        'Bỏ mã',
                        style: TextStyle(color: Colors.redAccent, fontSize: 13),
                      ),
                    ),
                ],
              ),
            ),
            if (loadingPromotions)
              const SizedBox(
                width: 20,
                height: 20,
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.white70,
                ),
              )
            else if (hasCart)
              const Icon(Icons.chevron_right, color: Colors.white70),
          ],
        ),
      ),
    );
  }

  static Widget buildPromotionSheet({
    required BuildContext sheetContext,
    required List<PromotionModel> promotions,
    required String? selectedCode,
    required String clearSignal,
    required Function(String) onPromotionSelected,
    required Function() onClearPromotion,
    required String Function(PromotionModel) formatPromotionPeriod,
  }) {
    return SafeArea(
      child: SizedBox(
        height: MediaQuery.of(sheetContext).size.height * 0.6,
        child: Column(
          children: [
            Container(
              width: 52,
              height: 4,
              margin: const EdgeInsets.symmetric(vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white24,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            const Text(
              'Chọn mã ưu đãi',
              style: TextStyle(
                color: Colors.white,
                fontSize: 16,
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 12),
            Expanded(
              child: promotions.isEmpty
                  ? const Center(
                      child: Text(
                        'Hiện chưa có mã ưu đãi khả dụng.',
                        style: TextStyle(color: Colors.white54),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                      itemCount: promotions.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 12),
                      itemBuilder: (_, index) {
                        final promo = promotions[index];
                        final isSelected = promo.code == selectedCode;
                        return GestureDetector(
                          onTap: () => onPromotionSelected(promo.code),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: const Color(0xFF24242B),
                              borderRadius: BorderRadius.circular(18),
                              border: Border.all(
                                color: isSelected ? Colors.redAccent : Colors.white10,
                                width: 1.2,
                              ),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    color: Colors.redAccent.withOpacity(0.15),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: const Icon(Icons.card_giftcard, color: Colors.white),
                                ),
                                const SizedBox(width: 12),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        promo.name,
                                        style: const TextStyle(
                                          color: Colors.white,
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        'Mã ${promo.code} • Giảm ${promo.discountPercent}% • còn ${promo.remaining}/${promo.quantity} lượt',
                                        style: const TextStyle(color: Colors.white70, fontSize: 12),
                                      ),
                                      if ((promo.description ?? '').isNotEmpty)
                                        Padding(
                                          padding: const EdgeInsets.only(top: 4),
                                          child: Text(
                                            promo.description!,
                                            style: const TextStyle(color: Colors.white54, fontSize: 12),
                                          ),
                                        ),
                                      Padding(
                                        padding: const EdgeInsets.only(top: 4),
                                        child: Text(
                                          formatPromotionPeriod(promo),
                                          style: const TextStyle(color: Colors.white38, fontSize: 11),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                                Radio<String>(
                                  value: promo.code,
                                  groupValue: selectedCode,
                                  activeColor: Colors.redAccent,
                                  onChanged: (_) => onPromotionSelected(promo.code),
                                ),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
            TextButton(
              onPressed: onClearPromotion,
              child: const Text(
                'Bỏ mã ưu đãi',
                style: TextStyle(color: Colors.redAccent),
              ),
            ),
            const SizedBox(height: 12),
          ],
        ),
      ),
    );
  }

  static Widget buildCartSummary({
    required int cartLength,
    required int subTotal,
    required int discountAmount,
    required int totalAmount,
    required bool submitting,
    required bool loadingPromotions,
    required bool promotionsEmpty,
    required NumberFormat currency,
    required VoidCallback? onSubmit,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF1A1A1A),
        boxShadow: [
          BoxShadow(
            color: Colors.black54,
            offset: Offset(0, -2),
            blurRadius: 6,
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _buildSummaryRow(
            'Tạm tính ($cartLength món)',
            subTotal,
            currency: currency,
            bold: false,
          ),
          const SizedBox(height: 6),
          _buildSummaryRow(
            'Ưu đãi áp dụng',
            discountAmount,
            currency: currency,
            isDiscount: true,
          ),
          const Divider(color: Colors.white12, height: 24),
          _buildSummaryRow(
            'Tổng cộng',
            totalAmount,
            currency: currency,
            bold: true,
          ),
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: submitting ? null : onSubmit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.redAccent,
                padding: const EdgeInsets.symmetric(vertical: 14),
              ),
              child: submitting
                  ? const SizedBox(
                      width: 18,
                      height: 18,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.white,
                      ),
                    )
                  : const Text(
                      'Tiếp tục đặt bàn & xác nhận món',
                      style: TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
            ),
          ),
          if (!loadingPromotions && promotionsEmpty)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text(
                'Hiện chưa có mã ưu đãi khả dụng.',
                style: TextStyle(color: Colors.white38, fontSize: 12),
              ),
            ),
        ],
      ),
    );
  }

  static Widget _buildSummaryRow(
    String label,
    int amount, {
    required NumberFormat currency,
    bool isDiscount = false,
    bool bold = false,
  }) {
    final textStyle = TextStyle(
      color: Colors.white,
      fontWeight: bold ? FontWeight.w700 : FontWeight.w500,
    );
    final displayAmount =
        isDiscount ? '-${currency.format(amount)}' : currency.format(amount);
    final amountColor = isDiscount ? Colors.greenAccent : Colors.white;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isDiscount ? Colors.greenAccent : Colors.white70,
            fontSize: bold ? 16 : 14,
          ),
        ),
        Text(
          isDiscount && amount == 0 ? '-${currency.format(0)}' : displayAmount,
          style: textStyle.copyWith(color: amountColor),
        ),
      ],
    );
  }
}

