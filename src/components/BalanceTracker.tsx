/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LeaveType, LeaveRequest } from '../types';
import { Briefcase, Calendar, CheckSquare, Clock, Settings, Download } from 'lucide-react';

interface BalanceTrackerProps {
  requests: LeaveRequest[];
  allocatedCP?: number;
  allocatedRTT?: number;
  onUpdateAllocatedCP?: (val: number) => void;
  onUpdateAllocatedRTT?: (val: number) => void;
  droitCP?: number;
  droitRTT?: number;
  onUpdateDroitCP?: (val: number) => void;
  onUpdateDroitRTT?: (val: number) => void;
  onExportDB?: () => void;
}

export default function BalanceTracker({
  requests,
  allocatedCP = 25.0,
  allocatedRTT = 10.0,
  onUpdateAllocatedCP = () => {},
  onUpdateAllocatedRTT = () => {},
  droitCP = 30.0,
  droitRTT = 12.0,
  onUpdateDroitCP = () => {},
  onUpdateDroitRTT = () => {},
  onExportDB,
}: BalanceTrackerProps) {
  const [isEditing, setIsEditing] = React.useState(false);

// Compute balances
  const isDateInCurrentRTTPeriod = (dateStr: string, currentYear: number = 2026): boolean => {
    try {
      const year = new Date(dateStr).getFullYear();
      return year === currentYear;
    } catch {
      return false;
    }
  };

  const isDateInCurrentCPPeriod = (dateStr: string, referenceDateStr: string = '2026-06-05'): boolean => {
    try {
      const refDate = new Date(referenceDateStr);
      const refYear = refDate.getFullYear();
      const refMonth = refDate.getMonth(); // 0-indexed: May is 4
      
      let cpStartYear = refYear;
      if (refMonth < 4) { // Before May: Jan, Feb, Mar, Apr
        cpStartYear = refYear - 1;
      }
      
      const cycleStart = `${cpStartYear}-05-01`;
      const cycleEnd = `${cpStartYear + 1}-04-30`;
      
      return dateStr >= cycleStart && dateStr <= cycleEnd;
    } catch {
      return false;
    }
  };

  const initialBalances = {
    [LeaveType.CP]: { allocated: allocatedCP, taken: 0, pending: 0, rawTaken: 0 },
    [LeaveType.RTT]: { allocated: allocatedRTT, taken: 0, pending: 0, rawTaken: 0 },
  };

  const balances = requests.reduce((acc, req) => {
    const isCPType = req.type === LeaveType.CP;
    const isRTTType = req.type === LeaveType.RTT;

    // Filter by period
    if (isCPType && !isDateInCurrentCPPeriod(req.startDate)) {
      return acc;
    }
    if (isRTTType && !isDateInCurrentRTTPeriod(req.startDate)) {
      return acc;
    }

    if (req.status === 'APPROVED') {
      if (isCPType) {
        acc[LeaveType.CP].taken += req.daysCount;
      } else if (isRTTType) {
        acc[LeaveType.RTT].taken += req.daysCount;
      }
    } else if (req.status === 'PENDING') {
      if (isCPType) {
        acc[LeaveType.CP].pending += req.daysCount;
      } else if (isRTTType) {
        acc[LeaveType.RTT].pending += req.daysCount;
      }
    }
    return acc;
  }, initialBalances);

  const stats = [
    {
      id: 'cp',
      title: 'Congés Payés (CP)',
      type: LeaveType.CP,
      themeColor: 'emerald',
      bgColor: 'bg-emerald-50/70',
      textColor: 'text-emerald-700',
      barColor: 'bg-emerald-500',
      borderColor: 'border-emerald-100',
      data: balances[LeaveType.CP],
    },
    {
      id: 'rtt',
      title: 'RTT (Réduction Temps Travail)',
      type: LeaveType.RTT,
      themeColor: 'indigo',
      bgColor: 'bg-indigo-50/70',
      textColor: 'text-indigo-700',
      barColor: 'bg-indigo-500',
      borderColor: 'border-indigo-100',
      data: balances[LeaveType.RTT],
    },
  ];

  return (
    <div className="space-y-4 font-sans" id="balance-tracker-container">
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D336B]"></span>
          VOS COMPTEURS DE CONGÉS
        </h3>
        <div className="flex items-center gap-2">
          {onExportDB && (
            <button
              type="button"
              onClick={onExportDB}
              className="text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border border-[#2D336B]/15 bg-white hover:bg-slate-50 text-[#2D336B] transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
              title="Exporter la base de données (.json)"
              id="tracker-btn-export"
            >
              <Download className="w-3.5 h-3.5" />
              Exporter (.json)
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
              isEditing
                ? 'bg-[#2D336B] text-white border-transparent'
                : 'bg-[#E1FF72] text-[#2D336B] border-[#2D336B]/15 hover:bg-opacity-90'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {isEditing ? 'Terminer' : 'Ajuster'}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="p-4.5 bg-[#E1FF72]/15 border-2 border-dashed border-[#2D336B]/20 rounded-2xl text-[11.5px] text-[#2D336B] font-bold leading-relaxed space-y-2">
          <p className="flex items-center gap-1.5 font-black uppercase text-[10px] tracking-wider text-[#2D336B]">
            <span className="w-2 h-2 rounded-full bg-[#2D336B] animate-pulse"></span>
            Mode d&apos;ajustement des droits
          </p>
          <p className="font-normal text-[#2D336B]/80 leading-relaxed">
            Utilisez les boutons <strong className="font-black font-mono bg-white/50 px-1 rounded">-</strong> et <strong className="font-black font-mono bg-white/50 px-1 rounded">+</strong> ou tapez directement la valeur pour réinitialiser ou ajuster votre compteur initial acquis :
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stats.map((stat) => {
          const { allocated, taken, pending } = stat.data;
          const available = allocated - taken - pending;
          const percentage = Math.max(0, Math.min(100, (available / Math.max(0.1, allocated)) * 100));
          const isCP = stat.type === LeaveType.CP;

          return (
            <div
              key={stat.id}
              id={`balance-card-${stat.id}`}
              className={`p-4.5 xs:p-5 rounded-[28px] border flex flex-col items-center text-center justify-between gap-2.5 transition-all duration-300 hover:scale-[1.01] ${
                isCP
                  ? 'bg-white border-[#E5E3DF] text-[#1A1A1A] shadow-xs'
                  : 'bg-[#2D336B] border-[transparent] text-white shadow-md'
              }`}
            >
              {/* Header: Title and Period */}
              <div className="w-full text-center space-y-0.5">
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  <h4 className={`text-xs font-black uppercase tracking-widest ${isCP ? 'text-gray-400' : 'text-white/60'}`}>
                    {stat.title}
                  </h4>
                </div>
                <p className={`text-[10px] ${isCP ? 'text-gray-400 font-bold' : 'text-white/40 font-medium'}`}>
                  Période : {isCP ? 'Mai 2026 - Avril 2027' : 'Janvier - Décembre 2026'}
                </p>
              </div>

              {/* Middle: Prominent Circular Progress (Available Days) */}
              <div className="relative flex items-center justify-center shrink-0 w-36 h-36 my-0.5">
                <svg className="w-36 h-36 transform -rotate-90">
                  {/* Background Track Circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    className={`${isCP ? 'stroke-slate-100' : 'stroke-white/10'}`}
                    strokeWidth="10"
                    fill="transparent"
                  />
                  {/* Foreground Animated Progress Circle */}
                  <circle
                    cx="72"
                    cy="72"
                    r="54"
                    className={`${isCP ? 'stroke-[#2D336B]' : 'stroke-[#E1FF72]'} transition-all duration-500 ease-out`}
                    strokeWidth="10"
                    strokeDasharray={339.3}
                    strokeDashoffset={339.3 - (percentage / 100) * 339.3}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                {/* Available text overlay in center */}
                <div className="absolute inset-0 flex flex-col items-center justify-center select-none text-center">
                  <span className={`text-4xl xs:text-5xl font-black leading-none tracking-tight font-display ${isCP ? 'text-[#1A1A1A]' : 'text-white'}`}>
                    {available.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
                  </span>
                  <span className={`text-[9px] font-black uppercase tracking-widest mt-1.5 px-2 py-0.5 rounded ${isCP ? 'bg-[#F8F7F4] text-slate-500' : 'bg-white/10 text-white/70'}`}>
                    dispo
                  </span>
                </div>
              </div>

              {/* Bottom: Sub details Grid (Droit, Acquis & Pris) */}
              <div className={`w-full grid grid-cols-3 gap-2 pt-3 border-t text-center text-[10px] ${
                isCP ? 'border-[#F8F7F4]' : 'border-white/10'
              }`}>
                {/* 1. Droit (Information, modifiable) */}
                <div className="space-y-1 flex flex-col items-center">
                  <span className={`block uppercase font-bold tracking-wider text-[7.5px] ${isCP ? 'text-gray-400' : 'text-white/40'}`}>Droits</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center scale-75 sm:scale-90 origin-top">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(0, (isCP ? droitCP : droitRTT) - 1);
                          if (isCP) {
                            onUpdateDroitCP(val);
                          } else {
                            onUpdateDroitRTT(val);
                          }
                        }}
                        className={`w-4.5 h-4.5 rounded flex items-center justify-center font-black text-[10px] transition cursor-pointer select-none active:scale-90 ${
                          isCP 
                            ? 'bg-gray-150 hover:bg-gray-200 text-[#1A1A1A]' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={isCP ? droitCP : droitRTT}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          if (isCP) {
                            onUpdateDroitCP(val);
                          } else {
                            onUpdateDroitRTT(val);
                          }
                        }}
                        className={`w-8 text-center font-mono text-[10px] font-black rounded p-0.5 focus:outline-none focus:ring-1 ${
                          isCP 
                            ? 'bg-[#F8F7F4] text-[#1A1A1A] border border-[#E5E3DF] focus:ring-[#2D336B]' 
                            : 'bg-white/10 text-white border border-white/20 focus:ring-[#E1FF72]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = (isCP ? droitCP : droitRTT) + 1;
                          if (isCP) {
                            onUpdateDroitCP(val);
                          } else {
                            onUpdateDroitRTT(val);
                          }
                        }}
                        className={`w-4.5 h-4.5 rounded flex items-center justify-center font-black text-[10px] transition cursor-pointer select-none active:scale-90 ${
                          isCP 
                            ? 'bg-gray-150 hover:bg-gray-200 text-[#1A1A1A]' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isCP ? 'bg-[#F8F7F4] text-slate-500' : 'bg-white/5 text-white/80'
                    }`}>
                      {isCP ? droitCP : droitRTT} j
                    </span>
                  )}
                </div>

                {/* 2. Acquis (allocated, modifiable) */}
                <div className="space-y-1 flex flex-col items-center">
                  <span className={`block uppercase font-bold tracking-wider text-[7.5px] ${isCP ? 'text-gray-400' : 'text-white/40'}`}>Acquis</span>
                  {isEditing ? (
                    <div className="flex items-center gap-1 justify-center scale-75 sm:scale-90 origin-top">
                      <button
                        type="button"
                        onClick={() => {
                          const val = Math.max(0, allocated - 1);
                          if (isCP) {
                            onUpdateAllocatedCP(val);
                          } else {
                            onUpdateAllocatedRTT(val);
                          }
                        }}
                        className={`w-4.5 h-4.5 rounded flex items-center justify-center font-black text-[10px] transition cursor-pointer select-none active:scale-90 ${
                          isCP 
                            ? 'bg-gray-150 hover:bg-gray-200 text-[#1A1A1A]' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={allocated}
                        onChange={(e) => {
                          const val = Math.max(0, parseFloat(e.target.value) || 0);
                          if (isCP) {
                            onUpdateAllocatedCP(val);
                          } else {
                            onUpdateAllocatedRTT(val);
                          }
                        }}
                        className={`w-8 text-center font-mono text-[10px] font-black rounded p-0.5 focus:outline-none focus:ring-1 ${
                          isCP 
                            ? 'bg-[#F8F7F4] text-[#1A1A1A] border border-[#E5E3DF] focus:ring-[#2D336B]' 
                            : 'bg-white/10 text-white border border-white/20 focus:ring-[#E1FF72]'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const val = allocated + 1;
                          if (isCP) {
                            onUpdateAllocatedCP(val);
                          } else {
                            onUpdateAllocatedRTT(val);
                          }
                        }}
                        className={`w-4.5 h-4.5 rounded flex items-center justify-center font-black text-[10px] transition cursor-pointer select-none active:scale-90 ${
                          isCP 
                            ? 'bg-gray-150 hover:bg-gray-200 text-[#1A1A1A]' 
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  ) : (
                    <span className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                      isCP ? 'bg-[#F8F7F4] text-[#1A1A1A]' : 'bg-white/5 text-white/95'
                    }`}>
                      {allocated} j
                    </span>
                  )}
                </div>

                {/* 3. Pris (computed) */}
                <div className="space-y-1 flex flex-col items-center">
                  <span className={`block uppercase font-bold tracking-wider text-[7.5px] ${isCP ? 'text-gray-400' : 'text-white/40'}`}>Pris</span>
                  <span className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                    isCP ? 'bg-emerald-50 text-emerald-700' : 'bg-emerald-500/20 text-emerald-300'
                  }`}>
                    {taken > 0 ? `-${taken}` : '0'} j
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function InfoIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.083.984l-.04.018-1.4 1.4a.75.75 0 001.084 1.08l1.4-1.4a2.25 2.25 0 00-3.182-3.182l-1.4 1.4a.75.75 0 101.08 1.08l1.4-1.4zM12 20.25a8.25 8.25 0 110-16.5 8.25 8.25 0 010 16.5z" />
    </svg>
  );
}
