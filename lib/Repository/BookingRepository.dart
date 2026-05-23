import '../Models/BookingModels.dart';
import '../Utils/Utils.dart';
import 'HttpRepository.dart';

class BookingRepository extends HttpRepository {
  Future<BookingResponseWrapper> createBooking(BookingRequestPayload payload) async {
    final json = await postJson(Utils.bookingsApi, body: payload.toJson());
    final res = BookingResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<BookingResponseWrapper> cancelBooking(String bookingId) async {
    final json = await postJson(Utils.bookingCancelApi(bookingId));
    final res = BookingResponseWrapper.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<BookingListResponse> getMyBookings() async {
    final json = await getJson(Utils.myBookingsApi);
    final res = BookingListResponse.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }

  Future<void> rateFoodsInBooking({
    required String bookingId,
    required int rating,
    String? comment,
  }) async {
    final body = {
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    };
    await postJson(Utils.bookingRateFoodsApi(bookingId), body: body);
  }

  Future<TableAvailabilityListResponse> getTableAvailability({
    required String branchId,
    required DateTime start,
    required int guests,
    int durationMinutes = 120,
  }) async {
    final json = await getJson(
      Utils.tableAvailabilityApi(branchId),
      query: {
        'start': start.toIso8601String(),
        'guests': guests,
        'durationMinutes': durationMinutes,
      },
    );
    final res = TableAvailabilityListResponse.fromJson(json);
    if (!res.status) throw Exception(res.message);
    return res;
  }
}
