
import React from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Trophy, AlertCircle, Gamepad2, Crown } from 'lucide-react';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';

const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  const { members, transactions } = useData();
  const { t, language } = useLanguage();

  // Find member
  const member = members.find(m => 
    m.nickname.toLowerCase() === nickname.toLowerCase() || 
    m.name.toLowerCase() === nickname.toLowerCase()
  );

  if (!member) {
    return (
      <div className="h-screen w-full bg-[#050b14] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Member Not Found</h1>
        <p className="text-slate-400 mt-2 text-center">Maaf, data member "{nickname}" tidak ditemukan atau belum disinkronkan.</p>
        <a href="/" className="mt-8 px-6 py-3 bg-palette-mustard rounded-xl text-sm font-bold shadow-lg shadow-palette-mustard/30 hover:scale-105 transition-all">Kembali ke Beranda</a>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const isPlaying = transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');
  const joinDate = new Date(member.joinDate).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
  });

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white font-sans relative flex items-center justify-center overflow-hidden">
      
      {/* Background Animasi Hexagon dari Landing Page */}
      <GamingBackground />
      
      {/* Container Utama Kartu */}
      <div className="relative w-[92vw] max-w-[480px] aspect-[1.7/1] animate-float group">
          
          {/* Efek Border Berputar */}
          <div className="absolute -inset-[2px] rounded-2xl overflow-hidden">
              <div className={`absolute inset-[-100%] animate-spin-border bg-[conic-gradient(from_0deg,transparent,currentColor,transparent,currentColor,transparent)] ${theme.text} opacity-80 blur-[2px]`}></div>
          </div>

          {/* Glow Tambahan */}
          <div className={`absolute -inset-4 bg-gradient-to-r ${theme.conic} opacity-20 blur-3xl rounded-full`}></div>

          {/* Kartu (Content) */}
          <div className="relative h-full w-full rounded-2xl overflow-hidden bg-[#0f0720] shadow-2xl flex flex-col border border-white/5">
              
              {/* Background Layers */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] via-[#0f0720] to-[#000000]"></div>
              <div className={`absolute inset-0 bg-gradient-to-tr ${theme.conic} opacity-10`}></div>
              
              {/* Watermark Logo SVG */}
              <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
                  {/* FIX: Use 'xmlSpace' instead of 'xml:space' for React SVG attributes */}
                  <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 367.7 381.2" className={`w-[85%] h-[85%] opacity-15 ${theme.text} fill-current`}>
                      <path d="M156.487 381.053c-27.308-1.446-46.452-11.7-58.374-31.264-1.336-2.192-1.903-2.547-2.787-1.748-.488.442-.62.972-.616 2.487 0 4.556 2.336 9.162 5.9 11.673 1.771 1.25 1.513 1.45-.428.335-2.829-1.625-6.2-5.385-7.826-8.726-3.845-7.903-4.844-21.123-2.365-31.286l.672-2.754-.68-1.1c-1.431-2.316-2.974-1.666-4.84 2.037-1.569 3.117-2.735 7.842-2.979 12.08-.108 1.87-.233 3.364-.279 3.318-.05-.045-.246-2.328-.447-5.071-.726-9.964 1.269-20.035 5.589-28.194 4.299-8.12 4.785-9.7 3.443-11.184-.967-1.069-1.947-.832-3.802.923-1.872 1.77-3.41 4.41-4.505 7.734l-.729 2.212.177-2.006c.745-8.446 7.194-17.88 16.332-23.895 3.545-2.335 4.198-3.08 4.533-5.172.934-5.84-7.425-2.17-10.799 4.743-1.256 2.573-1.244 1.59.02-1.796 2.43-6.501 7.104-9.71 17.468-11.994 5.154-1.135 5.253-1.21 8.026-5.985 2.673-4.605 3.054-4.931 5.764-4.931 4.716 0 7.15-1.11 9.911-4.512 2.692-3.32 3.169-3.528 5.923-2.584 4.164 1.428 6.839.89 8.604-1.728 1.12-1.661.979-1.919-.941-1.717-12.396 1.302-26.526 7.395-36.651 15.805-2.939 2.441-4.633 3.19-6.025 2.66-.688-.26-.814-.551-.998-2.294-.592-5.637-1.492-8.93-3.57-13.056-5.981-11.876-19.577-20.724-37.455-24.378-5.915-1.209-17.376-1.299-22.908-.18-8.279 1.673-15.312 5.218-18.189 9.166-1.749 2.4-2.604 4.383-4.275 9.925-2.066 6.85-2.119 7.307-1.454 12.525l.56 4.384-.683 1.41c-.869 1.794-.881 1.498.427 9.466 1.647 10.031 2.406 15.808 2.355 17.927-.07 2.746-5.435-16.432-6.767-24.177-2.283-13.269-2.33-27.518-.138-42.14 1.823-12.162 4.507-23.13 11.026-45.056 5.139-17.286 6.319-22.701