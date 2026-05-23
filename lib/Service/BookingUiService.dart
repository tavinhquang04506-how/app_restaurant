import 'package:flutter/material.dart';

import 'package:android/Models/backend_models.dart';
import 'package:android/Service/BookingService.dart';
import 'package:android/Utils/Utils.dart';

class BookingUiService {
  BookingUiService._();

  /// Gọi API tạo booking + hiển thị SnackBar.
  ///
  /// Trả về `true` nếu thành công.
  static Future<bool> createBookingWithFeedback({
    required BuildContext context,
    required BookingService api,
    required BookingRequestPayload payload,
    String successMessage = 'Đặt bàn thành công!',
  }) async {
    try {
      await api.createBooking(payload);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(successMessage)),
      );
      return true;
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Không thể đặt bàn: ${extractErrorMessage(error)}')),
      );
      return false;
    }
  }
}


