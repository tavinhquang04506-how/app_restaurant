import '../Models/BookingModels.dart';
import '../Repository/BookingRepository.dart';

class BookingService {
  late BookingRepository bookingRepository;

  BookingService() {
    bookingRepository = BookingRepository();
  }

  Future<BookingResponseWrapper> createBooking(BookingRequestPayload payload) async {
    return await bookingRepository.createBooking(payload);
  }

  Future<BookingResponseWrapper> cancelBooking(String bookingId) async {
    return await bookingRepository.cancelBooking(bookingId);
  }

  Future<BookingListResponse> getMyBookings() async {
    return await bookingRepository.getMyBookings();
  }

  Future<void> rateFoodsInBooking({
    required String bookingId,
    required int rating,
    String? comment,
  }) async {
    await bookingRepository.rateFoodsInBooking(
      bookingId: bookingId,
      rating: rating,
      comment: comment,
    );
  }

  Future<TableAvailabilityListResponse> getTableAvailability({
    required String branchId,
    required DateTime start,
    required int guests,
    int durationMinutes = 120,
  }) async {
    return await bookingRepository.getTableAvailability(
      branchId: branchId,
      start: start,
      guests: guests,
      durationMinutes: durationMinutes,
    );
  }
}
