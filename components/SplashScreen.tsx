
import React, { useState } from 'react';
import { Gamepad2, Users, Cloud, Printer, ArrowRight } from 'lucide-react';
import GamingBackground from './GamingBackground';

interface SplashScreenProps {
  onComplete: () => void;
}

const features = [
  {
    icon: Gamepad2,
    title: "Real-time Console Control",
    description: "Monitor and manage all PlayStation units from one screen with automatic timers.",
  },
  {
    icon: Users,
    title: "Advanced Member System",
    description: "Build customer loyalty with a tiered ranking system, playtime bonuses, and digital member cards.",
  },
  {
    icon: Cloud,
    title: "Smart Cloud Sync",
    description: "Your data is always safe and accessible. Work offline and sync automatically when connected.",
  },
  {
    icon: Printer,
    title: "Bluetooth Receipt Printing",
    description: "Print transaction receipts directly to a thermal printer without needing a PC or cables.",
  },
];

const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < features.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  const currentFeature = features[step];

  return (
    <div className="h-[100dvh] w-full bg-[#050b14] relative overflow-hidden flex flex-col items-center justify-between p-6 sm:p-8 text-white font-sans">
      <GamingBackground />
      
      <div className="relative z-10 w-full flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img src="https://beeimg.com/images/t47564105964.png" alt="Logo" className="w-8 h-8 rounded-lg" />
          <span className="font-bold text-lg tracking-tighter">Ziezan Station</span>
        </div>
        <button onClick={onComplete} className="text-sm font-bold text-slate-400 hover:text-white transition-colors">
          Skip
        </button>
      </div>

      <div className="relative z-10 w-full max-w-md text-center flex flex-col items-center">
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full animate-pulse-slow"></div>
          <div className="relative w-28 h-28 bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl flex items-center justify-center shadow-2xl">
            {currentFeature && currentFeature.icon && React.createElement(currentFeature.icon, { size: 56, className: "text-primary drop-shadow-lg", strokeWidth: 1.5 })}
          </div>
        </div>
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
          {currentFeature?.title}
        </h2>
        <p className="text-base text-slate-400 max-w-xs mx-auto leading-relaxed">
          {currentFeature?.description}
        </p>
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        <div className="flex items-center gap-2 mb-6">
          {features.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === step ? 'bg-primary scale-125' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="w-full h-14 bg-primary rounded-2xl font-bold text-lg text-white flex items-center justify-center gap-3 shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
        >
          {step === features.length - 1 ? "Get Started" : "Next"}
          {step < features.length - 1 && <ArrowRight size={20} />}
        </button>
      </div>
    </div>
  );
};

export default SplashScreen;
