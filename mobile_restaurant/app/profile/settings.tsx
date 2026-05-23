import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Switch, Alert, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, isDarkMode, toggleDarkMode } = useThemeStore();
  const { language, setLanguage, t } = useLanguageStore();

  // Mock states for other settings
  const [receiveNotifications, setReceiveNotifications] = useState(true);
  const [promoAlerts, setPromoAlerts] = useState(true);

  const handleLanguageChange = () => {
    const nextLang = language === 'vi' ? 'en' : 'vi';
    setLanguage(nextLang);
    if (Platform.OS === 'web') {
      window.alert(nextLang === 'vi' ? 'Đã đổi ngôn ngữ sang: Tiếng Việt' : 'Language changed to: English');
    } else {
      Alert.alert(
        nextLang === 'vi' ? 'Ngôn ngữ' : 'Language',
        nextLang === 'vi' ? 'Đã chuyển đổi thành công sang Tiếng Việt' : 'Successfully switched to English'
      );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('settings')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Theme settings */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{language === 'vi' ? 'Giao diện & Trải nghiệm' : 'Appearance & Themes'}</Text>
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#fdebeb' }]}>
                <Ionicons name="moon-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingName, { color: colors.text }]}>{t('darkMode')}</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Chuyển sang giao diện nền tối sang trọng' : 'Switch to premium dark interface'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={isDarkMode ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Notifications Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>{language === 'vi' ? 'Thông báo' : 'Notifications'}</Text>
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#fdebeb' }]}>
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingName, { color: colors.text }]}>{t('pushNotifications')}</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Thông báo về trạng thái bàn đặt, tin nhắn hỗ trợ' : 'Alerts for table status, support chats'}
                </Text>
              </View>
            </View>
            <Switch
              value={receiveNotifications}
              onValueChange={setReceiveNotifications}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={receiveNotifications ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#fdebeb' }]}>
                <Ionicons name="gift-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingName, { color: colors.text }]}>{language === 'vi' ? 'Thông báo ưu đãi' : 'Deals & Events'}</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Cập nhật các chương trình khuyến mãi hot nhất' : 'Keep up with the hottest deals and events'}
                </Text>
              </View>
            </View>
            <Switch
              value={promoAlerts}
              onValueChange={setPromoAlerts}
              trackColor={{ false: '#767577', true: colors.primary }}
              thumbColor={promoAlerts ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Language & Local Settings */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>{language === 'vi' ? 'Ngôn ngữ' : 'Language'}</Text>
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <TouchableOpacity style={styles.settingRow} onPress={handleLanguageChange}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#fdebeb' }]}>
                <Ionicons name="globe-outline" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.settingName, { color: colors.text }]}>{t('changeLanguage')}</Text>
                <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Tiếng Việt (Vietnamese)' : 'English (English)'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* About App */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>{language === 'vi' ? 'Thông tin phiên bản' : 'About Application'}</Text>
        <View style={[styles.settingCard, { backgroundColor: colors.card, borderColor: colors.border, alignItems: 'center', paddingVertical: 20 }]}>
          <Text style={[styles.appName, { color: colors.primary }]}>3Ship Restaurant App</Text>
          <Text style={[styles.appVersion, { color: colors.textSecondary }]}>{language === 'vi' ? 'Phiên bản hiện tại: v2.0.0' : 'Current version: v2.0.0'}</Text>
          <Text style={[styles.appCopyright, { color: colors.textSecondary, marginTop: 8 }]}>
            © 2026 3Ship Corp. All Rights Reserved.
          </Text>
        </View>

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
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 'bold', marginBottom: 10, paddingLeft: 4 },
  settingCard: {
    borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 8,
    shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 5, elevation: 1,
  },
  settingRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 12,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 38, height: 38, borderRadius: 19,
    justifyContent: 'center', alignItems: 'center',
  },
  settingName: { fontSize: 15, fontWeight: 'bold' },
  settingDesc: { fontSize: 12, marginTop: 2 },
  divider: { height: 1, marginVertical: 4 },
  appName: { fontSize: 16, fontWeight: 'bold' },
  appVersion: { fontSize: 13, marginTop: 4 },
  appCopyright: { fontSize: 11 },
});
