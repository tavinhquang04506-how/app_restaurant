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
import { useAuth, userFromSessionModel } from '../../contexts/AuthContext';
import { Validators } from '../../utils/Validators';
import { extractErrorMessage } from '../../utils/Utils';
import { AppColors } from '../../styles/AppColors';
import * as Api from '../../repositories/ApiRepository';

export default function LoginScreen() {
  const router = useRouter();
  const { setAuthSession } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [apiError, setApiError] = useState<string | null>(null);

  const validate = (): boolean => {
    setApiError(null);
    const e: typeof errors = {};
    e.email = Validators.email(email) ?? undefined;
    e.password = Validators.required(password, 'Mật khẩu') ?? undefined;
    setErrors(e);
    return !e.email && !e.password;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await Api.login(email, password);
      if (!res.data) throw new Error('Không thể đăng nhập');
      
      const mappedUser = userFromSessionModel(res.data.user);
      if (mappedUser.role && mappedUser.role !== 'USER') {
        const errorMsg = 'Tài khoản nội bộ (Admin/Quản lý/Nhân viên) không được phép sử dụng ứng dụng di động của Khách hàng. Vui lòng truy cập trang quản trị trên Web Dashboard để làm việc.';
        if (Platform.OS !== 'web') {
          Alert.alert('⚠️ Quyền truy cập bị từ chối!', errorMsg);
        } else {
          setApiError(errorMsg);
        }
        return;
      }

      await setAuthSession(
        mappedUser,
        res.data.accessToken,
        res.data.refreshToken,
      );
      router.replace('/(tabs)/home');
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
      <LoadingOverlay visible={loading} message="Đang đăng nhập..." />
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
              <Text style={styles.title}>Đăng Nhập</Text>
              <Text style={styles.subtitle}>Chào mừng quay trở lại!</Text>
            </View>

            <View style={styles.form}>
              {apiError && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{apiError}</Text>
                </View>
              )}
              <AppTextField
                label="Email"
                placeholder="Nhập email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                error={errors.email}
              />
              <View>
                <AppTextField
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  error={errors.password}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color={AppColors.textHint} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={styles.forgotText}>Quên mật khẩu?</Text>
              </TouchableOpacity>

              <AppButton title="Đăng Nhập" onPress={handleLogin} loading={loading} style={{ marginTop: 16 }} />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Chưa có tài khoản? </Text>
                <TouchableOpacity onPress={() => router.replace('/(auth)/register')}>
                  <Text style={styles.footerLink}>Đăng ký ngay</Text>
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
  header: { marginTop: 32, marginBottom: 32 },
  title: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
  eyeIcon: { position: 'absolute', right: 14, top: 38 },
  forgotText: {
    fontSize: 14, color: AppColors.textLink, fontWeight: '600',
    textAlign: 'right', marginTop: -8, marginBottom: 8,
  },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  footerText: { fontSize: 14, color: AppColors.textSecondary },
  footerLink: { fontSize: 14, fontWeight: 'bold', color: AppColors.primary },
  errorBox: {
    backgroundColor: '#FFEBEE', padding: 12, borderRadius: 8, marginBottom: 16,
    borderWidth: 1, borderColor: '#FFCDD2',
  },
  errorText: { color: '#D32F2F', fontSize: 14, textAlign: 'center' },
});
