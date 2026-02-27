import { format, parseISO, isPast, isFuture, isToday, differenceInDays } from 'date-fns';

// Format date
export const formatDate = (date, formatStr = 'MMM d, yyyy') => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

// Format time
export const formatTime = (time) => {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const date = new Date();
  date.setHours(parseInt(hours), parseInt(minutes));
  return format(date, 'h:mm a');
};

// Format date and time
export const formatDateTime = (date, time) => {
  if (!date) return '';
  const dateStr = formatDate(date);
  const timeStr = time ? formatTime(time) : '';
  return timeStr ? `${dateStr} at ${timeStr}` : dateStr;
};

// Get relative time
export const getRelativeTime = (date) => {
  if (!date) return '';
  const d = typeof date === 'string' ? parseISO(date) : date;
  const days = differenceInDays(d, new Date());
  
  if (days < 0) return 'Past';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 7) return `In ${days} days`;
  if (days < 30) return `In ${Math.floor(days / 7)} weeks`;
  return `In ${Math.floor(days / 30)} months`;
};

// Check if event is upcoming
export const isUpcoming = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isFuture(d) || isToday(d);
};

// Check if event is past
export const isPastEvent = (date) => {
  if (!date) return false;
  const d = typeof date === 'string' ? parseISO(date) : date;
  return isPast(d) && !isToday(d);
};

// Format price
export const formatPrice = (price, currency = 'USD') => {
  if (price === 0 || price === null || price === undefined) return 'Free';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(price);
};

// Format number
export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0';
  
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Truncate text
export const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
};

// Generate slug
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);
};

// Generate Google Calendar URL
export const generateGoogleCalendarUrl = (event) => {
  if (!event) return '';
  
  const { title, description, startDate, endDate, startTime, endTime, location } = event;
  
  const formatDateTime = (date, time) => {
    const d = new Date(date);
    if (time) {
      const [hours, minutes] = time.split(':');
      d.setHours(parseInt(hours), parseInt(minutes));
    }
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };
  
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: description || '',
    dates: `${formatDateTime(startDate, startTime)}/${formatDateTime(endDate, endTime)}`,
  });
  
  if (location?.address) {
    params.append('location', location.address);
  }
  
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};

// Share event
export const shareEvent = async (event) => {
  const shareData = {
    title: event.title,
    text: event.shortDescription || event.description,
    url: `${window.location.origin}/events/${event.slug}`,
  };
  
  if (navigator.share) {
    try {
      await navigator.share(shareData);
      return true;
    } catch (error) {
      console.error('Share failed:', error);
      return false;
    }
  } else {
    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(shareData.url);
      return true;
    } catch (error) {
      console.error('Copy failed:', error);
      return false;
    }
  }
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (error) {
    console.error('Copy failed:', error);
    return false;
  }
};

// Debounce function
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Throttle function
export const throttle = (func, limit) => {
  let inThrottle;
  return function executedFunction(...args) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Get event status color
export const getEventStatusColor = (status) => {
  const colors = {
    draft: 'bg-gray-500',
    pending: 'bg-yellow-500',
    approved: 'bg-green-500',
    published: 'bg-blue-500',
    rejected: 'bg-red-500',
    cancelled: 'bg-gray-500',
    completed: 'bg-purple-500',
  };
  return colors[status] || 'bg-gray-500';
};

// Get category color
export const getCategoryColor = (color) => {
  const colorMap = {
    blue: 'bg-blue-500 text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-black',
    purple: 'bg-purple-500 text-white',
    pink: 'bg-pink-500 text-white',
    orange: 'bg-orange-500 text-white',
    teal: 'bg-teal-500 text-white',
    cyan: 'bg-cyan-500 text-white',
    sky: 'bg-sky-500 text-white',
  };
  return colorMap[color] || 'bg-gray-500 text-white';
};
