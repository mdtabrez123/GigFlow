import React from 'react';
import { Bell, Search, Menu, Moon, Sun, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

interface TopbarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({ searchTerm, onSearchChange }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1">
        {/* Mobile Menu Button */}
        <button className="p-2 text-gray-500 rounded-lg sm:hidden hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu className="w-6 h-6" />
        </button>

        {/* Search Bar */}
        <div className="relative flex-1 max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full sm:w-80 pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-500 dark:placeholder-gray-400"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          title="Toggle Dark Mode"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        <button className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 dark:border-gray-700 pl-4">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-700 dark:text-white">{user?.name || 'User'}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{user?.role || 'Guest'}</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors ml-1"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};
