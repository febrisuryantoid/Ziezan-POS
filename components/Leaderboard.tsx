
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTierTheme, GamingBackground } from './PublicMemberCard';
import { Trophy, Search, Loader2, Flame, Gamepad2, Crown, ChevronUp, Hexagon } from 'lucide-react';
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
      return allRankings.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
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

  const PodiumPedestal = ({ member, rank }: { member: Member | null, rank: number }) => {
      // Configuration based on Rank (Gold, Silver, Bronze)
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;

      const score = member ? getRealtimeScore(member) : 0;
      const theme = member ? getTierTheme(member.membershipId) : null;
      const isPlaying = member ? transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE') : false;

      // Visual Config
      let height = 'h-32'; // Base pedestal height
      let colorClass = 'from-slate-700 to-slate-900';
      let borderClass = 'border-slate-600';
      let glowColor = 'bg-slate-500';
      let iconColor = 'text-slate-400';
      let scale = 'scale-90';
      let zIndex = 'z-10';
      let shineColor = '#64748b';

      if (isFirst) {
          height = 'h-48';
          colorClass = 'from-yellow-600/80 via-yellow-500/20 to-transparent';
          borderClass = 'border-yellow-400';
          glowColor = 'bg-yellow-400';
          iconColor = 'text-yellow-300';
          scale = 'scale-110 -translate-y-4';
          zIndex = 'z-30';
          shineColor = '#facc15'; // Gold
      } else if (isSecond) {
          height = 'h-36';
          colorClass = 'from-slate-400/60 via-slate-400/20 to-transparent';
          borderClass = 'border-slate-300';
          glowColor = 'bg-slate-300';
          iconColor = 'text-slate-200';
          scale = 'scale-100';
          zIndex = 'z-20';
          shineColor = '#cbd5e1'; // Silver
      } else if (isThird) {
          height = 'h-28';
          colorClass = 'from-orange-700/60 via-orange-600/20 to-transparent';
          borderClass = 'border-orange-500';
          glowColor = 'bg-orange-500';
          iconColor = 'text-orange-400';
          scale = 'scale-95 translate-y-2';
          zIndex = 'z-10';
          shineColor = '#f97316'; // Bronze
      }

      if (!member) {
          return (
              <div className={`flex flex-col items-center justify-end w-1/3 ${scale} opacity-30`}>
                  <div className={`w-16 h-16 rounded-full bg-white/5 border-2 border-dashed ${borderClass} mb-4`}></div>
                  <div className={`w-full ${height} rounded-t-2xl border-t border-x ${borderClass} bg-gradient-to-b ${colorClass}`}></div>
              </div>
          );
      }

      return (
          <div className={`flex flex-col items-center justify-end w-1/3 transition-all duration-700 ${scale} ${zIndex} relative`}>
              
              {/* === NEW: SHINING GOD-RAY ANIMATION === */}
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] -z-10 opacity-30 pointer-events-none">
                  <div 
                    className="w-full h-full animate-[spin_8s_linear_infinite]"
                    style={{
                        background: `conic-gradient(from 0deg, transparent 0deg, ${shineColor} 20deg, transparent 40deg, transparent 180deg, ${shineColor} 200deg, transparent 220deg)`,
                        filter: 'blur(20px)'
                    }}
                  ></div>
              </div>

              {/* Avatar Section */}
              <div className="relative mb-3 group cursor-pointer">
                  {isFirst && (
                      <Crown size={40} className="absolute -top-10 left-1/2 -translate-x-1/2 text-yellow-400 fill-yellow-400 animate-bounce drop-shadow-[0_0_15px_rgba(250,204,21,0.8)]" />
                  )}
                  
                  {/* Glow Ring */}
                  <div className={`absolute -inset-1 rounded-full blur-md opacity-60 ${glowColor} ${isFirst ? 'animate-pulse-slow' : ''}`}></div>
                  
                  {/* Image */}
                  <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full p-[3px] bg-gradient-to-b ${isFirst ? 'from-yellow-300 to-yellow-600' : isSecond ? 'from-slate-200 to-slate-500' : 'from-orange-300 to-orange-700'}`}>
                      <img 
                        src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                        className="w-full h-full rounded-full object-cover bg-black border-2 border-black" 
                        alt={member.nickname}
                      />
                      {isPlaying && (
                          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-black rounded-full flex items-center justify-center border border-emerald-500 shadow-[0_0_10px_#10b981]">
                              <Gamepad2 size={14} className="text-emerald-400 animate-pulse" />
                          </div>
                      )}
                  </div>

                  {/* Rank Badge */}
                  <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black bg-black border ${borderClass} ${iconColor} shadow-lg z-10`}>
                      {rank}
                  </div>
              </div>

              {/* Info */}
              <div className="text-center mb-2 w-full px-1">
                  <h3 className={`font-black text-sm sm:text-base truncate drop-shadow-md ${isFirst ? 'text-white' : 'text-slate-200'}`}>
                      {member.nickname}
                  </h3>
                  <p className={`text-[9px] font-bold uppercase tracking-wider opacity-80 ${theme?.text}`}>
                      {theme?.id}
                  </p>
              </div>

              {/* Pedestal Bar */}
              <div className={`w-full ${height} rounded-t-3xl border-t border-x ${borderClass} bg-gradient-to-b ${colorClass} backdrop-blur-sm relative overflow-hidden group flex flex-col items-center justify-start pt-4 shadow-[0_0_50px_-20px_currentColor] ${isFirst ? 'text-yellow-500' : isSecond ? 'text-slate-400' : 'text-orange-500'}`}>
                  
                  {/* Shine Effect */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                  
                  {/* Score */}
                  <span className="font-mono text-2xl sm:text-3xl font-black text-white drop-shadow-lg">
                      {score.toFixed(0)}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/50">{t('hours_played')}</span>
              </div>
          </div>
      );
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white font-sans relative flex flex-col items-center overflow-x-hidden">
        <GamingBackground />
        
        {/* --- CENTRALIZED CONTAINER (PORTRAIT DESIGN) --- */}
        <div className="w-full max-w-xl min-h-screen relative z-10 flex flex-col bg-gradient-to-b from-[#0f1016]/50 to-[#020205] backdrop-blur-sm border-x border-white/5 shadow-2xl">
            
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center shrink-0">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 mb-4 backdrop-blur-md">
                    <Trophy size={14} className="text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">{t('season_label')} {currentYear}</span>
                </div>
                <h1 className="text-4xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-sm">
                    {t('leaderboard_title')}
                </h1>
                
                {/* Search */}
                <div className="mt-6 relative max-w-xs mx-auto">
                    <div className="absolute inset-0 bg-palette-mustard/20 blur-xl rounded-full opacity-50"></div>
                    <div className="relative flex items-center bg-black/40 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-palette-mustard/50 transition-colors">
                        <Search className="text-slate-400 mr-3" size={18} />
                        <input 
                            type="text" 
                            placeholder={t('search_player')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder-slate-500 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* --- PODIUM SECTION (FIXED 2-1-3) --- */}
            <div className="px-4 pt-4 pb-8 shrink-0">
                <div className="flex items-end justify-center gap-2 sm:gap-4 relative">
                    {/* Background Glow behind Podium */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-t from-palette-mustard/10 via-purple-500/5 to-transparent blur-3xl rounded-full -z-10"></div>
                    
                    {/* Render Order: 2 (Left), 1 (Center), 3 (Right) */}
                    <PodiumPedestal member={filledTop3[1]} rank={2} />
                    <PodiumPedestal member={filledTop3[0]} rank={1} />
                    <PodiumPedestal member={filledTop3[2]} rank={3} />
                </div>
            </div>

            {/* --- LIST SECTION (Scrollable) --- */}
            <div className="flex-1 bg-white/[0.02] rounded-t-[40px] border-t border-white/10 backdrop-blur-xl relative overflow-hidden flex flex-col">
                
                {/* Decorative Line */}
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mt-4 mb-2"></div>
                
                <div className="px-6 pb-4 flex justify-between items-end border-b border-white/5">
                    <h3 className="font-bold text-slate-400 text-xs uppercase tracking-widest flex items-center gap-2">
                        <Flame size={14} className="text-orange-500" /> {t('challengers_title')}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-600">{challengers.length} {t('active_count')}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 pb-20">
                    {challengers.length > 0 ? (
                        challengers.map((m, idx) => {
                            const actualRank = idx + 4;
                            const score = getRealtimeScore(m);
                            const theme = getTierTheme(m.membershipId);
                            const isPlaying = transactions.some(t => t.memberId === m.id && t.status === 'ACTIVE');

                            return (
                                <div key={m.id} className="group relative flex items-center gap-4 p-3 pr-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 active:scale-[0.98]">
                                    
                                    {/* Rank */}
                                    <div className="w-8 shrink-0 text-center font-black text-slate-500 text-lg group-hover:text-white transition-colors">
                                        {actualRank}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-12 h-12 rounded-full p-[2px] bg-gradient-to-br ${theme.conic}`}>
                                            <img src={m.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full rounded-full object-cover bg-black" alt={m.nickname}/>
                                        </div>
                                        {isPlaying && (
                                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-black rounded-full flex items-center justify-center border border-emerald-500 shadow-sm z-10">
                                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-white transition-colors">{m.nickname}</h4>
                                            {m.membershipId === 'MYTHIC' && <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">GOD</span>}
                                        </div>
                                        <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                            <Hexagon size={10} className={theme.text} fill="currentColor" fillOpacity={0.2} />
                                            <span className={`${theme.text} font-bold`}>{m.membershipId}</span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right shrink-0">
                                        <div className="font-mono font-black text-white text-base">
                                            {score.toFixed(0)}
                                        </div>
                                        <div className="text-[10px] font-bold text-slate-600 uppercase">{t('hours_short')}</div>
                                    </div>
                                    
                                    {/* Playing Indicator Text */}
                                    {isPlaying && (
                                        <div className="absolute right-3 top-2 text-[8px] font-bold text-emerald-400 animate-pulse tracking-widest uppercase">
                                            {t('live_status')}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center flex flex-col items-center text-slate-600">
                            <Search size={24} className="mb-2 opacity-50"/>
                            <p className="text-xs">{t('no_other_players')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
