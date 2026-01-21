
import React, { useMemo, useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import { Trophy, Search, Loader2, Flame, Medal, Hexagon } from 'lucide-react';
import { Member } from '../types';

// --- SUB-COMPONENTS ---

const RankBadge = ({ rank }: { rank: number }) => {
    let bg = 'bg-slate-800';
    let text = 'text-white';
    let border = 'border-slate-600';
    let shadow = 'shadow-lg';

    // Metal/Gem Effect Gradients
    if (rank === 1) {
        bg = 'bg-gradient-to-b from-yellow-300 via-yellow-500 to-yellow-700';
        text = 'text-yellow-950';
        border = 'border-yellow-200';
        shadow = 'shadow-[0_0_25px_rgba(234,179,8,0.6)]';
    } else if (rank === 2) {
        bg = 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-600';
        text = 'text-slate-900';
        border = 'border-white';
        shadow = 'shadow-[0_0_25px_rgba(203,213,225,0.4)]';
    } else if (rank === 3) {
        bg = 'bg-gradient-to-b from-orange-300 via-orange-500 to-orange-700';
        text = 'text-orange-950';
        border = 'border-orange-200';
        shadow = 'shadow-[0_0_25px_rgba(234,88,12,0.4)]';
    }

    return (
      <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 ${bg} ${text} ${border} ${shadow} flex items-center justify-center font-black text-xs rounded-lg rotate-45 border-2 z-50`}>
          <span className="-rotate-45 drop-shadow-md">{rank}</span>
      </div>
    );
};

interface PodiumCardProps {
    member: Member | null;
    rank: number;
    score: number;
    isPlaying: boolean;
}

const PodiumCard: React.FC<PodiumCardProps> = ({ member, rank, score, isPlaying }) => {
    const isFirst = rank === 1;
    
    // Placeholder skeleton
    if (!member) {
        return (
            <div className={`flex flex-col items-center justify-end ${isFirst ? 'w-[40%] sm:w-[36%] z-10' : 'flex-1 z-0'} h-full opacity-30`}>
                 <div className={`w-full ${isFirst ? 'h-48' : 'h-32'} bg-white/5 rounded-t-3xl border-t border-white/10 mx-2`}></div>
            </div>
        );
    }

    const theme = getTierTheme(member.membershipId);
    
    // Layout Calculation
    // UPDATED: Rank 1 gets 40% (mobile) / 36% (desktop), Rank 2 & 3 take flex-1 (equal remaining space)
    // This ensures full width alignment with the list below.
    const containerWidth = isFirst ? "w-[40%] sm:w-[36%]" : "flex-1";
    const zIndex = isFirst ? "z-30" : "z-20";
    const verticalOffset = isFirst ? "-mt-10" : "translate-y-4"; 
    
    // Height & Structure
    const podiumHeight = isFirst ? 'h-52' : 'h-32'; 
    const avatarSize = isFirst ? "w-24 h-24 sm:w-28 sm:h-28" : "w-16 h-16 sm:w-20 sm:h-20";
    const glowColor = isFirst ? 'rgba(234, 179, 8, 0.5)' : rank === 2 ? 'rgba(148, 163, 184, 0.3)' : 'rgba(234, 88, 12, 0.3)';

    return (
        <a href={`/member/${encodeURIComponent(member.nickname)}`} className={`relative flex flex-col items-center group transition-transform duration-500 hover:-translate-y-2 ${containerWidth} ${zIndex} ${verticalOffset}`}>
            
            {/* --- AVATAR AREA --- */}
            <div className="relative mb-4 z-50">
                {/* Ambient Glow behind head */}
                <div className="absolute inset-0 rounded-full blur-2xl opacity-60 animate-pulse-slow" style={{ backgroundColor: glowColor }}></div>
                
                {/* Avatar Ring */}
                <div className={`relative ${avatarSize} rounded-full flex items-center justify-center bg-[#0f1016] shadow-2xl ring-4 ring-black/50`}>
                    
                    {/* Rotating Tier Border */}
                    <div className="absolute inset-[-4px] rounded-full overflow-hidden p-[2px]">
                        <div className={`w-full h-full rounded-full border-[3px] ${theme.border} border-dashed animate-spin-slow opacity-100`}></div>
                    </div>
                    
                    {/* Inner Black Circle */}
                    <div className="absolute inset-[3px] bg-black rounded-full z-0"></div>

                    {/* Image */}
                    <div className="w-full h-full rounded-full overflow-hidden relative z-10 p-1">
                        <img 
                          src={member.photoUrl || theme.iconUrl} 
                          alt={member.nickname} 
                          className="w-full h-full object-cover rounded-full"
                        />
                    </div>

                    {/* Online Dot */}
                    {isPlaying && (
                        <div className="absolute top-1 right-1 w-4 h-4 bg-green-500 rounded-full border-[3px] border-black animate-pulse shadow-[0_0_10px_#22c55e] z-30"></div>
                    )}
                    
                    <RankBadge rank={rank} />
                </div>
            </div>

            {/* --- PODIUM BODY --- */}
            {/* Removed mx-1 to ensure edge-to-edge fit if needed */}
            <div className={`w-full ${podiumHeight} relative flex flex-col items-center`}>
                 
                 {/* Glass Body with Shimmer */}
                 <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-[#0a0a0a]/90 backdrop-blur-xl rounded-t-[1.5rem] border-t border-x border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] overflow-hidden group-hover:border-white/30 transition-colors">
                     
                     {/* LUXURY SHIMMER EFFECT (On Hover) */}
                     <div className="absolute inset-0 -translate-x-[150%] group-hover:animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] pointer-events-none z-10"></div>

                     {/* Content Container */}
                     <div className="relative z-20 flex flex-col items-center pt-6 px-2 h-full">
                         
                         {/* Name */}
                         <h3 className={`font-black text-white uppercase tracking-tight truncate w-full text-center drop-shadow-md ${isFirst ? 'text-lg' : 'text-xs text-slate-300'}`}>
                            {member.nickname}
                         </h3>
                         
                         {/* Tier Badge */}
                         <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/5 relative z-20">
                             <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${theme.conic}`}></div>
                             <span className={`text-[8px] font-bold uppercase ${theme.text}`}>{theme.name}</span>
                         </div>

                         {/* SCORE */}
                         <div className={`absolute ${isFirst ? 'bottom-16' : 'bottom-10'} flex items-baseline justify-center gap-1.5 z-30 w-full px-2`}>
                            <span className={`font-mono font-black leading-none ${isFirst ? 'text-4xl text-yellow-400 drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]' : 'text-2xl text-slate-200'}`}>
                                {score.toFixed(0)}
                            </span>
                            <span className={`font-bold uppercase tracking-wider ${isFirst ? 'text-xs text-yellow-600' : 'text-[9px] text-slate-500'}`}>
                                JAM
                            </span>
                         </div>
                     </div>
                 </div>
            </div>
        </a>
    );
};

interface ChallengerRowProps {
    member: Member;
    rank: number;
    score: number;
    isPlaying: boolean;
}

const ChallengerRow: React.FC<ChallengerRowProps> = ({ member, rank, score, isPlaying }) => {
    const theme = getTierTheme(member.membershipId);

    return (
        <a href={`/member/${encodeURIComponent(member.nickname)}`} className="group relative flex items-center gap-4 p-3 mb-2 rounded-2xl bg-[#0f1016]/60 backdrop-blur-md border border-white/5 hover:border-white/20 hover:bg-white/5 transition-all duration-300 active:scale-[0.98] overflow-hidden">
            
            {/* Shimmer Effect */}
            <div 
                className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1s_infinite] z-0 pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${theme.particleColor}15, transparent)` }}
            ></div>

            {/* Rank Number */}
            <div className="w-8 text-center font-mono font-black text-slate-600 group-hover:text-white text-lg italic relative z-10 transition-colors">
                {rank}
            </div>

            {/* Avatar */}
            <div className="relative shrink-0 w-10 h-10 flex items-center justify-center z-10">
                <div className={`absolute inset-0 rounded-full border-2 border-dashed ${theme.border} opacity-50 group-hover:animate-spin-slow`}></div>
                <img 
                    src={member.photoUrl || theme.iconUrl} 
                    className="w-full h-full object-contain rounded-full bg-black scale-90 group-hover:scale-100 transition-transform" 
                    alt={member.nickname} 
                />
                {isPlaying && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0f1016] animate-pulse z-20"></div>}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0 flex flex-col justify-center relative z-10">
                <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-slate-200 group-hover:text-white truncate transition-colors">{member.nickname}</h4>
                </div>
                <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    <Hexagon size={10} className={theme.text} fill="currentColor" />
                    <span className={`text-[9px] font-bold uppercase ${theme.text}`}>{theme.name}</span>
                </div>
            </div>

            {/* Score */}
            <div className="text-right pr-2 relative z-10">
                <span className="text-base font-black font-mono text-white tracking-tighter">
                    {score.toFixed(0)} <span className="text-[9px] text-slate-500 uppercase font-bold ml-0.5">Jam</span>
                </span>
            </div>
        </a>
    );
};

// --- MAIN COMPONENT ---

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
  
  const getIsPlaying = (member: Member) => {
      return transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');
  };

  const allRankings = useMemo(() => {
      return [...members].sort((a, b) => getRealtimeScore(b) - getRealtimeScore(a));
  }, [members, transactions]);

  const filteredRankings = useMemo(() => {
      return allRankings.filter(m => m.nickname.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [allRankings, searchTerm]);

  // Podium Logic
  const top3 = allRankings.slice(0, 3);
  const filledTop3 = [top3[0] || null, top3[1] || null, top3[2] || null];
  const podiumOrder = [filledTop3[1], filledTop3[0], filledTop3[2]]; // 2, 1, 3
  
  // Challengers
  const challengers = filteredRankings.filter(m => !top3.map(t => t?.id).includes(m.id));

  if (loading) {
      return (
        <div className="h-screen w-full bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="w-10 h-10 animate-spin text-palette-mustard" />
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Syncing...</span>
            </div>
        </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-[#050505] text-white font-sans overflow-hidden flex flex-col">
        
        {/* Layer 0: Animated Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <GamingBackground />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-[#050505]/80"></div>
            {/* Spotlight for Top Rank */}
            <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[60vw] h-[60vw] bg-purple-600/10 blur-[100px] rounded-full"></div>
        </div>

        {/* Layer 1: Content */}
        <div className="relative z-10 flex flex-col h-full w-full max-w-lg mx-auto md:max-w-4xl">
            
            {/* Header Area */}
            <div className="shrink-0 pt-8 pb-4 flex flex-col items-center z-50">
                 <div className="flex items-center gap-3 mb-1 animate-fade-in">
                    <Trophy size={24} className="text-palette-mustard drop-shadow-[0_0_15px_rgba(124,58,237,0.8)]" />
                    <h1 className="text-2xl font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">
                        {t('leaderboard_title')}
                    </h1>
                 </div>
                 <div className="flex items-center gap-2 opacity-60">
                    <div className="w-6 h-[1px] bg-white/20"></div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-palette-mustard">{t('season_label')} 1</span>
                    <div className="w-6 h-[1px] bg-white/20"></div>
                 </div>
            </div>

            {/* PODIUM STAGE */}
            {/* UPDATED: w-full and removed horizontal padding to ensure full alignment with list below */}
            <div className="shrink-0 flex flex-col items-center w-full relative z-40 md:mb-4 transition-transform duration-500">
                <div className="flex items-end justify-center w-full gap-2 sm:gap-4 pb-0 px-2 sm:px-0">
                    <PodiumCard 
                        member={podiumOrder[0]} 
                        rank={2} 
                        score={podiumOrder[0] ? getRealtimeScore(podiumOrder[0]) : 0} 
                        isPlaying={podiumOrder[0] ? getIsPlaying(podiumOrder[0]) : false} 
                    />
                    <PodiumCard 
                        member={podiumOrder[1]} 
                        rank={1} 
                        score={podiumOrder[1] ? getRealtimeScore(podiumOrder[1]) : 0} 
                        isPlaying={podiumOrder[1] ? getIsPlaying(podiumOrder[1]) : false} 
                    />
                    <PodiumCard 
                        member={podiumOrder[2]} 
                        rank={3} 
                        score={podiumOrder[2] ? getRealtimeScore(podiumOrder[2]) : 0} 
                        isPlaying={podiumOrder[2] ? getIsPlaying(podiumOrder[2]) : false} 
                    />
                </div>
            </div>

            {/* CHALLENGER LIST CONTAINER */}
            <div className="flex-1 min-h-0 w-full bg-[#0a0a0a]/90 backdrop-blur-3xl rounded-t-[3rem] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden animate-slide-in relative z-50 -mt-12 md:-mt-8 md:flex-none md:h-[45vh]">
                
                {/* Search Header */}
                <div className="px-6 py-5 flex items-center justify-between shrink-0 bg-gradient-to-b from-white/5 to-transparent">
                    <div className="flex items-center gap-2">
                        <Flame size={16} className="text-orange-500 fill-orange-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-widest text-slate-300">{t('challengers_title')}</span>
                        <span className="bg-white/10 text-white text-[9px] font-bold px-2 py-0.5 rounded-full ml-1">{challengers.length}</span>
                    </div>
                    
                    <div className="relative group w-32 focus-within:w-40 transition-all duration-300">
                        <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-white" />
                        <input 
                            type="text" 
                            placeholder={t('search_player')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-full py-1.5 pl-9 pr-3 text-[10px] font-bold text-white focus:outline-none focus:border-palette-mustard/50 transition-colors placeholder:text-slate-600"
                        />
                    </div>
                </div>

                {/* Scrollable List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 scroll-smooth">
                    {challengers.length > 0 ? (
                        challengers.map((m, idx) => (
                            <ChallengerRow 
                                key={m.id} 
                                member={m} 
                                rank={idx + 4} 
                                score={getRealtimeScore(m)} 
                                isPlaying={getIsPlaying(m)} 
                            />
                        ))
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-3 opacity-50 py-10">
                            <Medal size={48} strokeWidth={1} />
                            <span className="text-xs font-black uppercase tracking-widest">{t('no_challengers')}</span>
                        </div>
                    )}
                    
                    {/* Spacer for bottom safe area */}
                    <div className="h-8"></div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Leaderboard;
