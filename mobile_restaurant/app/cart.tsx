import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, Platform, Image, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCartStore, type CartItem } from '../stores/CartStore';
import { useThemeStore } from '../stores/useThemeStore';
import { useLanguageStore } from '../stores/useLanguageStore';
import { formatVnd } from '../utils/CurrencyFormat';
import * as Api from '../repositories/ApiRepository';
import { extractErrorMessage, formatTableCode } from '../utils/Utils';
import type { BookingResponseModel } from '../models/BookingModels';
import { useAuth } from '../contexts/AuthContext';

export default function CartScreen() {
  const router = useRouter();
  const { isLoggedIn, booking, setBooking, clearBooking } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();
  const cartItems = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);

  const [orderedItems, setOrderedItems] = useState<CartItem[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<BookingResponseModel[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Pending Hold Timer State
  const [pendingTimeLeft, setPendingTimeLeft] = useState('');

  // Sync ordered items with cart store when mounted or store items change
  useEffect(() => {
    setOrderedItems((prev) => {
      if (prev.length === 0) return [...cartItems];

      const updated = prev
        .map((p) => {
          const matching = cartItems.find((c) => c.food.id === p.food.id);
          if (!matching) return null;
          return { ...p, quantity: matching.quantity, note: matching.note };
        })
        .filter(Boolean) as CartItem[];

      cartItems.forEach((c) => {
        const exists = updated.some((u) => u.food.id === c.food.id);
        if (!exists) {
          updated.push(c);
        }
      });

      return updated;
    });
  }, [cartItems]);

  // Load upcoming bookings
  useEffect(() => {
    if (isLoggedIn) {
      loadBookings();
    }
  }, [isLoggedIn]);

  // Hold Timer Effect
  useEffect(() => {
    if (!booking?.holdExpiresAt) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((booking.holdExpiresAt! - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(timer);
        setPendingTimeLeft('');
      } else {
        const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
        const ss = String(remaining % 60).padStart(2, '0');
        setPendingTimeLeft(`${mm}:${ss}`);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [booking?.holdExpiresAt]);

  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const res = await Api.getMyBookings();
      const confirmed = (res.data || []).filter((b) => b.status === 'CONFIRMED');
      setUpcomingBookings(confirmed);
      if (confirmed.length > 0) {
        setSelectedBookingId(confirmed[0].id);
      }
    } catch (e) {
      console.warn('Cannot load bookings:', e);
    } finally {
      setLoadingBookings(false);
    }
  };



  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= orderedItems.length) return;

    const newItems = [...orderedItems];
    const temp = newItems[index];
    newItems[index] = newItems[targetIndex];
    newItems[targetIndex] = temp;
    setOrderedItems(newItems);
  };

  const handleApplyToBooking = async () => {
    if (!selectedBookingId) {
      Alert.alert('Thông báo', 'Vui lòng chọn một bàn đặt trước.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = orderedItems.map((item, idx) => ({
        foodId: item.food.id,
        quantity: item.quantity,
        specialNote: item.note || '',
        servingOrder: idx + 1,
      }));

      await Api.updateBookingDishes(selectedBookingId, payload);
      clearCart();

      if (Platform.OS === 'web') {
        window.alert('Đã áp dụng thực đơn pre-order vào bàn đặt thành công!');
      } else {
        Alert.alert('🎉 Thành công', 'Đã áp dụng thực đơn pre-order vào bàn đặt thành công!', [
          { text: 'Tuyệt vời' },
        ]);
      }
      router.replace('/(tabs)/booking');
    } catch (e) {
      Alert.alert('Lỗi', extractErrorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNewBooking = () => {
    router.push('/booking/new');
  };

  const cartTotal = orderedItems.reduce((sum, item) => sum + item.food.price * item.quantity, 0);

  const hasPendingHold = booking?.tableId && booking?.holdExpiresAt && booking.holdExpiresAt > Date.now();

  if (orderedItems.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('preOrderCart')}</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.emptyCenter}>
          <View style={[styles.emptyIconContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="reader-outline" size={72} color={colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {language === 'vi' ? 'Giỏ hàng của bạn đang trống' : 'Your pre-order list is empty'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            {language === 'vi'
              ? 'Đặt trước các món ăn hấp dẫn để nhà hàng chuẩn bị sẵn sàng ngay khi bạn đến!'
              : 'Pre-order delicious dishes so the restaurant can prepare them right when you arrive!'}
          </Text>
          <TouchableOpacity
            style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/(tabs)/food')}
          >
            <Text style={styles.exploreBtnText}>
              {language === 'vi' ? 'Khám phá thực đơn ngay' : 'Explore menu now'}
            </Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Giỏ hàng Pre-order</Text>
        <TouchableOpacity onPress={() => clearCart()} style={styles.clearBtn}>
          <Text style={{ color: colors.primary, fontWeight: 'bold' }}>Xoá hết</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Info Banner on serving order */}
        <View style={[styles.infoBanner, { backgroundColor: isDarkMode ? '#2c3d3e' : '#fcf5f5', borderColor: colors.border }]}>
          <Ionicons name="shuffle-outline" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.infoBannerTitle, { color: colors.text }]}>Thứ tự phục vụ món</Text>
            <Text style={[styles.infoBannerDesc, { color: colors.textSecondary }]}>
              Nhấn mũi tên lên/xuống kế bên món ăn để sắp xếp thứ tự phục vụ bạn mong muốn.
            </Text>
          </View>
        </View>

        {/* Cart items list */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Danh sách món ăn</Text>
        {orderedItems.map((item, index) => (
          <View key={item.food.id} style={[styles.cartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Reordering Controls */}
            <View style={styles.reorderControls}>
              <TouchableOpacity
                onPress={() => moveItem(index, 'up')}
                disabled={index === 0}
                style={[styles.arrowBtn, { opacity: index === 0 ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-up-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
              <View style={[styles.orderNumberBadge, { backgroundColor: isDarkMode ? '#2C2C2E' : '#fdebeb' }]}>
                <Text style={[styles.orderNumberText, { color: colors.primary }]}>{index + 1}</Text>
              </View>
              <TouchableOpacity
                onPress={() => moveItem(index, 'down')}
                disabled={index === orderedItems.length - 1}
                style={[styles.arrowBtn, { opacity: index === orderedItems.length - 1 ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-down-circle" size={26} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {/* Food info */}
            <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              {item.food.imageUrl ? (
                <Image source={{ uri: item.food.imageUrl }} style={styles.foodImage} />
              ) : (
                <View style={[styles.foodImagePlaceholder, { backgroundColor: colors.background }]}>
                  <Ionicons name="fast-food" size={24} color={colors.textSecondary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
                  {item.food.name}
                </Text>
                {item.note ? (
                  <Text style={[styles.foodNote, { color: colors.textSecondary }]} numberOfLines={1}>
                    💡 {item.note}
                  </Text>
                ) : null}
                <Text style={[styles.foodPrice, { color: colors.primary }]}>
                  {formatVnd(item.food.price)}
                </Text>

                {/* Quantity modifiers */}
                <View style={styles.qtyRow}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                    onPress={() => updateQuantity(item.food.id, item.quantity - 1)}
                  >
                    <Ionicons name="remove" size={16} color={colors.text} />
                  </TouchableOpacity>
                  <Text style={[styles.qtyText, { color: colors.text }]}>{item.quantity}</Text>
                  <TouchableOpacity
                    style={[styles.qtyBtn, { borderColor: colors.border }]}
                    onPress={() => updateQuantity(item.food.id, item.quantity + 1)}
                  >
                    <Ionicons name="add" size={16} color={colors.text} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Remove item */}
            <TouchableOpacity style={styles.removeBtn} onPress={() => removeItem(item.food.id)}>
              <Ionicons name="trash-outline" size={20} color="#e74c3c" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Pricing Summary */}
        <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tổng số lượng</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              {orderedItems.reduce((acc, item) => acc + item.quantity, 0)} phần
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Tổng tiền pre-order</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>{formatVnd(cartTotal)}</Text>
          </View>
        </View>

        {/* Action Options */}
        {isLoggedIn ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 24 }]}>
              Lựa chọn áp dụng đơn pre-order
            </Text>

            {loadingBookings ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 20 }} />
            ) : upcomingBookings.length > 0 ? (
              <View style={[styles.bookingsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.bookingsTitle, { color: colors.text }]}>
                  Chọn bàn đặt sắp tới của bạn
                </Text>
                {upcomingBookings.map((b) => {
                  const isSelected = selectedBookingId === b.id;
                  const dateObj = new Date(b.reservedFrom);
                  const displayDate = dateObj.toLocaleDateString('vi-VN', {
                    weekday: 'short',
                    day: '2-digit',
                    month: '2-digit',
                  });
                  const displayTime = dateObj.toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <TouchableOpacity
                      key={b.id}
                      style={[
                        styles.bookingOption,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          backgroundColor: isSelected
                            ? isDarkMode
                              ? colors.primary + '25'
                              : '#fef2f2'
                            : colors.background,
                        },
                      ]}
                      onPress={() => setSelectedBookingId(b.id)}
                    >
                      <View style={styles.bookingOptionHeader}>
                        <Ionicons
                          name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                          size={20}
                          color={isSelected ? colors.primary : colors.textSecondary}
                        />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.bookingBranch, { color: colors.text }]}>
                            {b.branchName || 'Chi nhánh 3Ship'}
                          </Text>
                          <Text style={[styles.bookingDetails, { color: colors.textSecondary }]}>
                            🕒 {displayTime} • {displayDate} • {b.guests} khách • {language === 'vi' ? 'Bàn' : 'Table'} {formatTableCode(b.tableCode, language, true)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={handleApplyToBooking}
                  disabled={submitting}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="restaurant-outline" size={20} color="#fff" />
                      <Text style={styles.actionBtnText}>Áp dụng vào đặt bàn</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: colors.primary }]}
                  onPress={handleStartNewBooking}
                >
                  <Text style={[styles.secondaryBtnText, { color: colors.primary }]}>
                    Đặt thêm bàn mới khác
                  </Text>
                </TouchableOpacity>
              </View>
            ) : hasPendingHold && pendingTimeLeft ? (
              <View style={[styles.bookingsBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={{ backgroundColor: isDarkMode ? '#2c1e15' : '#fff7ed', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Ionicons name="time" size={16} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13, flex: 1 }}>
                    Bàn đang được giữ tạm thời: {pendingTimeLeft}
                  </Text>
                </View>

                <View style={{ gap: 8, marginTop: 4 }}>
                  <Text style={[styles.bookingBranch, { color: colors.text, fontWeight: 'bold' }]}>
                    {booking.branch || 'Chi nhánh 3Ship'}
                  </Text>
                  <Text style={[styles.bookingDetails, { color: colors.textSecondary }]}>
                    🕒 {booking.time} • {booking.date} • {booking.guestCount} khách • {language === 'vi' ? 'Bàn' : 'Table'} {formatTableCode(booking.tableCode, language, true)}
                  </Text>
                </View>

                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                  onPress={() => router.push('/booking/confirm')}
                >
                  <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Tiếp tục xác nhận đặt bàn</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.secondaryBtn, { borderColor: '#ef4444' }]}
                  onPress={() => {
                    const title = language === 'vi' ? 'Hủy giữ bàn' : 'Cancel Hold';
                    const msg = language === 'vi'
                      ? 'Bạn có chắc chắn muốn hủy phiên giữ bàn hiện tại không?'
                      : 'Are you sure you want to cancel the current table hold?';
                    Alert.alert(title, msg, [
                      { text: language === 'vi' ? 'Không' : 'No', style: 'cancel' },
                      {
                        text: language === 'vi' ? 'Có, hủy' : 'Yes, cancel',
                        style: 'destructive',
                        onPress: () => {
                          clearBooking();
                          clearCart();
                        },
                      },
                    ]);
                  }}
                >
                  <Text style={[styles.secondaryBtnText, { color: '#ef4444' }]}>
                    Hủy giữ bàn này
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={[styles.bookingsBox, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 24 }]}>
                <Ionicons name="calendar-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 10 }} />
                <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
                  Bạn không có bàn đặt sắp tới nào
                </Text>
                <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13, marginTop: 4, paddingHorizontal: 20, marginBottom: 18 }}>
                  Hãy tạo bàn đặt mới để áp dụng các món ăn pre-order hấp dẫn này!
                </Text>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: colors.primary, width: '90%' }]}
                  onPress={handleStartNewBooking}
                >
                  <Ionicons name="add" size={20} color="#fff" />
                  <Text style={styles.actionBtnText}>Bắt đầu đặt bàn mới</Text>
                </TouchableOpacity>
              </View>
            )}
          </>

        ) : (
          <View style={[styles.bookingsBox, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 24 }]}>
            <Ionicons name="lock-closed-outline" size={40} color={colors.textSecondary} style={{ marginBottom: 10 }} />
            <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>
              Đăng nhập để đặt bàn
            </Text>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', fontSize: 13, marginTop: 4, paddingHorizontal: 20, marginBottom: 18 }}>
              Bạn cần đăng nhập để áp dụng món ăn pre-order vào bàn đặt.
            </Text>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary, width: '90%' }]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={styles.actionBtnText}>Đăng nhập ngay</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    paddingTop: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  clearBtn: { padding: 6 },
  scrollContent: { padding: 16 },
  infoBanner: {
    flexDirection: 'row', gap: 12, padding: 14, borderRadius: 12,
    borderWidth: 1, marginBottom: 20, alignItems: 'center',
  },
  infoBannerTitle: { fontSize: 14, fontWeight: 'bold' },
  infoBannerDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  cartCard: {
    flexDirection: 'row', padding: 12, borderRadius: 14, borderWidth: 1,
    marginBottom: 10, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, elevation: 1,
  },
  reorderControls: {
    alignItems: 'center', justifyContent: 'center', marginRight: 12, gap: 4,
  },
  arrowBtn: { padding: 2 },
  orderNumberBadge: {
    width: 22, height: 22, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  orderNumberText: { fontSize: 12, fontWeight: 'bold' },
  foodImage: { width: 68, height: 68, borderRadius: 10 },
  foodImagePlaceholder: {
    width: 68, height: 68, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  foodName: { fontSize: 15, fontWeight: 'bold' },
  foodNote: { fontSize: 12, marginTop: 2 },
  foodPrice: { fontSize: 14, fontWeight: 'bold', marginTop: 4 },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  qtyBtn: {
    width: 26, height: 26, borderRadius: 13, borderWidth: 1,
    justifyContent: 'center', alignItems: 'center',
  },
  qtyText: { fontSize: 14, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  removeBtn: { padding: 8, alignSelf: 'flex-start' },
  summaryCard: {
    borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 14,
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: 14 },
  summaryValue: { fontSize: 14, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 12 },
  totalLabel: { fontSize: 15, fontWeight: 'bold' },
  totalValue: { fontSize: 17, fontWeight: 'bold' },
  bookingsBox: {
    borderRadius: 16, borderWidth: 1, padding: 16, gap: 12,
  },
  bookingsTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 4 },
  bookingOption: {
    padding: 12, borderRadius: 12, borderWidth: 1,
  },
  bookingOptionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bookingBranch: { fontSize: 14, fontWeight: 'bold' },
  bookingDetails: { fontSize: 12, marginTop: 2 },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 12, paddingVertical: 14, marginTop: 6,
  },
  actionBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  secondaryBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 12, paddingVertical: 14, borderWidth: 1,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: 'bold' },
  emptyCenter: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32, paddingTop: 100 },
  emptyIconContainer: {
    width: 140, height: 140, borderRadius: 70,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
  },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  exploreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12,
  },
  exploreBtnText: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
});
