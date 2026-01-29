
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
        glow: 'shadow-amber-700/30',
        bg_tint: 'bg-gradient-to-br from-amber-700/10 via-transparent to-transparent',
        text_primary: 'text-amber-600',
        border_glow: 'border-amber-700/20',
        dragon_gradient: 'from-amber-600/80 via-yellow-700/80 to-amber-800/80',
        // Backwards compatibility properties
        text: 'text-amber-600',
        borderInner: 'border-amber-700/20',
        conic: 'from-amber-600/10 to-transparent',
        badge: 'bg-amber-700/20 text-amber-200',
        particleColor: '#b45309',
        border: 'border-amber-600',
      };
    case 'ELITE': 
      return { 
        id: 'ELITE', name: 'Elite', iconUrl: TIER_ICONS.ELITE,
        glow: 'shadow-slate-500/30',
        bg_tint: 'bg-gradient-to-br from-slate-500/10 via-transparent to-transparent',
        text_primary: 'text-slate-400',
        border_glow: 'border-slate-500/20',
        dragon_gradient: 'from-slate-400/80 via-slate-500/80 to-slate-600/80',
        // Backwards compatibility properties
        text: 'text-slate-400',
        borderInner: 'border-slate-500/20',
        conic: 'from-slate-500/10 to-transparent',
        badge: 'bg-slate-500/20 text-slate-200',
        particleColor: '#64748b',
        border: 'border-slate-400',
      };
    case 'GRANDMASTER': 
      return { 
        id: 'GRANDMASTER', name: 'Grandmaster', iconUrl: TIER_ICONS.GRANDMASTER,
        glow: 'shadow-sky-500/30',
        bg_tint: 'bg-gradient-to-br from-sky-500/10 via-transparent to-transparent',
        text_primary: 'text-sky-400',
        border_glow: 'border-sky-500/20',
        dragon_gradient: 'from-sky-400/80 via-cyan-400/80 to-sky-500/80',
        // Backwards compatibility properties
        text: 'text-sky-400',
        borderInner: 'border-sky-500/20',
        conic: 'from-sky-500/10 to-transparent',
        badge: 'bg-sky-500/20 text-sky-200',
        particleColor: '#0ea5e9',
        border: 'border-sky-400',
      };
    case 'EPIC': 
      return { 
        id: 'EPIC', name: 'Epic', iconUrl: TIER_ICONS.EPIC,
        glow: 'shadow-emerald-500/40',
        bg_tint: 'bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent',
        text_primary: 'text-emerald-400',
        border_glow: 'border-emerald-500/20',
        dragon_gradient: 'from-emerald-400/80 via-green-500/80 to-emerald-500/80',
        // Backwards compatibility properties
        text: 'text-emerald-400',
        borderInner: 'border-emerald-500/20',
        conic: 'from-emerald-500/15 to-transparent',
        badge: 'bg-emerald-500/20 text-emerald-200',
        particleColor: '#10b981',
        border: 'border-emerald-400',
      };
    case 'LEGEND': 
      return { 
        id: 'LEGEND', name: 'Legend', iconUrl: TIER_ICONS.LEGEND,
        glow: 'shadow-yellow-400/30',
        bg_tint: 'bg-gradient-to-br from-yellow-400/10 via-transparent to-transparent',
        text_primary: 'text-yellow-300',
        border_glow: 'border-yellow-400/20',
        dragon_gradient: 'from-yellow-300/80 via-amber-400/80 to-yellow-500/80',
        // Backwards compatibility properties
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
        glow: 'shadow-purple-500/30',
        bg_tint: 'bg-gradient-to-br from-purple-500/10 via-transparent to-transparent',
        text_primary: 'text-purple-400',
        border_glow: 'border-purple-500/20',
        dragon_gradient: 'from-purple-400/80 via-fuchsia-500/80 to-purple-500/80',
        // Backwards compatibility properties
        text: 'text-purple-400',
        borderInner: 'border-purple-500/20',
        conic: 'from-purple-500/10 to-transparent',
        badge: 'bg-purple-500/20 text-purple-200',
        particleColor: '#a855f7',
        border: 'border-purple-400',
      };
    case 'MYTHICAL_HONOR': 
      return { 
        id: 'MYTHICAL_HONOR', name: 'Mythical Honor', iconUrl: TIER_ICONS.MYTHICAL_HONOR,
        glow: 'shadow-cyan-400/40',
        bg_tint: 'bg-gradient-to-br from-cyan-500/15 via-yellow-500/10 to-transparent',
        text_primary: 'text-cyan-300',
        border_glow: 'border-yellow-400/20',
        dragon_gradient: 'from-cyan-400/80 via-yellow-400/80 to-cyan-500/80',
        // Backwards compatibility properties
        text: 'text-cyan-300',
        borderInner: 'border-yellow-400/20',
        conic: 'from-cyan-500/15 via-yellow-500/10 to-transparent',
        badge: 'bg-cyan-500/20 text-cyan-200',
        particleColor: '#22d3ee',
        border: 'border-cyan-400',
      };
    case 'MYTHICAL_GLORY': 
      return { 
        id: 'MYTHICAL_GLORY', name: 'Mythical Glory', iconUrl: TIER_ICONS.MYTHICAL_GLORY,
        glow: 'shadow-amber-400/40',
        bg_tint: 'bg-gradient-to-br from-amber-400/15 via-white/5 to-transparent',
        text_primary: 'text-amber-300',
        border_glow: 'border-amber-300/20',
        dragon_gradient: 'from-amber-300/80 via-yellow-400/80 to-orange-400/80',
        // Backwards compatibility properties
        text: 'text-amber-300',
        borderInner: 'border-amber-300/20',
        conic: 'from-amber-300/15 via-white/5 to-transparent',
        badge: 'bg-amber-300/20 text-amber-100',
        particleColor: '#fbbf24',
        border: 'border-amber-300',
      };
    case 'MYTHICAL_IMMORTAL': 
      return { 
        id: 'MYTHICAL_IMMORTAL', name: 'Mythical Immortal', iconUrl: TIER_ICONS.MYTHICAL_IMMORTAL,
        glow: 'shadow-fuchsia-400/40',
        bg_tint: 'bg-gradient-to-br from-fuchsia-400/15 via-purple-400/10 to-transparent',
        text_primary: 'text-white',
        border_glow: 'border-fuchsia-400/30',
        dragon_gradient: 'from-fuchsia-400 via-purple-400 to-yellow-400',
        // Backwards compatibility properties
        text: 'text-white',
        borderInner: 'border-fuchsia-400/30',
        conic: 'from-fuchsia-400/15 via-purple-400/10 to-transparent',
        badge: 'bg-fuchsia-400/20 text-fuchsia-100',
        particleColor: '#e879f9',
        border: 'border-fuchsia-400',
      };
    default: // Fallback to Elite as it's more neutral than Warrior's bronze
      return { 
        id: 'ELITE', name: 'Elite', iconUrl: TIER_ICONS.ELITE,
        glow: 'shadow-slate-500/30',
        bg_tint: 'bg-gradient-to-br from-slate-500/10 via-transparent to-transparent',
        text_primary: 'text-slate-400',
        border_glow: 'border-slate-500/20',
        dragon_gradient: 'from-slate-400/80 via-slate-500/80 to-slate-600/80',
        // Backwards compatibility properties
        text: 'text-slate-400',
        borderInner: 'border-slate-500/20',
        conic: 'from-slate-500/10 to-transparent',
        badge: 'bg-slate-500/20 text-slate-200',
        particleColor: '#64748b',
        border: 'border-slate-400',
      };
  }
};