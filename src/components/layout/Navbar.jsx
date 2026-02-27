import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Globe, 
  User, 
  Calendar, 
  Heart, 
  LogOut,
  ChevronDown,
  Plus
} from 'lucide-react';
import { useAuth, useTheme, useLanguage } from '../../context';

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isUserOpen, setIsUserOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { isAuthenticated, user, logout, canPostEvent } = useAuth();
  const { theme, setTheme, isDark } = useTheme();
  const { currentLanguage, languages, changeLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/events?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const navLinks = [
    { to: '/', label: t('nav.home') },
    { to: '/events', label: t('nav.events') },
  ];

  if (isAuthenticated && canPostEvent()) {
    navLinks.push({ to: '/create-event', label: t('nav.create'), icon: Plus });
  }

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 w-full glass border-b border-slate-200/50 dark:border-slate-800/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900 dark:text-white">
              {t('app.name')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  location.pathname === link.to
                    ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                    : 'text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {link.icon && <link.icon className="w-4 h-4" />}
                  {link.label}
                </span>
              </Link>
            ))}
          </nav>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden lg:flex items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder={t('nav.search')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 pl-10 pr-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border-none text-sm focus:ring-2 focus:ring-sky-500 transition-all"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Change language"
              >
                <Globe className="w-5 h-5" />
              </button>
              
              <AnimatePresence>
                {isLangOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-48 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          changeLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-3 ${
                          currentLanguage.code === lang.code
                            ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setIsUserOpen(!isUserOpen)}
                  className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                    {user?.avatar ? (
                      <img src={user.avatar} alt={user.firstName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      user?.firstName?.[0]?.toUpperCase()
                    )}
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </button>

                <AnimatePresence>
                  {isUserOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-900 shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden"
                    >
                      <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {user?.firstName} {user?.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{user?.email}</p>
                      </div>
                      
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setIsUserOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <User className="w-4 h-4" />
                          {t('nav.profile')}
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setIsUserOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Heart className="w-4 h-4" />
                          {t('events.favorites')}
                        </Link>
                        <Link
                          to="/my-events"
                          onClick={() => setIsUserOpen(false)}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                          <Calendar className="w-4 h-4" />
                          {t('events.myEvents')}
                        </Link>
                        
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            onClick={() => setIsUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <User className="w-4 h-4" />
                            {t('nav.admin')}
                          </Link>
                        )}
                        
                        {(user?.role === 'reviewer' || user?.role === 'admin') && (
                          <Link
                            to="/reviewer"
                            onClick={() => setIsUserOpen(false)}
                            className="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          >
                            <Calendar className="w-4 h-4" />
                            {t('nav.reviewer')}
                          </Link>
                        )}
                      </div>
                      
                      <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                        <button
                          onClick={() => {
                            logout();
                            setIsUserOpen(false);
                          }}
                          className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav.logout')}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
                >
                  {t('nav.login')}
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 rounded-lg transition-colors"
                >
                  {t('nav.register')}
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('nav.search')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 border-none text-sm"
                  />
                </div>
              </form>

              {/* Mobile Nav Links */}
              <nav className="space-y-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMenuOpen(false)}
                    className={`block px-4 py-2 rounded-lg text-sm font-medium ${
                      location.pathname === link.to
                        ? 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-900/20'
                        : 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              {/* Mobile Auth */}
              {!isAuthenticated && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-2 text-center text-sm font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg"
                  >
                    {t('nav.login')}
                  </Link>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="block w-full px-4 py-2 text-center text-sm font-medium text-white bg-sky-500 rounded-lg"
                  >
                    {t('nav.register')}
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
