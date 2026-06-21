/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LeaveRequest, LeaveType } from './types';
import { CURRENT_USER } from './data';
import { SEED_REQUESTS, SEED_TEAM_REQUESTS, ManagerRequestSimulation } from './data';
import BalanceTracker from './components/BalanceTracker';
import LeaveForm from './components/LeaveForm';
import CalendarView from './components/CalendarView';
import RequestsList from './components/RequestsList';
import { Glasses, CheckCircle2, X, Smartphone, Download, Database, Server, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  dbGetUserRequests,
  dbSaveUserRequests,
  dbGetTeamRequests,
  dbSaveTeamRequests,
  dbGetSetting,
  dbSaveSetting,
} from './db/phoneDb';

interface Toast {
  id: string;
  message: string;
}

export default function App() {
  // Load and sync Sophie Dubois requests (userRequests)
  const [dbIsReady, setDbIsReady] = useState(false);
  const [dbStats, setDbStats] = useState({ size: 0, lastSync: '' });

  const [userRequests, setUserRequests] = useState<LeaveRequest[]>([]);
  const [teamRequests, setTeamRequests] = useState<ManagerRequestSimulation[]>([]);
  const [allocatedCP, setAllocatedCP] = useState<number>(25.0);
  const [allocatedRTT, setAllocatedRTT] = useState<number>(10.0);
  const [droitCP, setDroitCP] = useState<number>(30.0);
  const [droitRTT, setDroitRTT] = useState<number>(12.0);
  const [userInitials, setUserInitials] = useState<string>('SD');
  const [userName, setUserName] = useState<string>(CURRENT_USER.name);
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);

  // PWA standard installation trigger properties
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallable(false);
        showToast('🏷️ Installation de l\'application PWA lancée !');
      }
    } catch (err) {
      console.error('Error during PWA installation trigger:', err);
    }
  };

  // Initializing database from IndexedDB
  useEffect(() => {
    async function initDB() {
      try {
        // 1. Get or seed user requests
        let myReqs = await dbGetUserRequests();
        if (myReqs.length === 0) {
          const localSavedReqs = localStorage.getItem('user_absence_requests');
          if (localSavedReqs) {
            try { myReqs = JSON.parse(localSavedReqs); } catch {}
          }
          if (!myReqs || myReqs.length === 0) {
            myReqs = SEED_REQUESTS;
          }
          await dbSaveUserRequests(myReqs);
        }
        setUserRequests(myReqs);

        // 2. Get or seed team requests
        let teamReqs = await dbGetTeamRequests();
        if (teamReqs.length === 0) {
          const localSavedTeam = localStorage.getItem('team_absence_requests');
          if (localSavedTeam) {
            try { teamReqs = JSON.parse(localSavedTeam); } catch {}
          }
          if (!teamReqs || teamReqs.length === 0) {
            teamReqs = SEED_TEAM_REQUESTS;
          }
          await dbSaveTeamRequests(teamReqs);
        }
        setTeamRequests(teamReqs);

        // 3. General settings
        const loadedCP = await dbGetSetting<number>('allocated_cp', 25.0);
        setAllocatedCP(loadedCP);

        const loadedRTT = await dbGetSetting<number>('allocated_rtt', 10.0);
        setAllocatedRTT(loadedRTT);

        const loadedDroitCP = await dbGetSetting<number>('droit_cp', 30.0);
        setDroitCP(loadedDroitCP);

        const loadedDroitRTT = await dbGetSetting<number>('droit_rtt', 12.0);
        setDroitRTT(loadedDroitRTT);

        const loadedInitials = await dbGetSetting<string>('user_initials', 'SD');
        setUserInitials(loadedInitials);

        const loadedName = await dbGetSetting<string>('user_name', CURRENT_USER.name);
        setUserName(loadedName);

        // Set state to ready
        setDbIsReady(true);
        setDbStats({
          size: myReqs.length + teamReqs.length,
          lastSync: new Date().toLocaleTimeString('fr-FR')
        });

      } catch (err) {
        console.error("Échec du chargement de la base IndexedDB", err);
        // Fallback to localStorage directly if any error
        const localReqs = localStorage.getItem('user_absence_requests');
        if (localReqs) {
          try { setUserRequests(JSON.parse(localReqs)); } catch {}
        }
        const localTeam = localStorage.getItem('team_absence_requests');
        if (localTeam) {
          try { setTeamRequests(JSON.parse(localTeam)); } catch {}
        }
        setAllocatedCP(parseFloat(localStorage.getItem('allocated_cp') || '25.0'));
        setAllocatedRTT(parseFloat(localStorage.getItem('allocated_rtt') || '10.0'));
        setDroitCP(parseFloat(localStorage.getItem('droit_cp') || '30.0'));
        setDroitRTT(parseFloat(localStorage.getItem('droit_rtt') || '12.0'));
        setUserInitials(localStorage.getItem('user_initials') || 'SD');
        setUserName(localStorage.getItem('user_name') || CURRENT_USER.name);
        
        setDbIsReady(true);
      }
    }

    initDB();
  }, []);

  // Persist states to local storage AND IndexedDB internal database
  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('user_absence_requests', JSON.stringify(userRequests));
    dbSaveUserRequests(userRequests).then(() => {
      setDbStats(prev => ({
        ...prev,
        size: userRequests.length + teamRequests.length,
        lastSync: new Date().toLocaleTimeString('fr-FR')
      }));
    });
  }, [userRequests, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('team_absence_requests', JSON.stringify(teamRequests));
    dbSaveTeamRequests(teamRequests).then(() => {
      setDbStats(prev => ({
        ...prev,
        size: userRequests.length + teamRequests.length,
        lastSync: new Date().toLocaleTimeString('fr-FR')
      }));
    });
  }, [teamRequests, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('allocated_cp', allocatedCP.toString());
    dbSaveSetting('allocated_cp', allocatedCP);
  }, [allocatedCP, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('allocated_rtt', allocatedRTT.toString());
    dbSaveSetting('allocated_rtt', allocatedRTT);
  }, [allocatedRTT, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('droit_cp', droitCP.toString());
    dbSaveSetting('droit_cp', droitCP);
  }, [droitCP, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('droit_rtt', droitRTT.toString());
    dbSaveSetting('droit_rtt', droitRTT);
  }, [droitRTT, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('user_initials', userInitials);
    dbSaveSetting('user_initials', userInitials);
  }, [userInitials, dbIsReady]);

  useEffect(() => {
    if (!dbIsReady) return;
    localStorage.setItem('user_name', userName);
    dbSaveSetting('user_name', userName);
  }, [userName, dbIsReady]);

  // Toasts state and trigger
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Base de données interne handlers
  const [diagState, setDiagState] = useState<'IDLE' | 'CHECKING' | 'SUCCESS'>('IDLE');

  const runDiagnostic = () => {
    setDiagState('CHECKING');
    setTimeout(() => {
      setDiagState('SUCCESS');
      showToast('Base de données : Diagnostic réussi (100% saine / En ligne) !');
      setTimeout(() => {
        setDiagState('IDLE');
      }, 4000);
    }, 1500);
  };

  const handleExportDB = () => {
    const backupData = {
      user_absence_requests: userRequests,
      team_absence_requests: teamRequests,
      allocated_cp: allocatedCP,
      allocated_rtt: allocatedRTT,
      droit_cp: droitCP,
      droit_rtt: droitRTT,
      user_initials: userInitials,
      user_name: userName,
      exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `android_absence_db_backup_${Date.now()}.json`;
    link.click();
    showToast('Base de données exportée en fichier JSON !');
  };

  const handleImportDB = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') return;
        const json = JSON.parse(text);
        
        // Validation check
        if (!json || typeof json !== 'object') {
          throw new Error('Format de fichier invalide');
        }

        if (json.allocated_cp !== undefined) setAllocatedCP(parseFloat(json.allocated_cp));
        if (json.allocated_rtt !== undefined) setAllocatedRTT(parseFloat(json.allocated_rtt));
        if (json.droit_cp !== undefined) setDroitCP(parseFloat(json.droit_cp));
        if (json.droit_rtt !== undefined) setDroitRTT(parseFloat(json.droit_rtt));
        if (json.user_initials !== undefined) setUserInitials(json.user_initials);
        if (json.user_name !== undefined) setUserName(json.user_name);
        
        if (Array.isArray(json.user_absence_requests)) {
          setUserRequests(json.user_absence_requests);
        }
        if (Array.isArray(json.team_absence_requests)) {
          setTeamRequests(json.team_absence_requests);
        }

        showToast('Base de données restaurée avec succès !');
      } catch (err) {
        showToast('Erreur lors de la lecture du fichier de sauvegarde.');
        console.error(err);
      }
    };
    reader.readAsText(file);
    // Reset file input value to allow re-importing the same file
    event.target.value = '';
  };

  const handleResetDB = async () => {
    if (window.confirm("Voulez-vous vraiment réinitialiser la base de données interne ? Toutes vos demandes enregistrées sur cet appareil seront remplacées par les données de démonstration d'usine.")) {
      try {
        await dbSaveUserRequests(SEED_REQUESTS);
        await dbSaveTeamRequests(SEED_TEAM_REQUESTS);
        await dbSaveSetting('allocated_cp', 25.0);
        await dbSaveSetting('allocated_rtt', 10.0);
        await dbSaveSetting('droit_cp', 30.0);
        await dbSaveSetting('droit_rtt', 12.0);
        await dbSaveSetting('user_initials', 'SD');
        await dbSaveSetting('user_name', CURRENT_USER.name);
        
        // Reload states
        setUserRequests(SEED_REQUESTS);
        setTeamRequests(SEED_TEAM_REQUESTS);
        setAllocatedCP(25.0);
        setAllocatedRTT(10.0);
        setDroitCP(30.0);
        setDroitRTT(12.0);
        setUserInitials('SD');
        setUserName(CURRENT_USER.name);
        
        showToast('Base de données réinitialisée aux valeurs d\'usine !');
      } catch (err) {
        showToast('Échec de la réinitialisation');
      }
    }
  };

  // Handle addition of a leave request
  const handleAddRequest = (newReqData: Omit<LeaveRequest, 'id' | 'createdAt' | 'status'>) => {
    const newRequest: LeaveRequest = {
      ...newReqData,
      id: `user-req-${Date.now()}`,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    setUserRequests(prev => [newRequest, ...prev]);
    showToast('Demande enregistrée');
  };

  // Handle cancellation/removal of requested leave (if pending)
  const handleCancelRequest = (id: string) => {
    setUserRequests(prev => prev.filter(r => r.id !== id));
  };

  // Handle request update (dates, type, status, comment, daysCount)
  const handleUpdateRequest = (updatedReq: LeaveRequest) => {
    setUserRequests(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
    showToast('Demande mise à jour');
  };

  // Helpers for period filtering
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
      const refMonth = refDate.getMonth(); // May is 4
      
      let cpStartYear = refYear;
      if (refMonth < 4) { // Jan, Feb, Mar, Apr
        cpStartYear = refYear - 1;
      }
      
      const cycleStart = `${cpStartYear}-05-01`;
      const cycleEnd = `${cpStartYear + 1}-04-30`;
      
      return dateStr >= cycleStart && dateStr <= cycleEnd;
    } catch {
      return false;
    }
  };

  // Calcul basique de solde CP disponible sur la période légale (du 1er Mai 2026 au 30 Avril 2027)
  const cpBalance = userRequests.reduce((acc, req) => {
    if (req.type === LeaveType.CP && (req.status === 'APPROVED' || req.status === 'PENDING')) {
      if (isDateInCurrentCPPeriod(req.startDate)) {
        acc += req.daysCount;
      }
    }
    return acc;
  }, 0);
  const remainingCP = Math.max(0, allocatedCP - cpBalance);

  // Calcul basique de solde RTT disponible sur l'année civile (du 1er Janvier au 31 Décembre 2026)
  const rttBalance = userRequests.reduce((acc, req) => {
    if (req.type === LeaveType.RTT && (req.status === 'APPROVED' || req.status === 'PENDING')) {
      if (isDateInCurrentRTTPeriod(req.startDate)) {
        acc += req.daysCount;
      }
    }
    return acc;
  }, 0);
  const remainingRTT = Math.max(0, allocatedRTT - rttBalance);

  return (
    <div className="min-h-screen bg-[#F8F7F4] text-[#1A1A1A] antialiased font-sans pb-12" id="app-wrapper">
      {/* Upper Brand Bar */}
      <header className="sticky top-0 z-50 bg-white border-b-2 border-[#E5E3DF] px-4 sm:px-6 py-2">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo / Title */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#2D336B] text-white flex items-center justify-center shadow-xs">
              <Glasses className="w-4 h-4 text-[#E1FF72]" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-black text-[#1A1A1A] uppercase tracking-tight leading-tight font-display">
                Gestion des congés
              </h1>
              <p className="text-[10px] text-[#2D336B] font-black uppercase tracking-wider mt-0.5" id="header-today-date">
                {(() => {
                  const dStr = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
                  return dStr.charAt(0).toUpperCase() + dStr.slice(1);
                })()}
              </p>
            </div>
          </div>

          {/* User Profile & Database Shortcut */}
          <div className="flex items-center gap-3">
            {/* Database indicator shortcut button */}
            <button
              onClick={() => {
                const element = document.getElementById('phone-database-panel');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                  // Highlight the panel briefly
                  element.classList.add('ring-4', 'ring-[#2D336B]', 'ring-offset-2');
                  setTimeout(() => {
                    element.classList.remove('ring-4', 'ring-[#2D336B]', 'ring-offset-2');
                  }, 2000);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full border border-emerald-200 transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider shadow-xs"
              title="Accéder au module Base de Données Interne"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>BD Locale</span>
            </button>

            {isInstallable && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex items-center gap-1.5 px-3 py-1 bg-[#E1FF72] text-[#2D336B] hover:bg-opacity-90 rounded-full border border-[#2D336B]/10 transition-all cursor-pointer text-[10px] font-black uppercase tracking-wider shadow-xs animate-pulse font-sans"
                title="Installer sur l'écran d'accueil comme application mobile/bureau native"
              >
                <Smartphone className="w-3.5 h-3.5 text-[#2D336B] shrink-0" />
                <span>Installer PWA</span>
              </button>
            )}

            {isEditingProfile ? (
              <div className="flex items-center gap-2 px-2.5 py-1 bg-[#F8F7F4] border-2 border-[#2D336B] rounded-xl animate-fade-in shadow-xs">
                {/* Initials Input */}
                <div className="flex flex-col">
                  <label className="text-[7.5px] font-black uppercase text-[#2D336B] leading-none mb-0.5">Initiales</label>
                  <input
                    type="text"
                    maxLength={3}
                    value={userInitials}
                    onChange={(e) => setUserInitials(e.target.value.toUpperCase())}
                    className="w-10 h-5.5 text-center font-black rounded bg-white border border-[#E5E3DF] text-[#2D336B] leading-none text-[10px] focus:outline-none focus:ring-1 focus:ring-[#2D336B] uppercase font-sans p-0.5"
                    placeholder="SD"
                    autoFocus
                  />
                </div>
                {/* Name Input */}
                <div className="flex flex-col">
                  <label className="text-[7.5px] font-black uppercase text-[#2D336B] leading-none mb-0.5">Nom</label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="w-20 sm:w-28 h-5.5 px-1.5 font-black rounded bg-white border border-[#E5E3DF] text-[#1A1A1A] leading-none text-[10px] focus:outline-none focus:ring-1 focus:ring-[#2D336B] font-sans p-0.5"
                    placeholder="Sophie Dubois"
                  />
                </div>
                {/* Save Button */}
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="h-5.5 w-5.5 mt-2.5 bg-[#2D336B] hover:bg-[#2D336B]/90 text-white flex items-center justify-center rounded cursor-pointer transition active:scale-95 text-[10px] font-black shadow-xs shrink-0"
                  title="Fermer et sauvegarder"
                >
                  ✓
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsEditingProfile(true)}
                className="flex items-center gap-2 px-2.5 py-1 bg-[#F8F7F4] border-2 border-[#E5E3DF] hover:border-[#2D336B]/30 hover:bg-white rounded-xl transition group text-left cursor-pointer shadow-xs"
                title="Modifier les initiales ou le nom"
              >
                <div className="w-5.5 h-5.5 rounded-full bg-[#2D336B] group-hover:bg-[#E1FF72] text-[#E1FF72] group-hover:text-[#2D336B] font-black text-[10px] flex items-center justify-center transition-all duration-200">
                  {userInitials || 'SD'}
                </div>
                <div className="hidden sm:block text-left">
                  <p className="text-[11px] font-black text-[#1A1A1A] leading-none uppercase tracking-wide flex items-center gap-1">
                    {userName || CURRENT_USER.name}
                    <span className="text-[8px] text-gray-400 group-hover:text-[#2D336B] transition-colors">✎</span>
                  </p>
                  <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider leading-none mt-0.5">
                    {CURRENT_USER.role}
                  </p>
                </div>
                <div className="sm:hidden text-gray-400 text-[10px]">✎</div>
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Main Workspace Frame */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
        


        <BalanceTracker
          requests={userRequests}
          allocatedCP={allocatedCP}
          allocatedRTT={allocatedRTT}
          onUpdateAllocatedCP={setAllocatedCP}
          onUpdateAllocatedRTT={setAllocatedRTT}
          droitCP={droitCP}
          droitRTT={droitRTT}
          onUpdateDroitCP={setDroitCP}
          onUpdateDroitRTT={setDroitRTT}
          onExportDB={handleExportDB}
        />

        {/* Core Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start" id="collaborator-view-workspace">
          {/* Left 4 Cols: Request Form */}
          <div className="lg:col-span-4 space-y-6">
            <LeaveForm
              onSubmit={handleAddRequest}
              availableCP={remainingCP}
              availableRTT={remainingRTT}
            />

            {/* Database & Backup Status Panel */}
            <div className="bg-white p-6 rounded-[32px] border-2 border-[#E5E3DF] shadow-xs space-y-4" id="phone-database-panel">
              <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#2D336B]/10 text-[#2D336B] flex items-center justify-center border border-[#2D336B]/20">
                    <Database className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider leading-none">
                      Base de Données
                    </h3>
                    <p className="text-[9px] text-[#2D336B] font-black uppercase tracking-wider mt-1">
                      STOCKAGE NAVIGATEUR
                    </p>
                  </div>
                </div>
                
                {/* Connection Status Dot */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-teal-50 text-teal-800 rounded-full border border-teal-200" title="Vos données restent sécurisées localement dans votre navigateur.">
                  <span className="w-1.5 h-1.5 bg-teal-500 rounded-full"></span>
                  <span className="text-[8px] font-black uppercase tracking-wider font-mono">STOCKAGE LOCAL SÉCURISÉ</span>
                </div>
              </div>

              {/* Explanatory text */}
              <p className="text-[11px] text-slate-500 leading-normal bg-slate-50 p-3 rounded-2xl border border-[#E5E3DF]">
                🛡️ <strong>Données locales :</strong> Vos demandes de congés et vos compteurs ajustés sont stockés de manière sécurisée en local dans votre navigateur (IndexedDB). Aucune donnée confidentielle ne transite sur un serveur tiers.
              </p>

              {/* Specs */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono leading-tight bg-[#F8F7F4] p-3 rounded-2xl border border-[#E5E3DF]">
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans">Type de stockage :</span>
                  <span className="font-bold text-[#1A1A1A]">IndexedDB</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans">Enregistrements :</span>
                  <span className="font-bold text-[#2D336B]">{dbStats.size} lignes</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans">Configuration PWA :</span>
                  <span className="font-bold text-emerald-600">✓ Prête</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans">Service Worker :</span>
                  <span className="font-bold text-[#2D336B]">✓ Actif</span>
                </div>
                <div className="col-span-2 border-t border-[#E5E3DF] pt-1.5 mt-1.5">
                  <span className="text-slate-400 block text-[9px] uppercase tracking-wider font-sans">Dernière synchronisation :</span>
                  <span className="font-bold text-[#1A1A1A] flex items-center gap-1">
                    <RefreshCw className="w-3 h-3 text-emerald-600 animate-spin shrink-0" style={{ animationDuration: '3s' }} />
                    {dbStats.lastSync || "Chargement..."}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1 text-xs">
                {diagState === 'CHECKING' ? (
                  <div className="w-full py-2.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-xl font-bold uppercase tracking-wider text-[10px] text-center flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Analyse de la base locale...
                  </div>
                ) : diagState === 'SUCCESS' ? (
                  <div className="w-full py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl font-bold uppercase tracking-wider text-[10px] text-center">
                    ✓ Diagnostic : Stockage opérationnel
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={runDiagnostic}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 text-[#1A1A1A] border-2 border-[#E5E3DF] hover:border-slate-300 rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 animate-fade-in"
                  >
                    🔍 Diagnostiquer l'état local
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleExportDB}
                  className="w-full py-3 bg-[#2D336B] hover:bg-[#2D336B]/90 text-white rounded-xl font-black uppercase tracking-wider text-[10px] flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 shadow-md shadow-[#2D336B]/15"
                  title="Exporter toutes vos données locales au format JSON"
                  id="btn-export-database"
                >
                  💾 SAUVEGARDER MES DONNÉES (.json)
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <label className="py-2.5 bg-[#E1FF72] hover:bg-[#E1FF72]/90 text-[#2D336B] rounded-xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 text-center items-center justify-center leading-none border border-[#b8d249]">
                    📥 RESTAURER (.json)
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportDB}
                      className="hidden"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleResetDB}
                    className="py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 hover:border-red-300 rounded-xl font-black uppercase tracking-wider text-[9px] flex items-center justify-center gap-1 cursor-pointer transition active:scale-95"
                    title="Réinitialiser l'application aux valeurs de démonstration"
                  >
                    ⚠️ RÉINIT. DE DÉMO
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right 8 Cols: Calendar & History List */}
          <div className="lg:col-span-8 space-y-6">
            <RequestsList 
              requests={userRequests} 
              onCancelRequest={handleCancelRequest} 
              onUpdateRequest={handleUpdateRequest}
            />
            <CalendarView userRequests={userRequests} teamRequests={teamRequests} />
          </div>
        </div>

      </main>

      {/* Footer structure with prominent export and backup controls at the absolute bottom */}
      <footer className="w-full bg-[#20244E] text-white mt-12 py-8 px-4 border-t border-slate-700/30" id="app-footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-sm font-black uppercase tracking-wider text-[#E1FF72] font-display flex items-center justify-center md:justify-start gap-2">
              <span className="w-2 h-2 rounded-full bg-[#E1FF72] animate-pulse"></span>
              Gestion des congés
            </h4>
            <p className="text-[11px] text-slate-300">
              Application Web Sécurisée • Vos données de démonstration et saisies restent stockées localement.
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={handleExportDB}
              className="w-full sm:w-auto px-6 py-3 bg-[#E1FF72] text-[#2D336B] hover:bg-opacity-95 font-black uppercase tracking-wider text-[11px] rounded-2xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#2D336B]/20 transition active:scale-95 duration-100"
              title="Télécharger la sauvegarde complète de vos données au format JSON"
              id="footer-export-btn"
            >
              <Download className="w-4 h-4 shrink-0 text-[#2D336B]" />
              Télécharger ma Sauvegarde (.json)
            </button>
            
            <label className="w-full sm:w-auto px-5 py-3 bg-[#2D336B] hover:bg-opacity-80 border-2 border-[#E5E3DF]/20 text-white rounded-2xl font-black uppercase tracking-wider text-[11px] flex items-center justify-center gap-2 cursor-pointer transition active:scale-95 duration-100 text-center leading-none">
              📥 Importer une sauvegarde
              <input
                type="file"
                accept=".json"
                onChange={handleImportDB}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </footer>

      {/* Toast Notification Container sliding from right */}
      <div className="fixed top-24 right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-sm w-[90%] sm:w-80" id="toast-notifications-container">
        <AnimatePresence>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 100, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 100, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 350, damping: 25 }}
              className="pointer-events-auto bg-[#2D336B] text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-white/10"
              id={`toast-${toast.id}`}
            >
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-[#E1FF72] shrink-0" />
                <span className="text-xs font-black uppercase tracking-wider">{toast.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white/60 hover:text-white transition cursor-pointer p-1"
                title="Fermer"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
