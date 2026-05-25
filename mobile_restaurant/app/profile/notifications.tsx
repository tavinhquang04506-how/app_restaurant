import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, RefreshControl, Image,
  Modal, ScrollView, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';
import type { NotificationModel } from '../../models/NotificationModels';

export default function NotificationsScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationModel | null>(null);
  const [imageErrorIds, setImageErrorIds] = useState<string[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      let rawData: NotificationModel[] = [];
      if (isLoggedIn) {
        const res = await Api.getMyNotifications(1, 50);
        rawData = res.data;
      } else {
        // Fallback for non-logged in or global notifications
        const res = await Api.getGlobalNotifications(1, 50);
        rawData = res.data;
      }

      // Lấy danh sách ID đã đọc từ AsyncStorage
      try {
        const readIdsStr = await AsyncStorage.getItem('@read_notification_ids');
        const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
        if (Array.isArray(readIds) && readIds.length > 0) {
          rawData = rawData.map((n) => {
            if (n.id && readIds.includes(n.id)) {
              return { ...n, isRead: true };
            }
            return n;
          });
        }
      } catch {}

      setNotifications(rawData);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkRead = async (item: NotificationModel) => {
    // Open modal details
    setSelectedNotification(item);

    if (!item.id) return;

    // Lưu ID đã đọc cục bộ qua AsyncStorage
    try {
      const readIdsStr = await AsyncStorage.getItem('@read_notification_ids');
      let readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      if (!Array.isArray(readIds)) {
        readIds = [];
      }
      if (!readIds.includes(item.id)) {
        readIds.push(item.id);
        await AsyncStorage.setItem('@read_notification_ids', JSON.stringify(readIds));
      }
    } catch {}

    // Cập nhật trạng thái trên UI ngay lập tức
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
    );

    // Đồng bộ phía máy chủ ở chế độ nền nếu đã đăng nhập và chưa được đánh dấu là đọc trên UI lúc trước
    if (isLoggedIn && !item.isRead) {
      try {
        await Api.markNotificationAsRead(item.id);
      } catch {}
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const allIds = notifications.map((n) => n.id).filter(Boolean) as string[];
      const readIdsStr = await AsyncStorage.getItem('@read_notification_ids');
      let readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
      if (!Array.isArray(readIds)) {
        readIds = [];
      }
      allIds.forEach((id) => {
        if (!readIds.includes(id)) {
          readIds.push(id);
        }
      });
      await AsyncStorage.setItem('@read_notification_ids', JSON.stringify(readIds));
    } catch {}

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isRead: true }))
    );

    if (isLoggedIn) {
      try {
        await Api.markAllNotificationsAsRead();
      } catch {}
    }
  };

  const renderItem = ({ item }: { item: NotificationModel }) => (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        !item.isRead && { borderLeftWidth: 4, borderLeftColor: colors.primary }
      ]}
      onPress={() => handleMarkRead(item)}
    >
      {item.image && !imageErrorIds.includes(item.id ?? '') ? (
        <Image
          source={{ uri: item.image }}
          style={styles.notifImage}
          resizeMode="cover"
          onError={() => {
            if (item.id) {
              setImageErrorIds((prev) => [...prev, item.id]);
            }
          }}
        />
      ) : (
        <View style={[styles.iconContainer, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F5F5F5' }]}>
          <Ionicons
            name={item.type === 'PROMOTION' ? 'pricetag' : 'calendar'}
            size={24}
            color={colors.primary}
          />
        </View>
      )}
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: colors.text },
            !item.isRead && styles.titleUnread
          ]}
          numberOfLines={1}
        >
          {item.title}
        </Text>
        <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.message}
        </Text>
        <Text style={[styles.time, { color: colors.textSecondary }]}>
          {item.createdAt ? new Date(item.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US') : ''}
        </Text>
      </View>
      {!item.isRead && <View style={[styles.dot, { backgroundColor: colors.primary }]} />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('notifications')}</Text>
        
        {isLoggedIn && notifications.some(n => !n.isRead) ? (
          <TouchableOpacity onPress={handleMarkAllRead} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done-circle-outline" size={24} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id ?? Math.random().toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadNotifications();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('noNotifications')}
              </Text>
            </View>
          }
        />
      )}

      {/* Notification Detail Modal */}
      <Modal
        visible={selectedNotification !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedNotification(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalHeaderTitle, { color: colors.text }]}>
                {t('notificationDetail')}
              </Text>
              <TouchableOpacity onPress={() => setSelectedNotification(null)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedNotification && (
              <ScrollView contentContainerStyle={styles.modalScrollContent}>
                {selectedNotification.image && !imageErrorIds.includes(selectedNotification.id ?? '') ? (
                  <Image
                    source={{ uri: selectedNotification.image }}
                    style={styles.modalImage}
                    resizeMode="cover"
                    onError={() => {
                      if (selectedNotification.id) {
                        setImageErrorIds((prev) => [...prev, selectedNotification.id]);
                      }
                    }}
                  />
                ) : null}
                <Text style={[styles.modalTitle, { color: colors.text }]}>
                  {selectedNotification.title}
                </Text>
                <Text style={[styles.modalTime, { color: colors.textSecondary }]}>
                  {selectedNotification.createdAt
                    ? new Date(selectedNotification.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')
                    : ''}
                </Text>
                <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />
                <Text style={[styles.modalMessage, { color: colors.text }]}>
                  {selectedNotification.message}
                </Text>
              </ScrollView>
            )}

            <TouchableOpacity
              style={[styles.modalCloseBtn, { backgroundColor: colors.primary }]}
              onPress={() => setSelectedNotification(null)}
            >
              <Text style={styles.modalCloseBtnText}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
    paddingTop: 16,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  markAllBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-end' },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, marginTop: 12 },
  card: {
    flexDirection: 'row', borderRadius: 14, padding: 12, borderWidth: 1,
    marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  notifImage: { width: 50, height: 50, borderRadius: 10 },
  iconContainer: {
    width: 50, height: 50, borderRadius: 10,
    justifyContent: 'center', alignItems: 'center',
  },
  content: { flex: 1, marginLeft: 12 },
  title: { fontSize: 15, fontWeight: '500' },
  titleUnread: { fontWeight: 'bold' },
  message: { fontSize: 13, marginTop: 2 },
  time: { fontSize: 11, marginTop: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4, marginLeft: 8,
  },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalContainer: {
    width: '100%', maxHeight: '80%', borderRadius: 20, padding: 20,
    shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 10, elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingBottom: 12, borderBottomWidth: 1,
  },
  modalHeaderTitle: { fontSize: 16, fontWeight: 'bold' },
  modalScrollContent: { paddingTop: 16 },
  modalImage: { width: '100%', height: 180, borderRadius: 12, marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  modalTime: { fontSize: 12, marginBottom: 12 },
  modalDivider: { height: 1, marginBottom: 12 },
  modalMessage: { fontSize: 15, lineHeight: 22 },
  modalCloseBtn: {
    borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16,
  },
  modalCloseBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold' },
});
