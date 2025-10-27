import { Link, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';

interface SidebarProps {
  onLogout: () => void;
  username: string;
}

interface NavItemProps {
  to: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
  disabled?: boolean;
}

function NavItem({ to, icon, label, active, disabled }: NavItemProps) {
  const baseClasses = "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200";
  const activeClasses = active
    ? "bg-indigo-600 text-white shadow-lg"
    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  if (disabled) {
    return (
      <div className={`${baseClasses} ${activeClasses} ${disabledClasses}`} title="Coming soon">
        <span className="text-xl">{icon}</span>
        <span className="font-medium">{label}</span>
        <span className="ml-auto text-xs bg-gray-200 dark:bg-gray-600 px-2 py-1 rounded">Soon</span>
      </div>
    );
  }

  return (
    <Link to={to} className={`${baseClasses} ${activeClasses}`}>
      <span className="text-xl">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  );
}

export default function Sidebar({ onLogout, username }: SidebarProps) {
  const location = useLocation();

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Logo & Branding */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
          🌀 FortiFlow
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Master your flow. Map by map.
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        <NavItem
          to="/"
          icon="🏠"
          label="My Routines"
          active={location.pathname === '/'}
        />
        <NavItem
          to="/community"
          icon="🌐"
          label="Community"
          active={location.pathname === '/community'}
        />
        <NavItem
          to="/maps"
          icon="🗺️"
          label="Popular Maps"
          disabled
        />
        <NavItem
          to="/stats"
          icon="📊"
          label="Statistics"
          disabled
        />
        <NavItem
          to="/settings"
          icon="⚙️"
          label="Settings"
          active={location.pathname === '/settings'}
        />
      </nav>

      {/* User Section */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {username.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Free Plan
            </p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
