import React from 'react';
import { Settings, History, Palmtree, Clock, ChevronDown, Smartphone, Monitor } from 'lucide-react';
import { YearSettings, LeaveEntry } from '../types';

interface HeaderSummaryProps {
  currentYear: number;
  onYearChange: (year: number) => void;
  settings: YearSettings;
  leaves: LeaveEntry[];
  onOpenSettings: () => void;
  onOpenLeaveList: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
}

export const HeaderSummary: React.FC<HeaderSummaryProps> = ({
  currentYear,
  onYearChange,
  settings,
  leaves,
  onOpenSettings,
  onOpenLeaveList,
  isMobileFrame,
  onToggleMobileFrame,
}) => {
  // Filter validated leaves for current year
  const yearLeaves = leaves.filter((l) => {
    const lYear = new Date(l.startDate).getFullYear();
    return lYear === currentYear;
  });

  const cpTaken = yearLeaves
    .filter((l) => l.type === 'CP')
    .reduce((sum, l) => sum + l.daysCount, 0);

  const rtpTaken = yearLeaves
    .filter((l) => l.type === 'RTP')
    .reduce((sum, l) => sum + l.daysCount, 0);

  const cpRemaining = Math.max(0, settings.initialCP - cpTaken);
  const rtpRemaining = Math.max(0, settings.initialRTP - rtpTaken);

  const formatDays = (val: number) => (Number.isInteger(val) ? val.toString() : val.toFixed(1));

  return (
    <header className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 mb-3 transition-all">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-md">
            <Palmtree className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-800 leading-tight">Mes Congés</h1>
            <p className="text-xs text-slate-500 font-medium">Solde & Planning Annuel</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Year selector dropdown */}
          <div className="relative inline-flex items-center">
            <select
              value={currentYear}
              onChange={(e) => onYearChange(Number(e.target.value))}
              className="appearance-none bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2 pl-3 pr-7 rounded-xl border border-slate-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-emerald-500 transition"
              aria-label="Sélectionner l'année"
            >
              {[currentYear - 2, currentYear - 1, currentYear, currentYear + 1, currentYear + 2].map((y) => (
                <option key={y} value={y} className="bg-white text-slate-800">
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-500 absolute right-2 pointer-events-none" />
          </div>

          {/* Leave History popup button (temps à l'envers) */}
          <button
            onClick={onOpenLeaveList}
            title="Historique des congés"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 rounded-xl border border-slate-200 transition shadow-2xs"
            aria-label="Historique des congés"
          >
            <History className="w-4 h-4 text-slate-700" />
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            title="Paramètres de l'année"
            className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition"
            aria-label="Paramètres de l'année"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Phone Frame Toggle (visible on wide screens) */}
          <button
            onClick={onToggleMobileFrame}
            title={isMobileFrame ? 'Passer en vue plein écran' : 'Passer en mode simulateur mobile'}
            className="hidden md:flex p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 transition"
            aria-label="Basculer la vue mobile"
          >
            {isMobileFrame ? <Monitor className="w-4 h-4 text-emerald-600" /> : <Smartphone className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Bento Cards Grid for Leave Balances */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* CP Bento Card */}
        <div className="bg-amber-50/90 border border-amber-200/70 p-2.5 rounded-xl flex flex-col items-center text-center justify-between shadow-2xs">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
            CP Restants
          </span>
          <div className="text-2xl font-black text-amber-800 my-0.5 leading-none text-center">
            {formatDays(cpRemaining)} <span className="text-xs font-semibold text-amber-600">j.</span>
          </div>
          <div className="text-[9.5px] font-medium text-amber-700/80">
            Total {settings.initialCP} j • Pris {cpTaken} j
          </div>
        </div>

        {/* RTP Bento Card */}
        <div className="bg-emerald-50/90 border border-emerald-200/70 p-2.5 rounded-xl flex flex-col items-center text-center justify-between shadow-2xs">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
            RTP Restants
          </span>
          <div className="text-2xl font-black text-emerald-800 my-0.5 leading-none text-center">
            {formatDays(rtpRemaining)} <span className="text-xs font-semibold text-emerald-600">j.</span>
          </div>
          <div className="text-[9.5px] font-medium text-emerald-700/80">
            Total {settings.initialRTP} j • Pris {rtpTaken} j
          </div>
        </div>
      </div>
    </header>
  );
};
