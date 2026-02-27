import { Event } from '../models/index.js';

// Mark expired events
export const expireEvents = async () => {
  try {
    const now = new Date();
    
    const result = await Event.updateMany(
      {
        endDate: { $lt: now },
        isExpired: false
      },
      {
        $set: {
          isExpired: true,
          status: 'completed'
        }
      }
    );

    console.log(`✅ Marked ${result.modifiedCount} events as expired`);
    return result;
  } catch (error) {
    console.error('❌ Error expiring events:', error.message);
    throw error;
  }
};

// Get upcoming events that need reminders
export const getEventsForReminders = async (hoursBefore = 24) => {
  try {
    const now = new Date();
    const reminderTime = new Date(now.getTime() + hoursBefore * 60 * 60 * 1000);
    
    const events = await Event.find({
      startDate: {
        $gte: reminderTime,
        $lt: new Date(reminderTime.getTime() + 60 * 60 * 1000) // Within the next hour
      },
      isExpired: false,
      status: { $in: ['approved', 'published'] }
    }).populate('attendees.user', 'email firstName');

    return events;
  } catch (error) {
    console.error('❌ Error getting events for reminders:', error.message);
    throw error;
  }
};

// Clean up old drafts
export const cleanupOldDrafts = async (daysOld = 30) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const result = await Event.deleteMany({
      status: 'draft',
      createdAt: { $lt: cutoffDate }
    });

    console.log(`✅ Cleaned up ${result.deletedCount} old draft events`);
    return result;
  } catch (error) {
    console.error('❌ Error cleaning up old drafts:', error.message);
    throw error;
  }
};
