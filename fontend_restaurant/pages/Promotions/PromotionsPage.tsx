import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import { restaurantApi, type PromotionPayload } from '../../services/restaurantApi';
import { API_BASE_URL } from '../../services/apiClient';
import { useToast } from '../../context/ToastContext';
import type { Promotion } from '../../types/types';

const defaultForm: PromotionFormState = {
  code: '',
  name: '',
  description: '',
  imageUrl: '',
  discountPercent: 10,
  quantity: 100,
  startDate: '',
  endDate: '',
  active: true,
};

type PromotionFormState = {
  code: string;
  name: string;
  description: string;
  imageUrl: string;
  discountPercent: number;
  quantity: number;
  startDate: string;
  endDate: string;
  active: boolean;
};

const formatDateTime = (value?: string) => {
  if (!value) return 'Không giới hạn';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString('vi-VN', {
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const toDateTimeLocalValue = (value?: string) => (value ? value.slice(0, 16) : '');

const toApiDateTime = (value?: string) => {
  if (!value) return undefined;
  return value.length === 16 ? `${value}:00` : value;
};

const PromotionsPage: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState<PromotionFormState>(defaultForm);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const loadPromotions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.getPromotions();
      setPromotions(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách khuyến mãi';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPromotions();
  }, [loadPromotions]);

  const filteredPromotions = useMemo(() => {
    if (!search.trim()) return promotions;
    const query = search.trim().toLowerCase();
    return promotions.filter(
      (item) =>
        item.code.toLowerCase().includes(query) || item.name.toLowerCase().includes(query)
    );
  }, [promotions, search]);

  const getStatus = (promotion: Promotion) => {
    if (!promotion.active) {
      return { label: 'Ngừng hoạt động', color: 'gray' as const };
    }
    if (promotion.remaining <= 0) {
      return { label: 'Hết lượt', color: 'red' as const };
    }
    return { label: 'Đang chạy', color: 'green' as const };
  };

  const openCreateModal = () => {
    setSelectedPromotion(null);
    setFormValues({
      ...defaultForm,
      code: '',
      name: '',
    });
    setModalOpen(true);
  };

  const openEditModal = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    setFormValues({
      code: promotion.code,
      name: promotion.name,
      description: promotion.description ?? '',
      imageUrl: promotion.imageUrl ?? '',
      discountPercent: promotion.discountPercent,
      quantity: promotion.quantity,
      startDate: toDateTimeLocalValue(promotion.startDate),
      endDate: toDateTimeLocalValue(promotion.endDate),
      active: promotion.active,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedPromotion(null);
    setFormValues(defaultForm);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type, checked } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]:
        type === 'number'
          ? Number(value)
          : type === 'checkbox'
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    const payload: PromotionPayload = {
      code: formValues.code.trim().toUpperCase(),
      name: formValues.name.trim(),
      description: formValues.description.trim() || undefined,
      imageUrl: formValues.imageUrl.trim() || undefined,
      discountPercent: Number(formValues.discountPercent),
      quantity: Number(formValues.quantity),
      startDate: toApiDateTime(formValues.startDate),
      endDate: toApiDateTime(formValues.endDate),
      active: formValues.active,
    };
    try {
      if (selectedPromotion) {
        await restaurantApi.updatePromotion(selectedPromotion.id, payload);
        showToast('Đã cập nhật khuyến mãi', 'success');
      } else {
        await restaurantApi.createPromotion(payload);
        showToast('Đã tạo khuyến mãi mới', 'success');
      }
      closeModal();
      loadPromotions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu khuyến mãi';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickImage = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setUploadingImage(true);
      const uploaded = await restaurantApi.uploadPromotionImage(file);
      // Lưu tên file (backend trả fileName), display sẽ tự prefix /storage/promotion
      setFormValues((prev) => ({ ...prev, imageUrl: uploaded.fileName }));
      showToast('Đã tải ảnh lên thành công', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể upload ảnh';
      showToast(message, 'error');
    } finally {
      setUploadingImage(false);
      // reset input so selecting same file again still triggers change
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async (promotion: Promotion) => {
    if (!confirm(`Xóa khuyến mãi ${promotion.name}?`)) return;
    try {
      await restaurantApi.deletePromotion(promotion.id);
      showToast('Đã xóa khuyến mãi', 'success');
      loadPromotions();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa khuyến mãi';
      showToast(message, 'error');
    }
  };

  const columns = [
    {
      header: 'Mã',
      accessor: (item: Promotion) => <span className="font-semibold text-gray-800">{item.code}</span>,
    },
    {
      header: 'Tên khuyến mãi',
      accessor: (item: Promotion) => (
        <div>
          <p className="font-medium text-gray-900">{item.name}</p>
          {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
        </div>
      ),
    },
    {
      header: 'Giảm',
      accessor: (item: Promotion) => `${item.discountPercent}%`,
    },
    {
      header: 'Thời gian',
      accessor: (item: Promotion) => (
        <div className="text-xs text-gray-600 space-y-1">
          <p>Bắt đầu: {formatDateTime(item.startDate)}</p>
          <p>Kết thúc: {formatDateTime(item.endDate)}</p>
        </div>
      ),
    },
    {
      header: 'Số lượt',
      accessor: (item: Promotion) => (
        <span className="font-medium text-gray-800">
          {item.remaining}/{item.quantity}
        </span>
      ),
    },
    {
      header: 'Trạng thái',
      accessor: (item: Promotion) => {
        const status = getStatus(item);
        return <Badge color={status.color}>{status.label}</Badge>;
      },
    },
    {
      header: 'Hành động',
      accessor: (item: Promotion) => (
        <div className="flex items-center space-x-3">
          <button
            onClick={() => openEditModal(item)}
            className="text-primary hover:text-primary-focus text-sm font-medium"
          >
            Sửa
          </button>
          <button
            onClick={() => handleDelete(item)}
            className="text-red-500 hover:text-red-600 text-sm font-medium"
          >
            Xóa
          </button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Quản lý khuyến mãi" description="Tạo và điều chỉnh các chương trình ưu đãi dùng chung">
      <div className="space-y-6">
        <Card
          title="Danh sách khuyến mãi"
          actions={
            <div className="flex items-center space-x-3">
              <Input
                placeholder="Tìm theo mã hoặc tên..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <Button variant="primary" onClick={openCreateModal}>
                + Thêm khuyến mãi
              </Button>
            </div>
          }
        >
          {error && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {loading ? (
            <p className="text-center text-sm text-gray-500">Đang tải dữ liệu...</p>
          ) : (
            <Table columns={columns} data={filteredPromotions} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedPromotion ? 'Cập nhật khuyến mãi' : 'Thêm khuyến mãi'}
        size="lg"
        footer={
          <div className="flex items-center space-x-3">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="promotion-form"
              variant="primary"
              loading={submitting}
            >
              {selectedPromotion ? 'Cập nhật' : 'Tạo mới'}
            </Button>
          </div>
        }
      >
        <form id="promotion-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mã khuyến mãi"
              name="code"
              value={formValues.code}
              onChange={handleInputChange}
              required
              placeholder="VD: TET2025"
            />
            <Input
              label="Tên chương trình"
              name="name"
              value={formValues.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Nội dung ưu đãi, điều kiện áp dụng..."
            />
          </div>
          <div>
            <div className="mt-2 flex items-center space-x-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageChange}
              />
              <Button type="button" variant="secondary" onClick={handlePickImage} loading={uploadingImage}>
                Upload ảnh
              </Button>
              {formValues.imageUrl && (
                <span className="text-sm text-primary">
                  Đã chọn: {formValues.imageUrl}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              type="number"
              min={1}
              max={100}
              label="Phần trăm giảm"
              name="discountPercent"
              value={formValues.discountPercent}
              onChange={handleInputChange}
              required
            />
            <Input
              type="number"
              min={1}
              label="Số lượt áp dụng"
              name="quantity"
              value={formValues.quantity}
              onChange={handleInputChange}
              required
            />
            <div className="flex items-center space-x-2 pt-6">
              <input
                id="promotion-active"
                type="checkbox"
                name="active"
                checked={formValues.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="promotion-active" className="text-sm font-medium text-gray-700">
                Kích hoạt
              </label>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              type="datetime-local"
              label="Thời gian bắt đầu"
              name="startDate"
              value={formValues.startDate}
              onChange={handleInputChange}
            />
            <Input
              type="datetime-local"
              label="Thời gian kết thúc"
              name="endDate"
              value={formValues.endDate}
              onChange={handleInputChange}
            />
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default PromotionsPage;

