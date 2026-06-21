/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LeaveType, LeavePeriod, LeaveRequest } from '../types';
import { calculateWorkingDays, getFrenchPublicHolidays } from '../utils/dateUtils';
import { CalendarPlus2, AlertCircle, Sparkles, Check, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

interface LeaveFormProps {
  onSubmit: (request: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => void;
  availableCP: number;
  availableRTT: number;
}

export default function LeaveForm({ onSubmit, availableCP, availableRTT }: LeaveFormProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formatDateString = (d: Date) => d.toISOString().split('T')[0];

  const [type, setType] = useState<LeaveType>(LeaveType.CP);
  const [startDate, setStartDate] = useState<string>(formatDateString(tomorrow));
  const [startPeriod, setStartPeriod] = useState<LeavePeriod>('FULL');
  
  // End date should be default equal to start date or +2 days for initial values
  const endDefault = new Date(tomorrow);
  endDefault.setDate(endDefault.getDate() + 2);
  const [endDate, setEndDate] = useState<string>(formatDateString(endDefault));
  const [endPeriod, setEndPeriod] = useState<LeavePeriod>('FULL');
  
  const [comment, setComment] = useState<string>('');
  const [workingDays, setWorkingDays] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Recalculate working days dynamically on inputs change
  useEffect(() => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        setWorkingDays(0);
        setErrorMsg('La date de début doit être antérieure ou égale à la date de fin.');
        return;
      }
      setErrorMsg(null);
      const days = calculateWorkingDays(startDate, startPeriod, endDate, endPeriod);
      setWorkingDays(days);
    } else {
      setWorkingDays(0);
    }
  }, [startDate, startPeriod, endDate, endPeriod]);

  // Handle single-day logical constraints (e.g. startPeriod must correspond with endPeriod if start===end)
  useEffect(() => {
    if (startDate === endDate) {
      if (startPeriod === 'AFTERNOON' && endPeriod === 'MORNING') {
        // Not logical: starting afternoon and ending morning on the same day is impossible
        setEndPeriod('AFTERNOON');
      }
    }
  }, [startDate, endDate, startPeriod, endPeriod]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) {
      setErrorMsg('Veuillez remplir les dates de début et de fin.');
      return;
    }
    if (startDate > endDate) {
      setErrorMsg('La date de début doit être antérieure ou égale à la date de fin.');
      return;
    }
    if (workingDays <= 0) {
      setErrorMsg('La période demandée ne contient aucun jour ouvré travaillé.');
      return;
    }

    // Balance checks
    if (type === LeaveType.CP && workingDays > availableCP) {
      if (!window.confirm(`Votre solde de Congés Payés disponible (${availableCP}j) est inférieur aux ${workingDays}j demandés. Souhaitez-vous quand même soumettre cette demande ?`)) {
        return;
      }
    } else if (type === LeaveType.RTT && workingDays > availableRTT) {
      if (!window.confirm(`Votre solde de RTT disponible (${availableRTT}j) est inférieur aux ${workingDays}j demandés. Souhaitez-vous quand même soumettre cette demande ?`)) {
        return;
      }
    }

    onSubmit({
      type,
      startDate,
      startPeriod,
      endDate,
      endPeriod,
      daysCount: workingDays,
      comment,
    });

    // Reset some form items
    setComment('');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  const getLeaveTypeDetails = (t: LeaveType) => {
    switch (t) {
      case LeaveType.CP:
        return { label: 'Congés Payés', color: 'bg-emerald-500 border-emerald-600 font-medium' };
      case LeaveType.RTT:
        return { label: 'RTT', color: 'bg-indigo-500 border-indigo-600 font-medium' };
      case LeaveType.MALADIE:
        return { label: 'Arrêt Maladie', color: 'bg-rose-500 border-rose-600 font-medium' };
      case LeaveType.EXCEPTIONNEL:
        return { label: 'Congé Exceptionnel', color: 'bg-amber-500 border-amber-600 font-medium' };
      case LeaveType.SANS_SOLDE:
        return { label: 'Sans Solde', color: 'bg-slate-500 border-slate-600 font-medium' };
    }
  };

  // Check if requested exceeds balance to display warning
  const exceedsBalance =
    (type === LeaveType.CP && workingDays > availableCP) ||
    (type === LeaveType.RTT && workingDays > availableRTT);

  return (
    <form
      onSubmit={handleSubmit}
      id="leave-request-form"
      className={`bg-white rounded-[32px] border-2 border-[#E5E3DF] shadow-sm transition-all duration-300 font-sans ${
        isCollapsed ? 'p-4 px-6 space-y-0' : 'p-7 space-y-6'
      }`}
    >
      <div 
        className={`flex items-center justify-between select-none cursor-pointer ${
          isCollapsed ? '' : 'border-b border-[#E5E3DF] pb-4'
        }`}
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? "Cliquez pour dérouler la demande" : "Cliquez pour réduire la demande"}
      >
        <h3 className="text-xs font-black text-[#1A1A1A] uppercase tracking-widest flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#2D336B]"></span>
          DÉPOSER UNE DEMANDE
        </h3>
        <div className="flex items-center gap-2">
          {success && !isCollapsed && (
            <span className="text-xs text-emerald-600 font-black tracking-wider uppercase flex items-center gap-1 animate-pulse" id="form-success-banner">
              <CheckCircle2 className="w-3.5 h-3.5" /> ENVOYÉ !
            </span>
          )}
          <button
            type="button"
            className="flex items-center justify-center p-1 rounded-lg border border-[#E5E3DF] hover:bg-[#F8F7F4] text-[#2D336B] transition cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              setIsCollapsed(!isCollapsed);
            }}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <>
          {/* Leave Type Select Grid */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
              Type de congé / absence
            </label>
            <div className="grid grid-cols-2 gap-2" id="leave-type-selector">
              {[LeaveType.CP, LeaveType.RTT].map((t) => {
                const isSelected = type === t;
                const details = getLeaveTypeDetails(t);
                return (
                  <button
                    type="button"
                    key={t}
                    id={`btn-type-${t}`}
                    onClick={() => setType(t)}
                    className={`py-2.5 px-3 text-[11px] uppercase tracking-wider rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-[#2D336B] border-[#2D336B] text-white font-black shadow-sm'
                        : 'bg-[#F8F7F4] hover:bg-slate-100 text-[#1A1A1A] border-[#E5E3DF] font-bold'
                    }`}
                  >
                    {details.label}
                  </button>
                );
              })}
            </div>
          </div>

      {/* Start Date & Start period */}
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Date de début
          </label>
          <input
            type="date"
            value={startDate}
            id="start-date-input"
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full text-xs font-bold border-2 border-[#E5E3DF] p-3 rounded-xl bg-[#F8F7F4] focus:bg-white focus:outline-none focus:border-[#2D336B] transition"
          />
          {/* Half day selector */}
          <div className="flex gap-1.5 mt-1">
            <button
              type="button"
              id="start-period-full"
              onClick={() => setStartPeriod('FULL')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border text-center transition ${
                startPeriod === 'FULL'
                  ? 'bg-slate-900 text-white border-transparent font-black'
                  : 'bg-[#F8F7F4] text-[#1A1A1A] hover:bg-slate-100 border-[#E5E3DF]'
              }`}
            >
              Entier
            </button>
            <button
              type="button"
              id="start-period-morning"
              onClick={() => setStartPeriod('MORNING')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border text-center transition ${
                startPeriod === 'MORNING'
                  ? 'bg-[#2D336B] text-white border-transparent font-black'
                  : 'bg-[#F8F7F4] text-[#1A1A1A] hover:bg-slate-100 border-[#E5E3DF]'
              }`}
            >
              Matin
            </button>
            <button
              type="button"
              id="start-period-afternoon"
              onClick={() => setStartPeriod('AFTERNOON')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border text-center transition ${
                startPeriod === 'AFTERNOON'
                  ? 'bg-[#2D336B] text-white border-transparent font-black'
                  : 'bg-[#F8F7F4] text-[#1A1A1A] hover:bg-slate-100 border-[#E5E3DF]'
              }`}
            >
              A-M
            </button>
          </div>
        </div>

        {/* End Date & End period */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
            Date de fin
          </label>
          <input
            type="date"
            value={endDate}
            id="end-date-input"
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full text-xs font-bold border-2 border-[#E5E3DF] p-3 rounded-xl bg-[#F8F7F4] focus:bg-white focus:outline-none focus:border-[#2D336B] transition"
          />
          {/* Half day selector */}
          <div className="flex gap-1.5 mt-1">
            <button
              type="button"
              id="end-period-full"
              onClick={() => setEndPeriod('FULL')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border text-center transition ${
                endPeriod === 'FULL'
                  ? 'bg-slate-900 text-white border-transparent font-black'
                  : 'bg-[#F8F7F4] text-[#1A1A1A] hover:bg-slate-100 border-[#E5E3DF]'
              }`}
            >
              Entier
            </button>
            <button
              type="button"
              id="end-period-morning"
              onClick={() => setEndPeriod('MORNING')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border text-center transition ${
                endPeriod === 'MORNING'
                  ? 'bg-[#2D336B] text-white border-transparent font-black'
                  : 'bg-[#F8F7F4] text-[#1A1A1A] hover:bg-slate-100 border-[#E5E3DF]'
              }`}
            >
              Matin
            </button>
            <button
              type="button"
              id="end-period-afternoon"
              onClick={() => setEndPeriod('AFTERNOON')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-bold uppercase rounded-lg border text-center transition ${
                endPeriod === 'AFTERNOON'
                  ? 'bg-[#2D336B] text-white border-transparent font-black'
                  : 'bg-[#F8F7F4] text-[#1A1A1A] hover:bg-slate-100 border-[#E5E3DF]'
              }`}
            >
              A-M
            </button>
          </div>
        </div>
      </div>

      {/* Reason / Commment */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">
          Motif / Commentaire (optionnel)
        </label>
        <textarea
          rows={2}
          value={comment}
          id="comment-textarea"
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ex: Vacances d'été, déplacement..."
          className="w-full text-xs font-medium border-2 border-[#E5E3DF] p-3 rounded-xl bg-[#F8F7F4] focus:bg-white focus:outline-none focus:border-[#2D336B] transition"
        />
      </div>

      {/* Dynamic Working Days Calculation Indicator in vibrant Bold highlight style */}
      <div className="p-4 bg-[#E1FF72] text-[#1A1A1A] rounded-2xl border-2 border-[#1A1A1A] flex items-center justify-between shadow-sm" id="calculation-preview-box">
        <span className="text-[11px] font-black uppercase tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#2D336B] animate-pulse" />
          DÉCOMPTE ESTIMÉ :
        </span>
        <span className="text-xs font-black uppercase tracking-widest">
          {workingDays > 0 ? (
            <span className="bg-[#1A1A1A] text-white py-1 px-3.5 rounded-lg font-mono">
              {workingDays} {workingDays > 1 ? 'JOURS' : 'JOUR'}
            </span>
          ) : (
            <span className="text-slate-600 block italic">aucun jour</span>
          )}
        </span>
      </div>

      {/* Warning if balance exceeded */}
      {exceedsBalance && workingDays > 0 && (
        <div className="p-3.5 bg-amber-50 rounded-xl text-xs text-amber-800 flex gap-2 border-2 border-amber-200 items-start leading-normal" id="balance-warning-alert">
          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>
            <strong>Attention : Solde insuffisant.</strong> Vous demandez{' '}
            {workingDays}j de {type === LeaveType.CP ? 'CP' : 'RTT'} mais vous n&apos;avez que{' '}
            {type === LeaveType.CP ? availableCP : availableRTT}j restants.
          </p>
        </div>
      )}

      {/* General validation error message */}
      {errorMsg && (
        <div className="p-3.5 bg-rose-50 rounded-xl text-xs text-rose-800 flex gap-2 border-2 border-rose-200 items-center" id="validation-error-alert">
          <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
          <p className="font-bold">{errorMsg}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!!errorMsg || workingDays <= 0}
        id="submit-leave-btn"
        className={`w-full py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all text-center flex items-center justify-center gap-2 shadow-md ${
          !!errorMsg || workingDays <= 0
            ? 'bg-gray-100 text-gray-400 border-2 border-[#E5E3DF] cursor-not-allowed shadow-none'
            : 'bg-[#2D336B] hover:bg-opacity-90 text-white cursor-pointer active:scale-98'
        }`}
      >
        <CalendarPlus2 className="w-4 h-4" />
        Soumettre ma demande
      </button>
        </>
      )}
    </form>
  );
}
