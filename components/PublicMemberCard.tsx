
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Clock, Calendar, Loader2, AlertCircle, Gamepad2, Trophy, Hexagon, Flame, RefreshCw } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

// --- BACKGROUND COMPONENTS ---

export const GamingBackground = ({ glowColor = '#7c3aed' }: { glowColor?: string }) => (
  <div className="fixed inset-0 z-0 pointer-events-none bg-[#020205] overflow-hidden">
    <style>{`
      @keyframes float-light {
        0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        33% { transform: translate(30%, 20%) scale(1.2); opacity: 0.5; }
        66% { transform: translate(-20%, 40%) scale(0.9); opacity: 0.4; }
        100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
      }
      @keyframes pulse-hex {
        0% { opacity: 0.03; }
        50% { opacity: 0.08; }
        100% { opacity: 0.03; }
      }
    `}</style>
    
    {/* Base Dark Gradient */}
    <div className="absolute inset-0 bg-radial-gradient from-[#0f1020] via-[#020205] to-black"></div>

    {/* Moving Glow Blob (Behind the mesh) */}
    <div 
        className="absolute top-[-20%] left-[-20%] w-[120vw] h-[120vw] rounded-full blur-[150px] mix-blend-screen transition-colors duration-1000 ease-in-out"
        style={{ 
            backgroundColor: glowColor,
            animation: 'float-light 15s infinite ease-in-out'
        }}
    ></div>

    {/* Hexagon Mesh Pattern */}
    <div 
        className="absolute inset-0 z-10"
        style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%23ffffff' stroke-width='0.5' stroke-opacity='0.1'/%3E%3C/svg%3E")`,
            backgroundSize: '60px 60px',
            maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)',
            animation: 'pulse-hex 4s infinite ease-in-out'
        }}
    ></div>

    {/* Additional Decorative Lines */}
    <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0)_0%,rgba(0,0,0,0.4)_100%)] z-20"></div>
  </div>
);

const DragonPattern = ({ color }: { color: string }) => {
    const safeColor = color ? color.replace('#', '%23') : '%23ffffff';
    return (
      <div 
          className="absolute inset-0 opacity-30 pointer-events-none mix-blend-overlay"
          style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='${safeColor}' stroke-width='1' stroke-opacity='0.4'/%3E%3C/svg%3E")`,
              backgroundSize: '30px 30px'
          }}
      ></div>
    );
};

export const getTierTheme = (id: string | undefined) => {
  const safeId = id || 'WARRIOR';
  switch(safeId) {
    case 'MYTHICAL_IMMORTAL': 
      return {
        id: 'MYTHICAL_IMMORTAL',
        conic: 'from-[#facc15] via-[#ef4444] to-[#7f1d1d]',
        shadow: 'shadow-[0_0_90px_-10px_rgba(239,68,68,0.9)]', 
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-red-500 to-rose-400',
        textGlow: 'drop-shadow-[0_0_20px_rgba(220,38,38,1)]',
        bgInner: 'bg-black',
        iconUrl: 'https://beeimg.com/images/x16984420291.webp',
        dragonColor: '#ef4444',
        borderInner: 'border-red-500',
        badge: 'bg-gradient-to-r from-red-900 to-black text-red-100 border border-red-500',
        particleColor: '#ef4444'
      };
    case 'MYTHICAL_GLORY': 
      return {
        id: 'MYTHICAL_GLORY',
        conic: 'from-[#ec4899] via-[#be185d] to-[#831843]',
        shadow: 'shadow-[0_0_80px_-10px_rgba(236,72,153,0.8)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-400 to-red-400',
        textGlow: 'drop-shadow-[0_0_15px_rgba(219,39,119,0.9)]',
        bgInner: 'bg-[#280510]',
        iconUrl: 'https://beeimg.com/images/s96067611113.webp',
        dragonColor: '#f472b6',
        borderInner: 'border-pink-600',
        badge: 'bg-gradient-to-r from-pink-900 to-rose-900 text-pink-100 border border-pink-600',
        particleColor: '#f472b6'
      };
    case 'MYTHICAL_HONOR':
      return {
        id: 'MYTHICAL_HONOR',
        conic: 'from-[#3b82f6] via-[#6366f1] to-[#4338ca]',
        shadow: 'shadow-[0_0_70px_-10px_rgba(59,130,246,0.8)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-indigo-400 to-purple-400',
        textGlow: 'drop-shadow-[0_0_15px_rgba(79,70,229,0.9)]',
        bgInner: 'bg-[#050b28]',
        iconUrl: 'https://beeimg.com/images/o23141558932.webp',
        dragonColor: '#60a5fa',
        borderInner: 'border-indigo-500',
        badge: 'bg-gradient-to-r from-blue-900 to-indigo-900 text-blue-100 border border-indigo-500',
        particleColor: '#60a5fa'
      };
    case 'MYTHIC': 
      return {
        id: 'MYTHIC',
        conic: 'from-[#eab308] via-[#3b82f6] to-[#a855f7]',
        shadow: 'shadow-[0_0_60px_-10px_rgba(234,179,8,0.6)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-500',
        textGlow: 'drop-shadow-[0_0_10px_rgba(234,179,8,0.8)]',
        bgInner: 'bg-[#181005]',
        iconUrl: 'https://beeimg.com/images/k43676617811.webp',
        dragonColor: '#facc15',
        borderInner: 'border-yellow-500/60',
        badge: 'bg-gradient-to-r from-yellow-800 to-amber-900 text-yellow-100 border border-yellow-500/50',
        particleColor: '#facc15'
      };
    case 'LEGEND': 
      return {
        id: 'LEGEND',
        conic: 'from-[#fef08a] via-[#fde047] to-[#eab308]', 
        shadow: 'shadow-[0_0_60px_-10px_rgba(250,204,21,0.5)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-400',
        textGlow: 'drop-shadow-[0_0_10px_rgba(250,204,21,0.7)]',
        bgInner: 'bg-[#291d03]',
        iconUrl: 'https://beeimg.com/images/y38717349562.webp',
        dragonColor: '#fef08a',
        borderInner: 'border-yellow-400/50',
        badge: 'bg-gradient-to-r from-yellow-700 to-amber-700 text-white shadow-yellow-500/40',
        particleColor: '#fef08a'
      };
    case 'EPIC': 
      return {
        id: 'EPIC',
        conic: 'from-[#059669] via-[#34d399] to-[#06b6d4]', 
        shadow: 'shadow-[0_0_50px_-10px_rgba(16,185,129,0.5)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-emerald-200 via-teal-300 to-cyan-200',
        textGlow: 'drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]',
        bgInner: 'bg-[#022c22]',
        iconUrl: 'https://beeimg.com/images/r68860524144.webp',
        dragonColor: '#34d399',
        borderInner: 'border-emerald-500/50',
        badge: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-emerald-500/50',
        particleColor: '#34d399'
      };
    case 'GRANDMASTER': 
      return {
        id: 'GRANDMASTER',
        conic: 'from-[#d97706] via-[#f59e0b] to-[#b45309]', 
        shadow: 'shadow-[0_0_40px_-10px_rgba(245,158,11,0.4)]',
        text: 'text-transparent bg-clip-text bg-gradient-to-br from-amber-200 via-orange-300 to-amber-500',
        textGlow: 'drop-shadow-[0_0_5px_rgba(245,158,11,0.6)]',
        bgInner: 'bg-[#2e1505]',
        iconUrl: 'https://beeimg.com/images/o78780173421.webp',
        dragonColor: '#fbbf24',
        borderInner: 'border-amber-600/40',
        badge: 'bg-gradient-to-r from-amber-700 to-orange-700 text-white shadow-amber-500/40',
        particleColor: '#fbbf24'
      };
    case 'ELITE': 
      return {
        id: 'ELITE',
        conic: 'from-[#64748b] via-[#94a3b8] to-[#cbd5e1]', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(148,163,184,0.4)]',
        text: 'text-slate-300',
        textGlow: 'drop-shadow-[0_0_5px_rgba(203,213,225,0.5)]',
        bgInner: 'bg-[#0f172a]',
        iconUrl: 'https://beeimg.com/images/b10988003143.webp',
        dragonColor: '#94a3b8',
        borderInner: 'border-slate-400/30',
        badge: 'bg-gradient-to-r from-slate-600 to-slate-500 text-white shadow-slate-500/30',
        particleColor: '#cbd5e1'
      };
    default: // WARRIOR
      return {
        id: 'WARRIOR',
        conic: 'from-[#451a03] via-[#7c2d12] to-[#b45309]', 
        shadow: 'shadow-[0_0_30px_-5px_rgba(180,83,9,0.3)]',
        text: 'text-orange-300', 
        textGlow: '',
        bgInner: 'bg-[#1a0f08]', 
        iconUrl: 'https://beeimg.com/images/c81812042923.webp',
        dragonColor: '#d97706',
        borderInner: 'border-orange-900/50',
        badge: 'bg-gradient-to-r from-orange-900 to-amber-950 text-orange-200 shadow-orange-900/30',
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
    refreshData(); // Ensure fresh data on mount
    return () => clearInterval(timer);
  }, [refreshData]);

  // SAFE MEMBER SEARCH LOGIC
  useEffect(() => {
    let checkInterval: ReturnType<typeof setInterval>;
    
    const findMember = () => {
        if (members && members.length > 0) {
            const searchNick = (nickname || '').trim().toLowerCase();
            const found = members.find(m => 
                (m.nickname && m.nickname.toLowerCase() === searchNick) || 
                (m.name && m.name.toLowerCase() === searchNick) ||
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

    // Try immediately
    if (findMember()) return;

    // Retry for 5 seconds to allow sync/localstorage to load
    let retries = 0;
    checkInterval = setInterval(() => {
        retries++;
        if (findMember() || retries > 10) {
            clearInterval(checkInterval);
            setLoading(false); // Stop loading even if not found
        }
    }, 500);

    return () => clearInterval(checkInterval);
  }, [members, nickname]);

  const handleManualRefresh = () => {
      setLoading(true);
      refreshData();
      // Force reload page as last resort
      setTimeout(() => {
          if (!member) window.location.reload();
      }, 2000);
  };

  const stats = useMemo(() => {
    if (!member) return null;

    try {
        const activeTx = transactions.find(tx => 
            tx.memberId === member.id && tx.status === 'ACTIVE'
        );

        let formattedElapsedTime = "00:00:00";
        if (activeTx && activeTx.startTime) {
            const startDate = new Date(activeTx.startTime);
            if (!isNaN(startDate.getTime())) {
                const startTime = startDate.getTime();
                const currentTime = now.getTime();
                const elapsedMs = Math.max(0, currentTime - startTime);
                const totalSeconds = Math.floor(elapsedMs / 1000);
                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);
                const s = totalSeconds % 60;
                formattedElapsedTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
            }
        }

        const projectedHours = activeTx ? activeTx.durationHours : 0;
        const totalPlayTimeRealtime = (member.totalPlayTime + projectedHours);
        
        const config = (membershipConfigs && membershipConfigs.length > 0) 
            ? membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0]
            : { bonusThreshold: 10 };
        
        const safeBonusThreshold = config?.bonusThreshold || 10; 
        
        const currentProgressTotal = member.hoursProgressToNextBonus + projectedHours;
        const effectiveProgress = currentProgressTotal % safeBonusThreshold;
        const progressPercent = Math.min(100, (effectiveProgress / safeBonusThreshold) * 100);

        let hoursToNextRank = "MAX";
        let nextRankName = "Top Rank";

        if (membershipConfigs && membershipConfigs.length > 0) {
            const sortedConfigs = [...membershipConfigs].sort((a,b) => a.minHours - b.minHours);
            const nextRankConfig = sortedConfigs.find(c => c.minHours > member.totalPlayTime);
            if (nextRankConfig) {
                hoursToNextRank = (nextRankConfig.minHours - member.totalPlayTime).toFixed(0);
                nextRankName = nextRankConfig.name;
            }
        }

        return {
            totalPlayTime: Math.floor(totalPlayTimeRealtime),
            bonusBalance: member.freeHoursBalance,
            activeTx,
            formattedElapsedTime,
            config,
            progressPercent,
            joinDate: member.joinDate ? new Date(member.joinDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : 'Unknown',
            hoursToNextBonus: Math.max(0, safeBonusThreshold - effectiveProgress).toFixed(0),
            hoursToNextRank,
            nextRankName
        };
    } catch (error) {
        console.error("Error calculating stats:", error);
        return null;
    }
  }, [member, transactions, now, membershipConfigs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020205] flex flex-col gap-4 items-center justify-center relative z-50 overflow-hidden">
        <div 
          className="absolute inset-0 z-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill='none' stroke='%237c3aed' stroke-width='0.5'/%3E%3C/svg%3E")`,
          }}
        ></div>
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 relative z-10" />
        <p className="text-white/50 text-xs font-mono animate-pulse relative z-10">SYNCING DATA...</p>
      </div>
    );
  }

  // Ensure this error screen has high z-index and explicit background
  if (!member || !stats) {
    return (
      <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center text-slate-400 p-8 text-center font-sans relative z-50">
        <GamingBackground glowColor="#ef4444" />
        <div className="relative z-10 flex flex-col items-center">
            <AlertCircle size={48} className="mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-white mb-2">Member Tidak Ditemukan</h1>
            <p className="mb-6">Pastikan link atau nickname yang Anda masukkan benar.</p>
            <div className="flex flex-col gap-2">
            <button 
                onClick={handleManualRefresh}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-lg shadow-indigo-500/20"
            >
                <RefreshCw size={18} /> Refresh Data
            </button>
            <a 
                href="/"
                className="px-6 py-3 border border-white/10 hover:bg-white/5 text-slate-300 rounded-xl font-bold text-sm transition-colors"
            >
                Kembali ke Home
            </a>
            </div>
        </div>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const isMythic = member.membershipId?.includes('MYTHIC') || false;

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center font-sans p-4 overflow-hidden bg-[#020205]">
      {/* Background */}
      <GamingBackground glowColor={theme.dragonColor || '#7c3aed'} />

      {/* --- CARD WRAPPER --- */}
      <div className={`relative w-full max-w-sm aspect-[9/16] z-10 animate-fade-in perspective-1000 ${isMythic ? 'scale-105' : ''}`}>
          
          {/* Spinning Border Beam */}
          <div className={`absolute -inset-[3px] rounded-[38px] overflow-hidden ${isMythic ? 'animate-pulse-slow' : ''}`}>
              <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] ${isMythic ? 'animate-spin' : 'animate-spin-slow'} bg-[conic-gradient(transparent_0deg,transparent_90deg,currentColor_180deg,transparent_270deg,transparent_360deg)] ${theme.text} opacity-100 blur-md`}></div>
          </div>

          {/* Inner Content Card */}
          <div className={`relative h-full w-full rounded-[35px] ${theme.bgInner} ${theme.shadow} flex flex-col items-center p-6 border ${theme.borderInner} overflow-hidden`}>
              
              {/* Mythic Special Particle Effect */}
              {isMythic && (
                  <div className="absolute inset-0 z-0">
                      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.05),transparent_70%)] animate-pulse-slow"></div>
                  </div>
              )}

              {/* Background Details */}
              <DragonPattern color={theme.dragonColor} />
              <div className={`absolute top-0 inset-x-0 h-32 bg-gradient-to-b ${theme.conic} opacity-20 blur-3xl`}></div>

              {/* Floating Tier Icon */}
              <div className={`absolute top-6 right-6 opacity-40 ${isMythic ? 'animate-pulse' : 'opacity-20'} pointer-events-none`}>
                  <img src={theme.iconUrl} alt={member.membershipId} className="w-24 h-24 object-contain drop-shadow-lg" />
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
                          {member.membershipId.replace('MYTHICAL_', 'M.')}
                      </div>
                  </div>

                  <div className="mt-7 text-center space-y-1">
                      <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-lg uppercase">{member.nickname}</h1>
                  </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-3 w-full mb-6 relative z-10">
                  <div className="relative group/box rounded-2xl bg-white/5 backdrop-blur-md overflow-hidden p-4 flex flex-col items-center justify-center gap-1 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className={`absolute -inset-10 bg-gradient-to-tr ${theme.conic} opacity-0 group-hover/box:opacity-20 blur-xl transition-opacity`}></div>
                      <Clock size={20} className={`${theme.text} mb-1 relative z-10`} />
                      <span className="text-2xl font-black text-white tracking-tight relative z-10">{stats.totalPlayTime}</span>
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

              {/* Footer */}
              <div className="w-full pt-3 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold tracking-widest relative z-10">
                  <span className="flex items-center gap-1"><Calendar size={10}/> SINCE {stats.joinDate}</span>
                  <span className="opacity-40">ZIEZAN STATION</span>
              </div>
          </div>
      </div>

      {/* Button to Leaderboard */}
      <a href="/rank" className="mt-6 text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2 border border-white/10 px-4 py-2 rounded-full backdrop-blur-md bg-black/20 z-10">
          <Trophy size={14} /> Global Leaderboard
      </a>

    </div>
  );
};

export default PublicMemberCard;
