
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, AlertCircle, Gamepad2, Crown } from 'lucide-react';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';

const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  const { members, transactions } = useData();
  const { t, language } = useLanguage();

  // Find member
  const member = members.find(m => 
    m.nickname.toLowerCase() === nickname.toLowerCase() || 
    m.name.toLowerCase() === nickname.toLowerCase()
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
  const joinDate = new Date(member.joinDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
  });

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white font-sans relative flex items-center justify-center overflow-hidden">
      
      {/* Background Animasi Hexagon dari Landing Page */}
      <GamingBackground />
      
      {/* Container Utama Kartu */}
      <div className="relative w-[92vw] max-w-[480px] aspect-[1.7/1] animate-float group">
          
          {/* Efek Border Berputar */}
          <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
              <div className={`absolute inset-[-100%] animate-spin-border bg-[conic-gradient(from_0deg,transparent,currentColor,transparent,currentColor,transparent)] ${theme.text} opacity-80 blur-[2px]`}></div>
          </div>

          {/* Glow Tambahan */}
          <div className={`absolute -inset-4 bg-gradient-to-r ${theme.conic} opacity-20 blur-3xl rounded-full`}></div>

          {/* Kartu (Content) */}
          <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0f0720] shadow-2xl flex flex-col border border-white/5">
              
              {/* Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#0f0720] to-[#000000]"></div>
              <div className={`absolute inset-0 bg-gradient-to-tr ${theme.conic} opacity-10`}></div>
              
              {/* Watermark Logo (Replaced SVG with Icon for stability) */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  <Crown strokeWidth={0.5} className={`w-[85%] h-[85%] opacity-10 ${theme.text}`} />
              </div>

              {/* Content Container */}
              <div className="relative z-10 flex flex-col justify-end h-full px-6 pb-6">
                  
                  {/* Top Right: Status */}
                  <div className="absolute top-6 right-6 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                      <div className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]' : 'bg-slate-500'}`}></div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">
                          {isPlaying ? t('live_status') : 'OFFLINE'}
                      </span>
                  </div>

                  {/* Top Left: Logo */}
                  <div className="absolute top-6 left-6 w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-md p-2 border border-white/10 shadow-inner flex items-center justify-center">
                      <img src="https://beeimg.com/images/t47564105964.png" className="w-full h-full object-cover rounded-xl" />
                  </div>

                  {/* Main Info */}
                  <div className="space-y-1">
                      <div className="flex items-center gap-2">
                          <span className={`text-xs font-black uppercase tracking-[0.25em] ${theme.text} drop-shadow-md`}>{theme.name}</span>
                          <div className={`h-[1px] w-8 ${theme.bg}`}></div>
                      </div>
                      <h1 className="text-4xl sm:text-5xl font-black uppercase tracking-tight text-white drop-shadow-2xl truncate max-w-full">
                          {member.nickname}
                      </h1>
                      <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest pl-1">
                          {t('joined')} {joinDate}
                      </p>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-white/5">
                      <div className="bg-[#0a0a0a]/60 backdrop-blur-md rounded-xl p-3 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500">
                              <Gamepad2 size={14} />
                              <span className="text-[9px] font-black uppercase tracking-widest">{t('total_play')}</span>
                          </div>
                          <span className="font-mono font-bold text-white text-sm">{member.totalPlayTime.toFixed(0)} <span className="text-[9px] text-slate-500">Jam</span></span>
                      </div>
                      <div className="bg-[#0a0a0a]/60 backdrop-blur-md rounded-xl p-3 border border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-slate-500">
                              <Trophy size={14} className="text-yellow-500" />
                              <span className="text-[9px] font-black uppercase tracking-widest">{t('bonus_balance')}</span>
                          </div>
                          <span className="font-mono font-bold text-white text-sm">{member.freeHoursBalance} <span className="text-[9px] text-slate-500">Jam</span></span>
                      </div>
                  </div>
              </div>
          </div>

          {/* Bottom Branding */}
          <div className="mt-8 flex justify-center opacity-30 hover:opacity-100 transition-opacity">
              <a href="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-white">
                  <div className="w-1.5 h-1.5 bg-palette-mustard rounded-full"></div>
                  Ziezan Station
              </a>
          </div>
      </div>
    </div>
  );
};

export default PublicMemberCard;
