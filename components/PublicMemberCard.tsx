import React, { useEffect, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Crown, Star, Shield, Clock, Calendar, CheckCircle } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';

interface PublicMemberCardProps {
  nickname: string;
}

const PublicMemberCard: React.FC<PublicMemberCardProps> = ({ nickname }) => {
  const { members, membershipConfigs } = useData();
  const { theme, toggleTheme } = useTheme();
  const { t, language } = useLanguage();
  
  // Find member by nickname (case-insensitive)
  // In a real app with backend, this would be an API call
  const member = members.find(m => m.nickname.toLowerCase() === decodeURIComponent(nickname).toLowerCase());
  
  if (!member) {
      return (
          <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400">
              <div className="w-20 h-20 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                  <Shield size={40} className="opacity-50" />
              </div>
              <h1 className="text-xl font-bold mb-2">Member Tidak Ditemukan</h1>
              <p className="text-sm text-center">Maaf, kami tidak dapat menemukan data member dengan nama panggilan <strong>"{nickname}"</strong>.</p>
              <a href="/" className="mt-8 px-6 py-3 bg-palette-mustard text-white rounded-xl font-bold text-sm">Kembali ke Beranda</a>
          </div>
      );
  }

  const membership = membershipConfigs.find(c => c.id === member.membershipId) || membershipConfigs[0];
  
  // Styles based on Tier
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
  const avatarSrc = member.photoUrl ? member.photoUrl : "https://beeimg.com/images/s77882238754.png";

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
       <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl overflow-hidden relative border border-slate-200 dark:border-white/5">
           
           {/* Header / Banner */}
           <div className={`h-48 relative ${style.bg} flex items-center justify-center`}>
               {/* Pattern Overlay */}
               <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.8) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
               
               <div className="text-center relative z-10">
                   <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white/20 backdrop-blur-md shadow-lg mb-2 ring-4 ring-white/10">
                       {style.icon}
                   </div>
                   <h2 className={`text-3xl font-black uppercase tracking-wider ${style.text}`}>{membership.name}</h2>
               </div>
           </div>

           {/* Avatar Overlay */}
           <div className="relative -mt-16 text-center z-20">
               <div className="inline-block p-1.5 rounded-[2rem] bg-white dark:bg-slate-900 shadow-xl">
                   <img 
                    src={avatarSrc} 
                    alt={member.name}
                    className="w-32 h-32 rounded-[1.7rem] object-cover bg-slate-100"
                   />
               </div>
           </div>

           {/* Content */}
           <div className="px-8 pt-4 pb-10 text-center">
               <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-1">{member.name}</h1>
               <p className="text-slate-500 dark:text-slate-400 text-sm font-medium uppercase tracking-wide mb-8">@{member.nickname}</p>

               <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col items-center">
                       <Clock size={20} className="text-palette-mustard mb-2" />
                       <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{t('total_play')}</span>
                       <span className="text-xl font-black text-slate-900 dark:text-white">{member.totalPlayTime} {t('hour_short')}</span>
                   </div>
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex flex-col items-center">
                       <Calendar size={20} className="text-palette-purple mb-2" />
                       <span className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">{t('joined')}</span>
                       <span className="text-xl font-black text-slate-900 dark:text-white">{new Date(member.joinDate).getFullYear()}</span>
                   </div>
               </div>

               <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5">
                    <div className="flex items-center justify-center gap-2 text-emerald-500 font-bold text-sm bg-emerald-50 dark:bg-emerald-900/20 py-2 px-4 rounded-full w-fit mx-auto">
                        <CheckCircle size={16} />
                        <span>{t('verified_member')}</span>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400">Ziezan Station {t('member_card_footer')} &copy; {new Date().getFullYear()}</p>
               </div>
           </div>
       </div>
    </div>
  );
};

export default PublicMemberCard;