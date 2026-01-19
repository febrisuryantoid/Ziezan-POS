
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, Loader2, AlertCircle, Gamepad2, Zap, Trophy, Hexagon, Sparkles } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

// --- ANIMATED GAMING BACKGROUND ---
export const GamingBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#09090b]">
    {/* Animated Gradient Orbs */}
    <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
    <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
    
    {/* Grid Pattern Overlay */}
    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_100%)]"></div>
    
    {/* Floating Particles (CSS Animation simulation) */}
    <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-3/4 left-1/3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDuration: '5s' }}></div>
        <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
    </div>
  </div>
);

// --- TIER THEME CONFIGURATION ---
export const getTierTheme = (id: string) => {
  switch(id) {
    case 'VIP':
      return {
        // Conic Gradient for Border Animation
        borderGradient: 'conic-gradient(from 0deg, transparent 0deg, #b45309 90deg, #fcd34d 180deg, #b45309 270deg, transparent 360deg)',
        shadowColor: 'shadow-amber-500/50',
        textColor: 'text-amber-400',
        badgeGradient: 'bg-gradient-to-r from-amber-700 to-yellow-500',
        icon: Crown,
        glow: 'drop-shadow-[0_0_15px_rgba(245,158,11,0.8)]',
        bgInner: 'bg-[#1a1005]/90', // Very dark amber/black
        progressColor: 'bg-gradient-to-r from-amber-600 to-yellow-400',
      };
    case 'PLUS':
      return {
        borderGradient: 'conic-gradient(from 0deg, transparent 0deg, #7c3aed 90deg, #e879f9 180deg, #7c3aed 270deg, transparent 360deg)',
        shadowColor: 'shadow-purple-500/50',
        textColor: 'text-fuchsia-400',
        badgeGradient: 'bg-gradient-to-r from-purple-700 to-fuchsia-500',
        icon: Star,
        glow: 'drop-shadow-[0_0_15px_rgba(192,38,211,0.8)]',
        bgInner: 'bg-[#150520]/90', // Very dark purple/black
        progressColor: 'bg-gradient-to-r from-purple-600 to-fuchsia-400',
      };
    default: // BASIC
      return {
        borderGradient: 'conic-gradient(from 0deg, transparent 0deg, #0891b2 90deg, #22d3ee 180deg, #0891b2 270deg, transparent 360deg)',
        shadowColor: 'shadow-cyan-500/50',
        textColor: 'text-cyan-400',
        badgeGradient: 'bg-gradient-to-r from-cyan-800 to-blue-600',
        icon: Shield,
        glow: 'drop-shadow-[0_0_10px_rgba(6,182,212,0.6)]',
        bgInner: 'bg-[#051015]/90', // Very dark cyan/black
        progressColor: 'bg-gradient-to-r from-cyan-600 to-blue-400',
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
      
      {/* Background Layer */}
      <GamingBackground />

      {/* --- MAIN CARD WRAPPER --- */}
      <div className="relative w-full max-w-sm aspect-[9/16] group z-10 transition-transform duration-500 hover:scale-[1.02]">
        
        {/* ANIMATED BORDER LAYER (The 360 Spin) */}
        {/* Layer 1: Sharp Border */}
        <div 
            className="absolute -inset-[3px] rounded-[36px] animate-spin-slow opacity-100"
            style={{ background: theme.borderGradient }}
        ></div>
        
        {/* Layer 2: Glow Blur (Slightly larger to create bloom) */}
        <div 
            className="absolute -inset-[3px] rounded-[36px] animate-spin-slow opacity-60 blur-xl transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: theme.borderGradient }}
        ></div>

        {/* INNER CONTENT CONTAINER (The Mask) */}
        <div className={`relative h-full w-full rounded-[34px] ${theme.bgInner} backdrop-blur-3xl flex flex-col items-center p-6 overflow-hidden`}>
            
            {/* Subtle Texture Overlay inside card */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay"></div>

            {/* --- HEADER: Avatar & Rank --- */}
            <div className="relative mt-4 mb-6 flex flex-col items-center w-full">
                
                {/* Floating Rank Icon */}
                <div className="absolute -top-12 z-20 animate-bounce-slow">
                    <TierIcon size={48} className={`${theme.textColor} ${theme.glow}`} fill="currentColor" strokeWidth={1.5} />
                </div>

                {/* Avatar Container */}
                <div className="relative">
                    {/* Ring Glow */}
                    <div className={`absolute -inset-1 rounded-full opacity-50 blur-md ${theme.badgeGradient}`}></div>
                    
                    {/* Image */}
                    <div className="w-28 h-28 rounded-full p-[3px] bg-gradient-to-b from-white/20 to-transparent relative z-10">
                        <img 
                            src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                            alt={member.name} 
                            className="w-full h-full rounded-full object-cover bg-black border-2 border-black/50"
                        />
                    </div>

                    {/* Tier Badge */}
                    <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 z-20 whitespace-nowrap shadow-lg ring-1 ring-white/20 ${theme.badgeGradient} text-white`}>
                        <Hexagon size={10} fill="currentColor" />
                        {member.membershipId}
                    </div>
                </div>

                {/* Identity */}
                <div className="mt-6 text-center space-y-1">
                    <h1 className="text-2xl font-black text-white tracking-wide drop-shadow-md">
                        {member.name}
                    </h1>
                    <p className={`text-xs font-bold tracking-[0.25em] uppercase opacity-90 ${theme.textColor}`}>
                        @{member.nickname}
                    </p>
                </div>
            </div>

            {/* --- STATS GRID --- */}
            <div className="grid grid-cols-2 gap-4 w-full mb-6 relative z-10">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <Clock size={18} className={`${theme.textColor} mb-1`} />
                    <span className="text-2xl font-black text-white tracking-tight">{parseFloat(stats.totalPlayTime)}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Total Jam</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center justify-center gap-1 backdrop-blur-sm shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]">
                    <Trophy size={18} className="text-yellow-500 mb-1" />
                    <span className="text-2xl font-black text-white tracking-tight">{stats.bonusBalance}</span>
                    <span className="text-[8px] uppercase font-bold text-slate-400 tracking-widest">Saldo Bonus</span>
                </div>
            </div>

            {/* --- ACTIVE SESSION --- */}
            {stats.activeTx ? (
                <div className="w-full mb-6 relative overflow-hidden rounded-2xl border border-emerald-500/30 group/session">
                    <div className="absolute inset-0 bg-emerald-900/20 animate-pulse"></div>
                    <div className="relative p-4 flex items-center justify-between backdrop-blur-md">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/20 rounded-xl text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                <Gamepad2 size={20} />
                            </div>
                            <div>
                                <p className="text-[8px] font-bold uppercase text-emerald-400 tracking-wider mb-0.5">Online Now</p>
                                <p className="text-xs font-bold text-white max-w-[100px] truncate">{stats.activeTx.consoleName}</p>
                            </div>
                        </div>
                        <p className="text-xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_5px_rgba(255,255,255,0.5)]">
                            {stats.formattedElapsedTime}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="w-full mb-6 p-3 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center gap-2 text-slate-500">
                    <div className="w-2 h-2 rounded-full bg-slate-600"></div>
                    <span className="text-[10px] font-bold uppercase tracking-wider">Offline</span>
                </div>
            )}

            {/* --- LEVEL PROGRESS --- */}
            <div className="w-full mt-auto mb-4 relative z-10">
                <div className="flex justify-between items-end px-1 mb-2">
                    <span className="text-[9px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                        <Zap size={10} className={theme.textColor}/> Next Bonus
                    </span>
                    <span className={`text-[10px] font-bold ${theme.textColor}`}>{stats.progressPercent.toFixed(0)}%</span>
                </div>
                {/* Progress Bar Container */}
                <div className="h-3 w-full bg-black/50 rounded-full overflow-hidden p-[2px] border border-white/10 shadow-inner relative">
                    {/* Fill */}
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out relative overflow-hidden ${theme.progressColor}`}
                        style={{ width: `${stats.progressPercent}%` }}
                    >
                        <div className="absolute inset-0 bg-white/30 animate-[shimmer_2s_infinite] skew-x-12"></div>
                    </div>
                </div>
                <p className="text-[9px] text-center text-slate-500 mt-2 font-medium tracking-wide">
                    Main <strong className="text-white">{stats.hoursToNextBonus} jam</strong> lagi untuk reward!
                </p>
            </div>

            {/* --- FOOTER --- */}
            <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center text-[9px] text-slate-500 font-bold tracking-wider relative z-10">
                <span className="flex items-center gap-1.5"><Calendar size={10}/> SINCE {stats.joinDate}</span>
                <span className="opacity-50">ZIEZAN STATION</span>
            </div>

        </div>
      </div>
    </div>
  );
};

export default PublicMemberCard;
