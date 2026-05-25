import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, ActivityIndicator, Platform, StatusBar,
  Image, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth, mapGenderToBackend } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';
import { extractErrorMessage } from '../../utils/Utils';

const PRESET_AVATARS = [
  { id: 'chef_male', url: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=150', nameVi: 'Đầu bếp Nam', nameEn: 'Chef Male' },
  { id: 'chef_female', url: 'https://images.unsplash.com/photo-1581299894007-aaa50297cf16?w=150', nameVi: 'Đầu bếp Nữ', nameEn: 'Chef Female' },
  { id: 'dim_sum', url: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=150', nameVi: 'Dimsum Pha Lê', nameEn: 'Crystal Dim Sum' },
  { id: 'peking_duck', url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=150', nameVi: 'Vịt Quay Bắc Kinh', nameEn: 'Peking Duck' },
  { id: 'golden_dragon', url: 'https://images.unsplash.com/photo-1508189860359-777d945909ef?w=150', nameVi: 'Rồng Vàng', nameEn: 'Golden Dragon' },
  { id: 'teacup', url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=150', nameVi: 'Ấm Trà Thơm', nameEn: 'Teacup' },
];

export default function ProfileEditScreen() {
  const router = useRouter();
  const { user, setAuthSession, accessToken, refreshToken } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [gender, setGender] = useState(user?.gender ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  // Avatar Picker Modal state
  const [isPickerVisible, setIsPickerVisible] = useState(false);
  const [tempAvatarUrl, setTempAvatarUrl] = useState(user?.avatarUrl ?? '');
  const [uploadLoading, setUploadLoading] = useState(false);

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          language === 'vi' ? 'Quyền truy cập bị từ chối' : 'Permission Denied',
          language === 'vi' 
            ? 'Ứng dụng cần quyền truy cập thư viện ảnh để tải ảnh lên!' 
            : 'The app needs permission to access photo library to upload image!'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const selectedUri = asset.uri;
        
        // Determine a proper filename and mime type
        // On Android, the URI may be content:// with no extension, so use asset.mimeType
        const mimeType = asset.mimeType || 'image/jpeg';
        const ext = mimeType.split('/')[1] || 'jpg';
        const uriFilename = selectedUri.split('/').pop() || '';
        const filename = uriFilename.includes('.') ? uriFilename : `avatar_${Date.now()}.${ext}`;

        setUploadLoading(true);

        // Build FormData manually with correct mime type
        const formData = new FormData();
        formData.append('file', {
          uri: Platform.OS === 'android' ? selectedUri : selectedUri.replace('file://', ''),
          name: filename,
          type: mimeType,
        } as any);
        formData.append('folder', 'avatar');

        const { apiClient } = await import('../../repositories/HttpRepository');
        const json: any = await apiClient.post('/files', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });

        if (json.statusCode < 200 || json.statusCode >= 300) {
          throw new Error(json.message || 'Upload failed');
        }

        const { buildApiBasePath } = await import('../../utils/ApiConfig');
        const uploadedUrl = `${buildApiBasePath()}/storage/avatar/${json.data.fileName}`;
        setTempAvatarUrl(uploadedUrl);
      }
    } catch (err) {
      console.warn('Avatar upload error:', err);
      Alert.alert(
        language === 'vi' ? 'Lỗi tải ảnh' : 'Upload Error',
        extractErrorMessage(err)
      );
    } finally {
      setUploadLoading(false);
    }
  };

  const genderOptions = [
    { value: 'Nam', labelVi: 'Nam', labelEn: 'Male' },
    { value: 'Nữ', labelVi: 'Nữ', labelEn: 'Female' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      setApiError(language === 'vi' ? 'Vui lòng nhập họ và tên' : 'Please enter your full name');
      return;
    }
    if (!phone.trim()) {
      setApiError(language === 'vi' ? 'Vui lòng nhập số điện thoại' : 'Please enter your phone number');
      return;
    }

    setLoading(true);
    setApiError('');
    try {
      const res = await Api.updateMe({
        username: name.trim(),
        phone: phone.trim(),
        gender: mapGenderToBackend(gender),
        avatarUrl: avatarUrl.trim() || undefined,
      });

      if (res.data && accessToken && refreshToken) {
        const { userFromSessionModel } = await import('../../contexts/AuthContext');
        const updatedUser = userFromSessionModel(res.data);
        await setAuthSession(updatedUser, accessToken, refreshToken);
      }

      if (Platform.OS === 'web') {
        window.alert(language === 'vi' ? 'Cập nhật thông tin thành công!' : 'Profile updated successfully!');
      } else {
        Alert.alert(
          language === 'vi' ? 'Thành công' : 'Success',
          language === 'vi' ? 'Cập nhật thông tin thành công!' : 'Profile updated successfully!'
        );
      }
      router.back();
    } catch (e) {
      setApiError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAvatar = () => {
    setAvatarUrl(tempAvatarUrl);
    setIsPickerVisible(false);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('personalInfo')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {apiError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{apiError}</Text>
          </View>
        ) : null}

        {/* Premium Avatar Edit Circle */}
        <View style={styles.avatarSection}>
          <TouchableOpacity 
            style={[styles.avatarWrapper, { borderColor: colors.primary }]}
            onPress={() => {
              setTempAvatarUrl(avatarUrl);
              setIsPickerVisible(true);
            }}
          >
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF3E0' }]}>
                <Ionicons name="person" size={50} color={colors.primary} />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.primary }]}>
              <Ionicons name="camera" size={16} color="#FFF" />
            </View>
          </TouchableOpacity>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            {language === 'vi' ? 'Nhấn vào ảnh để thay đổi avatar' : 'Tap on the circle to change avatar'}
          </Text>
        </View>

        {/* Name */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {language === 'vi' ? 'Họ và tên' : 'Full Name'}
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={name}
          onChangeText={setName}
          placeholder={language === 'vi' ? 'Nhập họ và tên' : 'Enter full name'}
          placeholderTextColor={colors.textSecondary}
        />

        {/* Email (read-only) */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
        <View style={[styles.input, styles.inputDisabled, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5', borderColor: colors.border }]}>
          <Text style={[styles.disabledText, { color: colors.textSecondary }]}>{user?.email ?? ''}</Text>
        </View>

        {/* Phone */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {language === 'vi' ? 'Số điện thoại' : 'Phone Number'}
        </Text>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.card, borderColor: colors.border }]}
          value={phone}
          onChangeText={setPhone}
          placeholder={language === 'vi' ? 'Nhập số điện thoại' : 'Enter phone number'}
          placeholderTextColor={colors.textSecondary}
          keyboardType="phone-pad"
        />

        {/* Gender */}
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {language === 'vi' ? 'Giới tính' : 'Gender'}
        </Text>
        <View style={styles.genderRow}>
          {genderOptions.map((g) => {
            const isActive = gender === g.value;
            return (
              <TouchableOpacity
                key={g.value}
                style={[
                  styles.genderChip, 
                  { borderColor: colors.border, backgroundColor: isActive ? colors.primary : colors.card }
                ]}
                onPress={() => setGender(g.value)}
              >
                <Text style={[styles.genderText, { color: isActive ? '#FFF' : colors.textSecondary }]}>
                  {language === 'vi' ? g.labelVi : g.labelEn}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Save Button */}
        <TouchableOpacity style={[styles.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>
              {language === 'vi' ? 'Lưu thay đổi' : 'Save Changes'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modern Avatar Picker Modal */}
      <Modal
        visible={isPickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'vi' ? 'Chọn Ảnh Đại Diện' : 'Choose Avatar'}
              </Text>
              <TouchableOpacity onPress={() => setIsPickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Device Photo Option */}
              <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>
                {language === 'vi' ? 'Ảnh từ thiết bị' : 'Device Photo'}
              </Text>
              
              <TouchableOpacity
                style={[
                  styles.uploadBtn,
                  { borderColor: colors.primary, backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF8F1' }
                ]}
                onPress={pickImage}
                disabled={uploadLoading}
              >
                {uploadLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <>
                    <Ionicons name="cloud-upload" size={24} color={colors.primary} style={{ marginRight: 8 }} />
                    <Text style={[styles.uploadBtnText, { color: colors.primary }]}>
                      {language === 'vi' ? 'Chọn ảnh từ máy' : 'Choose photo from library'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>

              {tempAvatarUrl ? (
                <View style={styles.previewContainer}>
                  <Text style={[styles.modalSectionTitle, { color: colors.textSecondary, marginTop: 4 }]}>
                    {language === 'vi' ? 'Xem trước ảnh đã chọn' : 'Selected Avatar Preview'}
                  </Text>
                  <Image source={{ uri: tempAvatarUrl }} style={[styles.previewImage, { borderColor: colors.primary }]} />
                </View>
              ) : null}

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              {/* Presets Grid */}
              <Text style={[styles.modalSectionTitle, { color: colors.textSecondary }]}>
                {language === 'vi' ? 'Hình mẫu ẩm thực Trung Hoa' : 'Chinese Culinary Presets'}
              </Text>
              
              <View style={styles.presetsGrid}>
                {PRESET_AVATARS.map((preset) => {
                  const isSelected = tempAvatarUrl === preset.url;
                  return (
                    <TouchableOpacity
                      key={preset.id}
                      style={[
                        styles.presetCard,
                        { borderColor: isSelected ? colors.primary : colors.border }
                      ]}
                      onPress={() => setTempAvatarUrl(preset.url)}
                    >
                      <Image source={{ uri: preset.url }} style={styles.presetImage} />
                      <Text style={[styles.presetName, { color: colors.text }]} numberOfLines={1}>
                        {language === 'vi' ? preset.nameVi : preset.nameEn}
                      </Text>
                      {isSelected && (
                        <View style={[styles.selectedCheck, { backgroundColor: colors.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>


            </ScrollView>

            {/* Modal Actions */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setIsPickerVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={handleApplyAvatar}
              >
                <Text style={styles.applyBtnText}>
                  {language === 'vi' ? 'Lựa chọn' : 'Select'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
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
  form: { padding: 20 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#E53935', fontSize: 14 },
  avatarSection: { alignItems: 'center', marginVertical: 20 },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: { width: '100%', height: '100%', borderRadius: 47 },
  avatarPlaceholder: { width: '100%', height: '100%', borderRadius: 47, justifyContent: 'center', alignItems: 'center' },
  editBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  avatarHint: { fontSize: 12, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 6, marginTop: 16 },
  input: {
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14,
    fontSize: 16, borderWidth: 1,
  },
  inputDisabled: { borderWidth: 1 },
  disabledText: { fontSize: 16 },
  genderRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  genderChip: {
    flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1,
    alignItems: 'center',
  },
  genderText: { fontSize: 15, fontWeight: '500' },
  saveBtn: {
    borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 32,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '75%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  modalScrollBody: { padding: 20, paddingBottom: 40 },
  modalSectionTitle: { fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 12, letterSpacing: 0.5 },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 20 },
  presetCard: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  presetImage: { width: '80%', height: '80%', borderRadius: 10 },
  presetName: { fontSize: 10, marginTop: 4, textAlign: 'center', fontWeight: '500' },
  selectedCheck: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: { height: 1, marginVertical: 20 },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  applyBtn: { },
  applyBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadBtnText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  previewImage: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
  },
});
