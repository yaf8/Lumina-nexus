import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Eye, Clock } from 'lucide-react';
import { api } from '../../utils/api';
import { formatDate } from '../../utils/helpers';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

export default function ReviewerQueue() {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const response = await api.getReviewQueue();
      setEvents(response.data.events);
    } catch (error) {
      console.error('Error fetching review queue:', error);
      toast.error('Failed to load review queue');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (eventId) => {
    try {
      await api.reviewApproveEvent(eventId);
      toast.success('Event approved');
      fetchQueue();
      setSelectedEvent(null);
    } catch (error) {
      toast.error('Failed to approve event');
    }
  };

  const handleReject = async (eventId) => {
    try {
      await api.reviewRejectEvent(eventId, 'Does not meet guidelines');
      toast.success('Event rejected');
      fetchQueue();
      setSelectedEvent(null);
    } catch (error) {
      toast.error('Failed to reject event');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Review Queue
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            {events.length} events pending review
          </p>
        </div>

        {events.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Events List */}
            <div className="space-y-4">
              {events.map((event, index) => (
                <motion.div
                  key={event._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedEvent(event)}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-soft cursor-pointer transition-all hover:shadow-lg ${
                    selectedEvent?._id === event._id ? 'ring-2 ring-sky-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={event.coverImage || '/placeholder-event.jpg'}
                      alt={event.title}
                      className="w-20 h-20 rounded-xl object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                        {event.title}
                      </h3>
                      <p className="text-sm text-slate-500 mb-2">
                        by {event.organizer?.firstName} {event.organizer?.lastName}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {formatDate(event.createdAt)}
                        </span>
                      </div>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                      Pending
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Event Detail Panel */}
            <div className="lg:sticky lg:top-24">
              {selectedEvent ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft overflow-hidden"
                >
                  <img
                    src={selectedEvent.coverImage || '/placeholder-event.jpg'}
                    alt={selectedEvent.title}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-6">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                      {selectedEvent.title}
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      {selectedEvent.description}
                    </p>
                    
                    <div className="space-y-2 text-sm text-slate-500 mb-6">
                      <p>Date: {formatDate(selectedEvent.startDate)}</p>
                      <p>Organizer: {selectedEvent.organizerName}</p>
                      <p>Contact: {selectedEvent.organizerEmail}</p>
                      <p>Phone: {selectedEvent.organizerPhone}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleApprove(selectedEvent._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(selectedEvent._id)}
                        className="flex-1 flex items-center justify-center gap-2 py-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                      <Link
                        to={`/events/${selectedEvent.slug}`}
                        target="_blank"
                        className="p-3 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-soft p-8 text-center">
                  <p className="text-slate-500">Select an event to review</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
              All caught up!
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              No events pending review
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
