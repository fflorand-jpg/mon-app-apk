/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LeaveRequest, LeaveType } from '../types';
import { getFrenchPublicHolidays, isWeekend } from '../utils/dateUtils';
import { ChevronLeft, ChevronRight, Calendar, Users, Info } from 'lucide-react';
import { TEAM_MEMBERS, ManagerRequestSimulation } from '../data';

// Standard ISO 8601 week number calculator
function getISOWeekNumber(dateStr: string): number {
  const date = new Date(dateStr + 'T00:00:00Z');
  const tempDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = (tempDate.getUTCDay() + 6) % 7; // Monday = 0, Sunday = 6
  tempDate.setUTCDate(tempDate.getUTCDate() - day + 3); // Set to nearest Thursday
  const firstThursday = tempDate.getTime();
  tempDate.setUTCMonth(0, 1);
  if (tempDate.getUTCDay() !== 4) {
    tempDate.setUTCMonth(0, 1 + ((4 - tempDate.getUTCDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - tempDate.getTime()) / 604800000);
}

interface CalendarViewProps {
  userRequests: LeaveRequest[];
  teamRequests: ManagerRequestSimulation[];
}

const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const DAYS_FR_SHORT = ['Lu', 'Ma', 'Me', 'Je', 'Ve', 'Sa', 'Di'];

export default function CalendarView({ userRequests, teamRequests }: CalendarViewProps) {
  const currentLocalTime = new Date('2026-06-05T17:01:06Z'); // Year 2026 based on workspace
  const [currentYear, setCurrentYear] = useState<number>(currentLocalTime.getUTCFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(currentLocalTime.getUTCMonth());
  const [showTeamPlanning, setShowTeamPlanning] = useState<boolean>(true);

  const holidays = getFrenchPublicHolidays(currentYear);

  // Navigate months
  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const yearSelectRange = Array.from({ length: 5 }, (_, i) => 2024 + i);

  // Generate calendar days
  const tempDate = new Date(Date.UTC(currentYear, currentMonth, 1));
  const rawFirstDayOfWeek = tempDate.getUTCDay(); // 0 = Sunday, 1 = Monday, etc.
  // We want Monday (1) to be col 0, Sunday (0) to be col 6
  const firstDayIndex = (rawFirstDayOfWeek + 6) % 7;
  const daysInCurrentMonth = new Date(Date.UTC(currentYear, currentMonth + 1, 0)).getUTCDate();

  const calendarCells: { dateStr: string; isCurrentMonth: boolean; dayNumber: number }[] = [];

  // Previous month trailing days
  const prevMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const prevMonthIndex = currentMonth === 0 ? 11 : currentMonth - 1;
  const daysInPrevMonth = new Date(Date.UTC(prevMonthYear, prevMonthIndex + 1, 0)).getUTCDate();

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const dateStr = `${prevMonthYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, isCurrentMonth: false, dayNumber: d });
  }

  // Active month days
  for (let d = 1; d <= daysInCurrentMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, isCurrentMonth: true, dayNumber: d });
  }

  // Next month leading days
  const nextMonthYear = currentMonth === 11 ? currentYear + 1 : currentYear;
  const nextMonthIndex = currentMonth === 11 ? 0 : currentMonth + 1;
  const totalCellsWritten = calendarCells.length;
  const remainingCells = 42 - totalCellsWritten; // fit exactly a 6-row layout

  for (let d = 1; d <= remainingCells; d++) {
    const dateStr = `${nextMonthYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ dateStr, isCurrentMonth: false, dayNumber: d });
  }

  // Group 42 cell list into 6 weeks of 7 days
  const calendarWeeks: { weekNumber: number; cells: typeof calendarCells }[] = [];
  for (let i = 0; i < calendarCells.length; i += 7) {
    const weekCells = calendarCells.slice(i, i + 7);
    const referenceDate = weekCells[0].dateStr;
    const weekNumber = getISOWeekNumber(referenceDate);
    calendarWeeks.push({ weekNumber, cells: weekCells });
  }

  // Helper styling by LeaveType
  const getLeaveColorStyles = (t: LeaveType, status: string) => {
    const op = status === 'PENDING' ? 'opacity-70 border-dashed animate-pulse' : '';
    switch (t) {
      case LeaveType.CP:
        return `bg-emerald-500 text-white ${op}`;
      case LeaveType.RTT:
        return `bg-indigo-500 text-white ${op}`;
      case LeaveType.MALADIE:
        return `bg-rose-500 text-white ${op}`;
      case LeaveType.EXCEPTIONNEL:
        return `bg-amber-500 text-white ${op}`;
      case LeaveType.SANS_SOLDE:
        return `bg-slate-500 text-white ${op}`;
    }
  };

  const getLeaveLabelShort = (t: LeaveType) => {
    switch (t) {
      case LeaveType.CP: return 'CP';
      case LeaveType.RTT: return 'RTT';
      case LeaveType.MALADIE: return 'Mal';
      case LeaveType.EXCEPTIONNEL: return 'Exc';
      case LeaveType.SANS_SOLDE: return 'CSS';
    }
  };

  return (
    <div className="bg-white p-7 rounded-[32px] border-2 border-[#E5E3DF] shadow-sm space-y-5 font-sans" id="calendar-view-container">
      {/* Calendar Header with Navigation */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-[#E5E3DF] pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-[#2D336B]" />
          <h2 className="text-xl font-black text-[#1A1A1A] uppercase tracking-tight font-display">
            {MONTHS_FR[currentMonth]}
          </h2>
          <select
            value={currentYear}
            onChange={(e) => setCurrentYear(Number(e.target.value))}
            className="text-xs font-black uppercase text-[#2D336B] bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl p-1.5 px-3 focus:outline-none focus:border-[#2D336B]"
            id="year-select-dropdown"
          >
            {yearSelectRange.map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTeamPlanning(!showTeamPlanning)}
            className={`flex items-center gap-1.5 py-2 px-3.5 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
              showTeamPlanning
                ? 'bg-[#2D336B] border-[#2D336B] text-white shadow-xs'
                : 'bg-[#F8F7F4] border-[#E5E3DF] hover:bg-slate-100 text-[#1A1A1A]'
            }`}
            id="toggle-team-planning-btn"
          >
            <Users className="w-3.5 h-3.5" />
            Planning équipe
          </button>
          
          <div className="flex items-center border border-[#E5E3DF] rounded-xl bg-[#F8F7F4] p-0.5 overflow-hidden">
            <button
              onClick={prevMonth}
              id="prev-month-btn"
              className="p-1.5 hover:bg-white rounded-lg text-[#1A1A1A] transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextMonth}
              id="next-month-btn"
              className="p-1.5 hover:bg-white rounded-lg text-[#1A1A1A] transition"
            >
              <ChevronRight className="w-4 h-4 text-left" />
            </button>
          </div>
        </div>
      </div>

      {/* Weekdays names */}
      <div className="grid grid-cols-[38px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] text-center text-[10px] font-black uppercase tracking-widest text-[#2D336B]/60 mt-2 gap-1.5">
        <div className="py-1 text-center font-extrabold text-[#2D336B]/70 select-none pb-0">
          S.
        </div>
        {DAYS_FR_SHORT.map((day, i) => (
          <div key={day} className={`py-1 ${i >= 5 ? 'text-[#2D336B]' : ''}`}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days Matrix */}
      <div className="grid grid-cols-[38px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] sm:grid-cols-[48px_1fr_1fr_1fr_1fr_1fr_1fr_1fr] gap-1.5" id="calendar-day-grid">
        {calendarWeeks.map((week, wIdx) => {
          const { weekNumber, cells } = week;
          const isEven = weekNumber % 2 === 0;

          return (
            <React.Fragment key={wIdx}>
              {/* Column 1: Week number and shift pattern */}
              <div 
                className={`h-[84px] sm:h-[94px] overflow-hidden p-0.5 sm:p-1 flex flex-col justify-center items-center border-2 border-dashed rounded-2xl text-center select-none ${
                  isEven
                    ? 'bg-[#E1FF72]/10 border-[#E1FF72]/45'
                    : 'bg-[#2D336B]/5 border-[#2D336B]/15'
                }`}
                title={`Semaine ${weekNumber} (${isEven ? 'Paire' : 'Impaire'})`}
              >
                <span className="text-[9px] sm:text-[9.5px] font-black uppercase text-slate-400">
                  S{weekNumber}
                </span>
                <span className={`text-[7.5px] sm:text-[8.5px] font-black uppercase px-0.5 py-0.5 sm:px-1 sm:py-0.5 rounded mt-1 border text-center leading-none ${
                  isEven 
                    ? 'bg-[#E1FF72] text-[#2D336B] border-[#2D336B]/15' 
                    : 'bg-[#2D336B] text-[#E1FF72] border-transparent'
                }`}>
                  {isEven ? 'Mat.' : 'A-M'}
                </span>
                <span className="text-[6px] text-gray-400 mt-1 uppercase font-extrabold tracking-tight hidden sm:inline">
                  {isEven ? 'Paire' : 'Imp.'}
                </span>
              </div>

              {/* Columns 2-8: The 7 days of the week */}
              {cells.map((cell, idx) => {
                const { dateStr, isCurrentMonth, dayNumber } = cell;
                const isWeekendDay = isWeekend(dateStr);
                const isHolidayKey = dateStr in holidays;
                const holidayName = isHolidayKey ? holidays[dateStr] : '';

                // Look for User Active Absence
                const userAbsence = userRequests.find(req => 
                  req.status !== 'REJECTED' && 
                  dateStr >= req.startDate && 
                  dateStr <= req.endDate
                );

                // Look for Team Member Active Absences
                const teamAbsences = showTeamPlanning ? teamRequests.filter(req => 
                  req.status === 'APPROVED' && 
                  dateStr >= req.startDate && 
                  dateStr <= req.endDate
                ) : [];

                // Styling
                let cellStyle = 'bg-white text-[#1A1A1A] border-[#E5E3DF]';
                if (!isCurrentMonth) {
                  cellStyle = 'bg-[#F8F7F4]/50 text-gray-300 border-[#E5E3DF]';
                } else if (isHolidayKey) {
                  cellStyle = 'bg-rose-50/45 text-[#1A1A1A] border-rose-200';
                } else if (isWeekendDay) {
                  cellStyle = 'bg-[#F8F7F4] text-gray-400 font-bold border-[#E5E3DF]';
                }

                // Custom leave designs
                const getLeaveColorStylesBold = (t: LeaveType, status: string) => {
                  const op = status === 'PENDING' ? 'opacity-70 border-dashed animate-pulse' : '';
                  switch (t) {
                    case LeaveType.CP:
                      return `bg-[#2D336B] text-white ${op}`;
                    case LeaveType.RTT:
                      return `bg-[#E1FF72] text-[#2D336B] border border-[#2D336B]/20 ${op}`;
                    case LeaveType.MALADIE:
                      return `bg-rose-500 text-white ${op}`;
                    case LeaveType.EXCEPTIONNEL:
                      return `bg-amber-500 text-white ${op}`;
                    case LeaveType.SANS_SOLDE:
                      return `bg-slate-600 text-white ${op}`;
                  }
                };

                return (
                  <div
                    key={`${dateStr}-${idx}`}
                    className={`h-[84px] sm:h-[94px] overflow-hidden p-2 flex flex-col justify-between border-2 rounded-2xl transition relative group hover:scale-[1.01] ${cellStyle}`}
                    id={`cell-${dateStr}`}
                  >
                    {/* Day Header */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[11px] font-extrabold ${isWeekendDay && isCurrentMonth ? 'text-[#2D336B]' : ''}`}>
                        {dayNumber}
                      </span>

                      {/* French public holiday custom icon */}
                      {isHolidayKey && isCurrentMonth && (
                        <span
                          className="w-2 h-2 rounded-full bg-rose-500 block"
                          title={holidayName}
                        />
                      )}
                    </div>

                    {/* Day Content Area */}
                    <div className="flex flex-wrap gap-1.5 mt-auto items-center justify-start pb-1">
                      {/* 1. Main User Leave representation as a beautiful color dot */}
                      {userAbsence && isCurrentMonth && (
                        <div
                          className={`w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0 shadow-xs border border-white ${
                            userAbsence.type === LeaveType.CP
                              ? 'bg-[#2D336B]'
                              : userAbsence.type === LeaveType.RTT
                              ? 'bg-[#E1FF72] border border-[#2D336B]/20'
                              : userAbsence.type === LeaveType.MALADIE
                              ? 'bg-rose-500'
                              : userAbsence.type === LeaveType.EXCEPTIONNEL
                              ? 'bg-amber-500'
                              : 'bg-slate-600'
                          } ${userAbsence.status === 'PENDING' ? 'animate-pulse ring-2 ring-offset-1 ring-[#2D336B]/30' : ''}`}
                          title={`Mon congé : ${getLeaveLabelShort(userAbsence.type)} (${userAbsence.status === 'PENDING' ? 'A venir' : 'Validé'}) - ${userAbsence.comment || ''}`}
                        />
                      )}

                      {/* 2. Team planning indicators as smaller color dots */}
                      {teamAbsences.length > 0 && isCurrentMonth && (
                        <div className="flex flex-wrap gap-1">
                          {teamAbsences.map((teamAbs) => (
                            <div
                              key={teamAbs.id}
                              className={`w-2.5 h-2.5 rounded-full shrink-0 shadow-xs border border-white ${
                                teamAbs.type === LeaveType.CP
                                  ? 'bg-[#2D336B]/60'
                                  : teamAbs.type === LeaveType.RTT
                                  ? 'bg-[#E1FF72] border border-[#2D336B]/15'
                                  : teamAbs.type === LeaveType.MALADIE
                                  ? 'bg-rose-500/60'
                                  : teamAbs.type === LeaveType.EXCEPTIONNEL
                                  ? 'bg-amber-500/60'
                                  : 'bg-slate-500/60'
                              }`}
                              title={`Équipe : ${teamAbs.applicant.name} en ${getLeaveLabelShort(teamAbs.type)} - "${teamAbs.comment}"`}
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Holiday popup on hover */}
                    {isHolidayKey && isCurrentMonth && (
                      <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 bg-[#1A1A1A] text-white text-[9px] font-bold py-1 px-2.5 rounded-lg pointer-events-none transform translate-y-1 block z-10 duration-200 ease-out shadow-lg whitespace-nowrap uppercase tracking-wider">
                        🎉 {holidayName}
                      </div>
                    )}
                  </div>
                );
              })}
            </React.Fragment>
          );
        })}
      </div>

      {/* Legend & Help indicators */}
      <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider pt-4 border-t border-[#E5E3DF] text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D336B]" />
          <span>Congés Payés (CP)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E1FF72] border border-[#2D336B]/20" />
          <span>RTT</span>
        </div>
      </div>

      {/* Weekend Legend / Holidays notice */}
      <div className="p-4 bg-[#F8F7F4] rounded-[24px] text-[11px] text-gray-500 border border-[#E5E3DF] flex items-start gap-2.5 leading-relaxed mt-2">
        <Info className="w-4 h-4 text-[#2D336B] shrink-0 mt-0.5" />
        <p>
          <span className="font-bold text-[#2D336B] flex items-center gap-1.5 flex-wrap">
            <span>🔄</span> <span>Alternance du rythme de travail : Semaines paires = travail le Matin. Semaines impaires = Après-midi (A-M).</span>
          </span>
        </p>
      </div>
    </div>
  );
}
