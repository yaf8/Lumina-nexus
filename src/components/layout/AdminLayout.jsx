import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Tag, 
  BarChart3, 
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useLanguage } from '../../context';

export default function AdminLayout() {
  const location = useLocation();
  const { t } = useLanguage();

  const sidebarLinks = [
    { to: '/admin', icon: LayoutDashboard, label: t('dashboard.overview') },
    { to: '/admin/users', icon: Users, label: t('dashboard.users') },
    { to: '/admin/events', icon: Calendar, label: t('dashboard.events') },
    { to: '/admin/categories', icon: Tag, label: 'Categories' },
    { to: '/admin/analytics', icon: BarChart3, label: t('dashboard.analytics') },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 fixed h-full">
        <div className="p-6">
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <ArrowLeft className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-slate-900 dark:text-white">
              Back to Site
            </span>
          </Link>

          <nav className="space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-200 dark:border-slate-800">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="w-5 h-5" />
            {t('nav.settings')}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="p-8"
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
