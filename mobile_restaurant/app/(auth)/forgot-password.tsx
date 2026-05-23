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

type Step = 'email' | 'otp' | 'reset';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const handleRequestOtp = async () => {
    const e: Record<string, string | undefined> = {};
    e.email = Validators.email(email) ?? undefined;
    setErrors(e);
    if (e.email) return;

    setLoading(true);
    try {
      await Api.requestPasswordOtp(email);
      setStep('otp');
      Alert.alert('Thành công', 'Mã OTP đã được gửi tới email của bạn.');
    } catch (error) {
      Alert.alert('Lỗi', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const e: Record<string, string | undefined> = {};
    e.otp = Validators.otp(otp) ?? undefined;
    setErrors(e);
    if (e.otp) return;

    setLoading(true);
    try {
      await Api.verifyPasswordOtp(email, otp);
      setStep('reset');
    } catch (error) {
      Alert.alert('Lỗi', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    const e: Record<string, string | undefined> = {};
    e.password = Validators.password(password) ?? undefined;
    e.confirmPassword = Validators.confirmPassword(() => password)(confirmPassword) ?? undefined;
    setErrors(e);
    if (e.password || e.confirmPassword) return;

    setLoading(true);
    try {
      await Api.resetPassword({ email, otp, password, confirmPassword });
      Alert.alert('Thành công', 'Mật khẩu đã được đặt lại. Vui lòng đăng nhập.', [
        { text: 'OK', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', extractErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#8B5A3C', AppColors.backgroundLight, AppColors.backgroundDark]}
        style={StyleSheet.absoluteFillObject}
      />
      <LoadingOverlay visible={loading} />
      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>

            <Text style={styles.title}>Quên Mật Khẩu</Text>
            <Text style={styles.subtitle}>
              {step === 'email' && 'Nhập email để nhận mã OTP'}
              {step === 'otp' && 'Nhập mã OTP đã gửi tới email'}
              {step === 'reset' && 'Đặt mật khẩu mới'}
            </Text>

            <View style={styles.form}>
              {step === 'email' && (
                <>
                  <AppTextField label="Email" placeholder="Nhập email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" error={errors.email} />
                  <AppButton title="Gửi mã OTP" onPress={handleRequestOtp} loading={loading} />
                </>
              )}
              {step === 'otp' && (
                <>
                  <AppTextField label="Mã OTP" placeholder="Nhập 6 số OTP" value={otp} onChangeText={setOtp} keyboardType="number-pad" maxLength={6} error={errors.otp} />
                  <AppButton title="Xác nhận OTP" onPress={handleVerifyOtp} loading={loading} />
                </>
              )}
              {step === 'reset' && (
                <>
                  <AppTextField label="Mật khẩu mới" placeholder="Nhập mật khẩu mới" value={password} onChangeText={setPassword} secureTextEntry error={errors.password} />
                  <AppTextField label="Xác nhận mật khẩu" placeholder="Nhập lại mật khẩu" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry error={errors.confirmPassword} />
                  <AppButton title="Đặt lại mật khẩu" onPress={handleReset} loading={loading} />
                </>
              )}
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
  title: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 24 },
  subtitle: { fontSize: 15, color: 'rgba(255,255,255,0.7)', marginTop: 8, marginBottom: 24 },
  form: {
    backgroundColor: '#fff', borderRadius: 20, padding: 24,
    shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
  },
});
