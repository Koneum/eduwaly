import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as formatDateFn, parseISO } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date or ISO string to French date format dd/MM/yyyy
 */
export function formatDateToFr(date?: Date | string | null) {
  if (!date) return ''
  try {
    const d = typeof date === 'string' ? parseISO(date) : date
    return formatDateFn(d, 'dd/MM/yyyy')
  } catch {
    return ''
  }
}

/**
 * Format an hour range. Accepts strings like '08:00' or Date objects.
 */
export function formatHourRange(start?: string | Date | null, end?: string | Date | null) {
  if (!start && !end) return ''
  const fmt = (v?: string | Date | null) => {
    if (!v) return ''
    if (v instanceof Date) return formatDateFn(v, 'HH:mm')
    // assume HH:mm
    return String(v)
  }
  const s = fmt(start)
  const e = fmt(end)
  if (s && e) return `${s} - ${e}`
  return s || e
}
