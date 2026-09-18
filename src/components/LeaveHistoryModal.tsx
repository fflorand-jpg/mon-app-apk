import React from 'react';
import { X, History, Trash2, Calendar } from 'lucide-react';
import { LeaveEntry } from '../types';
import { parseDateISO, getISOWeekNumber, calculateWorkingDaysInRange, formatDateISO, formatDateShortFr } from '../utils/dateUtils';
import { getFrenchPublicHolidays } from '../utils/holidays';

interface LeaveHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  leaves: LeaveEntry[];
  onDeleteLeave?: (id: string) => void;
}

export const LeaveHistoryModal: React.FC<LeaveHistoryModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  leaves,
  onDeleteLeave,
}) => {
  if (!isOpen) return null;

  const holidaysMap = getFrenchPublicHolidays(currentYear);
  const todayStr = formatDateISO(new Date());

  // Filter leaves for the active year and sort chronologically
  const yearLeaves = leaves
    .filter((l) => {
      if (!l.startDate) return false;
      const y = new Date(l.startDate).getFullYear();
      return y === currentYear;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));

  const totalCP = yearLeaves
    .filter((l) => l.type === 'CP')
    .reduce((sum, l) => sum + (l.daysCount || 0), 0);

  const totalRTP = yearLeaves
    .filter((l) => l.type === 'RTP')
    .reduce((sum, l) => sum + (l.daysCount || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 transition-opacity">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header with History logo (temps à l'envers) */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-100">
                Historique des Congés ({currentYear})
              </h2>
              <p className="text-[11px] text-slate-400">
                {yearLeaves.length} saisie{yearLeaves.length > 1 ? 's' : ''} • {totalCP} j. CP • {totalRTP} j. RTP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
            aria-label="Fermer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2">
          {yearLeaves.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
              <p className="text-sm font-semibold">Aucun congé posé en {currentYear}</p>
              <p className="text-xs text-slate-400 mt-1">
                Cliquez sur un jour du calendrier pour ajouter une pose.
              </p>
            </div>
          ) : (
            yearLeaves.map((leave) => {
              const startD = parseDateISO(leave.startDate);
              const endD = parseDateISO(leave.endDate);
              const startWeek = getISOWeekNumber(startD);
              const endWeek = getISOWeekNumber(endD);

              const weekStr =
                startWeek === endWeek ? `S${startWeek}` : `S${startWeek} - S${endWeek}`;

              const isCP = leave.type === 'CP';
              const isPast = leave.endDate < todayStr;

              // Calculate or format days count
              let daysVal = leave.daysCount;
              if (!daysVal || daysVal <= 0) {
                daysVal = calculateWorkingDaysInRange(
                  leave.startDate,
                  leave.endDate,
                  leave.duration,
                  holidaysMap
                );
              }
              const daysText = `${daysVal} j`;

              return (
                <div
                  key={leave.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-2xl border transition ${
                    isPast
                      ? 'bg-slate-100/50 border-slate-200/60 opacity-60 text-slate-400'
                      : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200/80 text-slate-800'
                  }`}
                  title={isPast ? 'Congé passé' : 'Congé à venir / en cours'}
                >
                  {/* Left: Semaine + Dates */}
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`text-xs px-2 py-1 rounded-lg min-w-[46px] text-center font-black ${
                        isPast
                          ? 'bg-slate-200/60 text-slate-500'
                          : 'bg-slate-200 text-slate-800'
                      }`}
                    >
                      {weekStr}
                    </span>

                    <div>
                      <div className="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>
                          {formatDateShortFr(startD)}
                          {leave.startDate !== leave.endDate && ` au ${formatDateShortFr(endD)}`}
                        </span>
                      </div>
                      {leave.note && (
                        <p className="text-[10px] text-slate-400 italic truncate max-w-[140px]">
                          {leave.note}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Days + Type + Optional Delete */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs ${
                        isPast ? 'font-semibold text-slate-500' : 'font-extrabold text-slate-800'
                      }`}
                    >
                      {daysText}
                    </span>

                    <span
                      className={`text-[11px] font-black px-2.5 py-0.5 rounded-md ${
                        isPast
                          ? 'bg-slate-300 text-slate-600'
                          : isCP
                          ? 'bg-emerald-600 text-white'
                          : 'bg-amber-600 text-white'
                      }`}
                    >
                      {leave.type}
                    </span>

                    {onDeleteLeave && (
                      <button
                        onClick={() => onDeleteLeave(leave.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Supprimer ce congé"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
