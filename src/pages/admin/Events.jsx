import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Search, CheckCircle, XCircle, Star, Eye } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function AdminEvents() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const params = {};
      if (filter !== 'all') {
        params.status = filter;
      }
      const response = await api.getAdminEvents(params);
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load events');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      await api.approveEvent(eventId);
      toast.success('Event approved');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to approve event');
    }
  };

  const handleReject = async (eventId) => {
    try {
      await api.rejectEvent(eventId, 'Does not meet guidelines');
      toast.success('Event rejected');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to reject event');
    }
  };

  const handleFeature = async (eventId, featured) => {
    try {
      await api.request(`/admin/events/${eventId}/featured`, {
        method: 'PUT',
        body: { featured }
      });
      toast.success(featured ? 'Event featured' : 'Event unfeatured');
      fetchEvents();
    } catch (error) {
      toast.error('Failed to update feature status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Events</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and moderate events</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'published', 'rejected'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
              filter === status
                ? 'bg-sky-500 text-white'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event) => (
          <motion.div
            key={event._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden"
          >
            <div className="relative h-48">
              <img
                src={event.coverImage || '/placeholder-event.jpg'}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  event.status === 'published' 
                    ? 'bg-green-500 text-white'
                    : event.status === 'pending'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-red-500 text-white'
                }`}>
                  {event.status}
                </span>
              </div>
              {event.isFeatured && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-500 text-white">
                    Featured
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-5">
              <h3 className="font-semibold text-slate-900 dark:text-white mb-2">
                {event.title}
              </h3>
              <p className="text-sm text-slate-500 mb-4">
                by {event.organizer?.firstName} {event.organizer?.lastName}
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                {formatDate(event.startDate)}
              </p>
              
              <div className="flex items-center gap-2">
                <Link
                  to={`/events/${event.slug}`}
                  target="_blank"
                  className="flex-1 py-2 text-center text-sm font-medium text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4 inline mr-1" />
                  View
                </Link>
                
                {event.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleApprove(event._id)}
                      className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleReject(event._id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </>
                )}
                
                <button
                  onClick={() => handleFeature(event._id, !event.isFeatured)}
                  className={`p-2 rounded-lg transition-colors ${
                    event.isFeatured
                      ? 'text-purple-600 bg-purple-50'
                      : 'text-slate-400 hover:bg-slate-100'
                  }`}
                >
                  <Star className={`w-5 h-5 ${event.isFeatured ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
