import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { restaurantApi } from '../../services/restaurantApi';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import type { RestaurantTable, Branch } from '../../types/types';
import { formatTableCode } from '../../utils/tableUtils';

const defaultFormValues = {
  tableCode: '',
  capacity: 4,
  location: 'Tầng 1',
};

const TablesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';
  const isManager = user?.role === 'MANAGER';

  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search
  const [search, setSearch] = useState('');
  const [capacityFilter, setCapacityFilter] = useState('');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [submitting, setSubmitting] = useState(false);

  // Load branches (Admin can select any, Manager is locked to their own)
  useEffect(() => {
    const loadBranches = async () => {
      try {
        const res = await restaurantApi.getBranches();
        setBranches(res);
        if (isManager && user?.branchId) {
          setSelectedBranchId(user.branchId);
        } else if (res.length > 0) {
          setSelectedBranchId(res[0].id);
        }
      } catch {
        showToast('Không thể tải danh sách chi nhánh', 'error');
      }
    };
    loadBranches();
  }, [isManager, user?.branchId, showToast]);

  // Load tables for selected branch
  const loadTables = useCallback(async () => {
    if (!selectedBranchId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.getTablesByBranch(selectedBranchId);
      setTables(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách bàn ăn';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedBranchId, showToast]);

  useEffect(() => {
    loadTables();
  }, [loadTables]);

  const filteredTables = useMemo(() => {
    let result = tables;
    
    // Sort tables by code numerically
    result = [...result].sort((a, b) => 
      a.tableCode.localeCompare(b.tableCode, undefined, { numeric: true, sensitivity: 'base' })
    );

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (t) =>
          t.tableCode.toLowerCase().includes(q) ||
          (t.location && t.location.toLowerCase().includes(q))
      );
    }

    if (capacityFilter) {
      const cap = Number(capacityFilter);
      result = result.filter((t) => t.capacity === cap);
    }

    return result;
  }, [tables, search, capacityFilter]);

  const handleStatusToggle = async (table: RestaurantTable) => {
    const nextStatus = table.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE';
    try {
      await restaurantApi.updateTableStatus(table.id, nextStatus);
      showToast(
        `Đã cập nhật bàn ${formatTableCode(table.tableCode, 'vi')} sang ${
          nextStatus === 'AVAILABLE' ? 'Sẵn sàng phục vụ' : 'Bảo trì'
        }`,
        'success'
      );
      loadTables();
    } catch (err) {
      showToast('Cập nhật trạng thái thất bại', 'error');
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.tableCode.trim()) {
      showToast('Mã bàn không được để trống', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await restaurantApi.createTable({
        branchId: selectedBranchId,
        tableCode: formValues.tableCode.trim().toUpperCase(),
        capacity: Number(formValues.capacity),
        location: formValues.location.trim() || undefined,
      });
      showToast(`Đã thêm bàn ${formValues.tableCode.toUpperCase()} thành công`, 'success');
      setIsAddModalOpen(false);
      setFormValues(defaultFormValues);
      loadTables();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Thêm bàn thất bại';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const currentBranchName = useMemo(() => {
    const b = branches.find((x) => x.id === selectedBranchId);
    return b ? b.name : 'Chi nhánh';
  }, [branches, selectedBranchId]);

  const columns = [
    {
      header: 'Mã bàn ăn',
      accessor: (item: RestaurantTable) => (
        <span className="font-extrabold text-slate-800 text-sm whitespace-normal break-words min-w-[80px] inline-block">
          {formatTableCode(item.tableCode, 'vi', true)}
        </span>
      ),
    },
    {
      header: 'Sức chứa',
      accessor: (item: RestaurantTable) => (
        <span className="font-semibold text-slate-700">{item.capacity} người</span>
      ),
    },
    {
      header: 'Vị trí / Khu vực',
      accessor: (item: RestaurantTable) => (
        <span className="text-slate-500 font-medium">{item.location || 'Khu chung'}</span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (item: RestaurantTable) => {
        if (item.status === 'AVAILABLE') {
          return <Badge color="green">Còn trống</Badge>;
        }
        if (item.status === 'UNAVAILABLE') {
          return <Badge color="purple">Đang có khách</Badge>;
        }
        return <Badge color="amber">Đang bảo trì</Badge>;
      },
    },
    {
      header: 'Thao tác bảo trì',
      accessor: (item: RestaurantTable) => {
        const isUnavailable = item.status === 'UNAVAILABLE';
        return (
          <div className="flex space-x-2">
            <Button
              variant={item.status === 'MAINTENANCE' ? 'primary' : 'ghost'}
              size="sm"
              disabled={isUnavailable}
              onClick={() => handleStatusToggle(item)}
              title={isUnavailable ? 'Bàn đang có khách ngồi ăn, không thể đưa vào bảo trì' : ''}
            >
              {item.status === 'MAINTENANCE' ? 'Hoàn tất bảo trì' : 'Đưa vào bảo trì'}
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer
      title={`Sơ đồ Bàn ăn - ${currentBranchName}`}
      description="Quản lý chi tiết danh sách bàn ăn, sức chứa, vị trí và trạng thái vận hành của bàn ăn chi nhánh."
    >
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1 max-w-2xl">
            {isAdmin && (
              <div className="w-full sm:w-64">
                <Select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                />
              </div>
            )}
            <div className="flex-1">
              <Input
                placeholder="Tìm mã bàn hoặc khu vực..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-44">
              <Select
                value={capacityFilter}
                onChange={(e) => setCapacityFilter(e.target.value)}
                options={[
                  { value: '', label: 'Tất cả sức chứa' },
                  { value: '2', label: 'Bàn 2 người' },
                  { value: '4', label: 'Bàn 4 người' },
                  { value: '6', label: 'Bàn 6 người' },
                  { value: '8', label: 'Bàn 8 người' },
                ]}
              />
            </div>
          </div>
          {!isManager && (
            <div className="flex justify-end">
              <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
                + Thêm bàn ăn mới
              </Button>
            </div>
          )}
        </div>

        <Card>
          {error && (
            <div className="mb-4 rounded-xl bg-red-50/65 border border-red-200/50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-400 text-sm">Đang tải danh sách bàn ăn...</p>
            </div>
          ) : filteredTables.length === 0 ? (
            <div className="text-center py-16">
              <svg className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <p className="text-slate-500 font-medium">Không tìm thấy bàn ăn nào phù hợp.</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử đổi bộ lọc hoặc thêm bàn mới cho chi nhánh.</p>
            </div>
          ) : (
            <Table columns={columns} data={filteredTables} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm bàn ăn mới"
        size="md"
        footer={
          <div className="flex space-x-2 justify-end w-full">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="add-table-form"
              variant="primary"
              loading={submitting}
            >
              Tạo bàn ăn
            </Button>
          </div>
        }
      >
        <form id="add-table-form" className="space-y-4" onSubmit={handleAddSubmit}>
          <Input
            label="Mã bàn ăn (Ví dụ: B15, VIP1, T2-01)"
            name="tableCode"
            value={formValues.tableCode}
            onChange={handleInputChange}
            required
            placeholder="Nhập mã bàn ăn"
            autoCapitalize="characters"
          />

          <Select
            label="Sức chứa bàn (Số người ngồi tối đa)"
            name="capacity"
            value={String(formValues.capacity)}
            onChange={handleInputChange}
            options={[
              { value: '2', label: 'Bàn 2 người' },
              { value: '4', label: 'Bàn 4 người' },
              { value: '6', label: 'Bàn 6 người' },
              { value: '8', label: 'Bàn 8 người' },
            ]}
            required
          />

          <Select
            label="Vị trí / Khu vực"
            name="location"
            value={formValues.location}
            onChange={handleInputChange}
            options={[
              { value: 'Tầng 1', label: 'Tầng 1 (Khu sảnh chính)' },
              { value: 'Tầng 2', label: 'Tầng 2 (Lầu ngắm cảnh)' },
              { value: 'Phòng VIP', label: 'Phòng VIP riêng tư sang trọng' },
              { value: 'Ngoài trời', label: 'Ngoài trời (Sân vườn)' },
            ]}
            required
          />
        </form>
      </Modal>
    </PageContainer>
  );
};

export default TablesPage;
