import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { restaurantApi } from '../../services/restaurantApi';
import type { Branch, BranchFood, Food, PaginationMeta } from '../../types/types';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const priceFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const PAGE_SIZE = 20;

const BranchFoodPage: React.FC = () => {
  const [branchFoods, setBranchFoods] = useState<BranchFood[]>([]);
  const { showToast } = useToast();
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [page, setPage] = useState(1);
  const { user } = useAuth();
  const isStaff = user?.role === 'STAFF';
  const isManager = user?.role === 'MANAGER';
  const isStaffOrManager = isStaff || isManager;
  const cannotEditMenu = isStaff || isManager;
  const managedBranchId = isStaffOrManager ? user?.branchId ?? '' : '';
  const missingManagedBranch = isStaffOrManager && !managedBranchId;
  const [filters, setFilters] = useState({ branchId: managedBranchId, keyword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    branchId: '',
    foodId: '',
    price: 0,
  });
  const [modalLoading, setModalLoading] = useState(false);
  const [existingFoodIds, setExistingFoodIds] = useState<string[]>([]);

  const loadBranchFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    if (missingManagedBranch) {
      setBranchFoods([]);
      setMeta(null);
      setLoading(false);
      setError('Bạn chưa được gán chi nhánh, vui lòng liên hệ quản trị viên.');
      return;
    }
    try {
      const data = await restaurantApi.getBranchFoods({
        page,
        size: PAGE_SIZE,
        branchId: (isStaffOrManager ? managedBranchId : filters.branchId) || undefined,
        keyword: filters.keyword || undefined,
      });
      setBranchFoods(data.result);
      setMeta(data.meta);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Không thể tải danh sách món theo chi nhánh';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.branchId, filters.keyword, isStaffOrManager, managedBranchId, missingManagedBranch, page, showToast]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [branchList, foodList] = await Promise.all([
          restaurantApi.getBranches(),
          restaurantApi.getFoods({ page: 1, size: 50 }),
        ]);
        setBranches(branchList);
        setFoods(foodList.result);
        const firstFood = foodList.result[0];
        setFormValues((prev) => ({
          ...prev,
          branchId: branchList[0]?.id ?? '',
          foodId: firstFood?.id ?? '',
          price: firstFood?.price ?? 0,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu tham chiếu';
        setError(message);
        showToast(message, 'error');
      }
    };
    bootstrap();
  }, [showToast]);

  useEffect(() => {
    loadBranchFoods();
  }, [loadBranchFoods]);

  useEffect(() => {
    if (isStaffOrManager) {
      setFilters((prev) => ({ ...prev, branchId: managedBranchId }));
      setFormValues((prev) => ({ ...prev, branchId: managedBranchId || prev.branchId }));
    }
  }, [isStaffOrManager, managedBranchId]);

  const branchOptions = useMemo(() => {
    if (isStaffOrManager && managedBranchId) {
      const branch = branches.find((b) => b.id === managedBranchId);
      return branch
        ? [{ value: branch.id, label: branch.name }]
        : [{ value: managedBranchId, label: user?.branchName ?? 'Chi nhánh của bạn' }];
    }
    return [{ value: '', label: 'Tất cả chi nhánh' }].concat(
      branches.map((branch) => ({ value: branch.id, label: branch.name }))
    );
  }, [branches, isStaffOrManager, managedBranchId, user?.branchName]);

  const modalBranchOptions = useMemo(() => {
    if (isStaffOrManager && managedBranchId) {
      const branch = branches.find((b) => b.id === managedBranchId);
      return branch
        ? [{ value: branch.id, label: branch.name }]
        : [{ value: managedBranchId, label: user?.branchName ?? 'Chi nhánh của bạn' }];
    }
    return branches.map((branch) => ({ value: branch.id, label: branch.name }));
  }, [branches, isStaffOrManager, managedBranchId, user?.branchName]);

  const modalFoodOptions = useMemo(() => {
    const availableFoods = foods.filter((food) => !existingFoodIds.includes(food.id));
    return availableFoods.map((food) => ({ value: food.id, label: food.name }));
  }, [foods, existingFoodIds]);
  const noAvailableFoods = modalFoodOptions.length === 0;

  // Tải danh sách tất cả món ăn đã có tại chi nhánh được chọn trong Modal
  useEffect(() => {
    if (!modalOpen || !formValues.branchId) {
      setExistingFoodIds([]);
      return;
    }

    const fetchExistingFoods = async () => {
      setModalLoading(true);
      try {
        const data = await restaurantApi.getBranchFoods({
          branchId: formValues.branchId,
          size: 1000, // Lấy toàn bộ danh sách, tránh phân trang
        });
        const ids = data.result.map((item) => item.food.id);
        setExistingFoodIds(ids);

        // Chọn món ăn khả dụng đầu tiên và set cho form
        const available = foods.filter((f) => !ids.includes(f.id));
        const firstAvailable = available[0];
        setFormValues((prev) => ({
          ...prev,
          foodId: firstAvailable?.id ?? '',
          price: firstAvailable?.price ?? 0,
        }));
      } catch (err) {
        console.error('Không thể lấy danh sách món ăn đã có của chi nhánh:', err);
      } finally {
        setModalLoading(false);
      }
    };

    fetchExistingFoods();
  }, [modalOpen, formValues.branchId, foods]);

  const handleChangeFilter = (name: string, value: string) => {
    setPage(1);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const openModal = () => {
    const targetBranchId = isStaffOrManager ? managedBranchId : branches[0]?.id ?? '';
    setFormValues({
      branchId: targetBranchId,
      foodId: '',
      price: 0,
    });
    setModalOpen(true);
  };

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => {
      const updates: any = {
        ...prev,
        [name]: name === 'price' ? Number(value) : value,
      };
      
      // Khi chọn chi nhánh, reset foodId để trigger useEffect tải lại món ăn khả dụng
      if (name === 'branchId') {
        updates.foodId = '';
        updates.price = 0;
      }
      
      // Khi chọn món ăn, tự động set giá từ món ăn đó
      if (name === 'foodId') {
        const selectedFood = foods.find((f) => f.id === value);
        updates.price = selectedFood?.price ?? 0;
      }
      
      return updates;
    });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cannotEditMenu) return;
    setSubmitting(true);
    try {
      await restaurantApi.createBranchFood({
        branchId: formValues.branchId,
        foodId: formValues.foodId,
        price: formValues.price,
      });
      setModalOpen(false);
      loadBranchFoods();
      showToast('Đã thêm món vào chi nhánh', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thêm món vào chi nhánh';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (item: BranchFood) => {
    try {
      await restaurantApi.updateBranchFoodActive(item.id, !item.active);
      loadBranchFoods();
      showToast(
        `${item.food.name} đã được ${item.active ? 'tạm dừng' : 'bật bán'} tại ${item.branch.name}`,
        'success'
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleUpdatePrice = async (item: BranchFood) => {
    if (cannotEditMenu) return;
    const input = window.prompt('Nhập giá mới cho món này (VND)', String(item.price));
    if (!input) return;
    const value = Number(input);
    if (Number.isNaN(value) || value < 1000) {
      window.alert('Giá không hợp lệ');
      return;
    }
    try {
      await restaurantApi.updateBranchFoodPrice(item.id, value);
      loadBranchFoods();
      showToast('Đã cập nhật giá bán', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể cập nhật giá';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleDelete = async (item: BranchFood) => {
    if (cannotEditMenu) return;
    if (!window.confirm('Xóa món này khỏi chi nhánh?')) return;
    try {
      await restaurantApi.deleteBranchFood(item.id);
      loadBranchFoods();
      showToast('Đã xóa món khỏi chi nhánh', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa món';
      setError(message);
      showToast(message, 'error');
    }
  };

  const columns = [
    {
      header: 'Chi nhánh',
      accessor: (item: BranchFood) => item.branch.name,
    },
    {
      header: 'Món ăn',
      accessor: (item: BranchFood) => item.food.name,
    },
    {
      header: 'Giá',
      accessor: (item: BranchFood) => priceFormatter.format(item.price),
    },
    {
      header: 'Trạng thái',
      accessor: (item: BranchFood) => (
        <Badge color={item.active ? 'green' : 'red'} size="sm">
          {item.active ? 'Đang bán' : 'Tạm dừng'}
        </Badge>
      ),
    },
    {
      header: 'Hành động',
      accessor: (item: BranchFood) => (
        <div className="flex flex-wrap gap-2">
          <Button variant={item.active ? 'secondary' : 'primary'} size="sm" onClick={() => handleToggleActive(item)}>
            {item.active ? 'Tắt' : 'Bật'}
          </Button>
          {!cannotEditMenu && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleUpdatePrice(item)}>
                Giá
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleDelete(item)}>
                Xóa
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Món ăn chi nhánh" breadcrumb={['Dashboard', 'Món ăn chi nhánh']}>
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1">
            {isStaffOrManager ? (
              <div className="px-4 py-2 rounded-lg border text-sm text-gray-600 bg-gray-50 flex items-center">
                Chi nhánh: {user?.branchName ?? 'Chưa được gán'}
              </div>
            ) : (
              <Select
                value={filters.branchId}
                onChange={(e) => handleChangeFilter('branchId', e.target.value)}
                options={branchOptions}
              />
            )}
            <div className="md:col-span-2">
              <Input
                placeholder="Tìm kiếm món ăn..."
                value={filters.keyword}
                onChange={(e) => handleChangeFilter('keyword', e.target.value)}
              />
            </div>
          </div>
          {!cannotEditMenu && <Button onClick={openModal}>+ Thêm món vào chi nhánh</Button>}
        </div>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {missingManagedBranch ? (
          <p className="text-center text-gray-500 py-10">
            Bạn chưa được gán chi nhánh, vui lòng liên hệ quản trị viên.
          </p>
        ) : loading ? (
          <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
        ) : (
          <>
            <Table columns={columns} data={branchFoods} />
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                Tổng: <strong>{meta?.total ?? 0}</strong> món/chi nhánh
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                >
                  Trang trước
                </Button>
                
                {Array.from({ length: meta?.pages ?? 1 }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={page === pageNum ? 'primary' : 'ghost'}
                    size="sm"
                    onClick={() => setPage(pageNum)}
                    className="w-8 h-8 !p-0 flex items-center justify-center rounded-lg font-bold"
                  >
                    {pageNum}
                  </Button>
                ))}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setPage((prev) => (meta && prev < meta.pages ? prev + 1 : prev))
                  }
                  disabled={!meta || page >= (meta?.pages ?? 1)}
                >
                  Trang sau
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Thêm món vào chi nhánh"
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleCreate}>
          <Select
            label="Chi nhánh"
            name="branchId"
            value={formValues.branchId}
            onChange={handleFormChange}
            options={
              modalBranchOptions.length > 0
                ? modalBranchOptions
                : [{ value: '', label: 'Chưa có chi nhánh' }]
            }
            required
          />
          <Select
            label="Món ăn"
            name="foodId"
            value={formValues.foodId}
            onChange={handleFormChange}
            options={
              modalFoodOptions.length > 0
                ? modalFoodOptions
                : [{ value: '', label: 'Không còn món phù hợp' }]
            }
            disabled={noAvailableFoods || modalLoading}
            required
          />
          {modalLoading && (
            <p className="text-xs text-indigo-600 animate-pulse mt-1">
              ⌛ Đang tìm kiếm các món ăn chưa có tại chi nhánh...
            </p>
          )}
          <Input
            label="Giá bán"
            type="number"
            min={1000}
            step={1000}
            name="price"
            value={formValues.price}
            onChange={handleFormChange}
            disabled={modalLoading}
            required
          />

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting} disabled={noAvailableFoods || modalLoading}>
              Lưu
            </Button>
          </div>
          {noAvailableFoods && !modalLoading && (
            <p className="text-sm text-red-500 text-center">
              Chi nhánh đã có tất cả các món hiện có. Vui lòng thêm món mới trước khi gán.
            </p>
          )}
        </form>
      </Modal>
    </PageContainer>
  );
};

export default BranchFoodPage;

