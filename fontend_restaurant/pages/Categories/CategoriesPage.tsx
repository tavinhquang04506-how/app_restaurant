import React, { useEffect, useMemo, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { restaurantApi } from '../../services/restaurantApi';
import type { Category, Food } from '../../types/types';
import { useToast } from '../../context/ToastContext';

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [foods, setFoods] = useState<Food[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formValues, setFormValues] = useState({
    name: '',
    description: '',
  });

  const { showToast } = useToast();

  // Load Categories & Foods
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [catsRes, foodsRes] = await Promise.all([
        restaurantApi.getCategories(),
        restaurantApi.getFoods({ page: 1, size: 100 }),
      ]);
      setCategories(catsRes);
      setFoods(foodsRes.result || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách danh mục';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Count foods belonging to each category
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    foods.forEach((food) => {
      if (food.category?.id) {
        counts[food.category.id] = (counts[food.category.id] || 0) + 1;
      }
    });
    return counts;
  }, [foods]);

  // Filtered categories
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categories;
    const q = searchQuery.toLowerCase().trim();
    return categories.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description && c.description.toLowerCase().includes(q))
    );
  }, [categories, searchQuery]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formValues.name.trim()) {
      showToast('Tên danh mục không được để trống', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await restaurantApi.createCategory({
        name: formValues.name.trim(),
        description: formValues.description.trim(),
      });
      showToast(`Đã tạo danh mục "${formValues.name.trim()}" thành công!`, 'success');
      setIsAddModalOpen(false);
      setFormValues({ name: '', description: '' });
      loadData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Thêm danh mục thất bại';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Tên danh mục',
      accessor: (item: Category) => (
        <span className="font-extrabold text-slate-800 text-sm whitespace-nowrap">
          📁 {item.name}
        </span>
      ),
    },
    {
      header: 'Mô tả chi tiết',
      accessor: (item: Category) => (
        <span className="text-slate-500 text-xs font-medium line-clamp-2 max-w-md">
          {item.description || <span className="italic text-slate-300">Chưa cập nhật mô tả</span>}
        </span>
      ),
    },
    {
      header: 'Số lượng món ăn đang có',
      accessor: (item: Category) => (
        <span className="inline-flex items-center px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full">
          {categoryStats[item.id] || 0} món ăn
        </span>
      ),
    },
  ];

  return (
    <PageContainer
      title="Danh mục món ăn"
      description="Quản lý các danh mục món ăn chính của hệ thống nhà hàng, phân nhóm thực đơn chuyên nghiệp."
    >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Tìm kiếm danh mục món ăn..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)}>
            + Thêm danh mục món
          </Button>
        </div>

        <Card>
          {error && (
            <div className="mb-4 rounded-xl bg-red-50/65 border border-red-200/50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <svg className="animate-spin h-8 w-8 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-slate-400 text-sm">Đang tải danh sách danh mục...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-16">
              <svg className="h-12 w-12 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-slate-500 font-medium">Không tìm thấy danh mục món ăn nào.</p>
              <p className="text-xs text-slate-400 mt-1">Hãy thử tìm kiếm với từ khóa khác hoặc tạo mới danh mục.</p>
            </div>
          ) : (
            <Table columns={columns} data={filteredCategories} />
          )}
        </Card>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Thêm danh mục món ăn mới"
        size="md"
        footer={
          <div className="flex space-x-2 justify-end w-full">
            <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>
              Hủy
            </Button>
            <Button
              type="submit"
              form="add-category-form"
              variant="primary"
              loading={submitting}
            >
              Tạo danh mục
            </Button>
          </div>
        }
      >
        <form id="add-category-form" className="space-y-4" onSubmit={handleAddSubmit}>
          <Input
            label="Tên danh mục món ăn"
            name="name"
            value={formValues.name}
            onChange={handleInputChange}
            required
            placeholder="Ví dụ: Món nướng, Lẩu hơi, Khai vị..."
          />

          <div className="flex flex-col">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mô tả danh mục
            </label>
            <textarea
              name="description"
              value={formValues.description}
              onChange={handleInputChange}
              rows={3}
              placeholder="Nhập mô tả tóm tắt..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-primary focus:border-primary transition text-sm"
            />
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default CategoriesPage;
