/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Globe, 
  Heart, 
  Share2, 
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  X
} from 'lucide-react';
import { useAuth, useLanguage } from '../context';
import { api } from '../utils/api';
import { 
  formatDate, 
  formatTime, 
  formatPrice, 
  generateGoogleCalendarUrl,
  shareEvent 
} from '../utils/helpers';
import { toast } from 'sonner';

export default function EventDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {

    const fetchEvent = async () => {
      try {
        console.log("Event details: ");
        const response = await api.getEvent(slug);
        setEvent(response.data.event);
      } catch (error) {
        console.error('Error fetching event:', error);
        toast.error('Event not found');
        navigate('/events');
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvent();
  }, [slug, navigate]);

  
  const handleRegister = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to register for this event');
      navigate('/login');
      return;
    }

    setIsRegistering(true);
    try {
      if (event.isRegistered) {
        await api.unregisterFromEvent(event._id);
        setEvent(prev => ({ ...prev, isRegistered: false, attendeeCount: prev.attendeeCount - 1 }));
        toast.success('Registration cancelled');
      } else {
        await api.registerForEvent(event._id);
        setEvent(prev => ({ ...prev, isRegistered: true, attendeeCount: prev.attendeeCount + 1 }));
        toast.success('Successfully registered!');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update registration');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to favorite this event');
      return;
    }

    try {
      await api.toggleFavorite(event._id);
      setEvent(prev => ({ 
        ...prev, 
        isFavorited: !prev.isFavorited,
        favoriteCount: prev.isFavorited ? prev.favoriteCount - 1 : prev.favoriteCount + 1
      }));
      toast.success(event.isFavorited ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleShare = async () => {
    const success = await shareEvent(event);
    if (success) {
      toast.success('Shared successfully');
    }
  };

  const handleAddToCalendar = () => {
    const url = generateGoogleCalendarUrl(event);
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Image */}
      <div className="relative h-64 sm:h-80 lg:h-96">
        <img
          src={event.coverImage || '/placeholder-event.jpg'}
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent" />
        
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={handleFavorite}
            className={`p-2 rounded-full backdrop-blur-sm transition-all ${
              event.isFavorited 
                ? 'bg-red-500 text-white' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            <Heart className={`w-6 h-6 ${event.isFavorited ? 'fill-current' : ''}`} />
          </button>
          <button
            onClick={handleShare}
            className="p-2 rounded-full bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 transition-colors"
          >
            <Share2 className="w-6 h-6" />
          </button>
        </div>

        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
          <div className="max-w-7xl mx-auto">
            {event.category && (
              <span 
                className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white mb-4"
                style={{ backgroundColor: event.category.color }}
              >
                {event.category.name}
              </span>
            )}
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              {event.title}
            </h1>
            <p className="text-slate-300 text-lg">
              by {event.organizerName}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.details.description')}
              </h2>
              <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                {event.description}
              </div>
            </motion.section>

            {/* Location */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.details.location')}
              </h2>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-sky-500" />
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white">
                    {event.location?.type === 'online' 
                      ? 'Online Event' 
                      : event.location?.venueName}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400">
                    {event.location?.type === 'online' 
                      ? 'Join from anywhere'
                      : event.location?.address}
                  </p>
                  {event.location?.onlineLink && (
                    <a 
                      href={event.location.onlineLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 text-sky-600 hover:text-sky-700"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Join Online
                    </a>
                  )}
                </div>
              </div>
            </motion.section>

            {/* Organizer */}
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
            >
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.details.organizer')}
              </h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-xl font-medium">
                  {event.organizer?.avatar ? (
                    <img 
                      src={event.organizer.avatar} 
                      alt={event.organizerName}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    event.organizerName?.[0]?.toUpperCase()
                  )}
                </div>
                <div>
                  <p className="font-medium text-slate-900 dark:text-white text-lg">
                    {event.organizerName}
                  </p>
                  {event.organizer?.bio && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
                      {event.organizer.bio}
                    </p>
                  )}
                </div>
              </div>
            </motion.section>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Date & Time Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
            >
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Date</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatDate(event.startDate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Time</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Users className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Attendees</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {event.attendeeCount || 0} / {event.maxCapacity || 'Unlimited'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                    <Globe className="w-6 h-6 text-sky-500" />
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Price</p>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {formatPrice(event.price?.amount, event.price?.currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Registration Button */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={handleRegister}
                  disabled={isRegistering}
                  className={`w-full py-4 rounded-xl font-semibold transition-all ${
                    event.isRegistered
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-sky-500 hover:bg-sky-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRegistering 
                    ? 'Loading...' 
                    : event.isRegistered 
                      ? t('events.details.unregister')
                      : t('events.details.register')
                  }
                </button>

                <button
                  onClick={handleAddToCalendar}
                  className="w-full py-3 rounded-xl font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  {t('events.details.addToCalendar')}
                </button>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white mb-4">
                Contact Information
              </h3>
              <div className="space-y-3">
                {event.organizerEmail && (
                  <a 
                    href={`mailto:${event.organizerEmail}`}
                    className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    {event.organizerEmail}
                  </a>
                )}
                {event.organizerPhone && (
                  <a 
                    href={`tel:${event.organizerPhone}`}
                    className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-sky-600 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    {event.organizerPhone}
                  </a>
                )}
              </div>
            </motion.div>

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-soft"
              >
                <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
