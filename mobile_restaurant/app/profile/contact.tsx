import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Linking, Modal, Image, Alert, ActivityIndicator, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';
import type { BranchModel } from '../../models/BranchModels';

export default function ContactScreen() {
  const router = useRouter();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [branches, setBranches] = useState<BranchModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranchDetail, setSelectedBranchDetail] = useState<BranchModel | null>(null);

  useEffect(() => {
    Api.getBranches()
      .then((res) => {
        if (res && res.data) {
          setBranches(res.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const CONTACT_INFO = [
    { icon: 'call-outline' as const, label: 'Hotline', value: '1900 1234', action: 'tel:19001234' },
    { icon: 'mail-outline' as const, label: 'Email', value: 'support@3ship.vn', action: 'mailto:support@3ship.vn' },
    { icon: 'globe-outline' as const, label: 'Website', value: 'www.3ship.vn', action: 'https://www.3ship.vn' },
    { icon: 'time-outline' as const, label: language === 'vi' ? 'Giờ hoạt động' : 'Opening Hours', value: language === 'vi' ? '09:00 - 23:00 hàng ngày' : '09:00 AM - 11:00 PM Daily', action: '' },
  ];

  const handlePress = (action: string) => {
    if (action) Linking.openURL(action).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {language === 'vi' ? 'Liên hệ' : 'Contact'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Logo & Brand */}
        <View style={styles.brandSection}>
          <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
            <Ionicons name="restaurant" size={40} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.text }]}>Nhà hàng 3Ship</Text>
          <Text style={[styles.brandSlogan, { color: colors.textSecondary }]}>
            {language === 'vi' ? 'Ẩm thực tinh tế - Trải nghiệm hoàn hảo' : 'Fine Dining - Perfect Experience'}
          </Text>
        </View>

        {/* Contact Info */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {language === 'vi' ? 'Thông tin liên hệ' : 'Contact Info'}
        </Text>
        {CONTACT_INFO.map((item, idx) => (
          <TouchableOpacity
            key={idx}
            style={[styles.contactCard, { backgroundColor: colors.card }]}
            onPress={() => handlePress(item.action)}
            disabled={!item.action}
          >
            <View style={[styles.iconBox, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FCE8E6' }]}>
              <Ionicons name={item.icon} size={22} color={colors.primary} />
            </View>
            <View style={styles.contactInfo}>
              <Text style={[styles.contactLabel, { color: colors.textSecondary }]}>{item.label}</Text>
              <Text style={[styles.contactValue, { color: colors.text }]}>{item.value}</Text>
            </View>
            {item.action ? (
              <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
            ) : null}
          </TouchableOpacity>
        ))}

        {/* Branches */}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('branches')}
        </Text>

        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
        ) : (
          branches.map((branch) => (
            <TouchableOpacity
              key={branch.id}
              style={[styles.branchCard, { backgroundColor: colors.card }]}
              onPress={() => setSelectedBranchDetail(branch)}
              activeOpacity={0.85}
            >
              <Ionicons name="storefront" size={24} color={colors.primary} />
              <View style={styles.branchInfo}>
                <Text style={[styles.branchName, { color: colors.text }]}>
                  {translateDbText(branch.name)}
                </Text>
                <Text style={[styles.branchAddress, { color: colors.textSecondary }]}>
                  {translateDbText(branch.address)}
                </Text>
                <Text style={[styles.branchPhone, { color: colors.primary }]}>{branch.phone}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          ))
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Branch Detail Modal */}
      {selectedBranchDetail && (
        <Modal
          visible={!!selectedBranchDetail}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedBranchDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              {/* Header with back/close button */}
              <View style={[styles.modalHeader, { borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{t('branchDetail')}</Text>
                <TouchableOpacity onPress={() => setSelectedBranchDetail(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Branch Image or Placeholder */}
                {selectedBranchDetail.displayImageUrl ? (
                  <Image source={{ uri: selectedBranchDetail.displayImageUrl }} style={styles.branchDetailImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.branchDetailPlaceholder, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3E7E4' }]}>
                    <Ionicons name="storefront-outline" size={64} color={colors.primary} />
                  </View>
                )}

                {/* Info Container */}
                <View style={styles.modalInfoContainer}>
                  <Text style={[styles.branchDetailName, { color: colors.text }]}>
                    {translateDbText(selectedBranchDetail.name)}
                  </Text>
                  
                  {/* Status badge: Opening hours */}
                  <View style={styles.branchDetailBadges}>
                    <View style={[styles.branchDetailBadge, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF3E0' }]}>
                      <Ionicons name="time" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.branchDetailBadgeText, { color: colors.primary }]}>
                        {selectedBranchDetail.openTime && selectedBranchDetail.closeTime
                          ? `${selectedBranchDetail.openTime} - ${selectedBranchDetail.closeTime}`
                          : (language === 'vi' ? 'Liên hệ' : 'Contact')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Intro/Description */}
                  <Text style={[styles.modalSectionLabel, { color: colors.text }]}>{t('branchIntro')}</Text>
                  <Text style={[styles.modalFoodDesc, { color: colors.textSecondary }]}>
                    {language === 'vi' 
                      ? `Chào mừng bạn đến với ${translateDbText(selectedBranchDetail.name)}. Chi nhánh của chúng tôi sở hữu không gian ẩm thực sang trọng, ấm cúng cùng đội ngũ đầu bếp chuyên nghiệp hàng đầu, mang lại trải nghiệm ẩm thực trọn vẹn nhất cho quý khách.` 
                      : `Welcome to ${translateDbText(selectedBranchDetail.name)}. Our branch features a luxurious, cozy dining space and a team of top professional chefs, bringing the most complete culinary experience to our guests.`}
                  </Text>

                  {/* Phone & Address */}
                  <View style={[styles.detailContactSection, { backgroundColor: isDarkMode ? '#121212' : '#F9F5F4' }]}>
                    <Text style={[styles.modalSectionLabel, { color: colors.text }]}>{t('contactInfo')}</Text>
                    
                    {/* Address Line */}
                    <View style={styles.contactItemRow}>
                      <Ionicons name="location" size={20} color={colors.primary} style={styles.contactItemIcon} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactItemLabel, { color: colors.textSecondary }]}>{t('addressLabel')}</Text>
                        <Text style={[styles.contactItemValue, { color: colors.text }]}>{translateDbText(selectedBranchDetail.address)}</Text>
                      </View>
                    </View>

                    {/* Phone Line */}
                    <View style={styles.contactItemRow}>
                      <Ionicons name="call" size={20} color={colors.primary} style={styles.contactItemIcon} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactItemLabel, { color: colors.textSecondary }]}>{t('hotlineLabel')}</Text>
                        <Text style={[styles.contactItemValue, { color: colors.text }]}>{selectedBranchDetail.phone}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons Footer */}
              <View style={[styles.branchModalFooter, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[styles.branchFooterBtn, styles.callBtn]}
                  onPress={() => {
                    Linking.openURL(`tel:${selectedBranchDetail.phone}`).catch(() => {
                      Alert.alert(t('errorTitle'), t('callError'));
                    });
                  }}
                >
                  <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.branchFooterBtnText}>{t('callHotlineBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchFooterBtn, styles.mapBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBranchDetail.address)}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert(t('errorTitle'), t('mapError'));
                    });
                  }}
                >
                  <Ionicons name="map-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.branchFooterBtnText}>{t('getDirectionsBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchFooterBtn, styles.bookBtn]}
                  onPress={() => {
                    setSelectedBranchDetail(null);
                    router.push('/booking/new');
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.branchFooterBtnText}>{t('bookTableNowBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  content: { padding: 20 },
  brandSection: { alignItems: 'center', marginBottom: 32 },
  logoContainer: {
    width: 80, height: 80, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  brandName: { fontSize: 24, fontWeight: 'bold' },
  brandSlogan: { fontSize: 14, marginTop: 4 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, marginTop: 8 },
  contactCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: 14,
    padding: 14, marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  iconBox: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactLabel: { fontSize: 12 },
  contactValue: { fontSize: 15, fontWeight: '500', marginTop: 2 },
  branchCard: {
    flexDirection: 'row', borderRadius: 14, padding: 14,
    marginBottom: 8, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    alignItems: 'center',
  },
  branchInfo: { flex: 1, marginLeft: 12 },
  branchName: { fontSize: 15, fontWeight: 'bold' },
  branchAddress: { fontSize: 13, marginTop: 2 },
  branchPhone: { fontSize: 14, fontWeight: '500', marginTop: 4 },

  // Modal styles from home.tsx
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  modalSectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  modalFoodDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  branchDetailImage: {
    width: '90%',
    height: 160,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  branchDetailPlaceholder: {
    width: '90%',
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  modalInfoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  branchDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  branchDetailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  branchDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  branchDetailBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  detailContactSection: {
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  contactItemRow: {
    flexDirection: 'row',
    marginTop: 12,
    alignItems: 'flex-start',
  },
  contactItemIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  contactItemLabel: {
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: 2,
  },
  contactItemValue: {
    fontSize: 14,
    lineHeight: 18,
  },
  branchModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    gap: 8,
  },
  branchFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchFooterBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  callBtn: {
    backgroundColor: '#4CAF50',
  },
  mapBtn: {
  },
  bookBtn: {
    backgroundColor: '#FF9800',
  },
});
