import 'ApiConfig.dart';

/// Viết theo style "thầy": Utils chứa baseUrl + endpoint constants.
class Utils {
  static String apiUrl = buildApiBasePath();

  // ===== Auth =====
  static const String loginApi = '/auth/login';
  static const String registerApi = '/auth/register';
  static const String logoutApi = '/auth/logout';

  // Forgot password
  static const String forgotPasswordRequestApi = '/auth/forgot-password/request';
  static const String forgotPasswordVerifyApi = '/auth/forgot-password/verify';
  static const String forgotPasswordResetApi = '/auth/forgot-password/reset';

  // ===== Me =====
  static const String meApi = '/me';

  // ===== Branches / Categories / Foods =====
  static const String branchesApi = '/branches';
  static const String categoriesApi = '/categories';
  static const String foodsApi = '/foods';
  static const String branchesFoodsApi = '/branches-foods';

  // ===== Booking / Tables =====
  static const String bookingsApi = '/bookings';
  static const String myBookingsApi = '/bookings/me';
  static String bookingCancelApi(String bookingId) => '/bookings/$bookingId/cancel';
  static String bookingRateFoodsApi(String bookingId) => '/bookings/$bookingId/rate-foods';
  static String tableAvailabilityApi(String branchId) =>
      '/branches/$branchId/tables/availability';

  // ===== Favorites =====
  static const String favoritesApi = '/favorites';
  static String favoriteByFoodIdApi(String foodId) => '/favorites/$foodId';

  // ===== Promotions =====
  static const String promotionsAvailableApi = '/promotions/available';

  // ===== Chat =====
  static const String myConversationApi = '/chat/conversations/me';
  static String chatMessagesApi(String conversationId) =>
      '/chat/conversations/$conversationId/messages';
  static const String chatSendMessageApi = '/chat/messages';

  // ===== Notifications =====
  static const String notificationsApi = '/notifications';
  static const String notificationsGlobalApi = '/notifications/global';
  static String notificationMarkReadApi(String id) => '/notifications/$id/read';
}

/// Helper function để extract message từ Exception.
/// Loại bỏ prefix "Exception: " nếu có.
String extractErrorMessage(dynamic error) {
  if (error == null) return 'Đã xảy ra lỗi không xác định';
  
  final errorString = error.toString();
  
  // Nếu là Exception với format "Exception: message", chỉ lấy message
  if (errorString.startsWith('Exception: ')) {
    return errorString.substring('Exception: '.length);
  }
  
  // Nếu error có message property (như FormatException)
  if (error is Exception && error.toString().contains(':')) {
    final parts = errorString.split(': ');
    if (parts.length > 1) {
      return parts.sublist(1).join(': ');
    }
  }
  
  // Trả về toàn bộ string nếu không match pattern nào
  return errorString;
}

/// Bỏ dấu tiếng Việt để hỗ trợ tìm kiếm.
/// Chuyển các ký tự có dấu thành không dấu và chuyển thành chữ thường.
/// 
/// Ví dụ:
/// - "Phở bò" → "pho bo"
/// - "Món ăn" → "mon an"
/// - "Bánh bao" → "banh bao"
String normalizeVietnamese(String input) {
  final lower = input.toLowerCase();
  return lower
      .replaceAll(RegExp(r'[àáạảãâầấậẩẫăằắặẳẵ]'), 'a')
      .replaceAll(RegExp(r'[èéẹẻẽêềếệểễ]'), 'e')
      .replaceAll(RegExp(r'[ìíịỉĩ]'), 'i')
      .replaceAll(RegExp(r'[òóọỏõôồốộổỗơờớợởỡ]'), 'o')
      .replaceAll(RegExp(r'[ùúụủũưừứựửữ]'), 'u')
      .replaceAll(RegExp(r'[ỳýỵỷỹ]'), 'y')
      .replaceAll(RegExp(r'[đ]'), 'd');
}


