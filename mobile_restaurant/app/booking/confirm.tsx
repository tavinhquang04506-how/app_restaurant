import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, Platform, TextInput,
  BackHandler, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppColors } from '../../styles/AppColors';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../stores/CartStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import { formatVnd } from '../../utils/CurrencyFormat';
import * as Api from '../../repositories/ApiRepository';
import { extractErrorMessage, formatTableCode } from '../../utils/Utils';
import type { BookingDishPayload } from '../../models/BookingModels';
import type { PromotionModel } from '../../models/PromotionModels';

export default function ConfirmBookingScreen() {
  const router = useRouter();
  const { booking, setBooking, clearBooking, setBookingStepRoute, user } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();
  const cartItems = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Hold Timer and Promos States
  const [timeLeft, setTimeLeft] = useState('');
  const [savedPromos, setSavedPromos] = useState<PromotionModel[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromotionModel | null>(null);
  const [loadingPromos, setLoadingPromos] = useState(false);

  useEffect(() => {
    setBookingStepRoute('/booking/confirm');
  }, [setBookingStepRoute]);

  const handleBack = () => {
    clearBooking();
    clearCart();
    setTimeout(() => router.replace('/(tabs)/booking'), 150);
  };

  useEffect(() => {
    const backAction = () => {
      handleBack();
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [booking]);

  // Load Saved Promos
  useEffect(() => {
    const fetchSavedPromos = async () => {
      if (!user?.id) return;
      setLoadingPromos(true);
      try {
        const raw = await AsyncStorage.getItem(`saved_promotions_${user.id}`);
        const savedCodes: string[] = raw ? JSON.parse(raw) : [];
        if (savedCodes.length > 0) {
          const res = await Api.getAvailablePromotions();
          const all = res.data || [];
          const matched = all.filter((p) => savedCodes.includes(p.code));
          setSavedPromos(matched);
        }
      } catch (e) {
        console.error('Error fetching promos:', e);
      } finally {
        setLoadingPromos(false);
      }
    };
    fetchSavedPromos();
  }, [user?.id]);

  // Hold Timer Effect
  useEffect(() => {
    if (!booking?.holdExpiresAt) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((booking.holdExpiresAt! - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(timer);
        Alert.alert(
          language === 'vi' ? 'Hết hạn giữ bàn' : 'Hold Expired',
          language === 'vi'
            ? 'Thời gian giữ bàn 10 phút của bạn đã hết. Vui lòng chọn lại bàn!'
            : 'Your 10-minute table hold has expired. Please select a table again!',
          [
            {
              text: 'OK',
              onPress: () => {
                setBooking({
                  ...booking,
                  tableId: undefined,
                  tableCode: undefined,
                  holdExpiresAt: undefined,
                });
                router.replace('/booking/select-table');
              },
            },
          ]
        );
      } else {
        const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
        const ss = String(remaining % 60).padStart(2, '0');
        setTimeLeft(`${mm}:${ss}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.holdExpiresAt]);

  if (!booking?.tableId || !booking?.branchId) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('invalidBookingInfo')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cartTotal = cartItems.reduce((sum, item) => sum + item.food.price * item.quantity, 0);
  const discountAmount = appliedPromo ? Math.round((cartTotal * appliedPromo.discountPercent) / 100) : 0;
  const finalTotal = cartTotal - discountAmount;

  const handleApplyPromo = async (code: string) => {
    if (!code.trim()) return;
    setLoading(true);
    try {
      const res = await Api.getAvailablePromotions();
      const all = res.data || [];
      const promo = all.find((p) => p.code.toLowerCase() === code.trim().toLowerCase());
      if (!promo) {
        Alert.alert(
          language === 'vi' ? 'Thất bại' : 'Failed',
          language === 'vi' ? 'Mã giảm giá không hợp lệ hoặc đã hết hạn.' : 'Invalid or expired promo code.'
        );
        return;
      }
      const isExpired = promo.endDate && new Date(promo.endDate) < new Date();
      if (isExpired) {
        Alert.alert(
          language === 'vi' ? 'Thất bại' : 'Failed',
          language === 'vi' ? 'Mã giảm giá đã hết hạn sử dụng.' : 'Promo code has expired.'
        );
        return;
      }
      setAppliedPromo(promo);
      setPromoCodeInput(promo.code);
      Alert.alert(
        language === 'vi' ? 'Thành công' : 'Success',
        language === 'vi'
          ? `Đã áp dụng mã ${promo.code}: Giảm ${promo.discountPercent}%`
          : `Applied promo code ${promo.code}: -${promo.discountPercent}%`
      );
    } catch (e) {
      Alert.alert(t('errorTitle'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const bookingTime = `${booking.date}T${booking.time}:00`;

      const dishes: BookingDishPayload[] = cartItems.map((item, idx) => ({
        foodId: item.food.id,
        quantity: item.quantity,
        servingOrder: idx + 1,
        specialNote: item.note,
      }));

      const res = await Api.createBooking({
        bookingTime,
        guests: booking.guestCount,
        tableId: booking.tableId!,
        branchId: booking.branchId!,
        specialRequest: booking.specialRequest,
        dishes: dishes.length > 0 ? dishes : undefined,
        durationMinutes: booking.durationMinutes,
        promotionCode: appliedPromo ? appliedPromo.code : undefined,
      });

      const isVip = booking.tableCode?.toUpperCase().startsWith("VIP");
      const depositAmount = isVip ? 300000 : 200000;

      const bookingId = res.data?.id || 'TEST-ID';
      const branchName = booking.branch || '3Ship Branch';
      const date = booking.date || '';
      const time = booking.time || '';
      const tableCode = booking.tableCode || '';

      router.push({
        pathname: '/booking/payment',
        params: {
          bookingId,
          tableCode,
          branchName,
          date,
          time,
          depositAmount: String(depositAmount),
          holdExpiresAt: booking.holdExpiresAt ? String(booking.holdExpiresAt) : '',
        }
      });
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('confirm')}</Text>
        <TouchableOpacity
          onPress={() => {
            const title = language === 'vi' ? 'Hủy đặt bàn' : 'Cancel Booking';
            const message = language === 'vi'
              ? 'Bạn có chắc muốn hủy tiến trình đặt bàn không?'
              : 'Are you sure you want to cancel this booking process?';
            if (Platform.OS === 'web') {
              if (window.confirm(message)) {
                clearBooking();
                clearCart();
                setBookingStepRoute(null);
                router.replace('/(tabs)/booking');
              }
            } else {
              Alert.alert(title, message, [
                { text: language === 'vi' ? 'Không' : 'No', style: 'cancel' },
                {
                  text: language === 'vi' ? 'Có, hủy' : 'Yes, cancel',
                  style: 'destructive',
                  onPress: () => {
                    clearBooking();
                    clearCart();
                    setBookingStepRoute(null);
                    router.replace('/(tabs)/booking');
                  },
                },
              ]);
            }
          }}
          style={styles.cancelHeaderBtn}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>
            {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Countdown Timer Banner */}
      {timeLeft ? (
        <View style={[styles.timerBanner, { backgroundColor: isDarkMode ? '#2c1e15' : '#fff7ed', borderBottomColor: isDarkMode ? '#7c2d12' : '#fed7aa' }]}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.timerText, { color: colors.primary }]}>
            {language === 'vi'
              ? `Vui lòng xác nhận đặt bàn trong vòng: ${timeLeft}`
              : `Please confirm your booking in: ${timeLeft}`}
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        {/* Booking Info Card */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>{t('bookingInfo')}</Text>

          <View style={styles.infoRow}>
            <Ionicons name="storefront-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('branch')}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{translateDbText(booking.branch)}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('bookingDate')}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.date}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('bookingTime')}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.time}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('numGuests')}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{booking.guestCount} {t('guestsCountSuffix')}</Text>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="grid-outline" size={20} color={colors.primary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('table')}:</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatTableCode(booking.tableCode, language)}</Text>
          </View>

          {booking.specialRequest ? (
            <View style={styles.infoRow}>
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} />
              <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{t('notes')}:</Text>
              <Text style={[styles.infoValue, { color: colors.text }]}>{booking.specialRequest}</Text>
            </View>
          ) : null}
        </View>

        {/* Promo Codes Application Section */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            {language === 'vi' ? 'Áp dụng mã giảm giá' : 'Apply Coupon'}
          </Text>

          {/* Promo Input Box */}
          <View style={styles.promoInputWrapper}>
            <TextInput
              style={[
                styles.promoInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: isDarkMode ? '#1e1e1e' : '#f9f9f9',
                },
              ]}
              placeholder={language === 'vi' ? 'Nhập mã giảm giá...' : 'Enter promo code...'}
              placeholderTextColor={colors.textSecondary}
              value={promoCodeInput}
              onChangeText={setPromoCodeInput}
              autoCapitalize="characters"
              editable={!appliedPromo}
            />
            {appliedPromo ? (
              <TouchableOpacity style={[styles.applyBtn, { backgroundColor: '#ef4444' }]} onPress={handleRemovePromo}>
                <Text style={styles.applyBtnText}>{language === 'vi' ? 'Hủy' : 'Clear'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={() => handleApplyPromo(promoCodeInput)}
              >
                <Text style={styles.applyBtnText}>{language === 'vi' ? 'Áp dụng' : 'Apply'}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Saved Promos Chip Row */}
          {savedPromos.length > 0 && !appliedPromo && (
            <View style={styles.savedPromosRow}>
              <Text style={[styles.savedPromosLabel, { color: colors.textSecondary }]}>
                {language === 'vi' ? 'Mã đã lưu của bạn:' : 'Your saved codes:'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedScroll}>
                {savedPromos.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.promoChip, { backgroundColor: isDarkMode ? '#2c1e15' : '#fff7ed', borderColor: colors.primary }]}
                    onPress={() => handleApplyPromo(item.code)}
                  >
                    <Ionicons name="ticket-outline" size={12} color={colors.primary} />
                    <Text style={[styles.promoChipText, { color: colors.primary }]}>{item.code} (-{item.discountPercent}%)</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {appliedPromo && (
            <View style={[styles.promoSuccessBox, { backgroundColor: isDarkMode ? '#112215' : '#eafaf1', borderColor: '#34c759' }]}>
              <Ionicons name="checkmark-circle-outline" size={16} color="#34c759" />
              <Text style={[styles.promoSuccessText, { color: '#34c759' }]}>
                {language === 'vi'
                  ? `Đã áp dụng thành công mã ${appliedPromo.code} (Giảm ${appliedPromo.discountPercent}%)`
                  : `Successfully applied code ${appliedPromo.code} (${appliedPromo.discountPercent}% off)`}
              </Text>
            </View>
          )}
        </View>

        {/* Cart Items */}
        {cartItems.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={[styles.cardTitle, { color: colors.text, marginBottom: 0 }]}>{t('selectedDishes')}</Text>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={() => router.push('/(tabs)/food')}
              >
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={{ color: colors.primary, fontWeight: 'bold' }}>{t('addDishesBtn')}</Text>
              </TouchableOpacity>
            </View>
            {cartItems.map((item) => (
              <View key={item.food.id} style={[styles.dishRow, { borderBottomColor: colors.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dishName, { color: colors.text }]}>{translateDbText(item.food.name)}</Text>
                  <Text style={[styles.dishPrice, { color: colors.textSecondary }]}>{formatVnd(item.food.price)} × {item.quantity}</Text>
                </View>
                <Text style={[styles.dishTotal, { color: colors.primary }]}>{formatVnd(item.food.price * item.quantity)}</Text>
              </View>
            ))}

            {/* Price Calculations */}
            <View style={styles.priceSummarySection}>
              <View style={styles.priceSummaryRow}>
                <Text style={[styles.priceSummaryLabel, { color: colors.textSecondary }]}>{language === 'vi' ? 'Tiền đồ ăn:' : 'Food subtotal:'}</Text>
                <Text style={[styles.priceSummaryValue, { color: colors.text }]}>{formatVnd(cartTotal)}</Text>
              </View>

              {appliedPromo && (
                <View style={styles.priceSummaryRow}>
                  <Text style={[styles.priceSummaryLabel, { color: colors.textSecondary }]}>{language === 'vi' ? 'Khuyến mãi:' : 'Discount:'}</Text>
                  <Text style={[styles.priceSummaryValue, { color: '#ef4444' }]}>-{formatVnd(discountAmount)} ({appliedPromo.discountPercent}%)</Text>
                </View>
              )}

              <View style={[styles.totalRow, { borderTopColor: colors.primary }]}>
                <Text style={[styles.totalLabel, { color: colors.text }]}>{t('totalLabel')}</Text>
                <Text style={[styles.totalValue, { color: colors.primary }]}>{formatVnd(finalTotal)}</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.card, alignItems: 'center', paddingVertical: 24 }]}>
            <Ionicons name="fast-food-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 15, color: colors.text, fontWeight: 'bold' }}>{t('noPreOrderText')}</Text>
            <Text style={{ fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
              {t('noPreOrderDesc')}
            </Text>
            <TouchableOpacity
              style={{
                flexDirection: 'row', alignItems: 'center', gap: 6,
                backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10
              }}
              onPress={() => router.push('/(tabs)/food')}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>{t('addDishesBtn')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Hint */}
        <View style={[styles.hintBox, { backgroundColor: isDarkMode ? '#2c3e50' : '#eff6ff' }]}>
          <Ionicons name="information-circle-outline" size={18} color={isDarkMode ? '#3498db' : AppColors.info} />
          <Text style={[styles.hintText, { color: isDarkMode ? '#3498db' : AppColors.info }]}>
            {t('preOrderTip')}
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: isDarkMode ? '#2ecc71' : AppColors.success }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.submitBtnText}>{t('confirmBookingBtn')}</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
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
  cancelHeaderBtn: { height: 40, justifyContent: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
  content: { padding: 20 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#E53935', fontSize: 14 },
  card: {
    borderRadius: 16, padding: 18, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  cardTitle: { fontSize: 17, fontWeight: 'bold', marginBottom: 14 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  infoLabel: { fontSize: 14, width: 80 },
  infoValue: { fontSize: 15, fontWeight: '500', flex: 1 },
  dishRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1 },
  dishName: { fontSize: 15, fontWeight: '500' },
  dishPrice: { fontSize: 13, marginTop: 2 },
  dishTotal: { fontSize: 15, fontWeight: 'bold' },
  timerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  timerText: { fontSize: 13, fontWeight: 'bold' },
  promoInputWrapper: {
    flexDirection: 'row', gap: 10, alignItems: 'center',
  },
  promoInput: {
    flex: 1, height: 44, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14,
    fontSize: 14, fontWeight: '500',
  },
  applyBtn: {
    paddingHorizontal: 16, height: 44, borderRadius: 10, justifyContent: 'center', alignItems: 'center',
  },
  applyBtnText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  savedPromosRow: { marginTop: 12 },
  savedPromosLabel: { fontSize: 12, marginBottom: 6, fontWeight: '500' },
  savedScroll: { gap: 8 },
  promoChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 14,
  },
  promoChipText: { fontSize: 12, fontWeight: '600' },
  promoSuccessBox: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1,
    borderRadius: 8, padding: 8, marginTop: 12,
  },
  promoSuccessText: { fontSize: 12, fontWeight: '600' },
  priceSummarySection: { marginTop: 12 },
  priceSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  priceSummaryLabel: { fontSize: 14 },
  priceSummaryValue: { fontSize: 14, fontWeight: '500' },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 2,
  },
  totalLabel: { fontSize: 16, fontWeight: 'bold' },
  totalValue: { fontSize: 18, fontWeight: 'bold' },
  hintBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    borderRadius: 10, padding: 12, marginBottom: 20,
  },
  hintText: { fontSize: 13, flex: 1, lineHeight: 20 },
  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold' },
});


