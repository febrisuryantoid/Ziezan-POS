
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTierTheme, GamingBackground } from './PublicMemberCard';
import { Trophy, Search, Loader2, Flame, Gamepad2, Crown, ChevronUp, Hexagon, Sparkles } from 'lucide-react';
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

  const PodiumPillar = ({ member, rank }: { member: Member | null, rank: number }) => {
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;

      const score = member ? getRealtimeScore(member) : 0;
      // THEME from MEMBER TIER (Dynamic Color Request)
      const theme = member ? getTierTheme(member.membershipId) : null;
      const isPlaying = member ? transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE') : false;

      // Visual Config (Geometry)
      let pillarHeight = 'h-40'; // Base height
      let avatarSize = 'w-20 h-20';
      let zIndex = 'z-10';
      let translateY = 'translate-y-0';
      
      // Dynamic Colors from Tier Theme (or fallback if empty)
      const borderGradient = theme ? `bg-gradient-to-b ${theme.conic}` : 'bg-slate-700';
      const textClass = theme ? theme.text : 'text-slate-400';
      const badgeColor = theme ? theme.badge : 'bg-slate-700 text-white';

      if (isFirst) {
          pillarHeight = 'h-56'; // Tallest
          avatarSize = 'w-28 h-28';
          zIndex = 'z-30';
          translateY = '-translate-y-6';
      } else if (isSecond) {
          pillarHeight = 'h-44';
          avatarSize = 'w-20 h-20';
          zIndex = 'z-20';
          translateY = 'translate-y-0';
      } else if (isThird) {
          pillarHeight = 'h-36';
          avatarSize = 'w-20 h-20';
          zIndex = 'z-10';
          translateY = 'translate-y-4';
      }

      if (!member || !theme) {
          return (
              <div className={`flex flex-col items-center justify-end w-1/3 ${translateY} opacity-10`}>
                  <div className={`${avatarSize} rounded-full bg-white/5 border-2 border-dashed border-white/20 mb-4`}></div>
                  <div className={`w-full ${pillarHeight} rounded-t-3xl border-t border-x border-white/5 bg-gradient-to-b from-white/5 to-transparent`}></div>
              </div>
          );
      }

      return (
          <div className={`flex flex-col items-center justify-end w-1/3 transition-all duration-700 ${translateY} ${zIndex} relative group`}>
              
              {/* DYNAMIC GOD RAY EFFECT (Uses Tier Color) */}
              {isFirst && (
                  <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-[250%] h-[180%] -z-10 pointer-events-none opacity-40">
                      <div className={`w-full h-full animate-[spin_10s_linear_infinite] bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,currentColor_20deg,transparent_60deg,transparent_180deg,currentColor_200deg,transparent_240deg)] ${textClass} blur-2xl rounded-full`}></div>
                  </div>
              )}

              {/* Avatar Container */}
              <div className="relative mb-2 flex flex-col items-center">
                  {/* Crown */}
                  {isFirst && (
                      <Crown 
                        size={40} 
                        fill="currentColor" 
                        className={`${textClass} absolute -top-10 animate-bounce drop-shadow-[0_0_15px_currentColor] z-20`} 
                      />
                  )}

                  {/* Image Ring with Tier Gradient */}
                  <div className={`relative rounded-full p-[3px] bg-gradient-to-tr ${theme.conic} shadow-[0_0_20px_-5px_currentColor] ${textClass}`}>
                      <div className={`${avatarSize} rounded-full overflow-hidden bg-black relative`}>
                          <img 
                            src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                            alt={member.nickname}
                          />
                          {/* Live Indicator overlay on image */}
                          {isPlaying && (
                              <div className="absolute inset-0 bg-black/20 flex items-center justify-center backdrop-blur-[1px]">
                                  <Gamepad2 size={isFirst ? 24 : 16} className="text-emerald-400 animate-pulse drop-shadow-md" />
                              </div>
                          )}
                      </div>
                      
                      {/* Rank Badge */}
                      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-[#020205] shadow-lg z-20 ${badgeColor}`}>
                          {rank}
                      </div>
                  </div>
                  
                  {/* Name & Tier */}
                  <div className="mt-4 text-center">
                      <h3 className={`font-black text-sm sm:text-base leading-tight truncate max-w-[100px] drop-shadow-md text-white`}>
                          {member.nickname}
                      </h3>
                      <div className={`text-[8px] font-bold uppercase tracking-wider opacity-80 mt-0.5 ${theme.text}`}>
                          {theme.id}
                      </div>
                  </div>
              </div>

              {/* Pillar (Score Box) with Dynamic Border */}
              <div className={`w-full ${pillarHeight} rounded-t-3xl border-x border-t border-white/10 bg-gradient-to-b from-[#1a1a2e]/80 to-[#020205] backdrop-blur-md relative overflow-hidden flex flex-col items-center justify-start pt-3 pb-10`}>
                  
                  {/* Animated Border Top specific to Tier */}
                  <div className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${theme.conic} opacity-80`}></div>
                  {/* Subtle Glow inside pillar */}
                  <div className={`absolute top-0 inset-x-0 h-20 bg-gradient-to-b ${theme.conic} opacity-10 pointer-events-none`}></div>
                  
                  <span className={`font-mono text-3xl sm:text-4xl font-black tracking-tighter drop-shadow-lg ${textClass}`}>
                      {score.toFixed(0)}
                  </span>
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">
                      {t('hour_short')}
                  </span>
                  
                  {/* Decorative Elements inside pillar */}
                  {isFirst && <div className={`mt-4 w-0.5 h-full bg-gradient-to-b ${theme.conic} opacity-50`}></div>}
              </div>
          </div>
      );
  };

  const currentYear = new Date().getFullYear();

  return (
    // FIX: h-[100dvh] ensures it fits mobile screens perfectly without browser bar issues
    <div className="h-[100dvh] w-full bg-[#020205] text-white font-sans relative flex flex-col items-center overflow-hidden">
        <GamingBackground />
        
        {/* --- MAIN CONTAINER --- */}
        <div className="w-full max-w-md h-full relative z-10 flex flex-col bg-gradient-to-b from-[#0f1016]/30 to-[#020205] backdrop-blur-[2px] shadow-2xl overflow-hidden">
            
            {/* Header Area */}
            <div className="pt-6 pb-2 px-6 text-center shrink-0 relative z-20">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-2 backdrop-blur-md shadow-lg">
                    <Trophy size={12} className="text-yellow-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">{t('season_label')} {currentYear}</span>
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter italic text-transparent bg-clip-text bg-gradient-to-b from-white via-slate-200 to-slate-500 drop-shadow-sm">
                    {t('leaderboard_title')}
                </h1>
                
                {/* Search Bar - Modern Glass */}
                <div className="mt-4 relative mx-auto w-full max-w-[280px]">
                    <div className="relative flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2.5 focus-within:border-palette-mustard/50 focus-within:bg-black/40 transition-all shadow-inner">
                        <Search className="text-slate-400 mr-2 shrink-0" size={16} />
                        <input 
                            type="text" 
                            placeholder={t('search_player')} 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-transparent border-none outline-none text-xs font-bold text-white placeholder-slate-500 w-full"
                        />
                    </div>
                </div>
            </div>

            {/* --- PODIUM SECTION --- */}
            {/* Flex-1 ensures this section takes available space, pushing list down */}
            <div className="flex-1 flex items-end justify-center px-4 pb-0 pt-4 relative shrink-0 min-h-[300px]">
                {/* Podium Arrangement: 2 - 1 - 3 */}
                <div className="flex items-end justify-center gap-2 w-full max-w-sm mb-[-20px] z-10">
                    <PodiumPillar member={filledTop3[1]} rank={2} />
                    <PodiumPillar member={filledTop3[0]} rank={1} />
                    <PodiumPillar member={filledTop3[2]} rank={3} />
                </div>
            </div>

            {/* --- LIST SECTION (Sliding Sheet) --- */}
            {/* Creates a "Card" effect that slides up over the bottom of the pillars */}
            <div className="flex-1 bg-[#0f1016]/90 rounded-t-[35px] border-t border-white/10 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.8)] relative overflow-hidden flex flex-col z-20 mt-[-10px] backdrop-blur-xl">
                
                {/* Sheet Handle */}
                <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mt-3 mb-2 shrink-0"></div>
                
                <div className="px-6 py-2 flex justify-between items-end border-b border-white/5 shrink-0">
                    <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <Flame size={12} className="text-orange-500" /> {t('challengers_title')}
                    </h3>
                    <span className="text-[10px] font-mono text-slate-600">{challengers.length} {t('active_count')}</span>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2 pb-20">
                    {challengers.length > 0 ? (
                        challengers.map((m, idx) => {
                            const actualRank = idx + 4;
                            const score = getRealtimeScore(m);
                            const theme = getTierTheme(m.membershipId);
                            const isPlaying = transactions.some(t => t.memberId === m.id && t.status === 'ACTIVE');

                            return (
                                <div key={m.id} className="group relative flex items-center gap-3 p-2.5 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200 active:scale-[0.99]">
                                    
                                    {/* Rank Number */}
                                    <div className="w-8 shrink-0 text-center font-black text-slate-600 text-sm group-hover:text-white transition-colors">
                                        {actualRank}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-10 h-10 rounded-full p-[1.5px] bg-gradient-to-br ${theme.conic}`}>
                                            <img src={m.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full rounded-full object-cover bg-black" alt={m.nickname}/>
                                        </div>
                                        {isPlaying && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black animate-pulse z-10"></div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-slate-300 text-xs truncate group-hover:text-white transition-colors">{m.nickname}</h4>
                                            {m.membershipId === 'MYTHIC' && <Sparkles size={10} className="text-red-500 animate-pulse" />}
                                        </div>
                                        <div className="flex items-center gap-1 text-[9px] text-slate-600 mt-0.5">
                                            <Hexagon size={8} className={theme.text} fill="currentColor" fillOpacity={0.2} />
                                            <span className={`${theme.text} font-bold opacity-80`}>{m.membershipId}</span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right shrink-0 px-2">
                                        <div className="font-mono font-black text-white text-sm tracking-tight">
                                            {score.toFixed(0)}
                                        </div>
                                        <div className="text-[8px] font-bold text-slate-600 uppercase tracking-wide">{t('hour_short')}</div>
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="py-10 text-center flex flex-col items-center text-slate-700">
                            <Search size={20} className="mb-2 opacity-30"/>
                            <p className="text-[10px]">{t('no_other_players')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
