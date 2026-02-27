import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Users, Calendar, Eye } from 'lucide-react';
import { api } from '../../utils/api';

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await api.request('/admin/analytics?period=30');
        setAnalytics(response.data);
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

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
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Analytics</h1>
        <p className="text-slate-600 dark:text-slate-400">Detailed insights and statistics</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'User Registrations', value: analytics?.userRegistrations?.reduce((a, b) => a + b.count, 0) || 0, icon: Users, color: 'bg-blue-500' },
          { label: 'Event Creations', value: analytics?.eventCreations?.reduce((a, b) => a + b.count, 0) || 0, icon: Calendar, color: 'bg-green-500' },
          { label: 'Top Organizers', value: analytics?.topOrganizers?.length || 0, icon: TrendingUp, color: 'bg-purple-500' },
          { label: 'Location Types', value: analytics?.locationDistribution?.length || 0, icon: Eye, color: 'bg-orange-500' },
        ].map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
          >
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center mb-4`}>
              <stat.icon className="w-6 h-6 text-white" />
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
            <p className="text-sm text-slate-500">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Top Organizers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Top Organizers
        </h3>
        <div className="space-y-4">
          {analytics?.topOrganizers?.map((organizer, index) => (
            <div key={index} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white font-medium">
                  {organizer.name?.[0]}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">{organizer.name}</p>
                  <p className="text-sm text-slate-500">{organizer.eventCount} events</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-sky-600">{organizer.totalAttendees}</p>
                <p className="text-sm text-slate-500">attendees</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Location Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-6"
      >
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
          Event Location Distribution
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {analytics?.locationDistribution?.map((loc) => (
            <div key={loc._id} className="text-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
              <p className="text-2xl font-bold text-sky-600">{loc.count}</p>
              <p className="text-sm text-slate-500 capitalize">{loc._id}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
