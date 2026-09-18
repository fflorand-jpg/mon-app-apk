import React, { useState, useEffect } from 'react';
import { HeaderSummary } from './components/HeaderSummary';
import { CalendarView } from './components/CalendarView';
import { DayLeaveModal } from './components/DayLeaveModal';
import { SettingsModal } from './components/SettingsModal';
import { LeaveHistoryModal } from './components/LeaveHistoryModal';
import {
  loadLeaves,
  saveLeaves,
  loadYearSettings,
  saveYearSettings,
  DEFAULT_YEAR_SETTINGS,
} from './utils/storage';
import { LeaveEntry, YearSettings } from './types';
import { formatDateISO } from './utils/dateUtils';
import { Smartphone, Monitor, Info } from 'lucide-react';

export default function App() {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth());

  // Data State
  const [leaves, setLeaves] = useState<LeaveEntry[]>([]);
  const [yearSettings, setYearSettings] = useState<YearSettings>({
    ...DEFAULT_YEAR_SETTINGS,
    year: today.getFullYear(),
  });

  // UI Modals State
  const [selectedDateStr, setSelectedDateStr] = useState<string>('');
  const [isDayModalOpen, setIsDayModalOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isLeaveListOpen, setIsLeaveListOpen] = useState<boolean>(false);
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(true);

  // Load data on mount and on year change
  useEffect(() => {
    const loadedLeaves = loadLeaves();
    setLeaves(loadedLeaves);

    const loadedSettings = loadYearSettings(currentYear);
    setYearSettings(loadedSettings);
  }, [currentYear]);

  // Save leaves wrapper
  const handleUpdateLeaves = (newLeaves: LeaveEntry[]) => {
    setLeaves(newLeaves);
    saveLeaves(newLeaves);
  };

  // Save settings wrapper
  const handleSaveSettings = (newSettings: YearSettings) => {
    setYearSettings(newSettings);
    saveYearSettings(newSettings);
  };

  // Month navigation
  const handleChangeMonth = (delta: number) => {
    let nextMonth = currentMonth + delta;
    let nextYear = currentYear;

    if (nextMonth < 0) {
      nextMonth = 11;
      nextYear -= 1;
    } else if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }

    setCurrentMonth(nextMonth);
    if (nextYear !== currentYear) {
      setCurrentYear(nextYear);
    }
  };

  // Direct set month/year
  const handleSetMonthYear = (month: number, year: number) => {
    setCurrentMonth(month);
    setCurrentYear(year);
  };

  // Open day leave popup
  const handleSelectDay = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setIsDayModalOpen(true);
  };

  // Save/Update leave from popup
  const handleSaveLeave = (leaveData: Omit<LeaveEntry, 'id' | 'createdAt'>) => {
    // Remove existing leave overlapping this range to avoid duplicates
    const filtered = leaves.filter((l) => {
      const isOverlap =
        leaveData.startDate <= l.endDate && leaveData.endDate >= l.startDate;
      return !isOverlap;
    });

    const newEntry: LeaveEntry = {
      ...leaveData,
      id: 'leave-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      createdAt: new Date().toISOString(),
    };

    handleUpdateLeaves([...filtered, newEntry]);
  };

  // Delete leave by ID
  const handleDeleteLeave = (id: string) => {
    const updated = leaves.filter((l) => l.id !== id);
    handleUpdateLeaves(updated);
  };

  // Reset data for active year
  const handleResetData = () => {
    if (
      window.confirm(
        `Voulez-vous vraiment effacer tous les congés enregistrés pour l'année ${currentYear} ?`
      )
    ) {
      const remaining = leaves.filter((l) => {
        const y = new Date(l.startDate).getFullYear();
        return y !== currentYear;
      });
      handleUpdateLeaves(remaining);
      handleSaveSettings({ ...DEFAULT_YEAR_SETTINGS, year: currentYear });
    }
  };

  // Export JSON backup
  const handleExportData = () => {
    const backupData = {
      app: 'GestionDeConges',
      version: 1,
      exportedAt: new Date().toISOString(),
      leaves,
      settings: yearSettings,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conges_backup_${currentYear}_${formatDateISO(new Date())}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.leaves && Array.isArray(data.leaves)) {
          handleUpdateLeaves(data.leaves);
          if (data.settings) {
            handleSaveSettings(data.settings);
          }
          alert('Données importées avec succès !');
        } else {
          alert('Format de fichier invalide.');
        }
      } catch (err) {
        alert('Erreur lors de la lecture du fichier JSON.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 antialiased selection:bg-emerald-500 selection:text-white flex flex-col items-center justify-start p-0 sm:p-4 md:p-6">
      {/* Container simulating a mobile device on desktop or fluid full width on phone */}
      <div
        className={`w-full transition-all duration-300 ${
          isMobileFrame
            ? 'max-w-md bg-slate-900 sm:p-3 sm:rounded-[40px] sm:shadow-2xl sm:ring-8 sm:ring-slate-800/80 min-h-[100vh] sm:min-h-[840px] flex flex-col'
            : 'max-w-4xl bg-transparent min-h-screen'
        }`}
      >
        {/* Smartphone Notch Bar (only visible when frame enabled) */}
        {isMobileFrame && (
          <div className="hidden sm:flex items-center justify-between px-6 pt-2 pb-1 text-slate-400 text-[10px] font-semibold select-none">
            <span>09:41</span>
            <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto"></div>
            <span>100% 🔋</span>
          </div>
        )}

        {/* Inner Mobile Viewport Card */}
        <div className="flex-1 bg-slate-100 rounded-none sm:rounded-[28px] p-3 overflow-y-auto flex flex-col justify-between shadow-xs">
          <div>
            {/* Top Summary Header */}
            <HeaderSummary
              currentYear={currentYear}
              onYearChange={(y) => {
                setCurrentYear(y);
                setCurrentMonth(0); // Jump to January of new year
              }}
              settings={yearSettings}
              leaves={leaves}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onOpenLeaveList={() => setIsLeaveListOpen(true)}
              isMobileFrame={isMobileFrame}
              onToggleMobileFrame={() => setIsMobileFrame(!isMobileFrame)}
            />

            {/* Main Calendar View */}
            <CalendarView
              currentYear={currentYear}
              currentMonth={currentMonth}
              onChangeMonth={handleChangeMonth}
              onSetMonthYear={handleSetMonthYear}
              settings={yearSettings}
              leaves={leaves}
              onSelectDay={handleSelectDay}
            />
          </div>

          {/* Quick Info Footer */}
          <footer className="mt-4 pt-3 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1 font-medium">
              <Info className="w-3.5 h-3.5 text-emerald-600" />
              Garantie Hors-Ligne & Locale
            </span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="text-emerald-700 font-bold hover:underline"
            >
              Paramètres ({currentYear})
            </button>
          </footer>
        </div>
      </div>

      {/* Popups & Modals */}
      <DayLeaveModal
        isOpen={isDayModalOpen}
        onClose={() => setIsDayModalOpen(false)}
        selectedDateStr={selectedDateStr}
        yearSettings={yearSettings}
        existingLeaves={leaves}
        onSaveLeave={handleSaveLeave}
        onDeleteLeave={handleDeleteLeave}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={yearSettings}
        onSaveSettings={handleSaveSettings}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <LeaveHistoryModal
        isOpen={isLeaveListOpen}
        onClose={() => setIsLeaveListOpen(false)}
        currentYear={currentYear}
        leaves={leaves}
        onDeleteLeave={handleDeleteLeave}
      />
    </div>
  );
}
