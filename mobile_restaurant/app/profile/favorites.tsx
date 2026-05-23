import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import { FoodImage } from '../../components/FoodImage';
import { formatVnd } from '../../utils/CurrencyFormat';
import * as Api from '../../repositories/ApiRepository';
import type { FoodModel } from '../../models/FoodModels';
import { useCartStore } from '../../stores/CartStore';
import { FoodDetailModal } from '../../components/FoodDetailModal';

export default function FavoritesScreen() {
  const router = useRouter();
  const { isLoggedIn } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();
  const [favorites, setFavorites] = useState<FoodModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState<FoodModel | null>(null);

  const addItem = useCartStore((s) => s.addItem);

  const loadFavorites = useCallback(async () => {
    if (!isLoggedIn) { setLoading(false); return; }
    try {
      const res = await Api.getFavorites();
      setFavorites(res.data);
    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLoggedIn]);

  useEffect(() => { loadFavorites(); }, [loadFavorites]);

  const handleRemove = (foodId: string, foodName: string) => {
    const displayFoodName = translateDbText(foodName);
    Alert.alert(
      language === 'vi' ? 'Xác nhận' : 'Confirm',
      language === 'vi' ? `Bỏ "${displayFoodName}" khỏi danh sách yêu thích?` : `Remove "${displayFoodName}" from favorites?`,
      [
        { text: language === 'vi' ? 'Không' : 'No' },
        { text: language === 'vi' ? 'Bỏ' : 'Remove', style: 'destructive', onPress: async () => {
          try {
            await Api.removeFavorite(foodId);
            setFavorites((prev) => prev.filter((f) => f.id !== foodId));
          } catch (e: any) {
            Alert.alert(t('errorTitle'), e.message);
          }
        }},
      ]
    );
  };

  const handleAddToCartFromModal = (food: FoodModel) => {
    addItem(food);
    Alert.alert(t('successTitle'), t('addedToCartSuccess').replace('{name}', food.name));
  };

  const handleToggleFavoriteFromModal = async (foodId: string, willBeFavorite: boolean) => {
    try {
      if (willBeFavorite) {
        await Api.addFavorite(foodId);
        if (selectedFoodDetail && selectedFoodDetail.id === foodId) {
          setFavorites((prev) => {
            if (prev.some(f => f.id === foodId)) return prev;
            return [...prev, selectedFoodDetail];
          });
        }
      } else {
        await Api.removeFavorite(foodId);
        setFavorites((prev) => prev.filter((f) => f.id !== foodId));
      }
    } catch (e: any) {
      Alert.alert(t('errorTitle'), e.message || (language === 'vi' ? 'Cập nhật yêu thích thất bại' : 'Failed to update favorites'));
    }
  };

  const renderItem = ({ item }: { item: FoodModel }) => (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <TouchableOpacity
        style={styles.cardContent}
        onPress={() => setSelectedFoodDetail(item)}
        activeOpacity={0.7}
      >
        <FoodImage uri={item.imageUrl} size={70} />
        <View style={styles.info}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>{translateDbText(item.name)}</Text>
          <Text style={[styles.desc, { color: colors.textSecondary }]} numberOfLines={2}>{item.description}</Text>
          <Text style={[styles.price, { color: colors.primary }]}>{formatVnd(item.price)}</Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemove(item.id, item.name)}>
        <Ionicons name="heart-dislike" size={22} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('favorites')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadFavorites(); }} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="heart-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.text }]}>
                {language === 'vi' ? 'Chưa có món yêu thích nào' : 'No favorites yet'}
              </Text>
              <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                {language === 'vi' ? 'Hãy khám phá thực đơn và thêm món bạn thích!' : 'Explore our menu and save the dishes you love!'}
              </Text>
            </View>
          }
        />
      )}
      <FoodDetailModal
        visible={selectedFoodDetail !== null}
        onClose={() => setSelectedFoodDetail(null)}
        food={selectedFoodDetail}
        isLoggedIn={isLoggedIn}
        favoriteIds={favorites.map((f) => f.id)}
        onToggleFavorite={handleToggleFavoriteFromModal}
        onAddToCart={handleAddToCartFromModal}
      />
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
  emptyText: { fontSize: 16, marginTop: 12, fontWeight: '600' },
  emptyHint: { fontSize: 14, marginTop: 4, textAlign: 'center' },
  card: {
    flexDirection: 'row', borderRadius: 14, padding: 12,
    marginBottom: 10, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  cardContent: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  desc: { fontSize: 13, marginTop: 2 },
  price: { fontSize: 15, fontWeight: 'bold', marginTop: 4 },
  removeBtn: { padding: 8 },
});
