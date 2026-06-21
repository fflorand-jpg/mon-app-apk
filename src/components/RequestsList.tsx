/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LeaveRequest, LeaveType } from '../types';
import { Trash2, AlertCircle, Clock, CheckCircle2, XCircle, CalendarRange, ChevronDown, ChevronUp, Edit2 } from 'lucide-react';
import { calculateWorkingDays } from '../utils/dateUtils';

interface RequestsListProps {
  requests: LeaveRequest[];
  onCancelRequest: (id: string) => void;
  onUpdateRequest: (updatedRequest: LeaveRequest) => void;
}

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

function getWeekLabel(startDate: string, endDate: string): string {
  const startWeek = getISOWeekNumber(startDate);
  const endWeek = getISOWeekNumber(endDate);
  if (startWeek === endWeek) {
    return `Sem. ${startWeek}`;
  }
  return `Sem. ${startWeek} à ${endWeek}`;
}

export default function RequestsList({ requests, onCancelRequest, onUpdateRequest }: RequestsListProps) {
  const [filter, setFilter] = useState<'ALL' | 'AVENIR' | 'VALIDE'>('ALL');
  const [isCollapsed, setIsCollapsed] = useState(false);

  // States for inline edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editType, setEditType] = useState<LeaveType>(LeaveType.CP);
  const [editStartDate, setEditStartDate] = useState('');
  const [editStartPeriod, setEditStartPeriod] = useState<'FULL' | 'MORNING' | 'AFTERNOON'>('FULL');
  const [editEndDate, setEditEndDate] = useState('');
  const [editEndPeriod, setEditEndPeriod] = useState<'FULL' | 'MORNING' | 'AFTERNOON'>('FULL');
  const [editComment, setEditComment] = useState('');
  const [editStatus, setEditStatus] = useState<'PENDING' | 'APPROVED'>('PENDING');

  const startEditing = (req: LeaveRequest) => {
    setEditingId(req.id);
    setEditType(req.type);
    setEditStartDate(req.startDate);
    setEditStartPeriod(req.startPeriod);
    setEditEndDate(req.endDate);
    setEditEndPeriod(req.endPeriod);
    setEditComment(req.comment);
    setEditStatus((req.status === 'REJECTED' ? 'PENDING' : req.status) as 'PENDING' | 'APPROVED');
  };

  const handleSave = (id: string, createdAt: string) => {
    const daysCount = calculateWorkingDays(editStartDate, editStartPeriod, editEndDate, editEndPeriod);
    onUpdateRequest({
      id,
      type: editType,
      startDate: editStartDate,
      startPeriod: editStartPeriod,
      endDate: editEndDate,
      endPeriod: editEndPeriod,
      comment: editComment,
      status: editStatus,
      daysCount,
      createdAt
    });
    setEditingId(null);
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const isPast = endDate < '2026-06-05';
    if (isPast) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Validé
        </span>
      );
    }
    switch (status) {
      case 'PENDING':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3 h-3" /> A venir
          </span>
        );
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Validé
          </span>
        );
      case 'REJECTED':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3" /> Refusé
          </span>
        );
      default:
        return null;
    }
  };

  const getLeaveTypeBadge = (t: LeaveType) => {
    switch (t) {
      case LeaveType.CP:
        return <span className="bg-[#2D336B] text-white text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded">CP</span>;
      case LeaveType.RTT:
        return <span className="bg-[#E1FF72] text-[#2D336B] text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded border border-[#2D336B]/20">RTT</span>;
      case LeaveType.MALADIE:
        return <span className="bg-rose-100 text-rose-800 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded border border-rose-200">Maladie</span>;
      case LeaveType.EXCEPTIONNEL:
        return <span className="bg-amber-100 text-amber-800 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded border border-amber-200">Exc</span>;
      case LeaveType.SANS_SOLDE:
        return <span className="bg-[#F8F7F4] text-slate-800 text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded border border-slate-200">CSS</span>;
    }
  };

  const formatDateFr = (dateStr: string) => {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(Date.UTC(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2])));
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
  };

  const getPeriodLabel = (period: 'FULL' | 'MORNING' | 'AFTERNOON') => {
    if (period === 'MORNING') return 'Matin';
    if (period === 'AFTERNOON') return 'Après-midi';
    return '';
  };

  const countAll = requests.length;
  const countAvenir = requests.filter(req => {
    const isPast = req.endDate < '2026-06-05';
    return !isPast && req.status === 'PENDING';
  }).length;
  const countValide = requests.filter(req => {
    const isPast = req.endDate < '2026-06-05';
    return isPast || req.status === 'APPROVED';
  }).length;

  const filteredRequests = requests.filter(req => {
    const isPast = req.endDate < '2026-06-05';
    const isValidated = isPast || req.status === 'APPROVED';
    const isAvenir = !isPast && req.status === 'PENDING';

    if (filter === 'AVENIR') {
      return isAvenir;
    }
    if (filter === 'VALIDE') {
      return isValidated;
    }
    return true;
  });

  return (
    <div 
      className={`bg-white rounded-[32px] border-2 border-[#E5E3DF] shadow-sm font-sans transition-all duration-300 ${
        isCollapsed ? 'p-5 space-y-0' : 'p-7 space-y-4'
      }`} 
      id="requests-list-container"
    >
      {/* List Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isCollapsed ? '' : 'border-b border-[#E5E3DF] pb-4'}`}>
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center gap-2 font-display text-left hover:opacity-80 transition-all cursor-pointer group"
          >
            <CalendarRange className="w-5 h-5 text-[#2D336B] shrink-0" />
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-black text-[#1A1A1A] uppercase tracking-wider">
                Mes demandes
              </h3>
              {isCollapsed && (
                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200/50 font-mono font-bold">
                  {countAll} au total
                </span>
              )}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-xl bg-[#F8F7F4] hover:bg-[#2D336B] text-[#2D336B] hover:text-white border border-[#E5E3DF] hover:border-transparent transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            title={isCollapsed ? "Déplier" : "Réduire"}
          >
            <span className="text-[10px] font-black uppercase tracking-wider hidden sm:inline select-none">
              {isCollapsed ? "Déplier" : "Réduire"}
            </span>
            {isCollapsed ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronUp className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Filter Tabs (only visible when not collapsed) */}
        {!isCollapsed && (
          <div className="flex bg-[#F8F7F4] p-1 rounded-xl border border-[#E5E3DF] self-start sm:self-auto gap-0.5" id="requests-filter-tabs">
            <button
              type="button"
              onClick={() => setFilter('ALL')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'ALL'
                  ? 'bg-[#2D336B] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Toutes</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${filter === 'ALL' ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'}`}>{countAll}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('AVENIR')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'AVENIR'
                  ? 'bg-[#2D336B] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>A venir</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${filter === 'AVENIR' ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'}`}>{countAvenir}</span>
            </button>
            <button
              type="button"
              onClick={() => setFilter('VALIDE')}
              className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                filter === 'VALIDE'
                  ? 'bg-[#2D336B] text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Validé</span>
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full ${filter === 'VALIDE' ? 'bg-white/20 text-white' : 'bg-slate-200/60 text-slate-600'}`}>{countValide}</span>
            </button>
          </div>
        )}
      </div>

      {/* Requests stack */}
      {!isCollapsed && (
        <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1" id="requests-scroll-stack">
          {filteredRequests.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-2xl bg-[#F8F7F4] border-2 border-dashed border-[#E5E3DF]">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Aucune demande trouvée</p>
              <p className="text-[11px] text-slate-400 mt-1">
                {filter === 'ALL' 
                  ? "Vous n'avez déposé aucune demande." 
                  : filter === 'AVENIR' 
                    ? "Vous n'avez aucune demande à venir." 
                    : "Vous n'avez aucune demande validée."}
              </p>
            </div>
          ) : (
            filteredRequests
              .slice()
              .sort((a, b) => b.startDate.localeCompare(a.startDate)) // Sort descending by start date
              .map((req) => {
                const startPeriodLabel = getPeriodLabel(req.startPeriod);
                const endPeriodLabel = getPeriodLabel(req.endPeriod);

                if (editingId === req.id) {
                  return (
                    <div
                      key={req.id}
                      id={`request-tile-edit-${req.id}`}
                      className="p-5.5 rounded-2xl border-2 border-[#2D336B] bg-white space-y-4 shadow-xs"
                    >
                      <div className="flex items-center justify-between border-b border-[#E5E3DF] pb-2">
                        <span className="text-[11px] font-black uppercase text-[#2D336B] tracking-wider flex items-center gap-1.5 font-display">
                          <Edit2 className="w-3.5 h-3.5 text-[#2D336B]" /> Modifier la demande
                        </span>
                        <span className="text-[9px] font-mono font-bold text-slate-400">
                          ID: {req.id}
                        </span>
                      </div>

                      {/* Edit Fields */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Type of leave */}
                        <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Type d'Absence</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as LeaveType)}
                            className="bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2D336B] font-black uppercase tracking-wider text-[11px] cursor-pointer"
                          >
                            <option value={LeaveType.CP}>Congés Payés (CP)</option>
                            <option value={LeaveType.RTT}>RTT</option>
                            <option value={LeaveType.MALADIE}>Arrêt Maladie</option>
                            <option value={LeaveType.EXCEPTIONNEL}>Congés Exceptionnels</option>
                            <option value={LeaveType.SANS_SOLDE}>Congé Sans Solde (CSS)</option>
                          </select>
                        </div>

                        {/* Start Date */}
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Date de Début</label>
                          <input
                            type="date"
                            value={editStartDate}
                            onChange={(e) => setEditStartDate(e.target.value)}
                            className="bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2D336B] font-mono text-[11px] font-bold"
                          />
                        </div>

                        {/* Start Period */}
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Départ</label>
                          <select
                            value={editStartPeriod}
                            onChange={(e) => setEditStartPeriod(e.target.value as 'FULL' | 'MORNING' | 'AFTERNOON')}
                            className="bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2D336B] font-bold text-[10px]"
                          >
                            <option value="FULL">Matin (Journée entière)</option>
                            <option value="AFTERNOON">Après-midi (Demi-journée)</option>
                          </select>
                        </div>

                        {/* End Date */}
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Date de Fin</label>
                          <input
                            type="date"
                            value={editEndDate}
                            onChange={(e) => setEditEndDate(e.target.value)}
                            className="bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2D336B] font-mono text-[11px] font-bold"
                          />
                        </div>

                        {/* End Period */}
                        <div className="flex flex-col gap-1">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Fin</label>
                          <select
                            value={editEndPeriod}
                            onChange={(e) => setEditEndPeriod(e.target.value as 'FULL' | 'MORNING' | 'AFTERNOON')}
                            className="bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2D336B] font-bold text-[10px]"
                          >
                            <option value="FULL">Soir (Journée entière)</option>
                            <option value="MORNING">Matin (Demi-journée)</option>
                          </select>
                        </div>

                        {/* Comment */}
                        <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Commentaire (facultatif)</label>
                          <input
                            type="text"
                            value={editComment}
                            onChange={(e) => setEditComment(e.target.value)}
                            placeholder="Ex: Vacances d'été, rendez-vous..."
                            className="bg-[#F8F7F4] border-2 border-[#E5E3DF] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#2D336B] text-[11px] font-medium"
                          />
                        </div>

                        {/* Status Selection (A venir / Validé) */}
                        <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                          <label className="font-bold text-[#1A1A1A] uppercase tracking-wider text-[9px]">Statut de la Demande</label>
                          <div className="grid grid-cols-2 gap-2 mt-0.5" id="edit-status-toggle">
                            <button
                              type="button"
                              onClick={() => setEditStatus('PENDING')}
                              className={`py-2 px-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-wider transition cursor-pointer ${
                                editStatus === 'PENDING'
                                  ? 'bg-[#2D336B] text-white border-[#2D336B] shadow-xs'
                                  : 'bg-[#F8F7F4] text-slate-500 border-[#E5E3DF] hover:text-[#2D336B]'
                              }`}
                            >
                              A venir (En attente)
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditStatus('APPROVED')}
                              className={`py-2 px-3 rounded-xl border-2 font-black uppercase text-[10px] tracking-wider transition cursor-pointer ${
                                editStatus === 'APPROVED'
                                  ? 'bg-[#2D336B] text-white border-[#2D336B] shadow-xs'
                                  : 'bg-[#F8F7F4] text-slate-500 border-[#E5E3DF] hover:text-[#2D336B]'
                              }`}
                            >
                              Validé (Approuvé)
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Estimated days */}
                      <div className="bg-[#F8F7F4] p-3 rounded-xl border border-[#E5E3DF] flex items-center justify-between" id="edit-days-sum">
                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                          Nouveau solde estimé
                        </span>
                        <span className="bg-[#E1FF72] text-[#2D336B] font-mono font-black text-xs px-2.5 py-1 rounded-md border border-[#2D336B]/10">
                          {calculateWorkingDays(editStartDate, editStartPeriod, editEndDate, editEndPeriod)} jours ouvrés
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E3DF]">
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="px-3.5 py-1.5 border-2 border-[#E5E3DF] bg-[#F8F7F4] text-slate-600 hover:text-slate-800 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!editStartDate || !editEndDate) {
                              alert('Veuillez remplir les dates de début et de fin.');
                              return;
                            }
                            if (editStartDate > editEndDate) {
                              alert('La date de début ne peut pas être après la date de fin.');
                              return;
                            }
                            handleSave(req.id, req.createdAt);
                          }}
                          className="px-4 py-1.5 bg-[#2D336B] hover:bg-[#2D336B]/90 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition shadow-xs cursor-pointer"
                        >
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={req.id}
                    id={`request-tile-${req.id}`}
                    className="p-4.5 rounded-2xl border-2 border-[#E5E3DF] hover:border-[#2D336B] bg-white transition hover:shadow-xs space-y-3 group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getLeaveTypeBadge(req.type)}
                        <span className="text-xs font-black text-[#1A1A1A] font-mono bg-[#F8F7F4] py-0.5 px-2 rounded-md">
                          {req.daysCount} {req.daysCount > 1 ? 'jours' : 'jour'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500 font-mono bg-slate-100 py-0.5 px-2 rounded-md border border-slate-200/50">
                          {getWeekLabel(req.startDate, req.endDate)}
                        </span>
                      </div>
                      {getStatusBadge(req.status, req.endDate)}
                    </div>

                    {/* Dates & Periods timeline */}
                    <div className="text-xs text-slate-600 space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-[#1A1A1A] uppercase tracking-wide text-[10px]">Du</span>
                        <span className="font-bold text-[#1A1A1A]">{formatDateFr(req.startDate)}</span>
                        {startPeriodLabel && (
                          <span className="text-[9px] bg-[#E1FF72] text-[#2D336B] py-0.5 px-1.5 rounded font-black uppercase">
                            {startPeriodLabel}
                          </span>
                        )}
                        <span className="font-bold text-[#1A1A1A] uppercase tracking-wide text-[10px]">au</span>
                        <span className="font-bold text-[#1A1A1A]">{formatDateFr(req.endDate)}</span>
                        {endPeriodLabel && (
                          <span className="text-[9px] bg-[#E1FF72] text-[#2D336B] py-0.5 px-1.5 rounded font-black uppercase">
                            {endPeriodLabel}
                          </span>
                        )}
                      </div>
                      {req.comment && (
                        <p className="text-slate-500 italic mt-2 pl-2 border-l-2 border-[#E5E3DF] text-[11px] leading-relaxed">
                          &ldquo;{req.comment}&rdquo;
                        </p>
                      )}
                    </div>

                    {/* Footer actions with Modifier inside */}
                    {(req.status === 'PENDING' || req.status === 'APPROVED') && (
                      <div className="flex justify-end gap-2 pt-1">
                        {(() => {
                          const isPast = req.endDate < '2026-06-05';
                          const btnText = isPast ? 'Supprimer' : 'Annuler';
                          const confirmMsg = isPast 
                            ? "Voulez-vous vraiment supprimer ce congé déjà pris de votre historique ?"
                            : req.status === 'APPROVED'
                              ? "Attention, ce congé est validé. Voulez-vous réellement l'annuler ?"
                              : "Voulez-vous vraiment annuler cette demande de congé ?";

                          return (
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                id={`edit-btn-${req.id}`}
                                onClick={() => startEditing(req)}
                                className="text-[10px] font-black uppercase tracking-widest text-[#2D336B] hover:text-white bg-slate-50 hover:bg-[#2D336B] border-2 border-[#E5E3DF] hover:border-transparent py-1.5 px-3.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                Modifier
                              </button>
                              <button
                                type="button"
                                id={`cancel-btn-${req.id}`}
                                onClick={() => {
                                  if (window.confirm(confirmMsg)) {
                                    onCancelRequest(req.id);
                                  }
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-700 hover:text-white bg-[#F8F7F4] hover:bg-rose-600 border-2 border-[#E5E3DF] hover:border-transparent py-1.5 px-3.5 rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                {btnText}
                              </button>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </div>
      )}
    </div>
  );
}
