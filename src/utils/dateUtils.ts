/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PublicHoliday } from '../types';

/**
 * Calculates French public holidays for a given year.
 * Includes fixed date holidays and moveable Easter-based holidays.
 */
export function getFrenchPublicHolidays(year: number): Record<string, string> {
  const holidays: Record<string, string> = {
    [`${year}-01-01`]: "Jour de l'An",
    [`${year}-05-01`]: "Fête du Travail",
    [`${year}-05-08`]: "Victoire 1945",
    [`${year}-07-14`]: "Fête Nationale",
    [`${year}-08-15`]: "Assomption",
    [`${year}-11-01`]: "Toussaint",
    [`${year}-11-11`]: "Armistice 1918",
    [`${year}-12-25`]: "Noël",
  };

  // Easter and moveable holidays calculation (Meeus/Jones/Butcher algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const easterMonth = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const easterDay = ((h + l - 7 * m + 114) % 31) + 1;

  // Let's create proper Dates in UTC to avoid timezone issues
  const easter = new Date(Date.UTC(year, easterMonth - 1, easterDay));

  // Easter Monday (+1 day)
  const easterMonday = new Date(easter.getTime() + 1 * 24 * 60 * 60 * 1000);
  // Ascension Thursday (+39 days)
  const ascension = new Date(easter.getTime() + 39 * 24 * 60 * 60 * 1000);
  // Whit Monday / Lundi de Pentecôte (+50 days)
  const pentecote = new Date(easter.getTime() + 50 * 24 * 60 * 60 * 1000);

  const formatDate = (date: Date) => date.toISOString().split('T')[0];

  holidays[formatDate(easterMonday)] = "Lundi de Pâques";
  holidays[formatDate(ascension)] = "Jeudi de l'Ascension";
  holidays[formatDate(pentecote)] = "Lundi de Pentecôte";

  return holidays;
}

/**
 * Checks if a given date string (YYYY-MM-DD) is a weekend day (Saturday or Sunday)
 */
export function isWeekend(dateStr: string): boolean {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  const d = new Date(Date.UTC(year, month - 1, day));
  const dayOfWeek = d.getUTCDay(); // 0 = Sunday, 6 = Saturday
  return dayOfWeek === 0 || dayOfWeek === 6;
}

/**
 * Checks if a given date string is a French public holiday
 */
export function isPublicHoliday(dateStr: string): boolean {
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  const year = parseInt(parts[0], 10);
  const holidays = getFrenchPublicHolidays(year);
  return dateStr in holidays;
}

/**
 * Computes list of calendar dates between startDate and endDate (inclusive)
 */
export function getDatesInRange(startStr: string, endStr: string): string[] {
  const dates: string[] = [];
  const startParts = startStr.split('-');
  const endParts = endStr.split('-');
  
  if (startParts.length !== 3 || endParts.length !== 3) return [];

  const start = new Date(Date.UTC(
    parseInt(startParts[0], 10),
    parseInt(startParts[1], 10) - 1,
    parseInt(startParts[2], 10)
  ));
  const end = new Date(Date.UTC(
    parseInt(endParts[0], 10),
    parseInt(endParts[1], 10) - 1,
    parseInt(endParts[2], 10)
  ));
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [];
  }

  const current = new Date(start);
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setUTCDate(current.getUTCDate() + 1);
  }
  return dates;
}

/**
 * Professional French working days calculator.
 * Excludes weekends and French public holidays, while correctly counting half-days.
 * 
 * Rules:
 * - Start period options:
 *   - MORNING: Absence starts in the morning (counts full first day if not weekend/holiday).
 *   - AFTERNOON: Absence starts in the afternoon (counts 0.5 for the first day).
 * - End period options:
 *   - FULL or AFTERNOON: Absence ends in the evening (counts full last day if not weekend/holiday).
 *   - MORNING: Absence ends after the morning (counts 0.5 for the last day).
 */
export function calculateWorkingDays(
  startStr: string,
  startPeriod: 'FULL' | 'MORNING' | 'AFTERNOON',
  endStr: string,
  endPeriod: 'FULL' | 'MORNING' | 'AFTERNOON'
): number {
  if (!startStr || !endStr) return 0;
  if (startStr > endStr) return 0;

  const dates = getDatesInRange(startStr, endStr);
  if (dates.length === 0) return 0;

  // Filter out non-working days
  const workingDays = dates.filter(d => !isWeekend(d) && !isPublicHoliday(d));
  if (workingDays.length === 0) return 0;

  // Default count of pure working days
  let totalDays = workingDays.length;

  const isStartWorkingDay = workingDays.includes(startStr);
  const isEndWorkingDay = workingDays.includes(endStr);

  if (startStr === endStr) {
    // Single day request
    if (isStartWorkingDay) {
      if (startPeriod === 'MORNING' && endPeriod === 'MORNING') return 0.5;
      if (startPeriod === 'AFTERNOON' && endPeriod === 'AFTERNOON') return 0.5;
      if (startPeriod === 'MORNING' && endPeriod === 'AFTERNOON') return 1.0;
      if (startPeriod === 'AFTERNOON' && endPeriod === 'MORNING') return 0.5; // fallback
      return startPeriod !== 'FULL' && endPeriod !== 'FULL' ? 0.5 : 1.0;
    }
    return 0;
  }

  // Multi-day request
  // Adjust start day if it's a working day
  if (isStartWorkingDay) {
    if (startPeriod === 'AFTERNOON') {
      totalDays -= 0.5; // Lost half day because we worked the morning
    }
  }

  // Adjust end day if it's a working day
  if (isEndWorkingDay) {
    if (endPeriod === 'MORNING') {
      totalDays -= 0.5; // Lost half day because we work the afternoon
    }
  }

  return Math.max(0, totalDays);
}

/**
 * Returns a list of public holidays within a year as objects
 */
export function getPublicHolidaysList(year: number): PublicHoliday[] {
  const holidays = getFrenchPublicHolidays(year);
  return Object.entries(holidays)
    .map(([date, name]) => ({ date, name }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
