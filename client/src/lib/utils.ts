import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines multiple className strings and merges Tailwind CSS classes
 * @param inputs - The class names to combine
 * @returns A merged className string
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a readable currency string
 * @param value - The number to format
 * @param currency - The currency code (default: 'USD')
 * @param locale - The locale (default: 'en-US')
 * @returns A formatted currency string
 */
export function formatCurrency(
  value: number, 
  currency = "USD", 
  locale = "en-US"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(value);
}

/**
 * Format a date as a readable string
 * @param date - The date to format
 * @param options - Intl.DateTimeFormatOptions (default: { dateStyle: 'medium' })
 * @param locale - The locale (default: 'en-US')
 * @returns A formatted date string
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = { dateStyle: "medium" },
  locale = "en-US"
): string {
  const dateObject = typeof date === "string" || typeof date === "number" 
    ? new Date(date) 
    : date;
  
  return new Intl.DateTimeFormat(locale, options).format(dateObject);
}

/**
 * Truncate a string to a specific length and add an ellipsis
 * @param str - The string to truncate
 * @param length - The maximum length (default: 50)
 * @returns The truncated string
 */
export function truncateString(str: string, length = 50): string {
  if (!str || str.length <= length) return str;
  return `${str.slice(0, length)}...`;
}

/**
 * Generate a random color in hex format
 * @returns A random color hex string (e.g., "#ff0000")
 */
export function getRandomColor(): string {
  return `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
}

/**
 * Debounce a function call
 * @param fn - The function to debounce
 * @param ms - The debounce time in milliseconds
 * @returns A debounced function
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Get initials from a full name
 * @param name - The full name
 * @returns The initials (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return "";
  
  return name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Safely access nested object properties without throwing errors
 * @param obj - The object to access
 * @param path - The property path (e.g., "user.address.city")
 * @param defaultValue - The default value if the path doesn't exist
 * @returns The value at the path or the default value
 */
export function getNestedValue<T = any>(
  obj: Record<string, any>,
  path: string,
  defaultValue: T | null = null
): T | null {
  try {
    const value = path.split(".").reduce((o, key) => o?.[key], obj);
    return value !== undefined ? (value as T) : defaultValue;
  } catch (error) {
    return defaultValue;
  }
}