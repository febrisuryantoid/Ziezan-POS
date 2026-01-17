import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus } from '../types';
import { Clock, Gamepad2, Wifi, WifiOff, Tv } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { wifiService, RemoteCommandPayload } from '../services/wifi';

const TVReceiver: React.FC = () => {
  const { consoles, transactions, refreshData } = useData();
  const { t } = useLanguage();
  const [assignedConsoleId, setAssignedConsoleId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Real-time Override State (For instant feedback from Wi-Fi command)
  const [instantSession, setInstantSession] = useState<{
    startTime: number;
    durationSeconds: number;
    memberName: string;
  } | null>(null);

  // Load assigned console from local storage (simulate TV settings)
  useEffect(() => {
    const savedId = localStorage.getItem('tv_assigned_console_id');
    if (savedId) setAssignedConsoleId(savedId);
  }, []);

  // Initialize Wi-Fi / Cloud Listener
  useEffect(() => {
    if (!assignedConsoleId) return;

    // Listen for Cloud commands
    const unsubscribe = wifiService.listenForCommands(assignedConsoleId, (cmd: RemoteCommandPayload) => {
        if (cmd.type === 'START') {
            // Immediately show the session without waiting for DB sync
            setInstantSession({
                startTime: Date.now(), // approximation, close enough for display
                durationSeconds: cmd.durationSeconds || 3600,
                memberName: cmd.memberName || 'Member'
            });
            // Also trigger a data refresh to get the actual record eventually
            refreshData();
        } else if (cmd.type === 'STOP') {
            setInstantSession(null);
            refreshData();
        }
    });

    return () => {
        unsubscribe();
    };
  }, [assignedConsoleId, refreshData]);

  // Clock tick
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAssign = (id: string) => {
    localStorage.setItem('tv_assigned_console_id', id);
    setAssignedConsoleId(id);
  };

  // Find active data from Database/LocalStorage (Slower source)
  const activeConsole = consoles.find(c => c.id === assignedConsoleId);
  const dbTransaction = transactions.find(t => t.id === activeConsole?.currentSessionId && t.status === 'ACTIVE');

  // Determine which data to show: Instant (Wi-Fi) or Persistent (DB)
  // Instant session takes precedence for immediate feedback, clears when stopped or when DB syncs matching data
  const activeSession = instantSession || (dbTransaction ? {
      startTime: new Date(dbTransaction.startTime).getTime(),
      durationSeconds: dbTransaction.durationHours * 3600,
      memberName: dbTransaction.memberName
  } : null);
  
  // Calculate remaining time
  const getRemainingTime = () => {
    if (!activeSession) return null;
    
    const end = activeSession.startTime + (activeSession.durationSeconds * 1000);
    const now = currentTime.getTime();
    const diff = end - now;

    if (diff <= 0) return "00:00:00";

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const remainingTime = getRemainingTime();
  const isExpired = remainingTime === "00:00:00";
  const durationHoursDisplay = activeSession ? (activeSession.durationSeconds / 3600).toFixed(1) : 0;

  // -- SETUP VIEW (If no console assigned) --
  if (!assignedConsoleId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-12">
        <Tv size={64} className="mb-6 text-brand-500" />
        <h1 className="text-4xl font-bold mb-2 text-brand-400">Ziezan Station</h1>
        <p className="text-slate-400 mb-8 text-xl">{t('tv_select_unit')}</p>
        
        <div className="grid grid-cols-2 gap-6 w-full max-w-4xl">
          {consoles.map(c => (
            <button
              key={c.id}
              onClick={() => handleAssign(c.id)}
              className="p-8 bg-slate-900 border-2 border-slate-800 hover:border-brand-500 hover:bg-slate-800 rounded-2xl text-left transition-all group focus:ring-4 focus:ring-brand-500 focus:outline-none"
            >
              <h3 className="text-2xl font-bold group-hover:text-brand-400">{c.name}</h3>
              <p className="text-slate-500 mt-2">ID: {c.id}</p>
            </button>
          ))}
          {consoles.length === 0 && (
             <p className="col-span-2 text-center text-slate-500">{t('tv_no_consoles')}</p>
          )}
        </div>
      </div>
    );
  }

  // -- OVERLAY VIEW (Active) --
  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-sans cursor-none">
      
      {/* Background Simulation (Ambient Mode / Wallpaper) */}
      <div className="absolute inset-0 opacity-40">
         <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-black animate-pulse duration-[10s]"></div>
      </div>

      {/* Top Status Bar */}
      <div className="absolute top-8 right-8 flex items-center gap-4 text-white/50 bg-black/30 backdrop-blur-md px-6 py-3 rounded-full border border-white/5">
         <div className="flex items-center gap-2">
           <Wifi size={20} className="text-brand-400" />
           <span className="text-sm font-medium tracking-wider">Wi-Fi / Cloud Ready</span>
         </div>
         <span className="text-sm border-l border-white/20 pl-4">{currentTime.toLocaleTimeString()}</span>
      </div>

      {/* Console Identity */}
      <div className="absolute top-8 left-8">
        <h2 className="text-brand-400/50 text-2xl font-bold tracking-widest uppercase">{activeConsole?.name || t('unknown_unit')}</h2>
      </div>

      {/* MAIN OVERLAY CONTENT */}
      {activeSession ? (
        <div className={`absolute bottom-12 left-12 p-8 rounded-3xl backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 ${isExpired ? 'bg-red-900/40 border-red-500/50' : 'bg-slate-900/80 border-brand-500/30'}`}>
           <div className="flex items-start gap-6">
              <div className={`p-4 rounded-2xl ${isExpired ? 'bg-red-500 text-white' : 'bg-brand-500 text-slate-900'}`}>
                <Clock size={48} className={!isExpired ? "animate-pulse" : ""} />
              </div>
              <div>
                <p className="text-brand-200/60 text-lg font-medium uppercase tracking-wider mb-1">{t('time_remaining')}</p>
                <h1 className={`text-8xl font-black tabular-nums tracking-tight leading-none ${isExpired ? 'text-red-400' : 'text-brand-400'}`}>
                  {remainingTime}
                </h1>
                <div className="mt-4 flex items-center gap-3 text-white/80">
                   <div className="w-8 h-8 rounded-full bg-brand-400/20 text-brand-400 flex items-center justify-center text-sm font-bold border border-brand-400/30">
                     {activeSession.memberName.charAt(0)}
                   </div>
                   <span className="text-xl font-medium">{activeSession.memberName}</span>
                   <span className="mx-2 opacity-50">•</span>
                   <span className="text-xl opacity-80">{durationHoursDisplay}h Session</span>
                </div>
              </div>
           </div>
           
           {isExpired && (
             <div className="mt-6 bg-red-600/90 text-white py-2 px-4 rounded-lg text-center font-bold text-lg animate-bounce">
               {t('session_ended')}
             </div>
           )}
        </div>
      ) : (
        /* IDLE / AVAILABLE STATE */
        <div className="absolute bottom-12 left-12 flex items-center gap-6 animate-fade-in">
           <div className="p-6 bg-slate-900/60 border border-brand-500/30 backdrop-blur-lg rounded-3xl">
              <Gamepad2 size={64} className="text-brand-400 mb-2" />
              <h1 className="text-4xl font-bold text-brand-400">{t('available_status')}</h1>
              <p className="text-brand-200/60 mt-1 text-lg">{t('ready_to_play')}</p>
           </div>
        </div>
      )}
      
      {/* Reset Config Button (Hidden/Subtle) */}
      <button 
        onClick={() => { localStorage.removeItem('tv_assigned_console_id'); setAssignedConsoleId(null); }}
        className="absolute bottom-4 right-4 text-white/10 hover:text-white/50 text-xs p-2"
      >
        {t('tv_reset_id')}
      </button>

    </div>
  );
};

export default TVReceiver;