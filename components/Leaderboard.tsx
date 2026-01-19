
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { getTierTheme, GamingBackground } from './PublicMemberCard';
import { Trophy, Search, Loader2, Flame, Gamepad2, Crown, Medal, ChevronUp } from 'lucide-react';
import { Member } from '../types';

const Leaderboard: React.FC = () => {
  const { members, transactions, refreshData } = useData();
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
  const challengers = filteredRankings.filter(m => !top3.map(t => t.id).includes(m.id));
  
  // Calculate max score for progress bar visualization
  const maxScore = top3.length > 0 ? getRealtimeScore(top3[0]) : 100;

  if (loading) {
      return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center">
            <Loader2 className="w-10 h-10 animate-spin text-palette-mustard" />
        </div>
      );
  }

  // --- SUB-COMPONENTS ---

  const PodiumItem = ({ member, rank }: { member: Member, rank: number }) => {
      if (!member) return null;
      
      const theme = getTierTheme(member.membershipId);
      const score = getRealtimeScore(member);
      const isPlaying = transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');
      
      // Rank Styling Config
      const isFirst = rank === 1;
      const isSecond = rank === 2;
      const isThird = rank === 3;

      let glowColor = 'shadow-slate-500/50';
      let borderColor = 'border-slate-700';
      let ringColor = 'from-slate-400 to-slate-600';
      let heightClass = 'h-40 md:h-48'; // Base height container
      let scaleClass = 'scale-90 md:scale-95';
      let orderClass = 'order-2'; // Default order for flex

      if (isFirst) {
          glowColor = 'shadow-yellow-500/60';
          borderColor = 'border-yellow-400';
          ringColor = 'from-yellow-300 via-yellow-500 to-amber-600';
          heightClass = 'h-52 md:h-64';
          scaleClass = 'scale-110 md:scale-125 z-20';
          orderClass = 'order-1 md:order-2'; // Center on desktop
      } else if (isSecond) {
          glowColor = 'shadow-teal-400/50';
          borderColor = 'border-teal-400';
          ringColor = 'from-teal-300 to-emerald-600';
          scaleClass = 'scale-100 mt-4 md:mt-12';
          orderClass = 'order-2 md:order-1'; // Left on desktop
      } else if (isThird) {
          glowColor = 'shadow-orange-500/50';
          borderColor = 'border-orange-400';
          ringColor = 'from-orange-300 to-red-600';
          scaleClass = 'scale-100 mt-4 md:mt-12';
          orderClass = 'order-3 md:order-3'; // Right on desktop
      }

      return (
          <div className={`relative flex flex-col items-center justify-end ${orderClass} ${scaleClass} transition-all duration-500 ease-out group`}>
              {/* Crown for #1 */}
              {isFirst && (
                  <div className="absolute -top-12 animate-bounce drop-shadow-[0_0_15px_rgba(234,179,8,0.8)]">
                      <Crown size={40} className="text-yellow-400 fill-yellow-400" />
                  </div>
              )}

              {/* Rank Badge */}
              <div className={`absolute -top-4 z-30 w-8 h-8 rounded-full flex items-center justify-center font-black text-xs border-2 bg-black text-white ${borderColor} shadow-lg`}>
                  {rank}
              </div>

              {/* Avatar Container with Glow */}
              <div className={`relative rounded-full p-1 bg-gradient-to-b ${ringColor} ${isFirst ? 'animate-pulse-slow' : ''}`}>
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden border-4 border-black relative bg-black shadow-[0_0_30px_-5px] ${glowColor}`}>
                      <img src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      {isPlaying && (
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center backdrop-blur-[1px]">
                              <Gamepad2 className="text-emerald-400 animate-pulse drop-shadow-md" size={24} />
                          </div>
                      )}
                  </div>
              </div>

              {/* Info Card - Glassmorphism */}
              <div className="mt-[-20px] pt-8 pb-3 px-4 w-32 md:w-40 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl flex flex-col items-center text-center shadow-xl">
                  {/* CHANGE: Display Nickname */}
                  <h3 className={`font-bold text-sm md:text-base truncate w-full ${theme.text}`}>
                      {member.nickname}
                  </h3>
                  <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
                      {theme.id}
                  </div>
                  <div className="w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent my-1"></div>
                  <p className="font-mono font-black text-white text-sm md:text-lg">
                      {score.toFixed(0)}<span className="text-[10px] text-slate-500 font-sans ml-0.5">h</span>
                  </p>
              </div>
              
              {/* Podium Base Effect */}
              <div className={`absolute bottom-0 w-full h-1/2 bg-gradient-to-t ${isFirst ? 'from-yellow-500/10' : isSecond ? 'from-teal-500/10' : 'from-orange-500/10'} to-transparent blur-2xl -z-10 rounded-full`}></div>
          </div>
      );
  };

  return (
    <div className="min-h-screen w-full bg-[#020205] text-white font-sans relative flex flex-col overflow-hidden">
        <GamingBackground />
        
        {/* Decorative ambient lights */}
        <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/20 blur-[120px] rounded-full pointer-events-none"></div>

        {/* --- HEADER --- */}
        <div className="relative z-10 pt-8 px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter italic bg-clip-text text-transparent bg-gradient-to-b from-white to-slate-400 drop-shadow-sm flex items-center gap-3 justify-center md:justify-start">
                    <Trophy className="text-yellow-400 fill-yellow-400/20" size={32} />
                    Leaderboard
                </h1>
                <p className="text-slate-500 text-xs font-bold tracking-[0.3em] uppercase mt-1 pl-1">Season 2026 • Global Ranking</p>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-xs group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-palette-mustard to-cyan-500 rounded-full opacity-30 group-hover:opacity-70 transition duration-500 blur"></div>
                <div className="relative flex items-center bg-black/60 backdrop-blur-xl rounded-full px-4 py-2 border border-white/10">
                    <Search className="text-slate-400 mr-2" size={16} />
                    <input 
                        type="text" 
                        placeholder="Cari Player..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent border-none outline-none text-sm font-bold text-white placeholder-slate-500 w-full"
                    />
                </div>
            </div>
        </div>

        {/* --- MAIN CONTENT AREA --- */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative z-10 p-4 md:p-8 gap-8">
            
            {/* LEFT: PODIUM (Sticky on Desktop) */}
            <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center shrink-0 min-h-[350px]">
                {top3.length > 0 ? (
                    <div className="flex flex-wrap md:flex-nowrap justify-center items-end gap-2 md:gap-4 h-full pb-8">
                        {/* Logic for responsive order: 2, 1, 3 on Desktop. Triangle on Mobile handled by CSS order */}
                        <PodiumItem member={top3[1]} rank={2} />
                        <PodiumItem member={top3[0]} rank={1} />
                        <PodiumItem member={top3[2]} rank={3} />
                    </div>
                ) : (
                    <div className="text-center text-slate-500 py-20">Belum ada data ranking.</div>
                )}
            </div>

            {/* RIGHT: CHALLENGERS LIST (Scrollable) */}
            <div className="flex-1 min-h-0 flex flex-col bg-white/5 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden shadow-2xl relative">
                
                {/* List Header */}
                <div className="px-6 py-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-slate-300 uppercase tracking-wider text-xs flex items-center gap-2">
                        <Flame size={14} className="text-orange-500" /> Top Challengers
                    </h3>
                    <span className="text-[10px] text-slate-500 font-mono">SCROLL TO VIEW</span>
                </div>

                {/* Scroll Container */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    {challengers.length > 0 ? (
                        challengers.map((m, idx) => {
                            const actualRank = idx + 4; // Because top 3 are separate
                            const score = getRealtimeScore(m);
                            const theme = getTierTheme(m.membershipId);
                            const isPlaying = transactions.some(t => t.memberId === m.id && t.status === 'ACTIVE');
                            
                            // Calculate width relative to #1 score
                            const widthPercent = Math.max(15, (score / maxScore) * 100);

                            return (
                                <div key={m.id} className="group relative flex items-center gap-4 p-3 rounded-2xl bg-black/20 border border-white/5 hover:bg-white/5 hover:border-white/10 transition-all duration-300 overflow-hidden">
                                    {/* Progress Background */}
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-white/[0.03] to-transparent transition-all duration-1000 ease-out -z-10" 
                                        style={{ width: `${widthPercent}%` }}
                                    ></div>

                                    {/* Rank Number */}
                                    <div className="w-8 shrink-0 text-center font-mono font-bold text-slate-500 text-lg group-hover:text-white transition-colors">
                                        {actualRank}
                                    </div>

                                    {/* Avatar */}
                                    <div className="relative shrink-0">
                                        <div className={`w-10 h-10 rounded-full p-[1px] bg-gradient-to-br ${theme.conic}`}>
                                            <img src={m.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full rounded-full object-cover bg-black" />
                                        </div>
                                        {isPlaying && (
                                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border border-black animate-pulse shadow-[0_0_10px_#10b981]"></div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {/* CHANGE: Display Nickname, REMOVED Full Name */}
                                            <h4 className="font-bold text-slate-200 text-sm truncate group-hover:text-white transition-colors">{m.nickname}</h4>
                                            {m.membershipId === 'MYTHIC' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-bold border border-red-500/30">GOD</span>}
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                            <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                                            <span className={`${theme.text}`}>{m.membershipId}</span>
                                        </div>
                                    </div>

                                    {/* Score */}
                                    <div className="text-right shrink-0">
                                        <div className="font-mono font-black text-white text-sm">
                                            {score.toFixed(0)}<span className="text-[10px] text-slate-500 font-sans ml-0.5">h</span>
                                        </div>
                                        {isPlaying ? (
                                            <div className="text-[9px] font-bold text-emerald-400 flex items-center justify-end gap-1 animate-pulse">
                                                <Gamepad2 size={10} /> Playing
                                            </div>
                                        ) : (
                                            <div className="text-[9px] font-bold text-slate-600 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronUp size={10} className="text-green-500"/> Rank Up
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-50">
                            <Search size={32} className="mb-2"/>
                            <p className="text-xs">Tidak ada data lain</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
