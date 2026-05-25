import React, { useEffect, useMemo, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { restaurantApi } from '../../services/restaurantApi';
import type {
  Branch,
  BookingRequestPayload,
  TableAvailability,
  Booking,
} from '../../types/types';
import { useToast } from '../../context/ToastContext';
import { formatTableCode } from '../../utils/tableUtils';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_DURATION_MINUTES = 105;

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const isStaffOrManager = user?.role === 'STAFF' || user?.role === 'MANAGER';
  const managedBranchId = isStaffOrManager ? user?.branchId ?? '' : '';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(managedBranchId);
  const [capacityFilter, setCapacityFilter] = useState('');
  const [tables, setTables] = useState<TableAvailability[]>([]);
  const [todayBookings, setTodayBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  
  const getMinBookingTime = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const minTimeMs = Date.now(); // current time
    return new Date(minTimeMs - tzoffset).toISOString().slice(0, 16);
  };

  const [bookingTime, setBookingTime] = useState(getMinBookingTime);
  const [guests, setGuests] = useState(4);
  const [specialRequest, setSpecialRequest] = useState('');

  const { showToast } = useToast();

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const res = await restaurantApi.getBranches();
        setBranches(res);
        if (isStaffOrManager && managedBranchId) {
          setSelectedBranch(managedBranchId);
        } else if (res.length > 0) {
          setSelectedBranch(res[0].id);
        }
      } catch (err) {
        setError('Không thể tải chi nhánh');
        showToast('Không thể tải chi nhánh', 'error');
      }
    };
    fetchBranches();
  }, [isStaffOrManager, managedBranchId, showToast]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!selectedBranch || !bookingTime) return;
      setLoading(true);
      setError(null);
      try {
        const start = new Date(bookingTime).toISOString();
        const availability = await restaurantApi.getTableAvailability({
          branchId: selectedBranch,
          start,
          durationMinutes: DEFAULT_DURATION_MINUTES,
        });
        
        // Also fetch today's bookings for live status overlay
        const todayStr = new Date().toISOString().split('T')[0];
        const allBookings = await restaurantApi.getBookings({ branchId: selectedBranch, date: todayStr }).catch(() => []);
        
        setTables(availability);
        setTodayBookings(allBookings);
      } catch (err) {
        setError('Không thể tải trạng thái bàn');
        showToast('Không thể tải trạng thái bàn', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [bookingTime, selectedBranch, showToast]);

  const filteredTables = useMemo(() => {
    if (!capacityFilter) return tables;
    const capacity = Number(capacityFilter);
    return tables.filter((table) => table.capacity >= capacity);
  }, [tables, capacityFilter]);

  // Separate Tables into VIP & Standard Sections
  const vipTables = useMemo(() => {
    return filteredTables.filter((table) => table.tableCode.toLowerCase().includes('vip'));
  }, [filteredTables]);

  const standardTables = useMemo(() => {
    return filteredTables.filter((table) => !table.tableCode.toLowerCase().includes('vip'));
  }, [filteredTables]);

  const openBookingModal = (table: TableAvailability) => {
    setSelectedTable(table);
    setGuests(Math.min(table.capacity, guests));
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      showToast('Thiếu thông tin bàn', 'error');
      return;
    }

    const payload: BookingRequestPayload = {
      bookingTime: new Date(bookingTime).toISOString(),
      durationMinutes: DEFAULT_DURATION_MINUTES,
      guests,
      specialRequest,
      tableId: selectedTable.tableId,
      branchId: selectedBranch,
    };
    try {
      await restaurantApi.createBooking(payload);
      showToast(`Đặt bàn ${selectedTable.tableCode} thành công`, 'success');
      setBookingModalOpen(false);
      setSpecialRequest('');
      setSelectedTable(null);
      const start = new Date(bookingTime).toISOString();
      const availability = await restaurantApi.getTableAvailability({
        branchId: selectedBranch,
        start,
        durationMinutes: DEFAULT_DURATION_MINUTES,
      });
      setTables(availability);
    } catch (err: any) {
      const errMsg = err instanceof Error ? err.message : 'Không thể đặt bàn';
      setError(errMsg);
      showToast(errMsg, 'error');
    }
  };

  const minBookingTimeStr = useMemo(() => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const minTimeMs = Date.now();
    return new Date(minTimeMs - tzoffset).toISOString().slice(0, 16);
  }, [bookingTime]);

  const renderTableCard = (table: TableAvailability) => {
    const isVip = table.tableCode.toLowerCase().includes('vip');
    const displayTitle = formatTableCode(table.tableCode, 'vi', true);

    // Calculate real-time status from todayBookings
    const now = new Date();
    const tableBookings = todayBookings.filter(b => b.table?.id === table.tableId && b.status !== 'CANCELLED' && b.status !== 'COMPLETED');
    
    let currentBooking = null;
    let upcomingBooking = null;
    
    tableBookings.forEach(b => {
      const from = new Date(b.reservedFrom);
      const to = new Date(b.reservedTo);
      if (b.status === 'CHECKED_IN' || (from <= now && to >= now)) {
        currentBooking = b;
      } else if (from > now) {
        if (!upcomingBooking || from < new Date(upcomingBooking.reservedFrom)) {
          upcomingBooking = b;
        }
      }
    });

    const isCurrentlyUsed = currentBooking !== null;
    const isBookedForSelectedTime = table.booked; // API availability for the chosen time slot
    const disabled = isBookedForSelectedTime || isCurrentlyUsed; // Cannot book if someone is sitting there NOW or at the selected time

    return (
      <button
        key={table.tableId}
        disabled={disabled}
        onClick={() => openBookingModal(table)}
        className={`group rounded-xl p-4 text-left border flex flex-col justify-between transition-all duration-300 relative overflow-hidden h-[120px] w-full ${
          disabled
            ? 'bg-rose-50/70 border-rose-200/80 text-rose-950 cursor-not-allowed shadow-sm opacity-90'
            : isVip
            ? 'bg-gradient-to-b from-amber-50/30 via-white to-white border-amber-200/70 hover:border-amber-400 hover:shadow-[0_8px_25px_rgba(245,158,11,0.08)] text-slate-800 hover:-translate-y-0.5'
            : 'bg-gradient-to-b from-slate-50/40 via-white to-white border-slate-200/70 hover:border-indigo-400 hover:shadow-[0_8px_25px_rgba(99,102,241,0.06)] text-slate-800 hover:-translate-y-0.5'
        }`}
      >
        {/* Accent indicator bar on top of card */}
        {!disabled && isVip && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-amber-400"></div>
        )}
        {!disabled && !isVip && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-indigo-400"></div>
        )}
        {disabled && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-rose-400"></div>
        )}

        <div className="w-full">
          {/* Card Header: Title & Tag */}
          <div className="flex justify-between items-start gap-1">
            <div>
              <p
                className={`text-sm font-extrabold tracking-tight transition-colors duration-300 ${
                  disabled
                    ? 'text-rose-900'
                    : isVip
                    ? 'text-amber-800 group-hover:text-amber-600'
                    : 'text-slate-900 group-hover:text-indigo-600'
                }`}
              >
                {displayTitle}
              </p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span
                  className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    disabled
                      ? 'bg-rose-200/60 text-rose-800'
                      : isVip
                      ? 'bg-amber-100 text-amber-800 border border-amber-200/40'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100/60'
                  }`}
                >
                  {isVip ? 'VIP' : 'Thường'}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">{table.capacity} chỗ</span>
              </div>
            </div>
            {isVip && !disabled && (
              <span className="text-amber-500 text-sm select-none">👑</span>
            )}
            {disabled && (
              <span className="text-rose-500 text-xs select-none">🔒</span>
            )}
          </div>
        </div>

        {/* Card Footer: Live Status */}
        <div className="w-full border-t border-dashed mt-2 pt-2 flex items-center justify-between">
          {isCurrentlyUsed ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-[9px] font-bold text-rose-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse"></span>
                ĐANG SỬ DỤNG
              </span>
              <span className="text-[8px] text-rose-600 font-semibold bg-rose-200/30 px-1 py-0.5 rounded">
                {new Date(currentBooking!.reservedFrom).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : upcomingBooking ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-[9px] font-bold text-amber-600 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                SẮP TỚI
              </span>
              <span className="text-[8px] text-amber-700 font-semibold bg-amber-100/50 px-1 py-0.5 rounded border border-amber-200">
                {new Date(upcomingBooking.reservedFrom).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ) : isBookedForSelectedTime ? (
            <div className="w-full flex items-center justify-between">
              <span className="text-[9px] font-bold text-rose-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                ĐÃ ĐẶT (KHUNG GIỜ CHỌN)
              </span>
            </div>
          ) : (
            <>
              <span
                className={`text-[9px] font-bold flex items-center gap-1.5 ${
                  isVip ? 'text-amber-700' : 'text-indigo-700'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full animate-pulse ${
                    isVip ? 'bg-amber-500' : 'bg-indigo-500'
                  }`}
                ></span>
                SẴN SÀNG
              </span>
              <span
                className={`text-[8px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isVip ? 'text-amber-700' : 'text-indigo-700'
                }`}
              >
                Đặt chỗ →
              </span>
            </>
          )}
        </div>
      </button>
    );
  };

  return (
    <PageContainer title="Đặt bàn" breadcrumb={['Dashboard', 'Đặt bàn']}>
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-500/10 via-indigo-500/5 to-transparent border border-indigo-500/10 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-indigo-500/20 shadow-[0_2px_8px_rgba(99,102,241,0.02)]">
          <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Tổng số bàn</p>
            <p className="text-2xl font-black text-slate-800">{tables.length}</p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/10 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-emerald-500/20 shadow-[0_2px_8px_rgba(16,185,129,0.02)]">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Bàn đang trống</p>
            <p className="text-2xl font-black text-emerald-600">
              {tables.filter((t) => {
                const now = new Date();
                const tableBookings = todayBookings.filter(b => b.table?.id === t.tableId && b.status !== 'CANCELLED' && b.status !== 'COMPLETED');
                const isUsed = tableBookings.some(b => b.status === 'CHECKED_IN' || (new Date(b.reservedFrom) <= now && new Date(b.reservedTo) >= now));
                return !isUsed;
              }).length}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border border-rose-500/10 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-rose-500/20 shadow-[0_2px_8px_rgba(244,63,94,0.02)]">
          <div className="p-3 bg-rose-500/10 text-rose-500 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Đang sử dụng</p>
            <p className="text-2xl font-black text-rose-600">
              {tables.filter((t) => {
                const now = new Date();
                const tableBookings = todayBookings.filter(b => b.table?.id === t.tableId && b.status !== 'CANCELLED' && b.status !== 'COMPLETED');
                const isUsed = tableBookings.some(b => b.status === 'CHECKED_IN' || (new Date(b.reservedFrom) <= now && new Date(b.reservedTo) >= now));
                return isUsed;
              }).length}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/10 rounded-2xl p-4 flex items-center gap-4 transition-all duration-300 hover:border-amber-500/20 shadow-[0_2px_8px_rgba(245,158,11,0.02)]">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 00-7 7 7 7 0 007 7 7 7 0 007-7 7 7 0 00-7-7z" />
            </svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Bàn hạng VIP</p>
            <p className="text-2xl font-black text-amber-600">{tables.filter((t) => t.tableCode.toLowerCase().includes('vip')).length}</p>
          </div>
        </div>
      </div>

      {/* Filter Section Card */}
      <Card className="mb-6 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 -mx-5 -mt-5 px-5 py-4 border-b border-slate-100 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-extrabold text-xs text-slate-800 uppercase tracking-widest">Bộ lọc tìm kiếm & Đặt chỗ</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          <div>
            <Select
              label="Chi nhánh hoạt động"
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              options={
                isStaffOrManager
                  ? [{ value: selectedBranch, label: user?.branchName || 'Chi nhánh của bạn' }]
                  : branches.map((branch) => ({ value: branch.id, label: branch.name }))
              }
              disabled={isStaffOrManager}
            />
            <span className="text-[10px] text-gray-400 mt-1 block pl-0.5">Chi nhánh đang kiểm duyệt bàn</span>
          </div>
          <div>
            <Input
              label="Thời gian dự kiến nhận"
              type="datetime-local"
              value={bookingTime}
              onChange={(e) => setBookingTime(e.target.value)}
              min={minBookingTimeStr}
            />
            <span className="text-[10px] text-gray-400 mt-1 block pl-0.5">Khung thời gian khách hàng đặt chỗ</span>
          </div>
          <div>
            <Input
              label="Sức chứa tối thiểu (người)"
              type="number"
              value={capacityFilter}
              onChange={(e) => setCapacityFilter(e.target.value)}
              placeholder="VD: 4"
            />
            <span className="text-[10px] text-gray-400 mt-1 block pl-0.5">Tìm bàn có số ghế ngồi phù hợp</span>
          </div>
        </div>
      </Card>

      {/* Main Tables Container */}
      <Card>
        {error && (
          <div className="p-3 bg-red-50/80 border border-red-200 text-red-700 text-sm rounded-xl mb-4 flex items-center gap-2">
            <span className="text-base">⚠️</span>
            <p className="font-medium">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 space-y-3">
            <svg className="animate-spin h-8 w-8 text-indigo-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-sm font-semibold text-slate-400 tracking-wider uppercase">Đang đồng bộ trạng thái bàn...</p>
          </div>
        ) : filteredTables.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <span className="text-4xl block mb-2">🍽️</span>
            <p className="text-base font-bold">Không tìm thấy bàn ăn nào phù hợp</p>
            <p className="text-xs text-gray-400 mt-1">Vui lòng điều chỉnh lại bộ lọc tìm kiếm phía trên</p>
          </div>
        ) : (
          <div className="space-y-10">
            {/* VIP Tables Section */}
            {vipTables.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-amber-500/10 pb-2.5">
                  <span className="text-xl select-none">👑</span>
                  <h3 className="text-base font-black text-amber-600 tracking-wider uppercase">Khu vực Bàn VIP Sang Trọng</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-amber-100/60 text-amber-800 rounded-full border border-amber-200/50">
                    {vipTables.length} bàn
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {vipTables.map((table) => renderTableCard(table))}
                </div>
              </div>
            )}

            {/* Standard Tables Section */}
            {standardTables.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                  <span className="text-xl select-none">🍽️</span>
                  <h3 className="text-base font-black text-indigo-900 tracking-wider uppercase">Khu vực Bàn Thường Tiêu Chuẩn</h3>
                  <span className="text-[10px] font-extrabold px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded-full border border-indigo-100/60">
                    {standardTables.length} bàn
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
                  {standardTables.map((table) => renderTableCard(table))}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Booking Form Modal */}
      <Modal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        title={selectedTable ? `Đặt bàn ${formatTableCode(selectedTable.tableCode, 'vi')}` : 'Đặt bàn'}
      >
        {selectedTable && (
          <form className="space-y-5" onSubmit={handleBookingSubmit}>
            {/* Modal Header Table Banner */}
            <div className={`p-4 rounded-xl flex justify-between items-center ${
              selectedTable.tableCode.toLowerCase().includes('vip')
                ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 text-amber-950'
                : 'bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100/50 text-indigo-950'
            }`}>
              <div>
                <p className="font-extrabold text-base flex items-center gap-1.5">
                  {selectedTable.tableCode.toLowerCase().includes('vip') && <span>👑</span>}
                  {formatTableCode(selectedTable.tableCode, 'vi')}
                </p>
                <p className="text-xs opacity-80 font-medium">Sức chứa tối đa: {selectedTable.capacity} khách hàng</p>
              </div>
              <Badge color={selectedTable.booked ? 'red' : 'green'}>
                {selectedTable.booked ? 'Đã đặt' : 'Đang trống'}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Thời gian đặt chỗ"
                type="datetime-local"
                value={bookingTime}
                onChange={(e) => setBookingTime(e.target.value)}
                min={minBookingTimeStr}
                required
              />
              <Input
                label="Số lượng khách"
                type="number"
                min={1}
                max={selectedTable.capacity}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                required
              />
            </div>

            <Input
              label="Ghi chú dịch vụ (nếu có)"
              value={specialRequest}
              onChange={(e) => setSpecialRequest(e.target.value)}
              placeholder="Ví dụ: Bàn gần cửa sổ, tổ chức sinh nhật..."
            />

            {/* Modal Actions */}
            <div className="flex justify-end space-x-2 border-t border-slate-100 pt-4 mt-2">
              <Button type="button" variant="ghost" onClick={() => setBookingModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit">Xác nhận đặt bàn</Button>
            </div>
          </form>
        )}
      </Modal>
    </PageContainer>
  );
};

export default BookingPage;
