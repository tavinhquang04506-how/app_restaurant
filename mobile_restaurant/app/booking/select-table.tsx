import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Alert, ScrollView,
  Modal, Platform, StatusBar, BackHandler,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppColors } from '../../styles/AppColors';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';
import type { TableAvailabilityModel } from '../../models/BookingModels';
import { formatTableCode } from '../../utils/Utils';
import { useCartStore } from '../../stores/CartStore';


export default function SelectTableScreen() {
  const router = useRouter();
  const { booking, setBooking, setBookingStepRoute, bookingStepRoute, clearBooking } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const clearCart = useCartStore((s) => s.clearCart);

  const { t, language } = useLanguageStore();

  const [tables, setTables] = useState<TableAvailabilityModel[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCapacityFilter, setSelectedCapacityFilter] = useState<number | 'all'>('all');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);

  useEffect(() => {
    setBookingStepRoute('/booking/select-table');
  }, [setBookingStepRoute]);

  useEffect(() => {
    const backAction = () => {
      clearBooking();
      clearCart();
      setTimeout(() => router.replace('/(tabs)/booking'), 150);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, []);


  // Set default filter based on guest count on mount
  useEffect(() => {
    if (booking?.guestCount) {
      const guests = booking.guestCount;
      let filterVal: number | 'all' = 2;
      if (guests > 6) filterVal = 8;
      else if (guests > 4) filterVal = 6;
      else if (guests > 2) filterVal = 4;
      else filterVal = 2;
      setSelectedCapacityFilter(filterVal);
    }
  }, [booking]);

  useEffect(() => {
    // If the booking session is missing required fields, we cannot load table availability
    if (!booking?.branchId || !booking?.date || !booking?.time) {
      // Only redirect if this screen is the currently active step in the booking process
      if (bookingStepRoute === '/booking/select-table') {
        router.replace('/booking/new');
      }
      return;
    }

    const startISO = `${booking.date}T${booking.time}:00`;
    Api.getTableAvailability({
      branchId: booking.branchId,
      start: startISO,
      guests: booking.guestCount,
      durationMinutes: booking.durationMinutes,
    })
      .then((res) => setTables(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [booking]);

  const handleSelect = (table: TableAvailabilityModel) => {
    if (table.booked) return;
    setSelectedTable(table.tableId);
  };

  const handleConfirm = () => {
    if (!selectedTable || !booking) return;

    const selected = tables.find((t) => t.tableId === selectedTable);
    if (!selected) return;

    setBooking({
      ...booking,
      tableId: selectedTable,
      tableCode: selected.tableCode,
      holdExpiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes hold from now
    });

    router.push('/booking/confirm');
  };

  // Capacity Filters configuration
  const capacityFilters = [
    { label: language === 'vi' ? 'Tất cả' : 'All', value: 'all' as const },
    { label: language === 'vi' ? 'Bàn 2 người' : '2 seats', value: 2 },
    { label: language === 'vi' ? 'Bàn 4 người' : '4 seats', value: 4 },
    { label: language === 'vi' ? 'Bàn 6 người' : '6 seats', value: 6 },
    { label: language === 'vi' ? 'Bàn 8 người' : '8 seats', value: 8 },
  ];

  // Filter & sort tables based on chosen capacity filter
  const filteredTables = tables
    .filter((t) => selectedCapacityFilter === 'all' || t.capacity === selectedCapacityFilter)
    .sort((a, b) => a.tableCode.localeCompare(b.tableCode, undefined, { numeric: true, sensitivity: 'base' }));

  // Helper to determine styling dynamically
  const getStatusStyle = (booked: boolean, isHolding: boolean, selected: boolean) => {
    if (booked) {
      return {
        bgColor: isDarkMode ? '#2e1212' : '#fee2e2',
        borderColor: isDarkMode ? '#7f1d1d' : '#fca5a5',
        textColor: isDarkMode ? '#f87171' : '#dc2626',
        label: language === 'vi' ? 'Đã đặt' : 'Booked',
        icon: 'close-circle-outline' as const,
      };
    }
    if (isHolding) {
      return {
        bgColor: isDarkMode ? '#27272a' : '#f4f4f5',
        borderColor: isDarkMode ? '#3f3f46' : '#e4e4e7',
        textColor: isDarkMode ? '#71717a' : '#a1a1aa',
        label: language === 'vi' ? 'Đang giữ' : 'On Hold',
        icon: 'time-outline' as const,
      };
    }
    if (selected) {
      return {
        bgColor: isDarkMode ? '#382212' : '#ffedd5',
        borderColor: isDarkMode ? '#a24c0c' : '#fdba74',
        textColor: isDarkMode ? '#fb923c' : '#ea580c',
        label: language === 'vi' ? 'Đang chọn' : 'Selecting',
        icon: 'checkmark-circle-outline' as const,
      };
    }
    return {
      bgColor: isDarkMode ? '#112215' : '#eafaf1',
      borderColor: isDarkMode ? '#1b5e20' : '#a7f3d0',
      textColor: isDarkMode ? '#4ade80' : '#059669',
      label: language === 'vi' ? 'Còn trống' : 'Available',
      icon: 'restaurant-outline' as const,
    };
  };

  const renderTable = ({ item }: { item: TableAvailabilityModel }) => {
    const isSelected = selectedTable === item.tableId;
    const isBooked = item.booked;
    const isHolding = booking?.tableId === item.tableId;
    const status = getStatusStyle(isBooked, isHolding, isSelected);

    return (
      <TouchableOpacity
        style={[
          styles.tableCard,
          {
            backgroundColor: status.bgColor,
            borderColor: status.borderColor,
          },
        ]}
        onPress={() => !isBooked && !isHolding && handleSelect(item)}
        disabled={isBooked || isHolding}
        activeOpacity={0.8}
      >
        <View style={styles.tableIcon}>
          <Ionicons
            name={status.icon}
            size={28}
            color={status.textColor}
          />
        </View>
        <Text 
          style={[styles.tableCode, { color: isDarkMode ? '#fff' : '#1c1c1e' }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.7}
        >
          {formatTableCode(item.tableCode, language, true)}
        </Text>
        <Text style={[styles.tableCapacity, { color: colors.textSecondary }]}>
          {item.capacity} {t('seats')}
        </Text>
        <Text style={[styles.tableStatus, { color: status.textColor }]}>
          {status.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={() => { clearBooking(); clearCart(); setTimeout(() => router.replace('/(tabs)/booking'), 150); }} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>{t('selectTable')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Booking Summary */}
      {booking && (
        <View style={[styles.summaryBar, { backgroundColor: isDarkMode ? '#1C1C1E' : '#fff8f0', borderBottomColor: colors.border }]}>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>📍 {booking.branch}</Text>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>📅 {booking.date}</Text>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>🕐 {booking.time}</Text>
          <Text style={[styles.summaryText, { color: colors.textSecondary }]}>👥 {booking.guestCount} {t('guests')}</Text>
        </View>
      )}

      {/* Capacity Filter Bar */}
      <View style={[styles.filterWrapper, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setIsFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.filterLeft}>
            <Ionicons name="funnel-outline" size={18} color={colors.primary} />
            <Text style={[styles.filterText, { color: colors.text }]}>
              {language === 'vi' ? 'Loại bàn: ' : 'Table type: '}
              <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                {capacityFilters.find(f => f.value === selectedCapacityFilter)?.label}
              </Text>
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Filter Selector Modal */}
      <Modal
        visible={isFilterModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsFilterModalVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'vi' ? 'Chọn loại bàn' : 'Select Table Type'}
              </Text>
              <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {capacityFilters.map((filter) => {
                const isActive = selectedCapacityFilter === filter.value;
                return (
                  <TouchableOpacity
                    key={filter.value}
                    style={[
                      styles.modalOption,
                      { borderBottomColor: colors.border },
                      isActive && { backgroundColor: isDarkMode ? '#2c1e15' : '#fff7ed' }
                    ]}
                    onPress={() => {
                      setSelectedCapacityFilter(filter.value);
                      setIsFilterModalVisible(false);
                    }}
                  >
                    <Text style={[
                      styles.modalOptionText,
                      { color: colors.text },
                      isActive && { color: colors.primary, fontWeight: 'bold' }
                    ]}>
                      {filter.label}
                    </Text>
                    {isActive && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('checkingTables')}</Text>
        </View>
      ) : (
        <>
          <FlatList
            data={filteredTables}
            keyExtractor={(item) => item.tableId}
            renderItem={renderTable}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            ListEmptyComponent={
              <View style={styles.center}>
                <Ionicons name="sad-outline" size={48} color={isDarkMode ? '#555' : AppColors.textHint} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {selectedCapacityFilter === 'all'
                    ? (language === 'vi' ? 'Không có bàn trống nào khả dụng' : 'No available tables')
                    : (language === 'vi' ? `Không có bàn ${selectedCapacityFilter} người trống` : `No available ${selectedCapacityFilter}-person tables`)}
                </Text>
                <Text style={[styles.emptyHint, { color: isDarkMode ? '#888' : AppColors.textHint }]}>
                  {t('tryAnotherTime')}
                </Text>
              </View>
            }
          />

          {/* Confirm Button */}
          {selectedTable && (
            <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: colors.primary }]} onPress={handleConfirm}>
                <Text style={styles.confirmBtnText}>{t('confirmSelectedTable')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </>
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
  summaryBar: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 4 },
  summaryText: { fontSize: 13, lineHeight: 18 },
  filterWrapper: { paddingVertical: 10, paddingHorizontal: 16, borderBottomWidth: 1 },
  filterButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1,
  },
  filterLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filterText: { fontSize: 14 },
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontWeight: 'bold' },
  modalList: { paddingHorizontal: 10, paddingVertical: 8 },
  modalOption: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 16, borderBottomWidth: 1, borderRadius: 10,
  },
  modalOptionText: { fontSize: 15 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { fontSize: 14, marginTop: 12 },
  emptyText: { fontSize: 16, marginTop: 12, textAlign: 'center' },
  emptyHint: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  grid: { padding: 16 },
  gridRow: { justifyContent: 'flex-start', gap: 10, marginBottom: 10 },
  tableCard: {
    flex: 1, maxWidth: '31%', borderRadius: 14, padding: 12,
    alignItems: 'center', borderWidth: 2,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
  },
  tableIcon: { marginBottom: 6 },
  tableCode: { fontSize: 15, fontWeight: 'bold' },
  tableCapacity: { fontSize: 12, marginTop: 2 },
  tableStatus: { fontSize: 11, marginTop: 4, fontWeight: 'bold' },
  textWhite: { color: '#fff' },
  bottomBar: { padding: 16, borderTopWidth: 1 },
  confirmBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16,
  },
  confirmBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});

