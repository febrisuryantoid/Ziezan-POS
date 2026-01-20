
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTierTheme, GamingBackground } from './PublicMemberCard';
import { Trophy, Search, Loader2, Flame, Gamepad2, Crown, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import { Member } from '../types';

const Leaderboard: React.FC = () => {
  const { members, transactions, refreshData } = useData();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Auto-refresh data
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => refreshData(), 30000);
    const timer = setTimeout(() => setLoading(false), 800); 
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [refreshData]);

  // Helper: Calculate Realtime Score
  const getRealtimeScore = (member: Member) => {
      const activeTx = transactions.find(t => t.memberId === member.id && t.status === 'ACTIVE');
      return member.totalPlayTime + (activeTx ? activeTx.durationHours : 0);
  };

  // Sort by Playtime
  const allRankings = useMemo(() => {
      const sorted = [...members].sort((a, b) => getRealtimeScore(b) - getRealtimeScore(a));
      return sorted;
  }, [members, transactions]);

  const filteredRankings = useMemo(() => {
      return allRankings.filter(m => m.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allRankings, searchTerm]);

  // Split into Podium (Top 3) and Challengers (Rest)
  const top3 = allRankings.slice(0, 3);
  
  // Fill empty spots if less than 3 members
  const filledTop3 = [
      top3[0] || null, 
      top3[1] || null, 
      top3[2] || null
  ];

  const challengers = filteredRankings.filter(m => !top3.map(t => t?.id).includes(m.id));
  
  if (loading) {
      return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-palette-mustard" />
        </div>
      );
  }

  // --- SUB-COMPONENTS ---

  const PodiumPillar = ({ member, rank }: { member: Member | null, rank: number }) => {
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;

      const score = member ? getRealtimeScore(member) : 0;
      const theme = member ? getTierTheme(member.membershipId) : null;
      const isPlaying = member ? transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE') : false;

      // Visual Config (Geometry)
      let pillarHeightClass = 'h-24 sm:h-32'; 
      let avatarSizeClass = 'w-16 h-16 sm:w-20 sm:h-20';
      let zIndex = 'z-10';
      let translateY = 'translate-y-0';
      let numberSize = 'w-6 h-6 text-xs';
      
      const textClass = theme ? theme.text : 'text-slate-600';
      const badgeColor = theme ? theme.badge : 'bg-slate-800 text-slate-400';
      const particleColor = theme ? theme.particleColor : '#94a3b8';

      if (isFirst) {
          pillarHeightClass = 'h-36 sm:h-48'; 
          avatarSizeClass = 'w-24 h-24 sm:w-28 sm:h-28';
          zIndex = 'z-30';
          translateY = '-translate-y-4 sm:-translate-y-6';
          numberSize = 'w-8 h-8 text-sm';
      } else if (isSecond) {
          pillarHeightClass = 'h-28 sm:h-36';
          avatarSizeClass = 'w-16 h-16 sm:w-20 sm:h-20';
          zIndex = 'z-20';
          translateY = 'translate-y-0';
      } else if (isThird) {
          translateY = 'translate-y-3 sm:translate-y-4';
      }

      // Empty State
      if (!member || !theme) {
          return (
              <div className={`flex flex-col items-center justify-end w-1/3 ${translateY} opacity-20 px-1`}>
                  <div className={`${avatarSizeClass} rounded-full bg-white/5 border-2 border-dashed border-white/20 mb-4`}></div>
                  <div className={`w-full ${pillarHeightClass} rounded-t-2xl border-t border-x border-white/5 bg-gradient-to-b from-white/5 to-transparent`}></div>
              </div>
          );
      }

      // CLICKABLE WRAPPER
      return (
          <a 
            href={`/member/${encodeURIComponent(member.nickname)}`}
            className={`flex flex-col items-center justify-end w-1/3 transition-all duration-700 ${translateY} ${zIndex} relative group px-1 sm:px-2 cursor-pointer no-underline`}
          >
              
              {/* Avatar Container */}
              <div className="relative mb-3 flex flex-col items-center">
                  {/* Crown for #1 */}
                  {isFirst && (
                      <Crown 
                        size={isFirst ? 36 : 24} 
                        fill="currentColor" 
                        className={`${textClass} absolute -top-10 sm:-top-12 animate-bounce drop-shadow-[0_0_15px_currentColor] z-20`} 
                      />
                  )}

                  {/* Image Ring */}
                  <div className={`relative rounded-full p-[3px] bg-gradient-to-tr ${theme.conic} shadow-[0_0_20px_-5px_currentColor] ${textClass} group-hover:scale-105 transition-transform duration-300`}>
                      <div className={`${avatarSizeClass} rounded-full overflow-hidden bg-black relative`}>
                          <img 
                            src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                            className="w-full h-full object-cover" 
                            alt={member.nickname}
                          />
                          {/* Live Indicator */}
                          {isPlaying && (
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                                  <Gamepad2 size={isFirst ? 24 : 16} className="text-emerald-400 animate-pulse drop-shadow-md" />
                              </div>
                          )}
                      </div>
                      
                      {/* Rank Badge Number */}
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 ${numberSize} rounded-full flex items-center justify-center font-black border-4 border-[#020205] shadow-lg z-20 ${badgeColor}`}>
                          {rank}
                      </div>
                  </div>
                  
                  {/* Name & Tier */}
                  <div className="mt-5 text-center flex flex-col items-center">
                      <h3 className={`font-black text-xs sm:text-base leading-tight truncate max-w-[100px] sm:max-w-[140px] drop-shadow-md text-white mb-1`}>
                          {member.nickname}
                      </h3>
                      <div className="relative group/tier">
                          <img src={theme.iconUrl} alt={theme.id} className="w-5 h-5 sm:w-6 sm:h-6 object-contain drop-shadow-md" />
                      </div>
                  </div>
              </div>

              {/* === ANIMATED PODIUM PILLAR === */}
              <div className="w-full relative px-0.5">
                  {/* Moving Border Animation */}
                  <div className={`absolute -inset-[2px] rounded-t-[24px] overflow-hidden`}>
                      <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-[spin_3s_linear_infinite] bg-[conic-gradient(transparent_0deg,transparent_90deg,currentColor_180deg,transparent_270deg,transparent_360deg)] ${textClass} opacity-80 blur-[2px]`}></div>
                  </div>

                  {/* The Inner Box (Main Pillar) */}
                  <div className={`w-full ${pillarHeightClass} rounded-t-[22px] bg-[#0f1016] relative z-10 flex flex-col items-center justify-start pt-3 pb-2 overflow-hidden`}>
                      
                      {/* Inner Shine */}
                      <div className={`absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r ${theme.conic} opacity-50`}></div>
                      <div className={`absolute bottom-0 inset-x-0 h-2/3 bg-gradient-to-t ${theme.conic} opacity-5`}></div>

                      <span className={`font-mono text-xl sm:text-3xl font-black tracking-tighter drop-shadow-lg ${textClass} mt-2 relative z-10`}>
                          {score.toFixed(0)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500 mt-0.5 relative z-10">
                          {t('hour_short')}
                      </span>
                      
                      {/* Center Glow Line for #1 */}
                      {isFirst && <div className={`mt-2 w-[1px] h-full bg-gradient-to-b ${theme.conic} opacity-50 blur-[1px]`}></div>}
                  </div>
              </div>
          </a>
      );
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="h-[100dvh] w-full bg-[#020205] text-white font-sans relative flex flex-col overflow-hidden">
        {/* Pass Gold Color for Leaderboard background glow */}
        <GamingBackground glowColor="#fbbf24" />
        
        {/* === SCROLLABLE CONTENT WRAPPER === */}
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar relative z-10 flex flex-col items-center">
            
            <div className="w-full max-w-3xl flex flex-col min-h-full">

                {/* --- HEADER --- */}
                <div className="pt-6 pb-2 px-6 text-center shrink-0">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2 backdrop-blur-md shadow-lg">
                        <Trophy size={12} className="text-yellow-400" />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{t('season_label')} {currentYear}</span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-sm">
                        {t('leaderboard_title')}
                    </h1>
                </div>

                {/* --- PODIUM SECTION --- */}
                <div className="flex-none px-4 pt-4 pb-2 relative w-full mb-[-10px] sm:mb-[-20px] z-0">
                    <div className="flex items-end justify-center gap-2 w-full max-w-lg mx-auto">
                        <PodiumPillar member={filledTop3[1]} rank={2} />
                        <PodiumPillar member={filledTop3[0]} rank={1} />
                        <PodiumPillar member={filledTop3[2]} rank={3} />
                    </div>
                </div>

                {/* --- LIST SECTION (The "Sheet") --- */}
                <div className="flex-1 bg-[#0f1016]/95 rounded-t-[35px] border-t border-white/10 shadow-[0_-10px_60px_-15px_rgba(0,0,0,1)] relative flex flex-col z-20 backdrop-blur-xl w-full">
                    
                    {/* Sheet Handle */}
                    <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-3 mb-2 shrink-0"></div>
                    
                    {/* Control Bar */}
                    <div className="px-4 sm:px-6 py-3 flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-white/5 shrink-0 bg-[#0f1016]/50 rounded-t-[30px]">
                        
                        <div className="flex items-center justify-between w-full sm:w-auto gap-4">
                            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                                <Flame size={14} className="text-orange-500" /> {t('challengers_title')}
                            </h3>
                            <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                {challengers.length} Player
                            </span>
                        </div>

                        {/* Search Bar */}
                        <div className="relative w-full sm:w-auto sm:min-w-[250px]">
                            <div className="relative flex items-center bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 focus-within:border-palette-mustard/50 focus-within:bg-black/60 transition-all shadow-inner group">
                                <Search className="text-slate-500 group-focus-within:text-white mr-2 transition-colors" size={14} />
                                <input 
                                    type="text" 
                                    placeholder={t('search_player')} 
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder-slate-600 w-full"
                                />
                            </div>
                        </div>
                    </div>

                    {/* List Items */}
                    <div className="p-3 sm:p-4 space-y-2 pb-10">
                        {challengers.length > 0 ? (
                            challengers.map((m, idx) => {
                                const actualRank = idx + 4;
                                const score = getRealtimeScore(m);
                                const theme = getTierTheme(m.membershipId);
                                const isPlaying = transactions.some(t => t.memberId === m.id && t.status === 'ACTIVE');

                                return (
                                    <a 
                                        key={m.id} 
                                        href={`/member/${encodeURIComponent(m.nickname)}`}
                                        className="group relative flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-200 active:scale-[0.99] cursor-pointer no-underline"
                                    >
                                        
                                        {/* Rank Number */}
                                        <div className="w-8 shrink-0 text-center font-black text-slate-600 text-sm sm:text-base group-hover:text-white transition-colors">
                                            {actualRank}
                                        </div>

                                        {/* Avatar */}
                                        <div className="relative shrink-0">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full p-[1.5px] bg-gradient-to-br ${theme.conic}`}>
                                                <img src={m.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full rounded-full object-cover bg-black" alt={m.nickname}/>
                                            </div>
                                            {isPlaying && (
                                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-[#0f1016] animate-pulse z-10"></div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-white transition-colors">{m.nickname}</h4>
                                                {m.membershipId.includes('MYTHIC') && <Sparkles size={12} className="text-yellow-500 animate-pulse" />}
                                            </div>
                                            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                                                <img src={theme.iconUrl} alt={m.membershipId} className="w-4 h-4 object-contain opacity-80" />
                                                <span className={`${theme.text} font-bold opacity-80`}>{m.membershipId.replace('MYTHICAL_', 'M.')}</span>
                                            </div>
                                        </div>

                                        {/* Score */}
                                        <div className="text-right shrink-0 px-2 sm:px-3 bg-black/20 py-1.5 rounded-lg border border-white/5 min-w-[70px]">
                                            <div className="font-mono font-black text-white text-sm sm:text-base tracking-tight leading-none">
                                                {score.toFixed(0)}
                                            </div>
                                            <div className="text-[8px] font-bold text-slate-600 uppercase tracking-wide leading-none mt-1">{t('hour_short')}</div>
                                        </div>
                                    </a>
                                );
                            })
                        ) : (
                            <div className="py-16 text-center flex flex-col items-center text-slate-700">
                                <Search size={24} className="mb-2 opacity-30"/>
                                <p className="text-xs font-medium uppercase tracking-widest">{t('no_other_players')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
