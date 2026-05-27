import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, TextInput, RefreshControl,
  Alert, Platform, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../styles/AppColors';
import { FoodImage } from '../../components/FoodImage';
import { StarRating } from '../../components/StarRating';
import { useAuth } from '../../contexts/AuthContext';
import { formatVnd } from '../../utils/CurrencyFormat';
import { useCartStore } from '../../stores/CartStore';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import { FoodDetailModal } from '../../components/FoodDetailModal';
import * as Api from '../../repositories/ApiRepository';
import type { FoodModel } from '../../models/FoodModels';
import type { CategoryModel } from '../../models/CategoryModels';
import { formatTableCode } from '../../utils/Utils';

export default function FoodScreen() {
  const router = useRouter();
  const { isLoggedIn, booking } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [foods, setFoods] = useState<FoodModel[]>([]);
  const [categories, setCategories] = useState<CategoryModel[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState<FoodModel | null>(null);
  
  const addItem = useCartStore((s) => s.addItem);
  const cartItemCount = useCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0));

  const loadData = useCallback(async () => {
    try {
      const [catRes, foodRes] = await Promise.all([
        Api.getCategories().catch(() => ({ data: [] as CategoryModel[] })),
        Api.getFoods({
          page: 1, size: 50,
          name: searchQuery || undefined,
          categoryId: selectedCategory || undefined,
        }).catch(() => ({ data: [] as FoodModel[] })),
      ]);
      setCategories(catRes.data);
      const foodList = foodRes.data;
      const sortedFoods = [...foodList].sort((a, b) => {
        const aBS = (a.sold ?? 0) >= 800;
        const bBS = (b.sold ?? 0) >= 800;
        if (aBS && !bBS) return -1;
        if (!aBS && bBS) return 1;
        if (aBS && bBS) return (b.sold ?? 0) - (a.sold ?? 0);
        return a.name.localeCompare(b.name, 'vi');
      });
      setFoods(sortedFoods);


    } catch {} finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchQuery, selectedCategory, isLoggedIn]);

  useEffect(() => { setLoading(true); loadData(); }, [loadData]);



  const onRefresh = () => { setRefreshing(true); loadData(); };

  const handleAddToCart = (food: FoodModel) => {
    if (!isLoggedIn) {
      Alert.alert(
        t('loginRequired'),
        t('loginRequiredCartDesc'),
        [
          { text: t('cancel'), style: 'cancel' },
          { text: language === 'vi' ? 'Đăng nhập' : 'Log In', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }
    addItem(food);
    Alert.alert(t('successTitle'), t('addedToCartSuccess').replace('{name}', food.name));
  };



  const renderCategory = ({ item }: { item: CategoryModel }) => {
    const isActive = selectedCategory === item.id;
    return (
      <TouchableOpacity
        style={[
          styles.categoryChip,
          { backgroundColor: isActive ? colors.primary : colors.card },
          isActive && styles.categoryChipActive
        ]}
        onPress={() => setSelectedCategory(isActive ? null : item.id)}
      >
        <Text
          style={[
            styles.categoryText,
            { color: isActive ? '#FFFFFF' : colors.textSecondary },
            isActive && styles.categoryTextActive
          ]}
        >
          {translateDbText(item.name)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFood = ({ item }: { item: FoodModel }) => {
    const isBestSeller = (item.sold ?? 0) >= 800;

    return (
      <TouchableOpacity
        style={[styles.foodCard, { backgroundColor: colors.card }]}
        onPress={() => setSelectedFoodDetail(item)}
      >
        <View style={{ position: 'relative' }}>
          <FoodImage uri={item.imageUrl} size={90} />
          {isBestSeller && (
            <TouchableOpacity
              style={styles.starAbsolute}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                Alert.alert(t('bestSellerTitle'), t('bestSellerDesc'));
              }}
            >
              <View style={styles.starContainer}>
                <Text style={{ fontSize: 13, lineHeight: 15 }}>⭐</Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.foodInfo}>
          <View style={styles.nameRow}>
            <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>
              {translateDbText(item.name)}
            </Text>
          </View>

          <Text style={[styles.foodDesc, { color: colors.textSecondary }]} numberOfLines={2}>
            {item.description}
          </Text>
          <View style={styles.foodBottom}>
            <Text style={[styles.foodPrice, { color: colors.primary }]}>{formatVnd(item.price)}</Text>
            {item.avgRating != null && (
              <View style={styles.ratingRow}>
                <StarRating rating={item.avgRating} size={12} />
                <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({item.ratingCount ?? 0})</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action Column */}
        <View style={styles.actionCol}>
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.primary }]}
            onPress={() => handleAddToCart(item)}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with cart badge button */}
      <View style={styles.headerContainer}>
        <Text style={[styles.titleText, { color: colors.text }]}>{t('tabMenu')}</Text>
        <TouchableOpacity
          onPress={() => isLoggedIn ? router.push('/cart') : router.push('/(auth)/login')}
          style={[styles.cartHeaderBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
        >
          <Ionicons name="reader-outline" size={22} color={colors.text} />
          {cartItemCount > 0 && (
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{cartItemCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('searchDishes')}
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filter */}
      <View style={styles.categoryContainer}>
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          renderItem={renderCategory}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          ListHeaderComponent={
            <TouchableOpacity
              style={[
                styles.categoryChip,
                { backgroundColor: !selectedCategory ? colors.primary : colors.card },
                !selectedCategory && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text
                style={[
                  styles.categoryText,
                  { color: !selectedCategory ? '#FFFFFF' : colors.textSecondary },
                  !selectedCategory && styles.categoryTextActive
                ]}
              >
                {t('all')}
              </Text>
            </TouchableOpacity>
          }
        />
      </View>

      {/* Food List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={foods}
          keyExtractor={(item) => item.id}
          renderItem={renderFood}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: (booking && booking.tableId) ? 90 : 32 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
          ListEmptyComponent={
            <View style={styles.center}>
              <Ionicons name="restaurant-outline" size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{t('noDishesFound')}</Text>
            </View>
          }
        />
      )}

      {/* Active Booking Draft Floating Banner */}
      {booking && booking.tableId && (
        <TouchableOpacity
          style={[styles.floatingBanner, { backgroundColor: colors.card, borderTopColor: colors.border }]}
          onPress={() => router.push('/booking/confirm')}
          activeOpacity={0.85}
        >
          <View style={styles.bannerInfo}>
            <Ionicons name="calendar" size={20} color={colors.primary} />
            <Text style={[styles.bannerText, { color: colors.text }]}>
              {t('orderingForTable')}{formatTableCode(booking.tableCode, language)}
            </Text>
          </View>
          <View style={[styles.bannerBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.bannerBtnText}>{t('confirm')}</Text>
            <Ionicons name="chevron-forward" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      )}

      {/* Food Detail Modal */}
      <FoodDetailModal
        visible={!!selectedFoodDetail}
        food={selectedFoodDetail}
        onClose={() => setSelectedFoodDetail(null)}
        isLoggedIn={isLoggedIn}
        onAddToCart={handleAddToCart}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: AppColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  cartHeaderBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: AppColors.textPrimary, paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    marginHorizontal: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: AppColors.textPrimary },
  categoryContainer: { marginBottom: 12 },
  categoryChip: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: AppColors.border,
  },
  categoryChipActive: { backgroundColor: AppColors.primary, borderColor: AppColors.primary },
  categoryText: { fontSize: 14, color: AppColors.textSecondary, fontWeight: '500' },
  categoryTextActive: { color: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 16, color: AppColors.textSecondary, marginTop: 12 },
  foodCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12,
    marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    alignItems: 'center',
  },
  foodInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  foodName: { fontSize: 16, fontWeight: '600', color: AppColors.textPrimary },
  foodDesc: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4 },
  foodBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  foodPrice: { fontSize: 16, fontWeight: 'bold', color: AppColors.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 11, color: AppColors.textSecondary },
  addBtn: {
    backgroundColor: AppColors.primary, width: 36, height: 36, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center', marginLeft: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingRight: 8,
  },
  starAbsolute: {
    position: 'absolute',
    top: -6,
    left: -6,
    zIndex: 99,
    padding: 6,
  },
  starContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1.5,
    borderColor: '#FFD700',
  },
  actionCol: {
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingLeft: 4,
  },

  floatingBanner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 72,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  bannerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bannerBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
});
