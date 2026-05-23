import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Platform, StatusBar,
  Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import { formatVnd } from '../../utils/CurrencyFormat';
import * as Api from '../../repositories/ApiRepository';
import type { BookingResponseModel } from '../../models/BookingModels';
import { parseSafeDate, formatTableCode } from '../../utils/Utils';

const STATUS_MAP: Record<string, { labelVi: string; labelEn: string; color: string }> = {
  PENDING: { labelVi: 'Chờ xác nhận', labelEn: 'Pending', color: '#E2B93B' },
  CONFIRMED: { labelVi: 'Đã xác nhận', labelEn: 'Confirmed', color: '#27AE60' },
  COMPLETED: { labelVi: 'Hoàn thành', labelEn: 'Completed', color: '#2D9CDB' },
  CANCELLED: { labelVi: 'Đã huỷ', labelEn: 'Cancelled', color: '#EB5757' },
};

export default function BookingScreen() {
  const router = useRouter();
  const { isLoggedIn, bookingStepRoute } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [bookings, setBookings] = useState<BookingResponseModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<BookingResponseModel | null>(null);
  const [isDetailsVisible, setIsDetailsVisible] = useState(false);

  // Stepper progress restoration: Auto-redirect if booking session is active
  useFocusEffect(
    useCallback(() => {
      // Delay to ensure React context state from clearBooking() has propagated
      const timer = setTimeout(() => {
        if (isLoggedIn && bookingStepRoute) {
          router.push(bookingStepRoute as any);
        }
      }, 300);
      return () => clearTimeout(timer);
    }, [isLoggedIn, bookingStepRoute])
  );

  const loadBookings = useCallback(async () => {
    if (!isLoggedIn) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await Api.getMyBookings();
      // Only display PENDING and CONFIRMED bookings in active booking screen to avoid duplicates with history (Sắp xếp từ mới nhất đến cũ nhất)
      const activeBookings = (res.data || [])
        .filter((b) => b.status === 'PENDING' || b.status === 'CONFIRMED')
        .sort((a, b) => parseSafeDate(b.reservedFrom).getTime() - parseSafeDate(a.reservedFrom).getTime());
      setBookings(activeBookings);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings])
  );

  const handleCancel = async (booking: BookingResponseModel) => {
    const reservedTime = parseSafeDate(booking.reservedFrom);
    const now = new Date();
    const timeDiffMs = reservedTime.getTime() - now.getTime();
    const hoursDiff = timeDiffMs / (1000 * 60 * 60);
    const isWithin2Hours = hoursDiff < 2;

    const depositText = formatVnd(booking.depositAmount || 200000);

    const alertTitle = isWithin2Hours
      ? (language === 'vi' ? 'Hủy sát giờ & Mất cọc' : 'Late Cancel & Lose Deposit')
      : (language === 'vi' ? 'Xác nhận hủy' : 'Confirm Cancel');

    const alertMessage = isWithin2Hours
      ? (language === 'vi' 
          ? `Bạn đang hủy bàn sát giờ (dưới 2 tiếng trước giờ hẹn). Nếu hủy, bạn sẽ MẤT HOÀN TOÀN tiền cọc ${depositText} đã thanh toán theo quy định.\n\nBạn có đồng ý mất tiền cọc để tiếp tục hủy bàn không?`
          : `You are cancelling less than 2 hours before reservation time. By cancelling, you will LOSE your paid deposit of ${depositText} according to restaurant policy.\n\nDo you agree to forfeit your deposit and cancel?`)
      : (language === 'vi'
          ? `Bạn đang hủy bàn trước 2 giờ. Bạn sẽ được hoàn lại toàn bộ tiền cọc ${depositText} về tài khoản thanh toán.\n\nBạn có chắc chắn muốn hủy đặt bàn này không?`
          : `You are cancelling at least 2 hours in advance. Your deposit of ${depositText} will be fully refunded to your payment account.\n\nAre you sure you want to cancel this booking?`);

    Alert.alert(
      alertTitle,
      alertMessage,
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: language === 'vi' ? 'Huỷ đặt' : 'Cancel Booking',
          style: 'destructive',
          onPress: async () => {
            try {
              await Api.cancelBooking(booking.id);
              loadBookings();
            } catch (e: any) {
              Alert.alert(language === 'vi' ? 'Lỗi' : 'Error', e.message);
            }
          }
        },
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Ionicons name="log-in-outline" size={48} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để sử dụng tính năng đặt bàn' : 'Please log in to use the booking features'}
          </Text>
          <TouchableOpacity
            style={[styles.loginBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginBtnText}>
              {language === 'vi' ? 'Đăng nhập ngay' : 'Log In Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const renderBooking = ({ item }: { item: BookingResponseModel }) => {
    const status = STATUS_MAP[item.status] ?? { labelVi: item.status, labelEn: item.status, color: colors.textSecondary };
    const statusLabel = language === 'vi' ? status.labelVi : status.labelEn;
    const from = parseSafeDate(item.reservedFrom);

    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
        activeOpacity={0.85}
        onPress={() => {
          setSelectedBooking(item);
          setIsDetailsVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.branchName, { color: colors.text }]}>{item.branchName || '3Ship Branch'}</Text>
          <View style={[styles.badge, { backgroundColor: status.color + '20' }]}>
            <Text style={[styles.badgeText, { color: status.color }]}>{statusLabel}</Text>
          </View>
        </View>

        <View style={styles.cardRow}>
          <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.cardInfo, { color: colors.textSecondary }]}>
            {from.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} - {from.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>

        <View style={styles.cardRow}>
          <Ionicons name="people-outline" size={16} color={colors.textSecondary} />
          <Text style={[styles.cardInfo, { color: colors.textSecondary }]}>
            {item.guests} {language === 'vi' ? 'khách' : 'guests'} • {t('table')} {formatTableCode(item.tableCode, language, true)}
          </Text>
        </View>

        {item.dishes && item.dishes.length > 0 && (
          <Text style={[styles.dishCount, { color: colors.primary }]}>
            {item.dishes.length} {language === 'vi' ? 'món ăn đã chọn' : 'dishes selected'} • {formatVnd(item.computedTotal)}
          </Text>
        )}

        {(item.status === 'PENDING' || item.status === 'CONFIRMED') && (
          <TouchableOpacity style={[styles.cancelBtn, { backgroundColor: colors.primary + '10' }]} onPress={() => handleCancel(item)}>
            <Text style={[styles.cancelBtnText, { color: colors.primary }]}>
              {language === 'vi' ? 'Hủy lịch đặt bàn' : 'Cancel Booking'}
            </Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  const ListHeader = () => (
    <View style={styles.headerCtaContainer}>
      <View style={[styles.ctaCard, { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF', borderColor: colors.border }]}>
        <View style={[styles.ctaIconBox, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="restaurant" size={32} color={colors.primary} />
        </View>
        <Text style={[styles.ctaTitle, { color: colors.text }]}>
          {language === 'vi' ? 'Thưởng Thức Ẩm Thực 3Ship' : 'Enjoy 3Ship Culinary'}
        </Text>
        <Text style={[styles.ctaDescription, { color: colors.textSecondary }]}>
          {language === 'vi'
            ? 'Đăng ký đặt bàn trực tuyến giữ chỗ nhanh chóng. Bạn có thể chọn trước thực đơn ưu đãi hấp dẫn giúp nhà hàng chuẩn bị tốt hơn!'
            : 'Book your table online in seconds. Pre-order your favorite dishes in advance to enjoy an exclusive and flawless dining experience!'}
        </Text>
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/booking/new')}
        >
          <Ionicons name="calendar" size={20} color="#fff" />
          <Text style={styles.ctaButtonText}>{t('bookNow')}</Text>
        </TouchableOpacity>
      </View>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {language === 'vi' ? 'Bàn đặt sắp diễn ra' : 'Upcoming Bookings'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t('tabBooking')}</Text>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          renderItem={renderBooking}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={44} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {language === 'vi' ? 'Bạn chưa có lịch đặt bàn nào sắp tới.' : 'No upcoming reservations.'}
              </Text>
            </View>
          }
        />
      )}

      {/* Booking Details Modal */}
      <Modal
        visible={isDetailsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDetailsVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'vi' ? 'Chi Tiết Đặt Bàn' : 'Reservation Details'}
              </Text>
              <TouchableOpacity onPress={() => setIsDetailsVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedBooking && (
              <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                {/* Status Section */}
                <View style={styles.section}>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      {language === 'vi' ? 'Mã đặt bàn:' : 'Booking ID:'}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.text, fontWeight: 'bold' }]}>
                      #{selectedBooking.id.substring(0, 8).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                      {language === 'vi' ? 'Trạng thái:' : 'Status:'}
                    </Text>
                    <View style={[styles.badge, { backgroundColor: (STATUS_MAP[selectedBooking.status]?.color || colors.textSecondary) + '20' }]}>
                      <Text style={[styles.badgeText, { color: STATUS_MAP[selectedBooking.status]?.color || colors.textSecondary }]}>
                        {language === 'vi' ? STATUS_MAP[selectedBooking.status]?.labelVi : STATUS_MAP[selectedBooking.status]?.labelEn}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Branch & Table Info */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 {language === 'vi' ? 'Thông tin nhà hàng' : 'Restaurant Info'}</Text>
                <View style={[styles.infoBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Text style={[styles.infoText, { color: colors.text, fontWeight: 'bold' }]}>
                    {selectedBooking.branchName}
                  </Text>
                  <Text style={[styles.infoTextSub, { color: colors.textSecondary, marginTop: 4 }]}>
                    📅 {parseSafeDate(selectedBooking.reservedFrom).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US')} - {parseSafeDate(selectedBooking.reservedFrom).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={[styles.infoTextSub, { color: colors.textSecondary, marginTop: 4 }]}>
                    👥 {selectedBooking.guests} {language === 'vi' ? 'khách' : 'guests'} • {t('table')} {formatTableCode(selectedBooking.tableCode, language, true)}
                  </Text>
                </View>

                {/* Special Request */}
                {selectedBooking.specialRequest && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>📝 {language === 'vi' ? 'Yêu cầu đặc biệt' : 'Special Request'}</Text>
                    <View style={[styles.infoBlock, { backgroundColor: colors.background, borderColor: colors.border }]}>
                      <Text style={[styles.infoText, { color: colors.text }]}>
                        {selectedBooking.specialRequest}
                      </Text>
                    </View>
                  </>
                )}

                {/* Dishes list */}
                {selectedBooking.dishes && selectedBooking.dishes.length > 0 && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>🍳 {language === 'vi' ? 'Danh sách món ăn đã chọn' : 'Pre-ordered Dishes'}</Text>
                    <View style={[styles.dishesBlock, { borderColor: colors.border }]}>
                      {selectedBooking.dishes.map((d, index) => (
                        <View key={d.id || index} style={[styles.dishItem, index < selectedBooking.dishes.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
                          <View style={styles.dishHeader}>
                            <Text style={[styles.dishName, { color: colors.text }]}>
                              {d.food ? translateDbText(d.food.name) : 'Món ăn'}
                            </Text>
                            <Text style={[styles.dishPrice, { color: colors.text }]}>
                              {formatVnd(d.totalPrice)}
                            </Text>
                          </View>
                          <Text style={[styles.dishSub, { color: colors.textSecondary }]}>
                            {formatVnd(d.unitPrice)} x {d.quantity}
                          </Text>
                          {d.specialNote && (
                            <View style={[styles.noteContainer, { backgroundColor: colors.primary + '08' }]}>
                              <Text style={[styles.noteText, { color: colors.primary }]}>
                                💡 Ghi chú: {d.specialNote}
                              </Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Payment summary */}
                <Text style={[styles.sectionTitle, { color: colors.text }]}>💳 {language === 'vi' ? 'Chi tiết thanh toán' : 'Payment Summary'}</Text>
                <View style={[styles.paymentSummary, { borderColor: colors.border }]}>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                      {language === 'vi' ? 'Tạm tính món ăn:' : 'Dishes Subtotal:'}
                    </Text>
                    <Text style={[styles.summaryVal, { color: colors.text }]}>
                      {formatVnd(selectedBooking.computedSubtotal)}
                    </Text>
                  </View>
                  {selectedBooking.computedDiscount > 0 && (
                    <View style={styles.summaryRow}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Khuyến mãi áp dụng:' : 'Discount:'}
                      </Text>
                      <Text style={[styles.summaryVal, { color: '#EB5757' }]}>
                        -{formatVnd(selectedBooking.computedDiscount)}
                      </Text>
                    </View>
                  )}
                  <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, marginTop: 10 }]}>
                    <Text style={[styles.summaryLabelTotal, { color: colors.text }]}>
                      {language === 'vi' ? 'Tổng tiền cần thanh toán:' : 'Total Amount:'}
                    </Text>
                    <Text style={[styles.summaryValTotal, { color: colors.primary }]}>
                      {formatVnd(selectedBooking.computedTotal)}
                    </Text>
                  </View>
                  {selectedBooking.depositAmount !== undefined && selectedBooking.depositAmount > 0 && (
                    <View style={[styles.summaryRow, { marginTop: 6 }]}>
                      <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Tiền đặt cọc (đã trả):' : 'Paid Deposit:'}
                      </Text>
                      <Text style={[styles.summaryVal, { color: '#27AE60', fontWeight: 'bold' }]}>
                        {formatVnd(selectedBooking.depositAmount)}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Footer notes */}
                <Text style={styles.footerNote}>
                  {language === 'vi'
                    ? '* Vui lòng đến nhà hàng đúng giờ hẹn. Lịch đặt của bạn sẽ được giữ tối đa 15 phút.'
                    : '* Please arrive on time. Your reservation will be held for a maximum of 15 minutes.'}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  title: { fontSize: 24, fontWeight: 'bold', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText: { fontSize: 15, marginTop: 12, textAlign: 'center', lineHeight: 22 },
  loginBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  listContent: { paddingBottom: 40 },
  card: {
    borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, marginHorizontal: 20,
    shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 4, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  branchName: { fontSize: 16, fontWeight: 'bold' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: 'bold' },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  cardInfo: { fontSize: 13 },
  dishCount: { fontSize: 14, fontWeight: 'bold', marginTop: 10, marginBottom: 4 },
  cancelBtn: { marginTop: 12, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  cancelBtnText: { fontWeight: 'bold', fontSize: 13 },
  headerCtaContainer: { padding: 20 },
  ctaCard: {
    borderRadius: 20, padding: 20, alignItems: 'center', borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10, elevation: 2,
    marginBottom: 20,
  },
  ctaIconBox: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  ctaTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  ctaDescription: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  ctaButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    width: '100%', paddingVertical: 14, borderRadius: 14,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  ctaButtonText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40, marginHorizontal: 20 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 28, borderTopRightRadius: 28, height: '85%', paddingBottom: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalBody: { paddingHorizontal: 24, paddingTop: 16 },
  section: { marginBottom: 20, gap: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 14 },
  detailValue: { fontSize: 14 },
  infoBlock: { borderRadius: 16, padding: 16, borderWidth: 1, gap: 6 },
  infoText: { fontSize: 15 },
  infoTextSub: { fontSize: 13 },
  dishesBlock: { borderRadius: 16, borderWidth: 1, overflow: 'hidden', marginTop: 4 },
  dishItem: { padding: 16, gap: 4 },
  dishHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dishName: { fontSize: 14, fontWeight: 'bold', flex: 1, paddingRight: 10 },
  dishPrice: { fontSize: 14, fontWeight: 'bold' },
  dishSub: { fontSize: 12 },
  noteContainer: { padding: 10, borderRadius: 10, marginTop: 8 },
  noteText: { fontSize: 12, fontWeight: '500' },
  paymentSummary: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 10, marginTop: 4 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14 },
  summaryVal: { fontSize: 14, fontWeight: 'bold' },
  summaryLabelTotal: { fontSize: 14, fontWeight: 'bold' },
  summaryValTotal: { fontSize: 18, fontWeight: 'bold' },
  footerNote: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 28, marginBottom: 50, fontStyle: 'italic', lineHeight: 18 },
});

