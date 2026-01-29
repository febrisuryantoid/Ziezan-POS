
import React, { useState, MouseEvent } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, AlertCircle, QrCode } from 'lucide-react';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import DragonIcon from './DragonIcon';
import { useData } from '../contexts/DataContext';

const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  const { members, transactions } = useData();
  const { t, language } = useLanguage();

  const [style, setStyle] = useState<React.CSSProperties>({});

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY, currentTarget } = e;
    const { left, top, width, height } = currentTarget.getBoundingClientRect();
    const x = clientX - left;
    const y = clientY - top;
    const rotateX = (y / height - 0.5) * -15; 
    const rotateY = (x / width - 0.5) * 15;
    
    setStyle({
      transform: `perspective(2000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`,
      '--mouse-x': `${x}px`,
      '--mouse-y': `${y}px`,
    } as React.CSSProperties);
  };

  const handleMouseLeave = () => {
    setStyle({
      transform: 'perspective(2000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
    });
  };

  const member = members.find(m => 
    (m.nickname || '').toLowerCase() === nickname.toLowerCase() || 
    (m.name || '').toLowerCase() === nickname.toLowerCase()
  );

  if (members.length === 0) {
      return (
        <div className="h-[100dvh] w-full bg-[#050b14] flex flex-col items-center justify-center text-white p-4">
           {/* Loader can be added here */}
        </div>
      );
  }

  if (!member) {
    return (
      <div className="h-[100dvh] w-full bg-[#050b14] flex flex-col items-center justify-center text-white p-4">
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
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(window.location.href)}&bgcolor=0D0D15&color=FFFFFF&qzone=1&margin=0`;

  return (
    <div 
      className="min-h-[100dvh] w-full bg-[#050505] text-white font-sans relative flex items-center justify-center overflow-hidden p-4 sm:p-6"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <GamingBackground />
      
      <div 
        className="relative w-full max-w-[320px] sm:max-w-[560px] animate-fade-in transition-transform duration-300 ease-out group"
        style={style}
      >
          <div className={`absolute -inset-4 rounded-[3rem] ${theme.glow} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity duration-500 animate-pulse-slow`}></div>
          
          <div
              className="relative w-full p-0.5 rounded-[27px] overflow-hidden"
              style={{ background: `linear-gradient(0deg, ${theme.particleColor}20, transparent)`}}
          > 
              <div className="absolute inset-0 w-full h-full overflow-hidden rounded-[27px]">
                  <div 
                      className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] animate-border-glow-anim"
                      style={{'--tier-color': theme.particleColor, background: `conic-gradient(from 180deg at 50% 50%, transparent 50%, var(--tier-color) 75%, transparent 100%)`} as React.CSSProperties}
                  />
              </div>

              <div className="relative h-full w-full rounded-[25px] overflow-hidden bg-[#0D0D15]/80 backdrop-blur-2xl flex flex-col md:flex-row shadow-2xl shimmer-surface">
                  
                  <div className={`absolute inset-0 ${theme.bg_tint} opacity-60 pointer-events-none`}></div>
                  
                  <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none z-0">
                      <DragonIcon className={`w-[85%] h-[85%] opacity-[0.07] blur-[3px] text-transparent bg-clip-text bg-gradient-to-br ${theme.dragon_gradient}`} />
                  </div>

                  <div 
                    className="absolute inset-0 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: 'radial-gradient(circle at var(--mouse-x) var(--mouse-y), hsla(0,0%,100%,.12) 0%, transparent 40%)' }}
                  ></div>

                  {/* -- MAIN CONTENT FLEX CONTAINER -- */}
                  <div className="relative z-20 p-5 sm:p-6 flex flex-col md:flex-row w-full gap-5">
                      
                      {/* LEFT/TOP SECTION (Profile) */}
                      <div className="flex-shrink-0 md:w-2/5 flex flex-col items-center md:items-start text-center md:text-left">
                          <div className={`relative p-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg mb-4`}>
                             <img src={theme.iconUrl} className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-lg" alt={theme.name} />
                          </div>
                          <h2 className="text-[clamp(1.5rem,6vw,2.5rem)] font-black uppercase tracking-widest text-white/95 drop-shadow-lg leading-none">
                            {member.nickname}
                          </h2>
                          <p className={`text-base font-bold uppercase tracking-[0.3em] mt-2 opacity-80 ${theme.text_primary} drop-shadow-md`}>
                            {theme.name}
                          </p>
                          <span className="mt-4 md:mt-auto text-[9px] text-slate-500 font-bold uppercase tracking-widest opacity-80">ID: ZS-{member.id.substring(0,6).toUpperCase()}</span>
                      </div>

                      {/* RIGHT/BOTTOM SECTION (Stats & QR) */}
                      <div className="flex-1 flex flex-col justify-between gap-4">
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-inner">
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Main</p>
                                  <p className="text-2xl sm:text-3xl font-black font-mono text-white/90">{member.totalPlayTime}<span className="text-sm">h</span></p>
                              </div>
                              <div className="bg-black/20 backdrop-blur-md rounded-xl p-3 border border-white/5 shadow-inner">
                                  <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Bonus Jam</p>
                                  <p className={`text-2xl sm:text-3xl font-black font-mono ${member.freeHoursBalance > 0 ? 'text-emerald-400' : 'text-white/90'}`}>{member.freeHoursBalance}<span className="text-sm">h</span></p>
                              </div>
                          </div>
                          
                          <div className="flex gap-4 items-center bg-black/20 p-3 rounded-xl border border-white/5 shadow-inner">
                              <div className={`p-2 rounded-lg border-2 ${theme.border_glow} bg-black/50 shadow-lg`}>
                                 <img src={qrCodeUrl} alt="QR Profile" className="w-16 h-16 sm:w-20 sm:h-20" />
                              </div>
                              <div className="flex flex-col">
                                  <QrCode size={16} className={`mb-1 ${theme.text_primary}`} />
                                  <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-300">Scan Profile</p>
                                  <p className="text-[9px] text-slate-500">{t('joined')} {joinDate}</p>
                              </div>
                          </div>

                          <a href="/rank" className="w-full text-center mt-2 p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors text-slate-400 hover:text-white text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
                             <Trophy size={12} /> Lihat Papan Juara
                          </a>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PublicMemberCard;