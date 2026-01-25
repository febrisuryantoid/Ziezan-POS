
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, AlertCircle, Gamepad2, Crown } from 'lucide-react';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import DragonIcon from './DragonIcon';

const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  const { members, transactions, membershipConfigs } = useData();
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

  // Calculate Logic for Next Tier
  const isMaxTier = member.membershipId === 'MYTHICAL_IMMORTAL';
  let nextTierName = '';
  let hoursToNext = 0;
  
  if (!isMaxTier) {
      const currentConfig = membershipConfigs.find(c => c.id === member.membershipId);
      // Sort to find next
      const sortedConfigs = [...membershipConfigs].sort((a, b) => a.minHours - b.minHours);
      const currentIndex = sortedConfigs.findIndex(c => c.id === member.membershipId);
      if (currentIndex !== -1 && currentIndex < sortedConfigs.length - 1) {
          const nextConfig = sortedConfigs[currentIndex + 1];
          nextTierName = nextConfig.name;
          hoursToNext = nextConfig.minHours - member.totalPlayTime;
      }
  }

  // Bonus Logic Display
  let currentTarget = 6;
  if (member.totalPlayTime >= 301) currentTarget = 3;
  else if (member.totalPlayTime >= 121) currentTarget = 4;
  else if (member.totalPlayTime >= 31) currentTarget = 5;

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
              
              {/* Watermark Logo SVG - REPLACED WITH DRAGON ICON */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  <DragonIcon className={`w-[85%] h-[85%] opacity-15 ${theme.text}`} />
              </div>

              {/* CARD DETAILS (Bottom Overlay) */}
              <div className="relative z-10 p-6 flex flex-col h-full justify-between">
                  <div>
                      <div className="flex justify-between items-start">
                          <div className={`p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-lg ${theme.text}`}>
                             <img src={theme.iconUrl} className="w-8 h-8 object-contain" alt={theme.name} />
                          </div>
                          {isPlaying && (
                              <div className="px-3 py-1 rounded-full bg-red-500/20 border border-red-500 text-red-400 text-[10px] font-black uppercase tracking-widest animate-pulse flex items-center gap-2">
                                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                  {t('live_status')}
                              </div>
                          )}
                          {isMaxTier && !isPlaying && (
                              <div className="px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500 text-yellow-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                  Status: MAX TIER
                              </div>
                          )}
                      </div>
                      <div className="mt-6">
                          <h2 className="text-3xl font-black uppercase tracking-tight leading-none drop-shadow-lg">{member.nickname}</h2>
                          <p className={`text-sm font-bold uppercase tracking-[0.3em] mt-2 opacity-80 ${theme.text}`}>{theme.name}</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                       <div className="grid grid-cols-2 gap-3">
                          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5">
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Total Main (Berbayar)</p>
                              <p className="text-2xl font-black font-mono">{member.totalPlayTime}h</p>
                          </div>
                          <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 border border-white/5 relative overflow-hidden">
                              <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Bonus Jam</p>
                              <p className={`text-2xl font-black font-mono ${member.freeHoursBalance > 0 ? 'text-emerald-400' : 'text-white'}`}>{member.freeHoursBalance}h</p>
                              <div className="absolute bottom-2 right-2 text-[8px] text-slate-500 font-bold opacity-60">
                                  Main {currentTarget} Jam → +1
                              </div>
                          </div>
                       </div>
                       
                       {!isMaxTier && (
                           <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                               <div className={`h-full bg-gradient-to-r ${theme.conic}`} style={{ width: `${Math.min(100, (member.hoursProgressToNextBonus / currentTarget) * 100)}%` }}></div>
                           </div>
                       )}
                       
                       <div className="text-center flex justify-between items-center text-[9px] font-bold uppercase tracking-widest opacity-50 px-1">
                          <span>{t('joined')} {joinDate}</span>
                          {!isMaxTier && <span>Menuju {nextTierName}: {hoursToNext}h</span>}
                       </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default PublicMemberCard;
