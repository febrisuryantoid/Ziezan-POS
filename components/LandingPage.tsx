
import React from 'react';
import { LogIn, Tv, Trophy, ChevronRight } from 'lucide-react';
import GamingBackground from './GamingBackground';

interface LandingPageProps {
  onNavigate: (path: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[100dvh] w-full bg-[#050b14] relative overflow-hidden flex flex-col items-center justify-center p-6 text-white font-sans">
      <GamingBackground />
      
      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center animate-fade-in py-10">
        <div className="text-center mb-12 sm:mb-20">
            {/* Logo Container - Removed rotate classes */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 bg-[#0f1016]/80 rounded-[2.5rem] p-1 border border-white/10 shadow-2xl mx-auto mb-8 backdrop-blur-md group cursor-pointer">
                <img 
                    src="https://beeimg.com/images/t47564105964.png" 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-[2.2rem] group-hover:scale-105 transition-transform duration-500" 
                />
            </div>
            <h1 className="text-4xl sm:text-7xl font-black tracking-tighter drop-shadow-2xl mb-3 text-white">
                ZIEZAN <span className="text-transparent bg-clip-text bg-gradient-to-r from-palette-mustard to-pink-500">STATION</span>
            </h1>
            <p className="text-slate-400 text-xs sm:text-lg font-bold tracking-[0.4em] uppercase bg-black/40 px-6 py-2 rounded-full inline-block border border-white/5 backdrop-blur-md">
                PlayStation Rental System
            </p>
        </div>

        {/* 
            Strict Responsive Grid:
            - Mobile: grid-cols-1 (Vertical stack)
            - Desktop: md:grid-cols-3 (Horizontal row)
        */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-6xl px-4">
            {/* 1. MASUK */}
            <button 
                onClick={() => onNavigate('/login')}
                className="group relative flex flex-col items-center p-10 rounded-[3rem] bg-[#0f1016]/50 backdrop-blur-2xl border border-white/10 hover:border-palette-mustard/60 hover:bg-[#0f1016]/90 transition-all duration-500 hover:-translate-y-3 shadow-2xl overflow-hidden h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-palette-mustard/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-palette-mustard to-purple-700 flex items-center justify-center mb-8 shadow-2xl shadow-palette-mustard/40 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <LogIn size={36} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 relative z-10 group-hover:text-palette-mustard transition-colors tracking-tight uppercase">Masuk</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-10 relative z-10 font-medium">
                    Akses dashboard pengelola untuk manajemen unit, member, dan keuangan.
                </p>
                <div className="mt-auto w-full flex items-center justify-between text-xs font-black text-white uppercase tracking-widest relative z-10 bg-white/5 p-4 rounded-2xl group-hover:bg-palette-mustard group-hover:text-white transition-all">
                    <span>Akses Admin</span>
                    <ChevronRight size={18} />
                </div>
            </button>

            {/* 2. MODE TV */}
            <button 
                onClick={() => onNavigate('/tv')}
                className="group relative flex flex-col items-center p-10 rounded-[3rem] bg-[#0f1016]/50 backdrop-blur-2xl border border-white/10 hover:border-cyan-500/60 hover:bg-[#0f1016]/90 transition-all duration-500 hover:-translate-y-3 shadow-2xl overflow-hidden h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center mb-8 shadow-2xl shadow-cyan-500/40 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <Tv size={36} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 relative z-10 group-hover:text-cyan-400 transition-colors tracking-tight uppercase">Mode TV</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-10 relative z-10 font-medium">
                    Tampilan layar penuh untuk monitor pelanggan dengan timer real-time.
                </p>
                <div className="mt-auto w-full flex items-center justify-between text-xs font-black text-white uppercase tracking-widest relative z-10 bg-white/5 p-4 rounded-2xl group-hover:bg-cyan-500 group-hover:text-white transition-all">
                    <span>Buka Monitor</span>
                    <ChevronRight size={18} />
                </div>
            </button>

            {/* 3. RANK */}
            <button 
                onClick={() => onNavigate('/rank')}
                className="group relative flex flex-col items-center p-10 rounded-[3rem] bg-[#0f1016]/50 backdrop-blur-2xl border border-white/10 hover:border-yellow-500/60 hover:bg-[#0f1016]/90 transition-all duration-500 hover:-translate-y-3 shadow-2xl overflow-hidden h-full"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="w-20 h-20 rounded-[1.5rem] bg-gradient-to-br from-yellow-400 to-orange-700 flex items-center justify-center mb-8 shadow-2xl shadow-orange-500/40 group-hover:scale-110 transition-transform duration-500 relative z-10">
                    <Trophy size={36} className="text-white" />
                </div>
                <h3 className="text-3xl font-black text-white mb-3 relative z-10 group-hover:text-yellow-400 transition-colors tracking-tight uppercase">Rank</h3>
                <p className="text-slate-400 text-sm text-center leading-relaxed mb-10 relative z-10 font-medium">
                    Lihat leaderboard top player, statistik bermain, dan pencapaian member.
                </p>
                <div className="mt-auto w-full flex items-center justify-between text-xs font-black text-white uppercase tracking-widest relative z-10 bg-white/5 p-4 rounded-2xl group-hover:bg-yellow-500 group-hover:text-white transition-all">
                    <span>Lihat Papan</span>
                    <ChevronRight size={18} />
                </div>
            </button>
        </div>

        <div className="mt-20 text-slate-600 text-[10px] font-mono uppercase tracking-[0.3em] flex flex-col items-center gap-3">
            <div className="flex items-center gap-4">
                <div className="w-8 h-[1px] bg-white/10"></div>
                <span>Ziezan Station System v1.1.0</span>
                <div className="w-8 h-[1px] bg-white/10"></div>
            </div>
            <span className="opacity-50">&copy; 2026 Febri Suryanto</span>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
