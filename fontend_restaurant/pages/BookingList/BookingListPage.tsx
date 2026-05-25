import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Icon } from '../../components/ui/Icon';
import { restaurantApi } from '../../services/restaurantApi';
import type { Booking, Branch, BranchFood, BookingDishPayload } from '../../types/types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

/* ───── helpers ───── */
const STATUS_MAP: Record<string, { label: string; color: 'blue' | 'green' | 'gray' | 'red' | 'purple' }> = {
  CONFIRMED: { label: 'Đã xác nhận', color: 'blue' },
  CHECKED_IN: { label: 'Đang phục vụ', color: 'green' },
  COMPLETED: { label: 'Hoàn thành', color: 'gray' },
  CANCELLED: { label: 'Đã huỷ', color: 'red' },
};

const currencyFmt = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});
const money = (v: number) => currencyFmt.format(v);

const fmtDt = (v: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(v));

const fmtDate = (v: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(v));

const formatTableCode = (tableCode: string | undefined): string => {
  if (!tableCode) return '';
  let cleanCode = tableCode.trim();
  
  // Repeatedly remove leading "bàn", "table" case-insensitively
  while (true) {
    const lower = cleanCode.toLowerCase();
    if (lower.startsWith('bàn ')) {
      cleanCode = cleanCode.substring(4).trim();
    } else if (lower.startsWith('bàn')) {
      cleanCode = cleanCode.substring(3).trim();
    } else {
      break;
    }
  }

  const parts = cleanCode.split('-');
  if (parts.length >= 4) {
    const isVip = parts[0].toUpperCase() === 'VIP';
    const capacity = parts[2];
    const index = parts[3];
    return isVip ? `Bàn VIP ${capacity}-${index}` : `Bàn Thường ${capacity}-${index}`;
  }

  if (cleanCode.toUpperCase().startsWith('VIP-')) {
    return `Bàn VIP ${cleanCode.substring(4)}`;
  }
  if (cleanCode.toUpperCase().startsWith('STD-')) {
    return `Bàn Thường ${cleanCode.substring(4)}`;
  }

  const upperClean = cleanCode.toUpperCase();
  if (upperClean.startsWith('VIP')) {
    let suffix = cleanCode.substring(3).trim();
    if (suffix.startsWith('-')) suffix = suffix.substring(1).trim();
    return `Bàn VIP ${suffix}`;
  }
  if (upperClean.startsWith('STD') || upperClean.startsWith('STANDARD') || upperClean.startsWith('THƯỜNG')) {
    let len = 3;
    if (upperClean.startsWith('THƯỜNG')) len = 7;
    else if (upperClean.startsWith('STANDARD')) len = 8;
    let suffix = cleanCode.substring(len).trim();
    if (suffix.startsWith('-')) suffix = suffix.substring(1).trim();
    return `Bàn Thường ${suffix}`;
  }

  return `Bàn ${cleanCode}`;
};

/* ═══════════════════════ COMPONENT ═══════════════════════ */
const BookingListPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [bookingDate, setBookingDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Details modal
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

  // Add-dish state
  const [branchFoods, setBranchFoods] = useState<BranchFood[]>([]);
  const [editingDishes, setEditingDishes] = useState<BookingDishPayload[]>([]);
  const [dishSearchQuery, setDishSearchQuery] = useState('');
  const [addDishOpen, setAddDishOpen] = useState(false);
  const [savingDishes, setSavingDishes] = useState(false);

  // Invoice modal
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const { showToast } = useToast();
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF' || user?.role === 'MANAGER';
  const managedBranchId = isStaff ? user?.branchId ?? '' : '';
  const [selectedBranch, setSelectedBranch] = useState<string>(managedBranchId);
  const missingManagedBranch = isStaff && !managedBranchId;

  /* ──── data loading ──── */
  useEffect(() => {
    (async () => {
      try {
        const res = await restaurantApi.getBranches();
        setBranches(res);
      } catch {
        showToast('Không thể tải chi nhánh', 'error');
      }
    })();
  }, [showToast]);

  const fetchBookings = useCallback(async (silent = false) => {
    if (!bookingDate) return;
    if (missingManagedBranch) {
      setError('Bạn chưa được gán chi nhánh, vui lòng liên hệ quản trị viên.');
      setBookings([]);
      return;
    }
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await restaurantApi.getBookings({
        branchId: (isStaff ? managedBranchId : selectedBranch) || undefined,
        date: bookingDate,
      });
      setBookings(res);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải bookings';
      setError(message);
      showToast(message, 'error');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [bookingDate, selectedBranch, showToast, isStaff, managedBranchId, missingManagedBranch]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  useEffect(() => {
    if (!bookingDate || missingManagedBranch) return;
    
    const interval = setInterval(() => {
      fetchBookings(true); // silent refresh every 5 seconds
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchBookings, bookingDate, missingManagedBranch]);

  useEffect(() => {
    if (isStaff) setSelectedBranch(managedBranchId);
  }, [isStaff, managedBranchId]);

  const branchOptions = useMemo(() => {
    if (isStaff && managedBranchId) {
      const m = branches.find((b) => b.id === managedBranchId);
      return m ? [{ value: m.id, label: m.name }] : [{ value: managedBranchId, label: user?.branchName ?? 'Chi nhánh của bạn' }];
    }
    return [{ value: '', label: 'Tất cả chi nhánh' }, ...branches.map((b) => ({ value: b.id, label: b.name }))];
  }, [branches, isStaff, managedBranchId, user?.branchName]);

  // Compute live stats for the summary cards
  const stats = useMemo(() => {
    const total = bookings.length;
    const serving = bookings.filter((b) => b.status === 'CHECKED_IN').length;
    const pending = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    return { total, serving, pending, completed };
  }, [bookings]);

  /* ──── booking actions ──── */
  const handleCheckIn = async (id: string) => {
    if (!confirm('Xác nhận khách hàng đã đến?')) return;
    try {
      await restaurantApi.checkInBooking(id);
      showToast('Đã check-in thành công', 'success');
      await fetchBookings();
      if (selectedBooking?.id === id) {
        const updated = bookings.find((b) => b.id === id);
        if (updated) setSelectedBooking({ ...updated, status: 'CHECKED_IN' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi check-in', 'error');
    }
  };

  const handleComplete = async (id: string) => {
    if (!confirm('Đánh dấu booking này đã hoàn thành?')) return;
    try {
      await restaurantApi.completeBooking(id);
      showToast('Đã hoàn thành booking', 'success');
      await fetchBookings();
      if (selectedBooking?.id === id) {
        const updated = bookings.find((b) => b.id === id);
        if (updated) setSelectedBooking({ ...updated, status: 'COMPLETED' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể hoàn thành', 'error');
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Xác nhận huỷ booking này?')) return;
    try {
      await restaurantApi.cancelBooking(id);
      showToast('Đã huỷ booking', 'success');
      await fetchBookings();
      if (selectedBooking?.id === id) {
        const updated = bookings.find((b) => b.id === id);
        if (updated) setSelectedBooking({ ...updated, status: 'CANCELLED' });
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Không thể huỷ', 'error');
    }
  };

  /* ──── open details ──── */
  const handleViewDetails = async (booking: Booking) => {
    setSelectedBooking(booking);
    setEditingDishes(
      (booking.dishes || []).map((d) => ({
        foodId: d.food.id,
        quantity: d.quantity,
        servingOrder: d.servingOrder,
        specialNote: d.specialNote,
      }))
    );

    // Load branch foods for the add-dish feature
    try {
      const res = await restaurantApi.getBranchFoods({ branchId: booking.branch.id, size: 200 });
      setBranchFoods(res.result || []);
    } catch {
      setBranchFoods([]);
    }

    setDetailsOpen(true);
  };

  /* ──── dish management ──── */
  const filteredBranchFoods = useMemo(() => {
    if (!dishSearchQuery.trim()) return branchFoods;
    const q = dishSearchQuery.toLowerCase();
    return branchFoods.filter((bf) => bf.food.name.toLowerCase().includes(q));
  }, [branchFoods, dishSearchQuery]);

  const addDishToOrder = (bf: BranchFood) => {
    setEditingDishes((prev) => {
      const existing = prev.find((d) => d.foodId === bf.food.id);
      if (existing) {
        return prev.map((d) => (d.foodId === bf.food.id ? { ...d, quantity: d.quantity + 1 } : d));
      }
      return [...prev, { foodId: bf.food.id, quantity: 1, servingOrder: prev.length + 1 }];
    });
    setAddDishOpen(false);
    setDishSearchQuery('');
  };

  const updateDishQty = (foodId: string, delta: number) => {
    setEditingDishes((prev) => {
      const updated = prev.map((d) => (d.foodId === foodId ? { ...d, quantity: Math.max(0, d.quantity + delta) } : d));
      return updated.filter((d) => d.quantity > 0);
    });
  };

  const removeDish = (foodId: string) => {
    setEditingDishes((prev) => prev.filter((d) => d.foodId !== foodId));
  };

  const handleSaveDishes = async () => {
    if (!selectedBooking) return;
    setSavingDishes(true);
    try {
      const updated = await restaurantApi.updateBookingDishes(selectedBooking.id, editingDishes);
      showToast('Đã cập nhật món ăn thành công', 'success');
      setSelectedBooking(updated);
      await fetchBookings();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Lỗi cập nhật món', 'error');
    } finally {
      setSavingDishes(false);
    }
  };

  const getFoodName = (foodId: string) => {
    const fromBranch = branchFoods.find((bf) => bf.food.id === foodId);
    if (fromBranch) return fromBranch.food.name;
    const fromDish = selectedBooking?.dishes?.find((d) => d.food.id === foodId);
    return fromDish?.food.name ?? foodId;
  };

  const getFoodPrice = (foodId: string) => {
    const fromBranch = branchFoods.find((bf) => bf.food.id === foodId);
    if (fromBranch) return fromBranch.price;
    const fromDish = selectedBooking?.dishes?.find((d) => d.food.id === foodId);
    return fromDish?.unitPrice ?? 0;
  };

  const editSubtotal = useMemo(
    () => editingDishes.reduce((s, d) => s + d.quantity * getFoodPrice(d.foodId), 0),
    [editingDishes, branchFoods, selectedBooking]
  );

  /* ──── invoice helpers ──── */
  const handlePrint = () => {
    const el = invoiceRef.current;
    if (!el) return;
    const win = window.open('', '_blank', 'width=400,height=600');
    if (!win) return;
    win.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"/>
      <title>Hoá đơn 3Ship</title>
      <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;padding:20px;color:#222;font-size:13px}
        h1{font-size:20px;text-align:center;margin-bottom:4px}
        .sub{text-align:center;color:#666;font-size:11px;margin-bottom:12px}
        hr{border:none;border-top:1px dashed #ccc;margin:12px 0}
        .row{display:flex;justify-content:space-between;padding:3px 0}
        .row.bold{font-weight:700}
        table{width:100%;border-collapse:collapse;margin:8px 0}
        th,td{text-align:left;padding:4px 6px;font-size:12px}
        th{border-bottom:1px solid #333;font-weight:700}
        td{border-bottom:1px solid #eee}
        td.right,th.right{text-align:right}
        .total-row{font-size:16px;font-weight:700}
        .footer{text-align:center;margin-top:16px;font-size:11px;color:#888}
      </style></head><body>
      ${el.innerHTML}
      <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();}}</script>
      </body></html>`);
    win.document.close();
  };

  /* ──── table columns ──── */
  const bookingColumns = [
    {
      header: 'Thời gian',
      accessor: (b: Booking) => (
        <div className="flex flex-col">
          <span className="font-semibold text-slate-800">{fmtDt(b.reservedFrom).split(' ')[0]}</span>
          <span className="text-xs text-slate-400 font-medium">{fmtDt(b.reservedFrom).split(' ')[1]} – {fmtDt(b.reservedTo).split(' ')[1]}</span>
        </div>
      ),
    },
    {
      header: 'Khách hàng',
      accessor: (b: Booking) => (
        <div className="flex flex-col">
          <span className="font-bold text-slate-800">{b.user.username}</span>
          <span className="text-xs text-slate-500 font-medium">{b.user.phone || 'Chưa cập nhật SĐT'}</span>
        </div>
      ),
    },
    {
      header: 'Chi nhánh',
      accessor: (b: Booking) => <span className="font-medium text-slate-700">{b.branch.name}</span>,
    },
    {
      header: 'Bàn ăn',
      accessor: (b: Booking) => {
        const isVip = b.table.tableCode.toUpperCase().startsWith('VIP');
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${
            isVip
              ? 'bg-purple-50 text-purple-700 border border-purple-100'
              : 'bg-slate-50 text-slate-700 border border-slate-200'
          }`}>
            {isVip ? '👑 ' : '🪑 '}
            {formatTableCode(b.table.tableCode)}
          </span>
        );
      },
    },
    {
      header: 'Số khách',
      accessor: (b: Booking) => (
        <div className="flex items-center gap-1.5">
          <Icon name="users" className="w-4 h-4 text-slate-400" />
          <span className="font-bold text-slate-700 text-sm">{b.guests} người</span>
        </div>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (b: Booking) => {
        const s = STATUS_MAP[b.status] ?? { label: b.status, color: 'gray' as const };
        if (b.status === 'CHECKED_IN') {
          return (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm gap-1.5 animate-pulse-slow">
              <span className="h-2 w-2 rounded-full bg-emerald-500 shadow shadow-emerald-500/50"></span>
              {s.label}
            </span>
          );
        }
        if (b.status === 'CONFIRMED') {
          return (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm gap-1.5">
              <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
              {s.label}
            </span>
          );
        }
        if (b.status === 'COMPLETED') {
          return (
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-200 shadow-sm gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              {s.label}
            </span>
          );
        }
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100 shadow-sm gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            {s.label}
          </span>
        );
      },
    },
    {
      header: 'Hành động',
      accessor: (b: Booking) => (
        <div className="flex flex-wrap gap-1.5 items-center">
          <button
            onClick={() => handleViewDetails(b)}
            className="inline-flex items-center px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 shadow-sm transition active:scale-95 duration-150"
          >
            Chi tiết
          </button>
          {b.status === 'CONFIRMED' && (
            <button
              onClick={() => handleCheckIn(b.id)}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-sm hover:shadow active:scale-95 transition duration-150"
            >
              ✓ Check-in
            </button>
          )}
          {b.status === 'CHECKED_IN' && (
            <button
              onClick={() => handleComplete(b.id)}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-sm hover:shadow active:scale-95 transition duration-150"
            >
              ✓ Hoàn thành
            </button>
          )}
          {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'CHECKED_IN' && (
            <button
              onClick={() => handleCancel(b.id)}
              className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition active:scale-95 duration-150"
            >
              Huỷ đơn
            </button>
          )}
        </div>
      ),
    },
  ];

  /* ═══════════════════════ RENDER ═══════════════════════ */
  return (
    <PageContainer title="Lịch hẹn nhà hàng" breadcrumb={['Danh sách booking']}>
      
      {/* Live sync banner */}
      <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100/50 px-4 py-2.5 rounded-2xl mb-6 animate-pulse-slow">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-extrabold text-emerald-800">Đồng bộ Lịch Hẹn Thời Gian Thực (Mỗi 5 giây)</span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">Máy chủ RESTful API: Đã kết nối</span>
      </div>
      
      {/* Premium Statistics Overview Block */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100/30 p-5 rounded-2xl border border-indigo-100 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">Tổng số đặt bàn</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.total}</h3>
            <p className="text-[11px] text-indigo-500/80 mt-1">Lịch hẹn trong ngày hôm nay</p>
          </div>
          <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-600">
            <Icon name="clipboard" className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 p-5 rounded-2xl border border-emerald-100 shadow-sm flex items-center justify-between transition hover:shadow-md animate-pulse-slow">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Đang phục vụ</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1 flex items-center gap-2">
              {stats.serving}
              {stats.serving > 0 && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </h3>
            <p className="text-[11px] text-emerald-500/80 mt-1">Khách đang có mặt dùng bữa</p>
          </div>
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-600">
            <Icon name="activity" className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100/30 p-5 rounded-2xl border border-amber-100 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-600">Chờ phục vụ</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.pending}</h3>
            <p className="text-[11px] text-amber-500/80 mt-1">Khách đã đặt và xác nhận</p>
          </div>
          <div className="p-3 bg-amber-500/10 rounded-xl text-amber-600">
            <Icon name="calendar" className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-slate-50 to-slate-200/50 p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between transition hover:shadow-md">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-600">Đã hoàn thành</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-1">{stats.completed}</h3>
            <p className="text-[11px] text-slate-500/80 mt-1">Đã thanh toán & hoàn tất</p>
          </div>
          <div className="p-3 bg-slate-500/10 rounded-xl text-slate-600">
            <Icon name="document" className="w-6 h-6" />
          </div>
        </div>
      </div>

      <Card
        className="shadow-sm border border-slate-100 rounded-2xl overflow-hidden animate-fadeIn"
        actions={
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            {/* View Mode Toggle Switch */}
            <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 flex items-center gap-1.5 ${
                  viewMode === 'table'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon name="clipboard" className="w-3.5 h-3.5" />
                <span>Xem Bảng</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('card')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-250 flex items-center gap-1.5 ${
                  viewMode === 'card'
                    ? 'bg-white text-indigo-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon name="package" className="w-3.5 h-3.5" />
                <span>Xem Lưới</span>
              </button>
            </div>

            {isStaff ? (
              <div className="px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 bg-slate-50 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
                Chi nhánh: {user?.branchName ?? 'Chưa được gán'}
              </div>
            ) : (
              <Select value={selectedBranch} onChange={(e) => setSelectedBranch(e.target.value)} options={branchOptions} />
            )}
            <Input type="date" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>
        }
      >
        {error && <p className="text-sm text-red-500 mb-3 font-semibold">⚠️ {error}</p>}
        {missingManagedBranch ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">🏢</div>
            <p className="text-slate-500 font-medium">Bạn chưa được gán chi nhánh.</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng liên hệ quản trị viên để chỉ định chi nhánh làm việc của bạn.</p>
          </div>
        ) : loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-3"></div>
            <p className="text-slate-500 font-medium text-sm">Đang đồng bộ lịch đặt bàn...</p>
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-5xl mb-3">📅</div>
            <p className="text-slate-500 font-medium">Không có lịch đặt bàn nào cho ngày này.</p>
            <p className="text-xs text-slate-400 mt-1">Chọn ngày khác hoặc chuyển chi nhánh để kiểm tra.</p>
          </div>
        ) : viewMode === 'table' ? (
          <Table columns={bookingColumns} data={bookings} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fadeIn">
            {bookings.map((b) => {
              const statusInfo = STATUS_MAP[b.status] ?? { label: b.status, color: 'gray' };
              const isVip = b.table.tableCode.toUpperCase().startsWith('VIP');
              
              return (
                <div 
                  key={b.id} 
                  className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md hover:border-indigo-100/50 transition-all duration-300 flex flex-col justify-between gap-4 group relative overflow-hidden"
                >
                  {isVip && (
                    <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-purple-400 to-indigo-500"></div>
                  )}
                  <div>
                    {/* Card Header */}
                    <div className="flex justify-between items-center mb-3">
                      <span className="inline-flex items-center px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg">
                        ⏰ {fmtDt(b.reservedFrom).split(' ')[1]}
                      </span>
                      {b.status === 'CHECKED_IN' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 gap-1 animate-pulse-slow">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                          {statusInfo.label}
                        </span>
                      ) : b.status === 'CONFIRMED' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500"></span>
                          {statusInfo.label}
                        </span>
                      ) : b.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200 gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                          {statusInfo.label}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100 gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-red-500"></span>
                          {statusInfo.label}
                        </span>
                      )}
                    </div>

                    {/* Customer & Branch */}
                    <div className="space-y-2 mb-4">
                      <h4 className="font-extrabold text-slate-800 text-base group-hover:text-indigo-600 transition-colors truncate">
                        {b.user.username}
                      </h4>
                      <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5">
                        <span>📞 {b.user.phone || 'Chưa cập SĐT'}</span>
                      </p>
                      <p className="text-xs text-slate-400 font-medium truncate">
                        📍 {b.branch.name}
                      </p>
                    </div>

                    {/* Table & Guest Pills */}
                    <div className="flex gap-2 pt-3 border-t border-slate-50">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                        isVip
                          ? 'bg-purple-50 text-purple-700 border border-purple-100'
                          : 'bg-slate-50 text-slate-700 border border-slate-200'
                      }`}>
                        <span>{isVip ? '👑' : '🪑'}</span>
                        <span>{formatTableCode(b.table.tableCode)}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100/50">
                        <span>👥</span>
                        <span>{b.guests} khách</span>
                      </span>
                    </div>
                  </div>

                  {/* Actions footer */}
                  <div className="flex gap-2 pt-3 border-t border-slate-50/80">
                    <button
                      onClick={() => handleViewDetails(b)}
                      className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 hover:text-indigo-600 hover:border-indigo-200 transition-all duration-200 active:scale-95"
                    >
                      Chi tiết
                    </button>
                    {b.status === 'CONFIRMED' && (
                      <button
                        onClick={() => handleCheckIn(b.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-100/30 transition-all duration-200 active:scale-95"
                      >
                        ✓ Check-in
                      </button>
                    )}
                    {b.status === 'CHECKED_IN' && (
                      <button
                        onClick={() => handleComplete(b.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow-md shadow-indigo-100/30 transition-all duration-200 active:scale-95"
                      >
                        ✓ Hoàn thành
                      </button>
                    )}
                    {b.status !== 'CANCELLED' && b.status !== 'COMPLETED' && b.status !== 'CHECKED_IN' && (
                      <button
                        onClick={() => handleCancel(b.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all duration-200 active:scale-95"
                      >
                        Huỷ đơn
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* ═══ DETAILS + ORDER MANAGEMENT MODAL ═══ */}
      <Modal
        isOpen={detailsOpen && !!selectedBooking}
        onClose={() => { setDetailsOpen(false); setSelectedBooking(null); setAddDishOpen(false); }}
        title="Quản lý chi tiết lịch hẹn"
        size="xl"
        footer={
          <div className="flex flex-wrap gap-2 justify-end">
            {selectedBooking?.status === 'CONFIRMED' && (
              <button
                onClick={() => handleCheckIn(selectedBooking.id)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow shadow-emerald-200/50 transition active:scale-95"
              >
                ✓ Check-in khách
              </button>
            )}
            {selectedBooking?.status === 'CHECKED_IN' && (
              <button
                onClick={() => handleComplete(selectedBooking.id)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 shadow shadow-indigo-200/50 transition active:scale-95"
              >
                ✔ Hoàn thành phục vụ
              </button>
            )}
            {(selectedBooking?.status === 'CHECKED_IN' || selectedBooking?.status === 'COMPLETED') && (
              <button
                onClick={() => setInvoiceOpen(true)}
                className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow shadow-purple-200/50 transition active:scale-95"
              >
                🧾 Xuất & In hoá đơn
              </button>
            )}
            <button
              onClick={() => { setDetailsOpen(false); setSelectedBooking(null); }}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Đóng
            </button>
          </div>
        }
      >
        {selectedBooking && (
          <div className="space-y-6">
            {/* Elegant Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-sm">
              <div className="space-y-3">
                <p className="flex items-center justify-between py-1 border-b border-dashed border-slate-200/80">
                  <span className="font-medium text-slate-500">Chi nhánh:</span> 
                  <span className="font-semibold text-slate-800">{selectedBooking.branch.name}</span>
                </p>
                <p className="flex items-center justify-between py-1 border-b border-dashed border-slate-200/80">
                  <span className="font-medium text-slate-500">Bàn ăn:</span> 
                  <span className={`font-semibold ${selectedBooking.table.tableCode.toUpperCase().startsWith('VIP') ? 'text-purple-700' : 'text-slate-800'}`}>
                    {formatTableCode(selectedBooking.table.tableCode)}
                  </span>
                </p>
                <p className="flex items-center justify-between py-1 border-b border-dashed border-slate-200/80">
                  <span className="font-medium text-slate-500">Số khách đặt:</span> 
                  <span className="font-semibold text-slate-800">{selectedBooking.guests} người</span>
                </p>
                <p className="flex items-center justify-between py-1">
                  <span className="font-medium text-slate-500">Thời gian:</span> 
                  <span className="font-semibold text-slate-800">{fmtDt(selectedBooking.reservedFrom)} – {fmtDt(selectedBooking.reservedTo)}</span>
                </p>
              </div>
              <div className="space-y-3">
                <p className="flex items-center justify-between py-1 border-b border-dashed border-slate-200/80">
                  <span className="font-medium text-slate-500">Trạng thái đơn:</span>{' '}
                  <span className="font-semibold text-slate-800">
                    <Badge color={STATUS_MAP[selectedBooking.status]?.color ?? 'gray'} size="sm">
                      {STATUS_MAP[selectedBooking.status]?.label ?? selectedBooking.status}
                    </Badge>
                  </span>
                </p>
                <p className="flex items-center justify-between py-1 border-b border-dashed border-slate-200/80">
                  <span className="font-medium text-slate-500">Khách hàng đặt:</span> 
                  <span className="font-semibold text-slate-800">{selectedBooking.user.username}</span>
                </p>
                <p className="flex items-center justify-between py-1 border-b border-dashed border-slate-200/80">
                  <span className="font-medium text-slate-500">Thông tin liên hệ:</span> 
                  <span className="font-semibold text-slate-800">{selectedBooking.user.phone || selectedBooking.user.email}</span>
                </p>
                {selectedBooking.specialRequest && (
                  <div className="flex flex-col gap-1 py-1">
                    <span className="font-medium text-slate-500">Ghi chú:</span> 
                    <span className="text-slate-700 italic bg-amber-50 border border-amber-100 p-2 rounded-xl text-xs">
                      "{selectedBooking.specialRequest}"
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* ── Order management section ── */}
            <div className="border border-slate-100 rounded-2xl p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Icon name="package" className="w-5 h-5 text-indigo-500" />
                  <h4 className="text-lg font-bold text-slate-800">Thực đơn pre-order & gọi thêm</h4>
                </div>
                {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'CHECKED_IN') && (
                  <button
                    onClick={() => { setAddDishOpen(true); setDishSearchQuery(''); }}
                    className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition active:scale-95"
                  >
                    ＋ Gọi Thêm Món
                  </button>
                )}
              </div>

              {/* add-dish picker */}
              {addDishOpen && (
                <div className="mb-4 p-4 border border-indigo-100 rounded-2xl bg-indigo-50/20 shadow-inner space-y-3 animate-fadeIn">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                      <Icon name="search" className="h-5 w-5 text-slate-400" />
                    </span>
                    <input
                      placeholder="Tìm kiếm món ăn theo tên..."
                      value={dishSearchQuery}
                      onChange={(e) => setDishSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm shadow-sm transition"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1 bg-white border border-slate-100 rounded-xl p-2 shadow-sm">
                    {filteredBranchFoods.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">Không tìm thấy món ăn phù hợp</p>
                    ) : (
                      filteredBranchFoods.map((bf) => (
                        <button
                          key={bf.id}
                          onClick={() => addDishToOrder(bf)}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50 transition flex justify-between items-center text-sm active:scale-99"
                        >
                          <span className="font-medium text-slate-800">{bf.food.name}</span>
                          <span className="text-indigo-600 font-semibold">{money(bf.price)}</span>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="text-right">
                    <button
                      onClick={() => setAddDishOpen(false)}
                      className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 transition"
                    >
                      Đóng
                    </button>
                  </div>
                </div>
              )}

              {/* editable dish table */}
              {editingDishes.length > 0 ? (
                <div className="overflow-hidden rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-slate-700 uppercase text-[10px] tracking-wider font-semibold">
                      <tr>
                        <th className="px-4 py-3 text-left w-12">#</th>
                        <th className="px-4 py-3 text-left">Món ăn</th>
                        <th className="px-4 py-3 text-center w-36">Số lượng</th>
                        <th className="px-4 py-3 text-right">Đơn giá</th>
                        <th className="px-4 py-3 text-right">Thành tiền</th>
                        {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'CHECKED_IN') && (
                          <th className="px-4 py-3 text-center w-16"></th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {editingDishes.map((d, i) => {
                        const price = getFoodPrice(d.foodId);
                        return (
                          <tr key={d.foodId} className="hover:bg-slate-50/50 transition">
                            <td className="px-4 py-3 font-semibold text-slate-400">{i + 1}</td>
                            <td className="px-4 py-3 font-semibold text-slate-800">{getFoodName(d.foodId)}</td>
                            <td className="px-4 py-3">
                              {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'CHECKED_IN') ? (
                                <div className="flex items-center justify-center gap-1.5">
                                  <button
                                    onClick={() => updateDishQty(d.foodId, -1)}
                                    className="w-7 h-7 rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition text-sm font-bold text-slate-500 active:scale-90 flex items-center justify-center bg-white"
                                  >
                                    −
                                  </button>
                                  <span className="w-8 text-center font-bold text-slate-800">{d.quantity}</span>
                                  <button
                                    onClick={() => updateDishQty(d.foodId, 1)}
                                    className="w-7 h-7 rounded-xl border border-slate-200 hover:bg-slate-100 hover:border-slate-300 transition text-sm font-bold text-slate-500 active:scale-90 flex items-center justify-center bg-white"
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <span className="text-center block font-bold text-slate-800">{d.quantity}</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-500 font-medium">{money(price)}</td>
                            <td className="px-4 py-3 text-right font-bold text-slate-800">{money(price * d.quantity)}</td>
                            {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'CHECKED_IN') && (
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => removeDish(d.foodId)}
                                  className="w-6 h-6 rounded-full hover:bg-red-50 text-red-400 hover:text-red-600 transition flex items-center justify-center"
                                  title="Xoá"
                                >
                                  ✕
                                </button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-slate-100 border-dashed">
                  <p className="text-sm">Chưa chọn món ăn nào trước cho đơn đặt này.</p>
                </div>
              )}

              {/* save button */}
              {(selectedBooking.status === 'CONFIRMED' || selectedBooking.status === 'CHECKED_IN') && (
                <div className="flex justify-end mt-4">
                  <button
                    onClick={handleSaveDishes}
                    disabled={savingDishes}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-200/50 disabled:opacity-50 transition"
                  >
                    {savingDishes ? '⏳ Đang đồng bộ...' : '💾 Cập nhật danh sách món'}
                  </button>
                </div>
              )}
            </div>

            {/* ── Summary ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              {selectedBooking.promotion && (
                <div className="rounded-2xl border border-dashed border-purple-200 bg-purple-50/50 p-4 text-sm flex items-start gap-2.5">
                  <div className="text-xl">🎁</div>
                  <div>
                    <p className="font-bold text-purple-800">
                      Khuyến mãi: {selectedBooking.promotion.name}
                    </p>
                    <p className="text-purple-600 mt-0.5 text-xs">
                      Chiết khấu giảm giá {selectedBooking.promotion.discountPercent}% cho toàn hóa đơn
                    </p>
                  </div>
                </div>
              )}
              <div className="bg-slate-50/50 border border-slate-100 rounded-2xl p-4 space-y-2">
                <p className="flex justify-between text-slate-600">
                  <span>Tổng tiền món</span>
                  <span className="font-semibold text-slate-800">{money(editSubtotal)}</span>
                </p>
                <p className="flex justify-between text-emerald-600">
                  <span>Ưu đãi áp dụng</span>
                  <span className="font-semibold">-{money(selectedBooking.discountAmount ?? 0)}</span>
                </p>
                <div className="border-t border-slate-200 my-1 pt-2">
                  <p className="flex justify-between text-base font-bold text-slate-800">
                    <span>Tổng hóa đơn thanh toán</span>
                    <span className="text-indigo-600 text-lg">{money(editSubtotal - (selectedBooking.discountAmount ?? 0))}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* ═══ INVOICE MODAL ═══ */}
      <Modal
        isOpen={invoiceOpen && !!selectedBooking}
        onClose={() => setInvoiceOpen(false)}
        title="Xuất hoá đơn thanh toán"
        size="lg"
        footer={
          <div className="flex gap-2 justify-end">
            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 shadow shadow-purple-200/50 transition active:scale-95"
            >
              🖨 In hoá đơn (PDF)
            </button>
            <button
              onClick={() => setInvoiceOpen(false)}
              className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
            >
              Đóng
            </button>
          </div>
        }
      >
        {selectedBooking && (
          <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl max-w-md mx-auto shadow-inner">
            <div ref={invoiceRef} className="bg-white p-6 shadow-sm rounded-xl border border-slate-100" style={{ fontFamily: "'Segoe UI', sans-serif", color: '#222', fontSize: '13px' }}>
              <h1 style={{ fontSize: '22px', textAlign: 'center', fontWeight: 800, marginBottom: 2 }}>
                NHÀ HÀNG 3SHIP
              </h1>
              <p style={{ textAlign: 'center', color: '#666', fontSize: '11px', marginBottom: 4 }}>
                {selectedBooking.branch.name}
              </p>
              <p style={{ textAlign: 'center', color: '#888', fontSize: '10px', marginBottom: 12 }}>
                {selectedBooking.branch.address || 'Liên hệ: ' + (selectedBooking.branch.phone || '')}
              </p>
              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Mã đơn:</span><span style={{ fontWeight: 700 }}>{selectedBooking.id.substring(0, 8).toUpperCase()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Khách hàng:</span><span>{selectedBooking.user.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Bàn ăn:</span><span>{formatTableCode(selectedBooking.table.tableCode)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Số khách:</span><span>{selectedBooking.guests}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Thời gian:</span><span>{fmtDt(selectedBooking.reservedFrom)} – {fmtDt(selectedBooking.reservedTo)}</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '10px 0' }} />

              <table style={{ width: '100%', borderCollapse: 'collapse', margin: '8px 0' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '4px 2px', fontWeight: 700, fontSize: '12px' }}>Món</th>
                    <th style={{ textAlign: 'center', padding: '4px 2px', fontWeight: 700, fontSize: '12px' }}>SL</th>
                    <th style={{ textAlign: 'right', padding: '4px 2px', fontWeight: 700, fontSize: '12px' }}>Đ.Giá</th>
                    <th style={{ textAlign: 'right', padding: '4px 2px', fontWeight: 700, fontSize: '12px' }}>T.Tiền</th>
                  </tr>
                </thead>
                <tbody>
                  {editingDishes.map((d) => {
                    const price = getFoodPrice(d.foodId);
                    return (
                      <tr key={d.foodId} style={{ borderBottom: '1px solid #eee' }}>
                        <td style={{ padding: '4px 2px', fontSize: '12px' }}>{getFoodName(d.foodId)}</td>
                        <td style={{ padding: '4px 2px', fontSize: '12px', textAlign: 'center' }}>{d.quantity}</td>
                        <td style={{ padding: '4px 2px', fontSize: '12px', textAlign: 'right' }}>{money(price)}</td>
                        <td style={{ padding: '4px 2px', fontSize: '12px', textAlign: 'right', fontWeight: 600 }}>{money(price * d.quantity)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '10px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0' }}>
                <span>Tạm tính:</span><span>{money(editSubtotal)}</span>
              </div>
              {(selectedBooking.discountAmount ?? 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', color: '#16a34a' }}>
                  <span>Giảm giá ({selectedBooking.promotion?.name ?? ''}):</span>
                  <span>-{money(selectedBooking.discountAmount ?? 0)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: '16px', fontWeight: 700 }}>
                <span>TỔNG CỘNG:</span><span>{money(editSubtotal - (selectedBooking.discountAmount ?? 0))}</span>
              </div>

              <hr style={{ border: 'none', borderTop: '1px dashed #ccc', margin: '10px 0' }} />

              <p style={{ textAlign: 'center', fontSize: '11px', color: '#888', marginTop: 12 }}>
                Ngày in: {fmtDate(new Date().toISOString())}
              </p>
              <p style={{ textAlign: 'center', fontSize: '12px', marginTop: 6, fontWeight: 600 }}>
                Cảm ơn quý khách! Hẹn gặp lại! 🍜
              </p>
            </div>
          </div>
        )}
      </Modal>
    </PageContainer>
  );
};

export default BookingListPage;

