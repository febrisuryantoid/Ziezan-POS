
import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { Clock, Gamepad2, Wifi, Tv, Power, Maximize2, Minimize2, PictureInPicture } from 'lucide-react';
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

  // PiP Support
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPipActive, setIsPipActive] = useState(false);

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
        const now = new Date();
        setCurrentTime(now);
        
        // Shift UI slightly every minute to prevent OLED burn-in
        // Random move between -20px to +20px in both X and Y directions
        if (now.getSeconds() === 0) {
            setShiftPos({
                x: Math.floor(Math.random() * 41) - 20, 
                y: Math.floor(Math.random() * 41) - 20
            });
        }
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // --- PiP LOGIC ---
  const activeSession = instantSession || (transactions.find(t => t.id === consoles.find(c => c.id === assignedConsoleId)?.currentSessionId && t.status === 'ACTIVE') ? {
      startTime: new Date(transactions.find(t => t.id === consoles.find(c => c.id === assignedConsoleId)?.currentSessionId && t.status === 'ACTIVE')!.startTime).getTime(),
      durationSeconds: transactions.find(t => t.id === consoles.find(c => c.id === assignedConsoleId)?.currentSessionId && t.status === 'ACTIVE')!.durationHours * 3600,
      memberName: transactions.find(t => t.id === consoles.find(c => c.id === assignedConsoleId)?.currentSessionId && t.status === 'ACTIVE')!.memberName
  } : null);

  const getRemainingTimeData = () => {
    if (!activeSession) return { text: "00:00:00", isExpired: false };
    
    const end = activeSession.startTime + (activeSession.durationSeconds * 1000);
    const now = currentTime.getTime();
    const diff = end - now;

    if (diff <= 0) return { text: "00:00:00", isExpired: true };

    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    return { 
        text: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`,
        isExpired: false 
    };
  };

  const { text: remainingTime, isExpired } = getRemainingTimeData();

  // Draw to Canvas for PiP
  useEffect(() => {
      if (isPipActive && canvasRef.current && videoRef.current && activeSession) {
          const ctx = canvasRef.current.getContext('2d');
          if (ctx) {
              // Canvas dimensions
              canvasRef.current.width = 400;
              canvasRef.current.height = 200;

              // Background
              ctx.fillStyle = isExpired ? '#450a0a' : '#000000'; // Dark Red or Black
              ctx.fillRect(0, 0, 400, 200);

              // Text Color
              ctx.fillStyle = isExpired ? '#ef4444' : '#ffffff';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';

              // Timer
              ctx.font = 'bold 80px monospace';
              ctx.fillText(remainingTime, 200, 100);

              // Member Name
              ctx.font = '20px sans-serif';
              ctx.fillStyle = '#94a3b8';
              ctx.fillText(activeSession.memberName, 200, 160);

              // Status
              ctx.font = 'bold 16px sans-serif';
              ctx.fillStyle = isExpired ? '#f87171' : '#34d399';
              ctx.fillText(isExpired ? 'SESSION ENDED' : 'PLAYING', 200, 40);
          }
      }
  }, [remainingTime, isPipActive, isExpired, activeSession]);

  const togglePiP = async () => {
      if (!videoRef.current) return;

      try {
          if (document.pictureInPictureElement) {
              await document.exitPictureInPicture();
              setIsPipActive(false);
          } else {
              // Ensure video source is the canvas stream
              if (canvasRef.current) {
                  const stream = canvasRef.current.captureStream(1); // 1 FPS update is enough for timer
                  videoRef.current.srcObject = stream;
                  await videoRef.current.play(); // Must play to start stream
                  await videoRef.current.requestPictureInPicture();
                  setIsPipActive(true);
              }
          }
      } catch (err) {
          console.error("PiP Error:", err);
          alert("Fitur Picture-in-Picture tidak didukung atau diblokir.");
      }
  };

  const handleAssign = (id: string) => {
    localStorage.setItem('tv_assigned_console_id', id);
    setAssignedConsoleId(id);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
  };

  const activeConsole = consoles.find(c => c.id === assignedConsoleId);

  // -- SETUP VIEW --
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

  // -- HUD MODE --
  return (
    <div className="min-h-screen bg-black relative overflow-hidden font-mono cursor-none selection:bg-none">
      
      {/* Hidden Video/Canvas for PiP */}
      <canvas ref={canvasRef} className="hidden" />
      <video ref={videoRef} className="hidden" muted playsInline />

      {/* CONTROLS (Top Left - Hover to show) */}
      <div className="fixed top-4 left-4 z-[100] flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
          <button 
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 rounded-full text-white/50 hover:text-white hover:bg-white/20 transition-all"
            title="Fullscreen"
          >
            <Maximize2 size={20} />
          </button>
          <button 
            onClick={togglePiP}
            className={`p-2 rounded-full transition-all ${isPipActive ? 'bg-palette-mustard text-white' : 'bg-white/10 text-white/50 hover:text-white hover:bg-white/20'}`}
            title="Picture-in-Picture"
          >
            <PictureInPicture size={20} />
          </button>
          <button 
            onClick={() => { if(confirm('Reset TV ID?')) { localStorage.removeItem('tv_assigned_console_id'); setAssignedConsoleId(null); }}}
            className="p-2 bg-red-500/20 rounded-full text-red-400 hover:bg-red-500 hover:text-white transition-all"
            title="Reset"
          >
            <Power size={20} />
          </button>
      </div>

      {/* 
         HUD CONTAINER - UPDATED POSITION & SIZE
         Position: Fixed Top Right
         Size: Small (approx 18px font base)
      */}
      {activeSession ? (
        <div 
            className="fixed top-8 right-8 z-[9999] transition-transform duration-1000 ease-in-out origin-top-right"
            style={{ transform: `translate(${shiftPos.x}px, ${shiftPos.y}px)` }}
        >
            <div className={`
                flex flex-col items-end px-5 py-3 rounded-2xl border shadow-xl backdrop-blur-md min-w-[200px]
                ${isExpired 
                    ? 'bg-red-950/80 border-red-500/50 shadow-red-900/20' 
                    : 'bg-slate-900/80 border-white/10 shadow-black/50'
                }
            `}>
                {/* Status Badge */}
                <div className="flex items-center gap-2 mb-1">
                    <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500 animate-ping' : 'bg-emerald-500 animate-pulse'}`}></div>
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isExpired ? 'text-red-300' : 'text-emerald-400'}`}>
                        {isExpired ? t('session_ended') : 'PLAYING'}
                    </span>
                </div>
                
                {/* TIMER - Compact Size (18px - 24px visual weight) */}
                <div className={`
                    font-mono font-bold leading-none tracking-tight tabular-nums
                    ${isExpired ? 'text-red-400' : 'text-white'}
                `}
                style={{ fontSize: '28px' }} 
                >
                    {remainingTime}
                </div>

                {/* Member Info */}
                <div className="mt-1 flex items-center gap-1.5 opacity-80">
                    <Gamepad2 size={12} className="text-slate-400"/>
                    <span className="text-[12px] font-semibold text-slate-300 max-w-[150px] truncate text-right">
                        {activeSession.memberName}
                    </span>
                </div>
            </div>
        </div>
      ) : (
        /* IDLE STATE */
        <div className="fixed inset-0 flex items-center justify-center opacity-30">
            <div 
                className="flex flex-col items-center transition-transform duration-1000"
                style={{ transform: `translate(${shiftPos.x}px, ${shiftPos.y}px)` }}
            >
                <div className="p-6 rounded-full bg-slate-900/50 border-4 border-slate-800 animate-pulse-slow">
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

    </div>
  );
};

export default TVReceiver;
