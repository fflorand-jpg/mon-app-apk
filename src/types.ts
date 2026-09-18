export type LeaveType = 'CP' | 'RTP';

export type LeaveDuration = 'FULL' | 'MORNING' | 'AFTERNOON';

export type ShiftOption = 'MATIN' | 'APRES_MIDI' | 'REPOS' | 'NORMAL';

export interface LeaveEntry {
  id: string;
  startDate: string; // ISO format 'YYYY-MM-DD'
  endDate: string;   // ISO format 'YYYY-MM-DD'
  type: LeaveType;   // 'CP' or 'RTP'
  duration: LeaveDuration; // 'FULL', 'MORNING', 'AFTERNOON'
  note?: string;
  status: 'VALIDATED' | 'PENDING';
  daysCount: number; // calculated working days count
  createdAt: string;
}

export interface YearSettings {
  year: number;
  initialCP: number;    // default e.g. 25
  initialRTP: number;   // default e.g. 12
  evenWeekShift: ShiftOption; // Shift for even ISO week numbers (2, 4, 6...)
  oddWeekShift: ShiftOption;  // Shift for odd ISO week numbers (1, 3, 5...)
  workDays: number[];   // 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat, 0=Sun. Default [1,2,3,4,5]
}

export interface PublicHoliday {
  date: string; // 'YYYY-MM-DD'
  name: string; // e.g. "Fête du Travail", "Lundi de Pâques"
  isFixed: boolean;
}

export interface DayDetails {
  date: Date;
  dateStr: string; // 'YYYY-MM-DD'
  dayOfMonth: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isWeekend: boolean;
  isWorkDay: boolean;
  weekNumber: number;
  isEvenWeek: boolean;
  shift: ShiftOption;
  holiday?: PublicHoliday;
  leaves: LeaveEntry[];
}
