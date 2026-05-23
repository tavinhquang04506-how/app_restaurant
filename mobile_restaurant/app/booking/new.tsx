import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, TextInput, Alert, Platform, Modal, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeStore } from '../../stores/useThemeStore';
import { useLanguageStore, translateDbText } from '../../stores/useLanguageStore';
import * as Api from '../../repositories/ApiRepository';
import type { BranchModel } from '../../models/BranchModels';

export default function NewBookingScreen() {
  const router = useRouter();
  const { isLoggedIn, setBooking, setBookingStepRoute } = useAuth();
  const { colors, isDarkMode } = useThemeStore();
  const { t, language } = useLanguageStore();

  const [branches, setBranches] = useState<BranchModel[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<BranchModel | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [guests, setGuests] = useState('2');
  const [specialRequest, setSpecialRequest] = useState('');
  const [error, setError] = useState('');

  // Branch Selector Modal state
  const [isBranchModalVisible, setIsBranchModalVisible] = useState(false);

  // Time Picker Modal states
  const [isTimePickerVisible, setIsTimePickerVisible] = useState(false);
  const [tempHour, setTempHour] = useState('18');
  const [tempMinute, setTempMinute] = useState('30');


  // Generate lists for Hour & Minute
  const hourOptions = Array.from({ length: 13 }, (_, i) => String(i + 9).padStart(2, '0')); // 09 to 21
  const minuteOptions = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')); // 00 to 55 in steps of 5

  // Helper: check if a date string (YYYY-MM-DD) is today
  const isToday = (dateStr: string) => {
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return dateStr === todayStr;
  };


  // Filter valid hour options based on selected date
  const getFilteredHourOptions = () => {
    const maxHour = 21; // Last bookable hour is 21:55
    if (date && isToday(date)) {
      const now = new Date();
      const minHour = now.getHours() + 1; // current hour + 1 to cover 60min + buffer
      return hourOptions.filter((h) => {
        const hr = parseInt(h, 10);
        return hr >= minHour && hr <= maxHour;
      });
    }
    return hourOptions.filter((h) => parseInt(h, 10) <= maxHour);
  };

  // Filter valid minute options based on selected date and selected hour
  const getFilteredMinuteOptions = (selectedHour: string) => {
    const hr = parseInt(selectedHour, 10);
    if (date && isToday(date)) {
      const now = new Date();
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const minBookingMinutes = nowMinutes + 60; // 60 minutes from now
      return minuteOptions.filter((m) => {
        const totalMinutes = hr * 60 + parseInt(m, 10);
        return totalMinutes >= minBookingMinutes;
      });
    }
    return minuteOptions;
  };

  const filteredHourOptions = getFilteredHourOptions();
  const filteredMinuteOptions = getFilteredMinuteOptions(tempHour);

  // Set booking progress on mount
  useEffect(() => {
    if (isLoggedIn) {
      setBookingStepRoute('/booking/new');
    }
  }, [isLoggedIn, setBookingStepRoute]);

  useEffect(() => {
    Api.getBranches()
      .then((res) => {
        if (res && res.data) {
          setBranches(res.data);
          // Auto select first branch if available
          if (res.data.length > 0) {
            setSelectedBranch(res.data[0]);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Generate date suggestions (next 14 days for scrollable calendar strip)
  const dateSuggestions = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    // check if current time is past 20:55 (last bookable time 21:55 - 1 hour)
    const currentMinutes = d.getHours() * 60 + d.getMinutes();
    const isTodayExpired = currentMinutes >= (20 * 60 + 55);
    const startOffset = isTodayExpired ? 1 : 0;

    d.setDate(d.getDate() + startOffset + i);
    
    let dayName = '';
    if (startOffset + i === 0) {
      dayName = language === 'vi' ? 'H.Nay' : 'Today';
    } else {
      const weekdays = language === 'vi'
        ? ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
        : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      dayName = weekdays[d.getDay()];
    }
    
    return {
      dayName,
      dayNum: String(d.getDate()).padStart(2, '0'),
      monthStr: language === 'vi' ? `Thg ${d.getMonth() + 1}` : d.toLocaleDateString('en-US', { month: 'short' }),
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    };
  });

  // Auto select today if date is empty
  useEffect(() => {
    if (dateSuggestions.length > 0 && !date) {
      setDate(dateSuggestions[0].value);
    }
  }, [date]);

  // When date changes, auto-clear time if the currently selected time is no longer valid
  useEffect(() => {
    if (time && date) {
      const parts = time.split(':');
      if (parts.length === 2) {
        const hr = parts[0];
        const mn = parts[1];
        const validHours = getFilteredHourOptions();
        if (!validHours.includes(hr)) {
          setTime('');
          return;
        }
        const validMinutes = getFilteredMinuteOptions(hr);
        if (!validMinutes.includes(mn)) {
          setTime('');
        }
      }
    }
  }, [date]);

  const handleNext = () => {
    setError('');
    if (!selectedBranch) {
      setError(language === 'vi' ? 'Vui lòng chọn chi nhánh' : 'Please select a branch');
      return;
    }
    if (!date) {
      setError(language === 'vi' ? 'Vui lòng chọn ngày' : 'Please select a date');
      return;
    }
    if (!time) {
      setError(language === 'vi' ? 'Vui lòng chọn giờ đặt bàn' : 'Please select a time');
      return;
    }
    // Check that full booking datetime is at least 60 minutes in the future
    const [bookHour, bookMinute] = time.split(':').map(Number);
    const bookingDt = new Date(`${date}T${String(bookHour).padStart(2, '0')}:${String(bookMinute).padStart(2, '0')}:00`);
    const now60 = new Date(Date.now() + 60 * 60 * 1000);
    if (bookingDt < now60) {
      setError(language === 'vi'
        ? 'Thời gian đặt bàn phải trước ít nhất 1 giờ so với hiện tại'
        : 'Booking time must be at least 1 hour in advance from now');
      return;
    }
    const guestCount = parseInt(guests, 10);
    if (!guestCount || guestCount < 1 || guestCount > 8) {
      setError(language === 'vi' ? 'Số khách từ 1-8 người' : 'Guests must be between 1-8 people');
      return;
    }

    setBooking({
      branch: selectedBranch.name,
      branchId: selectedBranch.id,
      date,
      time,
      guestCount,
      specialRequest,
      durationMinutes: 120,
    });

    router.push('/booking/select-table');
  };

  const handleBack = () => {
    setBookingStepRoute(null);
    router.replace('/(tabs)/booking');
  };

  const handleApplyTime = () => {
    setTime(`${tempHour}:${tempMinute}`);
    setIsTimePickerVisible(false);
  };

  if (!isLoggedIn) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>{t('tabBooking')}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {language === 'vi' ? 'Vui lòng đăng nhập để đặt bàn' : 'Please log in to book a table'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.card }]}>
        <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {language === 'vi' ? 'Đặt bàn mới' : 'New Booking'}
        </Text>
        {/* Reset / Quit booking process */}
        <TouchableOpacity onPress={() => { setBookingStepRoute(null); router.replace('/(tabs)/booking'); }} style={styles.quitBtn}>
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>
            {language === 'vi' ? 'Hủy bỏ' : 'Cancel'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false}>
        {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}

        {/* Branch Selection Dropdown Trigger */}
        <Text style={[styles.label, { color: colors.text }]}>📍 {t('selectBranch')}</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => setIsBranchModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownLeft}>
            <Ionicons name="storefront" size={20} color={colors.primary} />
            <View style={{ gap: 2, flex: 1, paddingRight: 10 }}>
              <Text style={[styles.dropdownValue, { color: colors.text }]} numberOfLines={1}>
                {selectedBranch ? translateDbText(selectedBranch.name) : (language === 'vi' ? 'Chọn chi nhánh...' : 'Select branch...')}
              </Text>
              {selectedBranch?.address && (
                <Text style={[styles.dropdownSubtext, { color: colors.textSecondary }]} numberOfLines={1}>
                  {selectedBranch.address}
                </Text>
              )}
            </View>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>

        {/* Date Selection (Premium Strip Format) */}
        <Text style={[styles.label, { color: colors.text }]}>📅 {language === 'vi' ? 'Chọn ngày dùng bữa' : 'Select Date'}</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.calendarScroll} 
          contentContainerStyle={{ paddingRight: 20, paddingBottom: 4 }}
        >
          {dateSuggestions.map((d) => {
            const isSelected = date === d.value;
            return (
              <TouchableOpacity
                key={d.value}
                style={[
                  styles.calendarCard,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  isSelected && { 
                    backgroundColor: colors.primary, 
                    borderColor: colors.primary,
                    shadowColor: colors.primary,
                    shadowOpacity: 0.3,
                    shadowRadius: 6,
                    elevation: 4
                  }
                ]}
                onPress={() => setDate(d.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.calendarDayName, { color: colors.textSecondary }, isSelected && { color: 'rgba(255,255,255,0.8)', fontWeight: '600' }]}>
                  {d.dayName}
                </Text>
                <Text style={[styles.calendarDayNum, { color: colors.text }, isSelected && { color: '#fff', fontWeight: 'bold' }]}>
                  {d.dayNum}
                </Text>
                <Text style={[styles.calendarMonth, { color: colors.textSecondary }, isSelected && { color: 'rgba(255,255,255,0.8)' }]}>
                  {d.monthStr}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Time Selector Dropdown Trigger */}
        <Text style={[styles.label, { color: colors.text }]}>🕐 {language === 'vi' ? 'Chọn giờ đặt bàn' : 'Select Booking Time'}</Text>
        <TouchableOpacity
          style={[styles.dropdownTrigger, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {
            let defaultHour = tempHour;
            let defaultMinute = tempMinute;
            if (time) {
              const parts = time.split(':');
              if (parts.length === 2) {
                defaultHour = parts[0];
                defaultMinute = parts[1];
              }
            }
            
            const validHours = getFilteredHourOptions();
            if (validHours.length > 0) {
              if (!validHours.includes(defaultHour)) {
                defaultHour = validHours[0];
              }
              const validMinutes = getFilteredMinuteOptions(defaultHour);
              if (validMinutes.length > 0 && !validMinutes.includes(defaultMinute)) {
                defaultMinute = validMinutes[0];
              }
            }
            setTempHour(defaultHour);
            setTempMinute(defaultMinute);
            setIsTimePickerVisible(true);
          }}
          activeOpacity={0.8}
        >
          <View style={styles.dropdownLeft}>
            <Ionicons name="time" size={20} color={colors.primary} />
            <Text style={[styles.dropdownValue, { color: time ? colors.text : colors.textSecondary }]}>
              {time ? (language === 'vi' ? `Khung giờ: ${time}` : `Time Slot: ${time}`) : (language === 'vi' ? 'Nhấn để chọn giờ đặt bàn...' : 'Tap to select booking time...')}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
        <Text style={[styles.hintText, { color: colors.textSecondary, marginTop: 6, marginBottom: 12 }]}>
          {language === 'vi' ? '💡 Đặt bàn cần trước ít nhất 1 giờ' : '💡 Booking requires at least 1 hour advance notice'}
        </Text>

        {/* Guests Selector Stepper */}
        <Text style={[styles.label, { color: colors.text }]}>👥 {t('numGuests')} ({t('maxGuestsLimit')})</Text>
        <View style={styles.guestRow}>
          <TouchableOpacity
            style={[styles.guestBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setGuests(String(Math.max(1, parseInt(guests, 10) - 1)))}
            activeOpacity={0.8}
          >
            <Ionicons name="remove" size={22} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.guestCount, { color: colors.text }]}>{guests}</Text>
          <TouchableOpacity
            style={[styles.guestBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setGuests(String(Math.min(8, parseInt(guests, 10) + 1)))}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Special Request */}
        <Text style={[styles.label, { color: colors.text }]}>📝 {t('notes')} ({language === 'vi' ? 'không bắt buộc' : 'optional'})</Text>
        <TextInput
          style={[
            styles.textArea,
            { backgroundColor: colors.card, borderColor: colors.border, color: colors.text }
          ]}
          value={specialRequest}
          onChangeText={setSpecialRequest}
          placeholder={language === 'vi' ? 'VD: Bàn gần cửa sổ, sinh nhật...' : 'e.g. Table near window, birthday...'}
          placeholderTextColor={isDarkMode ? '#888' : '#9E9E9E'}
          multiline
          numberOfLines={3}
        />

        {/* Next Button */}
        <TouchableOpacity
          style={[styles.nextBtn, { backgroundColor: colors.primary }]}
          onPress={handleNext}
        >
          <Text style={styles.nextBtnText}>
            {language === 'vi' ? 'Tiếp tục chọn bàn' : 'Continue to select table'}
          </Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Elegant Scrollable Custom Hour/Minute Wheel Picker Modal */}
      <Modal
        visible={isTimePickerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsTimePickerVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, height: 440 }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'vi' ? 'Chọn Giờ Đặt Bàn' : 'Select Reservation Time'}
              </Text>
              <TouchableOpacity onPress={() => setIsTimePickerVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={{ flex: 1, paddingTop: 10 }}>
              <View style={[styles.pickerColumnsContainer, { borderTopWidth: 0, height: 230 }]}>
                {/* Hour Column */}
                <View style={styles.columnWrapper}>
                  <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>
                    {language === 'vi' ? 'Giờ' : 'Hour'}
                  </Text>
                  <ScrollView 
                    style={styles.pickerColumn} 
                    contentContainerStyle={styles.pickerColumnScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredHourOptions.map((h) => {
                      const isSelected = tempHour === h;
                      return (
                        <TouchableOpacity
                          key={h}
                          style={[
                            styles.pickerOption,
                            isSelected && { backgroundColor: colors.primary + '20', borderRadius: 10 }
                          ]}
                          onPress={() => {
                            setTempHour(h);
                            const validMinutes = getFilteredMinuteOptions(h);
                            if (validMinutes.length > 0 && !validMinutes.includes(tempMinute)) {
                              setTempMinute(validMinutes[0]);
                            }
                          }}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            { color: colors.text },
                            isSelected && { color: colors.primary, fontWeight: 'bold', fontSize: 18 }
                          ]}>
                            {h}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Colon Separator */}
                <View style={styles.colonWrapper}>
                  <Text style={[styles.columnLabel, { color: 'transparent' }]}> </Text>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <Text style={[styles.colonText, { color: colors.text, lineHeight: 32 }]}>:</Text>
                  </View>
                </View>

                {/* Minute Column */}
                <View style={styles.columnWrapper}>
                  <Text style={[styles.columnLabel, { color: colors.textSecondary }]}>
                    {language === 'vi' ? 'Phút' : 'Minute'}
                  </Text>
                  <ScrollView 
                    style={styles.pickerColumn}
                    contentContainerStyle={styles.pickerColumnScroll}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredMinuteOptions.map((m) => {
                      const isSelected = tempMinute === m;
                      return (
                        <TouchableOpacity
                          key={m}
                          style={[
                            styles.pickerOption,
                            isSelected && { backgroundColor: colors.primary + '20', borderRadius: 10 }
                          ]}
                          onPress={() => setTempMinute(m)}
                        >
                          <Text style={[
                            styles.pickerOptionText,
                            { color: colors.text },
                            isSelected && { color: colors.primary, fontWeight: 'bold', fontSize: 18 }
                          ]}>
                            {m}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn, { borderColor: colors.border }]}
                onPress={() => setIsTimePickerVisible(false)}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>
                  {language === 'vi' ? 'Hủy' : 'Cancel'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.applyBtn, { backgroundColor: colors.primary }]}
                onPress={handleApplyTime}
              >
                <Text style={styles.applyBtnText}>
                  {language === 'vi' ? 'Xác nhận' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Branch Selection Modal */}
      <Modal
        visible={isBranchModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBranchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card, height: '70%' }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {language === 'vi' ? 'Chọn Chi Nhánh Nhà Hàng' : 'Select Branch'}
              </Text>
              <TouchableOpacity onPress={() => setIsBranchModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20, gap: 14 }} showsVerticalScrollIndicator={false}>
              {branches.map((b) => {
                const isSelected = selectedBranch?.id === b.id;
                return (
                  <TouchableOpacity
                    key={b.id}
                    style={[
                      styles.branchCard,
                      { backgroundColor: colors.background, borderColor: colors.border },
                      isSelected && { borderColor: colors.primary, borderWidth: 2 }
                    ]}
                    onPress={() => {
                      setSelectedBranch(b);
                      setIsBranchModalVisible(false);
                    }}
                    activeOpacity={0.9}
                  >
                    <View style={styles.branchCardContent}>
                      <View style={{ flex: 1, gap: 4 }}>
                        <Text style={[styles.branchCardName, { color: colors.text }]}>
                          {translateDbText(b.name)}
                        </Text>
                        <Text style={[styles.branchCardAddress, { color: colors.textSecondary }]}>
                          📍 {b.address}
                        </Text>
                        {b.phone && (
                          <Text style={[styles.branchCardPhone, { color: colors.textSecondary }]}>
                            📞 {b.phone}
                          </Text>
                        )}
                        {b.openTime && b.closeTime && (
                          <Text style={[styles.branchCardHours, { color: colors.primary, fontSize: 12, fontWeight: 'bold', marginTop: 4 }]}>
                            🕒 {b.openTime.substring(0, 5)} - {b.closeTime.substring(0, 5)}
                          </Text>
                        )}
                      </View>
                      {isSelected && (
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  quitBtn: { height: 40, justifyContent: 'center', paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: 'bold' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 16 },
  form: { padding: 20 },
  errorBox: { backgroundColor: '#fef2f2', borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: '#E53935', fontSize: 14 },
  label: { fontSize: 16, fontWeight: '600', marginTop: 20, marginBottom: 10 },
  chipScroll: { flexGrow: 0, marginBottom: 8 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  dropdownValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  dropdownSubtext: {
    fontSize: 12,
  },
  calendarScroll: {
    flexGrow: 0,
    marginBottom: 8,
    marginTop: 4,
  },
  calendarCard: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 65,
    height: 90,
    borderRadius: 14,
    borderWidth: 1,
    marginRight: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 3,
    elevation: 1,
  },
  calendarDayName: {
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  calendarDayNum: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  calendarMonth: {
    fontSize: 10,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  timeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: '22%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '600',
  },
  branchCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: '#000',
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  branchCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  branchCardName: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  branchCardAddress: {
    fontSize: 13,
  },
  branchCardPhone: {
    fontSize: 12,
  },
  branchCardHours: {
    fontSize: 12,
  },
  modalSectionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8e8e93',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  hintText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
    marginLeft: 4,
  },
  guestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 24, marginVertical: 8 },
  guestBtn: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center', borderWidth: 1,
  },
  guestCount: { fontSize: 28, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  textArea: {
    borderRadius: 12, padding: 14, fontSize: 15,
    borderWidth: 1, textAlignVertical: 'top', minHeight: 80,
  },
  nextBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, paddingVertical: 16, marginTop: 28,
  },
  nextBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '60%',
    width: '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold' },
  pickerColumnsContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  columnWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  columnLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pickerColumn: {
    width: '100%',
  },
  pickerColumnScroll: {
    paddingBottom: 20,
  },
  pickerOption: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 2,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  colonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  colonText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: { borderWidth: 1 },
  cancelBtnText: { fontSize: 15, fontWeight: '600' },
  applyBtn: { },
  applyBtnText: { color: '#FFF', fontSize: 15, fontWeight: 'bold' },
});
