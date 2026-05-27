import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="profile/edit" options={{ presentation: 'modal' }} />
        <Stack.Screen name="profile/notifications" />
        <Stack.Screen name="profile/chat" />
        <Stack.Screen name="profile/contact" />
        <Stack.Screen name="booking/new" />
        <Stack.Screen name="booking/select-table" />
        <Stack.Screen name="booking/confirm" />
        <Stack.Screen name="booking/payment" />
      </Stack>
    </AuthProvider>
  );
}
