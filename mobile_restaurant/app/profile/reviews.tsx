import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { formatVnd } from '../../utils/CurrencyFormat';
import * as Api from '../../repositories/ApiRepository';
import { extractErrorMessage, formatTableCode, parseSafeDate } from '../../utils/Utils';
import type { BookingResponseModel } from '../../models/BookingModels';

export default function VerifiedReviewsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();

  const [completedBookings, setCompletedBookings] = useState<BookingResponseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Rating Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponseModel | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCompletedBookings();
  }, []);

  const loadCompletedBookings = async () => {
    setLoading(true);
    try {
      const res = await Api.getMyBookings();
      // Filter for COMPLETED bookings (Sắp xếp từ mới nhất đến cũ nhất)
      const completed = (res.data || [])
        .filter((b) => b.status === 'COMPLETED')
        .sort((a, b) => parseSafeDate(b.reservedFrom).getTime() - parseSafeDate(a.reservedFrom).getTime());
      setCompletedBookings(completed);
    } catch (e) {
      console.warn('Failed to load completed bookings:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleOpenReviewModal = (booking: BookingResponseModel) => {
    setSelectedBooking(booking);
    setRating(5);
    setComment('');
    setModalVisible(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedBooking) return;

    setSubmitting(true);
    try {
      await Api.rateFoodsInBooking(selectedBooking.id, rating, comment.trim());

      setModalVisible(false);
      if (Platform.OS === 'web') {
        window.alert('Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn giúp chúng tôi cải thiện chất lượng phục vụ.');
      } else {
        Alert.alert('🎉 Thành công', 'Cảm ơn bạn đã gửi đánh giá! Ý kiến của bạn giúp chúng tôi cải thiện chất lượng phục vụ.');
      }
      // Reload bookings to update their status to rated = true
      await loadCompletedBookings();
    } catch (e) {
      Alert.alert('Lỗi', extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Đánh giá món ăn</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : completedBookings.length === 0 ? (
        <View style={styles.emptyCenter}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="chatbubbles-outline" size={72} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Chưa có trải nghiệm nào hoàn thành</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Hãy thưởng thức bữa ăn tại nhà hàng 3Ship để viết đánh giá trải nghiệm thực tế nhé!
          </Text>
          <TouchableOpacity
            style={[styles.bookingBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/booking/new')}
          >
            <Text style={styles.bookingBtnText}>Đặt bàn trải nghiệm ngay</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={[styles.introText, { color: colors.textSecondary }]}>
            Chỉ những khách hàng đã dùng bữa thực tế tại nhà hàng mới có thể tham gia đánh giá món ăn để đảm bảo tính khách quan và chân thực ⭐️
          </Text>

          {completedBookings.map((booking) => {
            const dateObj = parseSafeDate(booking.reservedFrom);
            const displayDate = dateObj.toLocaleDateString('vi-VN', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const displayTime = dateObj.toLocaleTimeString('vi-VN', {
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Branch name & Date */}
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.branchName, { color: colors.text }]}>
                      {booking.branchName || 'Chi nhánh 3Ship'}
                    </Text>
                    <Text style={[styles.bookingTime, { color: colors.textSecondary }]}>
                      {displayTime} • {displayDate} • {formatTableCode(booking.tableCode, 'vi')}
                    </Text>
                  </View>

                  {booking.rated ? (
                    <View style={[styles.ratedBadge, { backgroundColor: isDarkMode ? '#1e3a1e' : '#e6f4ea' }]}>
                      <Ionicons name="checkmark-circle" size={14} color="#137333" />
                      <Text style={styles.ratedText}>Đã đánh giá</Text>
                    </View>
                  ) : (
                    <View style={[styles.pendingBadge, { backgroundColor: isDarkMode ? colors.primary + '20' : '#fdebeb' }]}>
                      <Text style={[styles.pendingText, { color: colors.primary }]}>Chờ đánh giá</Text>
                    </View>
                  )}
                </View>

                {/* Dishes ordered */}
                <View style={[styles.dishesBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.dishesTitle, { color: colors.textSecondary }]}>Danh sách món đã dùng:</Text>
                  {booking.dishes.length > 0 ? (
                    booking.dishes.map((d) => (
                      <View key={d.id} style={styles.dishRow}>
                        <Text style={[styles.dishName, { color: colors.text }]} numberOfLines={1}>
                          • {d.food?.name}
                        </Text>
                        <Text style={[styles.dishQty, { color: colors.textSecondary }]}>
                          ×{d.quantity}
                        </Text>
                      </View>
                    ))
                  ) : (
                    <Text style={[styles.noDishesText, { color: colors.textSecondary }]}>
                      Không có món ăn pre-order trong lịch sử đặt này.
                    </Text>
                  )}
                </View>

                {/* Bottom action button */}
                <View style={styles.cardBottom}>
                  <Text style={[styles.guestCount, { color: colors.textSecondary }]}>
                    👥 {booking.guests} khách
                  </Text>

                  {!booking.rated ? (
                    <TouchableOpacity
                      style={[styles.rateBtn, { backgroundColor: colors.primary }]}
                      onPress={() => handleOpenReviewModal(booking)}
                    >
                      <Ionicons name="star" size={15} color="#fff" />
                      <Text style={styles.rateBtnText}>Đánh giá món</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.ratedThanksRow}>
                      <Ionicons name="heart" size={16} color={colors.primary} />
                      <Text style={[styles.ratedThanksText, { color: colors.textSecondary }]}>Cảm ơn bạn đã phản hồi</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Review Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ width: '100%', alignItems: 'center' }}
          >
            <View style={[styles.modalContent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Đánh giá trải nghiệm</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              {/* Booking Info summary */}
              {selectedBooking && (
                <View style={[styles.modalSummary, { backgroundColor: colors.background }]}>
                  <Text style={[styles.summaryBranchName, { color: colors.text }]}>
                    {selectedBooking.branchName || 'Chi nhánh 3Ship'}
                  </Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, marginTop: 2 }}>
                    {formatTableCode(selectedBooking.tableCode, 'vi')} • {selectedBooking.guests} người
                  </Text>
                </View>
              )}

              {/* Star selector */}
              <Text style={[styles.starsTitle, { color: colors.text }]}>Chất lượng món ăn và dịch vụ</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starTouch}>
                    <Ionicons
                      name={star <= rating ? 'star' : 'star-outline'}
                      size={36}
                      color={star <= rating ? '#ffb300' : colors.textSecondary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={[styles.ratingLabel, { color: colors.primary }]}>
                {rating === 1 && 'Rất tệ 😞'}
                {rating === 2 && 'Không hài lòng 😐'}
                {rating === 3 && 'Bình thường 🙂'}
                {rating === 4 && 'Rất ngon & tốt 😊'}
                {rating === 5 && 'Tuyệt hảo! 🌟'}
              </Text>

              {/* Comment text area */}
              <Text style={[styles.commentTitle, { color: colors.text }]}>
                Chia sẻ ý kiến của bạn (Không bắt buộc)
              </Text>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    color: colors.text,
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Món ăn có hợp khẩu vị của bạn không? Thái độ phục vụ của nhân viên ra sao?..."
                placeholderTextColor={colors.textSecondary}
                multiline
                numberOfLines={4}
                value={comment}
                onChangeText={setComment}
              />

              {/* Submit button */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.primary }]}
                onPress={handleSubmitReview}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send" size={16} color="#fff" />
                    <Text style={styles.submitBtnText}>Gửi đánh giá thực tế</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { padding: 16 },
  introText: { fontSize: 13, lineHeight: 20, marginBottom: 16, textAlign: 'center', paddingHorizontal: 12 },
  bookingCard: {
    borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  branchName: { fontSize: 15, fontWeight: 'bold' },
  bookingTime: { fontSize: 12, marginTop: 2 },
  ratedBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  ratedText: { fontSize: 11, color: '#137333', fontWeight: 'bold' },
  pendingBadge: {
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  pendingText: { fontSize: 11, fontWeight: 'bold' },
  dishesBox: {
    borderRadius: 10, borderWidth: 1, padding: 10, marginVertical: 12, gap: 6,
  },
  dishesTitle: { fontSize: 12, fontWeight: '600' },
  dishRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishName: { fontSize: 13, flex: 1 },
  dishQty: { fontSize: 13, fontWeight: '500' },
  noDishesText: { fontSize: 12, fontStyle: 'italic' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  guestCount: { fontSize: 13 },
  rateBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
  },
  rateBtnText: { color: '#fff', fontSize: 13, fontWeight: 'bold' },
  ratedThanksRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratedThanksText: { fontSize: 13, fontWeight: '500' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 100 },
  emptyIconContainer: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  bookingBtn: {
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  bookingBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end', alignItems: 'center',
  },
  modalContent: {
    width: '100%', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    borderWidth: 1, borderBottomWidth: 0, padding: 24, gap: 14,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalCloseBtn: { padding: 4 },
  modalSummary: { padding: 12, borderRadius: 12, marginVertical: 4 },
  summaryBranchName: { fontSize: 14, fontWeight: 'bold' },
  starsTitle: { fontSize: 14, fontWeight: 'bold', textAlign: 'center', marginTop: 10 },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 12, marginVertical: 8 },
  starTouch: { padding: 4 },
  ratingLabel: { fontSize: 15, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  commentTitle: { fontSize: 14, fontWeight: 'bold' },
  commentInput: {
    borderRadius: 12, borderWidth: 1, padding: 12,
    fontSize: 14, height: 80, textAlignVertical: 'top',
  },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 14, marginTop: 10,
  },
  submitBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
