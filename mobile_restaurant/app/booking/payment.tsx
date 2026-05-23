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
              onPress: () => {
                clearBooking();
                clearCart();
                // Delay navigation so React state from clearBooking propagates
                // before the booking tab's useFocusEffect reads bookingStepRoute
                setTimeout(() => router.replace('/(tabs)/booking'), 150);
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

  const handleTestPaymentSuccess = () => {
    setIsProcessing(true);
    // Simulate transaction processing/verification micro-animation
    setTimeout(() => {
      setIsProcessing(false);
      setIsPaid(true);
      // Clear booking session and cart only AFTER successful payment
      clearBooking();
      clearCart();
    }, 1500);
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
      Alert.alert(
        language === 'vi' ? 'Huỷ thanh toán?' : 'Cancel Payment?',
        language === 'vi'
          ? 'Lịch đặt bàn của bạn đã được ghi nhận, tuy nhiên bạn cần thanh toán cọc sớm để tránh bị tự động hủy lịch.'
          : 'Your table reservation has been saved, but you should pay deposit soon to prevent auto-cancellation.',
        [
          { text: language === 'vi' ? 'Ở lại thanh toán' : 'Stay & Pay', style: 'cancel' },
          { text: language === 'vi' ? 'Rời đi' : 'Leave', style: 'destructive', onPress: () => { clearBooking(); clearCart(); setTimeout(() => router.replace('/(tabs)/booking'), 150); } },
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [isPaid, language]);

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
        <Text style={[styles.headerTitle, { color: colors.text, marginLeft: 0 }]}>
          {language === 'vi' ? 'Thanh Toán Đặt Cọc' : 'Deposit Payment'}
        </Text>
        <TouchableOpacity
          onPress={() => {
            Alert.alert(
              language === 'vi' ? 'Huỷ thanh toán?' : 'Cancel Payment?',
              language === 'vi'
                ? 'Lịch đặt bàn của bạn đã được ghi nhận, tuy nhiên bạn cần thanh toán cọc sớm để tránh bị tự động hủy lịch.'
                : 'Your table reservation has been saved, but you should pay deposit soon to prevent auto-cancellation.',
              [
                { text: language === 'vi' ? 'Ở lại thanh toán' : 'Stay & Pay', style: 'cancel' },
                { text: language === 'vi' ? 'Rời đi' : 'Leave', style: 'destructive', onPress: () => { clearBooking(); clearCart(); setTimeout(() => router.replace('/(tabs)/booking'), 150); } },
              ]
            );
          }}
          style={styles.cancelHeaderBtn}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>
            {language === 'vi' ? 'Rời đi' : 'Leave'}
          </Text>
        </TouchableOpacity>
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
});
