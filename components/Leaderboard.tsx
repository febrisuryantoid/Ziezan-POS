
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getTierTheme } from '../utils/tierTheme';
import GamingBackground from './GamingBackground';
import { Trophy, Search, Loader2, Flame, Medal, Hexagon, Minus, ChevronUp } from 'lucide-react';
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
                 <div className={`w-full ${isFirst ? 'h-52' : 'h-36'} bg-white/5 rounded-t-3xl border-t border-white/10 mx-2`}></div>
            </div>
        );
    }

    const theme = getTierTheme(member.membershipId);
    
    // Layout Calculation
    const containerWidth = isFirst ? "w-[40%] sm:w-[36%]" : "flex-1";
    const zIndex = isFirst ? "z-30" : "z-20";
    const verticalOffset = isFirst ? "-mt-10" : "translate-y-4"; 
    
    // Height & Structure - INCREASED HEIGHT FOR RANK 2/3 (h-48)
    const podiumHeight = isFirst ? 'h-64' : 'h-48'; 
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
            <div className={`w-full ${podiumHeight} relative flex flex-col items-center`}>
                 
                 {/* 1. ANIMATED BORDER LAYER (Behind) */}
                 <div className="absolute -inset-[2px] rounded-t-[1.5rem] overflow-hidden z-0">
                     <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(from_0deg,transparent,currentColor,transparent,currentColor,transparent)] ${theme.text} animate-spin-slow opacity-100`}></div>
                 </div>

                 {/* 2. GLASS BACKGROUND LAYER (Middle) - Inset by 2px to show border */}
                 <div className="absolute inset-[2px] bg-gradient-to-b from-[#1e1b38] to-[#0a0a0a] rounded-t-[1.3rem] z-10"></div>

                 {/* 3. CONTENT LAYER (Front) */}
                 <div className="absolute inset-0 rounded-t-[1.5rem] overflow-hidden z-20">
                     
                     {/* LUXURY SHIMMER EFFECT (On Hover) */}
                     <div className="absolute inset-0 -translate-x-[150%] group-hover:animate-[shimmer_1s_infinite] bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] pointer-events-none z-10"></div>

                     {/* DRAGON BACKGROUND (Centered, Small) */}
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" xmlSpace="preserve" viewBox="0 0 367.7 381.2" className={`w-[50%] h-[50%] opacity-10 ${theme.text} fill-current`}>
                            <path d="M156.487 381.053c-27.308-1.446-46.452-11.7-58.374-31.264-1.336-2.192-1.903-2.547-2.787-1.748-.488.442-.62.972-.616 2.487 0 4.556 2.336 9.162 5.9 11.673 1.771 1.25 1.513 1.45-.428.335-2.829-1.625-6.2-5.385-7.826-8.726-3.845-7.903-4.844-21.123-2.365-31.286l.672-2.754-.68-1.1c-1.431-2.316-2.974-1.666-4.84 2.037-1.569 3.117-2.735 7.842-2.979 12.08-.108 1.87-.233 3.364-.279 3.318-.05-.045-.246-2.328-.447-5.071-.726-9.964 1.269-20.035 5.589-28.194 4.299-8.12 4.785-9.7 3.443-11.184-.967-1.069-1.947-.832-3.802.923-1.872 1.77-3.41 4.41-4.505 7.734l-.729 2.212.177-2.006c.745-8.446 7.194-17.88 16.332-23.895 3.545-2.335 4.198-3.08 4.533-5.172.934-5.84-7.425-2.17-10.799 4.743-1.256 2.573-1.244 1.59.02-1.796 2.43-6.501 7.104-9.71 17.468-11.994 5.154-1.135 5.253-1.21 8.026-5.985 2.673-4.605 3.054-4.931 5.764-4.931 4.716 0 7.15-1.11 9.911-4.512 2.692-3.32 3.169-3.528 5.923-2.584 4.164 1.428 6.839.89 8.604-1.728 1.12-1.661.979-1.919-.941-1.717-12.396 1.302-26.526 7.395-36.651 15.805-2.939 2.441-4.633 3.19-6.025 2.66-.688-.26-.814-.551-.998-2.294-.592-5.637-1.492-8.93-3.57-13.056-5.981-11.876-19.577-20.724-37.455-24.378-5.915-1.209-17.376-1.299-22.908-.18-8.279 1.673-15.312 5.218-18.189 9.166-1.749 2.4-2.604 4.383-4.275 9.925-2.066 6.85-2.119 7.307-1.454 12.525l.56 4.384-.683 1.41c-.869 1.794-.881 1.498.427 9.466 1.647 10.031 2.406 15.808 2.355 17.927-.07 2.746-5.435-16.432-6.767-24.177-2.283-13.269-2.33-27.518-.138-42.14 1.823-12.162 4.507-23.13 11.026-45.056 5.139-17.286 6.319-22.701 6.319-28.99 0-5.354-1.146-7.492-4.013-7.482-6.442.018-20.135 16.72-23.318 28.438-.688 2.534-.787 2.737-.63 1.3.298-2.731 1.952-8.708 3.311-11.96 7.936-18.991 28.369-39.961 63.128-64.786 6.526-4.662 7.028-5.127 7.028-6.513 0-1.45-.306-1.784-1.637-1.784-2.947 0-13.71 4.684-19.73 8.587-3.592 2.329-3.891 2.37-1.86.26 12.552-13.045 45.47-29.729 80.742-40.923 3.389-1.076 7.502-2.618 9.139-3.427 1.637-.809 3.172-1.47 3.411-1.47.238 0 1.117-.64 1.952-1.421 4.277-4 22.828-9.708 26.047-8.013 1.435.755 1.531 1.937.35 4.308-1.087 2.18-3.412 4.213-6.049 5.287-12.268 4.997-25.173 14.752-30.249 22.865-5.978 9.554-8.338 23.139-6.465 37.231.573 4.316.63 5.755.416 10.53-.424 9.49-.241 10.613 3.846 23.607 4.629 14.722 7.936 20.61 17.35 30.904 5.503 6.017 7.239 8.038 7.061 8.216-.08.081-1.13-.654-2.336-1.629-4.201-3.393-9.732-7.393-10.487-7.582-1.448-.364-1.588.373-.478 2.51 4.15 7.99 11.079 12.396 23.465 14.917 3.489.712 6.32 1.79 6.32 2.408 0 .432-1.076.584-3.949.555-3.203-.027-4.951.341-6.481 1.382-2.448 1.668-2.154 2.926 1.04 4.441 1.266.601 3.432 1.83 4.813 2.732 2.847 1.86 3.32 1.68 1.442-.55-1.469-1.742-1.541-1.96-.641-1.96.948 0 2.387.817 4.882 2.777 3.45 2.708 7.111 4.118 7.111 2.74 0-.79-1.089-2.672-2.996-5.177-1.485-1.95-1.703-2.393-1.296-2.621.722-.404 1.6.167 4.471 2.91 3.623 3.459 6.624 4.43 7.399 2.39.475-1.252-.201-2.825-2.415-5.61-5.087-6.404-9.756-14.615-12.44-21.877-2.138-5.783-2.998-6.72-4.24-4.606-.552.94-.675 1.821-.813 5.847l-.164 4.74-1.014-2.041c-1.61-3.238-2.083-5.989-1.896-11.029.176-4.726.576-6.76 2.5-12.685 2.122-6.536 1.776-8.45-1.586-8.773-3.117-.3-5.589 1.69-6.383 5.138-.808 3.506-.865 3.624-.9 1.86-.06-3.019.858-7.038 2.301-10.07 1.619-3.402 3.545-6.005 8.411-11.365 4.649-5.12 5.141-5.984 4.992-8.772-.189-3.554-1.864-4.589-5.821-3.595-5.441 1.367-11.817 6.154-14.676 11.019-.923 1.568-.959 1.594-.753.54.871-4.453 3.575-9.159 7.689-13.38 4.597-4.719 9.228-7.71 20.307-13.117 8.748-4.268 10.647-6.112 10.949-10.634.154-2.28-.636-3.634-2.118-3.634-1.329 0-3.737.81-5.108 1.716-.674.447-1.302.812-1.395.812-.511 0 1.908-3.852 3.21-5.115 2.738-2.655 4.345-3.225 12.721-4.523 7.053-1.092 9.852-2.188 10.932-4.276.68-1.315.578-2.306-.325-3.154-1.974-1.855-11.252-.036-16.271 3.194l-1.105.713 1.105-1.186c5.163-5.533 13.729-7.43 27.713-6.136 6.287.582 8.432.541 8.571-.162.341-1.728-1.875-4.548-4.313-5.488-2.045-.79-7.008-.719-9.933.141-2.571.756-2.367.24.394-1 3.904-1.752 10.066-2.24 15.83-1.256 3.403.581 9.035 2.339 10.606 3.31 2.163 1.337 7.678 10.768 9.443 16.149.857 2.61 1.251 3.372 1.574 3.047.32-.32-2.104-6.745-3.626-9.611-.839-1.58-3.289-5.561-5.447-8.849-4.345-6.619-5.761-8.93-7.05-11.5-1.249-2.493-2.069-5.014-1.703-5.24.694-.429 3.545 1.826 8.179 6.47 2.703 2.709 5.244 5.206 5.648 5.551l.734.625-.636-1.673c-.907-2.386-2.344-4.153-9.038-11.113-6.98-7.257-11.682-12.964-13.169-15.984-1.188-2.413-1.212-2.793-.937-14.985.102-4.471.04-5.215-.757-8.533-1.597-6.684-1.729-7.41-1.418-7.722 1.128-1.128 4.834 5.866 7.402 13.97 3.452 10.889 4.45 13.117 7.716 17.212 3.993 5.01 8.973 9.188 18.129 15.214 5.312 3.495 10.01 7.123 12.069 9.319.511.545 1.044.99 1.186.99.884 0-.113-15.051-1.309-19.751-1.511-5.94-5.207-11.04-9.412-12.99-2.302-1.068-2.521-1.477-.636-1.195 8.262 1.239 13.855 7.602 18.862 21.453 3.445 9.53 5.665 13.17 11.675 19.128 6.005 5.954 15.594 13.769 15.777 12.857.102-.51-2.019-6.858-3.717-11.128-1.483-3.73-2.604-5.565-6.116-10.016-7.8-9.884-9.979-15.56-9.504-24.745.607-11.707.267-15.344-1.916-20.542-.991-2.358-1.022-2.534-.461-2.629 2.091-.35 5.899 5.772 6.876 11.054.18.973.485 3.6.681 5.836.428 4.925 1.002 7.446 2.382 10.464 2.081 4.548 7.121 11.53 14.565 20.175 5.87 6.82 6.865 8.215 8.989 12.615 3.193 6.615 5.186 13.3 6.633 22.25.87 5.385 1.002 5.598 4.939 8.004 3.221 1.968 3.942 2.774 4.807 5.366.363 1.092 1.372 3.052 2.24 4.356 1.924 2.888 2.009 3.962.626 7.885-1.171 3.32-1.17 3.779.02 7.01 1.338 3.63 2.612 5.91 4.463 7.985 2.09 2.344 3.549 3.146 7.512 4.122 3.568.88 4.135 1.164 6.267 3.139.773.717 2.065 1.526 2.872 1.8 1.166.397 1.711.849 2.668 2.213.747 1.064 1.855 2.112 2.923 2.766 1.119.684 1.792 1.332 1.922 1.85.268 1.07-.35 3.725-1.717 7.368-.92 2.452-1.133 3.465-1.164 5.53-.08 5.475-3.631 10.28-11.199 15.174-2.416 1.562-5.664 2.801-6.503 2.48-.682-.263-.603-.459.683-1.695 2.06-1.98 2.951-3.694 2.946-5.671 0-3.576-.585-3.94-3.037-1.914-1.887 1.56-2.156 1.58-1.546.12.669-1.6.608-2.216-.438-4.427-1.255-2.652-1.611-2.78-1.611-.578 0 2.079-.638 3.62-1.958 4.731-1.32 1.11-1.498.99-.957-.655.383-1.164.409-1.83.137-3.474-.309-1.865-1.33-3.933-1.942-3.933-.302 0-1.547 1.84-2.568 3.8l-.738 1.414-.37-2.37c-.364-2.341-2.184-7.268-2.685-7.268-.553 0-.649.698-.169 1.23.667.736.637.981-.119.981-.361 0-.813.367-1.073.87-.248.479-.725 1.12-1.062 1.425-.602.544-.61.51-.468-1.938.116-1.999 0-2.907-.551-4.581-.913-2.742-1.278-2.895-1.278-.534 0 1.8-.04 1.914-.744 1.914-.697 0-.756-.144-.919-2.29-.09-1.26-.352-2.682-.569-3.16-.455-.997-1.244-1.164-1.244-.263 0 .897-.334 1.605-.756 1.605-.227 0-.506-.997-.715-2.554-.335-2.507-1.051-3.944-1.633-3.278-.146.166-.522 1.897-.836 3.846-.66 4.091-.511 4.612 1.614 5.62 1.124.533 1.155.585.498.827-1.087.402-.633 2.176.555 2.176.511 0 .575.167.421 1.106-.165 1.025-.119 1.106.638 1.106 1.08 0 2.426.631 2.426 1.137 0 .284-.326.35-1.106.224-2.317-.376-.901 1.84 1.575 2.462 1.693.427 1.777.72.41 1.427l-1.018.527 1.228 1.061c.676.584 1.537 1.062 1.914 1.062.376 0 .777.094.892.208.418.419-.525 1.057-1.563 1.057-1.304 0-1.321.18-.144 1.608a4.854 4.854 0 0 0 2.284 1.528l1.359.407-.894.77c-.846.727-.872.824-.476 1.782.229.558.962 1.607 1.627 2.33l1.209 1.314-.717.503c-.394.276-.961.502-1.259.502-.965 0-.952.595.04 2.044.865 1.258 3.433 3.166 4.265 3.17.642 0 .956 1.715.414 2.256-.467.468-.887.455-5.198-.164-5.986-.86-6.087-.857-9.449.311-3.991 1.387-6.667 1.435-8.015.146-1.088-1.04-2.043-3.34-2.373-5.71-.442-3.178-.805-3.969-2.816-6.118-1.08-1.153-2.38-2.666-2.891-3.361-4.005-5.454-5.023-6.164-8.818-6.158-6.144.01-10.467 1.948-11.863 5.321-.521 1.256-.968.99-.968-.572 0-1.165.301-1.842 3.433-7.721 1.95-3.662.988-5.57-2.801-5.556-2.454.01-4.204.471-7.11 1.878-3.104 1.502-4.954 3.055-6.174 5.182-.787 1.371-.93 1.497-.933.814 0-1.257 1.373-3.697 3.649-6.461 2.391-2.907 3.301-4.496 3.301-5.774 0-4.684-10.106-3.371-12.333 1.603-.782 1.747-1.09.657-.604-2.135.346-1.987.676-2.721 4.624-10.296 2.064-3.96 1.653-7.14-1.244-9.619-2.069-1.77-3.709-2.255-6.018-1.779-4.223.873-8.643 3.96-10.163 7.101l-.785 1.622v-1.61c-.02-2.154.761-4.282 3.436-9.417 1.685-3.236 2.241-4.615 2.241-5.565 0-2.918-3.39-3.927-8.611-2.566-1.98.516-2.133.519-2.133.027 0-1.265 3.212-4.657 6.44-6.8.977-.648 1.776-1.229 1.776-1.288 0-.542-2.751-1.16-5.215-1.174-4.443-.027-7.384.878-11.246 3.445-1.847 1.228-3.661 3.192-3.29 3.563.06.063.966-.393 1.999-1.02 3.169-1.925 4.54-1.803 6.642.591 1.205 1.372 2.355 3.55 2.096 3.969-.103.167-.713-.11-1.354-.617-1.829-1.445-3.408-1.783-5.465-1.169-3.261.975-5.931 3.696-7.336 7.474-.707 1.904-.686 1.98.401 1.419 1.613-.834 3.015-.625 4.44.662" />
                        </svg>
                     </div>

                     {/* Content Container */}
                     <div className="relative z-20 flex flex-col items-center pt-3 px-1 h-full">
                         
                         {/* Name */}
                         <h3 className={`font-black text-white uppercase tracking-tight truncate w-full text-center drop-shadow-md ${isFirst ? 'text-lg' : 'text-xs text-slate-300'}`}>
                            {member.nickname}
                         </h3>
                         
                         {/* Tier Badge */}
                         <div className="flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-black/60 border border-white/5 relative z-20">
                             <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-tr ${theme.conic}`}></div>
                             <span className={`text-[8px] font-bold uppercase ${theme.text}`}>{theme.name}</span>
                         </div>

                         {/* SCORE - ADJUSTED POSITIONS */}
                         {/* Rank 1: bottom-36 (Safe), Rank 2/3: bottom-20 (Lowered from 28 to create space from Tier, but high enough from Sheet) */}
                         <div className={`absolute ${isFirst ? 'bottom-36' : 'bottom-20'} flex items-baseline justify-center gap-1.5 z-30 w-full px-2`}>
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
  
  // State for Bottom Sheet
  const [isExpanded, setIsExpanded] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum Touch Distance for Swipe
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null); 
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isUpSwipe = distance > minSwipeDistance;
    const isDownSwipe = distance < -minSwipeDistance;

    if (isUpSwipe) setIsExpanded(true);
    if (isDownSwipe) setIsExpanded(false);
  };

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
      const activeScore = (activeTx && activeTx.paymentMethod !== 'BONUS') ? activeTx.durationHours : 0;
      return member.totalPlayTime + activeScore;
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

        {/* Layer 1: Content (Header & Podium) */}
        {/* Reduced padding bottom (38vh) so podium sits lower and overlaps with the 45vh sheet */}
        <div className="relative z-10 flex flex-col h-full w-full max-w-lg mx-auto md:max-w-4xl pb-[38vh]">
            
            {/* Header Area */}
            <div className="shrink-0 pt-8 pb-2 flex flex-col items-center z-50">
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

            {/* PODIUM STAGE - MOVED DOWN (justify-end, no bottom padding to touch the 38vh line) */}
            <div className="flex-1 flex flex-col justify-end items-center w-full relative z-40 transition-transform duration-500 pb-0">
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
        </div>

        {/* BOTTOM SHEET - CHALLENGER LIST */}
        {/* Dynamic height based on expansion state. 45% is approx 4 items. 88% is expanded. */}
        <div 
            ref={sheetRef}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-3xl rounded-t-[2.5rem] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.9)] flex flex-col overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'h-[88%]' : 'h-[45%]'}`}
        >
            {/* Handle Bar (Draggable Area) */}
            <div 
                className="w-full pt-4 pb-2 flex flex-col items-center cursor-grab active:cursor-grabbing touch-none"
                onClick={() => setIsExpanded(!isExpanded)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                <div className="w-12 h-1.5 bg-white/20 rounded-full mb-1"></div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-50 flex items-center gap-1">
                    {isExpanded ? <span className="flex items-center gap-1">Tutup <Minus size={12}/></span> : <span className="flex items-center gap-1">Lihat Semua <ChevronUp size={12}/></span>}
                </div>
            </div>

            {/* Search Header */}
            <div className="px-6 py-3 flex items-center justify-between shrink-0 bg-transparent">
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
                <div className="max-w-lg mx-auto md:max-w-4xl">
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
