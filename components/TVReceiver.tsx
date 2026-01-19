import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { Clock, Gamepad2, Wifi, Tv, Power } from 'lucide-react';
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
        // Random move between -5px to 5px
        if (new Date().getSeconds() === 0) {
            setShiftPos({
                x: Math.floor(Math.random() * 10) - 5,
                y: Math.floor(Math.random() * 10) - 5
            });
        }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleAssign = (id: string) => {
    localStorage.setItem('tv_assigned_console_id', id);
    setAssignedConsoleId(id);
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

  // -- HUD MODE (Minimal Overlay for Gameplay) --
  return (
    // Background Black (Safe for TVs)
    <div className="min-h-screen bg-black relative overflow-hidden font-mono cursor-none selection:bg-none">
      
      {/* 
         HUD CONTAINER 
         Position: Fixed Top Right (Safe Area for Overscan)
         Style: Small, High Contrast, Semi-Transparent Black Background
         Animation: Pixel Shifting for Burn-in Protection
      */}
      {activeSession ? (
        <div 
            className="fixed top-6 right-6 z-50 transition-transform duration-1000 ease-in-out"
            style={{ transform: `translate(${shiftPos.x}px, ${shiftPos.y}px)` }}
        >
            <div className={`
                flex items-center gap-4 px-5 py-3 rounded-full border shadow-2xl backdrop-blur-sm
                ${isExpired 
                    ? 'bg-red-950/90 border-red-500/50 shadow-red-900/20' 
                    : 'bg-black/80 border-slate-700/50 shadow-black/50'
                }
            `}>
                {/* Status Indicator Dot */}
                <div className={`w-3 h-3 rounded-full shrink-0 ${isExpired ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
                
                {/* Content */}
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2 mb-0.5">
                        {/* Member Name - Very Small & Uppercase */}
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 max-w-[100px] truncate">
                            {activeSession.memberName}
                        </span>
                        {/* Console Icon */}
                        <Gamepad2 size={10} className="text-slate-500"/>
                    </div>
                    
                    {/* TIMER - The most important part */}
                    <div className={`
                        font-bold leading-none tracking-tight tabular-nums
                        ${isExpired ? 'text-red-500' : 'text-white'}
                    `}
                    style={{ fontSize: 'clamp(1.5rem, 3vw, 2.5rem)' }} // Responsive Font: 24px on 32", 40px+ on 65"
                    >
                        {remainingTime}
                    </div>
                </div>
            </div>

            {/* Overtime Warning Banner (Only appears if expired) */}
            {isExpired && (
                <div className="mt-2 text-center">
                    <span className="inline-block bg-red-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest animate-bounce shadow-lg">
                        {t('session_ended')}
                    </span>
                </div>
            )}
        </div>
      ) : (
        /* 
           IDLE STATE (SCREENSAVER)
           Prevents black screen confusion, but keeps it very dark to save energy/burn-in.
           Floating logo effect.
        */
        <div className="fixed inset-0 flex items-center justify-center opacity-30">
            <div className="flex flex-col items-center animate-pulse-slow">
                <div className="p-4 rounded-full bg-slate-900/50 border border-slate-800">
                    <Power size={32} className="text-slate-600" />
                </div>
                <p className="mt-4 text-xs font-bold text-slate-700 tracking-[0.3em] uppercase">{activeConsole?.name || 'ZIEZAN STATION'}</p>
                <p className="text-[10px] text-slate-800 mt-1">{t('available_status')}</p>
            </div>
        </div>
      )}

      {/* Connectivity Status (Tiny, Bottom Right) */}
      <div className="fixed bottom-4 right-4 flex items-center gap-2 opacity-20">
         <Wifi size={12} className="text-white" />
         <span className="text-[10px] text-white font-mono">{currentTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
      </div>
      
      {/* Hidden Reset Trigger (Bottom Left Corner click) */}
      <button 
        onClick={() => { if(confirm('Reset TV ID?')) { localStorage.removeItem('tv_assigned_console_id'); setAssignedConsoleId(null); }}}
        className="fixed bottom-0 left-0 w-16 h-16 z-[100] cursor-default"
      />

    </div>
  );
};

export default TVReceiver;