
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, Loader2, AlertCircle, Gamepad2, Zap, Trophy, Hexagon, Sparkles, Swords, Medal, Flame, Gem, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

// --- BACKGROUND PATTERNS ---
const DragonPattern = ({ color }: { color: string }) => (
  <div 
    className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay"
    style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415-1.415-.828.828M22.485 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 22.485l.828.83-1.415 1.415-.828-.828-.828.828L-3.658 22.485l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 54.627l.828.83-1.415 1.415-.828-.828-.828.828L-3.658 54.627l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M54.627 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M22.485 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M32.118 29.118l-1.415-1.415 1.415-1.415 1.415 1.415-1.415 1.415zM29.118 32.118l-1.415-1.415 1.415-1.415 1.415 1.415-1.415 1.415z' fill='${color.replace('#', '%23')}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
    }}
  ></div>
);

export const GamingBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#020205]">
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a2e] via-[#020205] to-[#000000]"></div>
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow opacity-5 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,white_10deg,transparent_20deg)] blur-3xl"></div>
  </div>
);

// --- LUXURY TIER THEME CONFIGURATION (7 RANKS) ---
export const getTierTheme = (id: string) => {
  switch(id) {
    case 'MYTHIC': // GOD TIER: Black, Red, Holographic (Ultimate Luxury)
      return {
        id: 'MYTHIC',
        conic: 'from-[#ef4444] via-[#7f1d1d] to-[#000000]', 
        shadow: 'shadow-[0_0_80px_-10px_rgba(239,68,68,0.9)]', // Intense Red Glow
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-200 to-white',
        textGlow: 'drop-shadow-[0_0_15px_rgba(220,38,38,1)]',
        bgInner: 'bg-black', // Void Black
        icon: Gem,
        dragonColor: '#f87171',
        borderInner: 'border-red-500', // Solid Red Border
        badge: 'bg-gradient-to-r from-red-900 to-black text-red-100 border border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.8)]',
        particleColor: '#ef4444'
      };
    case 'LEGEND': // COSMIC TIER: Purple, Gold
      return {
        id: 'LEGEND',
        conic: 'from-[#6d28d9] via-[#ef4444] to-[#fbbf24]', 
        shadow: 'shadow-[0_0_60px_-10px_rgba(147,51,234,0.7)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-fuchsia-300 via-purple-300 to-amber-200',
        textGlow: 'drop-shadow-[0_0_10px_rgba(168,85,247,0.8)]',
        bgInner: 'bg-[#1e052e]',
        icon: Crown,
        dragonColor: '#d8b4fe',
        borderInner: 'border-purple-500/50',
        badge: 'bg-gradient-to-r from-purple-600 to-rose-600 text-white shadow-purple-500/50',
        particleColor: '#e879f9'
      };
    case 'EPIC': // TECH/MAGIC TIER: Neon Green, Cyan
      return {
        id: 'EPIC',
        conic: 'from-[#059669] via-[#34d399] to-[#06b6d4]', 
        shadow: 'shadow-[0_0_50px_-10px_rgba(16,185,129,0.6)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-200',
        textGlow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]',
        bgInner: 'bg-[#022c22]',
        icon: Star,
        dragonColor: '#34d399',
        borderInner: 'border-emerald-500/50',
        badge: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/50',
        particleColor: '#34d399'
      };
    case 'GRANDMASTER': // PLATINUM/ROSE GOLD
      return {
        id: 'GRANDMASTER',
        conic: 'from-[#db2777] via-[#f472b6] to-[#f59e0b]', 
        shadow: 'shadow-[0_0_50px_-10px_rgba(236,72,153,0.6)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-pink-300 via-rose-300 to-orange-200',
        textGlow: 'drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]',
        bgInner: 'bg-[#2e0518]',
        icon: Trophy,
        dragonColor: '#f472b6',
        borderInner: 'border-pink-500/40',
        badge: 'bg-gradient-to-r from-pink-600 to-rose-500 text-white shadow-pink-500/50',
        particleColor: '#f472b6'
      };
    case 'MASTER': // GOLD TIER
      return {
        id: 'MASTER',
        conic: 'from-[#ca8a04] via-[#facc15] to-[#ca8a04]', 
        shadow: 'shadow-[0_0_40px_-10px_rgba(234,179,8,0.5)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-200 via-amber-300 to-yellow-500',
        textGlow: 'drop-shadow-[0_0_5px_rgba(250,204,21,0.6)]',
        bgInner: 'bg-[#291d03]',
        icon: Medal,
        dragonColor: '#facc15',
        borderInner: 'border-yellow-500/40',
        badge: 'bg-gradient-to-r from-yellow-600 to-amber-600 text-white shadow-yellow-500/40',
        particleColor: '#facc15'
      };
    case 'ELITE': // SILVER TIER
      return {
        id: 'ELITE',
        conic: 'from-[#475569] via-[#94a3b8] to-[#cbd5e1]', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(148,163,184,0.4)]',
        text: 'text-slate-200',
        textGlow: 'drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]',
        bgInner: 'bg-[#0f172a]',
        icon: Shield,
        dragonColor: '#94a3b8',
        borderInner: 'border-slate-400/30',
        badge: 'bg-gradient-to-r from-slate-500 to-slate-400 text-white shadow-slate-500/30',
        particleColor: '#cbd5e1'
      };
    default: // WARRIOR
      return {
        id: 'WARRIOR',
        conic: 'from-[#451a03] via-[#b45309] to-[#78350f]', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(180,83,9,0.3)]',
        text: 'text-orange-200', 
        textGlow: '',
        bgInner: 'bg-[#1a0f08]', 
        icon: Swords,
        dragonColor: '#d97706',
        borderInner: 'border-orange-900/50',
        badge: 'bg-gradient-to-r from-orange-800 to-amber-900 text-orange-100 shadow-orange-900/30',
        particleColor: '#b45309'
      };
  }
};

const PublicMemberCard: React.FC<PublicMemberCardProps> = ({ nickname }) => {
  const { members, transactions, membershipConfigs, refreshData } = useData();
  const { t } = useLanguage();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Initial Data Check with Timeout for Sync
  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval>;
    
    const findMember = () => {
        if (members.length > 0) {
            const found = members.find(m => 
                m.nickname.toLowerCase() === nickname.toLowerCase() || 
                m.id === nickname
            );
            if (found) {
                setMember(found);
                setLoading(false);
                return true;
            }
        }
        return false;
    };

    // Try finding immediately
    if (findMember()) return;

    // Retry every 500ms for up to 3 seconds if not found immediately (waiting for sync)
    let retries = 0;
    checkInterval = setInterval(() => {
        retries++;
        if (findMember() || retries > 6) {
            clearInterval(checkInterval);
            setLoading(false);
        }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [members, nickname]);

  const handleManualRefresh = () => {
      setLoading(true);
      refreshData();
      // Force reload page if simple refresh doesn't work (last resort for stuck cache)
      setTimeout(() => {
          if (!member) window.location.reload();
      }, 1500);
  };

  const stats = useMemo(() => {
    if (!member) return null;

    const activeTx = transactions.find(tx => 
        tx.memberId === member.id && tx.status === 'ACTIVE'
    );

    let formattedElapsedTime = "00:00:00";
    if (activeTx) {
        const startTime = new Date(activeTx.startTime).getTime();
        const currentTime = now.getTime();
        const elapsedMs = Math.max(0, currentTime - startTime);
        const totalSeconds = Math.floor(elapsedMs / 1000);
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        formattedElapsedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    const projectedHours = activeTx ? activeTx.durationHours : 0;
    const totalPlayTimeRealtime = (member.totalPlayTime + projectedHours).toFixed(1);
    const config = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
    
    // Bonus Progress
    const currentProgressTotal = member.hoursProgressToNextBonus + projectedHours;
    const effectiveProgress = currentProgressTotal % config.bonusThreshold;
    const progressPercent = Math.min(100, (effectiveProgress / config.bonusThreshold) * 100);

    // Rank Progress (Find next rank config)
    const nextRankConfig = [...membershipConfigs].sort((a,b) => a.minHours - b.minHours).find(c => c.minHours > member.totalPlayTime);
    const hoursToNextRank = nextRankConfig ? (nextRankConfig.minHours - member.totalPlayTime).toFixed(1) : "MAX";
    const nextRankName = nextRankConfig ? nextRankConfig.name : "Top Rank";

    return {
        totalPlayTime: totalPlayTimeRealtime,
        bonusBalance: member.freeHoursBalance,
        activeTx,
        formattedElapsedTime,
        config,
        progressPercent,
        joinDate: new Date(member.joinDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        hoursToNextBonus: Math.max(0, config.bonusThreshold - effectiveProgress).toFixed(1),
        hoursToNextRank,
        nextRankName
    };
  }, [member, transactions, now, membershipConfigs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col gap-4 items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
        <p className="text-white/50 text-xs font-mono animate-pulse">SYNCING DATA...</p>
      </div>
    );
  }

  if (!member || !stats) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center text-slate-400 p-8 text-center font-sans">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Member Tidak Ditemukan</h1>
        <p className="mb-6">Pastikan link atau nickname yang Anda masukkan benar.</p>
        <button 
            onClick={handleManualRefresh}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
        >
            <RefreshCw size={18} /> Refresh Data
        </button>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const TierIcon = theme.icon;
  const isMythic = member.membershipId === 'MYTHIC';

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center font-sans p-4 overflow-hidden">
      <GamingBackground />

      {/* --- CARD WRAPPER --- */}
      <div className={`relative w-full max-w-sm aspect-[9/16] z-10 animate-fade-in perspective-1000 ${isMythic ? 'scale-105' : ''}`}>
          
          {/* Spinning Border Beam - FASTER FOR MYTHIC */}
          <div className={`absolute -inset-[3px] rounded-[38px] overflow-hidden ${isMythic ? 'animate-pulse-slow' : ''}`}>
              <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] ${isMythic ? 'animate-spin' : 'animate-spin-slow'} bg-[conic-gradient(transparent_0deg,transparent_90deg,currentColor_180deg,transparent_270deg,transparent_360deg)] ${theme.text} opacity-100 blur-md`}></div>
          </div>

          {/* Inner Content Card */}
          <div className={`relative h-full w-full rounded-[35px] ${theme.bgInner} ${theme.shadow} flex flex-col items-center p-6 border ${theme.borderInner} overflow-hidden`}>
              
              {/* Mythic Special Particle Effect */}
              {isMythic && (
                  <div className="absolute inset-0 z-0">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(220,38,38,0.15),transparent_70%)] animate-pulse-slow"></div>
                      {/* Floating Particles Mockup */}
                      <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-red-500 rounded-full animate-ping"></div>
                      <div className="absolute bottom-1/3 right-1/3 w-1.5 h-1.5 bg-red-400 rounded-full animate-ping delay-75"></div>
                  </div>
              )}

              {/* Background Details */}
              <DragonPattern color={theme.dragonColor} />
              <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${theme.conic} opacity-20 blur-3xl`}></div>

              {/* Floating Icon (Tier Emblem) */}
              <div className={`absolute top-6 right-6 opacity-30 ${isMythic ? 'animate-spin-slow' : 'animate-pulse-slow'} pointer-events-none`}>
                  <TierIcon size={120} className={theme.text} />
              </div>
              
              {/* Avatar & Identity */}
              <div className="relative mt-8 mb-6 flex flex-col items-center w-full z-10">
                  <div className="relative group">
                      {/* Avatar Glow Ring */}
                      <div className={`absolute -inset-1.5 rounded-full opacity-70 blur-md bg-gradient-to-tr ${theme.conic} ${isMythic ? 'animate-spin' : 'animate-spin-slow'}`}></div>
                      
                      <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-b from-white/30 to-black/30 relative z-10 backdrop-blur-sm">
                          <img src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} alt={member.name} className="w-full h-full rounded-full object-cover bg-black border-2 border-black/80"/>
                      </div>
                      
                      {/* Rank Badge */}
                      <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 z-20 whitespace-nowrap shadow-xl ${theme.badge}`}>
                          <Hexagon size={12} fill="currentColor" />
                          {member.membershipId}
                      </div>
                  </div>

                  <div className="mt-7 text-center space-y-1">
                      <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-lg">{member.name}</h1>
                      <p className={`text-xs font-bold tracking-[0.25em] uppercase opacity-90 ${theme.text} ${theme.textGlow}`}>@{member.nickname}</p>
                  </div>
              </div>

              {/* Stats Grid - Glassmorphism */}
              <div className="grid grid-cols-2 gap-3 w-full mb-6 relative z-10">
                  <div className="relative group/box rounded-2xl bg-white/5 backdrop-blur-md overflow-hidden p-4 flex flex-col items-center justify-center gap-1 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className={`absolute -inset-10 bg-gradient-to-tr ${theme.conic} opacity-0 group-hover/box:opacity-20 blur-xl transition-opacity`}></div>
                      <Clock size={20} className={`${theme.text} mb-1 relative z-10`} />
                      <span className="text-2xl font-black text-white tracking-tight relative z-10">{parseFloat(stats.totalPlayTime)}</span>
                      <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest relative z-10">Hours Played</span>
                  </div>
                  <div className="relative group/box rounded-2xl bg-white/5 backdrop-blur-md overflow-hidden p-4 flex flex-col items-center justify-center gap-1 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className={`absolute -inset-10 bg-gradient-to-tr ${theme.conic} opacity-0 group-hover/box:opacity-20 blur-xl transition-opacity`}></div>
                      <Trophy size={20} className="text-yellow-400 mb-1 relative z-10" />
                      <span className="text-2xl font-black text-white tracking-tight relative z-10">{stats.bonusBalance}</span>
                      <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest relative z-10">Free Hours</span>
                  </div>
              </div>

              {/* Active Session Indicator */}
              {stats.activeTx ? (
                  <div className="w-full mb-5 relative overflow-hidden rounded-2xl border border-emerald-500/40 bg-black/40 z-10 p-3 flex justify-between items-center shadow-[0_0_20px_-5px_rgba(16,185,129,0.3)]">
                      <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 animate-pulse border border-emerald-500/30"><Gamepad2 size={18} /></div>
                          <div>
                              <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span> Live Session
                              </p>
                              <p className="text-xs font-bold text-white max-w-[120px] truncate">{stats.activeTx.consoleName}</p>
                          </div>
                      </div>
                      <p className="text-xl font-mono font-black text-white tracking-widest">{stats.formattedElapsedTime}</p>
                  </div>
              ) : (
                  <div className="w-full mb-5 p-3 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-2 text-slate-500 z-10">
                      <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                      <span className="text-[10px] font-bold uppercase tracking-widest">Offline</span>
                  </div>
              )}

              {/* XP / Rank Progress Bar */}
              {stats.hoursToNextRank !== 'MAX' && (
                  <div className="w-full mt-auto mb-3 relative z-10">
                      <div className="flex justify-between items-end px-1 mb-1.5">
                          <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1">
                              <Flame size={10} className="text-orange-500"/> Next: <span className="text-white">{stats.nextRankName}</span>
                          </span>
                          <span className={`text-[10px] font-black ${theme.text}`}>{stats.hoursToNextRank}h Left</span>
                      </div>
                      <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[2px] border border-white/10 shadow-inner">
                          <div className={`h-full rounded-full bg-gradient-to-r ${theme.conic} shadow-[0_0_10px_currentColor]`} style={{ width: '60%' }}></div>
                      </div>
                  </div>
              )}

              {/* Bonus Progress Bar */}
              <div className="w-full mb-4 relative z-10">
                  <div className="flex justify-between items-end px-1 mb-1.5">
                      <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1">
                          <Zap size={10} className="text-yellow-400"/> Free Hour Grind
                      </span>
                      <span className="text-[10px] font-black text-white">{stats.progressPercent.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 w-full bg-black/60 rounded-full overflow-hidden p-[2px] border border-white/10 relative shadow-inner">
                      <div 
                          className="h-full rounded-full bg-gradient-to-r from-yellow-600 via-yellow-400 to-white relative overflow-hidden"
                          style={{ width: `${stats.progressPercent}%` }}
                      >
                          <div className="absolute inset-0 bg-white/40 animate-[shimmer_1.5s_infinite] skew-x-12"></div>
                      </div>
                  </div>
                  <p className="text-[9px] text-center text-slate-500 mt-1">Play <strong className="text-white">{stats.hoursToNextBonus}h</strong> more to claim reward!</p>
              </div>

              {/* Footer */}
              <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold tracking-widest relative z-10">
                  <span className="flex items-center gap-1"><Calendar size={10}/> SINCE {stats.joinDate}</span>
                  <span className="opacity-40">ZIEZAN STATION</span>
              </div>
          </div>
      </div>

      {/* Button to Leaderboard */}
      <a href="/rank" className="mt-6 text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md bg-black/20">
          <Trophy size={14} /> Global Leaderboard
      </a>

    </div>
  );
};

export default PublicMemberCard;
