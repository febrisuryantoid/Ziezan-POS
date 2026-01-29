
import React, { useState, MouseEvent } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, AlertCircle, Gamepad2, Crown } from 'lucide-react';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import DragonIcon from './DragonIcon';

const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  const { members, transactions, membershipConfigs } = useData();
  const { t, language } = useLanguage();

  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const rotateX = (y / height - 0.5) * -25; // Invert for natural feel
    const rotateY = (x / width - 0.5) * 25;
    
    setStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      '--mouse-x': `${x}px`,
      '--mouse-y': `${y}px`,
    } as React.CSSProperties);
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    });
  };

  const member = members.find(m => 
    (m.nickname || '').toLowerCase() === nickname.toLowerCase() || 
    (m.name || '').toLowerCase() === nickname.toLowerCase()
  );

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

  const isMaxTier = member.membershipId === 'MYTHICAL_IMMORTAL';
  let nextTierName = '';
  let hoursToNext = 0;
  
  if (!isMaxTier) {
      const sortedConfigs = [...membershipConfigs].sort((a, b) => a.minHours - b.minHours);
      const currentIndex = sortedConfigs.findIndex(c => c.id === member.membershipId);
      if (currentIndex !== -1 && currentIndex < sortedConfigs.length - 1) {
          const nextConfig = sortedConfigs[currentIndex + 1];
          nextTierName = nextConfig.name;
          hoursToNext = nextConfig.minHours - member.totalPlayTime;
      }
  }

  let currentTarget = 6;
  if (member.totalPlayTime >= 301) currentTarget = 3;
  else if (member.totalPlayTime >= 121) currentTarget = 4;
  else if (member.totalPlayTime >= 31) currentTarget = 5;

  return (
    <div 
      className="h-[100dvh] w-full bg-[#050505] text-white font-sans relative flex items-center justify-center overflow-hidden [perspective:1000px]"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <GamingBackground />
      
      {/* -- CARD CONTAINER -- */}
      <div 
        className="relative w-[92vw] max-w-[480px] aspect-[1.7/1] animate-fade-in transition-transform duration-300 ease-out"
        style={style}
      >
          {/* Efek Border Berputar */}
          <div className="absolute -inset-px rounded-[26px] overflow-hidden z-20 pointer-events-none">
              <div className={`absolute inset-[-150%] animate-spin-border bg-[conic-gradient(from_90deg_at_50%_50%,#E2CBFF_0%,#393BB2_50%,#E2CBFF_100%)] opacity-50`}></div>
          </div>

          {/* Glow Tambahan */}
          <div className="absolute -inset-8 bg-gradient-to-r from-purple-600 to-cyan-400 opacity-20 blur-3xl rounded-full animate-pulse-slow"></div>

          {/* Kartu (Content) */}
          <div className="relative h-full w-full rounded-[25px] overflow-hidden bg-[#0D0D15]/80 backdrop-blur-2xl flex flex-col border border-white/10 shadow-2xl card-inner">
              
              {/* Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-white/5 opacity-50"></div>
              
              {/* Watermark Logo SVG */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
                  <DragonIcon className="w-[85%] h-[85%] opacity-20 text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 animate-[pulse_8s_ease-in-out_infinite]" />
              </div>

              {/* Holographic Glare Effect */}
              <div 
                className="absolute inset-0 z-10 opacity-0 transition-opacity duration-500 card-glow"
                style={{ background: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), hsla(0,0%,100%,.12) 0%, transparent 40%)' }}
              ></div>

              {/* CARD DETAILS */}
              <div className="relative z-20 p-5 sm:p-6 flex flex-col h-full justify-between">
                  <header className="flex justify-between items-start [animation:fade-in_0.5s_0.2s_backwards]">
                      <div className={`p-2 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg`}>
                         <img src={theme.iconUrl} className="w-8 h-8 sm:w-10 sm:h-10 object-contain drop-shadow-lg" alt={theme.name} />
                      </div>
                       {/* Chip Holografik */}
                      <div className="w-10 h-8 sm:w-12 sm:h-10 rounded-md bg-gradient-to-br from-white/20 to-transparent border border-white/20 flex items-center justify-center">
                          <div className="w-3/4 h-2/3 bg-gradient-to-br from-slate-600 to-slate-800 rounded-sm border border-slate-500"></div>
                      </div>
                  </header>

                  <main className="flex-1 flex flex-col justify-center">
                     <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-widest text-white/90 drop-shadow-lg [animation:fade-in_0.5s_0.4s_backwards]">
                        {member.nickname}
                     </h2>
                     <p className={`text-sm font-bold uppercase tracking-[0.3em] mt-1 opacity-80 ${theme.text} drop-shadow-md [animation:fade-in_0.5s_0.6s_backwards]`}>
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
       <style>{`
          .card-inner:hover .card-glow { opacity: 1; }
          @keyframes shimmer { 0% { transform: translateX(-100%) skewX(-20deg); } 100% { transform: translateX(200%) skewX(-20deg); } }
       `}</style>
    </div>
  );
};

export default PublicMemberCard;
