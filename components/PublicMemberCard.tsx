
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, Loader2, AlertCircle, Gamepad2, Zap, Trophy, Hexagon, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

// --- DRAGON BACKGROUND PATTERN ---
const DragonPattern = ({ color }: { color: string }) => (
  <div 
    className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
    style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M22.485 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 22.485l.828.83-1.415 1.415-.828-.828-.828.828L-3.658 22.485l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 54.627l.828.83-1.415 1.415-.828-.828-.828.828L-3.658 54.627l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M54.627 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M22.485 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M32.118 29.118l-1.415-1.415 1.415-1.415 1.415 1.415-1.415 1.415zM29.118 32.118l-1.415-1.415 1.415-1.415 1.415 1.415-1.415 1.415z' fill='${color.replace('#', '%23')}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        maskImage: 'radial-gradient(circle at center, black 40%, transparent 100%)'
    }}
  ></div>
);

// --- ANIMATED GAMING BACKGROUND ---
export const GamingBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050505]">
    {/* Background Fog */}
    <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#050505] to-[#050505]"></div>
    
    {/* Hex Grid */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 animate-pulse-slow"></div>
    
    {/* Moving Light Beams */}
    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow opacity-10 bg-[conic-gradient(from_0deg_at_50%_50%,transparent_0deg,white_10deg,transparent_20deg)] blur-3xl"></div>
  </div>
);

// --- TIER THEME CONFIGURATION ---
export const getTierTheme = (id: string) => {
  switch(id) {
    case 'VIP':
      return {
        conic: 'from-[#fbbf24] via-[#b45309] to-[#fbbf24]', // Amber/Gold
        shadow: 'shadow-[0_0_50px_-12px_rgba(245,158,11,0.7)]',
        text: 'text-amber-400',
        textGlow: 'drop-shadow-[0_0_8px_rgba(245,158,11,0.8)]',
        bgInner: 'bg-[#1a1003]', 
        icon: Crown,
        dragonColor: '#f59e0b',
        borderInner: 'border-amber-500/30'
      };
    case 'PLUS':
      return {
        conic: 'from-[#d8b4fe] via-[#7c3aed] to-[#d8b4fe]', // Purple
        shadow: 'shadow-[0_0_50px_-12px_rgba(139,92,246,0.7)]',
        text: 'text-purple-400',
        textGlow: 'drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]',
        bgInner: 'bg-[#10031a]',
        icon: Star,
        dragonColor: '#a855f7',
        borderInner: 'border-purple-500/30'
      };
    default: // BASIC
      return {
        conic: 'from-[#67e8f9] via-[#0891b2] to-[#67e8f9]', // Cyan
        shadow: 'shadow-[0_0_50px_-12px_rgba(6,182,212,0.7)]',
        text: 'text-cyan-400',
        textGlow: 'drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]',
        bgInner: 'bg-[#03131a]',
        icon: Shield,
        dragonColor: '#06b6d4',
        borderInner: 'border-cyan-500/30'
      };
  }
};

const PublicMemberCard: React.FC<PublicMemberCardProps> = ({ nickname }) => {
  const { members, transactions, membershipConfigs, refreshData } = useData();
  const { t } = useLanguage();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Real-time Clock
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Data
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Find Member
  useEffect(() => {
    if (members.length > 0) {
      const found = members.find(m => 
        m.nickname.toLowerCase() === nickname.toLowerCase() || 
        m.id === nickname
      );
      setMember(found || null);
      setLoading(false);
    }
  }, [members, nickname]);

  // Stats Calculation
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
    const currentProgressTotal = member.hoursProgressToNextBonus + projectedHours;
    const effectiveProgress = currentProgressTotal % config.bonusThreshold;
    const progressPercent = Math.min(100, (effectiveProgress / config.bonusThreshold) * 100);

    return {
        totalPlayTime: totalPlayTimeRealtime,
        bonusBalance: member.freeHoursBalance,
        activeTx,
        formattedElapsedTime,
        config,
        progressPercent,
        joinDate: new Date(member.joinDate).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }),
        hoursToNextBonus: Math.max(0, config.bonusThreshold - effectiveProgress).toFixed(1)
    };
  }, [member, transactions, now, membershipConfigs]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050510] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!member || !stats) {
    return (
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center text-slate-400 p-8 text-center font-sans">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Member Tidak Ditemukan</h1>
        <p>Pastikan link atau nickname yang Anda masukkan benar.</p>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const TierIcon = theme.icon;

  return (
    <div className="min-h-screen w-full relative flex items-center justify-center font-sans p-4 overflow-hidden">
      <GamingBackground />

      {/* --- CARD WRAPPER --- */}
      {/* Note: NO overflow-hidden here so icon can float out */}
      <div className="relative w-full max-w-sm aspect-[9/16] z-10">
        
        {/* --- 1. ROTATING BORDER BEAM --- */}
        <div className="absolute -inset-[3px] rounded-[38px] overflow-hidden">
            {/* The Conic Gradient Spinner */}
            <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[conic-gradient(transparent_0deg,transparent_80deg,white_180deg,transparent_280deg,transparent_360deg)] opacity-60 mix-blend-overlay`}></div>
            {/* Colored Conic Spinner */}
            <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[conic-gradient(transparent_0deg,transparent_90deg,currentColor_180deg,transparent_270deg,transparent_360deg)] ${theme.text} opacity-80 blur-md`}></div>
        </div>

        {/* --- 2. STATIC INNER CONTENT BOX --- */}
        <div className={`relative h-full w-full rounded-[35px] ${theme.bgInner} ${theme.shadow} flex flex-col items-center p-6 border ${theme.borderInner} overflow-hidden`}>
            
            {/* Background Texture (Dragon) */}
            <DragonPattern color={theme.dragonColor} />
            
            {/* Avatar & Info */}
            <div className="relative mt-8 mb-6 flex flex-col items-center w-full z-10">
                <div className="relative group">
                    <div className={`absolute -inset-1 rounded-full opacity-60 blur-lg bg-gradient-to-tr ${theme.conic} animate-pulse`}></div>
                    <div className="w-28 h-28 rounded-full p-[2px] bg-gradient-to-b from-white/20 to-transparent relative z-10">
                        <img 
                            src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                            alt={member.name} 
                            className="w-full h-full rounded-full object-cover bg-black border-2 border-black/80"
                        />
                    </div>
                    {/* Tier Badge Pill */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 z-20 whitespace-nowrap shadow-xl border border-white/10 bg-gradient-to-r ${theme.conic} text-white`}>
                        <Hexagon size={10} fill="currentColor" />
                        {member.membershipId}
                    </div>
                </div>

                <div className="mt-6 text-center space-y-1">
                    <h1 className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                        {member.name}
                    </h1>
                    <p className={`text-xs font-bold tracking-[0.25em] uppercase opacity-90 ${theme.text} ${theme.textGlow}`}>
                        @{member.nickname}
                    </p>
                </div>
            </div>

            {/* Glowing Stats Grid */}
            <div className="grid grid-cols-2 gap-4 w-full mb-6 relative z-10">
                {/* Stat Box 1 */}
                <div className="relative group/box rounded-2xl bg-black/40 backdrop-blur-md overflow-hidden p-4 flex flex-col items-center justify-center gap-1">
                    <div className={`absolute inset-0 border border-white/5 rounded-2xl`}></div>
                    {/* Inner Rotating Border for Box */}
                    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${theme.conic} opacity-0 group-hover/box:opacity-30 transition-opacity duration-500`}></div>
                    
                    <Clock size={18} className={`${theme.text} mb-1 relative z-10`} />
                    <span className="text-2xl font-black text-white tracking-tight relative z-10">{parseFloat(stats.totalPlayTime)}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest relative z-10">Total Jam</span>
                </div>

                {/* Stat Box 2 */}
                <div className="relative group/box rounded-2xl bg-black/40 backdrop-blur-md overflow-hidden p-4 flex flex-col items-center justify-center gap-1">
                    <div className={`absolute inset-0 border border-white/5 rounded-2xl`}></div>
                    <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-br ${theme.conic} opacity-0 group-hover/box:opacity-30 transition-opacity duration-500`}></div>

                    <Trophy size={18} className="text-yellow-500 mb-1 relative z-10" />
                    <span className="text-2xl font-black text-white tracking-tight relative z-10">{stats.bonusBalance}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest relative z-10">Saldo Bonus</span>
                </div>
            </div>

            {/* Active Session */}
            {stats.activeTx ? (
                <div className="w-full mb-6 relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-emerald-950/20 z-10">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-10"></div>
                    <div className="relative p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)] animate-pulse">
                                <Gamepad2 size={20} />
                            </div>
                            <div>
                                <p className="text-[8px] font-bold uppercase text-emerald-400 tracking-wider mb-0.5">Online Now</p>
                                <p className="text-xs font-bold text-white max-w-[100px] truncate">{stats.activeTx.consoleName}</p>
                            </div>
                        </div>
                        <p className="text-xl font-mono font-black text-white tracking-tight drop-shadow-md">
                            {stats.formattedElapsedTime}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="w-full mb-6 p-3 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-2 text-slate-500 z-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-slate-600"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Currently Offline</span>
                </div>
            )}

            {/* Progress Bar */}
            <div className="w-full mt-auto mb-4 relative z-10">
                <div className="flex justify-between items-end px-1 mb-2">
                    <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                        <Zap size={10} className={theme.text}/> Next Bonus
                    </span>
                    <span className={`text-[10px] font-bold ${theme.text}`}>{stats.progressPercent.toFixed(0)}%</span>
                </div>
                <div className="h-2 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10 shadow-inner relative">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden bg-gradient-to-r ${theme.conic}`}
                        style={{ width: `${stats.progressPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/40 animate-[shimmer_2s_infinite] skew-x-12"></div>
                    </div>
                </div>
                <p className="text-[9px] text-center text-slate-500 mt-2 font-medium tracking-wide">
                    Main <strong className="text-white">{stats.hoursToNextBonus} jam</strong> lagi untuk reward!
                </p>
            </div>

            {/* Footer */}
            <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold tracking-wider relative z-10">
                <span className="flex items-center gap-1.5"><Calendar size={10}/> SINCE {stats.joinDate}</span>
                <span className="opacity-40">ZIEZAN STATION</span>
            </div>
        </div>

        {/* --- 3. FLOATING RANK ICON (ABSOLUTE TO WRAPPER, OUTSIDE BOX) --- */}
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-50">
             <div className={`relative ${theme.text} ${theme.textGlow} animate-bounce-slow`}>
                 <TierIcon size={56} fill="currentColor" strokeWidth={1.5} className="drop-shadow-2xl" />
                 {/* Sparkle Effect behind icon */}
                 <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white/20 blur-2xl rounded-full -z-10`}></div>
             </div>
        </div>

      </div>
    </div>
  );
};

export default PublicMemberCard;
