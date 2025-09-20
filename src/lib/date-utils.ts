/**
 * Date utilities for consistent date formatting across the application
 */

export const formatDate = (date: any, options?: {
  includeTime?: boolean;
  format?: 'short' | 'long';
}) => {
  if (!date) return 'Date not available';
  
  try {
    let dateObj: Date;
    
    // Handle different date formats
    if (date.seconds) {
      // Firestore Timestamp with seconds
      dateObj = new Date(date.seconds * 1000);
    } else if (date.toDate && typeof date.toDate === 'function') {
      // Firestore Timestamp with toDate() method
      dateObj = date.toDate();
    } else if (date._seconds) {
      // Alternative Firestore Timestamp format
      dateObj = new Date(date._seconds * 1000);
    } else if (typeof date === 'string') {
      // ISO string or other string format
      dateObj = new Date(date);
    } else if (typeof date === 'number') {
      // Unix timestamp
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      // Already a Date object
      dateObj = date;
    } else {
      console.warn('Unknown date format:', date);
      return 'Invalid date format';
    }
    
    // Check if the date is valid
    if (isNaN(dateObj.getTime())) {
      console.warn('Invalid date created from:', date);
      return 'Invalid date';
    }
    
    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: options?.format === 'long' ? 'long' : 'short',
      day: 'numeric'
    };
    
    if (options?.includeTime) {
      formatOptions.hour = '2-digit';
      formatOptions.minute = '2-digit';
    }
    
    return dateObj.toLocaleDateString('en-US', formatOptions);
  } catch (error) {
    console.error('Error formatting date:', error, date);
    return 'Date error';
  }
};

export const formatDateShort = (date: any) => formatDate(date, { format: 'short' });
export const formatDateLong = (date: any) => formatDate(date, { format: 'long' });
export const formatDateTime = (date: any) => formatDate(date, { includeTime: true });

/**
 * Check if a date is today
 */
export const isToday = (date: any) => {
  try {
    const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  } catch {
    return false;
  }
};

/**
 * Get relative time (e.g., "2 hours ago", "3 days ago")
 */
export const getRelativeTime = (date: any) => {
  try {
    const dateObj = typeof date.toDate === 'function' ? date.toDate() : new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    
    return formatDate(date);
  } catch {
    return formatDate(date);
  }
};