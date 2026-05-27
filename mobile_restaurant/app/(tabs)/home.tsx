import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList, RefreshControl, Image, Dimensions, SafeAreaView,
  Modal, Alert, Linking, Animated, PanResponder, Platform, StatusBar,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
import type { PromotionModel } from '../../models/PromotionModels';
import type { FoodModel } from '../../models/FoodModels';
import type { BranchModel } from '../../models/BranchModels';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { user, isLoggedIn } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  // Floating Chat Bubble draggable configuration
  const BUBBLE_SIZE = 60;
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  // Vị trí mặc định ở góc dưới bên phải
  const defaultX = screenWidth - BUBBLE_SIZE - 20;
  const defaultY = screenHeight - BUBBLE_SIZE - 120; // Tránh Bottom TabBar

  const pan = useRef(new Animated.ValueXY({ x: defaultX, y: defaultY })).current;

  const handleChatPress = () => {
    if (!isLoggedIn) {
      Alert.alert(
        language === 'vi' ? 'Yêu cầu đăng nhập' : 'Login Required',
        language === 'vi' 
          ? 'Vui lòng đăng nhập để trò chuyện với trợ lý hỗ trợ 3Ship.' 
          : 'Please log in to chat with 3Ship assistant.',
        [
          { text: language === 'vi' ? 'Hủy' : 'Cancel', style: 'cancel' },
          { text: language === 'vi' ? 'Đăng nhập' : 'Log In', onPress: () => router.push('/(auth)/login') }
        ]
      );
      return;
    }
    router.push('/profile/chat');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // Chỉ nhận diện di chuyển kéo thả khi dịch chuyển lớn hơn 2 pixel
        return Math.abs(gestureState.dx) > 2 || Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: (pan.x as any)._value,
          y: (pan.y as any)._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        pan.flattenOffset();

        let targetX = (pan.x as any)._value;
        let targetY = (pan.y as any)._value;

        const minX = 10;
        const maxX = screenWidth - BUBBLE_SIZE - 10;
        const minY = 50; // Tránh Header
        const maxY = screenHeight - BUBBLE_SIZE - 100; // Tránh TabBar

        if (targetX < minX) targetX = minX;
        if (targetX > maxX) targetX = maxX;
        if (targetY < minY) targetY = minY;
        if (targetY > maxY) targetY = maxY;

        // Tự động "hít" về mép trái hoặc phải gần nhất
        const middle = screenWidth / 2;
        const finalX = targetX < middle ? minX : maxX;

        Animated.parallel([
          Animated.spring(pan.x, {
            toValue: finalX,
            useNativeDriver: false,
            tension: 40,
            friction: 7,
          }),
          Animated.spring(pan.y, {
            toValue: targetY,
            useNativeDriver: false,
            tension: 40,
            friction: 7,
          }),
        ]).start();

        // Nhận diện click/tap: Nếu di chuyển rất ít thì coi là click
        const distance = Math.sqrt(gestureState.dx * gestureState.dx + gestureState.dy * gestureState.dy);
        if (distance < 5) {
          handleChatPress();
        }
      },
    })
  ).current;

  const [promotions, setPromotions] = useState<PromotionModel[]>([]);
  const [foods, setFoods] = useState<FoodModel[]>([]);
  const [branches, setBranches] = useState<BranchModel[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFoodDetail, setSelectedFoodDetail] = useState<FoodModel | null>(null);
  const [selectedPromoDetail, setSelectedPromoDetail] = useState<PromotionModel | null>(null);
  const [selectedBranchDetail, setSelectedBranchDetail] = useState<BranchModel | null>(null);
  const [savedPromoCodes, setSavedPromoCodes] = useState<string[]>([]);
  const [promoImageErrors, setPromoImageErrors] = useState<string[]>([]);
  
  // Extra states
  const [unreadCount, setUnreadCount] = useState(0);

  const addItem = useCartStore((s) => s.addItem);
  const cartItemCount = useCartStore((s) => s.items.reduce((acc, item) => acc + item.quantity, 0));

  const loadData = useCallback(async () => {
    try {
      const [promoRes, foodRes, branchRes] = await Promise.all([
        Api.getAvailablePromotions().catch(() => ({ data: [] as PromotionModel[] })),
        Api.getFoods({ page: 1, size: 6 }).catch(() => ({ data: [] as FoodModel[] })),
        Api.getBranches().catch(() => ({ data: [] as BranchModel[] })),
      ]);
      setPromotions(promoRes.data);
      setFoods((foodRes.data || []).filter((f: any) => f.active !== false));
      setBranches(branchRes.data);

      if (isLoggedIn) {
        // Load notifications unread count (fetch 50 items to align with notification page)
        const notifs = await Api.getMyNotifications(1, 50).catch(() => ({ data: [] }));
        let rawNotifs = notifs.data || [];

        // Check local read IDs from AsyncStorage
        try {
          const readIdsStr = await AsyncStorage.getItem('@read_notification_ids');
          const readIds = readIdsStr ? JSON.parse(readIdsStr) : [];
          if (Array.isArray(readIds) && readIds.length > 0) {
            rawNotifs = rawNotifs.map((n: any) => {
              if (n.id && readIds.includes(n.id)) {
                return { ...n, isRead: true };
              }
              return n;
            });
          }
        } catch {}

        setUnreadCount(rawNotifs.filter((n: any) => !n.isRead).length);
      } else {
        setUnreadCount(0);
      }
    } catch {}
  }, [isLoggedIn]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  useEffect(() => {
    const loadSavedPromos = async () => {
      if (user?.id) {
        try {
          const stored = await AsyncStorage.getItem(`saved_promotions_${user.id}`);
          if (stored) {
            setSavedPromoCodes(JSON.parse(stored));
          } else {
            setSavedPromoCodes([]);
          }
        } catch {
          setSavedPromoCodes([]);
        }
      } else {
        setSavedPromoCodes([]);
      }
    };
    loadSavedPromos();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleAddToCart = (food: FoodModel) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để thêm món ăn vào giỏ hàng và sử dụng đầy đủ dịch vụ.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => {
            setSelectedFoodDetail(null);
            router.push('/(auth)/login');
          }}
        ]
      );
      return;
    }
    addItem(food);
    Alert.alert('Thành công', `Đã thêm món "${food.name}" vào giỏ hàng!`);
  };



  const handleSavePromoCode = async (code: string) => {
    if (!isLoggedIn) {
      Alert.alert(
        'Yêu cầu đăng nhập',
        'Vui lòng đăng nhập để lưu mã khuyến mãi này vào ví của bạn.',
        [
          { text: 'Hủy', style: 'cancel' },
          { text: 'Đăng nhập', onPress: () => {
            setSelectedPromoDetail(null);
            router.push('/(auth)/login');
          }}
        ]
      );
      return;
    }
    
    if (savedPromoCodes.includes(code)) {
      Alert.alert('Thông báo', 'Bạn đã lưu mã khuyến mãi này rồi.');
      return;
    }

    try {
      const updated = [...savedPromoCodes, code];
      setSavedPromoCodes(updated);
      if (user?.id) {
        await AsyncStorage.setItem(`saved_promotions_${user.id}`, JSON.stringify(updated));
      }
      Alert.alert('Thành công', 'Đã lưu mã khuyến mãi vào ví của bạn!');
    } catch {
      Alert.alert('Thất bại', 'Không thể lưu mã khuyến mãi lúc này. Vui lòng thử lại sau.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, color: isDarkMode ? '#A1A1AA' : '#71717A', fontWeight: '600', letterSpacing: 0.5 }}>
              {t('welcome')}
            </Text>
            {isLoggedIn && (
              <Text style={{ fontSize: 24, fontWeight: '800', color: colors.text, marginTop: 4, letterSpacing: -0.5 }}>
                {user?.name ?? (language === 'vi' ? 'Khách quý' : 'Guest')}
              </Text>
            )}
            <Text style={[styles.headerSub, { color: colors.textSecondary, marginTop: 6, fontSize: 13 }]}>
              {language === 'vi' ? 'Hãy khám phá thực đơn hôm nay' : 'Discover our menu today'}
            </Text>
          </View>
          
          {/* Action Row */}
          <View style={styles.headerActionRow}>
            {/* Notification icon */}
            <TouchableOpacity
              onPress={() => isLoggedIn ? router.push('/profile/notifications') : router.push('/(auth)/login')}
              style={[styles.headerIconBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
            >
              <Ionicons name="notifications-outline" size={22} color={colors.text} />
              {unreadCount > 0 && (
                <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* User Icon */}
            <TouchableOpacity
              onPress={() => isLoggedIn ? router.push('/(tabs)/user') : router.push('/(auth)/login')}
              style={[styles.headerIconBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFFFFF' }]}
            >
              <Ionicons name="person-outline" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Promotions Carousel */}
        {promotions.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>🎉 {t('dealsForYou')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {promotions.map((promo) => (
                <TouchableOpacity key={promo.id} style={[styles.promoCard, { backgroundColor: colors.card }]} onPress={() => setSelectedPromoDetail(promo)}>
                  {promo.displayImageUrl && !promoImageErrors.includes(promo.id) ? (
                    <Image
                      source={{ uri: promo.displayImageUrl }}
                      style={styles.promoImage}
                      resizeMode="cover"
                      onError={() => {
                        setPromoImageErrors((prev) => [...prev, promo.id]);
                      }}
                    />
                  ) : (
                    <View style={[styles.promoImage, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FCE4EC', justifyContent: 'center', alignItems: 'center' }]}>
                      <Ionicons name="gift" size={40} color={colors.primary} />
                    </View>
                  )}
                  <View style={styles.promoContent}>
                    <Text style={[styles.promoName, { color: colors.text }]} numberOfLines={1}>{translateDbText(promo.name)}</Text>
                    <Text style={[styles.promoDiscount, { color: colors.primary }]}>
                      {language === 'vi' ? `Giảm ${promo.discountPercent}%` : `Discount ${promo.discountPercent}%`}
                    </Text>
                    <Text style={[styles.promoCode, { color: colors.textSecondary }]}>{t('code')}: {promo.code}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Branches */}
        {branches.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>📍 {t('branches')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
              {branches.map((branch) => (
                <TouchableOpacity key={branch.id} style={[styles.branchCard, { backgroundColor: colors.card }]} onPress={() => setSelectedBranchDetail(branch)}>
                  <Ionicons name="storefront" size={32} color={colors.primary} />
                  <Text style={[styles.branchName, { color: colors.text }]} numberOfLines={1}>{translateDbText(branch.name)}</Text>
                  <Text style={[styles.branchAddress, { color: colors.textSecondary }]} numberOfLines={2}>{translateDbText(branch.address)}</Text>
                  <Text style={[styles.branchTime, { color: colors.primary }]}>
                    {branch.openTime && branch.closeTime ? `${branch.openTime} - ${branch.closeTime}` : (language === 'vi' ? 'Liên hệ' : 'Contact')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Popular Foods */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, paddingHorizontal: 0, marginBottom: 0 }]}>🔥 {t('featuredDishes')}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/food')}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>{t('viewAll')} →</Text>
            </TouchableOpacity>
          </View>
          {foods.map((food) => {
            const soldCount = (food.ratingCount ?? 0) * 3 + 2;
            const isBestSeller = soldCount >= 10 || (food.avgRating != null && food.avgRating >= 4.5);
            return (
              <TouchableOpacity key={food.id} style={[styles.foodCard, { backgroundColor: colors.card }]} onPress={() => setSelectedFoodDetail(food)}>
                <View style={{ position: 'relative' }}>
                  <FoodImage uri={food.imageUrl} size={80} />
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
                        <Text style={{ fontSize: 12, lineHeight: 14 }}>⭐</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                <View style={styles.foodInfo}>
                  <Text style={[styles.foodName, { color: colors.text }]} numberOfLines={1}>{translateDbText(food.name)}</Text>
                  <Text style={[styles.foodDesc, { color: colors.textSecondary }]} numberOfLines={2}>{food.description}</Text>
                  <View style={styles.foodRow}>
                    <Text style={[styles.foodPrice, { color: colors.primary }]}>{formatVnd(food.price)}</Text>
                    {food.avgRating != null && (
                      <View style={styles.ratingRow}>
                        <StarRating rating={food.avgRating} size={14} />
                        <Text style={[styles.ratingText, { color: colors.textSecondary }]}>({food.ratingCount ?? 0})</Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Reusable Food Detail Modal */}
      <FoodDetailModal
        visible={!!selectedFoodDetail}
        food={selectedFoodDetail}
        onClose={() => setSelectedFoodDetail(null)}
        isLoggedIn={isLoggedIn}
        onAddToCart={handleAddToCart}
      />

      {/* Promotion Detail Modal */}
      {selectedPromoDetail && (
        <Modal
          visible={!!selectedPromoDetail}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedPromoDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              {/* Header with back/close button */}
              <View style={[styles.modalHeader, { borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{t('promoDetail')}</Text>
                <TouchableOpacity onPress={() => setSelectedPromoDetail(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Large Promo Image */}
                 {selectedPromoDetail.displayImageUrl && !promoImageErrors.includes(selectedPromoDetail.id) ? (
                  <Image
                    source={{ uri: selectedPromoDetail.displayImageUrl }}
                    style={styles.promoDetailImage}
                    resizeMode="cover"
                    onError={() => {
                      setPromoImageErrors((prev) => [...prev, selectedPromoDetail.id]);
                    }}
                  />
                ) : (
                  <View style={[styles.promoDetailPlaceholder, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FCE4EC' }]}>
                    <Ionicons name="gift-outline" size={64} color={colors.primary} />
                  </View>
                )}

                {/* Promo Details Info */}
                <View style={styles.modalInfoContainer}>
                  <Text style={[styles.promoDetailName, { color: colors.text }]}>{translateDbText(selectedPromoDetail.name)}</Text>
                  
                  <View style={styles.promoDetailBadges}>
                    <View style={[styles.promoDetailBadge, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF3E0' }]}>
                      <Text style={[styles.promoDetailBadgeText, { color: colors.primary }]}>
                        {language === 'vi' ? `Giảm ${selectedPromoDetail.discountPercent}%` : `Discount ${selectedPromoDetail.discountPercent}%`}
                      </Text>
                    </View>
                    <View style={[styles.promoDetailBadge, { backgroundColor: selectedPromoDetail.hasStock ? (isDarkMode ? '#1B5E20' : '#E8F5E9') : (isDarkMode ? '#B71C1C' : '#FFEBEE') }]}>
                      <Text style={[styles.promoDetailBadgeText, { color: selectedPromoDetail.hasStock ? '#4CAF50' : '#F44336' }]}>
                        {selectedPromoDetail.hasStock 
                          ? (language === 'vi' ? `Còn lại: ${selectedPromoDetail.remaining}` : `Remaining: ${selectedPromoDetail.remaining}`)
                          : t('promoOutOfStock')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  <Text style={[styles.modalSectionLabel, { color: colors.text }]}>{t('promoDescTitle')}</Text>
                  <Text style={[styles.modalFoodDesc, { color: colors.textSecondary }]}>
                    {translateDbText(selectedPromoDetail.description) || (language === 'vi' ? 'Chương trình khuyến mãi đặc biệt dành riêng cho khách hàng của 3Ship.' : 'Special promotion program for 3Ship customers.')}
                  </Text>

                  {/* Promotion Code Box */}
                  <Text style={[styles.modalSectionLabel, { marginTop: 16, color: colors.text }]}>{t('promoCodeTitle')}</Text>
                  <View style={[styles.codeContainer, { borderColor: colors.primary, backgroundColor: isDarkMode ? '#2C2C2E' : '#FFEBEE' }]}>
                    <Text style={[styles.codeText, { color: colors.primary }]}>{selectedPromoDetail.code}</Text>
                  </View>

                  {/* Dates */}
                  {(selectedPromoDetail.startDate || selectedPromoDetail.endDate) && (
                    <View style={styles.dateRow}>
                      <Ionicons name="calendar-outline" size={16} color={colors.textSecondary} />
                      <Text style={[styles.dateText, { color: colors.textSecondary }]}>
                        {t('durationLabel')}: {selectedPromoDetail.startDate || (language === 'vi' ? 'Bắt đầu' : 'Start')} - {selectedPromoDetail.endDate || (language === 'vi' ? 'Kết thúc' : 'End')}
                      </Text>
                    </View>
                  )}
                </View>
              </ScrollView>

              {/* Action Footer */}
              <View style={[styles.modalFooter, { borderColor: colors.border, backgroundColor: colors.card }]}>
                {savedPromoCodes.includes(selectedPromoDetail.code) ? (
                  <View style={[styles.modalAddBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#ECEFF1', borderWidth: 1, borderColor: colors.border }]}>
                    <Ionicons name="checkmark-circle-outline" size={20} color="#78909C" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalAddBtnText, { color: '#78909C' }]}>{t('promoSaved')}</Text>
                  </View>
                ) : !selectedPromoDetail.hasStock ? (
                  <View style={[styles.modalAddBtn, { backgroundColor: isDarkMode ? '#2C2C2E' : '#ECEFF1' }]}>
                    <Ionicons name="alert-circle-outline" size={20} color="#78909C" style={{ marginRight: 8 }} />
                    <Text style={[styles.modalAddBtnText, { color: '#78909C' }]}>{t('promoOutOfStock')}</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.modalAddBtn, { backgroundColor: colors.primary }]}
                    onPress={() => {
                      handleSavePromoCode(selectedPromoDetail.code);
                    }}
                  >
                    <Ionicons name="download-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.modalAddBtnText}>{t('savePromoBtn')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Branch Detail Modal */}
      {selectedBranchDetail && (
        <Modal
          visible={!!selectedBranchDetail}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSelectedBranchDetail(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
              {/* Header with back/close button */}
              <View style={[styles.modalHeader, { borderColor: colors.border }]}>
                <Text style={[styles.modalTitle, { color: colors.text }]} numberOfLines={1}>{t('branchDetail')}</Text>
                <TouchableOpacity onPress={() => setSelectedBranchDetail(null)} style={styles.closeBtn}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                {/* Branch Image or Placeholder */}
                {selectedBranchDetail.displayImageUrl ? (
                  <Image source={{ uri: selectedBranchDetail.displayImageUrl }} style={styles.branchDetailImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.branchDetailPlaceholder, { backgroundColor: isDarkMode ? '#2C2C2E' : '#F3E7E4' }]}>
                    <Ionicons name="storefront-outline" size={64} color={colors.primary} />
                  </View>
                )}

                {/* Info Container */}
                <View style={styles.modalInfoContainer}>
                  <Text style={[styles.branchDetailName, { color: colors.text }]}>{translateDbText(selectedBranchDetail.name)}</Text>
                  
                  {/* Status badge: Opening hours */}
                  <View style={styles.branchDetailBadges}>
                    <View style={[styles.branchDetailBadge, { backgroundColor: isDarkMode ? '#2C2C2E' : '#FFF3E0' }]}>
                      <Ionicons name="time" size={14} color={colors.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.branchDetailBadgeText, { color: colors.primary }]}>
                        {selectedBranchDetail.openTime && selectedBranchDetail.closeTime
                          ? `${selectedBranchDetail.openTime} - ${selectedBranchDetail.closeTime}`
                          : (language === 'vi' ? 'Liên hệ' : 'Contact')}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.divider, { backgroundColor: colors.border }]} />

                  {/* Intro/Description */}
                  <Text style={[styles.modalSectionLabel, { color: colors.text }]}>{t('branchIntro')}</Text>
                  <Text style={[styles.modalFoodDesc, { color: colors.textSecondary }]}>
                    {language === 'vi' 
                      ? `Chào mừng bạn đến với ${translateDbText(selectedBranchDetail.name)}. Chi nhánh của chúng tôi sở hữu không gian ẩm thực sang trọng, ấm cúng cùng đội ngũ đầu bếp chuyên nghiệp hàng đầu, mang lại trải nghiệm ẩm thực trọn vẹn nhất cho quý khách.` 
                      : `Welcome to ${translateDbText(selectedBranchDetail.name)}. Our branch features a luxurious, cozy dining space and a team of top professional chefs, bringing the most complete culinary experience to our guests.`}
                  </Text>

                  {/* Phone & Address */}
                  <View style={[styles.detailContactSection, { backgroundColor: isDarkMode ? '#121212' : '#F9F5F4' }]}>
                    <Text style={[styles.modalSectionLabel, { color: colors.text }]}>{t('contactInfo')}</Text>
                    
                    {/* Address Line */}
                    <View style={styles.contactItemRow}>
                      <Ionicons name="location" size={20} color={colors.primary} style={styles.contactItemIcon} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactItemLabel, { color: colors.textSecondary }]}>{t('addressLabel')}</Text>
                        <Text style={[styles.contactItemValue, { color: colors.text }]}>{translateDbText(selectedBranchDetail.address)}</Text>
                      </View>
                    </View>

                    {/* Phone Line */}
                    <View style={styles.contactItemRow}>
                      <Ionicons name="call" size={20} color={colors.primary} style={styles.contactItemIcon} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.contactItemLabel, { color: colors.textSecondary }]}>{t('hotlineLabel')}</Text>
                        <Text style={[styles.contactItemValue, { color: colors.text }]}>{selectedBranchDetail.phone}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </ScrollView>

              {/* Action Buttons Footer */}
              <View style={[styles.branchModalFooter, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TouchableOpacity
                  style={[styles.branchFooterBtn, styles.callBtn]}
                  onPress={() => {
                    Linking.openURL(`tel:${selectedBranchDetail.phone}`).catch(() => {
                      Alert.alert(t('errorTitle'), t('callError'));
                    });
                  }}
                >
                  <Ionicons name="call-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.branchFooterBtnText}>{t('callHotlineBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchFooterBtn, styles.mapBtn, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    const url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedBranchDetail.address)}`;
                    Linking.openURL(url).catch(() => {
                      Alert.alert(t('errorTitle'), t('mapError'));
                    });
                  }}
                >
                  <Ionicons name="map-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.branchFooterBtnText}>{t('getDirectionsBtn')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.branchFooterBtn, styles.bookBtn]}
                  onPress={() => {
                    setSelectedBranchDetail(null);
                    router.push('/booking/new');
                  }}
                >
                  <Ionicons name="calendar-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={styles.branchFooterBtnText}>{t('bookTableNowBtn')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Floating Chat Bubble for 3Ship Assistant */}
      <Animated.View
        style={[
          styles.chatBubble,
          {
            transform: pan.getTranslateTransform(),
            backgroundColor: colors.primary,
          },
        ]}
        {...panResponder.panHandlers}
      >
        <Ionicons name="chatbubbles" size={28} color="#FFF" />
        <View style={styles.pulseContainer}>
          <View style={styles.pulseDot} />
        </View>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: AppColors.background,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  greeting: { fontSize: 22, fontWeight: 'bold', color: AppColors.textPrimary },
  headerSub: { fontSize: 14, color: AppColors.textSecondary, marginTop: 4 },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
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
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: AppColors.textPrimary, paddingHorizontal: 20, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 12 },
  seeAll: { fontSize: 14, color: AppColors.textLink, fontWeight: '600' },
  // Promotions
  promoCard: {
    width: width * 0.7, backgroundColor: '#fff', borderRadius: 16,
    marginRight: 12, overflow: 'hidden', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
  },
  promoImage: { width: '100%', height: 120 },
  promoContent: { padding: 12 },
  promoName: { fontSize: 16, fontWeight: 'bold', color: AppColors.textPrimary },
  promoDiscount: { fontSize: 14, color: AppColors.primary, fontWeight: '600', marginTop: 4 },
  promoCode: { fontSize: 12, color: AppColors.textSecondary, marginTop: 2 },
  // Branches
  branchCard: {
    width: 160, backgroundColor: '#fff', borderRadius: 14, padding: 14,
    marginRight: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  branchName: { fontSize: 14, fontWeight: 'bold', color: AppColors.textPrimary, marginTop: 8 },
  branchAddress: { fontSize: 12, color: AppColors.textSecondary, textAlign: 'center', marginTop: 4 },
  branchTime: { fontSize: 11, color: AppColors.primary, marginTop: 4 },
  // Foods
  foodCard: {
    flexDirection: 'row', backgroundColor: '#fff', borderRadius: 14, padding: 12,
    marginHorizontal: 20, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  foodInfo: { flex: 1, marginLeft: 12, justifyContent: 'center' },
  foodName: { fontSize: 16, fontWeight: '600', color: AppColors.textPrimary },
  foodDesc: { fontSize: 13, color: AppColors.textSecondary, marginTop: 4 },
  foodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  foodPrice: { fontSize: 16, fontWeight: 'bold', color: AppColors.primary },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingText: { fontSize: 12, color: AppColors.textSecondary },
  heartBtn: { padding: 8 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '85%',
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: AppColors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingBottom: 24,
  },
  modalImage: {
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  modalInfoContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  modalFoodName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  modalCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#EBF5FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 8,
  },
  modalCategoryText: {
    fontSize: 12,
    color: AppColors.primary,
    fontWeight: '600',
  },
  modalFoodPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.primary,
    marginTop: 12,
  },
  modalRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  modalRatingText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: AppColors.border,
    marginVertical: 16,
  },
  modalSectionLabel: {
    fontSize: 15,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
    marginBottom: 6,
  },
  modalFoodDesc: {
    fontSize: 14,
    color: AppColors.textSecondary,
    lineHeight: 20,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: '#fff',
  },
  modalAddBtn: {
    backgroundColor: AppColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAddBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  promoDetailImage: {
    width: '90%',
    height: 160,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  promoDetailPlaceholder: {
    width: '90%',
    height: 160,
    backgroundColor: '#FCE4EC',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  promoDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  promoDetailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  promoDetailBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  promoDetailBadgeText: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: 'bold',
  },
  codeContainer: {
    borderWidth: 2,
    borderColor: AppColors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: '#FFEBEE',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  codeText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: AppColors.primary,
    letterSpacing: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  dateText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  branchDetailImage: {
    width: '90%',
    height: 160,
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  branchDetailPlaceholder: {
    width: '90%',
    height: 160,
    backgroundColor: '#F3E7E4',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 20,
    borderRadius: 16,
  },
  branchDetailName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.textPrimary,
  },
  branchDetailBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  branchDetailBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  branchDetailBadgeText: {
    fontSize: 12,
    color: AppColors.warning,
    fontWeight: 'bold',
  },
  detailContactSection: {
    marginTop: 18,
    backgroundColor: '#F9F5F4',
    padding: 14,
    borderRadius: 12,
  },
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
  },
  contactItemIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  contactItemLabel: {
    fontSize: 12,
    color: AppColors.textSecondary,
    fontWeight: '500',
  },
  contactItemValue: {
    fontSize: 14,
    color: AppColors.textPrimary,
    fontWeight: '600',
    marginTop: 2,
  },
  branchModalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderTopWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: '#fff',
    gap: 8,
  },
  branchFooterBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchFooterBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  callBtn: {
    backgroundColor: AppColors.success,
  },
  mapBtn: {
    backgroundColor: AppColors.primary,
  },
  bookBtn: {
    backgroundColor: '#FF9800',
  },
  starAbsolute: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 10,
  },
  starContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  chatBubble: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    zIndex: 9999,
  },
  pulseContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 14,
    height: 14,
    backgroundColor: '#fff',
    borderRadius: 7,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
});
