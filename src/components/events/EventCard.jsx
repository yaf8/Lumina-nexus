import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, MapPin, Users, Heart, Share2 } from 'lucide-react';
import { formatDate, formatTime, truncateText, formatPrice } from '../../utils/helpers';
import { useAuth } from '../../context';
import { api } from '../../utils/api';
import { toast } from 'sonner';

export default function EventCard({ event, variant = 'default' }) {
  const [isFavorited, setIsFavorited] = useState(event.isFavorited || false);
  const [favoriteCount, setFavoriteCount] = useState(event.favoriteCount || 0);
  const { isAuthenticated } = useAuth();

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to favorite events');
      return;
    }

    try {
      await api.toggleFavorite(event._id);
      setIsFavorited(!isFavorited);
      setFavoriteCount(prev => isFavorited ? prev - 1 : prev + 1);
      toast.success(isFavorited ? 'Removed from favorites' : 'Added to favorites');
    } catch (error) {
      toast.error('Failed to update favorite');
    }
  };

  const handleShare = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    const shareData = {
      title: event.title,
      text: event.shortDescription || event.description,
      url: `${window.location.origin}/events/${event.slug}`,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Link copied to clipboard');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  if (variant === 'minimal') {
    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300"
      >
        <Link to={`/events/${event.slug}`}>
          <div className="relative h-48 overflow-hidden">
            <img
              src={event.coverImage || '/placeholder-event.jpg'}
              alt={event.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Price Badge */}
            <div className="absolute top-4 left-4">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                event.isFree 
                  ? 'bg-green-500 text-white' 
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white'
              }`}>
                {formatPrice(event.price?.amount, event.price?.currency)}
              </span>
            </div>

            {/* Category Badge */}
            {event.category && (
              <div className="absolute bottom-4 left-4">
                <span 
                  className="px-3 py-1 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: event.category.color }}
                >
                  {event.category.name}
                </span>
              </div>
            )}
          </div>

          <div className="p-5">
            <h3 className="font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
              {event.title}
            </h3>
            
            <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                {formatDate(event.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                {event.location?.type === 'online' ? 'Online' : event.location?.venueName}
              </span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="group bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-soft hover:shadow-soft-lg transition-all duration-300"
    >
      <Link to={`/events/${event.slug}`}>
        <div className="relative h-56 overflow-hidden">
          <img
            src={event.coverImage || '/placeholder-event.jpg'}
            alt={event.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          
          {/* Action Buttons */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <button
              onClick={handleFavorite}
              className={`p-2 rounded-full backdrop-blur-sm transition-all ${
                isFavorited 
                  ? 'bg-red-500 text-white' 
                  : 'bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:text-red-500'
              }`}
            >
              <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-white/90 dark:bg-slate-900/90 text-slate-600 dark:text-slate-400 hover:text-sky-500 transition-all"
            >
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Price Badge */}
          <div className="absolute top-4 left-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              event.isFree 
                ? 'bg-green-500 text-white' 
                : 'bg-white/90 dark:bg-slate-900/90 text-slate-900 dark:text-white'
            }`}>
              {formatPrice(event.price?.amount, event.price?.currency)}
            </span>
          </div>

          {/* Category Badge */}
          {event.category && (
            <div className="absolute bottom-4 left-4">
              <span 
                className="px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: event.category.color }}
              >
                {event.category.name}
              </span>
            </div>
          )}
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-1 group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
            {event.title}
          </h3>
          
          <p className="text-slate-600 dark:text-slate-400 text-sm mb-4 line-clamp-2">
            {truncateText(event.shortDescription || event.description, 120)}
          </p>

          <div className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-sky-500" />
              <span>{formatDate(event.startDate)}</span>
              {event.startTime && (
                <span className="text-slate-400">at {formatTime(event.startTime)}</span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-sky-500" />
              <span>
                {event.location?.type === 'online' 
                  ? 'Online Event' 
                  : event.location?.venueName || event.location?.address}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              <span>{event.attendeeCount || 0} attendees</span>
              {event.maxCapacity && (
                <span className="text-slate-400">
                  ({event.maxCapacity - (event.attendeeCount || 0)} spots left)
                </span>
              )}
            </div>
          </div>

          {/* Organizer */}
          {event.organizer && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-sm font-medium">
                {event.organizer.avatar ? (
                  <img 
                    src={event.organizer.avatar} 
                    alt={event.organizer.firstName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  event.organizer.firstName?.[0]?.toUpperCase()
                )}
              </div>
              <span className="text-sm text-slate-600 dark:text-slate-400">
                by {event.organizer.firstName} {event.organizer.lastName}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
