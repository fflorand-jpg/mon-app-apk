import { PublicHoliday } from '../types';

/**
 * Returns the ISO 8601 week number for a given Date.
 * Weeks start on Monday. Week 1 is the week with the first Thursday of the year.
 */
export function getISOWeekNumber(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7; // Monday = 0, Sunday = 6
  target.setDate(target.getDate() - dayNr + 3); // Thursday in target week
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
}

/**
 * Checks if a week number is even (Paire) or odd (Impaire)
 */
export function isEvenWeek(weekNumber: number): boolean {
  return weekNumber % 2 === 0;
}

/**
 * Formats a date to YYYY-MM-DD
 */
export function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parses YYYY-MM-DD to Date object at local midnight
 */
export function parseDateISO(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Returns long French month name with year e.g. "Août 2026"
 */
export function formatMonthYearFr(date: Date): string {
  const str = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Returns formatted French date e.g. "Mardi 12 Août 2026"
 */
export function formatDateFullFr(date: Date): string {
  const str = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Returns short French date e.g. "Lun. 12 Aoû."
 */
export function formatDateShortFr(date: Date): string {
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Generates dates for a month calendar view.
 * Starts on Monday and pads full weeks.
 */
export function getCalendarGridDates(year: number, monthIndex: number): Date[] {
  const firstOfMonth = new Date(year, monthIndex, 1);
  const lastOfMonth = new Date(year, monthIndex + 1, 0);

  // Day of week for 1st of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  // Convert so Monday = 0, Sunday = 6
  const startDay = (firstOfMonth.getDay() + 6) % 7;

  const dates: Date[] = [];

  // Previous month padding
  for (let i = startDay; i > 0; i--) {
    const prevDate = new Date(year, monthIndex, 1 - i);
    dates.push(prevDate);
  }

  // Current month days
  for (let i = 1; i <= lastOfMonth.getDate(); i++) {
    dates.push(new Date(year, monthIndex, i));
  }

  // Next month padding to fill out 7-column grid (up to 35 or 42 days)
  const remaining = (7 - (dates.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    dates.push(new Date(year, monthIndex + 1, i));
  }

  return dates;
}

/**
 * Calculates number of effective working days between two ISO date strings (inclusive),
 * excluding weekends and optionally public holidays.
 */
export function calculateWorkingDaysInRange(
  startDateStr: string,
  endDateStr: string,
  duration: 'FULL' | 'MORNING' | 'AFTERNOON',
  holidaysMap: Record<string, PublicHoliday>,
  workDays: number[] = [1, 2, 3, 4, 5]
): number {
  if (startDateStr > endDateStr) return 0;

  const start = parseDateISO(startDateStr);
  const end = parseDateISO(endDateStr);

  let totalDays = 0;
  const curr = new Date(start);

  while (curr <= end) {
    const currStr = formatDateISO(curr);
    const dayOfWeek = curr.getDay(); // 0=Sun, 1=Mon...

    const isWorkDay = workDays.includes(dayOfWeek);
    const isHoliday = Boolean(holidaysMap[currStr]);

    if (isWorkDay && !isHoliday) {
      if (duration === 'FULL') {
        totalDays += 1;
      } else {
        totalDays += 0.5;
      }
    }

    curr.setDate(curr.getDate() + 1);
  }

  return totalDays;
}
