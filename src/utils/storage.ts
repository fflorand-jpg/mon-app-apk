import { LeaveEntry, YearSettings } from '../types';

const STORAGE_KEYS = {
  LEAVES: 'conges_app_leaves_v1',
  YEAR_SETTINGS: 'conges_app_year_settings_v1',
};

export const DEFAULT_YEAR_SETTINGS: YearSettings = {
  year: new Date().getFullYear(),
  initialCP: 25,
  initialRTP: 12,
  evenWeekShift: 'MATIN',
  oddWeekShift: 'APRES_MIDI',
  workDays: [1, 2, 3, 4, 5],
};

export function loadLeaves(): LeaveEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LEAVES);
    if (!raw) return getSampleLeaves();
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load leaves from localStorage', e);
    return getSampleLeaves();
  }
}

export function saveLeaves(leaves: LeaveEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.LEAVES, JSON.stringify(leaves));
  } catch (e) {
    console.error('Failed to save leaves to localStorage', e);
  }
}

export function loadYearSettings(year: number): YearSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.YEAR_SETTINGS);
    if (raw) {
      const allSettings: Record<number, YearSettings> = JSON.parse(raw);
      if (allSettings[year]) {
        return allSettings[year];
      }
    }
  } catch (e) {
    console.error('Failed to load year settings', e);
  }
  return { ...DEFAULT_YEAR_SETTINGS, year };
}

export function saveYearSettings(settings: YearSettings): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.YEAR_SETTINGS);
    const allSettings: Record<number, YearSettings> = raw ? JSON.parse(raw) : {};
    allSettings[settings.year] = settings;
    localStorage.setItem(STORAGE_KEYS.YEAR_SETTINGS, JSON.stringify(allSettings));
  } catch (e) {
    console.error('Failed to save year settings', e);
  }
}

function getSampleLeaves(): LeaveEntry[] {
  const year = new Date().getFullYear();
  return [
    {
      id: 'sample-1',
      startDate: `${year}-05-02`,
      endDate: `${year}-05-02`,
      type: 'RTP',
      duration: 'FULL',
      note: 'Pont Fête du Travail',
      status: 'VALIDATED',
      daysCount: 1,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-2',
      startDate: `${year}-08-10`,
      endDate: `${year}-08-21`,
      type: 'CP',
      duration: 'FULL',
      note: 'Congés d\'été',
      status: 'VALIDATED',
      daysCount: 10,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'sample-3',
      startDate: `${year}-11-02`,
      endDate: `${year}-11-02`,
      type: 'RTP',
      duration: 'FULL',
      note: 'Pont de la Toussaint',
      status: 'VALIDATED',
      daysCount: 1,
      createdAt: new Date().toISOString(),
    },
  ];
}
