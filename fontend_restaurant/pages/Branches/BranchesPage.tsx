import React, { useEffect, useRef, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import Select from '../../components/ui/Select';
import { restaurantApi } from '../../services/restaurantApi';
import { API_BASE_URL } from '../../services/apiClient';
import type { Branch, RestaurantTable } from '../../types/types';
import { useToast } from '../../context/ToastContext';

const STORAGE_ROOT = `${API_BASE_URL.replace(/\/$/, '')}/storage/branch/`;
const startsWithHttp = (value: string) => /^https?:\/\//i.test(value);
const normalizeImageValue = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/\/storage\/branch\/([^/?#]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  return value;
};
const resolveImagePreview = (value?: string | null) => {
  if (!value) return '';
  if (startsWithHttp(value)) return value;
  return `${STORAGE_ROOT}${value}`;
};

const emptyBranch = {
  name: '',
  address: '',
  phone: '',
  imageUrl: '',
  openTime: '09:00',
  closeTime: '23:00',
};

const BranchesPage: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyBranch);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [tableModalOpen, setTableModalOpen] = useState(false);
  const [tableForm, setTableForm] = useState({
    tableCode: '',
    capacity: 4,
    location: '',
  });
  const [tableBranchId, setTableBranchId] = useState<string | null>(null);
  const [tableSubmitting, setTableSubmitting] = useState(false);
  const [tableBranchFilter, setTableBranchFilter] = useState<string>('');
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const loadBranches = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.getBranches();
      setBranches(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách chi nhánh';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const openCreateModal = () => {
    setSelectedBranch(null);
    setFormValues(emptyBranch);
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setSelectedBranch(branch);
    setFormValues({
      name: branch.name,
      address: branch.address,
      phone: branch.phone,
      imageUrl: normalizeImageValue(branch.imageUrl),
      openTime: branch.openTime?.slice(0, 5) ?? '09:00',
      closeTime: branch.closeTime?.slice(0, 5) ?? '23:00',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedBranch(null);
    setFormValues(emptyBranch);
  };

  const openTableModal = (branch: Branch) => {
    setTableBranchId(branch.id);
    setTableForm({
      tableCode: '',
      capacity: 4,
      location: '',
    });
    setTableModalOpen(true);
  };

  const closeTableModal = () => {
    setTableModalOpen(false);
    setTableBranchId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const upload = await restaurantApi.uploadBranchImage(file);
      setFormValues((prev) => ({
        ...prev,
        imageUrl: upload.fileName,
      }));
      showToast('Đã tải ảnh lên thành công', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải ảnh';
      showToast(message, 'error');
    } finally {
      setUploadingImage(false);
      event.target.value = '';
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleClearImage = () => {
    setFormValues((prev) => ({
      ...prev,
      imageUrl: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...formValues,
      imageUrl: normalizeImageValue(formValues.imageUrl) || undefined,
    };
    try {
      if (selectedBranch?.id) {
        await restaurantApi.updateBranch(selectedBranch.id, payload);
        showToast('Đã cập nhật chi nhánh', 'success');
      } else {
        await restaurantApi.createBranch(payload);
        showToast('Đã tạo chi nhánh mới', 'success');
      }
      closeModal();
      loadBranches();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu chi nhánh';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Xóa chi nhánh ${branch.name}?`)) return;
    try {
      await restaurantApi.deleteBranch(branch.id);
      loadBranches();
      showToast('Đã xóa chi nhánh', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa chi nhánh';
      setError(message);
      showToast(message, 'error');
    }
  };

  const columns = [
    {
      header: 'Ảnh',
      accessor: (branch: Branch) => (
        <div className="w-16 h-16 rounded-lg overflow-hidden border border-gray-200">
          {branch.imageUrl ? (
            <img
              src={resolveImagePreview(branch.imageUrl)}
              alt={branch.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback nếu ảnh không load được
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
                const parent = target.parentElement;
                if (parent) {
                  parent.innerHTML = '<div class="w-full h-full bg-gray-100 flex items-center justify-center"><span class="text-xs text-gray-400">No image</span></div>';
                }
              }}
            />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-400">No image</span>
            </div>
          )}
        </div>
      ),
    },
    { 
      header: 'Tên chi nhánh', 
      accessor: (branch: Branch) => (
        <span className="whitespace-nowrap font-medium text-gray-800">{branch.name}</span>
      )
    },
    { header: 'Địa chỉ', accessor: 'address' as keyof Branch },
    { header: 'Số điện thoại', accessor: 'phone' as keyof Branch },
    {
      header: 'Giờ mở cửa',
      accessor: (branch: Branch) =>
        branch.openTime && branch.closeTime
          ? `${branch.openTime?.slice(0, 5)} - ${branch.closeTime?.slice(0, 5)}`
          : '—',
    },
    {
      header: 'Hành động',
      accessor: (branch: Branch) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(branch)}>
            Sửa
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(branch)}>
            Xóa
          </Button>
          <Button variant="secondary" size="sm" onClick={() => openTableModal(branch)}>
            Thêm bàn
          </Button>
        </div>
      ),
    },
  ];

  useEffect(() => {
    if (!tableBranchFilter && branches.length > 0) {
      setTableBranchFilter(branches[0].id);
    }
  }, [branches, tableBranchFilter]);

  useEffect(() => {
    const fetchTables = async () => {
      if (!tableBranchFilter) return;
      setTableLoading(true);
      try {
        const res = await restaurantApi.getTablesByBranch(tableBranchFilter);
        setTables(res);
      } catch {
        showToast('Không thể tải danh sách bàn', 'error');
      } finally {
        setTableLoading(false);
      }
    };
    fetchTables();
  }, [tableBranchFilter, showToast]);

  const handleTableFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setTableForm((prev) => ({
      ...prev,
      [name]: name === 'capacity' ? Number(value) : value,
    }));
  };

  const handleTableSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tableBranchId) return;
    setTableSubmitting(true);
    try {
      await restaurantApi.createTable({
        branchId: tableBranchId,
        tableCode: tableForm.tableCode,
        capacity: tableForm.capacity,
        location: tableForm.location || undefined,
      });
      showToast('Đã thêm bàn mới', 'success');
      closeTableModal();
      if (tableBranchId === tableBranchFilter) {
        const res = await restaurantApi.getTablesByBranch(tableBranchFilter);
        setTables(res);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo bàn';
      showToast(message, 'error');
    } finally {
      setTableSubmitting(false);
    }
  };

  const tableColumns = [
    { header: 'Mã bàn', accessor: 'tableCode' as keyof RestaurantTable },
    { header: 'Sức chứa', accessor: 'capacity' as keyof RestaurantTable },
    { header: 'Khu vực', accessor: 'location' as keyof RestaurantTable },
    {
      header: 'Trạng thái',
      accessor: (table: RestaurantTable) => {
        let text = 'Trống';
        let color: 'green' | 'red' | 'yellow' | 'gray' = 'green';
        if (table.status === 'AVAILABLE') {
          text = 'Trống';
          color = 'green';
        } else if (table.status === 'UNAVAILABLE') {
          text = 'Đang có khách';
          color = 'red';
        } else if (table.status === 'MAINTENANCE') {
          text = 'Bảo trì';
          color = 'yellow';
        }
        return <Badge color={color}>{text}</Badge>;
      },
    },
  ];

  return (
    <PageContainer title="Chi nhánh" breadcrumb={['Dashboard', 'Chi nhánh']}>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-500 text-sm">Quản lý mạng lưới chi nhánh của nhà hàng</p>
          </div>
          <Button onClick={openCreateModal}>+ Thêm chi nhánh</Button>
        </div>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
        ) : (
          <Table columns={columns} data={branches} />
        )}
      </Card>

      <Card className="mt-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Danh sách bàn theo chi nhánh</h3>
            <p className="text-sm text-gray-500">
              Chọn chi nhánh để xem và quản lý các bàn đã tạo.
            </p>
          </div>
          <Select
            value={tableBranchFilter}
            onChange={(e) => setTableBranchFilter(e.target.value)}
            options={branches.map((branch) => ({ value: branch.id, label: branch.name }))}
          />
        </div>
        {tableLoading ? (
          <p className="text-center text-gray-500 py-8">Đang tải danh sách bàn...</p>
        ) : tables.length === 0 ? (
          <p className="text-center text-gray-500 py-8">Chưa có bàn nào cho chi nhánh này.</p>
        ) : (
          <Table columns={tableColumns} data={tables} />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedBranch ? 'Cập nhật chi nhánh' : 'Thêm chi nhánh'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Tên chi nhánh"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Địa chỉ"
            name="address"
            value={formValues.address}
            onChange={handleChange}
            required
          />
          <Input
            label="Số điện thoại"
            name="phone"
            value={formValues.phone}
            onChange={handleChange}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh chi nhánh (URL hoặc tên file)
            </label>
            <Input
              name="imageUrl"
              value={formValues.imageUrl}
              onChange={handleChange}
              placeholder="vd: chinhanh.png hoặc https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh chi nhánh (tải trực tiếp)
            </label>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-32 h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {formValues.imageUrl ? (
                  <img
                    src={resolveImagePreview(formValues.imageUrl)}
                    alt="Preview"
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <span className="text-xs text-gray-500 text-center px-2">Chưa có ảnh</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleImageUpload}
                />
                <Button type="button" variant="secondary" onClick={triggerFileInput} loading={uploadingImage}>
                  {uploadingImage ? 'Đang tải...' : 'Chọn ảnh từ thiết bị'}
                </Button>
                {formValues.imageUrl && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearImage}>
                    Xóa ảnh hiện tại
                  </Button>
                )}
                <p className="text-xs text-gray-500 max-w-sm">
                  Hỗ trợ định dạng JPG, PNG. Sau khi tải thành công hệ thống sẽ tự gán URL vào trường
                  bên trên.
                </p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Giờ mở cửa"
              name="openTime"
              type="time"
              value={formValues.openTime}
              onChange={handleChange}
              required
            />
            <Input
              label="Giờ đóng cửa"
              name="closeTime"
              type="time"
              value={formValues.closeTime}
              onChange={handleChange}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              Lưu
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={tableModalOpen}
        onClose={closeTableModal}
        title="Thêm bàn mới"
      >
        <form className="space-y-4" onSubmit={handleTableSubmit}>
          <Input
            label="Mã bàn"
            name="tableCode"
            value={tableForm.tableCode}
            onChange={handleTableFormChange}
            required
          />
          <Input
            label="Sức chứa"
            type="number"
            min={1}
            name="capacity"
            value={tableForm.capacity}
            onChange={handleTableFormChange}
            required
          />
          <Input
            label="Khu vực (tuỳ chọn)"
            name="location"
            value={tableForm.location}
            onChange={handleTableFormChange}
          />
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeTableModal}>
              Hủy
            </Button>
            <Button type="submit" loading={tableSubmitting}>
              Lưu
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default BranchesPage;

