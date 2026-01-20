
import React, { useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, Trophy, Gamepad2, AlertCircle, Sparkles, Calendar, MapPin } from 'lucide-react';
import { TIER_ICONS } from '../utils/tierIcons';

// --- THEME HELPER (Exported) ---
export const getTierTheme = (tierId: string) => {
  // Map MLBB Tiers to colors
  switch (tierId) {
    case 'WARRIOR': return { id: 'WARRIOR', name: 'Warrior', color: 'text-orange-600', bg: 'bg-orange-600', border: 'border-orange-600', iconUrl: TIER_ICONS.WARRIOR, conic: 'from-orange-500 via-orange-700 to-orange-900', text: 'text-orange-500', badge: 'bg-orange-950 text-orange-200', borderInner: 'border-orange-500/20', particleColor: '#f97316' };
    case 'ELITE': return { id: 'ELITE', name: 'Elite', color: 'text-slate-400', bg: 'bg-slate-400', border: 'border-slate-400', iconUrl: TIER_ICONS.ELITE, conic: 'from-slate-300 via-slate-500 to-slate-700', text: 'text-slate-300', badge: 'bg-slate-800 text-slate-200', borderInner: 'border-slate-500/20', particleColor: '#94a3b8' };
    case 'GRANDMASTER': return { id: 'GRANDMASTER', name: 'Grandmaster', color: 'text-amber-500', bg: 'bg-amber-500', border: 'border-amber-500', iconUrl: TIER_ICONS.GRANDMASTER, conic: 'from-amber-300 via-amber-500 to-amber-700', text: 'text-amber-400', badge: 'bg-amber-900 text-amber-200', borderInner: 'border-amber-500/20', particleColor: '#f59e0b' };
    case 'EPIC': return { id: 'EPIC', name: 'Epic', color: 'text-emerald-500', bg: 'bg-emerald-500', border: 'border-emerald-500', iconUrl: TIER_ICONS.EPIC, conic: 'from-emerald-400 via-emerald-600 to-emerald-800', text: 'text-emerald-400', badge: 'bg-emerald-900 text-emerald-200', borderInner: 'border-emerald-500/20', particleColor: '#10b981' };
    case 'LEGEND': return { id: 'LEGEND', name: 'Legend', color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400', iconUrl: TIER_ICONS.LEGEND, conic: 'from-yellow-300 via-yellow-500 to-yellow-700', text: 'text-yellow-400', badge: 'bg-yellow-900 text-yellow-200', borderInner: 'border-yellow-500/20', particleColor: '#eab308' };
    case 'MYTHIC': return { id: 'MYTHIC', name: 'Mythic', color: 'text-indigo-400', bg: 'bg-indigo-400', border: 'border-indigo-400', iconUrl: TIER_ICONS.MYTHIC, conic: 'from-indigo-400 via-indigo-600 to-indigo-800', text: 'text-indigo-400', badge: 'bg-indigo-900 text-indigo-200', borderInner: 'border-indigo-500/20', particleColor: '#818cf8' };
    case 'MYTHICAL_HONOR': return { id: 'MYTHICAL_HONOR', name: 'Mythical Honor', color: 'text-blue-500', bg: 'bg-blue-500', border: 'border-blue-500', iconUrl: TIER_ICONS.MYTHICAL_HONOR, conic: 'from-blue-400 via-blue-600 to-blue-800', text: 'text-blue-400', badge: 'bg-blue-900 text-blue-200', borderInner: 'border-blue-500/20', particleColor: '#3b82f6' };
    case 'MYTHICAL_GLORY': return { id: 'MYTHICAL_GLORY', name: 'Mythical Glory', color: 'text-pink-500', bg: 'bg-pink-500', border: 'border-pink-500', iconUrl: TIER_ICONS.MYTHICAL_GLORY, conic: 'from-pink-400 via-pink-600 to-pink-800', text: 'text-pink-400', badge: 'bg-pink-900 text-pink-200', borderInner: 'border-pink-500/20', particleColor: '#ec4899' };
    case 'MYTHICAL_IMMORTAL': return { id: 'MYTHICAL_IMMORTAL', name: 'Mythical Immortal', color: 'text-rose-600', bg: 'bg-rose-600', border: 'border-rose-600', iconUrl: TIER_ICONS.MYTHICAL_IMMORTAL, conic: 'from-rose-500 via-rose-700 to-rose-900', text: 'text-rose-500', badge: 'bg-rose-950 text-rose-200', borderInner: 'border-rose-500/20', particleColor: '#f43f5e' };
    default: return { id: 'WARRIOR', name: 'Warrior', color: 'text-slate-500', bg: 'bg-slate-500', border: 'border-slate-500', iconUrl: TIER_ICONS.WARRIOR, conic: 'from-slate-400 via-slate-600 to-slate-800', text: 'text-slate-400', badge: 'bg-slate-800 text-slate-200', borderInner: 'border-slate-500/20', particleColor: '#64748b' };
  }
};

// --- BACKGROUND COMPONENT (Exported) ---
export const GamingBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d', { alpha: false }); 
    if (!ctx) return;

    const config = {
        bgColor: '#050505', 
        hexRadius: 35,      
        hexGap: 2,          
        hexStroke: 1.5,     
    };

    let w = 0, h = 0;
    
    class Hexagon {
        x: number; y: number; r: number;
        constructor(x: number, y: number, r: number) { this.x = x; this.y = y; this.r = r; }
        draw(time: number) {
            if (!ctx) return;
            ctx.beginPath();
            for (let i = 0; i < 6; i++) {
                const theta = (Math.PI / 3) * i + (Math.PI / 6); 
                const px = this.x + this.r * Math.cos(theta);
                const py = this.y + this.r * Math.sin(theta);
                if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fillStyle = '#080808'; 
            ctx.globalAlpha = 1.0;
            ctx.fill();
            const speed = 0.02;
            const waveLength = 1.5;
            const safeW = w || 1;
            const phase = (this.x / safeW) * waveLength - (time * speed);
            const sineWave = (Math.sin(phase) + 1) / 2;
            const strokeOpacity = 0.05 + (Math.pow(sineWave, 2) * 0.45);
            ctx.strokeStyle = '#ffffff'; 
            ctx.lineWidth = config.hexStroke;
            ctx.globalAlpha = strokeOpacity;
            ctx.stroke();
            ctx.globalAlpha = 1.0;
        }
    }

    let hexagons: Hexagon[] = []; 
    let time = 0;
    let animationFrameId: number;

    const initHexGrid = () => {
        hexagons = [];
        const r = config.hexRadius;
        const hexW = r * Math.sqrt(3);
        const distH = hexW + config.hexGap; 
        const distV = r * 1.5 + (config.hexGap * 0.8); 
        const cols = Math.ceil(w / distH) + 2;
        const rows = Math.ceil(h / distV) + 2;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                let x = col * distH;
                let y = row * distV;
                if (row % 2 !== 0) x += distH / 2;
                x -= distH; y -= distV;
                hexagons.push(new Hexagon(x, y, r));
            }
        }
    };

    const animate = () => {
        if (!ctx || !canvas) return;
        time++; 
        ctx.fillStyle = config.bgColor;
        ctx.fillRect(0, 0, w, h);
        hexagons.forEach(hex => hex.draw(time));
        animationFrameId = requestAnimationFrame(animate);
    };

    const resize = () => {
        if (!canvas) return;
        w = canvas.width = window.innerWidth;
        h = canvas.height = window.innerHeight;
        initHexGrid();
    };
    
    window.addEventListener('resize', resize);
    resize(); 
    animate(); 

    return () => {
        window.removeEventListener('resize', resize);
        cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none bg-[#050505]" />;
};

// --- MAIN COMPONENT (Default Export) ---
const PublicMemberCard: React.FC<{ nickname: string }> = ({ nickname }) => {
  const { members, transactions } = useData();
  const { t } = useLanguage();

  // Find member
  const member = members.find(m => m.nickname.toLowerCase() === nickname.toLowerCase() || m.name.toLowerCase() === nickname.toLowerCase());

  if (!member) {
    return (
      <div className="h-screen w-full bg-[#050b14] flex flex-col items-center justify-center text-white p-4">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold">Member Not Found</h1>
        <p className="text-slate-400 mt-2">Maaf, data member "{nickname}" tidak ditemukan.</p>
        <a href="/" className="mt-6 px-6 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all">Kembali ke Home</a>
      </div>
    );
  }

  const theme = getTierTheme(member.membershipId);
  const isPlaying = transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');
  const joinDate = new Date(member.joinDate).toLocaleDateString();

  return (
    <div className="min-h-screen w-full bg-[#050b14] text-white font-sans relative overflow-hidden flex flex-col">
      <GamingBackground />
      
      <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10 w-full max-w-md mx-auto">
        
        {/* Card Frame */}
        <div className={`w-full bg-[#0f1016]/80 backdrop-blur-xl border border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative group`}>
            
            {/* Top Banner / Cover */}
            <div className={`h-32 bg-gradient-to-br ${theme.conic} relative overflow-hidden`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 p-1 bg-[#0f1016] rounded-full">
                    <div className={`w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr ${theme.conic}`}>
                        <img 
                            src={theme.iconUrl} 
                            alt={member.membershipId}
                            className="w-full h-full rounded-full object-contain bg-black border-4 border-[#0f1016] p-2"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="pt-16 pb-8 px-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                    <h1 className="text-2xl font-black text-white tracking-tight">{member.nickname}</h1>
                    {member.membershipId.includes('MYTHICAL') && <Sparkles size={16} className="text-yellow-400 animate-pulse" />}
                </div>
                
                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/5 mb-6`}>
                    <img src={theme.iconUrl} alt="Tier" className="w-4 h-4 object-contain" />
                    <span className={`text-xs font-bold uppercase tracking-wider ${theme.text}`}>
                        {member.membershipId.replace(/_/g, ' ')}
                    </span>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center">
                        <Clock className="text-slate-400 mb-2" size={20} />
                        <span className="text-2xl font-black text-white">{member.totalPlayTime}h</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('total_play')}</span>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex flex-col items-center">
                        <Trophy className="text-yellow-500 mb-2" size={20} />
                        <span className="text-2xl font-black text-white">{member.freeHoursBalance}h</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{t('bonus_balance')}</span>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="bg-black/20 rounded-xl p-3 flex items-center justify-between border border-white/5 mb-6">
                    <span className="text-xs font-medium text-slate-400">{t('status')}</span>
                    {isPlaying ? (
                        <div className="flex items-center gap-2 text-emerald-400">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            <span className="text-xs font-bold uppercase tracking-wider">{t('live_status')}</span>
                        </div>
                    ) : (
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('offline')}</span>
                    )}
                </div>

                {/* Meta Info */}
                <div className="space-y-2 text-xs text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                        <Calendar size={12} />
                        <span>{t('joined')}: {joinDate}</span>
                    </div>
                    {member.address && (
                        <div className="flex items-center justify-center gap-2">
                            <MapPin size={12} />
                            <span>{member.address}</span>
                        </div>
                    )}
                </div>

            </div>

            {/* Footer */}
            <div className="py-3 bg-black/20 border-t border-white/5 text-center">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">
                    Ziezan Station Member Card
                </p>
            </div>
        </div>

        <div className="mt-8">
            <a href="/rank" className="text-xs font-bold text-slate-500 hover:text-white transition-colors flex items-center gap-2">
                <Trophy size={14} /> Lihat Papan Peringkat (Leaderboard)
            </a>
        </div>

      </div>
    </div>
  );
};

export default PublicMemberCard;
