
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import DashboardPage from './pages/Dashboard/DashboardPage';
import UsersPage from './pages/Users/UsersPage';
import RolesPage from './pages/Roles/RolesPage';
import BranchesPage from './pages/Branches/BranchesPage';
import FoodsPage from './pages/Foods/FoodsPage';
import BranchFoodPage from './pages/BranchFood/BranchFoodPage';
import PromotionsPage from './pages/Promotions/PromotionsPage';
import ChatPage from './pages/Chat/ChatPage';
import BookingPage from './pages/Booking/BookingPage';
import BookingListPage from './pages/BookingList/BookingListPage';
import LoginPage from './pages/Auth/LoginPage';
import TablesPage from './pages/Tables/TablesPage';
import CategoriesPage from './pages/Categories/CategoriesPage';
import type { Page, MenuItemGroup } from './types/types';
import { useAuth } from './context/AuthContext';

const ADMIN_MENU: MenuItemGroup[] = [
  {
    groupName: 'Tổng quan',
    items: [{ name: 'Dashboard', icon: 'home' }],
  },
  {
    groupName: 'Kinh doanh & Phục vụ',
    items: [
      { name: 'Đặt bàn', icon: 'calendar' },
      { name: 'Danh sách booking', icon: 'clipboard' },
      { name: 'Chat', icon: 'message' },
    ],
  },
  {
    groupName: 'Thực đơn & Sản phẩm',
    items: [
      { name: 'Danh mục món', icon: 'folder' },
      { name: 'Món ăn', icon: 'package' },
      { name: 'Món ăn chi nhánh', icon: 'briefcase' },
      { name: 'Khuyến mãi', icon: 'gift' },
    ],
  },
  {
    groupName: 'Hệ thống & Nhân sự',
    items: [
      { name: 'Chi nhánh', icon: 'calendar' },
      { name: 'Bàn ăn', icon: 'clipboard' },
      { name: 'Người dùng', icon: 'users' },
      { name: 'Vai trò', icon: 'clipboard' },
    ],
  },
];

const MANAGER_MENU: MenuItemGroup[] = [
  {
    groupName: 'Phục vụ khách hàng',
    items: [
      { name: 'Phục vụ bàn & POS', icon: 'activity' },
      { name: 'Đặt bàn', icon: 'calendar' },
      { name: 'Danh sách booking', icon: 'clipboard' },
    ],
  },
  {
    groupName: 'Quản lý cơ sở',
    items: [
      { name: 'Bàn ăn', icon: 'clipboard' },
      { name: 'Món ăn chi nhánh', icon: 'briefcase' },
    ],
  },
];

const STAFF_MENU: MenuItemGroup[] = [
  {
    groupName: 'Công việc hàng ngày',
    items: [
      { name: 'Danh sách booking', icon: 'clipboard' },
      { name: 'Món ăn chi nhánh', icon: 'briefcase' },
      { name: 'Chat', icon: 'message' },
    ],
  },
];

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const { isAuthenticated, user } = useAuth();

  const handleNavigate = useCallback((page: Page) => {
    setCurrentPage(page);
    if (window.innerWidth < 768) {
        setSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const menuItems = useMemo<MenuItemGroup[]>(() => {
    if (user?.role === 'STAFF') {
      return STAFF_MENU;
    }
    if (user?.role === 'MANAGER') {
      return MANAGER_MENU;
    }
    return ADMIN_MENU;
  }, [user?.role]);

  useEffect(() => {
    const pageExists = menuItems.some((group) =>
      group.items.some((item) => item.name === currentPage)
    );
    if (!pageExists) {
      const firstItem = menuItems[0]?.items[0]?.name ?? 'Dashboard';
      setCurrentPage(firstItem);
    }
  }, [currentPage, menuItems]);
  
  const renderPage = () => {
    switch (currentPage) {
      case 'Người dùng':
        return <UsersPage />;
      case 'Vai trò':
        return <RolesPage />;
      case 'Chi nhánh':
        return <BranchesPage />;
      case 'Món ăn':
        return <FoodsPage />;
      case 'Món ăn chi nhánh':
        return <BranchFoodPage />;
      case 'Danh mục món':
        return <CategoriesPage />;
      case 'Khuyến mãi':
        return <PromotionsPage />;
      case 'Chat':
        return <ChatPage />;
      case 'Đặt bàn':
        return <BookingPage />;
      case 'Danh sách booking':
        return <BookingListPage />;
      case 'Bàn ăn':
        return <TablesPage />;
      case 'Phục vụ bàn & POS':
        return <DashboardPage forceStaffView={true} />;
      case 'Dashboard':
      default:
        return <DashboardPage />;
    }
  };

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="flex h-screen bg-light-bg font-sans text-gray-800">
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isOpen={isSidebarOpen}
        setOpen={setSidebarOpen}
        menuItems={menuItems}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar
          onMenuClick={() => setSidebarOpen(!isSidebarOpen)}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">{renderPage()}</main>
      </div>
    </div>
  );
};

export default App;
