
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import { Trophy, Search, Loader2, Flame, Crown } from 'lucide-react';
import { Member } from '../types';

const Leaderboard: React.FC = () => {
  const { members, transactions, refreshData } = useData();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    refreshData();
    const interval = setInterval(() => refreshData(), 30000);
    const timer = setTimeout(() => setLoading(false), 800); 
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [refreshData]);

  const getRealtimeScore = (member: Member) => {
      const activeTx = transactions.find(t => t.memberId === member.id && t.status === 'ACTIVE');
      return member.totalPlayTime + (activeTx ? activeTx.durationHours : 0);
  };

  const allRankings = useMemo(() => {
      return [...members].sort((a, b) => getRealtimeScore(b) - getRealtimeScore(a));
  }, [members, transactions]);

  const filteredRankings = useMemo(() => {
      return allRankings.filter(m => m.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allRankings, searchTerm]);

  const top3 = allRankings.slice(0, 3);
  const filledTop3 = [top3[0] || null, top3[1] || null, top3[2] || null];
  // Urutan render podium: 2, 1, 3
  const podiumOrder = [filledTop3[1], filledTop3[0], filledTop3[2]];
  const challengers = filteredRankings.filter(m => !top3.map(t => t?.id).includes(m.id));
  
  if (loading) {
      return (
        <div className="min-h-screen bg-[#050b14] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-palette-mustard" />
        </div>
      );
  }

  // --- SUB-COMPONENTS ---

  const PodiumPillar = ({ member, rank }: { member: Member | null, rank: number }) => {
      const isFirst = rank === 1;
      const theme = member ? getTierTheme(member.membershipId) : null;
      const score = member ? getRealtimeScore(member) : 0;
      const isPlaying = member ? transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE') : false;

      // Layout adjustments based on Rank
      const containerClass = isFirst ? "-translate-y-8 z-30 scale-110" : "translate-y-4 z-10 scale-95 opacity-90";
      const avatarSize = isFirst ? "w-24 h-24 sm:w-28 sm:h-28" : "w-16 h-16 sm:w-20 sm:h-20";
      const scoreBoxSize = isFirst ? "w-28 h-28 sm:w-32 sm:h-32" : "w-20 h-20 sm:w-24 sm:h-24";

      if (!member || !theme) return <div className="w-1/3"></div>;

      return (
          <a 
            href={`/member/${encodeURIComponent(member.nickname)}`}
            className={`flex flex-col items-center w-1/3 transition-all duration-700 ${containerClass} group cursor-pointer no-underline`}
          >
              {/* Rank 1 Crown */}
              {isFirst && (
                  <div className="relative mb-2 animate-bounce">
                      <div className="absolute inset-0 blur-lg bg-yellow-500/50 scale-150"></div>
                      <Crown size={32} fill="currentColor" className="text-yellow-500 relative z-10" />
                  </div>
              )}

              {/* Avatar with Ring & Rank Badge */}
              <div className="relative mb-4">
                  <div className={`relative ${avatarSize} rounded-full p-1 bg-gradient-to-tr ${theme.conic} shadow-[0_0_30px_-5px_rgba(0,0,0,0.5)]`}>
                      <div className="w-full h-full rounded-full overflow-hidden bg-black relative">
                          <img src={member.photoUrl || theme.iconUrl} className="w-full h-full object-cover" alt={member.nickname} />
                          {isPlaying && (
                              <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse shadow-lg"></div>
                          )}
                      </div>
                      
                      {/* Rank Number Circle at Bottom Border */}
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#111827] border border-white/20 flex items-center justify-center text-[10px] font-black text-white shadow-xl z-20">
                          {rank}
                      </div>
                  </div>
              </div>

              {/* Nickname & Tier Icon */}
              <div className="text-center mb-3">
                  <h3 className="font-black text-xs sm:text-sm text-white tracking-tight truncate max-w-[100px] mb-1 drop-shadow-md">{member.nickname}</h3>
                  <div className="flex justify-center">
                    <img src={theme.iconUrl} alt={theme.id} className="w-4 h-4" />
                  </div>
              </div>

              {/* Score Box (Square style like Mockup) */}
              <div className={`relative ${scoreBoxSize} rounded-[20px] overflow-hidden group-hover:scale-105 transition-transform duration-300`}>
                  {/* Glass Background */}
                  <div className="absolute inset-0 bg-[#0f1016]/90 border border-white/10 rounded-[20px] backdrop-blur-md shadow-2xl"></div>
                  
                  {/* Subtle Inner Glow */}
                  <div className="absolute inset-2 border border-white/5 rounded-[15px] pointer-events-none"></div>

                  {/* Score Content */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl sm:text-3xl font-black text-white tracking-tighter leading-none mb-1">
                          {score.toFixed(0)}
                      </span>
                      <span className="text-[8px] sm:text-[9px] font-black text-slate-500 uppercase tracking-widest">
                          JAM
                      </span>
                  </div>
              </div>
          </a>
      );
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen w-full bg-[#050505] text-white font-sans relative flex flex-col overflow-hidden">
        <GamingBackground />
        
        <div className="flex-1 w-full overflow-y-auto relative z-10 flex flex-col items-center custom-scrollbar">
            <div className="w-full max-w-2xl flex flex-col min-h-full">

                {/* --- HEADER --- */}
                <div className="pt-10 pb-6 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/10 mb-4 animate-slide-in">
                        <Trophy size={10} className="text-yellow-500" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">MUSIM {currentYear}</span>
                    </div>
                    
                    <div className="relative inline-block animate-zoom-in">
                        {/* Crown icon on top of title */}
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-20">
                            <Crown size={40} className="text-white fill-white" />
                        </div>
                        <h1 className="text-5xl sm:text-6xl font-black italic uppercase tracking-tighter text-white drop-shadow-2xl">
                            PAPAN<span className="text-slate-400/80">JUARA</span>
                        </h1>
                    </div>
                </div>

                {/* --- PODIUM (Top 3) --- */}
                <div className="flex items-end justify-center gap-2 sm:gap-6 px-4 pt-10 pb-12 h-[380px] sm:h-[420px] relative">
                    <PodiumPillar member={podiumOrder[0]} rank={2} />
                    <PodiumPillar member={podiumOrder[1]} rank={1} />
                    <PodiumPillar member={podiumOrder[2]} rank={3} />
                    
                    {/* Shadow base under podium */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-10 bg-black/50 blur-2xl rounded-full"></div>
                </div>

                {/* --- CHALLENGERS LIST --- */}
                <div className="flex-1 bg-[#0f1016]/95 rounded-t-[40px] border-t border-white/10 shadow-[0_-20px_60px_-10px_rgba(0,0,0,0.8)] relative flex flex-col z-20 backdrop-blur-2xl">
                    
                    {/* Handle decoration */}
                    <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-5 mb-3"></div>
                    
                    {/* Control Bar */}
                    <div className="px-6 py-4 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                                <Flame size={18} fill="currentColor" />
                            </div>
                            <div>
                                <h3 className="font-black text-white text-[10px] uppercase tracking-[0.1em]">{t('challengers_title')}</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] font-black text-emerald-500">{challengers.length} Player</span>
                                    <div className="w-1 h-1 bg-white/20 rounded-full"></div>
                                    <span className="text-[10px] font-bold text-slate-500">Online</span>
                                </div>
                            </div>
                        </div>

                        <div className="relative flex-1 max-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" size={14} />
                            <input 
                                type="text" 
                                placeholder={t('search_player')} 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-black/60 border border-white/5 rounded-2xl pl-10 pr-4 py-2.5 text-xs font-bold text-white placeholder-slate-700 focus:outline-none focus:border-white/20 transition-all shadow-inner"
                            />
                        </div>
                    </div>

                    {/* Scrollable Challenger Cards */}
                    <div className="px-5 pb-24 space-y-3">
                        {challengers.map((m, idx) => {
                            const score = getRealtimeScore(m);
                            const theme = getTierTheme(m.membershipId);
                            const isPlaying = transactions.some(t => t.memberId === m.id && t.status === 'ACTIVE');

                            return (
                                <a 
                                    key={m.id} 
                                    href={`/member/${encodeURIComponent(m.nickname)}`}
                                    className="flex items-center gap-4 p-3 rounded-[24px] bg-white/[0.03] border border-white/[0.04] hover:bg-white/[0.08] hover:border-white/10 transition-all duration-300 no-underline group active:scale-[0.98]"
                                >
                                    {/* Rank Number */}
                                    <div className="w-8 text-center font-black text-slate-600 text-sm group-hover:text-white transition-colors">{idx + 4}</div>
                                    
                                    {/* Small Avatar Container */}
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-full p-0.5 bg-gradient-to-tr ${theme.conic} shadow-lg`}>
                                            <div className="w-full h-full rounded-full overflow-hidden bg-black border border-black/50">
                                                <img src={m.photoUrl || theme.iconUrl} className="w-full h-full object-cover" alt={m.nickname}/>
                                            </div>
                                        </div>
                                        {isPlaying && (
                                            <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-green-500 rounded-full border-[3px] border-[#0f1016] animate-pulse"></div>
                                        )}
                                    </div>

                                    {/* Name & Tier */}
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-white text-sm truncate tracking-tight">{m.nickname}</h4>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <img src={theme.iconUrl} className="w-3.5 h-3.5 object-contain" alt="tier" />
                                            <span className={`text-[9px] font-black uppercase tracking-wider ${theme.text}`}>{theme.name}</span>
                                        </div>
                                    </div>

                                    {/* Score Box on Right */}
                                    <div className="bg-black/80 border border-white/5 rounded-[16px] px-4 py-2 min-w-[75px] text-center shadow-inner group-hover:border-white/10 transition-colors">
                                        <div className="font-black text-white text-base leading-none tracking-tighter">{score.toFixed(0)}</div>
                                        <div className="text-[8px] font-black text-slate-600 mt-1 uppercase tracking-tighter">JAM</div>
                                    </div>
                                </a>
                            );
                        })}
                        
                        {challengers.length === 0 && (
                            <div className="py-20 text-center flex flex-col items-center gap-3">
                                <div className="p-4 bg-white/5 rounded-full text-slate-700">
                                    <Search size={32} />
                                </div>
                                <div className="text-slate-600 font-black uppercase text-[10px] tracking-[0.3em]">{t('no_other_players')}</div>
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
