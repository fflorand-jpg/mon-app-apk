import { PublicHoliday } from '../types';

/**
 * Calculates Easter Sunday for a given year using Meeus/Jones/Butcher algorithm
 */
function getEasterSunday(year: number): Date {
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
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3 = March, 4 = April
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month - 1, day);
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Returns a map of 'YYYY-MM-DD' -> PublicHoliday for a given year in France
 */
export function getFrenchPublicHolidays(year: number): Record<string, PublicHoliday> {
  const holidays: Record<string, PublicHoliday> = {};

  const addHoliday = (dateStr: string, name: string, isFixed: boolean) => {
    holidays[dateStr] = { date: dateStr, name, isFixed };
  };

  // Fixed holidays
  addHoliday(`${year}-01-01`, "Jour de l'An", true);
  addHoliday(`${year}-05-01`, "Fête du Travail", true);
  addHoliday(`${year}-05-08`, "Victoire 1945", true);
  addHoliday(`${year}-07-14`, "Fête Nationale", true);
  addHoliday(`${year}-08-15`, "Assomption", true);
  addHoliday(`${year}-11-01`, "Toussaint", true);
  addHoliday(`${year}-11-11`, "Armistice 1918", true);
  addHoliday(`${year}-12-25`, "Noël", true);

  // Movable holidays based on Easter
  const easterSunday = getEasterSunday(year);

  // Lundi de Pâques (Easter Monday = Easter + 1 day)
  const easterMonday = addDays(easterSunday, 1);
  addHoliday(formatDateISO(easterMonday), "Lundi de Pâques", false);

  // Jeudi de l'Ascension (Ascension Thursday = Easter + 39 days)
  const ascension = addDays(easterSunday, 39);
  addHoliday(formatDateISO(ascension), "Ascension", false);

  // Lundi de Pentecôte (Whit Monday = Easter + 50 days)
  const pentecost = addDays(easterSunday, 50);
  addHoliday(formatDateISO(pentecost), "Lundi de Pentecôte", false);

  return holidays;
}
