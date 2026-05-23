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
  BranchFood,
  BookingRequestPayload,
  TableAvailability,
} from '../../types/types';
import { useToast } from '../../context/ToastContext';
import { formatTableCode } from '../../utils/tableUtils';
import { useAuth } from '../../context/AuthContext';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const DEFAULT_DURATION_MINUTES = 105;

const generateRowId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;

type DishRow = {
  id: string;
  foodId: string;
  quantity: number;
  note: string;
};

// Beautiful Interactive SVG Seat Layout component representing the actual dining table
const VisualTable: React.FC<{ capacity: number; vip: boolean; booked: boolean }> = ({ capacity, vip, booked }) => {
  const chairColor = booked
    ? 'fill-rose-400/90'
    : vip
    ? 'fill-amber-500/80 group-hover:fill-amber-500 group-hover:scale-110 transition-all duration-300'
    : 'fill-indigo-500/80 group-hover:fill-indigo-500 group-hover:scale-110 transition-all duration-300';
    
  const tableColor = booked
    ? 'fill-rose-100/80 stroke-rose-300/80'
    : vip
    ? 'fill-amber-50/50 stroke-amber-300/80 group-hover:fill-amber-100/30 group-hover:stroke-amber-400 transition-colors duration-300'
    : 'fill-slate-50/80 stroke-slate-200 group-hover:fill-indigo-50/30 group-hover:stroke-indigo-300 transition-colors duration-300';

  return (
    <div className="flex items-center justify-center py-3 h-16 w-full">
      <svg width="100" height="50" viewBox="0 0 100 50" className="w-24 h-12 overflow-visible">
        {/* Central Dining Table */}
        <rect
          x="26"
          y="11"
          width="48"
          height="28"
          rx="8"
          className={`${tableColor} stroke-2 transition-all duration-300`}
        />
        
        {/* Chairs arrangement matching actual capacity */}
        {capacity <= 2 ? (
          <>
            {/* 2 chairs: Left & Right */}
            <circle cx="16" cy="25" r="4.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="84" cy="25" r="4.5" className={`${chairColor} transition-all duration-300`} />
          </>
        ) : capacity <= 4 ? (
          <>
            {/* 4 chairs: 2 Top & 2 Bottom */}
            <circle cx="40" cy="4" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="60" cy="4" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="40" cy="46" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="60" cy="46" r="4" className={`${chairColor} transition-all duration-300`} />
          </>
        ) : capacity <= 6 ? (
          <>
            {/* 6 chairs: Left, Right & 2 pairs Top/Bottom */}
            <circle cx="16" cy="25" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="84" cy="25" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="38" cy="4" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="62" cy="4" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="38" cy="46" r="4" className={`${chairColor} transition-all duration-300`} />
            <circle cx="62" cy="46" r="4" className={`${chairColor} transition-all duration-300`} />
          </>
        ) : (
          <>
            {/* 8 chairs: Left, Right & 3 pairs Top/Bottom */}
            <circle cx="15" cy="25" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="85" cy="25" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="33" cy="4" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="50" cy="4" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="67" cy="4" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="33" cy="46" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="50" cy="46" r="3.5" className={`${chairColor} transition-all duration-300`} />
            <circle cx="67" cy="46" r="3.5" className={`${chairColor} transition-all duration-300`} />
          </>
        )}
      </svg>
    </div>
  );
};

const BookingPage: React.FC = () => {
  const { user } = useAuth();
  const isStaffOrManager = user?.role === 'STAFF' || user?.role === 'MANAGER';
  const managedBranchId = isStaffOrManager ? user?.branchId ?? '' : '';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>(managedBranchId);
  const [capacityFilter, setCapacityFilter] = useState('');
  const [tables, setTables] = useState<TableAvailability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<TableAvailability | null>(null);
  
  const getMinBookingTime = () => {
    const tzoffset = (new Date()).getTimezoneOffset() * 60000;
    const minTimeMs = Date.now() + 60 * 60 * 1000; // current time + 1 hour
    return new Date(minTimeMs - tzoffset).toISOString().slice(0, 16);
  };

  const [bookingTime, setBookingTime] = useState(getMinBookingTime);
  const [guests, setGuests] = useState(4);
  const [specialRequest, setSpecialRequest] = useState('');
  const [branchFoods, setBranchFoods] = useState<BranchFood[]>([]);
  const [dishRows, setDishRows] = useState<DishRow[]>([]);

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
        setTables(availability);
      } catch (err) {
        setError('Không thể tải trạng thái bàn');
        showToast('Không thể tải trạng thái bàn', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchAvailability();
  }, [bookingTime, selectedBranch, showToast]);

  useEffect(() => {
    if (!selectedBranch) return;
    const fetchBranchFoods = async () => {
      try {
        const data = await restaurantApi.getBranchFoods({
          branchId: selectedBranch,
          page: 1,
          size: 50,
        });
        setBranchFoods(data.result);
      } catch {
        showToast('Không thể tải menu của chi nhánh', 'error');
      }
    };
    fetchBranchFoods();
    setDishRows([]);
  }, [selectedBranch, showToast]);

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

  const dishOptions = useMemo(
    () =>
      branchFoods
        .filter((item) => item.active)
        .map((item) => ({
          value: item.food.id,
          label: `${item.food.name} (${currencyFormatter.format(item.price)})`,
        })),
    [branchFoods]
  );

  const openBookingModal = (table: TableAvailability) => {
    setSelectedTable(table);
    setGuests(Math.min(table.capacity, guests));
    setBookingModalOpen(true);
  };

  const addDishRow = () => {
    setDishRows((prev) => [
      ...prev,
      {
        id: generateRowId(),
        foodId: branchFoods[0]?.food.id ?? '',
        quantity: 1,
        note: '',
      },
    ]);
  };

  const updateDishRow = (id: string, field: keyof DishRow, value: string | number) => {
    setDishRows((prev) =>
      prev.map((row) =>
        row.id === id
          ? {
              ...row,
              [field]: field === 'quantity' ? Number(value) : value,
            }
          : row
      )
    );
  };

  const removeDishRow = (id: string) => {
    setDishRows((prev) => prev.filter((row) => row.id !== id));
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) {
      showToast('Thiếu thông tin bàn', 'error');
      return;
    }
    const dishesPayload =
      dishRows
        .filter((row) => row.foodId && row.quantity > 0)
        .map((row, index) => ({
          foodId: row.foodId,
          quantity: row.quantity,
          servingOrder: index + 1,
          specialNote: row.note || undefined,
        })) || [];

    const payload: BookingRequestPayload = {
      bookingTime: new Date(bookingTime).toISOString(),
      durationMinutes: DEFAULT_DURATION_MINUTES,
      guests,
      specialRequest,
      tableId: selectedTable.tableId,
      branchId: selectedBranch,
      dishes: dishesPayload.length ? dishesPayload : undefined,
    };
    try {
      await restaurantApi.createBooking(payload);
      showToast(`Đặt bàn ${selectedTable.tableCode} thành công`, 'success');
      setBookingModalOpen(false);
      setSpecialRequest('');
      setDishRows([]);
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
    const minTimeMs = Date.now() + 60 * 60 * 1000;
    return new Date(minTimeMs - tzoffset).toISOString().slice(0, 16);
  }, [bookingTime]);

  const renderTableCard = (table: TableAvailability) => {
    const isVip = table.tableCode.toLowerCase().includes('vip');
    const displayTitle = formatTableCode(table.tableCode, 'vi', true);

    return (
      <button
        key={table.tableId}
        disabled={table.booked}
        onClick={() => openBookingModal(table)}
        className={`group rounded-2xl p-5 text-left border flex flex-col justify-between transition-all duration-300 relative overflow-hidden h-[210px] w-full ${
          table.booked
            ? 'bg-gradient-to-b from-rose-50/90 to-rose-100/40 border-rose-200/80 text-rose-950 cursor-not-allowed shadow-sm opacity-90'
            : isVip
            ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-amber-200/70 hover:border-amber-400 hover:shadow-[0_8px_25px_rgba(245,158,11,0.12)] text-slate-800 hover:-translate-y-1'
            : 'bg-gradient-to-b from-slate-50/60 via-white to-white border-slate-200/70 hover:border-indigo-400 hover:shadow-[0_8px_25px_rgba(99,102,241,0.1)] text-slate-800 hover:-translate-y-1'
        }`}
      >
        {/* Accent indicator bar on top of card */}
        {!table.booked && isVip && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-amber-400 to-amber-500"></div>
        )}
        {!table.booked && !isVip && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-indigo-400 to-violet-500"></div>
        )}
        {table.booked && (
          <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-rose-400 to-rose-500"></div>
        )}

        <div className="w-full">
          {/* Card Header: Title & Tag */}
          <div className="flex justify-between items-start gap-1 mb-2">
            <div>
              <p
                className={`text-base font-extrabold tracking-tight transition-colors duration-300 ${
                  table.booked
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
                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                    table.booked
                      ? 'bg-rose-200/60 text-rose-800'
                      : isVip
                      ? 'bg-amber-100 text-amber-800 border border-amber-200/40'
                      : 'bg-indigo-50 text-indigo-700 border border-indigo-100/60'
                  }`}
                >
                  {isVip ? 'Hạng VIP' : 'Bàn Thường'}
                </span>
                <span className="text-[10px] text-gray-500 font-semibold">{table.capacity} chỗ</span>
              </div>
            </div>
            {isVip && !table.booked && (
              <span className="text-amber-500 text-lg select-none">👑</span>
            )}
            {table.booked && (
              <span className="text-rose-500 text-sm select-none">🔒</span>
            )}
          </div>

          {/* Table Seat Layout Visualizer */}
          <VisualTable capacity={table.capacity} vip={isVip} booked={table.booked} />
        </div>

        {/* Card Footer: Live Status */}
        <div className="w-full border-t border-dashed mt-2 pt-2 flex items-center justify-between">
          {table.booked ? (
            <div className="w-full">
              <span className="text-[10px] font-bold text-rose-700 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                ĐÃ ĐẶT CHỖ
              </span>
              {table.reservedFrom && table.reservedTo && (
                <p className="text-[9px] text-rose-600 font-semibold mt-0.5 bg-rose-200/30 px-1.5 py-0.5 rounded">
                  Khung: {new Date(table.reservedFrom).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - {new Date(table.reservedTo).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
            </div>
          ) : (
            <>
              <span
                className={`text-[10px] font-bold flex items-center gap-1.5 ${
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
                className={`text-[9px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                  isVip ? 'text-amber-700' : 'text-indigo-700'
                }`}
              >
                Đặt ngay →
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
            <p className="text-2xl font-black text-emerald-600">{tables.filter((t) => !t.booked).length}</p>
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
            <p className="text-2xl font-black text-rose-600">{tables.filter((t) => t.booked).length}</p>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
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
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
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
            <div className={`p-4 rounded-2xl flex justify-between items-center ${
              selectedTable.tableCode.toLowerCase().includes('vip')
                ? 'bg-gradient-to-br from-amber-50 to-amber-100/50 border border-amber-200/50 text-amber-950'
                : 'bg-gradient-to-br from-indigo-50 to-indigo-100/30 border border-indigo-100/50 text-indigo-950'
            }`}>
              <div>
                <p className="font-extrabold text-lg flex items-center gap-1.5">
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

            {/* Menu Pre-order Section */}
            <div className="space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-800 text-sm">Chuẩn bị món trước (Tùy chọn)</p>
                  <p className="text-[10px] text-gray-400">Chọn các món bếp chuẩn bị trước để phục vụ nhanh hơn</p>
                </div>
                <Button
                  type="button"
                  size="sm"
                  onClick={addDishRow}
                  disabled={branchFoods.length === 0}
                  variant="outline"
                >
                  + Thêm món ăn
                </Button>
              </div>

              {dishRows.length === 0 ? (
                <div className="text-center py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                  <p className="text-xs text-gray-400">Chưa chọn món chuẩn bị trước nào</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                  {dishRows.map((row) => (
                    <div
                      key={row.id}
                      className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end border border-slate-200/80 rounded-xl p-3 bg-white shadow-sm relative group"
                    >
                      <div className="md:col-span-6">
                        <Select
                          label="Món ăn"
                          value={row.foodId}
                          onChange={(e) => updateDishRow(row.id, 'foodId', e.target.value)}
                          options={
                            dishOptions.length > 0
                              ? dishOptions
                              : [{ value: '', label: 'Chưa có món nào' }]
                          }
                          required
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Input
                          label="Số lượng"
                          type="number"
                          min={1}
                          value={row.quantity}
                          onChange={(e) => updateDishRow(row.id, 'quantity', Number(e.target.value))}
                          required
                        />
                      </div>
                      <div className="md:col-span-3 flex items-end gap-2">
                        <div className="flex-1">
                          <Input
                            label="Ghi chú món"
                            value={row.note}
                            onChange={(e) => updateDishRow(row.id, 'note', e.target.value)}
                            placeholder="Ít cay..."
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDishRow(row.id)}
                          className="p-2 text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition-colors border border-transparent hover:border-rose-100 mb-0.5"
                          title="Xóa món"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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


