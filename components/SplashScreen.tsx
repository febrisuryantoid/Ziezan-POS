
import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

const SplashScreen: React.FC = () => {
  const [loadingStep, setLoadingStep] = useState(0);
  const steps = [
      'INITIALIZING SYSTEM...', 
      'CONNECTING TO SERVER...', 
      'SYNCING DATA...', 
      'READY TO LAUNCH'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
        setLoadingStep(prev => (prev < steps.length - 1 ? prev + 1 : prev));
    }, 700);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col bg-gradient-to-br from-palette-mustard via-palette-purple to-palette-navy bg-[length:400%_400%] animate-gradient-xy text-white overflow-hidden selection:bg-none cursor-wait h-[100dvh] w-full">
       
       <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vmin] h-[60vmin] bg-white/10 rounded-full blur-[100px] animate-pulse-slow pointer-events-none"></div>

       <div className="flex-1 flex flex-col items-center justify-evenly w-full min-h-0 px-6 py-4 relative z-10">
          
          <div className="hidden sm:block flex-[0.5]"></div>

          <div className="relative shrink-0 group">
            <div className="absolute inset-0 bg-white/30 blur-2xl rounded-full scale-110 animate-pulse-slow"></div>
            
            <img 
              src="https://beeimg.com/images/t47564105964.png" 
              alt="Ziezan POS" 
              className="w-[25vmin] h-[25vmin] max-w-[160px] max-h-[160px] rounded-[22%] shadow-2xl shadow-palette-navy/50 relative z-10 object-cover ring-1 ring-white/20 animate-zoom-in"
            />
          </div>

          <div className="text-center space-y-2 shrink-0 animate-slide-in max-w-full">
             <h1 className="text-[clamp(1.5rem,5vmin,3rem)] font-extrabold tracking-tight text-white drop-shadow-md font-sans truncate leading-tight">
               Ziezan Station
             </h1>
             <div className="h-1 w-[15vmin] bg-white/30 mx-auto rounded-full my-[2vmin]"></div>
             <p className="text-white/90 text-[clamp(0.7rem,2.5vmin,1rem)] font-medium tracking-[0.2em] uppercase">
               PlayStation Rental System
             </p>
          </div>

          <div className="flex flex-col items-center gap-2 h-10 shrink-0 justify-center">
             <Loader2 className="w-[5vmin] h-[5vmin] max-w-[24px] max-h-[24px] animate-spin text-white/80" />
             <span className="text-[10px] sm:text-xs text-white/60 font-mono tracking-widest uppercase font-bold min-w-[180px] text-center">
               {steps[loadingStep]}
             </span>
          </div>

           <div className="shrink-0 flex flex-col items-center gap-1 text-white/40 text-[10px] font-medium tracking-wide">
              <span>v1.1.0 (Stable)</span>
              <span>&copy; 2026 Febri Suryanto</span>
           </div>
       </div>
    </div>
  );
};

export default SplashScreen;
