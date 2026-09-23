import { format, isToday, isYesterday, parseISO } from 'date-fns';

export function formatTransactionDate(dateStr: string): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    if (isToday(date)) {
      return 'Today';
    }
    if (isYesterday(date)) {
      return 'Yesterday';
    }
    return format(date, 'EEE, d MMM yyyy');
  } catch {
    return dateStr;
  }
}

export function formatTransactionTime(dateStr: string): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, 'h:mm a');
  } catch {
    return '';
  }
}

export function formatTransactionDateTime(dateStr: string): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    const timeStr = format(date, 'h:mm a');
    if (isToday(date)) {
      return `Today, ${timeStr}`;
    }
    if (isYesterday(date)) {
      return `Yesterday, ${timeStr}`;
    }
    return `${format(date, 'd MMM')}, ${timeStr}`;
  } catch {
    return dateStr;
  }
}

export function formatShortDate(dateStr: string): string {
  try {
    const date = typeof dateStr === 'string' ? parseISO(dateStr) : new Date(dateStr);
    return format(date, 'd MMM');
  } catch {
    return dateStr;
  }
}

export function getCurrentMonthName(month: number): string {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[month - 1] || '';
}

