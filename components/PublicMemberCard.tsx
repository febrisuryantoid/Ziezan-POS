import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, CheckCircle, Loader2, RefreshCw, AlertCircle, WifiOff } from 'lucide-react';
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

            if (error) {
                console.error("Supabase Error:", error);
                throw error;
            }

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
                    freeHoursBalance: 0,
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

  // Loading State
  if (isLoading) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl flex flex-col items-center animate-fade-in">
                <Loader2 className="w-12 h-12 text-palette-mustard animate-spin mb-4" />
                <h3 className="text-slate-900 dark:text-white font-bold text-lg">Mencari Data Member</h3>
                <p className="text-slate-500 text-sm font-medium mt-1">Mengambil data dari Cloud...</p>
              </div>
          </div>
      );
  }

  // Error State (Network or RLS)
  if (error) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
              <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <WifiOff size={40} />
              </div>
              <h1 className="text-xl font-bold mb-2 text-slate-800 dark:text-slate-200">Gagal Terhubung</h1>
              <p className="text-sm text-center max-w-xs leading-relaxed mb-6">
                Terjadi kesalahan saat menghubungi server.<br/>
                <span className="text-xs opacity-70 mt-2 block font-mono bg-slate-200 dark:bg-slate-800 p-2 rounded">{error.slice(0, 50)}...</span>
              </p>
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-sm shadow-sm hover:bg-slate-50">
                Coba Lagi
              </button>
          </div>
      );
  }
  
  // Not Found State
  if (!member) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400">
              <div className="w-24 h-24 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <AlertCircle size={48} className="opacity-40" />
              </div>
              <h1 className="text-2xl font-bold mb-2 text-slate-800 dark:text-slate-200">Member Tidak Ditemukan</h1>
              <p className="text-sm text-center max-w-xs leading-relaxed mb-6">
                Data dengan nickname <span className="font-bold text-palette-mustard">@{decodeURIComponent(nickname)}</span> tidak ditemukan atau belum disinkronisasi ke publik.
              </p>
              
              <button onClick={() => window.location.reload()} className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm">
                <RefreshCw size={16} /> Coba Lagi
              </button>
          </div>
      );
  }

  const membership = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
  
  const getStyles = (id: string) => {
    switch(id) {
      case 'VIP':
        return {
          bg: 'bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600',
          text: 'text-amber-950',
          accent: 'bg-white/30',
          icon: <Crown size={32} className="text-amber-900" />
        };
      case 'PLUS':
        return {
          bg: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700',
          text: 'text-white',
          accent: 'bg-white/20',
          icon: <Star size={32} className="text-white" />
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-slate-200 via-slate-300 to-slate-400',
          text: 'text-slate-800',
          accent: 'bg-white/50',
          icon: <Shield size={32} className="text-slate-700" />
        };
    }
  };

  const style = getStyles(member.membershipId);
  const avatarSrc = member.photoUrl && member.photoUrl.length > 10 ? member.photoUrl : "https://beeimg.com/images/s77882238754.png";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
       <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden relative border border-slate-200 dark:border-white/5 animate-zoom-in">
           
           <div className={`h-48 relative ${style.bg} flex items-center justify-center overflow-hidden`}>
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
               
               <div className="text-center relative z-10 -mt-4">
                   <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md shadow-lg mb-2 ring-4 ring-white/10 animate-pulse-slow">
                       {style.icon}
                   </div>
                   <h2 className={`text-3xl font-black uppercase tracking-wider ${style.text} drop-shadow-sm`}>{membership.name}</h2>
                   <p className={`text-[10px] font-bold uppercase tracking-[0.2em] opacity-80 ${style.text}`}>Membership Card</p>
               </div>
           </div>

           <div className="relative -mt-16 text-center z-20">
               <div className="inline-block p-1.5 rounded-full bg-white dark:bg-slate-900 shadow-xl relative">
                   <img 
                    src={avatarSrc} 
                    alt={member.name}
                    className="w-32 h-32 rounded-full object-cover bg-slate-50 border border-slate-100 dark:border-slate-800"
                    onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/s77882238754.png")}
                   />
                   <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-900 rounded-full" title="Active"></div>
               </div>
           </div>

           <div className="px-8 pt-4 pb-10 text-center">
               <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1 leading-tight">{member.name}</h1>
               <div className="inline-block px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-8">
                 <p className="text-slate-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wide">@{member.nickname}</p>
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col items-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                       <Clock size={24} className="text-palette-mustard mb-2" />
                       <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{t('total_play')}</span>
                       <span className="text-2xl font-black text-slate-900 dark:text-white">{member.totalPlayTime} <span className="text-sm font-bold text-slate-400">{t('hour_short')}</span></span>
                   </div>
                   <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col items-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
                       <Calendar size={24} className="text-palette-purple mb-2" />
                       <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wide">{t('joined')}</span>
                       <span className="text-2xl font-black text-slate-900 dark:text-white">{new Date(member.joinDate).getFullYear()}</span>
                   </div>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 py-2.5 px-5 rounded-full w-fit mx-auto border border-emerald-100 dark:border-emerald-900/30">
                        <CheckCircle size={18} className="fill-current" />
                        <span>{t('verified_member')}</span>
                    </div>
                    <p className="mt-6 text-[10px] text-slate-400 font-medium">
                      Ziezan Station {t('member_card_footer')} &copy; {new Date().getFullYear()}
                    </p>
               </div>
           </div>
       </div>
    </div>
  );
};

export default PublicMemberCard;