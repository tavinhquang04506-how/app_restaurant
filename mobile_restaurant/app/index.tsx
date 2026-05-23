import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ImageBackground, TouchableOpacity,
  Dimensions, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { AppColors } from '../styles/AppColors';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

export default function IntroScreen() {
  const { isLoggedIn, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isLoggedIn) {
      router.replace('/(tabs)/home');
    }
  }, [isLoading, isLoggedIn]);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: '#fff', fontSize: 18 }}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[AppColors.primaryDark, AppColors.primaryLight, AppColors.accent]}
        style={StyleSheet.absoluteFillObject}
      />
      <SafeAreaView style={styles.content}>
        <View style={styles.topSection}>
          <Text style={styles.welcome}>Chào mừng đến với</Text>
          <Text style={styles.appName}>ThreeShip</Text>
          <Text style={styles.tagline}>Nhà hàng ẩm thực đặc sắc</Text>
        </View>

        <View style={styles.bottomSection}>
          <Text style={styles.description}>
            Khám phá thực đơn phong phú, đặt bàn nhanh chóng và tận hưởng những trải nghiệm ẩm thực tuyệt vời.
          </Text>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginText}>Đăng Nhập</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={styles.registerText}>Đăng Ký</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.skipText}>Bỏ qua, xem thực đơn →</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: AppColors.primaryDark },
  content: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 32 },
  topSection: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  welcome: { fontSize: 18, color: 'rgba(255,255,255,0.8)', marginBottom: 8 },
  appName: { fontSize: 48, fontWeight: 'bold', color: '#fff', letterSpacing: 2 },
  tagline: { fontSize: 16, color: 'rgba(255,255,255,0.7)', marginTop: 8 },
  bottomSection: { paddingBottom: 40, alignItems: 'center' },
  description: {
    fontSize: 15, color: 'rgba(255,255,255,0.8)', textAlign: 'center',
    marginBottom: 32, lineHeight: 22,
  },
  loginButton: {
    backgroundColor: AppColors.primary, borderRadius: 12, paddingVertical: 16,
    width: '100%', alignItems: 'center', marginBottom: 12,
  },
  loginText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  registerButton: {
    backgroundColor: 'transparent', borderRadius: 12, paddingVertical: 16,
    width: '100%', alignItems: 'center', borderWidth: 2, borderColor: '#fff',
    marginBottom: 20,
  },
  registerText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  skipText: { fontSize: 14, color: AppColors.textLink, fontWeight: '600' },
});
