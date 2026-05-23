
import React from 'react';
import { Icon } from '../ui/Icon';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';

interface TopbarProps {
  onMenuClick: () => void;
}

const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { logout, user } = useAuth();
  const userRole = user?.role?.toUpperCase();
  const isStaff = userRole === 'STAFF';
  const isManagerOrStaff = userRole === 'MANAGER' || userRole === 'STAFF';

  const getRoleBadge = () => {
    if (!user) return null;
    const roleName = user.role || 'USER';
    switch (roleName.toUpperCase()) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mr-1.5 animate-pulse"></span>
            👑 ADMIN
          </span>
        );
      case 'MANAGER':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-1.5"></span>
            🏢 {user.branchName || 'MANAGER'}
          </span>
        );
      case 'STAFF':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100 shadow-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
            🧑‍💼 NHÂN VIÊN ({user.branchName || 'STAFF'})
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-slate-50 text-slate-600 border border-slate-100">
            👤 USER
          </span>
        );
    }
  };

  return (
    <header className="flex-shrink-0 bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 flex items-center justify-between px-6 z-10">
      <div className="flex items-center">
        <button onClick={onMenuClick} className="md:hidden text-slate-600 hover:text-indigo-600 focus:outline-none transition-colors">
          <Icon name="menu" className="h-6 w-6"/>
        </button>
      </div>

      <div className="flex items-center space-x-4">
        {getRoleBadge()}
        
        <Button variant="ghost" className="rounded-xl text-slate-500 hover:text-slate-900 text-sm hover:bg-slate-50" onClick={logout}>
          Đăng xuất
        </Button>
      </div>
    </header>
  );
};

export default Topbar;
