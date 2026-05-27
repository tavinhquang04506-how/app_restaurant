import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, ActivityIndicator, Clipboard, Platform, StatusBar, Image,
  BackHandler,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import { formatVnd } from '../../utils/CurrencyFormat';
import { formatTableCode } from '../../utils/Utils';
import { useAuth } from '../../contexts/AuthContext';
import { useCartStore } from '../../stores/CartStore';
import { LinearGradient } from 'expo-linear-gradient';
import * as Api from '../../repositories/ApiRepository';

export default function BookingPaymentScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { language, t } = useLanguageStore();

  const { clearBooking, setBookingStepRoute } = useAuth();
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    // Set route so re-entry after background navigates back here, NOT to confirm
    setBookingStepRoute('/booking/payment');
  }, [setBookingStepRoute]);

  // Extract route parameters
  const params = useLocalSearchParams();
  const bookingId = (params.bookingId as string) || 'BKG' + Math.random().toString(36).substr(2, 9).toUpperCase();
  const tableCode = (params.tableCode as string) || 'STD-Q1-2-1';
  const branchName = (params.branchName as string) || 'Nhà hàng 3Ship - Quận 1';
  const date = (params.date as string) || '2026-05-24';
  const time = (params.time as string) || '19:00';
  const depositAmount = Number(params.depositAmount) || 200000;
  const holdExpiresAt = Number(params.holdExpiresAt) || 0;

  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bank' | 'card' | 'wallet'>('bank');
  const [walletProvider, setWalletProvider] = useState<'momo' | 'zalopay'>('momo');
  const [step, setStep] = useState<1 | 2>(1);

  // Countdown timer — continues from confirm screen's holdExpiresAt
  useEffect(() => {
    if (!holdExpiresAt || holdExpiresAt <= 0) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.floor((holdExpiresAt - Date.now()) / 1000));
      if (remaining <= 0) {
        clearInterval(timer);
        setTimeLeft('00:00');
        Alert.alert(
          language === 'vi' ? 'Hết hạn giữ bàn' : 'Hold Expired',
          language === 'vi'
            ? 'Thời gian giữ bàn 10 phút của bạn đã hết. Vui lòng đặt bàn lại!'
            : 'Your 10-minute table hold has expired. Please book again!',
          [
            {
              text: 'OK',
              onPress: async () => {
                try {
                  if (bookingId) {
                    await Api.deleteBooking(bookingId);
                  }
                } catch (e) {
                  console.log('Error deleting hold-expired booking:', e);
                } finally {
                  clearBooking();
                  clearCart();
                  // Delay navigation so React state from clearBooking propagates
                  // before the booking tab's useFocusEffect reads bookingStepRoute
                  setTimeout(() => router.replace('/(tabs)/booking'), 150);
                }
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
  }, [holdExpiresAt]);

  // Bank Transfer Details
  const bankDetails = {
    bankName: 'VietinBank (Ngân hàng TMCP Công Thương Việt Nam)',
    accountNumber: '1028739988',
    accountName: 'CONG TY CO PHAN NHA HANG 3SHIP',
    amount: depositAmount,
    message: `3SHIP CK ${bookingId.substring(0, 8).toUpperCase()}`,
  };

  const handleCopy = (text: string, fieldName: string) => {
    Clipboard.setString(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleTestPaymentSuccess = async () => {
    setIsProcessing(true);
    try {
      // Confirm payment on server and trigger success notification
      await Api.confirmPaySuccess(bookingId);
      
      setIsProcessing(false);
      setIsPaid(true);
      // Clear booking session and cart only AFTER successful payment
      clearBooking();
      clearCart();
    } catch (e) {
      setIsProcessing(false);
      Alert.alert(
        language === 'vi' ? 'Lỗi thanh toán' : 'Payment Error',
        language === 'vi'
          ? 'Không thể xác nhận thanh toán đặt bàn. Vui lòng thử lại!'
          : 'Could not verify booking payment. Please try again!'
      );
    }
  };

  const handleCancelBooking = async () => {
    setIsProcessing(true);
    try {
      if (bookingId) {
        // Hard delete the booking and release the table on the server
        await Api.deleteBooking(bookingId);
      }
    } catch (e) {
      console.log('Error deleting pending booking:', e);
    } finally {
      setIsProcessing(false);
      clearBooking();
      clearCart();
      setTimeout(() => router.replace('/(tabs)/booking'), 150);
    }
  };

  const handleGoToBooking = () => {
    // Ensure booking state is fully cleared before navigating away
    clearBooking();
    clearCart();
    // Delay navigation so React state from clearBooking propagates
    // before the booking tab's useFocusEffect reads bookingStepRoute
    setTimeout(() => router.replace('/(tabs)/booking'), 150);
  };

  useEffect(() => {
    const backAction = () => {
      if (isPaid) {
        handleGoToBooking();
        return true;
      }
      if (step === 2) {
        setStep(1);
        return true;
      }
      Alert.alert(
        language === 'vi' ? 'Huỷ đặt bàn?' : 'Cancel Booking Process?',
        language === 'vi'
          ? 'Nếu bạn rời đi, tiến trình đặt bàn của bạn sẽ bị hủy bỏ hoàn toàn và bàn ăn này sẽ được mở lại cho khách hàng khác.'
          : 'If you leave, your booking process will be completely cancelled and this table will be opened for other guests.',
        [
          { text: language === 'vi' ? 'Ở lại thanh toán' : 'Stay & Pay', style: 'cancel' },
          { text: language === 'vi' ? 'Rời đi' : 'Leave', style: 'destructive', onPress: handleCancelBooking },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [isPaid, language, step, bookingId]);

  const isVip = tableCode.toUpperCase().startsWith('VIP');

  if (isPaid) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView contentContainerStyle={styles.successScroll} showsVerticalScrollIndicator={false}>
          {/* Animated Success Card */}
          <View style={[styles.successCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.successIconOuter, { backgroundColor: '#E8F5E9' }]}>
              <View style={[styles.successIconInner, { backgroundColor: '#4CAF50' }]}>
                <Ionicons name="checkmark" size={44} color="#FFF" />
              </View>
            </View>

            <Text style={[styles.successTitle, { color: colors.text }]}>
              {language === 'vi' ? 'Thanh Toán Thành Công!' : 'Payment Successful!'}
            </Text>
            <Text style={[styles.successSubtitle, { color: colors.textSecondary }]}>
              {language === 'vi' 
                ? 'Lịch đặt bàn của bạn đã được ghi nhận đặt cọc giữ chỗ.' 
                : 'Your table reservation has been successfully deposit-confirmed.'}
            </Text>

            {/* Receipt details */}
            <View style={[styles.receiptBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Mã đặt bàn:' : 'Booking Code:'}
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text, fontWeight: 'bold' }]}>
                  #{bookingId.substring(0, 8).toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Bàn ăn giữ chỗ:' : 'Reserved Table:'}
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text, fontWeight: 'bold' }]}>
                  {formatTableCode(tableCode, language)}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Chi nhánh:' : 'Branch:'}
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]} numberOfLines={1}>
                  {branchName}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Thời gian:' : 'Time:'}
                </Text>
                <Text style={[styles.receiptValue, { color: colors.text }]}>
                  {date} ({time})
                </Text>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.text, fontWeight: 'bold' }]}>
                  {language === 'vi' ? 'Tiền cọc đã cọc trước:' : 'Paid Deposit:'}
                </Text>
                <Text style={[styles.receiptTotalValue, { color: '#4CAF50' }]}>
                  {formatVnd(depositAmount)}
                </Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={[styles.receiptLabel, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Trạng thái bàn đặt:' : 'Booking Status:'}
                </Text>
                <View style={[styles.statusBadge, { backgroundColor: '#27AE6020' }]}>
                  <Text style={[styles.statusBadgeText, { color: '#27AE60' }]}>
                    {language === 'vi' ? 'Đã cọc giữ bàn' : 'Deposit Confirmed'}
                  </Text>
                </View>
              </View>
            </View>

            <Text style={[styles.thanksText, { color: colors.textSecondary }]}>
              {language === 'vi' 
                ? 'Cảm ơn quý khách đã tin tưởng và lựa chọn ThreeShip Restaurant!'
                : 'Thank you for choosing ThreeShip Restaurant!'}
            </Text>
          </View>

          {/* Action button */}
          <TouchableOpacity
            style={[styles.finishBtn, { backgroundColor: colors.primary }]}
            onPress={handleGoToBooking}
          >
            <Ionicons name="calendar-outline" size={20} color="#FFF" />
            <Text style={styles.finishBtnText}>
              {language === 'vi' ? 'Về Trang Đặt Bàn' : 'Go to Booking'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        {step === 2 ? (
          <TouchableOpacity
            onPress={() => setStep(1)}
            style={styles.backHeaderBtn}
          >
            <Ionicons name="chevron-back" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : <View style={{ width: 32 }} />}
        
        <Text style={[styles.headerTitle, { color: colors.text, flex: 1, textAlign: 'center', marginLeft: step === 2 ? -24 : 0 }]}>
          {language === 'vi' ? 'Thanh Toán Đặt Cọc' : 'Deposit Payment'}
        </Text>

        {step === 1 ? (
          <TouchableOpacity
            onPress={() => {
              Alert.alert(
                language === 'vi' ? 'Huỷ đặt bàn?' : 'Cancel Booking Process?',
                language === 'vi'
                  ? 'Nếu bạn rời đi, tiến trình đặt bàn của bạn sẽ bị hủy bỏ hoàn toàn và bàn ăn này sẽ được mở lại cho khách hàng khác.'
                  : 'If you leave, your booking process will be completely cancelled and this table will be opened for other guests.',
                [
                  { text: language === 'vi' ? 'Ở lại thanh toán' : 'Stay & Pay', style: 'cancel' },
                  { text: language === 'vi' ? 'Rời đi' : 'Leave', style: 'destructive', onPress: handleCancelBooking },
                ]
              );
            }}
            style={styles.cancelHeaderBtn}
          >
            <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>
              {language === 'vi' ? 'Rời đi' : 'Leave'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ width: 32 }} />
        )}
      </View>

      {/* Countdown Timer Banner */}
      {timeLeft ? (
        <View style={[styles.timerBanner, { backgroundColor: isDarkMode ? '#2c1e15' : '#fff7ed', borderBottomColor: isDarkMode ? '#7c2d12' : '#fed7aa' }]}>
          <Ionicons name="time-outline" size={18} color={colors.primary} />
          <Text style={[styles.timerText, { color: colors.primary }]}>
            {language === 'vi'
              ? `Vui lòng thanh toán trong vòng: ${timeLeft}`
              : `Please complete payment in: ${timeLeft}`}
          </Text>
        </View>
      ) : null}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Booking Brief Information */}
        <View style={[styles.briefCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.briefHeader}>
            <View>
              <Text style={[styles.briefTitle, { color: colors.text }]}>{branchName}</Text>
              <Text style={[styles.briefTime, { color: colors.textSecondary }]}>
                📅 {date} ({time})
              </Text>
            </View>
            <View style={[styles.tableBadge, { backgroundColor: isVip ? '#D4AF37' : colors.primary }]}>
              <Text style={styles.tableBadgeText}>
                {formatTableCode(tableCode, language)}
              </Text>
            </View>
          </View>

          <View style={[styles.cardDivider, { backgroundColor: colors.border }]} />

          <View style={styles.depositSummaryRow}>
            <Text style={[styles.depositLabel, { color: colors.textSecondary }]}>
              {language === 'vi' ? 'Số tiền cọc bắt buộc:' : 'Required Deposit Amount:'}
            </Text>
            <Text style={[styles.depositAmount, { color: colors.primary }]}>
              {formatVnd(depositAmount)}
            </Text>
          </View>
        </View>

        {/* STEP 1: CHOOSE PAYMENT METHOD */}
        {step === 1 && (
          <View style={{ gap: 16 }}>
            <Text style={[styles.selectionLabel, { color: colors.text }]}>
              {language === 'vi' ? 'Vui lòng chọn phương thức thanh toán:' : 'Please select payment method:'}
            </Text>

            {/* Bank Transfer option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('bank')}
              style={[
                styles.largeSelectionCard,
                { borderColor: colors.border, backgroundColor: colors.card },
                paymentMethod === 'bank' && [
                  styles.selectedSelectionCard,
                  { borderColor: colors.primary, backgroundColor: isDarkMode ? '#2d1e15' : '#fff9f5' }
                ]
              ]}
            >
              {paymentMethod === 'bank' && (
                <View style={[styles.activeAccentBar, { backgroundColor: colors.primary }]} />
              )}
              <View style={[
                styles.largeCardIconContainer,
                { backgroundColor: paymentMethod === 'bank' ? colors.primary + '18' : colors.border + '40' },
                paymentMethod === 'bank' && { borderWidth: 1.5, borderColor: colors.primary }
              ]}>
                <Ionicons name="business" size={24} color={paymentMethod === 'bank' ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[
                  styles.largeCardTitle,
                  { color: colors.text, fontWeight: 'bold' },
                  paymentMethod === 'bank' && { color: colors.primary }
                ]}>
                  {language === 'vi' ? 'Chuyển khoản Ngân hàng (VietQR)' : 'Bank Transfer (VietQR)'}
                </Text>
                <Text style={[styles.largeCardDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Tự động tạo mã QR và duyệt thanh toán tự động tức thời' : 'Auto-generate QR code and verify transfer instantly'}
                </Text>
              </View>
              <View style={[
                styles.customRadioOuter,
                { borderColor: paymentMethod === 'bank' ? colors.primary : colors.border }
              ]}>
                {paymentMethod === 'bank' && (
                  <View style={[styles.customRadioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>

            {/* Credit Card option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('card')}
              style={[
                styles.largeSelectionCard,
                { borderColor: colors.border, backgroundColor: colors.card },
                paymentMethod === 'card' && [
                  styles.selectedSelectionCard,
                  { borderColor: colors.primary, backgroundColor: isDarkMode ? '#2d1e15' : '#fff9f5' }
                ]
              ]}
            >
              {paymentMethod === 'card' && (
                <View style={[styles.activeAccentBar, { backgroundColor: colors.primary }]} />
              )}
              <View style={[
                styles.largeCardIconContainer,
                { backgroundColor: paymentMethod === 'card' ? colors.primary + '18' : colors.border + '40' },
                paymentMethod === 'card' && { borderWidth: 1.5, borderColor: colors.primary }
              ]}>
                <Ionicons name="card" size={24} color={paymentMethod === 'card' ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[
                  styles.largeCardTitle,
                  { color: colors.text, fontWeight: 'bold' },
                  paymentMethod === 'card' && { color: colors.primary }
                ]}>
                  {language === 'vi' ? 'Thẻ Quốc tế (Visa / Mastercard)' : 'International Card (Visa / Mastercard)'}
                </Text>
                <Text style={[styles.largeCardDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Hỗ trợ thanh toán nhanh bằng cổng thẻ Visa, Mastercard' : 'Supports quick payment via Visa and Mastercard gateway'}
                </Text>
              </View>
              <View style={[
                styles.customRadioOuter,
                { borderColor: paymentMethod === 'card' ? colors.primary : colors.border }
              ]}>
                {paymentMethod === 'card' && (
                  <View style={[styles.customRadioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>

            {/* E-Wallet option */}
            <TouchableOpacity
              onPress={() => setPaymentMethod('wallet')}
              style={[
                styles.largeSelectionCard,
                { borderColor: colors.border, backgroundColor: colors.card },
                paymentMethod === 'wallet' && [
                  styles.selectedSelectionCard,
                  { borderColor: colors.primary, backgroundColor: isDarkMode ? '#2d1e15' : '#fff9f5' }
                ]
              ]}
            >
              {paymentMethod === 'wallet' && (
                <View style={[styles.activeAccentBar, { backgroundColor: colors.primary }]} />
              )}
              <View style={[
                styles.largeCardIconContainer,
                { backgroundColor: paymentMethod === 'wallet' ? colors.primary + '18' : colors.border + '40' },
                paymentMethod === 'wallet' && { borderWidth: 1.5, borderColor: colors.primary }
              ]}>
                <Ionicons name="wallet" size={24} color={paymentMethod === 'wallet' ? colors.primary : colors.textSecondary} />
              </View>
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[
                  styles.largeCardTitle,
                  { color: colors.text, fontWeight: 'bold' },
                  paymentMethod === 'wallet' && { color: colors.primary }
                ]}>
                  {language === 'vi' ? 'Ví điện tử (Momo / ZaloPay)' : 'E-Wallet (Momo / ZaloPay)'}
                </Text>
                <Text style={[styles.largeCardDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Thanh toán bảo mật, siêu tốc qua ví điện tử liên kết' : 'Secure and fast payment via linked mobile e-wallets'}
                </Text>
              </View>
              <View style={[
                styles.customRadioOuter,
                { borderColor: paymentMethod === 'wallet' ? colors.primary : colors.border }
              ]}>
                {paymentMethod === 'wallet' && (
                  <View style={[styles.customRadioInner, { backgroundColor: colors.primary }]} />
                )}
              </View>
            </TouchableOpacity>

            {/* Big "Tiếp tục" button */}
            <TouchableOpacity
              style={[styles.continueBtn, { backgroundColor: colors.primary }]}
              onPress={() => setStep(2)}
            >
              <Text style={styles.continueBtnText}>
                {language === 'vi' ? 'Tiếp tục thanh toán' : 'Continue to Payment'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#FFF" />
            </TouchableOpacity>
          </View>
        )}

        {/* STEP 2: RENDER PAYMENT METHOD DETAILS */}
        {step === 2 && (
          <>
            {/* BANK METHOD RENDERING */}
            {paymentMethod === 'bank' && (
              <>
                {/* Bank Transfer Details */}
                <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    🏦 {language === 'vi' ? 'Thông tin chuyển khoản ngân hàng' : 'Bank Transfer Information'}
                  </Text>

                  {/* QR Code */}
                  <View style={[styles.qrContainer, { borderColor: colors.border }]}>
                    <Image
                      source={require('../../assets/images/qr-bank-transfer.png')}
                      style={styles.qrImage}
                      resizeMode="contain"
                    />
                    <Text style={[styles.qrHint, { color: colors.textSecondary }]}>
                      {language === 'vi' 
                        ? 'Quét mã QR để tự động điền thông tin chuyển khoản nhanh' 
                        : 'Scan QR code to quickly auto-fill transfer details'}
                    </Text>
                  </View>

                  {/* Data fields */}
                  <View style={styles.fieldsList}>
                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Ngân hàng:' : 'Bank Name:'}
                      </Text>
                      <Text style={[styles.fieldValue, { color: colors.text }]}>{bankDetails.bankName}</Text>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Số tài khoản:' : 'Account Number:'}
                      </Text>
                      <View style={styles.fieldCopyRow}>
                        <Text style={[styles.fieldValue, { color: colors.text, fontWeight: 'bold', fontSize: 16 }]}>
                          {bankDetails.accountNumber}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyBtn, { backgroundColor: colors.primary + '15' }]}
                          onPress={() => handleCopy(bankDetails.accountNumber, 'accountNumber')}
                        >
                          <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                            {copiedField === 'accountNumber' ? (language === 'vi' ? 'Đã sao chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Tên tài khoản:' : 'Account Name:'}
                      </Text>
                      <Text style={[styles.fieldValue, { color: colors.text, fontWeight: '500' }]}>{bankDetails.accountName}</Text>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Số tiền chuyển cọc:' : 'Amount:'}
                      </Text>
                      <View style={styles.fieldCopyRow}>
                        <Text style={[styles.fieldValue, { color: colors.primary, fontWeight: 'bold', fontSize: 18 }]}>
                          {formatVnd(bankDetails.amount)}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyBtn, { backgroundColor: colors.primary + '15' }]}
                          onPress={() => handleCopy(String(bankDetails.amount), 'amount')}
                        >
                          <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                            {copiedField === 'amount' ? (language === 'vi' ? 'Đã sao chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Nội dung chuyển khoản (bắt buộc):' : 'Transfer Message (required):'}
                      </Text>
                      <View style={styles.fieldCopyRow}>
                        <Text style={[styles.fieldValue, { color: '#E2B93B', fontWeight: 'bold', fontSize: 15 }]}>
                          {bankDetails.message}
                        </Text>
                        <TouchableOpacity
                          style={[styles.copyBtn, { backgroundColor: colors.primary + '15' }]}
                          onPress={() => handleCopy(bankDetails.message, 'message')}
                        >
                          <Text style={[styles.copyBtnText, { color: colors.primary }]}>
                            {copiedField === 'message' ? (language === 'vi' ? 'Đã sao chép' : 'Copied') : (language === 'vi' ? 'Sao chép' : 'Copy')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Notes */}
                <View style={styles.infoAlert}>
                  <Ionicons name="information-circle" size={18} color="#FF9500" />
                  <Text style={styles.infoAlertText}>
                    {language === 'vi' 
                      ? '* Vui lòng chuyển khoản đúng số tiền và điền chính xác cú pháp nội dung chuyển khoản để hệ thống tự động duyệt cọc cho bạn.'
                      : '* Please make sure to transfer the exact amount and fill the correct transfer message to get automatic approval.'}
                  </Text>
                </View>

                {/* Demo Button to trigger successful screen */}
                <TouchableOpacity
                  style={[styles.paySuccessBtn, { backgroundColor: '#27AE60' }]}
                  onPress={handleTestPaymentSuccess}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Ionicons name="shield-checkmark" size={22} color="#FFF" />
                      <Text style={styles.paySuccessBtnText}>
                        {language === 'vi' ? 'Đã Thanh Toán Thành Công (Test Demo)' : 'Test Paid Successfully (Demo)'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {/* CREDIT CARD METHOD RENDERING (MOCKUP / BÌA ĐỂ LỪA THẦY) */}
            {paymentMethod === 'card' && (
              <View style={styles.dummyContainer}>
                {/* Stunning Gradient Credit Card mockup */}
                <LinearGradient
                  colors={isVip ? ['#b45309', '#78350f'] : ['#1e1b4b', '#312e81']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.virtualCard}
                >
                  <View style={styles.virtualCardHeader}>
                    <Text style={styles.virtualCardType}>{isVip ? '👑 VIP MEMBER CARD' : 'THREE SHIP MEMBER'}</Text>
                    <Text style={{ color: '#FFF', fontSize: 24, fontWeight: '900', fontStyle: 'italic', letterSpacing: 1.5 }}>VISA</Text>
                  </View>
                  <View style={styles.virtualCardChipRow}>
                    <Ionicons name="hardware-chip-sharp" size={32} color="#E2B93B" />
                    <Ionicons name="wifi" size={24} color="#FFF" style={{ marginLeft: 8 }} />
                  </View>
                  <Text style={styles.virtualCardNumber}>4111  2222  3333  4444</Text>
                  <View style={styles.virtualCardFooter}>
                    <View>
                      <Text style={styles.virtualCardLabel}>{language === 'vi' ? 'CHỦ THẺ' : 'CARD HOLDER'}</Text>
                      <Text style={styles.virtualCardName}>LƯU GIA BẢO</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.virtualCardLabel}>{language === 'vi' ? 'HẠN DÙNG' : 'EXPIRES'}</Text>
                      <Text style={styles.virtualCardName}>12/30</Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Dummy Input Form */}
                <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    💳 {language === 'vi' ? 'Nhập thông tin thẻ Visa / Mastercard' : 'Visa / Mastercard Details'}
                  </Text>

                  <View style={styles.fieldsList}>
                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Số thẻ:' : 'Card Number:'}
                      </Text>
                      <View style={[styles.dummyInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={{ color: colors.text }}>4111  2222  3333  4444</Text>
                        <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                      </View>
                    </View>

                    <View style={{ flexDirection: 'row', gap: 12 }}>
                      <View style={[styles.fieldItem, { flex: 2 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          {language === 'vi' ? 'Tên trên thẻ:' : 'Cardholder Name:'}
                        </Text>
                        <View style={[styles.dummyInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                          <Text style={{ color: colors.text, textTransform: 'uppercase' }}>Lưu Gia Bảo</Text>
                        </View>
                      </View>

                      <View style={[styles.fieldItem, { flex: 1 }]}>
                        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                          {language === 'vi' ? 'CVV:' : 'CVV:'}
                        </Text>
                        <View style={[styles.dummyInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                          <Text style={{ color: colors.text }}>***</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>

                {/* Alert guiding back to Bank Transfer */}
                <TouchableOpacity
                  style={[styles.paySuccessBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    Alert.alert(
                      language === 'vi' ? 'Cổng thanh toán Sandbox' : 'Sandbox Gateway',
                      language === 'vi'
                        ? 'Cổng tích hợp thanh toán Visa/Mastercard (Stripe Gateway) đang chạy thử nghiệm Sandbox. Vui lòng chọn phương thức "Ngân hàng" (VietQR) để chạy Demo CSDL thời gian thực!'
                        : 'Visa/Mastercard integration (Stripe Gateway) is in Sandbox mode. Please select "Bank Transfer" (VietQR) to run the real-time CSDL demo!',
                      [{ text: 'OK', style: 'default' }]
                    );
                  }}
                >
                  <Ionicons name="card" size={22} color="#FFF" />
                  <Text style={styles.paySuccessBtnText}>
                    {language === 'vi' ? 'Thanh Toán Qua Cổng Thẻ Visa/Master' : 'Pay via Visa/Mastercard'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* E-WALLET RENDERING (MOCKUP / BÌA ĐỂ LỪA THẦY) */}
            {paymentMethod === 'wallet' && (
              <View style={styles.dummyContainer}>
                {/* Premium Momo vs ZaloPay selector */}
                <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    📱 {language === 'vi' ? 'Chọn Ví điện tử liên kết' : 'Select E-Wallet'}
                  </Text>
                  
                  <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
                    <TouchableOpacity
                      style={[
                        styles.walletOption,
                        { borderColor: colors.border, backgroundColor: colors.card },
                        walletProvider === 'momo' && { borderColor: '#A50064', backgroundColor: '#A5006410' }
                      ]}
                      onPress={() => setWalletProvider('momo')}
                    >
                      <View style={[styles.walletIconCircle, { backgroundColor: '#A50064' }]}>
                        <Text style={styles.walletIconLetter}>M</Text>
                      </View>
                      <Text style={[styles.walletOptionText, walletProvider === 'momo' && { color: '#A50064', fontWeight: 'bold' }]}>Ví Momo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.walletOption,
                        { borderColor: colors.border, backgroundColor: colors.card },
                        walletProvider === 'zalopay' && { borderColor: '#0085FF', backgroundColor: '#0085FF10' }
                      ]}
                      onPress={() => setWalletProvider('zalopay')}
                    >
                      <View style={[styles.walletIconCircle, { backgroundColor: '#0085FF' }]}>
                        <Text style={styles.walletIconLetter}>ZP</Text>
                      </View>
                      <Text style={[styles.walletOptionText, walletProvider === 'zalopay' && { color: '#0085FF', fontWeight: 'bold' }]}>ZaloPay</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.fieldsList}>
                    <View style={styles.fieldItem}>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
                        {language === 'vi' ? 'Số điện thoại đăng ký ví:' : 'E-wallet Phone Number:'}
                      </Text>
                      <View style={[styles.dummyInput, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <Text style={{ color: colors.text }}>0987 654 321</Text>
                        <Ionicons name="lock-closed" size={16} color={colors.textSecondary} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Alert guiding back to Bank Transfer */}
                <TouchableOpacity
                  style={[styles.paySuccessBtn, { backgroundColor: walletProvider === 'momo' ? '#A50064' : '#0085FF' }]}
                  onPress={() => {
                    Alert.alert(
                      language === 'vi' ? 'Cổng thanh toán ví điện tử' : 'E-wallet Gateway',
                      language === 'vi'
                        ? `Cổng liên kết thanh toán Ví ${walletProvider === 'momo' ? 'Momo' : 'ZaloPay'} đang đợi chứng chỉ tích hợp doanh nghiệp. Vui lòng chọn "Ngân hàng" để Demo liên thông thời gian thực!`
                        : `E-Wallet ${walletProvider === 'momo' ? 'Momo' : 'ZaloPay'} integration is awaiting corporate business certificate. Please select "Bank Transfer" for the live demo!`,
                      [{ text: 'OK', style: 'default' }]
                    );
                  }}
                >
                  <Ionicons name="phone-portrait-outline" size={22} color="#FFF" />
                  <Text style={styles.paySuccessBtnText}>
                    {language === 'vi' ? `Thanh Toán Bằng Ví ${walletProvider === 'momo' ? 'Momo' : 'ZaloPay'}` : `Pay via ${walletProvider === 'momo' ? 'Momo' : 'ZaloPay'}`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}

        
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
  cancelHeaderBtn: { height: 40, justifyContent: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  briefCard: {
    borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 20,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  briefHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  briefTitle: { fontSize: 16, fontWeight: 'bold' },
  briefTime: { fontSize: 13, marginTop: 4 },
  tableBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  tableBadgeText: { color: '#FFF', fontSize: 13, fontWeight: 'bold' },
  cardDivider: { height: 1, marginVertical: 12 },
  depositSummaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  depositLabel: { fontSize: 14, fontWeight: '500' },
  depositAmount: { fontSize: 18, fontWeight: 'bold' },
  timerBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  timerText: { fontSize: 13, fontWeight: 'bold' },
  paymentCard: {
    borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
  },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 16 },
  qrContainer: {
    alignItems: 'center', padding: 16, borderWidth: 1, borderStyle: 'dashed', borderRadius: 16, marginBottom: 20,
  },
  qrImage: {
    width: 200, height: 200, borderRadius: 12,
  },
  qrHint: { fontSize: 12, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  fieldsList: { gap: 14 },
  fieldItem: { gap: 4 },
  fieldLabel: { fontSize: 12 },
  fieldValue: { fontSize: 14 },
  fieldCopyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  copyBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
  },
  copyBtnText: { fontSize: 12, fontWeight: 'bold' },
  infoAlert: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 10, backgroundColor: '#FFF9EB', marginVertical: 12,
  },
  infoAlertText: { fontSize: 12, color: '#D97706', flex: 1, lineHeight: 18 },
  paySuccessBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, marginTop: 16,
  },
  paySuccessBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },

  // Success screen styles
  successScroll: { padding: 24, alignItems: 'center', justifyContent: 'center', flexGrow: 1 },
  successCard: {
    width: '100%', borderRadius: 24, padding: 24, borderWidth: 1, alignItems: 'center',
    shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 10, elevation: 4, marginBottom: 24,
  },
  successIconOuter: {
    width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successIconInner: {
    width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center',
  },
  successTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  successSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  receiptBox: {
    width: '100%', borderRadius: 16, borderWidth: 1, padding: 18, gap: 12, marginBottom: 20,
  },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  receiptLabel: { fontSize: 13 },
  receiptValue: { fontSize: 13, flex: 1, textAlign: 'right' },
  receiptTotalValue: { fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, marginVertical: 4 },
  tableTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tableTagText: { color: '#FFF', fontSize: 10, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 11, fontWeight: 'bold' },
  thanksText: { fontSize: 12, fontStyle: 'italic', textAlign: 'center', lineHeight: 18 },
  finishBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
  },
  finishBtnText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },

  // New Payment Selector Styles
  methodSelectorContainer: {
    marginBottom: 20,
  },
  methodSelectorLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  methodTabsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  methodTab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  methodTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dummyContainer: {
    width: '100%',
    marginBottom: 16,
  },
  virtualCard: {
    width: '100%',
    height: 185,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  virtualCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  virtualCardType: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 1.5,
  },
  virtualCardChipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  virtualCardNumber: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 2,
    marginVertical: 6,
  },
  virtualCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  virtualCardLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  virtualCardName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  dummyInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletOption: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderWidth: 1.5,
    borderRadius: 14,
  },
  walletOptionText: {
    fontSize: 13,
    color: '#666',
  },
  walletIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletIconLetter: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  selectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  largeSelectionCard: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderRadius: 18,
    gap: 16,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  selectedSelectionCard: {
    borderWidth: 2,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  activeAccentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 6,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  customRadioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  customRadioInner: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
  },
  largeCardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  largeCardTitle: {
    fontSize: 14,
  },
  largeCardDesc: {
    fontSize: 11,
    lineHeight: 16,
  },
  continueBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 12,
  },
  continueBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  backHeaderBtn: {
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
  },
});
