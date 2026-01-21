
import React from 'react';
import { LogIn, Tv, Trophy, ChevronRight } from 'lucide-react';
import GamingBackground from './GamingBackground';
import { useLanguage } from '../contexts/LanguageContext';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-[100dvh] w-full bg-[#050b14] relative overflow-hidden flex flex-col items-center justify-center p-6 text-white font-sans">
      <GamingBackground />
      
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center animate-fade-in py-10">
        <div className="text-center mb-12 sm:mb-16">
            {/* Logo Container */}
            <div className="w-24 h-24 sm:w-28 sm:h-28 bg-white/5 dark:bg-white/[0.05] rounded-[2rem] p-1 border border-white/20 shadow-2xl mx-auto mb-6 backdrop-blur-xl group cursor-pointer">
                <img 
                    src="https://beeimg.com/images/t47564105964.png" 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-105 transition-transform duration-500" 
                />
            </div>
            {/* Reduced from text-7xl to text-4xl/5xl based on new scale */}
            <h1 className="text-4xl sm:text-5xl font-black tracking-tighter drop-shadow-2xl mb-3 text-white">
                ZIEZAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-palette-mustard to-pink-500">STATION</span>
            </h1>
            <p className="text-slate-400 text-xs font-bold tracking-[0.4em] uppercase bg-black/40 px-6 py-2 rounded-full inline-block border border-white/10 backdrop-blur-md">
                {t('landing_subtitle')}
            </p>
        </div>

        {/* 
            Strict Responsive Grid:
            - Mobile: grid-cols-1 (Vertical stack)
            - Desktop: md:grid-cols-3 (Horizontal row)
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-5xl px-4">
            {/* 1. MASUK */}
            <button 
                onClick={() => onNavigate('/login')}
                className="group relative flex flex-col items-center p-8 rounded-[2.5rem] bg-white/5 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-palette-mustard/60 hover:bg-white/10 dark:hover:bg-white/[0.08] transition-all duration-500 hover:-translate-y-2 shadow-2xl overflow-hidden h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-palette-mustard/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-palette-mustard to-purple-700 flex items-center justify-center mb-6 shadow-2xl shadow-palette-mustard/40 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <LogIn size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 relative z-10 group-hover:text-palette-mustard transition-colors tracking-tight uppercase">{t('login_btn')}</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-8 relative z-10 font-medium">
                    {t('admin_access_desc')}
                </p>
                <div className="mt-auto w-full flex items-center justify-between text-xs font-black text-white uppercase tracking-widest relative z-10 bg-white/5 p-4 rounded-2xl group-hover:bg-palette-mustard group-hover:text-white transition-all">
                    <span>{t('admin_access')}</span>
                    <ChevronRight size={16} />
                </div>
            </button>

            {/* 2. MODE TV */}
            <button 
                onClick={() => onNavigate('/tv')}
                className="group relative flex flex-col items-center p-8 rounded-[2.5rem] bg-white/5 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-cyan-500/60 hover:bg-white/10 dark:hover:bg-white/[0.08] transition-all duration-500 hover:-translate-y-2 shadow-2xl overflow-hidden h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mb-6 shadow-2xl shadow-cyan-500/40 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <Tv size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 relative z-10 group-hover:text-cyan-400 transition-colors tracking-tight uppercase">{t('tv_mode')}</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-8 relative z-10 font-medium">
                    {t('tv_mode_desc')}
                </p>
                <div className="mt-auto w-full flex items-center justify-between text-xs font-black text-white uppercase tracking-widest relative z-10 bg-white/5 p-4 rounded-2xl group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    <span>{t('open_monitor')}</span>
                    <ChevronRight size={16} />
                </div>
            </button>

            {/* 3. RANK */}
            <button 
                onClick={() => onNavigate('/rank')}
                className="group relative flex flex-col items-center p-8 rounded-[2.5rem] bg-white/5 dark:bg-white/[0.03] backdrop-blur-2xl border border-white/10 hover:border-yellow-500/60 hover:bg-white/10 dark:hover:bg-white/[0.08] transition-all duration-500 hover:-translate-y-2 shadow-2xl overflow-hidden h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-700 flex items-center justify-center mb-6 shadow-2xl shadow-orange-500/40 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <Trophy size={28} className="text-white" />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 relative z-10 group-hover:text-yellow-400 transition-colors tracking-tight uppercase">{t('rank_btn')}</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-8 relative z-10 font-medium">
                    {t('rank_desc')}
                </p>
                <div className="mt-auto w-full flex items-center justify-between text-xs font-black text-white uppercase tracking-widest relative z-10 bg-white/5 p-4 rounded-2xl group-hover:bg-yellow-500 group-hover:text-white transition-all">
                    <span>{t('view_board')}</span>
                    <ChevronRight size={16} />
                </div>
            </button>
        </div>

        {/* Footer Section - Optimized for small screens (No Wrap) */}
        <div className="mt-16 w-full flex flex-col items-center gap-2">
            <div className="flex items-center gap-4 opacity-40">
                <div className="w-8 h-[1px] bg-white/20"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 whitespace-nowrap font-mono">
                    {t('system_version')}
                </span>
                <div className="w-8 h-[1px] bg-white/20"></div>
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest text-center whitespace-nowrap">
                &copy; 2026 Febri Suryanto
            </span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
