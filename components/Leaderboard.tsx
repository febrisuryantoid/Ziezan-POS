
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { getTierTheme, GamingBackground } from './PublicMemberCard';
import { Trophy, Search, Loader2, Flame, Gamepad2 } from 'lucide-react';
import { Member } from '../types';

const Leaderboard: React.FC = () => {
  const { members, transactions, refreshData } = useData();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  // Auto-refresh data every 30 seconds to update 'Active' status visuals
  useEffect(() => {
    refreshData();
    const interval = setInterval(() => refreshData(), 30000);
    const timer = setTimeout(() => setLoading(false), 800); 
    return () => {
        clearTimeout(timer);
        clearInterval(interval);
    };
  }, [refreshData]);

  // Helper: Calculate Realtime Score (Stored + Active Session)
  const getRealtimeScore = (member: Member) => {
      const activeTx = transactions.find(t => t.memberId === member.id && t.status === 'ACTIVE');
      // If playing, add the active duration (projected) to total
      // NOTE: This assumes full duration is credited for ranking purposes immediately for motivation
      // or we could calculate elapsed time. For "Rank Projection", full duration is more exciting.
      return member.totalPlayTime + (activeTx ? activeTx.durationHours : 0);
  };

  // Sort by Playtime (Realtime)
  const leaderboard = useMemo(() => {
      const sorted = [...members].sort((a, b) => getRealtimeScore(b) - getRealtimeScore(a));
      return sorted.filter(m => m.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [members, transactions, searchTerm]);

  if (loading) {
      return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-palette-mustard" />
        </div>
      );
  }

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white font-sans relative overflow-hidden flex flex-col">
        <GamingBackground />
        
        {/* Header Area */}
        <div className="relative z-10 pt-10 pb-6 px-4 text-center">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-gradient-to-tr from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(245,158,11,0.4)] mb-4 animate-bounce">
                    <Trophy size={32} className="text-white drop-shadow-md" />
                </div>
                <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400">
                    Global Rankings
                </h1>
                <p className="text-slate-500 text-xs md:text-sm font-bold tracking-[0.3em] uppercase mt-2">Season 2026</p>
            </div>

            {/* Search */}
            <div className="mt-8 max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search Player..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-full py-3 pl-12 pr-6 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all backdrop-blur-md placeholder-slate-600"
                />
            </div>
        </div>

        {/* Content List */}
        <div className="relative z-10 flex-1 overflow-y-auto px-4 pb-20 max-w-3xl mx-auto w-full custom-scrollbar">
            <div className="space-y-3">
                {leaderboard.map((m, idx) => {
                    const theme = getTierTheme(m.membershipId);
                    const isMythic = m.membershipId === 'MYTHIC';
                    const RankIcon = theme.icon;
                    const realtimeScore = getRealtimeScore(m);
                    const isPlaying = transactions.some(t => t.memberId === m.id && t.status === 'ACTIVE');
                    
                    // Special Styling for Top 3
                    const isTop1 = idx === 0;
                    const isTop2 = idx === 1;
                    const isTop3 = idx === 2;

                    return (
                        <div 
                            key={m.id} 
                            className={`group relative flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 overflow-hidden
                                ${isMythic 
                                    ? 'bg-black/40 border border-red-500/30 shadow-[0_0_30px_-5px_rgba(220,38,38,0.2)]' 
                                    : 'bg-white/5 border border-white/5 hover:bg-white/10'
                                }
                                ${isTop1 ? 'scale-105 border-yellow-500/50 shadow-[0_0_30px_-5px_rgba(234,179,8,0.2)] mb-6 mt-2' : ''}
                            `}
                        >
                            {/* Mythic Background Effect */}
                            {isMythic && (
                                <div className="absolute inset-0 opacity-20 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                            )}

                            {/* Rank Number */}
                            <div className={`w-10 shrink-0 flex flex-col items-center justify-center font-black italic text-xl md:text-2xl 
                                ${isTop1 ? 'text-yellow-400 scale-125' : 
                                  isTop2 ? 'text-slate-300 scale-110' : 
                                  isTop3 ? 'text-amber-700 scale-105' : 'text-slate-600'}
                            `}>
                                #{idx + 1}
                            </div>

                            {/* Avatar */}
                            <div className="relative shrink-0">
                                <div className={`relative w-12 h-12 md:w-14 md:h-14 rounded-full p-0.5 ${isMythic ? 'bg-gradient-to-br from-red-500 to-black' : 'bg-white/10'}`}>
                                    <img 
                                        src={m.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                                        className="w-full h-full rounded-full object-cover bg-black"
                                    />
                                    {/* Online Indicator */}
                                    {isPlaying && (
                                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-black flex items-center justify-center animate-pulse z-20">
                                            <Gamepad2 size={8} className="text-black" fill="currentColor"/>
                                        </div>
                                    )}
                                </div>
                                {/* Rank Icon Badge */}
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 bg-black rounded-full flex items-center justify-center border border-white/20 shadow-lg ${theme.text}`}>
                                    <RankIcon size={14} fill="currentColor" />
                                </div>
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-bold text-sm md:text-base truncate flex items-center gap-2 ${isMythic ? theme.text : 'text-white'}`}>
                                    {m.name}
                                    {isMythic && <Flame size={14} className="text-red-500 animate-pulse" />}
                                </h3>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border border-white/10 bg-black/30 ${theme.text}`}>
                                        {m.membershipId}
                                    </span>
                                    <span className="text-[10px] text-slate-500 truncate hidden sm:block">@{m.nickname}</span>
                                </div>
                            </div>

                            {/* Score */}
                            <div className="text-right flex flex-col items-end">
                                <p className={`font-mono font-black text-lg md:text-xl ${isTop1 || isMythic ? 'text-white' : 'text-slate-300'}`}>
                                    {realtimeScore.toFixed(0)}<span className="text-xs font-sans text-slate-500 ml-1">h</span>
                                </p>
                                {isPlaying && (
                                    <span className="text-[9px] font-bold text-emerald-400 animate-pulse">Playing Now</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
