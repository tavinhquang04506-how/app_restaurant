import React, { useEffect, useState } from 'react';
import PageContainer from '../../components/layout/PageContainer';
import Card from '../../components/ui/Card';
import Table from '../../components/ui/Table';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Modal from '../../components/ui/Modal';
import { restaurantApi } from '../../services/restaurantApi';
import type { Role } from '../../types/types';
import { useToast } from '../../context/ToastContext';

const RolesPage: React.FC = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formValue, setFormValue] = useState('');
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadRoles = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await restaurantApi.getRoles();
      setRoles(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách vai trò';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  const openCreateModal = () => {
    setSelectedRole(null);
    setFormValue('');
    setModalOpen(true);
  };

  const openEditModal = (role: Role) => {
    setSelectedRole(role);
    setFormValue(role.name);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedRole(null);
    setFormValue('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (selectedRole?.id) {
        await restaurantApi.updateRole(selectedRole.id, { name: formValue });
        showToast('Đã cập nhật vai trò', 'success');
      } else {
        await restaurantApi.createRole({ name: formValue });
        showToast('Đã tạo vai trò mới', 'success');
      }
      closeModal();
      loadRoles();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu vai trò';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!role.id) return;
    if (!confirm(`Xóa vai trò ${role.name}?`)) return;
    try {
      await restaurantApi.deleteRole(role.id);
      loadRoles();
      showToast('Đã xóa vai trò', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa vai trò';
      setError(message);
      showToast(message, 'error');
    }
  };

  const columns = [
    { header: 'Vai trò', accessor: 'name' as keyof Role },
    {
      header: 'Ngày tạo',
      accessor: (role: Role) =>
        role.createdAt ? new Date(role.createdAt).toLocaleString('vi-VN') : '—',
    },
    {
      header: 'Hành động',
      accessor: (role: Role) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(role)}>
            Sửa
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(role)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Vai trò" breadcrumb={['Dashboard', 'Vai trò']}>
      <Card>
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-gray-500 text-sm">Quản lý các nhóm quyền trên hệ thống</p>
          </div>
          <Button onClick={openCreateModal}>+ Thêm vai trò</Button>
        </div>
        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-center text-gray-500 py-10">Đang tải dữ liệu...</p>
        ) : (
          <Table columns={columns as any} data={roles as any} />
        )}
      </Card>

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={selectedRole ? 'Cập nhật vai trò' : 'Thêm vai trò'}
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Tên vai trò"
            value={formValue}
            onChange={(e) => setFormValue(e.target.value.toUpperCase())}
            placeholder="VD: ADMIN"
            required
          />
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="ghost" onClick={closeModal}>
              Hủy
            </Button>
            <Button type="submit" loading={submitting}>
              Lưu
            </Button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
};

export default RolesPage;

