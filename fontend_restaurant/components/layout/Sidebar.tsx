
import React from 'react';
import type { Page, MenuItem, MenuItemGroup } from '../../types/types';
import { Icon, IconName } from '../ui/Icon';
import Avatar from '../ui/Avatar';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  menuItems: MenuItemGroup[];
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, isOpen, setOpen, menuItems }) => {
  const { user } = useAuth();

  const NavLink: React.FC<{ item: MenuItem }> = ({ item }) => {
    const isActive = currentPage === item.name;
    return (
      <li
        className={`group flex items-center p-3 my-1 rounded-xl cursor-pointer transition-all duration-300 ${
          isActive
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold shadow-lg shadow-indigo-600/25 border-l-4 border-indigo-400 scale-[1.02] translate-x-1'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-white hover:translate-x-1'
        }`}
        onClick={() => onNavigate(item.name)}
      >
        <div className={`w-5 h-5 mr-3 transition-colors duration-300 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`}>
          <Icon name={item.icon} />
        </div>
        <span className="text-sm tracking-wide">{item.name}</span>
      </li>
    );
  };
  
  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-20 bg-slate-950/60 backdrop-blur-sm md:hidden transition-opacity duration-300" 
          onClick={() => setOpen(false)}
        ></div>
      )}
      
      <aside className={`fixed md:relative inset-y-0 left-0 z-30 flex flex-col w-64 bg-slate-900 text-slate-100 border-r border-slate-800/80 shadow-[4px_0_24px_0_rgba(15,23,42,0.15)] transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:flex-shrink-0`}>
        <div className="flex items-center justify-center h-20 border-b border-slate-800 bg-slate-950/20">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-indigo-400 via-violet-400 to-fuchsia-400 bg-clip-text text-transparent tracking-tight">
            3SHIP RESTAURANT
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 overflow-y-auto space-y-6">
          {menuItems.map((group, groupIdx) => (
            <div key={groupIdx}>
              {group.groupName && (
                <h3 className="px-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">
                  {group.groupName}
                </h3>
              )}
              <ul>
                {group.items.map((item) => (
                  <NavLink key={item.name} item={item} />
                ))}
              </ul>
            </div>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-950/45">
          <div className="flex items-center">
            <div className="ring-2 ring-indigo-500/30 rounded-full p-0.5">
              <Avatar
                src={user?.avatar || `https://api.dicebear.com/9.x/initials/svg?seed=${user?.username ?? 'A'}`}
                alt={user?.username || 'Admin'}
                size="md"
              />
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="font-bold text-sm text-white truncate">{user?.username || 'Admin'}</p>
              <p className="text-xs text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
