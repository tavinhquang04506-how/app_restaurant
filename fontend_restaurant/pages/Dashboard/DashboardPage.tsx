
import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import Button from '../../components/ui/Button';
import { restaurantApi } from '../../services/restaurantApi';
import type { Branch, Food, User, RestaurantTable, Booking, Promotion } from '../../types/types';
import { useAuth } from '../../context/AuthContext';
import { formatTableCode } from '../../utils/tableUtils';

const StatCard: React.FC<{
  icon: keyof typeof Icon;
  title: string;
  value: string | number;
  colorClass: string;
  iconBgClass: string;
  textColorClass: string;
}> = ({ icon, title, value, colorClass, iconBgClass, textColorClass }) => (
  <Card className="p-0 overflow-hidden relative group hover:shadow-[0_8px_30px_rgba(99,102,241,0.12)] transition-all duration-500 hover:-translate-y-1">
    <div className="p-6 flex items-center relative z-10">
      <div className={`p-3.5 rounded-2xl mr-4 shadow-sm transition-transform duration-500 group-hover:scale-110 ${iconBgClass}`}>
        <Icon name={icon} className={`h-6 w-6 ${textColorClass}`} />
      </div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{title}</p>
        <p className="text-2xl font-extrabold text-slate-800 tracking-tight">{value}</p>
      </div>
    </div>
    <div className={`absolute bottom-0 left-0 right-0 h-1 transition-all duration-500 group-hover:h-1.5 ${colorClass}`}></div>
  </Card>
);

const CustomTooltip = ({ active, payload, label, unit = 'bàn' }: any) => {
  if (active && payload && payload.length) {
    const value = payload[0].value;
    const name = payload[0].name || 'Số lượng';
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-xl text-xs text-slate-100 font-sans">
        <p className="font-bold mb-1 text-slate-300">{label}</p>
        <p className="text-indigo-400 font-medium">
          {name}: <span className="text-white text-sm font-bold">{unit === 'đ' ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(value) : `${value} ${unit}`}</span>
        </p>
      </div>
    );
  }
  return null;
};

interface DashboardPageProps {
  forceStaffView?: boolean;
}

const DashboardPage: React.FC<DashboardPageProps> = ({ forceStaffView }) => {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const isStaff = user?.role === 'STAFF' || forceStaffView;
  const isManager = user?.role === 'MANAGER';
  const [stats, setStats] = useState({
    users: 0,
    branches: 0,
    foods: 0,
    categories: 0,
    revenue: 0,
    activeGuests: 0,
    todayBookings: 0,
    completionRate: 0,
  });
  const [pieData, setPieData] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [topFoods, setTopFoods] = useState<Food[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchHighlights, setBranchHighlights] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New chart states
  const [chartTitle, setChartTitle] = useState('Quy mô bàn ăn của các chi nhánh (bàn)');
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartKey, setChartKey] = useState('Số bàn');
  const [unit, setUnit] = useState('bàn');

  useEffect(() => {
    if (isStaff) {
      setLoading(false);
      return;
    }
    const fetchData = async (silent = false) => {
      if (!silent) {
        setLoading(true);
      }
      setError(null);
      try {
        if (isManager) {
          const [branchesRes, categoriesRes, branchFoodsRes, branchTablesRes] = await Promise.all([
            restaurantApi.getBranches(),
            restaurantApi.getCategories(),
            user?.branchId ? restaurantApi.getBranchFoods({ page: 1, size: 6, branchId: user.branchId }) : Promise.resolve({ result: [], meta: { total: 0 } }),
            user?.branchId ? restaurantApi.getTablesByBranch(user.branchId) : Promise.resolve([]),
          ]);

          setStats({
            users: branchTablesRes.length,
            branches: 1,
            foods: branchFoodsRes.meta.total,
            categories: categoriesRes.length,
          });

          setRecentUsers([]);
          
          const foodsFromBranchFoods: Food[] = branchFoodsRes.result.map((bf: any) => ({
            id: bf.food.id,
            name: bf.food.name,
            description: bf.food.description || '',
            price: bf.price,
          }));
          setTopFoods(foodsFromBranchFoods);

          const myBranch = branchesRes.find((b: Branch) => b.id === user?.branchId);
          if (myBranch) {
            setBranches([myBranch]);
            setBranchHighlights([myBranch]);
          } else {
            setBranches([]);
            setBranchHighlights([]);
          }

          // Build capacity groupings for Manager
          const capacityGroups: Record<number, number> = {};
          branchTablesRes.forEach((t: any) => {
            capacityGroups[t.capacity] = (capacityGroups[t.capacity] || 0) + 1;
          });
          const groupedData = Object.entries(capacityGroups)
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .map(([capacity, count]) => ({
              name: `Bàn ${capacity} người`,
              'Số bàn': count,
            }));
          
          setChartData(groupedData);
          setChartKey('Số bàn');
          setChartTitle('Phân bổ bàn ăn theo sức chứa (bàn)');
          setUnit('bàn');
        } else {
          const d = new Date();
          const localDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          
          const [usersRes, branchesRes, foodsRes, categoriesRes, bookingsRes] = await Promise.all([
            restaurantApi.getUsers({ page: 1, size: 5 }),
            restaurantApi.getBranches(),
            restaurantApi.getFoods({ page: 1, size: 6 }),
            restaurantApi.getCategories(),
            restaurantApi.getBookings({ date: localDateStr }).catch(() => []),
          ]);

          // Calculate business BI metrics
          const bookingsList = Array.isArray(bookingsRes) ? bookingsRes : [];
          const completedBookings = bookingsList.filter((b: any) => b.status === 'COMPLETED');
          const todayRevenue = completedBookings.reduce((sum: number, b: any) => sum + (b.totalAmount || 0), 0);
          const activeGuests = bookingsList.filter((b: any) => b.status === 'CHECKED_IN').reduce((sum: number, b: any) => sum + (b.guests || 0), 0);
          
          const nonCancelledCount = bookingsList.filter((b: any) => b.status !== 'CANCELLED').length;
          const completedCount = completedBookings.length;
          const completionRate = nonCancelledCount > 0 ? Math.round((completedCount / nonCancelledCount) * 100) : 100;

          setStats({
            users: usersRes.meta.total,
            branches: branchesRes.length,
            foods: foodsRes.meta.total,
            categories: categoriesRes.length,
            revenue: todayRevenue,
            activeGuests,
            todayBookings: bookingsList.length,
            completionRate,
          });

          // Build status counts for Pie Chart
          const statusCounts = {
            CHECKED_IN: 0,
            CONFIRMED: 0,
            PENDING: 0,
            COMPLETED: 0,
            CANCELLED: 0,
          };
          bookingsList.forEach((b: any) => {
            if (statusCounts[b.status as keyof typeof statusCounts] !== undefined) {
              statusCounts[b.status as keyof typeof statusCounts]++;
            }
          });

          setPieData([
            { name: 'Đang ăn', value: statusCounts.CHECKED_IN || 0, color: '#10B981' },
            { name: 'Chờ đón', value: (statusCounts.CONFIRMED + statusCounts.PENDING) || 0, color: '#6366F1' },
            { name: 'Hoàn thành', value: statusCounts.COMPLETED || 0, color: '#64748B' },
            { name: 'Đã hủy', value: statusCounts.CANCELLED || 0, color: '#F43F5E' },
          ]);

          setRecentUsers(usersRes.result);
          setTopFoods(foodsRes.result);
          setBranches(branchesRes);
          setBranchHighlights(branchesRes.slice(0, 4));

          // Calculate revenue for each branch from today's bookings
          const branchRevenueMap: Record<string, number> = {};
          branchesRes.forEach((b: Branch) => {
            branchRevenueMap[b.id] = 0;
          });

          bookingsList.forEach((bk: any) => {
            if (bk.status === 'COMPLETED' && bk.branch?.id) {
              branchRevenueMap[bk.branch.id] = (branchRevenueMap[bk.branch.id] || 0) + (bk.totalAmount || 0);
            }
          });

          const branchRevenueData = branchesRes.map((b: Branch) => ({
            name: b.name.replace(/Chi nhánh|Nhà hàng/i, '').trim(),
            'Doanh thu': branchRevenueMap[b.id] || 0,
          }));

          setChartData(branchRevenueData);
          setChartKey('Doanh thu');
          setChartTitle('Doanh thu trong ngày của các chi nhánh (VND)');
          setUnit('đ');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu dashboard');
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    };

    if (isStaff) {
      setLoading(false);
      return;
    }
    fetchData();

    // Auto-refresh Admin data silently every 5 seconds
    const interval = setInterval(() => {
      fetchData(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [isStaff, isManager, branchId]);

  if (isStaff) {
    return <StaffDashboard />;
  }

  const pageTitle = isManager ? `Quản lý - ${user?.branchName || 'Chi nhánh'}` : 'Tổng Quan Hệ Thống';

  return (
    <PageContainer title={pageTitle} breadcrumb={['Dashboard']}>
      {error && (
        <Card className="mb-6 border-rose-100 bg-rose-50/50 p-4 rounded-2xl">
          <p className="text-sm font-medium text-rose-600 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard
          icon="chart"
          title={isManager ? 'Tổng số bàn ăn' : 'Tổng doanh thu sảnh hôm nay'}
          value={isManager ? `${stats.users} bàn` : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(stats.revenue)}
          colorClass="bg-indigo-500"
          iconBgClass="bg-indigo-50"
          textColorClass="text-indigo-600"
        />
        <StatCard
          icon="users"
          title={isManager ? 'Chi nhánh quản lý' : 'Khách đang ăn toàn chuỗi'}
          value={isManager ? stats.branches : `${stats.activeGuests} khách`}
          colorClass="bg-emerald-500"
          iconBgClass="bg-emerald-50"
          textColorClass="text-emerald-600"
        />
        <StatCard
          icon="calendar"
          title={isManager ? 'Món ăn chi nhánh' : 'Tổng đặt bàn hôm nay'}
          value={isManager ? stats.foods : `${stats.todayBookings} đơn`}
          colorClass="bg-rose-500"
          iconBgClass="bg-rose-50"
          textColorClass="text-rose-600"
        />
        <StatCard
          icon="clipboard"
          title={isManager ? 'Danh mục món' : 'Tỷ lệ hoàn thành lịch'}
          value={isManager ? `${stats.categories} danh mục` : `${stats.completionRate}%`}
          colorClass="bg-amber-500"
          iconBgClass="bg-amber-50"
          textColorClass="text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card title={chartTitle} className="rounded-2xl border border-slate-100 shadow-sm">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-400">Đang tải dữ liệu...</p>
              </div>
            ) : (
              <div style={{ width: '100%', height: 320 }} className="pt-4 pr-2">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <BarChart data={chartData} margin={{ top: 10, right: 0, left: -15, bottom: 5 }}>
                    <defs>
                      <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366F1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#A855F7" stopOpacity={0.8} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }}
                      dy={8}
                    />
                    <YAxis 
                      tickLine={false} 
                      axisLine={false} 
                      tick={{ fill: '#64748B', fontSize: 10, fontWeight: 500 }}
                      dx={-4}
                    />
                    <Tooltip content={<CustomTooltip unit={unit} />} cursor={{ fill: 'rgba(241, 245, 249, 0.4)' }} />
                    <Bar dataKey={chartKey} fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={60} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Card>
        </div>

        <div>
          {isManager ? (
            <Card title="Chi nhánh tiêu biểu" className="rounded-2xl border border-slate-100 shadow-sm h-full">
              {branchHighlights.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">Chưa có dữ liệu chi nhánh.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {branchHighlights.map((branch) => (
                    <div key={branch.id} className="group flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100/60 rounded-2xl transition-all duration-300">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white border border-slate-100 rounded-xl shadow-sm text-indigo-600 group-hover:scale-105 transition-transform duration-300">
                          <Icon name="calendar" className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors duration-300 truncate">{branch.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">{branch.address}</p>
                        </div>
                      </div>
                      <div className="shrink-0 text-right ml-2">
                        <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
                          {branch.openTime?.slice(0, 5)} - {branch.closeTime?.slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ) : (
            <Card title="Trạng thái lịch đặt bàn hôm nay" className="rounded-2xl border border-slate-100 shadow-sm h-full flex flex-col">
              {pieData.reduce((sum, item) => sum + item.value, 0) === 0 ? (
                <div className="text-center py-20 my-auto">
                  <p className="text-sm text-slate-400">Chưa có lịch đặt bàn nào hôm nay.</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col justify-between pt-2">
                  <div style={{ width: '100%', height: 180 }} className="relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
                    {pieData.map((item, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }}></span>
                        <span className="text-slate-500 font-medium truncate">{item.name}:</span>
                        <span className="font-extrabold text-slate-800">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>
      </div>


    </PageContainer>
  );
};

const StaffDashboard: React.FC = () => {
  const { user } = useAuth();
  const branchId = user?.branchId;
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [branchFoods, setBranchFoods] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [activeBooking, setActiveBooking] = useState<Booking | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

  const [searchFoodQuery, setSearchFoodQuery] = useState('');
  const [foodCategoryFilter, setFoodCategoryFilter] = useState('ALL');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [extraDishes, setExtraDishes] = useState<{ food: Food; quantity: number; specialNote: string }[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [tableFilter, setTableFilter] = useState<'ALL' | 'AVAILABLE' | 'UNAVAILABLE' | 'MAINTENANCE'>('ALL');

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const loadData = async (silent = false) => {
    if (!user?.branchId) return;
    if (!silent) {
      setLoading(true);
    }
    setError(null);
    try {
      const [tablesRes, bookingsRes, foodsRes, promosRes] = await Promise.all([
        restaurantApi.getTablesByBranch(user.branchId),
        restaurantApi.getBookings({ branchId: user.branchId }),
        restaurantApi.getBranchFoods({ branchId: user.branchId, size: 100 }),
        restaurantApi.getAvailablePromotions(),
      ]);
      setTables(tablesRes);
      setBookings(bookingsRes);
      setBranchFoods(foodsRes.result);
      setPromotions(promosRes);

      // Refresh selection if any
      if (selectedTable) {
        const t = tablesRes.find(x => x.id === selectedTable.id);
        if (t) {
          setSelectedTable(t);
          const bk = bookingsRes.find(
            b => b.table.id === t.id && (b.status === 'CHECKED_IN' || b.status === 'CONFIRMED')
          );
          setActiveBooking(bk || null);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [branchId]);

  useEffect(() => {
    if (!branchId) return;

    const interval = setInterval(() => {
      loadData(true); // silent background reload every 5 seconds
    }, 5000);

    return () => clearInterval(interval);
  }, [branchId, selectedTable]);

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    const bk = bookings.find(
      b => b.table.id === table.id && (b.status === 'CHECKED_IN' || b.status === 'CONFIRMED')
    );
    setActiveBooking(bk || null);
  };

  const handleCheckIn = async (booking: Booking) => {
    try {
      await restaurantApi.checkInBooking(booking.id);
      showToast(`Đã check-in thành công khách ${booking.user.username}!`);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Check-in thất bại', 'error');
    }
  };

  const handleStatusChange = async (tableId: string, newStatus: string) => {
    try {
      await restaurantApi.updateTableStatus(tableId, newStatus);
      showToast(`Đã chuyển trạng thái bàn sang ${newStatus === 'MAINTENANCE' ? 'Bảo trì' : 'Trống'}!`);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Cập nhật trạng thái thất bại', 'error');
    }
  };

  const handleAddExtraDish = (food: Food) => {
    setExtraDishes(prev => {
      const existing = prev.find(item => item.food.id === food.id);
      if (existing) {
        return prev.map(item =>
          item.food.id === food.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { food, quantity: 1, specialNote: '' }];
    });
  };

  const handleUpdateQuantity = (foodId: string, delta: number) => {
    setExtraDishes(prev =>
      prev.map(item => {
        if (item.food.id === foodId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      })
    );
  };

  const handleRemoveExtraDish = (foodId: string) => {
    setExtraDishes(prev => prev.filter(item => item.food.id !== foodId));
  };

  const handleUpdateNote = (foodId: string, note: string) => {
    setExtraDishes(prev =>
      prev.map(item => (item.food.id === foodId ? { ...item, specialNote: note } : item))
    );
  };

  const submitExtraOrder = async () => {
    if (!activeBooking) return;
    try {
      const existingPayload = activeBooking.dishes?.map(d => ({
        foodId: d.food.id,
        quantity: d.quantity,
        specialNote: d.specialNote || '',
        servingOrder: d.servingOrder || 0,
      })) || [];

      const newPayload = extraDishes.map(item => ({
        foodId: item.food.id,
        quantity: item.quantity,
        specialNote: item.specialNote || '',
        servingOrder: 0,
      }));

      await restaurantApi.updateBookingDishes(activeBooking.id, [...existingPayload, ...newPayload]);
      showToast('Gọi món thành công! Đã gửi order xuống nhà bếp.');
      setIsOrderModalOpen(false);
      setExtraDishes([]);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Gọi món thất bại', 'error');
    }
  };

  const handlePOSCheckout = async () => {
    if (!activeBooking) return;
    try {
      await restaurantApi.completeBooking(activeBooking.id);
      showToast('Thanh toán thành công! Bàn đã được dọn sạch và giải phóng.');
      setIsCheckoutModalOpen(false);
      setSelectedTable(null);
      setActiveBooking(null);
      setSelectedPromotion(null);
      loadData();
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Thanh toán thất bại', 'error');
    }
  };

  // Calculations
  const calculatedSubtotal = useMemo(() => {
    if (!activeBooking) return 0;
    return activeBooking.dishes?.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0) || 0;
  }, [activeBooking]);

  const discountAmount = useMemo(() => {
    if (!selectedPromotion) return 0;
    return Math.round((calculatedSubtotal * selectedPromotion.discountPercent) / 100);
  }, [selectedPromotion, calculatedSubtotal]);

  const calculatedTotal = useMemo(() => {
    const total = calculatedSubtotal - discountAmount;
    return total > 0 ? total : 0;
  }, [calculatedSubtotal, discountAmount]);

  const filteredTables = useMemo(() => {
    if (tableFilter === 'ALL') return tables;
    return tables.filter(t => t.status === tableFilter);
  }, [tables, tableFilter]);

  const filteredFoods = useMemo(() => {
    return branchFoods.filter(bf => {
      const food = bf.food;
      const matchesSearch = food.name.toLowerCase().includes(searchFoodQuery.toLowerCase()) || 
        (food.description && food.description.toLowerCase().includes(searchFoodQuery.toLowerCase()));
      if (foodCategoryFilter === 'ALL') return matchesSearch && bf.active;
      return matchesSearch && bf.active && food.category?.id === foodCategoryFilter;
    });
  }, [branchFoods, searchFoodQuery, foodCategoryFilter]);

  const uniqueCategories = useMemo(() => {
    const cats: Record<string, string> = {};
    branchFoods.forEach(bf => {
      if (bf.food.category) {
        cats[bf.food.category.id] = bf.food.category.name;
      }
    });
    return Object.entries(cats).map(([id, name]) => ({ id, name }));
  }, [branchFoods]);

  const tableStats = useMemo(() => {
    const total = tables.length;
    const available = tables.filter(t => t.status === 'AVAILABLE').length;
    const occupied = tables.filter(t => t.status === 'UNAVAILABLE').length;
    const maintenance = tables.filter(t => t.status === 'MAINTENANCE').length;
    return { total, available, occupied, maintenance };
  }, [tables]);

  const activeGuests = useMemo(() => {
    return bookings
      .filter(b => b.status === 'CHECKED_IN')
      .reduce((sum, b) => sum + b.guests, 0);
  }, [bookings]);

  const activeDishesCount = useMemo(() => {
    return bookings
      .filter(b => b.status === 'CHECKED_IN')
      .reduce((sum, b) => sum + (b.dishes?.reduce((s, d) => s + d.quantity, 0) || 0), 0);
  }, [bookings]);

  const nextBooking = useMemo(() => {
    const futureBookings = bookings
      .filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING')
      .sort((a, b) => a.reservedFrom.localeCompare(b.reservedFrom));
    return futureBookings[0] || null;
  }, [bookings]);

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const pageTitle = user?.role === 'MANAGER' 
    ? `Quản lý Phục vụ & POS - Chi nhánh ${user?.branchName || ''}` 
    : `Phục vụ Bàn & POS - Chi nhánh ${user?.branchName || ''}`;

  return (
    <PageContainer title={pageTitle} breadcrumb={['Dashboard', user?.role === 'MANAGER' ? 'Manager' : 'Staff']}>
      
      {/* Live sync banner */}
      <div className="flex justify-between items-center bg-emerald-50/50 border border-emerald-100/50 px-4 py-2.5 rounded-2xl mb-6 animate-pulse-slow">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-extrabold text-emerald-800">Hệ thống Phục Vụ & POS - Đồng Bộ Thời Gian Thực (5 giây)</span>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">Trạng thái: Hoạt động liên tục</span>
      </div>

      {user?.role === 'MANAGER' && (
        <>
          {/* Main Table Status Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6 animate-fade-in">
            {/* Card 1: Tổng số bàn */}
            <Card className="p-4 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600 mr-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="package" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tổng số bàn</p>
                  <p className="text-xl font-black text-slate-800">{tableStats.total} bàn</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-500"></div>
            </Card>

            {/* Card 2: Đang phục vụ */}
            <Card className="p-4 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 mr-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="users" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Đang có khách</p>
                  <p className="text-xl font-black text-slate-800">{tableStats.occupied} bàn</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500"></div>
            </Card>

            {/* Card 3: Bàn trống */}
            <Card className="p-4 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 mr-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="home" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bàn đang trống</p>
                  <p className="text-xl font-black text-slate-800">{tableStats.available} bàn</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"></div>
            </Card>

            {/* Card 4: Đang bảo trì */}
            <Card className="p-4 border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex items-center">
                <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 mr-4 shadow-sm group-hover:scale-105 transition-transform">
                  <Icon name="settings" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Bàn bảo trì</p>
                  <p className="text-xl font-black text-slate-800">{tableStats.maintenance} bàn</p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500"></div>
            </Card>
          </div>

          {/* Manager Real-time Insights Section */}
          <div className="bg-gradient-to-r from-indigo-50/40 via-violet-50/40 to-fuchsia-50/40 border border-indigo-100/60 rounded-3xl p-6 mb-6 shadow-sm flex flex-col md:flex-row justify-between items-stretch gap-6 animate-fade-in">
            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full uppercase tracking-wider">Hiệu suất vận hành</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-3">Kiểm Soát Vận Hành Chi Nhánh</h4>
                <p className="text-xs text-slate-400 mt-1">Dữ liệu tổng hợp thời gian thực của toàn bộ sảnh ăn.</p>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Tỷ lệ lấp đầy</p>
                  <p className="text-lg font-black text-indigo-600 mt-0.5">
                    {Math.round((tableStats.occupied / (tableStats.total || 1)) * 100)}%
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Khách tại sảnh</p>
                  <p className="text-lg font-black text-indigo-600 mt-0.5">{activeGuests} người</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400">Món đang chế biến</p>
                  <p className="text-lg font-black text-indigo-600 mt-0.5">{activeDishesCount} đĩa</p>
                </div>
              </div>
            </div>

            <div className="w-px bg-slate-200 hidden md:block shrink-0"></div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full uppercase tracking-wider">Đón tiếp khách hàng</span>
                <h4 className="text-base font-extrabold text-slate-800 mt-3">Lịch Hẹn Sắp Tới Gần Nhất</h4>
              </div>
              {nextBooking ? (
                <div className="mt-3 p-3 bg-white/70 border border-slate-100/60 rounded-2xl flex justify-between items-center gap-3">
                  <div>
                    <p className="font-extrabold text-xs text-slate-800">{nextBooking.user.username}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Bàn: {formatTableCode(nextBooking.table.tableCode)} ({nextBooking.guests} người)</p>
                  </div>
                  <span className="shrink-0 text-right px-2.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full">
                    ⏰ {nextBooking.reservedFrom.slice(11, 16)}
                  </span>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic mt-3">Hiện tại chưa có lịch đặt bàn mới sắp tới.</p>
              )}
            </div>
          </div>
        </>
      )}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-xl border animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {toast.type === 'success' ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {error && (
        <Card className="mb-6 border-rose-100 bg-rose-50/50 p-4 rounded-2xl">
          <p className="text-sm font-medium text-rose-600 flex items-center gap-2">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Table Grid & Control Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Sơ đồ Bàn ăn Chi nhánh</h3>
                <p className="text-xs text-slate-400 mt-1">Chọn bàn ăn để xem order, gọi thêm món hoặc thanh toán hóa đơn POS.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(['ALL', 'AVAILABLE', 'UNAVAILABLE', 'MAINTENANCE'] as const).map(status => {
                  const labels = { ALL: 'Tất cả', AVAILABLE: 'Trống', UNAVAILABLE: 'Đang có khách', MAINTENANCE: 'Bảo trì' };
                  const activeStyle = tableFilter === status ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
                  return (
                    <button
                      key={status}
                      onClick={() => setTableFilter(status)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-350 ${activeStyle}`}
                    >
                      {labels[status]}
                    </button>
                  );
                })}
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-sm text-slate-400">Đang tải dữ liệu bàn ăn...</p>
              </div>
            ) : filteredTables.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="package" className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <p className="text-sm text-slate-500">Không tìm thấy bàn ăn nào phù hợp với bộ lọc.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTables.map(table => {
                  const isSelected = selectedTable?.id === table.id;
                  let bgStyle = 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md';
                  let statusBadge = '';
                  let accentColor = 'bg-slate-200';

                  if (table.status === 'AVAILABLE') {
                    bgStyle = isSelected ? 'border-emerald-500 bg-emerald-50/20 shadow-lg shadow-emerald-500/5' : 'bg-white border-slate-100 hover:border-emerald-200 hover:shadow-md';
                    statusBadge = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    accentColor = 'bg-emerald-500';
                  } else if (table.status === 'UNAVAILABLE') {
                    bgStyle = isSelected ? 'border-indigo-500 bg-indigo-50/20 shadow-lg shadow-indigo-500/5' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md';
                    statusBadge = 'bg-indigo-50 text-indigo-600 border-indigo-100';
                    accentColor = 'bg-indigo-500';
                  } else if (table.status === 'MAINTENANCE') {
                    bgStyle = isSelected ? 'border-amber-500 bg-amber-50/20 shadow-lg shadow-amber-500/5' : 'bg-white border-slate-100 hover:border-amber-200 hover:shadow-md';
                    statusBadge = 'bg-amber-50 text-amber-600 border-amber-100';
                    accentColor = 'bg-amber-500';
                  }

                  const activeBk = bookings.find(
                    b => b.table.id === table.id && (b.status === 'CHECKED_IN' || b.status === 'CONFIRMED')
                  );

                  return (
                    <div
                      key={table.id}
                      onClick={() => handleTableClick(table)}
                      className={`group border rounded-2xl p-4 cursor-pointer relative overflow-hidden transition-all duration-350 ${bgStyle}`}
                    >
                      <div className={`absolute top-0 left-0 right-0 h-1.5 ${accentColor}`}></div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-extrabold text-slate-800 text-sm">{formatTableCode(table.tableCode, 'vi', true)}</span>
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold border rounded-full ${statusBadge}`}>
                          {table.status === 'AVAILABLE' ? 'Trống' : table.status === 'UNAVAILABLE' ? 'Khách' : 'Bảo trì'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">Sức chứa: {table.capacity} người</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">Khu vực: {table.location || 'Chung'}</p>
                      
                      {activeBk && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100/60">
                          <p className="text-[10px] font-bold text-indigo-600 truncate">👤 {activeBk.user.username}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">⏰ {activeBk.reservedFrom.slice(11, 16)}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Quick Actions Drawer for Selected Table */}
          {selectedTable && (
            <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl animate-slide-up">
              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
                <div>
                  <h4 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                    Chi tiết {formatTableCode(selectedTable.tableCode)}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">Sức chứa: {selectedTable.capacity} người | Khu vực: {selectedTable.location || 'Chung'}</p>
                </div>
                <button
                  onClick={() => setSelectedTable(null)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {selectedTable.status === 'AVAILABLE' && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                    </svg>
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Bàn trống sạch sẽ</h5>
                  <p className="text-xs text-slate-400 mt-1 mb-5">Sẵn sàng đón tiếp khách hàng hoặc xếp bàn từ lịch đặt trước.</p>
                  <Button variant="ghost" size="sm" onClick={() => handleStatusChange(selectedTable.id, 'MAINTENANCE')}>
                    Chuyển sang bảo trì
                  </Button>
                </div>
              )}

              {selectedTable.status === 'MAINTENANCE' && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <h5 className="font-bold text-slate-800 text-sm">Bàn đang dọn dẹp / bảo trì</h5>
                  <p className="text-xs text-slate-400 mt-1 mb-5">Vui lòng hoàn thành bảo trì trước khi đón tiếp khách mới.</p>
                  <Button variant="primary" size="sm" onClick={() => handleStatusChange(selectedTable.id, 'AVAILABLE')}>
                    Hoàn tất dọn dẹp & giải phóng bàn
                  </Button>
                </div>
              )}

              {selectedTable.status === 'UNAVAILABLE' && activeBooking && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-100 p-4 rounded-2xl text-xs">
                    <div>
                      <p className="text-slate-400">👤 Khách hàng:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeBooking.user.username}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">📞 Số điện thoại:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeBooking.user.phone || 'Chưa cập nhật'}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">👥 Số khách ngồi:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeBooking.guests} người</p>
                    </div>
                    <div>
                      <p className="text-slate-400">⏰ Thời gian khách đặt:</p>
                      <p className="font-bold text-slate-800 mt-0.5">{activeBooking.reservedFrom.slice(11, 16)}</p>
                    </div>
                    {activeBooking.specialRequest && (
                      <div className="sm:col-span-2 pt-2 border-t border-slate-200/50">
                        <p className="text-slate-400">📝 Yêu cầu đặc biệt:</p>
                        <p className="font-bold text-indigo-600 mt-0.5">"{activeBooking.specialRequest}"</p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h5 className="font-bold text-slate-800 text-xs mb-3 flex items-center justify-between">
                      <span>Món Ăn Đang Phục Vụ ({activeBooking.dishes?.length || 0})</span>
                      <span className="text-indigo-600 font-extrabold text-sm">{formatVnd(calculatedSubtotal)}</span>
                    </h5>
                    {(!activeBooking.dishes || activeBooking.dishes.length === 0) ? (
                      <div className="text-center py-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-400">Chưa có món ăn nào được gọi.</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {activeBooking.dishes.map(dish => (
                          <div key={dish.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center border border-slate-100 overflow-hidden shrink-0">
                                {dish.food.thumbUrl ? (
                                  <img src={dish.food.thumbUrl} className="w-full h-full object-cover" alt="" />
                                ) : (
                                  <Icon name="package" className="w-5 h-5 text-indigo-400" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-slate-800 truncate">{dish.food.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{formatVnd(dish.unitPrice)} x {dish.quantity}</p>
                                {dish.specialNote && (
                                  <span className="inline-block mt-1 px-1.5 py-0.5 bg-amber-50 text-amber-600 border border-amber-100 text-[8px] font-bold rounded">
                                    💡 {dish.specialNote}
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-xs font-bold text-slate-700 ml-2 shrink-0">{formatVnd(dish.unitPrice * dish.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button
                      variant="primary"
                      className="flex-1 justify-center gap-1.5 py-2.5 rounded-xl shadow-lg shadow-indigo-100"
                      onClick={() => {
                        setExtraDishes([]);
                        setIsOrderModalOpen(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Gọi thêm món
                    </Button>
                    <Button
                      variant="secondary"
                      className="flex-1 justify-center gap-1.5 py-2.5 rounded-xl bg-slate-800 text-white border-slate-800 hover:bg-slate-900"
                      onClick={() => {
                        setSelectedPromotion(null);
                        setIsCheckoutModalOpen(true);
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Thanh toán (POS)
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}
        </div>

        {/* Right Side: Sidebar for Today's Bookings */}
        <div>
          <Card className="p-6 border border-slate-100 shadow-sm rounded-3xl h-full">
            <div className="pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Icon name="calendar" className="h-5 w-5 text-indigo-600" />
                Lịch Đặt Bàn Hôm Nay
              </h3>
              <p className="text-xs text-slate-400 mt-1">Danh sách đặt trước cần đón tiếp và check-in trong ngày.</p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2">
                <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-xs text-slate-400">Đang tải...</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-16">
                <Icon name="calendar" className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Hôm nay không có lịch đặt trước nào.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
                {bookings.map(booking => {
                  let statusBadge = '';
                  let actionBtn = null;

                  if (booking.status === 'CONFIRMED' || booking.status === 'PENDING') {
                    statusBadge = 'bg-blue-50 text-blue-600 border-blue-100';
                    actionBtn = (
                      <Button
                        variant="primary"
                        size="sm"
                        className="py-1 px-3 text-[10px] font-bold rounded-lg shadow-sm"
                        onClick={() => handleCheckIn(booking)}
                      >
                        Check-in
                      </Button>
                    );
                  } else if (booking.status === 'CHECKED_IN') {
                    statusBadge = 'bg-emerald-50 text-emerald-600 border-emerald-100';
                    actionBtn = (
                      <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                        ✓ Tại bàn {booking.table.tableCode}
                      </span>
                    );
                  } else if (booking.status === 'COMPLETED') {
                    statusBadge = 'bg-slate-50 text-slate-500 border-slate-100';
                    actionBtn = <span className="text-[10px] text-slate-400 font-bold">Đã hoàn thành</span>;
                  } else if (booking.status === 'CANCELLED') {
                    statusBadge = 'bg-rose-50 text-rose-500 border-rose-100';
                    actionBtn = <span className="text-[10px] text-rose-400 font-bold">Đã hủy</span>;
                  }

                  return (
                    <div
                      key={booking.id}
                      className="group flex flex-col p-4 bg-slate-50/50 border border-slate-100 hover:bg-slate-50 rounded-2xl transition-all duration-300"
                    >
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="inline-flex items-center px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full">
                          ⏰ {booking.reservedFrom.slice(11, 16)}
                        </span>
                        <span className={`px-2 py-0.5 text-[8px] font-bold border rounded-full ${statusBadge}`}>
                          {booking.status}
                        </span>
                      </div>

                      <div className="min-w-0 mb-3">
                        <p className="font-extrabold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                          {booking.user.username}
                        </p>
                        <p className="text-xs text-slate-500 mt-1 truncate">📞 {booking.user.phone || 'Chưa có SĐT'}</p>
                        <p className="text-xs text-slate-400 mt-0.5">🪑 {booking.table.tableCode} ({booking.guests} khách)</p>
                      </div>

                      <div className="flex justify-between items-center pt-2.5 border-t border-slate-100/80">
                        <span className="text-[10px] text-slate-400">Order đặt trước: {booking.dishes?.length || 0} món</span>
                        {actionBtn}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Modal: Food Order / Gọi thêm món */}
      {isOrderModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-lg font-bold text-slate-800">Thực đơn Gọi Thêm Món - Bàn {activeBooking.table.tableCode}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Khách hàng: {activeBooking.user.username} | Vui lòng chọn các món ăn/đồ uống phát sinh.</p>
              </div>
              <button
                onClick={() => {
                  setIsOrderModalOpen(false);
                  setExtraDishes([]);
                }}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Menu Items list */}
              <div className="flex-1 overflow-hidden flex flex-col p-6 border-r border-slate-100">
                <div className="flex gap-3 mb-4 shrink-0">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Tìm món ăn hoặc đồ uống..."
                      value={searchFoodQuery}
                      onChange={e => setSearchFoodQuery(e.target.value)}
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 pl-9 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                    />
                    <svg className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <select
                    value={foodCategoryFilter}
                    onChange={e => setFoodCategoryFilter(e.target.value)}
                    className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-600 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ALL">Tất cả danh mục</option>
                    {uniqueCategories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto pr-1">
                  {filteredFoods.length === 0 ? (
                    <div className="text-center py-20">
                      <p className="text-sm text-slate-400 font-medium">Không tìm thấy món ăn nào phù hợp.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredFoods.map(bf => (
                        <div
                          key={bf.id}
                          onClick={() => handleAddExtraDish(bf.food)}
                          className="flex gap-3 p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer transition-all hover:-translate-y-0.5 group"
                        >
                          <div className="w-14 h-14 rounded-xl bg-white border border-slate-100 overflow-hidden shrink-0">
                            {bf.food.thumbUrl ? (
                              <img src={bf.food.thumbUrl} className="w-full h-full object-cover" alt="" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-indigo-400">🍔</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-800 group-hover:text-indigo-600 transition-colors truncate">{bf.food.name}</p>
                            <p className="text-[10px] text-slate-400 truncate mt-0.5">{bf.food.description || 'Chưa cập nhật mô tả.'}</p>
                            <p className="font-extrabold text-xs text-indigo-600 mt-1">{formatVnd(bf.price)}</p>
                          </div>
                          <div className="shrink-0 flex items-center justify-center">
                            <span className="p-1 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Ordered Extra Items & Chef Notes */}
              <div className="w-full md:w-80 bg-slate-50/50 p-6 overflow-y-auto flex flex-col shrink-0">
                <h5 className="font-extrabold text-slate-800 text-sm mb-4">Các Món Gọi Thêm ({extraDishes.length})</h5>
                
                {extraDishes.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 py-10">
                    <p className="text-xs">Chưa có món nào được chọn.</p>
                    <p className="text-[10px] mt-1">Vui lòng nhấp vào món ăn bên trái để thêm.</p>
                  </div>
                ) : (
                  <div className="flex-1 space-y-4 mb-6">
                    {extraDishes.map(item => (
                      <div key={item.food.id} className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                          <p className="font-bold text-xs text-slate-800 truncate pr-2 flex-1">{item.food.name}</p>
                          <button
                            onClick={() => handleRemoveExtraDish(item.food.id)}
                            className="text-slate-300 hover:text-rose-500 p-0.5 rounded transition-colors shrink-0"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                        
                        <div className="flex justify-between items-center mb-2.5">
                          <span className="text-[10px] text-slate-400">{formatVnd(item.food.price)}</span>
                          <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-lg p-0.5 shrink-0">
                            <button
                              onClick={() => handleUpdateQuantity(item.food.id, -1)}
                              className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 rounded font-bold"
                            >
                              -
                            </button>
                            <span className="text-xs font-bold text-slate-700 min-w-4 text-center">{item.quantity}</span>
                            <button
                              onClick={() => handleUpdateQuantity(item.food.id, 1)}
                              className="px-1.5 py-0.5 text-slate-500 hover:bg-slate-200 rounded font-bold"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div>
                          <input
                            type="text"
                            placeholder="Ghi chú bếp (vd: không hành, ít cay...)"
                            value={item.specialNote}
                            onChange={e => handleUpdateNote(item.food.id, e.target.value)}
                            className="w-full text-[10px] bg-slate-50 border border-slate-100 rounded-lg p-1.5 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5 rounded-xl shadow-lg shadow-indigo-100 font-bold text-xs"
                  onClick={submitExtraOrder}
                  disabled={extraDishes.length === 0}
                >
                  Xác nhận & Gửi nhà bếp
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: POS Billing & VietQR Checkout */}
      {isCheckoutModalOpen && activeBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col animate-scale-up">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div>
                <h4 className="text-lg font-bold text-slate-800">POS Thanh Toán Hóa Đơn - Bàn {activeBooking.table.tableCode}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Xác nhận đơn hàng, áp dụng chương trình khuyến mãi và hiển thị mã VietQR chuyển khoản.</p>
              </div>
              <button
                onClick={() => setIsCheckoutModalOpen(false)}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
              {/* Left Column: Invoice Items details */}
              <div className="flex-1 overflow-y-auto p-6 border-r border-slate-100 flex flex-col">
                <h5 className="font-extrabold text-slate-800 text-sm mb-4">Chi Tiết Phiếu Tạm Tính</h5>
                <div className="flex-1 space-y-3 mb-6 pr-1 max-h-[360px] overflow-y-auto">
                  {activeBooking.dishes?.map(dish => (
                    <div key={dish.id} className="flex justify-between items-center py-2.5 border-b border-slate-100/60 text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{dish.food.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{formatVnd(dish.unitPrice)} x {dish.quantity}</p>
                      </div>
                      <span className="font-bold text-slate-700">{formatVnd(dish.unitPrice * dish.quantity)}</span>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl space-y-3 text-xs shrink-0">
                  <div className="flex justify-between items-center text-slate-500">
                    <span>Tổng tiền món ăn:</span>
                    <span className="font-bold text-slate-700">{formatVnd(calculatedSubtotal)}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2.5 border-t border-slate-200/50">
                    <span className="text-slate-500">Áp dụng Khuyến mãi chi nhánh:</span>
                    <select
                      value={selectedPromotion?.id || ''}
                      onChange={e => {
                        const promo = promotions.find(p => p.id === e.target.value);
                        setSelectedPromotion(promo || null);
                      }}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] font-bold text-indigo-600 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">Không sử dụng</option>
                      {promotions.map(promo => (
                        <option key={promo.id} value={promo.id}>
                          🎟️ {promo.code} (-{promo.discountPercent}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedPromotion && (
                    <div className="flex justify-between items-center text-rose-500 font-bold">
                      <span>Mã giảm giá ({selectedPromotion.code}):</span>
                      <span>-{formatVnd(discountAmount)}</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-black text-slate-800">
                    <span>Số tiền thanh toán:</span>
                    <span className="text-indigo-600 text-base">{formatVnd(calculatedTotal)}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic VietQR Payment box */}
              <div className="w-full md:w-96 bg-slate-50/50 p-6 flex flex-col items-center justify-center text-center shrink-0">
                <h5 className="font-extrabold text-slate-800 text-sm mb-2">Quét Mã QR Chuyển Khoản</h5>
                <p className="text-[11px] text-slate-400 mb-5">Hệ thống tạo mã VietQR động chứa chính xác số tiền cần thanh toán trong 3 giây.</p>

                <div className="w-56 h-56 bg-white border border-slate-100 rounded-2xl shadow-md p-3 flex flex-col items-center justify-center overflow-hidden relative mb-4">
                  <img
                    src={`https://img.vietqr.io/image/MB-9704060868688-compact2.png?amount=${calculatedTotal}&addInfo=Thanh%20toan%20ban%20${activeBooking.table.tableCode.replace(/\s+/g, '')}%20booking%20${activeBooking.id.slice(-6)}&accountName=3SHIP%20RESTAURANT`}
                    className="w-full h-full object-contain"
                    alt="VietQR code"
                  />
                </div>

                <div className="text-[11px] text-slate-500 bg-white border border-slate-100/60 p-3.5 rounded-xl w-full text-left space-y-1 mb-6 shadow-sm">
                  <p>🏦 <span className="font-bold text-slate-700">Ngân hàng:</span> MB Bank (Quân Đội)</p>
                  <p>💳 <span className="font-bold text-slate-700">Số tài khoản:</span> 9704060868688</p>
                  <p>👤 <span className="font-bold text-slate-700">Chủ tài khoản:</span> 3SHIP RESTAURANT</p>
                  <p>💵 <span className="font-bold text-slate-700">Số tiền:</span> <span className="font-black text-indigo-600">{formatVnd(calculatedTotal)}</span></p>
                  <p className="truncate">📝 <span className="font-bold text-slate-700">Nội dung:</span> Thanh toan ban {activeBooking.table.tableCode.replace(/\s+/g, '')}</p>
                </div>

                <Button
                  variant="primary"
                  className="w-full justify-center py-2.5 rounded-xl shadow-lg bg-emerald-600 hover:bg-emerald-700 border-emerald-600 hover:shadow-emerald-100 font-extrabold text-xs"
                  onClick={handlePOSCheckout}
                >
                  Xác nhận & Hoàn tất thanh toán
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
};

export default DashboardPage;
