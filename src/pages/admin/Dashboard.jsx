import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Calendar, TrendingUp, Clock, ArrowUp, ArrowDown } from 'lucide-react';
import { api } from '../../utils/api';
import { formatNumber } from '../../utils/helpers';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.getDashboardStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Users',
      value: stats?.users?.total || 0,
      change: stats?.users?.newThisMonth || 0,
      changeLabel: 'this month',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      title: 'Total Events',
      value: stats?.events?.total || 0,
      change: stats?.events?.thisMonth || 0,
      changeLabel: 'this month',
      icon: Calendar,
      color: 'bg-green-500',
    },
    {
      title: 'Upcoming Events',
      value: stats?.events?.upcoming || 0,
      change: stats?.events?.pending || 0,
      changeLabel: 'pending',
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      title: 'Total Attendees',
      value: stats?.engagement?.totalAttendees || 0,
      change: stats?.engagement?.totalFavorites || 0,
      changeLabel: 'favorites',
      icon: TrendingUp,
      color: 'bg-purple-500',
    },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard Overview</h1>
        <p className="text-slate-600 dark:text-slate-400">Welcome back! Here's what's happening.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">{card.title}</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                  {formatNumber(card.value)}
                </p>
              </div>
              <div className={`w-12 h-12 rounded-xl ${card.color} flex items-center justify-center`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-green-600 flex items-center gap-1">
                <ArrowUp className="w-4 h-4" />
                {card.change}
              </span>
              <span className="text-sm text-slate-500">{card.changeLabel}</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Users */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Recent Users
          </h3>
          <div className="space-y-4">
            {stats?.recentActivity?.users?.map((user) => (
              <div key={user._id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-medium">
                  {user.firstName[0]}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-sm text-slate-500">{user.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  user.role === 'admin' 
                    ? 'bg-purple-100 text-purple-700' 
                    : user.role === 'reviewer'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Recent Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6"
        >
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
            Recent Events
          </h3>
          <div className="space-y-4">
            {stats?.recentActivity?.events?.map((event) => (
              <div key={event._id} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-sky-500" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-slate-900 dark:text-white">{event.title}</p>
                  <p className="text-sm text-slate-500">by {event.organizer?.firstName}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'published' 
                    ? 'bg-green-100 text-green-700' 
                    : event.status === 'pending'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {event.status}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Top Categories */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Top Categories
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats?.topCategories?.map((category) => (
            <div
              key={category.name}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-700 text-center"
            >
              <p className="font-medium text-slate-900 dark:text-white">{category.name}</p>
              <p className="text-2xl font-bold text-sky-500 mt-1">{category.count}</p>
              <p className="text-sm text-slate-500">events</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
