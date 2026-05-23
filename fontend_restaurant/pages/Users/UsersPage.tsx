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
import type { Branch, PaginationMeta, Role, User } from '../../types/types';
import { useToast } from '../../context/ToastContext';

import { useAuth } from '../../context/AuthContext';

const defaultFormValues = {
  email: '',
  username: '',
  phone: '',
  password: '',
  roleName: '',
  roleId: '',
  avatarUrl: '',
  branchId: '',
};

const PAGE_SIZE = 20;

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isManager = currentUser?.role === 'MANAGER';
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ username: '', email: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [formValues, setFormValues] = useState(defaultFormValues);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === formValues.roleId),
    [roles, formValues.roleId]
  );
  const requiresBranch = ['STAFF', 'MANAGER'].includes((selectedRole?.name ?? formValues.roleName).toUpperCase());

  const loadRoles = useCallback(async () => {
    try {
      const data = await restaurantApi.getRoles();
      setRoles(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải vai trò', 'error');
    }
  }, [showToast]);

  const loadBranches = useCallback(async () => {
    try {
      const data = await restaurantApi.getBranches();
      setBranches(data);
    } catch (err) {
      console.error(err);
      showToast('Không thể tải chi nhánh', 'error');
    }
  }, [showToast]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page,
        size: PAGE_SIZE,
        username: filters.username || undefined,
        email: filters.email || undefined,
      };
      if (isManager && currentUser?.branchId) {
        params.branchId = currentUser.branchId;
        params.roleName = 'STAFF';
      }
      const data = await restaurantApi.getUsers(params);
      setUsers(data.result);
      setMeta(data.meta);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể tải danh sách người dùng';
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  }, [filters.email, filters.username, page, showToast, isManager, currentUser?.branchId]);

  useEffect(() => {
    loadRoles();
    loadBranches();
  }, [loadRoles, loadBranches]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openCreateModal = () => {
    setFormMode('create');
    setSelectedUserId(null);
    const staffRole = roles.find((r) => r.name.toUpperCase() === 'STAFF');
    setFormValues({
      ...defaultFormValues,
      roleName: isManager ? 'STAFF' : (roles[0]?.name ?? ''),
      roleId: isManager ? (staffRole?.id ?? '') : (roles[0]?.id ?? ''),
      branchId: isManager ? (currentUser?.branchId ?? '') : (branches[0]?.id ?? ''),
    });
    setModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setFormMode('edit');
    setSelectedUserId(user.id);
    setFormValues({
      email: user.email,
      username: user.username,
      phone: user.phone,
      password: '',
      roleName: user.role?.name ?? '',
      roleId: user.role?.id ?? '',
      avatarUrl: user.avatar ?? user.avatarUrl ?? '',
      branchId: user.branchId ?? '',
    });
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormValues(defaultFormValues);
    setSelectedUserId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'roleId') {
      const role = roles.find((r) => r.id === value);
      setFormValues((prev) => ({
        ...prev,
        roleId: value,
        roleName: role?.name ?? prev.roleName,
        branchId: role?.name?.toUpperCase() === 'STAFF' ? prev.branchId || branches[0]?.id || '' : '',
      }));
      return;
    }
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (requiresBranch && !formValues.branchId) {
        throw new Error('Nhân viên phải thuộc một chi nhánh');
      }
      if (formMode === 'create' && !formValues.password) {
        throw new Error('Vui lòng nhập mật khẩu cho người dùng mới');
      }
      if (formMode === 'create') {
        await restaurantApi.createUser({
          email: formValues.email,
          username: formValues.username,
          password: formValues.password,
          phone: formValues.phone,
          roleName: selectedRole?.name ?? formValues.roleName,
          avatarUrl: formValues.avatarUrl || undefined,
          branchId: requiresBranch ? formValues.branchId : undefined,
        });
        showToast('Đã tạo người dùng mới', 'success');
      } else if (selectedUserId) {
        await restaurantApi.updateUser(selectedUserId, {
          username: formValues.username,
          password: formValues.password || undefined,
          phone: formValues.phone,
          avatarUrl: formValues.avatarUrl || undefined,
          roleId: formValues.roleId || selectedRole?.id || '',
          branchId: requiresBranch ? formValues.branchId : undefined,
        });
        showToast('Đã cập nhật người dùng', 'success');
      }
      closeModal();
      loadUsers();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể lưu người dùng';
      setError(message);
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa người dùng này?')) return;
    try {
      await restaurantApi.deleteUser(id);
      loadUsers();
      showToast('Đã xóa người dùng', 'success');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Không thể xóa người dùng';
      setError(message);
      showToast(message, 'error');
    }
  };

  const roleOptions = useMemo(() => {
    let filteredRoles = roles;
    if (isManager) {
      filteredRoles = roles.filter(role => role.name.toUpperCase() === 'STAFF');
    }
    return filteredRoles
      .filter((role) => role.id)
      .map((role) => ({
        value: role.id as string,
        label: role.name,
      }));
  }, [roles, isManager]);

  const branchOptions = useMemo(() => {
    let filteredBranches = branches;
    if (isManager && currentUser?.branchId) {
      filteredBranches = branches.filter(branch => branch.id === currentUser.branchId);
    }
    return filteredBranches.map((branch) => ({
      value: branch.id,
      label: branch.name,
    }));
  }, [branches, isManager, currentUser?.branchId]);

  const columns = [
    {
      header: 'Họ tên',
      accessor: (user: User) => (
        <div>
          <p className="font-semibold text-gray-800 whitespace-nowrap">{user.username}</p>
          <p className="text-xs text-gray-400 truncate max-w-[150px]" title={user.id}>{user.id}</p>
        </div>
      ),
    },
    { header: 'Email', accessor: 'email' as keyof User },
    { header: 'Số điện thoại', accessor: 'phone' as keyof User },
    {
      header: 'Vai trò',
      accessor: (user: User) => (
        <Badge color="purple" size="sm">
          {user.role?.name || 'Chưa gán'}
        </Badge>
      ),
    },
    {
      header: 'Chi nhánh',
      accessor: (user: User) => user.branchName || '—',
    },
    {
      header: 'Hành động',
      accessor: (user: User) => (
        <div className="flex space-x-2">
          <Button variant="ghost" size="sm" onClick={() => openEditModal(user)}>
            Sửa
          </Button>
          <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
            Xóa
          </Button>
        </div>
      ),
    },
  ];

  return (
    <PageContainer title="Người dùng" breadcrumb={['Dashboard', 'Người dùng']}>
      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
            <Input
              placeholder="Lọc theo tên..."
              value={filters.username}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, username: e.target.value }));
              }}
            />
            <Input
              placeholder="Lọc theo email..."
              value={filters.email}
              onChange={(e) => {
                setPage(1);
                setFilters((prev) => ({ ...prev, email: e.target.value }));
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button onClick={openCreateModal}>+ Thêm người dùng</Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-500 mb-2">{error}</p>}
        {loading ? (
          <p className="text-center py-10 text-gray-500">Đang tải dữ liệu...</p>
        ) : (
          <>
            <Table columns={columns} data={users} />
            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <span>
                Tổng: <strong>{meta?.total ?? 0}</strong> người dùng
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
                  onClick={() => setPage((prev) => (meta && prev < meta.pages ? prev + 1 : prev))}
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
        onClose={closeModal}
        title={formMode === 'create' ? 'Thêm người dùng' : 'Cập nhật người dùng'}
        size="lg"
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email"
              name="email"
              type="email"
              value={formValues.email}
              onChange={handleChange}
              required
              disabled={formMode === 'edit'}
            />
            <Input
              label="Tên hiển thị"
              name="username"
              value={formValues.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Số điện thoại"
              name="phone"
              value={formValues.phone}
              onChange={handleChange}
              required
            />
            <Input
              label="Mật khẩu"
              name="password"
              type="password"
              placeholder={formMode === 'edit' ? 'Nhập mật khẩu mới' : ''}
              value={formValues.password}
              onChange={handleChange}
              required={formMode === 'create'}
              minLength={6}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Vai trò"
              name="roleId"
              value={formValues.roleId}
              onChange={handleChange}
              options={
                roleOptions.length > 0
                  ? roleOptions
                  : [{ value: '', label: 'Chưa có vai trò nào' }]
              }
              required
              disabled={isManager}
            />
            <Select
              label="Chi nhánh"
              name="branchId"
              value={formValues.branchId}
              onChange={handleChange}
              options={
                branchOptions.length > 0
                  ? branchOptions
                  : [{ value: '', label: 'Chưa có chi nhánh' }]
              }
              disabled={!requiresBranch || isManager}
              required={requiresBranch}
            />
          </div>
          <Input
            label="Ảnh đại diện (URL)"
            name="avatarUrl"
            value={formValues.avatarUrl}
            onChange={handleChange}
            placeholder="https://..."
          />

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
    </PageContainer>
  );
};

export default UsersPage;

