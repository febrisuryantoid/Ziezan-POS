import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Clock, Gamepad2, Wifi, Tv, Power, Maximize2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { wifiService, RemoteCommandPayload } from '../services/wifi';

const TVReceiver: React.FC = () => {
  const { consoles, transactions, refreshData } = useData();
  const { t } = useLanguage();
  const [assignedConsoleId, setAssignedConsoleId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Burn-in Protection State (Pixel Shifting)
  const [shiftPos, setShiftPos] = useState({ x: 0, y: 0 });
  
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
            setInstantSession({
                startTime: Date.now(), 
                durationSeconds: cmd.durationSeconds || 3600,
                memberName: cmd.memberName || 'Member'
            });
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

  // Clock tick & Pixel Shifting (Anti Burn-in)
  useEffect(() => {
    const timer = setInterval(() => {
        setCurrentTime(new Date());
        
        // Shift UI slightly every minute to prevent OLED burn-in
        // Random move between 0px to 20px (More aggressive shift for visibility)
        if (new Date().getSeconds() === 0) {
            setShiftPos({
                x: Math.floor(Math.random() * 20),
                y: Math.floor(Math.random() * 20) * -1 // Move up slightly
            });
        }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAssign = (id: string) => {
    localStorage.setItem('tv_assigned_console_id', id);
    setAssignedConsoleId(id);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((e) => {
        console.log(e);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Find active data from Database/LocalStorage
  const activeConsole = consoles.find(c => c.id === assignedConsoleId);
  const dbTransaction = transactions.find(t => t.id === activeConsole?.currentSessionId && t.status === 'ACTIVE');

  // Determine which data to show
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

  // -- SETUP VIEW (If no console assigned) --
  if (!assignedConsoleId) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-8 font-sans">
        <Tv size={48} className="mb-6 text-palette-mustard animate-pulse" />
        <h1 className="text-3xl font-bold mb-2 text-white">Ziezan TV Setup</h1>
        <p className="text-slate-400 mb-8 text-lg">{t('tv_select_unit')}</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-5xl">
          {consoles.map(c => (
            <button
              key={c.id}
              onClick={() => handleAssign(c.id)}
              className="p-6 bg-slate-900 border border-slate-800 hover:border-palette-mustard hover:bg-slate-800 rounded-xl text-left transition-all group focus:ring-4 focus:ring-palette-mustard focus:outline-none"
            >
              <h3 className="text-xl font-bold group-hover:text-palette-mustard truncate">{c.name}</h3>
              <p className="text-slate-500 mt-1 text-xs">ID: {c.id.substring(0,6)}</p>
            </button>
          ))}
          {consoles.length === 0 && (
             <p className="col-span-3 text-center text-slate-500 italic py-10">{t('tv_no_consoles')}</p>
          )}
        </div>
      </div>
    );
  }

  // -- HUD MODE (Minimal Overlay) --
  return (
    // Background Black (Safe for TVs)
    <div className="min-h-screen bg-black relative overflow-hidden font-mono cursor-none selection:bg-none">
      
      {/* FULLSCREEN TRIGGER (Hidden on Interaction, visible on setup) */}
      <button 
        onClick={toggleFullscreen}
        className="fixed top-4 right-4 z-[100] p-2 bg-white/10 rounded-full text-white/30 hover:text-white hover:bg-white/20 transition-all"
        title="Fullscreen"
      >
        <Maximize2 size={24} />
      </button>

      {/* 
         HUD CONTAINER 
         Position: Fixed Bottom Left (UPDATED)
         Style: High Contrast, Bold, Large
         Animation: Pixel Shifting
      */}
      {activeSession ? (
        <div 
            className="fixed bottom-8 left-8 z-[9999] transition-transform duration-1000 ease-in-out origin-bottom-left"
            style={{ transform: `translate(${shiftPos.x}px, ${shiftPos.y}px)` }}
        >
            <div className={`
                flex flex-col items-start px-6 py-4 rounded-3xl border-2 shadow-2xl backdrop-blur-md
                ${isExpired 
                    ? 'bg-red-950/90 border-red-500 shadow-red-900/50' 
                    : 'bg-black/80 border-white/20 shadow-black/80'
                }
            `}>
                {/* Header: Member Info */}
                <div className="flex items-center gap-3 mb-2 border-b border-white/10 pb-2 w-full">
                    <div className={`p-1.5 rounded-full ${isExpired ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}>
                        <Gamepad2 size={16} className="text-black"/>
                    </div>
                    <span className="text-sm sm:text-lg font-bold uppercase tracking-widest text-slate-300 max-w-[200px] truncate">
                        {activeSession.memberName}
                    </span>
                </div>
                
                {/* TIMER - MASSIVE FONT */}
                <div className={`
                    font-black leading-none tracking-tighter tabular-nums drop-shadow-2xl
                    ${isExpired ? 'text-red-500 animate-pulse' : 'text-white'}
                `}
                style={{ fontSize: 'clamp(3rem, 8vw, 6rem)' }} // Responsive Huge Font
                >
                    {remainingTime}
                </div>

                {/* Subtext Status */}
                <div className="mt-1 w-full text-right">
                    <span className={`text-xs sm:text-sm font-bold uppercase tracking-widest ${isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                        {isExpired ? t('session_ended') : t('time_remaining')}
                    </span>
                </div>
            </div>
        </div>
      ) : (
        /* 
           IDLE STATE (SCREENSAVER)
        */
        <div className="fixed inset-0 flex items-center justify-center opacity-30">
            <div className="flex flex-col items-center animate-pulse-slow">
                <div className="p-6 rounded-full bg-slate-900/50 border-4 border-slate-800">
                    <Power size={64} className="text-slate-600" />
                </div>
                <p className="mt-6 text-xl font-bold text-slate-700 tracking-[0.5em] uppercase">{activeConsole?.name || 'ZIEZAN STATION'}</p>
                <p className="text-sm text-slate-800 mt-2 font-bold">{t('available_status')}</p>
            </div>
        </div>
      )}

      {/* Connectivity Status (Tiny, Bottom Right) */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 opacity-30">
         <Wifi size={14} className="text-white" />
         <span className="text-xs text-white font-mono">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      
      {/* Hidden Reset Trigger (Top Left Corner click) */}
      <button 
        onClick={() => { if(confirm('Reset TV ID?')) { localStorage.removeItem('tv_assigned_console_id'); setAssignedConsoleId(null); }}}
        className="fixed top-0 left-0 w-20 h-20 z-[100] cursor-default"
      />

    </div>
  );
};

export default TVReceiver;