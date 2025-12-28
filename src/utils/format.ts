/**
 * Formatting Utilities
 *
 * Reusable helper functions for formatting dates, currency, and other values.
 */

// =============================================================================
// Currency Formatting
// =============================================================================

/**
 * Format a number as currency
 *
 * @param amount - The amount to format
 * @param currency - Currency code (default: 'USD')
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(1234.56) // "$1,234.56"
 * formatCurrency(1234.56, 'EUR', 'de-DE') // "1.234,56 €"
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a number as compact currency (for large amounts)
 *
 * @example
 * formatCompactCurrency(1234567) // "$1.2M"
 */
export function formatCompactCurrency(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(amount);
}

// =============================================================================
// Date Formatting
// =============================================================================

/**
 * Format a date string or Date object
 *
 * @param date - Date to format (string or Date)
 * @param options - Intl.DateTimeFormat options
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 *
 * @example
 * formatDate('2024-01-15') // "Jan 15, 2024"
 * formatDate('2024-01-15', { dateStyle: 'full' }) // "Monday, January 15, 2024"
 */
export function formatDate(
  date: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  },
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  // Handle invalid dates
  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  return new Intl.DateTimeFormat(locale, options).format(dateObj);
}

/**
 * Format a date with time
 *
 * @example
 * formatDateTime('2024-01-15T10:30:00Z') // "Jan 15, 2024, 10:30 AM"
 */
export function formatDateTime(
  date: string | Date,
  locale: string = 'en-US'
): string {
  return formatDate(
    date,
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    },
    locale
  );
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 *
 * @example
 * formatRelativeTime(new Date(Date.now() - 3600000)) // "1 hour ago"
 */
export function formatRelativeTime(
  date: string | Date,
  locale: string = 'en-US'
): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;

  if (isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });

  // Define time units
  const units: { unit: Intl.RelativeTimeFormatUnit; seconds: number }[] = [
    { unit: 'year', seconds: 31536000 },
    { unit: 'month', seconds: 2592000 },
    { unit: 'week', seconds: 604800 },
    { unit: 'day', seconds: 86400 },
    { unit: 'hour', seconds: 3600 },
    { unit: 'minute', seconds: 60 },
    { unit: 'second', seconds: 1 },
  ];

  for (const { unit, seconds } of units) {
    const value = Math.floor(Math.abs(diffInSeconds) / seconds);
    if (value >= 1) {
      return rtf.format(diffInSeconds > 0 ? -value : value, unit);
    }
  }

  return rtf.format(0, 'second');
}

// =============================================================================
// Number Formatting
// =============================================================================

/**
 * Format a number as percentage
 *
 * @param value - The value to format (0-100 or 0-1)
 * @param options - Additional options
 * @returns Formatted percentage string
 *
 * @example
 * formatPercentage(85.5) // "85.5%"
 * formatPercentage(0.855, { isDecimal: true }) // "85.5%"
 */
export function formatPercentage(
  value: number,
  options: {
    /** If true, value is treated as decimal (0-1) */
    isDecimal?: boolean;
    /** Minimum fraction digits */
    minimumFractionDigits?: number;
    /** Maximum fraction digits */
    maximumFractionDigits?: number;
    locale?: string;
  } = {}
): string {
  const {
    isDecimal = false,
    minimumFractionDigits = 0,
    maximumFractionDigits = 1,
    locale = 'en-US',
  } = options;

  const normalizedValue = isDecimal ? value : value / 100;

  return new Intl.NumberFormat(locale, {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(normalizedValue);
}

/**
 * Format a number with thousands separators
 *
 * @example
 * formatNumber(1234567) // "1,234,567"
 */
export function formatNumber(
  value: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a number in compact notation
 *
 * @example
 * formatCompactNumber(1234567) // "1.2M"
 */
export function formatCompactNumber(
  value: number,
  locale: string = 'en-US'
): string {
  return new Intl.NumberFormat(locale, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

// =============================================================================
// String Formatting
// =============================================================================

/**
 * Truncate a string to a maximum length
 *
 * @example
 * truncate('Hello World', 8) // "Hello..."
 */
export function truncate(
  str: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.slice(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize the first letter of a string
 *
 * @example
 * capitalize('hello world') // "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert a string to title case
 *
 * @example
 * titleCase('hello world') // "Hello World"
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

