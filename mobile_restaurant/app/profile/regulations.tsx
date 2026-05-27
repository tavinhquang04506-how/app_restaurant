import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

export default function RegulationsScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { language } = useLanguageStore();

  const rules = [
    {
      icon: 'calendar-outline',
      titleVi: '1. Quy định đặt bàn',
      titleEn: '1. Booking Regulations',
      detailsVi: [
        'Vui lòng đặt bàn trước giờ hẹn ít nhất 1 giờ để nhà hàng có thể chuẩn bị đón tiếp quý khách một cách chu đáo nhất.',
        'Nhà hàng hỗ trợ giữ bàn tối đa 15 phút so với giờ hẹn. Sau 15 phút trễ, nhà hàng xin phép hủy ưu tiên giữ bàn và mở bàn đặt cho các khách hàng khác.',
        'Mức phí đặt cọc để giữ chỗ đối với bàn thường là 200.000đ và đối với bàn VIP là 300.000đ.',
      ],
      detailsEn: [
        'Please reserve your table at least 1 hour in advance so we can prepare the best welcoming experience for you.',
        'We hold your table for up to 15 minutes past reservation time. After 15 minutes, the hold will be released and offered to other guests.',
        'The deposit to hold a standard table is 200,000 VND, and 300,000 VND for a VIP table.',
      ]
    },
    {
      icon: 'cash-outline',
      titleVi: '2. Chính sách hủy bàn & Hoàn cọc',
      titleEn: '2. Cancellation & Refund Policy',
      highlight: true,
      detailsVi: [
        'Nếu quý khách hủy đặt bàn trước giờ hẹn từ 2 tiếng trở lên: Nhà hàng sẽ hoàn trả lại toàn bộ 100% tiền đặt cọc vào tài khoản của quý khách.',
        'Nếu quý khách hủy đặt bàn sát giờ dưới 2 tiếng: Số tiền đặt cọc sẽ không được hoàn trả (phạt hủy sát giờ 100% tiền cọc).',
        'Nếu quý khách không đến nhận bàn và không báo hủy trước: Số tiền đặt cọc sẽ không được hoàn trả để bù đắp chi phí chuẩn bị và giữ bàn trống của nhà hàng.',
      ],
      detailsEn: [
        'If you cancel your reservation 2 hours or more before scheduled time: You will receive a full 100% deposit refund back to your account.',
        'If you cancel your reservation less than 2 hours before scheduled time: The deposit will not be refunded (100% late cancellation penalty).',
        'If you fail to arrive and do not cancel: The deposit will not be refunded to cover our preparation and table reservation costs.',
      ]
    },
    {
      icon: 'qr-code-outline',
      titleVi: '3. Quy định nhận bàn & Check-in',
      titleEn: '3. Arrival & Check-in Rules',
      detailsVi: [
        'Khi đến nhà hàng, quý khách vui lòng xuất trình mã Check-in dạng mã QR hoặc chuỗi ký tự trên ứng dụng cho nhân viên lễ tân.',
        'Nhân viên lễ tân sẽ xác nhận thông tin check-in và trực tiếp dẫn quý khách vào vị trí bàn ăn đã chuẩn bị sẵn.',
        'Nếu quý khách đã gọi trước các món ăn khi đặt bàn, nhà hàng sẽ ưu tiên chế biến và phục vụ các món ăn nóng hổi ngay khi quý khách nhận bàn thành công.',
      ],
      detailsEn: [
        'Upon arrival, please present your Check-in QR code or alphanumeric code in the app to our receptionist.',
        'Our receptionist will verify your check-in details and personally guide you to your reserved table.',
        'If you have pre-ordered dishes, our kitchen will prioritize and serve them hot and fresh right after you complete check-in.',
      ]
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {language === 'vi' ? 'Quy định & Chính sách' : 'Rules & Policies'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro */}
        <View style={[styles.introBox, { backgroundColor: isDarkMode ? '#2c1e15' : '#fff7ed', borderColor: isDarkMode ? '#7c2d12' : '#fed7aa' }]}>
          <Ionicons name="shield-checkmark" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.introTitle, { color: colors.primary }]}>
              {language === 'vi' ? 'Đảm bảo quyền lợi khách hàng' : 'Customer Rights Guaranteed'}
            </Text>
            <Text style={[styles.introDesc, { color: colors.textSecondary }]}>
              {language === 'vi' 
                ? 'Để tối ưu hóa chất lượng phục vụ và đảm bảo tính công bằng về sơ đồ bàn trống, ThreeShip Restaurant áp dụng các quy định sử dụng dịch vụ dưới đây.'
                : 'To optimize service quality and ensure fair table allocation, ThreeShip Restaurant applies the following service regulations.'}
            </Text>
          </View>
        </View>

        {/* Rule Blocks */}
        {rules.map((rule, index) => (
          <View 
            key={index} 
            style={[
              styles.ruleCard, 
              { backgroundColor: colors.card, borderColor: colors.border },
              rule.highlight && { 
                borderColor: colors.primary, 
                borderWidth: 1.5,
                shadowColor: colors.primary,
                shadowOpacity: 0.05,
                shadowRadius: 10,
                elevation: 3,
              }
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={[styles.iconBox, { backgroundColor: rule.highlight ? colors.primary + '15' : colors.border + '30' }]}>
                <Ionicons name={rule.icon as any} size={22} color={rule.highlight ? colors.primary : colors.textSecondary} />
              </View>
              <Text style={[styles.cardTitle, { color: colors.text }]}>
                {language === 'vi' ? rule.titleVi : rule.titleEn}
              </Text>
            </View>

            <View style={styles.detailsList}>
              {(language === 'vi' ? rule.detailsVi : rule.detailsEn).map((detail, dIdx) => (
                <View key={dIdx} style={styles.detailItem}>
                  <View style={[styles.bullet, { backgroundColor: rule.highlight ? colors.primary : colors.textSecondary }]} />
                  <Text style={[styles.detailText, { color: colors.text }]}>{detail}</Text>
                </View>
              ))}
            </View>
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : 12,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20 },
  introBox: {
    flexDirection: 'row', gap: 14, padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 20,
  },
  introTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  introDesc: { fontSize: 12, lineHeight: 18 },
  ruleCard: {
    borderRadius: 18, padding: 18, borderWidth: 1, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 6, elevation: 1,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  cardTitle: { fontSize: 15, fontWeight: 'bold', flex: 1 },
  detailsList: { gap: 12 },
  detailItem: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  bullet: { width: 6, height: 6, borderRadius: 3, marginTop: 7 },
  detailText: { fontSize: 13, flex: 1, lineHeight: 18 },
});
