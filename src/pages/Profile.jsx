/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, Heart, Settings, MapPin, Mail, Phone, Edit2 } from 'lucide-react';
import { useAuth, useLanguage } from '../context';
import { api } from '../utils/api';
import { formatDate } from '../utils/helpers';
import EventCard from '../components/events/EventCard';

export default function Profile() {
  const [activeTab, setActiveTab] = useState('overview');
  const [userEvents, setUserEvents] = useState({ created: [], joined: [] });
  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, favoritesRes] = await Promise.all([
          api.request('/users/events'),
          api.getFavorites(),
        ]);
        
        setUserEvents(eventsRes.data);
        setFavorites(favoritesRes.data.favorites);
      } catch (error) {
        console.error('Error fetching profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Calendar },
    { id: 'events', label: t('events.myEvents'), icon: Calendar },
    { id: 'favorites', label: t('events.favorites'), icon: Heart },
    { id: 'settings', label: t('profile.settings'), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Profile Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-8 mb-8"
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-3xl md:text-4xl font-bold">
                {user?.avatar ? (
                  <img 
                    src={user.avatar} 
                    alt={user.firstName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user?.firstName?.[0]?.toUpperCase()
                )}
              </div>
              <button className="absolute bottom-0 right-0 p-2 rounded-full bg-sky-500 text-white hover:bg-sky-600 transition-colors">
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">
                {user?.firstName} {user?.lastName}
              </h1>
              <p className="text-slate-500 dark:text-slate-400 capitalize mb-4">
                {user?.role}
              </p>
              
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {user?.email}
                </span>
                {user?.phoneNumber && (
                  <span className="flex items-center gap-1">
                    <Phone className="w-4 h-4" />
                    {user.phoneNumber}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  Member since {formatDate(user?.createdAt)}
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.stats?.totalEventsCreated || 0}
                </p>
                <p className="text-sm text-slate-500">Events Created</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.stats?.totalEventsJoined || 0}
                </p>
                <p className="text-sm text-slate-500">Events Joined</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {user?.stats?.totalFavorites || 0}
                </p>
                <p className="text-sm text-slate-500">Favorites</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-sky-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Recent Events
                </h2>
                {userEvents.created.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userEvents.created.slice(0, 3).map((event) => (
                      <EventCard key={event._id} event={event} variant="minimal" />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      No events created yet.
                    </p>
                    <Link
                      to="/create-event"
                      className="inline-block mt-4 px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
                    >
                      Create Your First Event
                    </Link>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="space-y-8">
              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Created Events
                </h2>
                {userEvents.created.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userEvents.created.map((event) => (
                      <EventCard key={event._id} event={event} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      No events created yet.
                    </p>
                  </div>
                )}
              </section>

              <section>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                  Joined Events
                </h2>
                {userEvents.joined.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {userEvents.joined.map(({ event }) => (
                      event && <EventCard key={event._id} event={event} variant="minimal" />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
                    <p className="text-slate-500 dark:text-slate-400">
                      No events joined yet.
                    </p>
                    <Link
                      to="/events"
                      className="inline-block mt-4 px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
                    >
                      Browse Events
                    </Link>
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === 'favorites' && (
            <section>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.favorites')}
              </h2>
              {favorites.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {favorites.map((event) => (
                    <EventCard key={event._id} event={event} />
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">
                    No favorites yet.
                  </p>
                  <Link
                    to="/events"
                    className="inline-block mt-4 px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
                  >
                    Discover Events
                  </Link>
                </div>
              )}
            </section>
          )}

          {activeTab === 'settings' && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-8">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                {t('profile.settings')}
              </h2>
              
              <div className="space-y-6">
                <Link
                  to="/settings"
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <Settings className="w-5 h-5 text-sky-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">Account Settings</p>
                      <p className="text-sm text-slate-500">Manage your account preferences</p>
                    </div>
                  </div>
                  <Edit2 className="w-5 h-5 text-slate-400" />
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
