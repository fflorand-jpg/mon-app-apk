import React, { useState, useEffect } from 'react';
import { X, Save, RotateCcw, Download, Upload, Check, Sun, Moon, Calendar, Palmtree, Clock } from 'lucide-react';
import { YearSettings, ShiftOption } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: YearSettings;
  onSaveSettings: (newSettings: YearSettings) => void;
  onResetData: () => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetData,
  onExportData,
  onImportData,
}) => {
  const [initialCP, setInitialCP] = useState<number>(settings.initialCP);
  const [initialRTP, setInitialRTP] = useState<number>(settings.initialRTP);
  const [evenWeekShift, setEvenWeekShift] = useState<ShiftOption>(settings.evenWeekShift);
  const [oddWeekShift, setOddWeekShift] = useState<ShiftOption>(settings.oddWeekShift);

  useEffect(() => {
    if (isOpen) {
      setInitialCP(settings.initialCP);
      setInitialRTP(settings.initialRTP);
      setEvenWeekShift(settings.evenWeekShift);
      setOddWeekShift(settings.oddWeekShift);
    }
  }, [isOpen, settings]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings({
      ...settings,
      initialCP: Number(initialCP),
      initialRTP: Number(initialRTP),
      evenWeekShift,
      oddWeekShift,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-3 transition-opacity">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
              <Palmtree className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Paramètres de l'année {settings.year}</h2>
              <p className="text-[11px] text-slate-400">Solde de congés et horaires de travail</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Quotas Section */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Palmtree className="w-4 h-4 text-emerald-600" />
              Allocations annuelles de congés
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de jours CP
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="365"
                  value={initialCP}
                  onChange={(e) => setInitialCP(parseFloat(e.target.value) || 0)}
                  className="w-full font-bold text-sm bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 25 jours</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nombre de jours RTP / RTT
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="365"
                  value={initialRTP}
                  onChange={(e) => setInitialRTP(parseFloat(e.target.value) || 0)}
                  className="w-full font-bold text-sm bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">Ex: 12 jours</span>
              </div>
            </div>
          </div>

          {/* Shift Schedule (Even / Odd Weeks) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
            <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-amber-600" />
              Horaires : Semaines paires vs impaires
            </h3>

            <div className="space-y-3">
              {/* Even week */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Semaines PAIRES (S2, S4, S6...) :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEvenWeekShift('MATIN')}
                    className={`py-2 px-1 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition ${
                      evenWeekShift === 'MATIN'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Matin
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvenWeekShift('APRES_MIDI')}
                    className={`py-2 px-1 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition ${
                      evenWeekShift === 'APRES_MIDI'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Après-midi
                  </button>
                  <button
                    type="button"
                    onClick={() => setEvenWeekShift('NORMAL')}
                    className={`py-2 px-1 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition ${
                      evenWeekShift === 'NORMAL'
                        ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Normal
                  </button>
                </div>
              </div>

              {/* Odd week */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Semaines IMPAIRES (S1, S3, S5...) :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setOddWeekShift('MATIN')}
                    className={`py-2 px-1 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition ${
                      oddWeekShift === 'MATIN'
                        ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" /> Matin
                  </button>
                  <button
                    type="button"
                    onClick={() => setOddWeekShift('APRES_MIDI')}
                    className={`py-2 px-1 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition ${
                      oddWeekShift === 'APRES_MIDI'
                        ? 'bg-indigo-600 text-white border-indigo-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" /> Après-midi
                  </button>
                  <button
                    type="button"
                    onClick={() => setOddWeekShift('NORMAL')}
                    className={`py-2 px-1 rounded-lg border font-bold text-xs flex items-center justify-center gap-1 transition ${
                      oddWeekShift === 'NORMAL'
                        ? 'bg-slate-800 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    Normal
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Backup / Export / Import / Reset */}
          <div className="pt-2 border-t border-slate-200 space-y-2">
            <span className="block font-extrabold text-slate-900 uppercase tracking-wider text-[11px]">
              Sauvegarde & Données
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={onExportData}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 font-semibold flex items-center justify-center gap-1.5 transition text-[11px]"
              >
                <Download className="w-3.5 h-3.5" /> Exporter (JSON)
              </button>

              <label className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg border border-slate-300 font-semibold flex items-center justify-center gap-1.5 transition text-[11px] cursor-pointer">
                <Upload className="w-3.5 h-3.5" /> Importer
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={onResetData}
              className="w-full mt-1 p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg border border-rose-200 font-semibold flex items-center justify-center gap-1.5 transition text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Réinitialiser mes congés ({settings.year})
            </button>
          </div>

          {/* Footer Save */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-5 py-2 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
