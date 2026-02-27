import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, AuthProvider, LanguageProvider } from './context';
import { AnimatePresence } from 'framer-motion';

// Layouts
import MainLayout from './components/layout/MainLayout';
import AdminLayout from './components/layout/AdminLayout';

// Pages
import Home from './pages/Home';
import Events from './pages/Events';
import EventDetail from './pages/EventDetail';
import CreateEvent from './pages/CreateEvent';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Favorites from './pages/Favorites';
import MyEvents from './pages/MyEvents';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminEvents from './pages/admin/Events';
import AdminCategories from './pages/admin/Categories';
import AdminAnalytics from './pages/admin/Analytics';

// Reviewer Pages
import ReviewerQueue from './pages/reviewer/Queue';

// Protected Route
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <AnimatePresence mode="wait">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="events" element={<Events />} />
                <Route path="events/:slug" element={<EventDetail />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                
                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="create-event" element={<CreateEvent />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="favorites" element={<Favorites />} />
                  <Route path="my-events" element={<MyEvents />} />
                </Route>

                {/* Reviewer Routes */}
                <Route element={<ProtectedRoute allowedRoles={['reviewer', 'admin']} />}>
                  <Route path="reviewer" element={<ReviewerQueue />} />
                </Route>
              </Route>

              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboard />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="events" element={<AdminEvents />} />
                  <Route path="categories" element={<AdminCategories />} />
                  <Route path="analytics" element={<AdminAnalytics />} />
                </Route>
              </Route>
            </Routes>
          </AnimatePresence>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
