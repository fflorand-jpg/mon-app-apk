import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Star,
  Plus,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import {
  getISOWeekNumber,
  isEvenWeek,
  formatDateISO,
  formatMonthYearFr,
  getCalendarGridDates,
} from '../utils/dateUtils';
import { getFrenchPublicHolidays } from '../utils/holidays';
import { YearSettings, LeaveEntry, ShiftOption, PublicHoliday } from '../types';

interface CalendarViewProps {
  currentYear: number;
  currentMonth: number; // 0-11
  onChangeMonth: (monthDelta: number) => void;
  onSetMonthYear: (month: number, year: number) => void;
  settings: YearSettings;
  leaves: LeaveEntry[];
  onSelectDay: (dateStr: string) => void;
  selectedRangeStart?: string;
  selectedRangeEnd?: string;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentYear,
  currentMonth,
  onChangeMonth,
  onSetMonthYear,
  settings,
  leaves,
  onSelectDay,
  selectedRangeStart,
  selectedRangeEnd,
}) => {
  const activeDate = new Date(currentYear, currentMonth, 1);
  const calendarDates = getCalendarGridDates(currentYear, currentMonth);
  const holidaysMap = getFrenchPublicHolidays(currentYear);

  // Group dates into rows of 7 (weeks)
  const weeks: Date[][] = [];
  for (let i = 0; i < calendarDates.length; i += 7) {
    weeks.push(calendarDates.slice(i, i + 7));
  }

  const todayStr = formatDateISO(new Date());

  // Quick jump to today
  const handleJumpToToday = () => {
    const today = new Date();
    onSetMonthYear(today.getMonth(), today.getFullYear());
  };

  // Helper to determine shift for a given week number
  const getShiftForWeek = (weekNum: number): ShiftOption => {
    const even = isEvenWeek(weekNum);
    return even ? settings.evenWeekShift : settings.oddWeekShift;
  };

  // Helper to get leaves for a specific day
  const getLeavesForDay = (dateStr: string): LeaveEntry[] => {
    return leaves.filter((l) => {
      return dateStr >= l.startDate && dateStr <= l.endDate;
    });
  };

  return (
    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-200/80 overflow-hidden mt-3 transition-all">
      {/* Month Header Navigation */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onChangeMonth(-1)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Mois précédent"
            aria-label="Mois précédent"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => onChangeMonth(1)}
            className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
            title="Mois suivant"
            aria-label="Mois suivant"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <span className="text-lg font-black text-slate-800 ml-1">
            {formatMonthYearFr(activeDate)}
          </span>
        </div>

        <button
          onClick={handleJumpToToday}
          className="text-xs font-bold px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition flex items-center gap-1"
        >
          <CalendarIcon className="w-3.5 h-3.5" />
          Aujourd'hui
        </button>
      </div>

      {/* Grid Table */}
      <div className="w-full overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Days of Week Header */}
          <div className="grid grid-cols-[36px_repeat(7,1fr)] gap-1 text-center text-[11px] font-bold text-slate-500 mb-1">
            <div className="text-slate-400 font-normal">S.</div>
            <div>Lu</div>
            <div>Ma</div>
            <div>Me</div>
            <div>Je</div>
            <div>Ve</div>
            <div className="text-slate-400">Sa</div>
            <div className="text-slate-400">Di</div>
          </div>

          {/* Calendar Weeks */}
          <div className="space-y-1">
            {weeks.map((week, wIndex) => {
              // ISO week number based on Thursday of the week
              const weekNum = getISOWeekNumber(week[3] || week[0]);
              const isEven = isEvenWeek(weekNum);
              const shift = getShiftForWeek(weekNum);

              return (
                <div
                  key={'week-' + wIndex}
                  className="grid grid-cols-[36px_repeat(7,1fr)] gap-1 min-h-[52px]"
                >
                  {/* Week Column Header */}
                  <div
                    className={`border rounded-xl p-1 flex flex-col items-center justify-center text-center select-none transition-colors ${
                      shift === 'MATIN'
                        ? 'bg-amber-50/90 border-amber-200 text-amber-900'
                        : shift === 'APRES_MIDI'
                        ? 'bg-indigo-50/90 border-indigo-200 text-indigo-900'
                        : 'bg-slate-50 border-slate-200/80 text-slate-700'
                    }`}
                  >
                    <span className="text-[11px] font-black leading-tight">
                      S{weekNum}
                    </span>

                    {/* Shift Color Badge (Replacing Sun / Moon icons) */}
                    {shift === 'MATIN' && (
                      <span
                        className="text-[8px] font-black px-1 py-0.5 rounded-md bg-amber-500 text-white shadow-2xs mt-1 tracking-tight leading-none"
                        title="Semaine du Matin"
                      >
                        Matin
                      </span>
                    )}
                    {shift === 'APRES_MIDI' && (
                      <span
                        className="text-[8px] font-black px-1 py-0.5 rounded-md bg-indigo-600 text-white shadow-2xs mt-1 tracking-tight leading-none"
                        title="Semaine d'Après-midi"
                      >
                        A-Midi
                      </span>
                    )}
                    {shift === 'NORMAL' && (
                      <span
                        className="text-[8px] font-bold px-1 py-0.5 rounded-md bg-slate-200 text-slate-700 mt-1 leading-none"
                        title="Horaire Normal"
                      >
                        Jour
                      </span>
                    )}
                    {shift === 'REPOS' && (
                      <span
                        className="text-[8px] font-bold px-1 py-0.5 rounded-md bg-slate-200 text-slate-600 mt-1 leading-none"
                        title="Semaine Repos"
                      >
                        Repos
                      </span>
                    )}
                  </div>

                  {/* 7 Days */}
                  {week.map((dateObj, dIndex) => {
                    const dateStr = formatDateISO(dateObj);
                    const dayNum = dateObj.getDate();
                    const isCurrentMonth = dateObj.getMonth() === currentMonth;
                    const isToday = dateStr === todayStr;
                    const dayOfWeek = dateObj.getDay(); // 0=Sun, 6=Sat
                    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                    const holiday = holidaysMap[dateStr];
                    const dayLeaves = getLeavesForDay(dateStr);

                    const isRangeSelected =
                      selectedRangeStart &&
                      selectedRangeEnd &&
                      dateStr >= selectedRangeStart &&
                      dateStr <= selectedRangeEnd;

                    return (
                      <button
                        key={'day-' + dateStr + '-' + dIndex}
                        onClick={() => onSelectDay(dateStr)}
                        className={`relative p-1 border rounded-xl flex flex-col justify-between transition-all text-left min-h-[52px] focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          !isCurrentMonth
                            ? 'bg-slate-50/40 text-slate-300 border-slate-100'
                            : isWeekend
                            ? 'bg-slate-50 border-slate-200/60 text-slate-700'
                            : 'bg-white border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 text-slate-800'
                        } ${
                          isToday
                            ? 'ring-2 ring-emerald-500 bg-emerald-50/40 border-emerald-400'
                            : ''
                        } ${
                          isRangeSelected ? 'bg-emerald-100/60 ring-1 ring-emerald-400' : ''
                        }`}
                      >
                        {/* Day Number Header & Badges */}
                        <div className="flex items-center justify-between w-full">
                          <span
                            className={`text-xs font-black leading-none ${
                              isToday
                                ? 'w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center -ml-0.5 -mt-0.5 shadow-xs'
                                : !isCurrentMonth
                                ? 'text-slate-300'
                                : isWeekend
                                ? 'text-slate-400'
                                : 'text-slate-700'
                            }`}
                          >
                            {dayNum}
                          </span>

                          {/* Holiday star badge */}
                          {holiday && (
                            <span
                              className="text-blue-600 bg-blue-50 p-0.5 rounded-full"
                              title={holiday.name}
                            >
                              <Star className="w-2.5 h-2.5 fill-blue-500 text-blue-600" />
                            </span>
                          )}
                        </div>

                        {/* Leaves Tags */}
                        <div className="mt-auto space-y-0.5 w-full">
                          {dayLeaves.map((leave) => {
                            const isCP = leave.type === 'CP';
                            const durationText =
                              leave.duration === 'FULL'
                                ? ''
                                : leave.duration === 'MORNING'
                                ? ' Mat'
                                : ' AM';

                            return (
                              <div
                                key={leave.id}
                                className={`px-1 py-0.5 rounded-md text-[9.5px] font-black leading-tight truncate text-center border shadow-2xs ${
                                  isCP
                                    ? 'bg-emerald-600 text-white border-emerald-700'
                                    : 'bg-amber-600 text-white border-amber-700'
                                }`}
                                title={`${leave.type} (${
                                  leave.duration === 'FULL'
                                    ? '1 jour'
                                    : leave.duration === 'MORNING'
                                    ? 'Matin'
                                    : 'Après-midi'
                                }) - ${leave.note || 'Sans motif'}`}
                              >
                                {leave.type}{durationText}
                              </div>
                            );
                          })}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend Box at the bottom of calendar */}
      <div className="bg-slate-50/80 px-3.5 py-2 rounded-2xl border border-slate-200/80 mt-3 flex items-center justify-center">
        <div className="flex items-center gap-4 font-semibold text-xs text-slate-700 flex-wrap justify-center">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <strong className="font-extrabold text-slate-900">CP</strong> (Congés)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <strong className="font-extrabold text-slate-900">RTP</strong> (Récup)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
            <strong className="font-extrabold text-slate-900">Férié</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
