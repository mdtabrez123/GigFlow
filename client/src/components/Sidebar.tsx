import React from 'react';
import { LayoutDashboard, Users, UserPlus, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, active: false },
  { label: 'Leads', icon: Users, active: true },
  { label: 'Add Lead', icon: UserPlus, active: false },
  { label: 'Settings', icon: Settings, active: false },
];

export const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  
  return (
    <aside className="fixed top-0 left-0 z-40 w-64 h-screen bg-[#111827] border-r border-gray-800 transition-transform -translate-x-full sm:translate-x-0">
      <div className="h-full px-4 py-6 overflow-y-auto">
        {/* Logo Area */}
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
            <span className="text-white font-bold text-lg">G</span>
          </div>
          <span className="self-center text-xl font-bold whitespace-nowrap text-white">
            GigFlow
          </span>
        </div>

        {/* Nav Items */}
        <ul className="space-y-2 font-medium">
          {navItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <li key={index}>
                <a
                  href="#"
                  className={clsx(
                    'flex items-center p-3 rounded-xl transition-colors duration-200 group',
                    item.active
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="ms-3">{item.label}</span>
                </a>
              </li>
            );
          })}
        </ul>

        {/* Bottom Area (Logout) */}
        <div className="absolute bottom-6 left-0 w-full px-4">
          <button
            onClick={logout}
            className="w-full flex items-center p-3 text-gray-400 rounded-xl hover:bg-gray-800 hover:text-white transition-colors group"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <span className="ms-3">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
