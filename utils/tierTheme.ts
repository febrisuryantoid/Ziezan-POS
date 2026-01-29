
import { TIER_ICONS } from './tierIcons';
import { MembershipTierId } from '../types';

interface TierTheme {
  id: MembershipTierId;
  name: string;
  iconUrl: string;
  
  // New Properties for Enhanced Visuals
  glow: string; // For the outer card aura/shadow
  bg_tint: string; // For the inner card background gradient tint
  text_primary: string; // For the main tier name text
  border_glow: string; // For the thin border color
  dragon_gradient: string; // For the DragonIcon watermark gradient

  // FIX: Add missing properties for backwards compatibility with other components
  text: string;
  borderInner: string;
  conic: string;
  badge: string;
  particleColor: string;
  border: string;
}

// COMPLETE REWORK of tier themes based on new design spec
export const getTierTheme = (tierId: MembershipTierId): TierTheme => {
  switch (tierId) {
    case 'WARRIOR': 
      return { 
        id: 'WARRIOR', name: 'Warrior', iconUrl: TIER_ICONS.WARRIOR,
        glow: 'shadow-orange-500/30',
        bg_tint: 'bg-gradient-to-br from-orange-500/10 via-transparent to-transparent',
        text_primary: 'text-orange-400',
        border_glow: 'border-orange-500/20',
        dragon_gradient: 'from-orange-400/80 via-orange-600/80 to-yellow-600/80',
        // FIX: Backwards compatibility properties
        text: 'text-orange-400',
        borderInner: 'border-orange-500/20',
        conic: 'from-orange-500/10 to-transparent',
        badge: 'bg-orange-500/20 text-orange-200',
        particleColor: '#f97316',
        border: 'border-orange-400',
      };
    case 'ELITE': 
      return { 
        id: 'ELITE', name: 'Elite', iconUrl: TIER_ICONS.ELITE,
        glow: 'shadow-blue-500/30',
        bg_tint: 'bg-gradient-to-br from-blue-500/10 via-transparent to-transparent',
        text_primary: 'text-blue-400',
        border_glow: 'border-blue-500/20',
        dragon_gradient: 'from-blue-400/80 via-cyan-500/80 to-blue-600/80',
        // FIX: Backwards compatibility properties
        text: 'text-blue-400',
        borderInner: 'border-blue-500/20',
        conic: 'from-blue-500/10 to-transparent',
        badge: 'bg-blue-500/20 text-blue-200',
        particleColor: '#3b82f6',
        border: 'border-blue-400',
      };
    case 'GRANDMASTER': 
      return { 
        id: 'GRANDMASTER', name: 'Grandmaster', iconUrl: TIER_ICONS.GRANDMASTER,
        glow: 'shadow-purple-500/30',
        bg_tint: 'bg-gradient-to-br from-purple-500/10 via-transparent to-transparent',
        text_primary: 'text-purple-400',
        border_glow: 'border-purple-500/20',
        dragon_gradient: 'from-purple-400/80 via-purple-500/80 to-indigo-500/80',
        // FIX: Backwards compatibility properties
        text: 'text-purple-400',
        borderInner: 'border-purple-500/20',
        conic: 'from-purple-500/10 to-transparent',
        badge: 'bg-purple-500/20 text-purple-200',
        particleColor: '#8b5cf6',
        border: 'border-purple-400',
      };
    case 'EPIC': 
      return { 
        id: 'EPIC', name: 'Epic', iconUrl: TIER_ICONS.EPIC,
        glow: 'shadow-violet-500/40',
        bg_tint: 'bg-gradient-to-br from-violet-500/15 via-transparent to-transparent',
        text_primary: 'text-violet-400',
        border_glow: 'border-violet-500/20',
        dragon_gradient: 'from-violet-400/80 via-fuchsia-500/80 to-purple-500/80',
        // FIX: Backwards compatibility properties
        text: 'text-violet-400',
        borderInner: 'border-violet-500/20',
        conic: 'from-violet-500/15 to-transparent',
        badge: 'bg-violet-500/20 text-violet-200',
        particleColor: '#8b5cf6', // same as purple
        border: 'border-violet-400',
      };
    case 'LEGEND': 
      return { 
        id: 'LEGEND', name: 'Legend', iconUrl: TIER_ICONS.LEGEND,
        glow: 'shadow-yellow-400/30',
        bg_tint: 'bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent',
        text_primary: 'text-yellow-300',
        border_glow: 'border-yellow-400/20',
        dragon_gradient: 'from-yellow-300/80 via-amber-400/80 to-yellow-500/80',
        // FIX: Backwards compatibility properties
        text: 'text-yellow-300',
        borderInner: 'border-yellow-400/20',
        conic: 'from-yellow-400/10 to-transparent',
        badge: 'bg-yellow-400/20 text-yellow-100',
        particleColor: '#facc15',
        border: 'border-yellow-300',
      };
    case 'MYTHIC': 
      return { 
        id: 'MYTHIC', name: 'Mythic', iconUrl: TIER_ICONS.MYTHIC,
        glow: 'shadow-red-500/30',
        bg_tint: 'bg-gradient-to-br from-red-500/10 via-transparent to-transparent',
        text_primary: 'text-red-400',
        border_glow: 'border-red-500/20',
        dragon_gradient: 'from-red-400/80 via-red-500/80 to-rose-500/80',
        // FIX: Backwards compatibility properties
        text: 'text-red-400',
        borderInner: 'border-red-500/20',
        conic: 'from-red-500/10 to-transparent',
        badge: 'bg-red-500/20 text-red-200',
        particleColor: '#ef4444',
        border: 'border-red-400',
      };
    case 'MYTHICAL_HONOR': 
      return { 
        id: 'MYTHICAL_HONOR', name: 'Mythical Honor', iconUrl: TIER_ICONS.MYTHICAL_HONOR,
        glow: 'shadow-red-500/40',
        bg_tint: 'bg-gradient-to-br from-red-500/15 via-yellow-500/10 to-transparent',
        text_primary: 'text-red-400',
        border_glow: 'border-yellow-400/20',
        dragon_gradient: 'from-red-400/80 via-yellow-400/80 to-red-500/80',
        // FIX: Backwards compatibility properties
        text: 'text-red-400',
        borderInner: 'border-yellow-400/20',
        conic: 'from-red-500/15 via-yellow-500/10 to-transparent',
        badge: 'bg-red-500/20 text-red-200',
        particleColor: '#ef4444',
        border: 'border-red-400',
      };
    case 'MYTHICAL_GLORY': 
      return { 
        id: 'MYTHICAL_GLORY', name: 'Mythical Glory', iconUrl: TIER_ICONS.MYTHICAL_GLORY,
        glow: 'shadow-yellow-300/40',
        bg_tint: 'bg-gradient-to-br from-yellow-300/15 via-white/10 to-transparent',
        text_primary: 'text-yellow-300',
        border_glow: 'border-yellow-300/20',
        dragon_gradient: 'from-yellow-300/80 via-white/80 to-amber-300/80',
        // FIX: Backwards compatibility properties
        text: 'text-yellow-300',
        borderInner: 'border-yellow-300/20',
        conic: 'from-yellow-300/15 via-white/10 to-transparent',
        badge: 'bg-yellow-300/20 text-yellow-100',
        particleColor: '#fde047',
        border: 'border-yellow-300',
      };
    case 'MYTHICAL_IMMORTAL': 
      return { 
        id: 'MYTHICAL_IMMORTAL', name: 'Mythical Immortal', iconUrl: TIER_ICONS.MYTHICAL_IMMORTAL,
        glow: 'shadow-cyan-400/40',
        bg_tint: 'bg-gradient-to-br from-cyan-400/15 via-purple-400/10 to-transparent',
        text_primary: 'text-white',
        border_glow: 'border-cyan-400/30',
        dragon_gradient: 'from-pink-400 via-cyan-400 to-yellow-400',
        // FIX: Backwards compatibility properties
        text: 'text-white',
        borderInner: 'border-cyan-400/30',
        conic: 'from-cyan-400/15 via-purple-400/10 to-transparent',
        badge: 'bg-cyan-400/20 text-cyan-100',
        particleColor: '#22d3ee',
        border: 'border-cyan-400',
      };
    default: // Fallback to Warrior
      return { 
        id: 'WARRIOR', name: 'Warrior', iconUrl: TIER_ICONS.WARRIOR,
        glow: 'shadow-slate-500/30',
        bg_tint: 'bg-gradient-to-br from-slate-500/10 via-transparent to-transparent',
        text_primary: 'text-slate-400',
        border_glow: 'border-slate-500/20',
        dragon_gradient: 'from-slate-400/80 via-slate-500/80 to-slate-600/80',
        // FIX: Backwards compatibility properties
        text: 'text-slate-400',
        borderInner: 'border-slate-500/20',
        conic: 'from-slate-500/10 to-transparent',
        badge: 'bg-slate-500/20 text-slate-200',
        particleColor: '#64748b',
        border: 'border-slate-400',
      };
  }
};
