import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely, resolving conflicts.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a Date object or ISO string to a readable locale date.
 * e.g. "June 5, 2025"
 */
export function formatDate(date: Date | string | number): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date));
}

/**
 * Format a date as a relative time string.
 * e.g. "3 minutes ago", "2 days ago"
 */
export function formatRelativeTime(date: Date | string | number): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffMs = now - then;

  const seconds = Math.floor(diffMs / 1_000);
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);
  const weeks = Math.floor(diffMs / 604_800_000);
  const months = Math.floor(diffMs / 2_592_000_000);
  const years = Math.floor(diffMs / 31_536_000_000);

  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (seconds < 60) return rtf.format(-seconds, 'second');
  if (minutes < 60) return rtf.format(-minutes, 'minute');
  if (hours < 24)   return rtf.format(-hours, 'hour');
  if (days < 7)     return rtf.format(-days, 'day');
  if (weeks < 4)    return rtf.format(-weeks, 'week');
  if (months < 12)  return rtf.format(-months, 'month');
  return rtf.format(-years, 'year');
}

/**
 * Generate a unique ticket number in the format: RPT-YYYY-NNNNN
 * Uses current year + a 5-digit zero-padded random sequence.
 */
export function generateTicketNumber(): string {
  const year = new Date().getFullYear();
  const sequence = Math.floor(Math.random() * 99_999) + 1;
  const padded = String(sequence).padStart(5, '0');
  return `RPT-${year}-${padded}`;
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncate a string to a max length and append an ellipsis.
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength).trimEnd() + '…';
}
