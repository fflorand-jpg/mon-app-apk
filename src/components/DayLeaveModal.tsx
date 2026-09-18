import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Check,
  Trash2,
  Clock,
  Info,
  Layers,
  Sparkles,
  AlertCircle,
  FileText,
} from 'lucide-react';
import {
  formatDateFullFr,
  getISOWeekNumber,
  isEvenWeek,
  calculateWorkingDaysInRange,
  formatDateISO,
} from '../utils/dateUtils';
import { getFrenchPublicHolidays } from '../utils/holidays';
import { LeaveEntry, LeaveType, LeaveDuration, YearSettings, ShiftOption } from '../types';

interface DayLeaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDateStr: string;
  yearSettings: YearSettings;
  existingLeaves: LeaveEntry[];
  onSaveLeave: (leave: Omit<LeaveEntry, 'id' | 'createdAt'>) => void;
  onDeleteLeave: (leaveId: string) => void;
}

export const DayLeaveModal: React.FC<DayLeaveModalProps> = ({
  isOpen,
  onClose,
  selectedDateStr,
  yearSettings,
  existingLeaves,
  onSaveLeave,
  onDeleteLeave,
}) => {
  // Form State
  const [leaveType, setLeaveType] = useState<LeaveType>('CP');
  const [duration, setDuration] = useState<LeaveDuration>('FULL');
  const [isRange, setIsRange] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<string>(selectedDateStr || '');
  const [endDate, setEndDate] = useState<string>(selectedDateStr || '');
  const [note, setNote] = useState<string>('');

  // Check if there is an existing leave on this specific day
  const currentLeave = existingLeaves.find(
    (l) => selectedDateStr && selectedDateStr >= l.startDate && selectedDateStr <= l.endDate
  );

  // Sync state when modal opens or selectedDateStr changes
  useEffect(() => {
    if (!isOpen || !selectedDateStr) return;
    if (currentLeave) {
      setLeaveType(currentLeave.type);
      setDuration(currentLeave.duration);
      setStartDate(currentLeave.startDate);
      setEndDate(currentLeave.endDate);
      setIsRange(currentLeave.startDate !== currentLeave.endDate);
      setNote(currentLeave.note || '');
    } else {
      setLeaveType('CP');
      setDuration('FULL');
      setStartDate(selectedDateStr);
      setEndDate(selectedDateStr);
      setIsRange(false);
      setNote('');
    }
  }, [isOpen, selectedDateStr, currentLeave]);

  if (!isOpen || !selectedDateStr) return null;

  const dateObj = new Date(selectedDateStr);
  const year = dateObj.getFullYear();
  const holidaysMap = getFrenchPublicHolidays(year);
  const holiday = holidaysMap[selectedDateStr];

  const weekNum = getISOWeekNumber(dateObj);
  const isEven = isEvenWeek(weekNum);
  const shift: ShiftOption = isEven ? yearSettings.evenWeekShift : yearSettings.oddWeekShift;

  // When toggle range OFF, set endDate = startDate
  const handleToggleRange = (enabled: boolean) => {
    setIsRange(enabled);
    if (!enabled) {
      setEndDate(startDate);
    }
  };

  // Calculate working days to deduct
  const workingDaysCount = calculateWorkingDaysInRange(
    startDate,
    isRange ? endDate : startDate,
    duration,
    holidaysMap,
    yearSettings.workDays
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (workingDaysCount <= 0) return;

    onSaveLeave({
      startDate,
      endDate: isRange ? endDate : startDate,
      type: leaveType,
      duration,
      note: note.trim(),
      status: 'VALIDATED',
      daysCount: workingDaysCount,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 transition-opacity">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in slide-in-from-bottom-4 duration-200">
        {/* Top Handle for bottom-sheet feel */}
        <div className="pt-3 pb-1 bg-slate-900 text-center select-none">
          <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto"></div>
        </div>

        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-5 pb-4 pt-1 flex items-center justify-between border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <Calendar className="w-3.5 h-3.5" />
              <span>Semaine {weekNum} ({isEven ? 'Paire' : 'Impaire'})</span>
              <span className="text-slate-600">•</span>
              <span className="text-amber-400">Shift : {shift}</span>
            </div>
            <h2 className="text-lg font-black text-white capitalize mt-0.5">
              {formatDateFullFr(dateObj)}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Holiday Banner if present */}
        {holiday && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 py-2 flex items-center gap-2 text-xs text-blue-900 font-semibold">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Jour férié : <strong>{holiday.name}</strong></span>
          </div>
        )}

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
          {/* Leave Type Selector (CP vs RTP) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Motif de congé
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setLeaveType('CP')}
                className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition ${
                  leaveType === 'CP'
                    ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${leaveType === 'CP' ? 'bg-white' : 'bg-emerald-500'}`}></span>
                Congés Payés (CP)
              </button>

              <button
                type="button"
                onClick={() => setLeaveType('RTP')}
                className={`p-3 rounded-xl border font-bold text-sm flex items-center justify-center gap-2 transition ${
                  leaveType === 'RTP'
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className={`w-3 h-3 rounded-full ${leaveType === 'RTP' ? 'bg-white' : 'bg-amber-500'}`}></span>
                RTP / RTT
              </button>
            </div>
          </div>

          {/* Duration Selector (Journée complète, Matin, Après-midi) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
              Durée de la journée
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDuration('FULL')}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  duration === 'FULL'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Journée entière (1j)
              </button>

              <button
                type="button"
                onClick={() => setDuration('MORNING')}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  duration === 'MORNING'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Matin (0.5j)
              </button>

              <button
                type="button"
                onClick={() => setDuration('AFTERNOON')}
                className={`py-2 px-1 text-xs font-bold rounded-lg border transition ${
                  duration === 'AFTERNOON'
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Après-midi (0.5j)
              </button>
            </div>
          </div>

          {/* Range Option Toggle */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">Poser sur une période (plusieurs jours)</span>
              <button
                type="button"
                onClick={() => handleToggleRange(!isRange)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isRange ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isRange ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {isRange && (
              <div className="grid grid-cols-2 gap-3 mt-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (e.target.value > endDate) setEndDate(e.target.value);
                    }}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full text-xs font-bold bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Note / Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
              Remarque / Motif optionnel
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Ex: Vacances d'été, RDV Médical, Pont..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-2.5 pl-8 focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
              <FileText className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          {/* Summary Box */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs text-emerald-950 font-medium">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-600" />
              <span>Jours à décompter :</span>
            </div>
            <strong className="text-sm text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300 font-extrabold">
              {workingDaysCount} {workingDaysCount > 1 ? 'jours' : 'jour'} ({leaveType})
            </strong>
          </div>

          {/* Actions Footer */}
          <div className="pt-2 flex items-center justify-between gap-3">
            {currentLeave ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteLeave(currentLeave.id);
                  onClose();
                }}
                className="px-3 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 flex items-center gap-1.5 transition"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={workingDaysCount <= 0}
                className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-md transition flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Enregistrer
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
