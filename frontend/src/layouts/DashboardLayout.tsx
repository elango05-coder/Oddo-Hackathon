import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { notificationService } from '../services/notificationService';
import type { AppNotification } from '../types';
import {
  LayoutDashboard,
  Building2,
  FolderTree,
  Users,
  Grid,
  Laptop,
  ArrowLeftRight,
  CalendarDays,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import toast from 'react-hot-toast';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const userRole = typeof user?.roleId === 'object' ? user.roleId.name : '';

  // Load notifications
  const fetchNotifications = async () => {
    try {
      const res = await notificationService.getAll();
      setNotifications(res.data || []);
      const countRes = await notificationService.getUnreadCount();
      setUnreadCount(countRes.data || 0);
    } catch (e) {
      // Fail silently for dashboard mounting
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new alerts
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      fetchNotifications();
      toast.success('All notifications marked as read.');
    } catch (e) {
      toast.error('Failed to update notifications.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully.');
  };

  // Build navigation items list based on user role
  const getNavItems = () => {
    const items = [
      {
        name: 'Dashboard',
        path: '/',
        icon: LayoutDashboard,
        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'],
      },
      {
        name: 'Organization',
        path: '/organization',
        icon: Building2,
        roles: ['Admin'],
      },
      {
        name: 'Departments',
        path: '/departments',
        icon: FolderTree,
        roles: ['Admin', 'Asset Manager', 'Department Head'],
      },
      {
        name: 'Employees',
        path: '/employees',
        icon: Users,
        roles: ['Admin'],
      },
      {
        name: 'Categories',
        path: '/categories',
        icon: Grid,
        roles: ['Admin', 'Asset Manager'],
      },
      {
        name: 'Assets Directory',
        path: '/assets',
        icon: Laptop,
        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'],
      },
      {
        name: 'Transfer Requests',
        path: '/transfers',
        icon: ArrowLeftRight,
        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'],
      },
      {
        name: 'Bookings Calendar',
        path: '/bookings',
        icon: CalendarDays,
        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'],
      },
      {
        name: 'Maintenance',
        path: '/maintenance',
        icon: Wrench,
        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'],
      },
      {
        name: 'Audit Cycles',
        path: '/audits',
        icon: ClipboardCheck,
        roles: ['Admin', 'Asset Manager', 'Department Head', 'Employee'], // scan allowed for auditors
      },
      {
        name: 'Reports & Analytics',
        path: '/reports',
        icon: BarChart3,
        roles: ['Admin', 'Asset Manager', 'Department Head'],
      },
    ];

    return items.filter((item) => item.roles.includes(userRole));
  };

  const navItems = getNavItems();

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-200">
      
      {/* 1. DESKTOP SIDEBAR */}
      <aside
        className={`hidden md:flex flex-col bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 relative ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="bg-indigo-600 p-1.5 rounded-lg text-white flex-shrink-0">
              <Laptop className="h-5 w-5" />
            </div>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold tracking-tight text-slate-950 dark:text-white">
                Asset<span className="text-indigo-600">Flow</span>
              </span>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 absolute -right-3.5 top-4.5 bg-white dark:bg-slate-900 shadow-sm z-10"
          >
            {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                {!sidebarCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer User detail */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-semibold text-sm">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{user?.name}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{userRole}</p>
              </div>
            )}
            <button
              onClick={handleLogout}
              className={`p-1.5 text-slate-400 dark:text-slate-500 hover:text-red-500 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors ${
                sidebarCollapsed ? 'w-full flex justify-center' : ''
              }`}
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE SIDEBAR OVERLAY */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden bg-slate-900/60 backdrop-blur-sm">
          <aside className="w-64 bg-white dark:bg-slate-900 h-full flex flex-col p-4 shadow-xl animate-in slide-in-from-left duration-200">
            <div className="flex justify-between items-center mb-6">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                Asset<span className="text-indigo-600">Flow</span>
              </span>
              <button
                onClick={() => setMobileSidebarOpen(false)}
                className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4 mt-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold truncate text-slate-900 dark:text-slate-100">{user?.name}</p>
                  <p className="text-xs text-slate-500 capitalize">{userRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-red-500"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* 3. MAIN APP PANEL CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        
        {/* Top Navbar */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 md:hidden rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 capitalize">
              {location.pathname === '/' ? 'Dashboard' : location.pathname.substring(1).replace('-', ' ')}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark mode switcher */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5 text-amber-500" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notification bell dropdown toggle */}
            <div className="relative">
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 relative"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <span className="font-semibold text-sm">Notifications</span>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-xs text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto custom-scrollbar divide-y divide-slate-100 dark:divide-slate-800/60">
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        No new notifications.
                      </div>
                    ) : (
                      notifications.map((notif) => (
                        <div
                          key={notif._id}
                          className={`p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40 ${
                            !notif.isRead ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''
                          }`}
                        >
                          <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                            {!notif.isRead && <span className="h-1.5 w-1.5 bg-indigo-600 dark:bg-indigo-400 rounded-full flex-shrink-0" />}
                            {notif.title}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                          <p className="text-[10px] text-slate-400 mt-2">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-200 dark:border-slate-800 text-center">
                    <Link
                      to="/notifications"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline"
                    >
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <Link
              to="/settings"
              className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-sm font-semibold">
                {user?.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          </div>
        </header>

        {/* Content View Page scroll panel */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
};
export default DashboardLayout;
