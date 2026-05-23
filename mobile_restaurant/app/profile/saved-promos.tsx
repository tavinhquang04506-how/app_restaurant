import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { PromotionModel } from '../../models/PromotionModels';
import * as Api from '../../repositories/ApiRepository';
import { parseSafeDate } from '../../utils/Utils';

export default function SavedPromosScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();
  const [promos, setPromos] = useState<PromotionModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedPromos = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const raw = await AsyncStorage.getItem(`saved_promotions_${user.id}`);
      const savedCodes: string[] = raw ? JSON.parse(raw) : [];

      if (savedCodes.length === 0) {
        setPromos([]);
        setLoading(false); setRefreshing(false);
        return;
      }

      // Fetch all available promos from API
      const response = await Api.getAvailablePromotions();
      const allPromos = response.data || [];

      // Filter to only saved ones
      const matched = allPromos.filter(p => savedCodes.includes(p.code));
      setPromos(matched);
    } catch {
      setPromos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadSavedPromos(); }, [loadSavedPromos]);

  const handleRemove = (promoId: string, promoName: string, promoCode: string) => {
    const displayName = translateDbText(promoName);
    Alert.alert(
      language === 'vi' ? 'Xác nhận' : 'Confirm',
      language === 'vi'
        ? `Xóa "${displayName}" khỏi danh sách đã lưu?`
        : `Remove "${displayName}" from saved promotions?`,
      [
        { text: t('cancel') },
        {
          text: t('removePromo'), style: 'destructive', onPress: async () => {
            const updated = promos.filter((p) => p.id !== promoId);
            setPromos(updated);
            if (user?.id) {
              try {
                const raw = await AsyncStorage.getItem(`saved_promotions_${user.id}`);
                const savedCodes: string[] = raw ? JSON.parse(raw) : [];
                const updatedCodes = savedCodes.filter(c => c !== promoCode);
                await AsyncStorage.setItem(
                  `saved_promotions_${user.id}`,
                  JSON.stringify(updatedCodes),
                );
              } catch {
                // Silently handle storage error
              }
            }
          },
        },
      ],
    );
  };

  const isExpired = (endDate?: string): boolean => {
    if (!endDate) return false;
    return parseSafeDate(endDate) < new Date();
  };

  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '—';
    const d = parseSafeDate(dateStr);
    return d.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
  };

  const renderItem = ({ item }: { item: PromotionModel }) => {
    const expired = isExpired(item.endDate);
    return (
      <View style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        expired && styles.cardExpired,
      ]}>
        {/* Discount Badge */}
        <View style={[styles.discountBadge, { backgroundColor: expired ? '#888' : colors.primary }]}>
          <Text style={styles.discountText}>-{item.discountPercent}%</Text>
          <Text style={styles.discountLabel}>{t('discount')}</Text>
        </View>

        {/* Content */}
        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={2}>
              {translateDbText(item.name)}
            </Text>
          </View>

          {item.description ? (
            <Text style={[styles.promoDesc, { color: colors.textSecondary }]} numberOfLines={2}>
              {translateDbText(item.description)}
            </Text>
          ) : null}

          {/* Promo Code Chip */}
          <View style={[styles.codeChip, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)' }]}>
            <Ionicons name="ticket-outline" size={14} color={colors.primary} />
            <Text style={[styles.codeText, { color: colors.primary }]}>{item.code}</Text>
          </View>

          {/* Date Row */}
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              {formatDate(item.startDate)} — {formatDate(item.endDate)}
            </Text>
          </View>

          {/* Status Pill */}
          <View style={[
            styles.statusPill,
            { backgroundColor: expired ? 'rgba(255,59,48,0.1)' : 'rgba(52,199,89,0.1)' },
          ]}>
            <View style={[styles.statusDot, { backgroundColor: expired ? '#FF3B30' : '#34C759' }]} />
            <Text style={[styles.statusText, { color: expired ? '#FF3B30' : '#34C759' }]}>
              {expired ? t('promoExpired') : t('promoValid')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('savedPromotions')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={promos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadSavedPromos(); }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIconBg, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }]}>
                <Ionicons name="pricetag-outline" size={52} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {t('noSavedPromos')}
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                {language === 'vi'
                  ? 'Hãy khám phá các ưu đãi ở trang chủ và lưu lại!'
                  : 'Explore deals on the home page and save them here!'}
              </Text>
              <TouchableOpacity
                style={[styles.exploreCta, { backgroundColor: colors.primary }]}
                onPress={() => router.replace('/(tabs)/home')}
              >
                <Ionicons name="compass-outline" size={18} color="#fff" />
                <Text style={styles.exploreCtaText}>
                  {language === 'vi' ? 'Khám phá ưu đãi' : 'Explore Deals'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },

  // Card
  card: {
    flexDirection: 'row',
    borderRadius: 18,
    marginBottom: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardExpired: { opacity: 0.65 },

  // Discount Badge (left side)
  discountBadge: {
    width: 78,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  discountText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#fff',
    letterSpacing: -0.5,
  },
  discountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'uppercase',
    marginTop: 2,
    letterSpacing: 0.5,
  },

  // Card Content (right side)
  cardContent: {
    flex: 1,
    padding: 14,
    paddingLeft: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  promoName: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    lineHeight: 20,
  },
  removeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  promoDesc: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },

  // Code Chip
  codeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginTop: 8,
    gap: 5,
  },
  codeText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Dates
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 5,
  },
  dateText: {
    fontSize: 12,
  },

  // Status Pill
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  exploreCtaText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
});
