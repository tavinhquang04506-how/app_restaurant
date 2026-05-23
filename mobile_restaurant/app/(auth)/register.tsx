import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform, SafeAreaView, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { AppTextField } from '../../components/AppTextField';
import { AppButton } from '../../components/AppButton';
import { LoadingOverlay } from '../../components/LoadingOverlay';
import { Validators } from '../../utils/Validators';
import { extractErrorMessage } from '../../utils/Utils';
import { AppColors } from '../../styles/AppColors';
import * as Api from '../../repositories/ApiRepository';

export default function RegisterScreen() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    setApiError(null);
    const e: Record<string, string | undefined> = {};
    e.username = Validators.name(username, 'Họ tên') ?? undefined;
    e.email = Validators.email(email) ?? undefined;
    e.phone = Validators.phone(phone) ?? undefined;
    e.password = Validators.password(password) ?? undefined;
    e.confirmPassword = Validators.confirmPassword(() => password)(confirmPassword) ?? undefined;
    setErrors(e);
    return !Object.values(e).some(Boolean);
  };

  const handleRegister = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await Api.register({ username, email, phone, password, confirmPassword });
      if (Platform.OS === 'web') {
        window.alert('Đăng ký thành công! Vui lòng đăng nhập.');
        router.replace('/(auth)/login');
      } else {
        Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
        ]);
      }
    } catch (error) {
      const msg = extractErrorMessage(error);
      setApiError(msg);
      if (Platform.OS !== 'web') {
        Alert.alert('Lỗi', msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[AppColors.primaryDark, AppColors.primaryLight, AppColors.accent]}
        style={StyleSheet.absoluteFillObject}
      />
      <LoadingOverlay visible={loading} message="Đang đăng ký..." />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <View style={styles.header}>
              <Text style={styles.title}>Đăng Ký</Text>
              <Text style={styles.subtitle}>Tạo tài khoản mới</Text>
            </View>

            <View style={styles.form}>
              {apiError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{apiError}</Text>
                </View>
              )}
              <AppTextField label="Họ tên" placeholder="Nhập họ tên" value={username} onChangeText={setUsername} error={errors.username} />
              <AppTextField label="Email" placeholder="Nhập email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
              <AppTextField label="Số điện thoại" placeholder="Nhập số điện thoại" value={phone} onChangeText={setPhone} keyboardType="phone-pad" error={errors.phone} />
              <View>
                <AppTextField label="Mật khẩu" placeholder="Nhập mật khẩu" value={password} onChangeText={setPassword} secureTextEntry={!showPassword} error={errors.password} />
                <TouchableOpacity style={styles.eyeIcon} onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={AppColors.textHint} />
                </TouchableOpacity>
              </View>
              <AppTextField label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showPassword} error={errors.confirmPassword} />

              <AppButton title="Đăng Ký" onPress={handleRegister} loading={loading} style={{ marginTop: 8 }} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Đã có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
                  <Text style={styles.footerLink}>Đăng nhập</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 40 },
  backBtn: { marginTop: 16, width: 40 },
  header: { marginTop: 20, marginBottom: 24 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  eyeIcon: { position: 'absolute', right: 14, top: 38 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: AppColors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: 'bold', color: AppColors.primary },
  errorBox: {
    backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, marginBottom: 16,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center' },
});
