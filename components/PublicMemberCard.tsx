import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, CheckCircle2, Loader2, RefreshCw, AlertCircle, WifiOff, Sparkles, Gamepad2, Coins } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { supabase } from '../services/supabaseClient';
import { Member, MembershipTierId } from '../types';

interface PublicMemberCardProps {
  nickname: string;
}

const PublicMemberCard: React.FC<PublicMemberCardProps> = ({ nickname }) => {
  const { membershipConfigs } = useData(); 
  const { t } = useLanguage();
  
  const [member, setMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
      const fetchPublicMember = async () => {
        try {
            setIsLoading(true);
            const decodedName = decodeURIComponent(nickname).trim();

            const { data, error } = await supabase
                .from('members')
                .select('*')
                .ilike('nickname', decodedName)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                const mappedMember: Member = {
                    id: data.id,
                    name: data.name,
                    nickname: data.nickname,
                    phone: '', 
                    address: '',
                    notes: '',
                    membershipId: data.membership_type as MembershipTierId || 'BASIC',
                    membershipExpiryDate: data.membership_expiry_date,
                    joinDate: data.joined_at,
                    totalPlayTime: data.total_hours_played || 0,
                    totalAmountPaid: 0, 
                    hoursProgressToNextBonus: 0, 
                    freeHoursBalance: data.bonus_balance || 0,
                    totalBonusHoursUsed: 0,
                    status: data.status || 'ACTIVE',
                    photoUrl: data.photo_url,
                    synced: true
                };
                setMember(mappedMember);
            } else {
                setMember(null);
            }
        } catch (err: any) {
            console.error("Error fetching public member:", err);
            setError(err.message || "Gagal memuat data");
        } finally {
            setIsLoading(false);
        }
      };

      fetchPublicMember();
  }, [nickname]);

  // --- THEME ENGINE ---
  const getTheme = (tierId: string) => {
    switch(tierId) {
      case 'VIP':
        return {
          // Border Animation Colors
          borderGradient: 'bg-[conic-gradient(#F59E0B,#FCD34D,#FFFBEB,#F59E0B,#FCD34D,#FFFBEB,#F59E0B)]', // Gold/Amber
          // Background Glow
          glowColor: 'bg-amber-500',
          // Text & Icons
          icon: <Crown size={28} className="fill-amber-400 text-amber-600 animate-pulse" />,
          tierName: 'VIP MEMBER',
          textColor: 'text-amber-950 dark:text-amber-100',
          accentColor: 'text-amber-600 dark:text-amber-400',
          badgeBg: 'bg-amber-100/80 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700',
          ringColor: 'ring-amber-400',
          gradientBg: 'from-amber-500/10 to-orange-500/10'
        };
      case 'PLUS':
        return {
          borderGradient: 'bg-[conic-gradient(#8B5CF6,#C4B5FD,#EDE9FE,#8B5CF6,#C4B5FD,#EDE9FE,#8B5CF6)]', // Violet/Purple
          glowColor: 'bg-violet-500',
          icon: <Star size={28} className="fill-violet-400 text-violet-600 animate-spin-slow" />,
          tierName: 'PLUS MEMBER',
          textColor: 'text-violet-950 dark:text-violet-100',
          accentColor: 'text-violet-600 dark:text-violet-400',
          badgeBg: 'bg-violet-100/80 dark:bg-violet-900/30 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-700',
          ringColor: 'ring-violet-400',
          gradientBg: 'from-violet-500/10 to-fuchsia-500/10'
        };
      default: // BASIC
        return {
          borderGradient: 'bg-[conic-gradient(#3B82F6,#93C5FD,#DBEAFE,#3B82F6,#93C5FD,#DBEAFE,#3B82F6)]', // Blue/Silver
          glowColor: 'bg-blue-500',
          icon: <Shield size={28} className="fill-blue-400 text-blue-600" />,
          tierName: 'BASIC MEMBER',
          textColor: 'text-slate-900 dark:text-slate-100',
          accentColor: 'text-blue-600 dark:text-blue-400',
          badgeBg: 'bg-blue-50/80 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700',
          ringColor: 'ring-blue-400',
          gradientBg: 'from-blue-500/10 to-cyan-500/10'
        };
    }
  };

  // Loading View
  if (isLoading) {
      return (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0f0720] relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5"></div>
              <div className="relative z-10 flex flex-col items-center">
                <div className="relative">
                    <div className="absolute inset-0 bg-palette-mustard/30 blur-xl rounded-full animate-pulse"></div>
                    <Loader2 className="w-16 h-16 text-palette-mustard animate-spin relative z-10" />
                </div>
                <h3 className="text-slate-900 dark:text-white font-bold text-lg mt-6 tracking-widest uppercase">Searching Database</h3>
                <p className="text-slate-500 text-xs font-mono mt-1">SINKRONISASI DATA CLOUD...</p>
              </div>
          </div>
      );
  }

  // Error View
  if (error || !member) {
      return (
          <div className="h-[100dvh] w-full flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-[#0f0720] text-slate-600 dark:text-slate-400 relative overflow-hidden">
              {/* Background Noise */}
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] dark:opacity-[0.05]"></div>
              
              <div className="relative z-10 bg-white/50 dark:bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-slate-200 dark:border-white/10 shadow-2xl max-w-sm text-center">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 mx-auto shadow-inner ring-4 ring-red-50 dark:ring-red-900/10">
                      {error ? <WifiOff size={32} /> : <AlertCircle size={32} />}
                  </div>
                  <h1 className="text-xl font-black mb-2 text-slate-800 dark:text-white uppercase tracking-tight">
                    {error ? "Koneksi Terputus" : "Member Tidak Ditemukan"}
                  </h1>
                  <p className="text-sm leading-relaxed mb-8 opacity-80">
                    {error ? "Gagal menghubungi server database." : `Data untuk nickname @${decodeURIComponent(nickname)} tidak tersedia.`}
                  </p>
                  
                  <button onClick={() => window.location.reload()} className="w-full py-3.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-all shadow-lg active:scale-95">
                    <RefreshCw size={16} /> Coba Lagi
                  </button>
              </div>
          </div>
      );
  }

  const theme = getTheme(member.membershipId);
  const avatarSrc = member.photoUrl && member.photoUrl.length > 10 ? member.photoUrl : "https://beeimg.com/images/s77882238754.png";

  return (
    // MAIN CONTAINER - Full Height, No Scroll
    <div className="h-[100dvh] w-full bg-slate-100 dark:bg-[#0a0514] flex items-center justify-center p-4 sm:p-6 transition-colors duration-500 relative overflow-hidden font-sans">
       
       {/* 1. ANIMATED GAMING BACKGROUND */}
       <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
           {/* Grid Pattern */}
           <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
           
           {/* Moving Blobs */}
           <div className={`absolute top-[-10%] left-[-10%] w-[60vmin] h-[60vmin] ${theme.glowColor} rounded-full blur-[120px] opacity-20 animate-pulse-slow`}></div>
           <div className={`absolute bottom-[-10%] right-[-10%] w-[60vmin] h-[60vmin] ${theme.glowColor} rounded-full blur-[120px] opacity-20 animate-pulse-slow delay-1000`}></div>
       </div>

       {/* 2. CARD WRAPPER - SCALABLE & CENTERED */}
       <div className="relative w-full max-w-[380px] group animate-zoom-in z-10">
           
           {/* 3. ANIMATED BORDER (LOGIN STYLE) */}
           <div className="absolute -inset-[3px] rounded-[36px] overflow-hidden opacity-70 dark:opacity-100">
               <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow ${theme.borderGradient}`}></div>
           </div>

           {/* 4. MAIN CARD CONTENT - GLASSMORPHISM */}
           <div className="relative bg-white/90 dark:bg-[#1a1625]/90 backdrop-blur-2xl rounded-[34px] p-6 sm:p-8 shadow-2xl flex flex-col items-center border border-white/40 dark:border-white/5">
               
               {/* TOP BADGE */}
               <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 border backdrop-blur-md shadow-sm ${theme.badgeBg}`}>
                   {theme.icon}
                   <span className="text-[10px] font-black tracking-[0.2em] uppercase">{theme.tierName}</span>
               </div>

               {/* AVATAR SECTION with GLOWING RING */}
               <div className="relative mb-6 group-hover:scale-105 transition-transform duration-500 ease-out">
                   <div className={`absolute -inset-1 rounded-full blur opacity-40 group-hover:opacity-70 transition-opacity ${theme.glowColor}`}></div>
                   <div className={`relative p-1.5 rounded-full bg-white dark:bg-[#1a1625] ring-2 ${theme.ringColor}`}>
                        <img 
                            src={avatarSrc} 
                            alt={member.name}
                            className="w-28 h-28 rounded-full object-cover bg-slate-100 dark:bg-white/5"
                            onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/s77882238754.png")}
                        />
                        <div className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full ring-4 ring-white dark:ring-[#1a1625] shadow-lg">
                            <CheckCircle2 size={14} strokeWidth={4} />
                        </div>
                   </div>
               </div>

               {/* IDENTITY SECTION */}
               <div className="text-center w-full mb-8">
                   <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white leading-tight mb-1 truncate px-2">
                       {member.name}
                   </h1>
                   <div className="inline-block bg-slate-100 dark:bg-white/5 px-3 py-1 rounded-lg mt-1">
                       <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wide uppercase">@{member.nickname}</p>
                   </div>
               </div>

               {/* STATS GRID - Floating Cards Style */}
               <div className="grid grid-cols-2 gap-3 w-full mb-8">
                   {/* Playtime */}
                   <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.gradientBg} border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group/stat`}>
                       <div className="absolute inset-0 bg-white/20 dark:bg-white/5 opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                       <Clock size={20} className={`mb-2 ${theme.accentColor}`} />
                       <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('total_play')}</span>
                       <span className={`text-xl font-black ${theme.textColor}`}>
                           {member.totalPlayTime} <span className="text-xs font-bold opacity-60">Jam</span>
                       </span>
                   </div>

                   {/* Join Date */}
                   <div className={`p-4 rounded-2xl bg-gradient-to-br ${theme.gradientBg} border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center text-center relative overflow-hidden group/stat`}>
                        <div className="absolute inset-0 bg-white/20 dark:bg-white/5 opacity-0 group-hover/stat:opacity-100 transition-opacity"></div>
                       <Calendar size={20} className={`mb-2 ${theme.accentColor}`} />
                       <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{t('joined')}</span>
                       <span className={`text-xl font-black ${theme.textColor}`}>
                           {new Date(member.joinDate).getFullYear()}
                       </span>
                   </div>
                   
                   {/* Bonus (Full Width) */}
                   <div className="col-span-2 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-between px-5 group/stat">
                       <div className="flex items-center gap-3">
                           <div className={`p-2 rounded-full ${theme.glowColor} bg-opacity-20 text-current ${theme.accentColor}`}>
                               <Sparkles size={16} />
                           </div>
                           <div className="flex flex-col text-left">
                               <span className="text-[9px] font-bold uppercase text-slate-400">{t('bonus_balance')}</span>
                               <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                                   {member.freeHoursBalance > 0 ? `${member.freeHoursBalance} Jam Tersedia` : "Tidak ada bonus"}
                               </span>
                           </div>
                       </div>
                       <div className={`h-2 w-2 rounded-full ${member.freeHoursBalance > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-700'}`}></div>
                   </div>
               </div>

               {/* FOOTER */}
               <div className="w-full pt-6 border-t border-slate-100 dark:border-white/5 flex flex-col items-center gap-3">
                   <div className={`px-4 py-2 rounded-full flex items-center gap-2 ${theme.glowColor} bg-opacity-10 dark:bg-opacity-20`}>
                        <Gamepad2 size={14} className={theme.accentColor} />
                        <span className={`text-[10px] font-bold uppercase ${theme.accentColor} tracking-widest`}>
                            Verified Gamer
                        </span>
                   </div>
                   
                   <p className="text-[9px] text-slate-400 font-medium tracking-wide opacity-60">
                       Ziezan Station ID: {member.id.substring(0, 8).toUpperCase()}
                   </p>
               </div>

           </div>
       </div>
    </div>
  );
};

export default PublicMemberCard;