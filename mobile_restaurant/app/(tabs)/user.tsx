import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Alert, Image, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';

export default function UserScreen() {
  const router = useRouter();
  const { user, isLoggedIn, refreshToken, signOut } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const handleLogout = () => {
    Alert.alert(
      language === 'vi' ? 'Đăng xuất' : 'Log Out',
      language === 'vi' ? 'Bạn có chắc muốn đăng xuất khỏi tài khoản?' : 'Are you sure you want to log out of your account?',
      [
        { text: language === 'vi' ? 'Không' : 'Cancel', style: 'cancel' },
        { text: language === 'vi' ? 'Đăng xuất' : 'Log Out', style: 'destructive', onPress: async () => {
          try {
            if (refreshToken) await Api.logout(refreshToken);
          } catch {} finally {
            await signOut();
            router.replace('/');
          }
        }},
      ]
    );
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={90} color={colors.textSecondary} />
          <Text style={[styles.loginPrompt, { color: colors.text }]}>
            {language === 'vi' ? 'Đăng nhập để quản lý tài khoản' : 'Log In to Manage Account'}
          </Text>
          <Text style={[styles.loginSubPrompt, { color: colors.textSecondary }]}>
            {language === 'vi' 
              ? 'Xem lịch sử bàn đặt và nhận nhiều ưu đãi đặc quyền!'
              : 'View table reservation history and receive exclusive offers!'}
          </Text>
          <TouchableOpacity style={[styles.loginBtn, { backgroundColor: colors.primary }]} onPress={() => router.push('/(auth)/login')}>
            <Text style={styles.loginBtnText}>{language === 'vi' ? 'Đăng nhập ngay' : 'Log In Now'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sections = [
    {
      title: language === 'vi' ? 'Tài khoản & Cá nhân' : 'Account & Personal',
      items: [
        { icon: 'person-outline' as const, title: t('personalInfo'), onPress: () => router.push('/profile/edit') },
      ]
    },
    {
      title: language === 'vi' ? 'Trải nghiệm ẩm thực' : 'Culinary Experience',
      items: [
        { icon: 'calendar-outline' as const, title: t('bookingHistory'), onPress: () => router.push('/profile/booking-history') },
        { icon: 'pricetag-outline' as const, title: t('savedPromotions'), onPress: () => router.push('/profile/saved-promos') },
        { icon: 'star-outline' as const, title: t('myReviews'), onPress: () => router.push('/profile/reviews') },
      ]
    },
    {
      title: language === 'vi' ? 'Hỗ trợ & Thiết lập' : 'Support & Settings',
      items: [
        { icon: 'notifications-outline' as const, title: t('notifications'), onPress: () => router.push('/profile/notifications') },
        { icon: 'chatbubble-outline' as const, title: t('liveHelp'), onPress: () => router.push('/profile/chat') },
        { icon: 'call-outline' as const, title: language === 'vi' ? 'Liên hệ nhà hàng' : 'Contact Restaurant', onPress: () => router.push('/profile/contact') },
        { icon: 'document-text-outline' as const, title: language === 'vi' ? 'Quy định & Chính sách' : 'Rules & Policies', onPress: () => router.push('/profile/regulations') },
        { icon: 'settings-outline' as const, title: t('settings'), onPress: () => router.push('/profile/settings') },
      ]
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={[styles.profileHeader, { backgroundColor: isDarkMode ? colors.card : colors.primary }]}>
          <View style={styles.avatarContainer}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={[styles.avatar, { borderColor: colors.border }]} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Ionicons name="person" size={40} color={colors.primary} />
              </View>
            )}
          </View>
          <Text style={styles.userName}>{user?.name ?? (language === 'vi' ? 'Khách hàng 3Ship' : '3Ship Guest')}</Text>
          <Text style={[styles.userEmail, { color: isDarkMode ? colors.textSecondary : 'rgba(255,255,255,0.8)' }]}>{user?.email ?? ''}</Text>
        </View>

        {/* Menu Sections */}
        <View style={styles.menuContent}>
          {sections.map((section, secIdx) => (
            <View key={secIdx} style={styles.sectionContainer}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{section.title}</Text>
              <View style={[styles.menuSection, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {section.items.map((item, idx) => (
                  <View key={idx}>
                    <TouchableOpacity style={styles.menuItem} onPress={item.onPress}>
                      <View style={styles.menuLeft}>
                        <Ionicons name={item.icon} size={22} color={colors.primary} />
                        <Text style={[styles.menuText, { color: colors.text }]}>{item.title}</Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                    </TouchableOpacity>
                    {idx < section.items.length - 1 && (
                      <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    )}
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={[styles.logoutBtn, { borderColor: colors.primary }]} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color={colors.primary} />
          <Text style={[styles.logoutText, { color: colors.primary }]}>{language === 'vi' ? 'Đăng xuất tài khoản' : 'Log Out Account'}</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100, paddingHorizontal: 32 },
  loginPrompt: { fontSize: 18, fontWeight: 'bold', marginTop: 16, textAlign: 'center' },
  loginSubPrompt: { fontSize: 13, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  loginBtn: { marginTop: 24, paddingHorizontal: 36, paddingVertical: 14, borderRadius: 12 },
  loginBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  profileHeader: { alignItems: 'center', paddingVertical: 36, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  avatarContainer: { marginBottom: 12 },
  avatar: { width: 88, height: 88, borderRadius: 44, borderWidth: 3 },
  avatarPlaceholder: {
    width: 88, height: 88, borderRadius: 44,
    justifyContent: 'center', alignItems: 'center', borderWidth: 3,
  },
  userName: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  userEmail: { fontSize: 14, marginTop: 4 },
  menuContent: { marginTop: 16, paddingHorizontal: 16 },
  sectionContainer: { marginBottom: 18 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4, letterSpacing: 0.5 },
  menuSection: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  menuItem: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 16,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuText: { fontSize: 15, fontWeight: '500' },
  divider: { height: 1, marginHorizontal: 16 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, marginTop: 8, padding: 16, borderRadius: 16,
    borderWidth: 1.5,
  },
  logoutText: { fontSize: 15, fontWeight: 'bold' },
});
