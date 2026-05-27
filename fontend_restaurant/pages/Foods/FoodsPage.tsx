import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';
import Badge from '../../components/ui/Badge';
import { restaurantApi } from '../../services/restaurantApi';
import { API_BASE_URL } from '../../services/apiClient';
import type { Category, Food, PaginationMeta } from '../../types/types';
import { useToast } from '../../context/ToastContext';

const currencyFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

const emptyFood = {
  name: '',
  description: '',
  thumbUrl: '',
  price: 10000,
  categoryId: '',
  active: true,
};

const PAGE_SIZE = 20;

const STORAGE_ROOT = `${API_BASE_URL.replace(/\/$/, '')}/storage/food/`;
const startsWithHttp = (value: string) => /^https?:\/\//i.test(value);
const normalizeThumbValue = (value?: string | null) => {
  if (!value) return '';
  const match = value.match(/\/storage\/food\/([^/?#]+)/i);
  if (match && match[1]) {
    return match[1];
  }
  return value;
};
const resolveThumbPreview = (value?: string | null) => {
  if (!value) return '';
  if (startsWithHttp(value)) return value;
  return `${STORAGE_ROOT}${value}`;
};

const FoodsPage: React.FC = () => {
  const [foods, setFoods] = useState<Food[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ name: '', categoryId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValues, setFormValues] = useState(emptyFood);
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  
  // Category modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [categoryFormValues, setCategoryFormValues] = useState({ name: '', description: '' });
  const [submittingCategory, setSubmittingCategory] = useState(false);

  const loadCategories = async () => {
    try {
      const data = await restaurantApi.getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải danh mục', 'error');
    }
  };

  const loadFoods = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.getFoods({
        page,
        size: PAGE_SIZE,
        name: filters.name || undefined,
        categoryId: filters.categoryId || undefined,
      });
      setFoods(data.result);
      setMeta(data.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách món ăn';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.categoryId, filters.name, page, showToast]);

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const openCreateModal = () => {
    setSelectedFood(null);
    setFormValues({
      ...emptyFood,
      categoryId: categories[0]?.id ?? '',
    });
    setModalOpen(true);
  };

  const openEditModal = (food: Food) => {
    setSelectedFood(food);
    setFormValues({
      name: food.name,
      description: food.description,
      thumbUrl: normalizeThumbValue(food.thumbUrl),
      price: food.price,
      categoryId: food.category?.id ?? '',
      active: food.active ?? true,
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFood(null);
    setFormValues(emptyFood);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: name === 'price' ? Number(value) : value,
    }));
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const upload = await restaurantApi.uploadFoodImage(file);
      setFormValues((prev) => ({
        ...prev,
        thumbUrl: upload.fileName,
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
      thumbUrl: '',
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      ...formValues,
      thumbUrl: normalizeThumbValue(formValues.thumbUrl) || undefined,
    };
    try {
      if (selectedFood?.id) {
        await restaurantApi.updateFood(selectedFood.id, payload);
        showToast('Đã cập nhật món ăn', 'success');
      } else {
        await restaurantApi.createFood(payload);
        showToast('Đã tạo món ăn mới', 'success');
      }
      closeModal();
      loadFoods();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu món ăn';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (food: Food) => {
    if (!confirm(`Xóa món ${food.name}?`)) return;
    try {
      await restaurantApi.deleteFood(food.id);
      loadFoods();
      showToast('Đã xóa món ăn', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa món ăn';
      setError(message);
      showToast(message, 'error');
    }
  };

  const handleToggleActive = async (food: Food) => {
    try {
      const newActive = food.active !== false ? false : true;
      const payload = {
        name: food.name,
        description: food.description,
        thumbUrl: normalizeThumbValue(food.thumbUrl) || undefined,
        price: food.price,
        categoryId: food.category?.id ?? '',
        active: newActive,
      };
      await restaurantApi.updateFood(food.id, payload);
      showToast(`Đã ${newActive ? 'bật bán' : 'tạm ngưng'} món ăn trên toàn hệ thống!`, 'success');
      loadFoods();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể thay đổi trạng thái';
      showToast(message, 'error');
    }
  };

  const openCategoryModal = () => {
    setCategoryFormValues({ name: '', description: '' });
    setCategoryModalOpen(true);
  };

  const closeCategoryModal = () => {
    setCategoryModalOpen(false);
    setCategoryFormValues({ name: '', description: '' });
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingCategory(true);
    try {
      const newCategory = await restaurantApi.createCategory(categoryFormValues);
      showToast('Đã tạo loại món ăn mới', 'success');
      closeCategoryModal();
      loadCategories(); // Reload categories để cập nhật danh sách
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tạo loại món ăn';
      showToast(message, 'error');
    } finally {
      setSubmittingCategory(false);
    }
  };

  const categoryOptions = useMemo(
    () =>
      [{ value: '', label: 'Tất cả loại món' }].concat(
        categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))
      ),
    [categories]
  );

  const modalCategoryOptions = useMemo(
    () =>
      categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    [categories]
  );

  const columns = [
    {
      header: 'Món ăn',
      accessor: (food: Food) => (
        <div>
          <p className="font-semibold text-gray-800">{food.name}</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">{food.description}</p>
        </div>
      ),
    },
    {
      header: 'Giá bán',
      accessor: (food: Food) => currencyFormatter.format(food.price),
    },
    {
      header: 'Loại',
      accessor: (food: Food) => (
        <Badge color="blue" size="sm">
          {food.category?.name || 'Chưa gán'}
        </Badge>
      ),
    },
    {
      header: 'Đánh giá',
      accessor: (food: Food) => {
        if (!food.avgRating) {
          return <span className="text-gray-400 text-sm">Chưa có</span>;
        }
        const fullStars = Math.floor(food.avgRating);
        const hasHalfStar = food.avgRating - fullStars >= 0.5;
        return (
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <span
                key={i}
                className={`text-sm ${
                  i < fullStars
                    ? 'text-yellow-400'
                    : i === fullStars && hasHalfStar
                    ? 'text-yellow-300'
                    : 'text-gray-300'
                }`}
                style={{ fontSize: '14px' }}
              >
                {i < fullStars
                  ? '★'
                  : i === fullStars && hasHalfStar
                  ? '☆'
                  : '☆'}
              </span>
            ))}
            <span className="text-xs text-gray-600 ml-1">
              {food.avgRating.toFixed(1)}
            </span>
            {food.ratingCount && (
              <span className="text-xs text-gray-500 ml-1">
                ({food.ratingCount})
              </span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Trạng thái',
      accessor: (food: Food) => (
        <Badge color={food.active !== false ? 'green' : 'red'} size="sm">
          {food.active !== false ? 'Đang bán' : 'Tạm ngưng'}
        </Badge>
      ),
    },
    {
      header: 'Hành động',
      accessor: (food: Food) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(food)}>
            Sửa
          </Button>
          <Button
            variant={food.active !== false ? 'secondary' : 'primary'}
            size="sm"
            onClick={() => handleToggleActive(food)}
          >
            {food.active !== false ? 'Tắt' : 'Bật'}
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(food)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Món ăn" breadcrumb={['Dashboard', 'Món ăn']}>
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <Input
              placeholder="Tìm theo tên món..."
              value={filters.name}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, name: e.target.value }));
              }}
            />
            <div className="flex gap-2">
              <div className="flex-1">
                <Select
                  value={filters.categoryId}
                  onChange={(e) => {
                    setPage(1);
                    setFilters((prev) => ({ ...prev, categoryId: e.target.value }));
                  }}
                  options={categoryOptions}
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={openCategoryModal}
                className="whitespace-nowrap self-end"
              >
                + Loại mới
              </Button>
            </div>
          </div>
          <Button onClick={openCreateModal}>+ Thêm món</Button>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}

        {loading ? (
          <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
        ) : (
          <>
            <Table columns={columns} data={foods} />
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                Tổng: <strong>{meta?.total ?? 0}</strong> món ăn
              </span>
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
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
                  disabled={!meta || page >= (meta?.pages ?? 1)}
                  onClick={() => setPage((prev) => (meta && prev < meta.pages ? prev + 1 : prev))}
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
        onClose={closeModal}
        title={selectedFood ? 'Cập nhật món' : 'Thêm món mới'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Tên món ăn"
            name="name"
            value={formValues.name}
            onChange={handleChange}
            required
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea
              name="description"
              value={formValues.description}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
              rows={3}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Giá (VND)"
              name="price"
              type="number"
              min={1000}
              step={1000}
              value={formValues.price}
              onChange={handleChange}
              required
            />
            <Input
              label="Ảnh đại diện (URL hoặc tên file)"
              name="thumbUrl"
              value={formValues.thumbUrl}
              onChange={handleChange}
              placeholder="vd: monan.png hoặc https://..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ảnh đại diện (tải trực tiếp)
            </label>
            <div className="flex flex-col md:flex-row gap-4 items-start">
              <div className="w-32 h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center overflow-hidden bg-gray-50">
                {formValues.thumbUrl ? (
                  <img
                    src={resolveThumbPreview(formValues.thumbUrl)}
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
                {formValues.thumbUrl && (
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
          <Select
            label="Loại món"
            name="categoryId"
            value={formValues.categoryId}
            onChange={handleChange}
            options={
              modalCategoryOptions.length > 0
                ? modalCategoryOptions
                : [{ value: '', label: 'Chưa có danh mục' }]
            }
            required
          />
          <div className="flex items-center space-x-2 py-2">
            <input
              type="checkbox"
              id="active"
              name="active"
              checked={formValues.active}
              onChange={(e) => {
                setFormValues((prev) => ({ ...prev, active: e.target.checked }));
              }}
              className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary"
            />
            <label htmlFor="active" className="text-sm font-medium text-gray-700 select-none">
              Trạng thái: Cho phép phục vụ (Đang bán trên hệ thống và ứng dụng)
            </label>
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

      {/* Category Creation Modal */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={closeCategoryModal}
        title="Thêm loại món ăn mới"
        size="md"
      >
        <form className="space-y-4" onSubmit={handleCreateCategory}>
          <Input
            label="Tên loại món ăn"
            name="name"
            value={categoryFormValues.name}
            onChange={handleCategoryChange}
            required
            placeholder="Ví dụ: Món chính, Món khai vị..."
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={categoryFormValues.description}
              onChange={handleCategoryChange}
              className="w-full px-3 py-2 border rounded-lg border-gray-300 focus:ring-primary focus:border-primary"
              rows={3}
              required
              placeholder="Mô tả về loại món ăn này..."
            />
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={closeCategoryModal}>
              Hủy
            </Button>
            <Button type="submit" loading={submittingCategory}>
              Tạo loại món
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default FoodsPage;

