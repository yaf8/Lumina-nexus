import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Plus } from 'lucide-react';
import { api } from '../utils/api';
import { useLanguage } from '../context';
import EventCard from '../components/events/EventCard';
import { Link } from 'react-router-dom';

export default function MyEvents() {
  const [events, setEvents] = useState({ created: [], joined: [] });
  const [activeTab, setActiveTab] = useState('created');
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.request('/users/events');
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const displayEvents = activeTab === 'created' ? events.created : events.joined.map(j => j.event).filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            {t('events.myEvents')}
          </h1>
          <Link
            to="/create-event"
            className="flex items-center gap-2 px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Create Event
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mb-8">
          <button
            onClick={() => setActiveTab('created')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'created'
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Created
          </button>
          <button
            onClick={() => setActiveTab('joined')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'joined'
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            Joined
          </button>
        </div>

        {/* Events Grid */}
        {displayEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayEvents.map((event, index) => (
              <motion.div
                key={event._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <EventCard event={event} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Calendar className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              No events {activeTab === 'created' ? 'created' : 'joined'} yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              {activeTab === 'created' 
                ? 'Create your first event to get started'
                : 'Join events to see them here'}
            </p>
            <Link
              to={activeTab === 'created' ? '/create-event' : '/events'}
              className="inline-block px-6 py-3 bg-sky-500 text-white rounded-xl font-medium hover:bg-sky-600 transition-colors"
            >
              {activeTab === 'created' ? 'Create Event' : 'Browse Events'}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
