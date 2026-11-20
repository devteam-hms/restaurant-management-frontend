import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | string | undefined | null): string {
  const num = typeof amount === 'number' ? amount : parseFloat(String(amount || 0));
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  }).format(isNaN(num) ? 0 : num);
}

export function parseUtcDate(dateInput: string | Date | number | undefined | null): Date | null {
  if (!dateInput) return null;
  if (dateInput instanceof Date) return isNaN(dateInput.getTime()) ? null : dateInput;
  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateInput).trim();
  if (!str) return null;

  // If already ends with 'Z' or has explicit timezone offset (+HH:MM or -HH:MM)
  if (/Z$|[+-]\d{2}:\d{2}$|[+-]\d{4}$/i.test(str)) {
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
  }

  // If it's an ISO datetime string without timezone (e.g. "2026-11-18T11:39:00" or "2026-11-18 11:39:00")
  // Backend stores in UTC, so append 'Z' to treat it as UTC
  if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/i.test(str)) {
    const normalized = str.replace(' ', 'T') + 'Z';
    const d = new Date(normalized);
    if (!isNaN(d.getTime())) return d;
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = parseUtcDate(dateString);
    if (!d) return String(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return String(dateString);
  }
}

export function formatShortDate(dateString: string | undefined | null): string {
  if (!dateString) return '—';
  try {
    const d = parseUtcDate(dateString);
    if (!d) return String(dateString);
    return new Intl.DateTimeFormat('en-IN', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return String(dateString);
  }
}

/**
 * Returns time-appropriate greeting:
 * - 05:00 AM – 11:59 AM: Good Morning
 * - 12:00 PM – 04:59 PM: Good Afternoon
 * - 05:00 PM – 04:59 AM: Good Evening
 */
export function getTimeBasedGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return 'Good Morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good Afternoon';
  }
  return 'Good Evening';
}

