
import React, { useEffect, useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, Loader2, AlertCircle, Gamepad2, Zap, Trophy, Sparkles, Hexagon } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { Member } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

// --- COSMIC BACKGROUND COMPONENT ---
export const CosmicBackground = () => (
  <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden bg-[#050510]">
    {/* Deep Space Gradients */}
    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/20 rounded-full blur-[120px] animate-pulse-slow"></div>
    
    {/* Stars / Particles */}
    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>
  </div>
);

// --- TIER THEME CONFIGURATION ---
export const getTierTheme = (id: string) => {
  switch(id) {
    case 'VIP':
      return {
        // Frame & Glow
        container: 'bg-black/40 backdrop-blur-2xl border-[3px] border-amber-500/60 shadow-[0_0_50px_-10px_rgba(245,158,11,0.5)]',
        borderGradient: 'bg-gradient-to-b from-amber-300 via-yellow-500 to-amber-700',
        innerGlow: 'shadow-[inset_0_0_30px_rgba(245,158,11,0.2)]',
        
        // Text Colors
        textTitle: 'text-amber-100',
        textSub: 'text-amber-400',
        textValue: 'text-white drop-shadow-[0_0_5px_rgba(245,158,11,0.8)]',
        
        // Components
        icon: Crown,
        badgeStyle: 'bg-gradient-to-r from-amber-600 to-yellow-600 text-white shadow-lg shadow-amber-500/50 ring-2 ring-amber-300',
        progressFill: 'bg-gradient-to-r from-amber-400 to-yellow-600 shadow-[0_0_15px_rgba(245,158,11,0.8)]',
        
        // Ornaments
        ornament: true,
        particleColor: 'text-amber-400',
        cardShape: 'rounded-[3rem]'
      };
    case 'PLUS':
      return {
        container: 'bg-black/40 backdrop-blur-2xl border-[2px] border-purple-500/50 shadow-[0_0_30px_-10px_rgba(168,85,247,0.4)]',
        borderGradient: 'bg-gradient-to-b from-fuchsia-400 via-purple-500 to-indigo-600',
        innerGlow: 'shadow-[inset_0_0_20px_rgba(168,85,247,0.15)]',
        
        textTitle: 'text-purple-50',
        textSub: 'text-purple-300',
        textValue: 'text-white drop-shadow-[0_0_5px_rgba(168,85,247,0.6)]',
        
        icon: Star,
        badgeStyle: 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/40 ring-1 ring-purple-300',
        progressFill: 'bg-gradient-to-r from-fuchsia-500 to-purple-600 shadow-[0_0_10px_rgba(168,85,247,0.6)]',
        
        ornament: false,
        particleColor: 'text-purple-400',
        cardShape: 'rounded-[2.5rem]'
      };
    default: // BASIC
      return {
        container: 'bg-black/40 backdrop-blur-2xl border-[1px] border-cyan-500/30 shadow-[0_0_20px_-10px_rgba(6,182,212,0.3)]',
        borderGradient: 'bg-gradient-to-b from-cyan-300 via-cyan-500 to-blue-600',
        innerGlow: 'shadow-[inset_0_0_15px_rgba(6,182,212,0.1)]',
        
        textTitle: 'text-cyan-50',
        textSub: 'text-cyan-300',
        textValue: 'text-white',
        
        icon: Shield,
        badgeStyle: 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow shadow-cyan-500/30 ring-1 ring-cyan-300/50',
        progressFill: 'bg-gradient-to-r from-cyan-400 to-blue-500 shadow-[0_0_8px_rgba(6,182,212,0.5)]',
        
        ornament: false,
        particleColor: 'text-cyan-400',
        cardShape: 'rounded-[2rem]'
      };
  }
};

const PublicMemberCard: React.FC<PublicMemberCardProps> = ({ nickname }) => {
  const { members, transactions, membershipConfigs, refreshData } = useData();
  const { t } = useLanguage();
  
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(new Date());

  // Real-time Clock for Active Session Calc
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Data on Mount
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Find Member Logic
  useEffect(() => {
    if (members.length > 0) {
      const found = members.find(m => 
        m.nickname.toLowerCase() === nickname.toLowerCase() || 
        m.id === nickname // Fallback to ID
      );
      setMember(found || null);
      setLoading(false);
    }
  }, [members, nickname]);

  // --- STATS CALCULATION (REAL-TIME) ---
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
      <div className="min-h-screen bg-[#050510] flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <AlertCircle size={48} className="mb-4 text-red-500" />
        <h1 className="text-2xl font-bold text-white mb-2">Member Tidak Ditemukan</h1>
        <p>Pastikan link atau nickname yang Anda masukkan benar.</p>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const TierIcon = theme.icon;

  return (
    <div className="min-h-screen bg-[#050510] font-sans relative overflow-y-auto overflow-x-hidden flex flex-col items-center py-8 px-4 pb-safe">
      
      <CosmicBackground />

      {/* --- CARD CONTAINER (Vertical Mobile Layout) --- */}
      <div className={`
        relative w-full max-w-sm aspect-[9/16] 
        ${theme.cardShape} ${theme.container} ${theme.innerGlow}
        flex flex-col items-center p-6 z-10 transition-all duration-700
      `}>
        
        {/* ORNAMENTAL FRAME LAYERS (VIP Only) */}
        {theme.ornament && (
            <>
                <div className="absolute top-4 left-4 w-24 h-24 border-t-4 border-l-4 border-amber-500/30 rounded-tl-[2rem] pointer-events-none"></div>
                <div className="absolute top-4 right-4 w-24 h-24 border-t-4 border-r-4 border-amber-500/30 rounded-tr-[2rem] pointer-events-none"></div>
                <div className="absolute bottom-4 left-4 w-24 h-24 border-b-4 border-l-4 border-amber-500/30 rounded-bl-[2rem] pointer-events-none"></div>
                <div className="absolute bottom-4 right-4 w-24 h-24 border-b-4 border-r-4 border-amber-500/30 rounded-br-[2rem] pointer-events-none"></div>
                
                {/* Golden Dust Particles */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40 mix-blend-overlay"></div>
            </>
        )}

        {/* --- HEADER SECTION: AVATAR & IDENTITY --- */}
        <div className="flex flex-col items-center w-full mt-4 mb-6 relative">
            
            {/* Rank Icon (Floating Top) */}
            <div className={`absolute -top-12 z-20 animate-bounce-slow`}>
                <TierIcon size={48} className={`drop-shadow-[0_0_15px_rgba(255,255,255,0.5)] ${theme.particleColor}`} fill="currentColor" />
            </div>

            {/* Avatar Halo */}
            <div className="relative group">
                <div className={`absolute inset-0 rounded-full blur-xl opacity-50 ${theme.borderGradient} animate-pulse-slow`}></div>
                <div className={`w-32 h-32 rounded-full p-[4px] ${theme.borderGradient} shadow-2xl relative z-10`}>
                    <img 
                        src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                        alt={member.name} 
                        className="w-full h-full rounded-full object-cover bg-[#0a0a1a] border-4 border-black"
                    />
                </div>
                
                {/* Tier Badge Pill */}
                <div className={`absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2 z-20 whitespace-nowrap ${theme.badgeStyle}`}>
                    <Hexagon size={10} fill="currentColor" />
                    {member.membershipId}
                </div>
            </div>

            {/* Name */}
            <div className="mt-8 text-center">
                <h1 className={`text-3xl font-black tracking-tight leading-none mb-1 ${theme.textTitle} drop-shadow-md`}>
                    {member.name}
                </h1>
                <p className={`text-sm font-bold tracking-[0.2em] uppercase opacity-80 ${theme.textSub}`}>
                    @{member.nickname}
                </p>
            </div>
        </div>

        {/* --- STATS PANELS (Glassmorphism) --- */}
        <div className="grid grid-cols-2 gap-4 w-full mb-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center gap-1 backdrop-blur-md hover:bg-white/10 transition-colors shadow-inner">
                <Clock size={20} className={`${theme.particleColor} mb-1`} />
                <span className={`text-2xl font-black ${theme.textValue}`}>{parseFloat(stats.totalPlayTime)}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Total Jam</span>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl p-4 flex flex-col items-center justify-center gap-1 backdrop-blur-md hover:bg-white/10 transition-colors shadow-inner">
                <Trophy size={20} className="text-yellow-500 mb-1" />
                <span className={`text-2xl font-black ${theme.textValue}`}>{stats.bonusBalance}</span>
                <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">Saldo Bonus</span>
            </div>
        </div>

        {/* --- ACTIVE SESSION (Optional) --- */}
        {stats.activeTx ? (
            <div className="w-full mb-6 relative group overflow-hidden rounded-3xl">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/40 to-teal-900/40 animate-pulse"></div>
                <div className="relative border border-emerald-500/30 bg-black/20 p-4 flex items-center justify-between backdrop-blur-md">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-500/20 rounded-2xl text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
                            <Gamepad2 size={24} />
                        </div>
                        <div>
                            <p className="text-[9px] font-bold uppercase text-emerald-400 tracking-wider mb-0.5">Sedang Main</p>
                            <p className="text-sm font-bold text-white max-w-[120px] truncate">{stats.activeTx.consoleName}</p>
                        </div>
                    </div>
                    <p className="text-2xl font-mono font-black text-white tracking-tight drop-shadow-md">
                        {stats.formattedElapsedTime}
                    </p>
                </div>
            </div>
        ) : (
            <div className="w-full mb-6 p-4 rounded-3xl border border-white/5 bg-white/5 flex items-center justify-center gap-2 text-slate-500">
                <Gamepad2 size={16} />
                <span className="text-xs font-bold uppercase tracking-wide">Tidak Ada Sesi Aktif</span>
            </div>
        )}

        {/* --- PROGRESS BAR --- */}
        <div className="w-full mt-auto mb-4">
            <div className="flex justify-between items-end px-2 mb-2">
                <span className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-1.5">
                    <Zap size={12} className={theme.particleColor}/> Level Progress
                </span>
                <span className={`text-[10px] font-bold ${theme.textSub}`}>{stats.progressPercent.toFixed(0)}%</span>
            </div>
            <div className="h-4 w-full bg-black/60 rounded-full overflow-hidden p-[2px] border border-white/10 shadow-inner">
                <div 
                    className={`h-full rounded-full transition-all duration-1000 ease-out ${theme.progressFill}`}
                    style={{ width: `${stats.progressPercent}%` }}
                >
                    {/* Animated Shine on Bar */}
                    <div className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                </div>
            </div>
            <p className="text-[10px] text-center text-slate-500 mt-2 font-medium">
                Main <strong>{stats.hoursToNextBonus} jam</strong> lagi untuk bonus!
            </p>
        </div>

        {/* --- FOOTER --- */}
        <div className="w-full pt-4 border-t border-white/5 flex justify-between items-center text-[10px] text-slate-500 font-medium tracking-wide">
            <span className="flex items-center gap-1.5"><Calendar size={12}/> Join: {stats.joinDate}</span>
            <span className="uppercase tracking-[0.1em] opacity-50">ZIEZAN STATION</span>
        </div>

      </div>
    </div>
  );
};

export default PublicMemberCard;
