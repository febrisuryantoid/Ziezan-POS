
import React, { useState, MouseEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, AlertCircle, Gamepad2, Crown } from 'lucide-react';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import DragonIcon from './DragonIcon';
// FIX: Reverted to use DataContext as query hooks are not implemented.
import { useData } from '../contexts/DataContext';

const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  // FIX: Reverted to use DataContext to fetch local data.
  const { members, transactions } = useData();
  
  const { t, language } = useLanguage();

  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const rotateX = (y / height - 0.5) * -20; // Reduced intensity
    const rotateY = (x / width - 0.5) * 20;
    
    setStyle({
      transform: `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      '--mouse-x': `${x}px`,
      '--mouse-y': `${y}px`,
    } as React.CSSProperties);
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1500px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    });
  };

  const member = members.find(m => 
    (m.nickname || '').toLowerCase() === nickname.toLowerCase() || 
    (m.name || '').toLowerCase() === nickname.toLowerCase()
  );

  if (members.length === 0) {
      return (
        <div className="h-screen w-full bg-[#050b14] flex flex-col items-center justify-center text-white p-4">
           {/* You can add a loader here */}
        </div>
      );
  }

  if (!member) {
    return (
      <div className="h-screen w-full bg-[#050b14] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold">{t('member_not_found_title')}</h1>
        <p className="text-slate-400 mt-2 text-center">{t('member_not_found_desc')}</p>
        <a href="/" className="mt-8 px-6 py-3 bg-palette-mustard rounded-xl text-sm font-bold shadow-lg shadow-palette-mustard/30 hover:scale-105 transition-all">{t('back_home')}</a>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const isPlaying = transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');
  const joinDate = new Date(member.joinDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div 
      className="h-[100dvh] w-full bg-[#050505] text-white font-sans relative flex items-center justify-center overflow-hidden [perspective:1000px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <GamingBackground />
      
      {/* -- CARD CONTAINER -- */}
      <div 
        className="relative w-[92vw] max-w-[480px] aspect-[1.7/1] animate-fade-in transition-transform duration-300 ease-out group"
        style={style}
      >
          {/* NEW: Aura/Glow effect */}
          <div className={`absolute -inset-4 rounded-[3rem] ${theme.glow} blur-2xl opacity-50 group-hover:opacity-75 transition-opacity duration-500 animate-pulse-slow`}></div>
          
          {/* Card (Content) */}
          <div className={`relative h-full w-full rounded-[25px] overflow-hidden bg-[#0D0D15]/80 backdrop-blur-2xl flex flex-col border ${theme.border_glow} shadow-2xl card-inner`}>
              
              {/* NEW: Tier-specific background tint */}
              <div className={`absolute inset-0 ${theme.bg_tint} opacity-60`}></div>
              
              {/* NEW: DragonIcon as tier-colored watermark */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
                  <DragonIcon className={`w-[85%] h-[85%] opacity-10 blur-[2px] text-transparent bg-clip-text bg-gradient-to-br ${theme.dragon_gradient}`} />
              </div>

              {/* Holographic Glare Effect */}
              <div 
                className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), hsla(0,0%,100%,.12) 0%, transparent 40%)' }}
              ></div>

              {/* CARD DETAILS */}
              <div className="relative z-20 p-5 sm:p-6 flex flex-col h-full justify-between">
                  <header className="flex justify-between items-start [animation:fade-in_0.5s_0.2s_backwards]">
                      <div className={`p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg`}>
                         <img src={theme.iconUrl} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg" alt={theme.name} />
                      </div>
                      <div className="w-10 h-8 sm:w-12 sm:h-10 rounded-md bg-gradient-to-br from-white/20 to-transparent border border-white/20 flex items-center justify-center">
                          <div className="w-3/4 h-2/3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-sm border border-slate-500"></div>
                      </div>
                  </header>

                  <main className="flex-1 flex flex-col justify-center">
                     <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-white/90 drop-shadow-lg [animation:fade-in_0.5s_0.4s_backwards]">
                        {member.nickname}
                     </h2>
                     <p className={`text-sm font-bold uppercase tracking-[0.3em] mt-1 opacity-80 ${theme.text_primary} drop-shadow-md [animation:fade-in_0.5s_0.6s_backwards]`}>
                        {theme.name}
                     </p>
                  </main>

                  <footer className="space-y-3 [animation:fade-in_0.5s_0.8s_backwards]">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/5">
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Main</p>
                              <p className="text-xl sm:text-2xl font-black font-mono text-white/90">{member.totalPlayTime}<span className="text-xs">h</span></p>
                          </div>
                          <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/5">
                              <p className="text-[8px] sm:text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Bonus Jam</p>
                              <p className={`text-xl sm:text-2xl font-black font-mono ${member.freeHoursBalance > 0 ? 'text-emerald-400' : 'text-white/90'}`}>{member.freeHoursBalance}<span className="text-xs">h</span></p>
                          </div>
                       </div>
                       
                       <div className="flex justify-between items-center text-[8px] sm:text-[9px] font-bold uppercase tracking-widest opacity-60 px-1">
                          <span>ID: ZS-{member.id.substring(0,6).toUpperCase()}</span>
                          <span>{t('joined')} {joinDate}</span>
                       </div>
                  </footer>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PublicMemberCard;
