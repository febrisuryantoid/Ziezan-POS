
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';
import { Save, Crown, Star, Shield, Coins, Bluetooth, BluetoothConnected, BluetoothOff, Globe, Mail, Phone, Code, Database, Upload, Download, CloudLightning, FileJson, AlertTriangle, Wifi, Gift, ChevronRight, ChevronLeft, ArrowLeft, Banknote, Building2, MapPin, Image as ImageIcon, Camera, Loader2, Link as LinkIcon, WifiOff, RefreshCw, CheckCircle2, XCircle, Clock, Trophy, Zap, Sparkles, Hexagon, Gamepad2 } from 'lucide-react';
import { MembershipConfig, AppSettings } from '../types';
import * as Storage from '../services/storage';
import { optimizeImage } from '../utils/imageOptimizer';
import { getTierTheme, GamingBackground } from './PublicMemberCard';
import { syncService } from '../services/sync';

type SettingsSection = 'BUSINESS' | 'GENERAL' | 'CONNECTIVITY' | 'DATA' | 'MEMBERSHIP';

// --- UPDATED PREVIEW COMPONENT (MATCHING NEW DESIGN) ---
const CardPreview = ({ tier, name, playtime, bonus }: { tier: string, name: string, playtime: string, bonus: number }) => {
    const theme = getTierTheme(tier);
    const TierIcon = theme.icon;
    
    // Mini Dragon Pattern for preview
    const DragonPatternMini = ({ color }: { color: string }) => (
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none mix-blend-screen"
            style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='30' height='30' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M54.627 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M22.485 0l.83.828-1.415 1.415-.828-.828-.828.828-1.415-1.415.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 22.485l.828.83-1.415 1.415-.828-.828-.828.828L-3.658 22.485l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M0 54.627l.828.83-1.415 1.415-.828-.828-.828.828L-3.658 54.627l.828-.828-.828-.828 1.415-1.415.828.828.828-.828 1.415 1.415-.828.828M54.627 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M22.485 60l.83-.828-1.415-1.415-.828.828-.828-.828-1.415 1.415.828.828-.828.828 1.415 1.415.828-.828.828.828 1.415-1.415-.828-.828M32.118 29.118l-1.415-1.415 1.415-1.415 1.415 1.415-1.415 1.415zM29.118 32.118l-1.415-1.415 1.415-1.415 1.415 1.415-1.415 1.415z' fill='${color.replace('#', '%23')}' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`,
            }}
        ></div>
    );

    return (
        <div className="relative w-full aspect-[9/16] max-w-[200px] mx-auto group hover:scale-[1.02] transition-transform duration-300 z-10">
            {/* Border Beam */}
            <div className="absolute -inset-[2px] rounded-[26px] overflow-hidden">
                <div className={`absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-spin-slow bg-[conic-gradient(transparent_0deg,transparent_90deg,currentColor_180deg,transparent_270deg,transparent_360deg)] ${theme.text} opacity-80 blur-sm`}></div>
            </div>

            {/* Inner Content */}
            <div className={`relative h-full w-full rounded-[24px] ${theme.bgInner} flex flex-col items-center p-4 overflow-hidden border ${theme.borderInner}`}>
                <DragonPatternMini color={theme.dragonColor} />
                
                {/* Header */}
                <div className="flex flex-col items-center w-full mt-4 mb-3 relative z-10">
                    <div className="relative">
                        <div className={`absolute -inset-1 rounded-full opacity-50 blur-sm bg-gradient-to-tr ${theme.conic}`}></div>
                        <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-b from-white/20 to-transparent relative z-10">
                            <img src="https://beeimg.com/images/s77882238754.png" alt="Profile" className="w-full h-full rounded-full object-cover bg-black"/>
                        </div>
                        <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[6px] font-black uppercase tracking-widest flex items-center gap-1 z-20 whitespace-nowrap text-white bg-gradient-to-r ${theme.conic}`}>
                            <Hexagon size={6} fill="currentColor" /> {tier}
                        </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                        <h1 className="text-sm font-black text-white tracking-wide">{name}</h1>
                        <p className={`text-[8px] font-bold tracking-widest uppercase opacity-80 ${theme.text}`}>@nickname</p>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-2 w-full mb-2 relative z-10">
                    <div className={`bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden group/mini`}>
                        <div className={`absolute -inset-[1px] opacity-0 group-hover/mini:opacity-30 bg-gradient-to-br ${theme.conic}`}></div>
                        <Clock size={10} className={`${theme.text} mb-0.5 relative z-10`} />
                        <span className="text-xs font-black text-white relative z-10">{playtime}</span>
                        <span className="text-[6px] uppercase font-bold text-slate-400 relative z-10">Jam</span>
                    </div>
                    <div className={`bg-black/40 border border-white/5 rounded-xl p-2 flex flex-col items-center justify-center relative overflow-hidden group/mini`}>
                        <div className={`absolute -inset-[1px] opacity-0 group-hover/mini:opacity-30 bg-gradient-to-br ${theme.conic}`}></div>
                        <Trophy size={10} className="text-yellow-500 mb-0.5 relative z-10" />
                        <span className="text-xs font-black text-white relative z-10">{bonus}</span>
                        <span className="text-[6px] uppercase font-bold text-slate-400 relative z-10">Bonus</span>
                    </div>
                </div>

                {/* Progress */}
                <div className="w-full mt-auto mb-1 relative z-10">
                    <div className="flex justify-between items-end px-1 mb-1">
                        <span className="text-[6px] font-bold uppercase text-slate-400 flex items-center gap-1">
                            <Zap size={6} className={theme.text}/> Lvl
                        </span>
                        <span className={`text-[6px] font-bold ${theme.text}`}>75%</span>
                    </div>
                    <div className="h-1.5 w-full bg-black/60 rounded-full overflow-hidden p-[1px] border border-white/10">
                        <div className={`h-full rounded-full bg-gradient-to-r ${theme.conic}`} style={{ width: '75%' }}></div>
                    </div>
                </div>
            </div>

            {/* Floating Icon (Outside Box) */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-50">
                <TierIcon size={32} className={`${theme.text} ${theme.textGlow} drop-shadow-lg`} fill="currentColor" />
            </div>
        </div>
    );
};

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig, refreshData } = useData();
// ... (rest of imports and state logic remains exactly the same as previous full version)
  const { t } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt, disconnect: disconnectBt } = useBluetooth();
  const { addToast } = useToast();

  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localMemberships, setLocalMemberships] = useState<MembershipConfig[]>(membershipConfigs);
  const [activeSection, setActiveSection] = useState<SettingsSection>('BUSINESS');
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    setLocalMemberships(membershipConfigs);
  }, [membershipConfigs]);

  const handleSettingsChange = (key: keyof AppSettings, value: any) => {
    setLocalSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleMembershipChange = (id: string, key: keyof MembershipConfig, value: any) => {
    setLocalMemberships(prev => prev.map(m => 
        m.id === id ? { ...m, [key]: key === 'isActive' ? value : Number(value) } : m
    ));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        updateSettings(localSettings);
        localMemberships.forEach(m => updateMembershipConfig(m));
        await syncService.syncNow();
        addToast('success', t('saved'), t('saved'));
    } catch (e) {
        addToast('error', 'Error', 'Failed to save settings.');
    } finally {
        setIsSaving(false);
    }
  };

  const formatNumber = (num: number) => num.toString();

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const optimized = await optimizeImage(file, { maxWidth: 200, maxHeight: 200 });
            handleSettingsChange('businessLogo', optimized);
            addToast('success', 'Logo Uploaded', 'Business logo updated.');
        } catch (err) {
            addToast('error', 'Upload Failed', 'Could not process image.');
        }
    }
  };

  const getTierStyle = (id: string) => {
    switch(id) {
      case 'VIP':
        return {
          card: 'border-amber-500/30 bg-amber-50 dark:bg-amber-900/10',
          iconColor: 'text-amber-500',
          text: 'text-slate-900 dark:text-white'
        };
      case 'PLUS':
        return {
          card: 'border-purple-500/30 bg-purple-50 dark:bg-purple-900/10',
          iconColor: 'text-purple-500',
          text: 'text-slate-900 dark:text-white'
        };
      default: // BASIC
        return {
          card: 'border-cyan-500/30 bg-cyan-50 dark:bg-cyan-900/10',
          iconColor: 'text-cyan-500',
          text: 'text-slate-900 dark:text-white'
        };
    }
  };

  const getIcon = (id: string, colorClass: string) => {
    switch(id) {
      case 'VIP': return <Crown size={24} className={colorClass} />;
      case 'PLUS': return <Star size={24} className={colorClass} />;
      default: return <Shield size={24} className={colorClass} />;
    }
  };

  // --- RENDER FUNCTIONS ---
  const renderDesktopNavItem = ({ section, icon: Icon, label }: { section: SettingsSection, icon: any, label: string }) => {
    const isActive = activeSection === section;
    return (
        <button
            onClick={() => setActiveSection(section)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive 
                ? 'bg-palette-mustard text-white shadow-md' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'
            }`}
        >
            <Icon size={20} />
            <span className="font-bold text-sm">{label}</span>
            {isActive && <ChevronRight size={16} className="ml-auto" />}
        </button>
    );
  };

  const renderBusinessSettings = () => (
    <div className="space-y-6 animate-fade-in">
        <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4">{t('business_profile')}</h3>
        
        {/* Logo Upload */}
        <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5">
            <label className="text-xs font-bold text-slate-500 uppercase block mb-4">{t('logo_label')}</label>
            <div className="flex items-center gap-6">
                <div className="relative group cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                     <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-black/20 border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center overflow-hidden">
                        {localSettings.businessLogo ? (
                            <img src={localSettings.businessLogo} alt="Business Logo" className="w-full h-full object-cover" />
                        ) : (
                            <ImageIcon className="text-slate-400" />
                        )}
                     </div>
                     <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                         <Camera className="text-white" />
                     </div>
                </div>
                <div className="flex-1">
                     <button 
                        onClick={() => logoInputRef.current?.click()}
                        className="px-4 py-2 bg-slate-100 dark:bg-white/5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/10 transition-colors flex items-center gap-2"
                     >
                        <Upload size={14} /> {t('upload_data')}
                     </button>
                     <p className="text-[10px] text-slate-400 mt-2">Max 200x200px. JPG/PNG/WebP.</p>
                     <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                     
                     <div className="mt-4">
                        <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">{t('or_use_url')}</label>
                        <input 
                            type="text" 
                            value={localSettings.businessLogo} 
                            onChange={(e) => handleSettingsChange('businessLogo', e.target.value)}
                            className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs" 
                            placeholder="https://..."
                        />
                     </div>
                </div>
            </div>
        </div>

        {/* Business Info Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('business_name')}</label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        value={localSettings.businessName}
                        onChange={(e) => handleSettingsChange('businessName', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white"
                    />
                </div>
            </div>
            <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('phone_number')}</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        value={localSettings.businessPhone}
                        onChange={(e) => handleSettingsChange('businessPhone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white"
                    />
                </div>
            </div>
            <div className="col-span-1 md:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('full_address')}</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea 
                        rows={3}
                        value={localSettings.businessAddress}
                        onChange={(e) => handleSettingsChange('businessAddress', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white resize-none"
                    />
                </div>
            </div>
        </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-6 animate-fade-in">
         <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4">{t('rate_and_bonus')}</h3>
         
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/10">
                 <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-palette-mustard/10 rounded-lg text-palette-mustard"><Banknote size={20}/></div>
                     <h4 className="font-bold text-palette-navy dark:text-white">{t('hourly_rate')}</h4>
                 </div>
                 <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">Rp</span>
                    <input 
                        type="number"
                        inputMode="numeric"
                        value={localSettings.hourlyRate}
                        onChange={(e) => handleSettingsChange('hourlyRate', parseInt(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-lg font-mono font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white"
                    />
                 </div>
                 <p className="text-xs text-slate-500 mt-2">{t('rate_desc')}</p>
             </div>

             <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/10">
                 <div className="flex items-center gap-3 mb-4">
                     <div className="p-2 bg-palette-green/10 rounded-lg text-palette-green"><Gift size={20}/></div>
                     <h4 className="font-bold text-palette-navy dark:text-white">{t('birthday_bonus')}</h4>
                 </div>
                 <div className="flex items-center gap-3">
                     <input 
                        type="number"
                        inputMode="numeric"
                        value={localSettings.birthdayBonusHours}
                        onChange={(e) => handleSettingsChange('birthdayBonusHours', parseInt(e.target.value) || 0)}
                        className="w-24 pl-4 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-lg font-mono font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white text-center"
                     />
                     <span className="font-bold text-sm text-slate-600 dark:text-slate-300">{t('jam')}</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">{t('birthday_bonus_desc')}</p>
             </div>
         </div>
    </div>
  );

  const renderConnectivity = () => (
    <div className="space-y-6 animate-fade-in">
         <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4">{t('tv_connectivity')}</h3>
         
         {/* TV Cloud Status */}
         <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/10 flex items-center justify-between">
             <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-500 flex items-center justify-center">
                     <CloudLightning size={24} />
                 </div>
                 <div>
                     <h4 className="font-bold text-palette-navy dark:text-white">Smart Cloud Link</h4>
                     <p className="text-xs text-slate-500 max-w-xs">{t('cloud_link_desc')}</p>
                 </div>
             </div>
             <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                 {t('online')}
             </div>
         </div>

         {/* Bluetooth Settings */}
         <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/10">
             <div className="flex justify-between items-start mb-6">
                 <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${isBtConnected ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                         {isBtConnected ? <BluetoothConnected size={24} /> : <BluetoothOff size={24} />}
                     </div>
                     <div>
                         <h4 className="font-bold text-palette-navy dark:text-white">{t('bluetooth_settings')}</h4>
                         <p className="text-xs text-slate-500 max-w-xs">{t('bt_desc')}</p>
                     </div>
                 </div>
                 <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${isBtConnected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                     {isBtConnected ? t('bluetooth_connected') : t('bluetooth_disconnected')}
                 </span>
             </div>
             
             {isBtConnected ? (
                 <button 
                    onClick={disconnectBt}
                    className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold border border-red-100 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                 >
                    <XCircle size={18} /> {t('disconnect_bt')}
                 </button>
             ) : (
                 <button 
                    onClick={connectBt}
                    className="w-full py-3 bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                 >
                    <Bluetooth size={18} /> {t('connect_bt')}
                 </button>
             )}
         </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-6 animate-fade-in">
         <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4">{t('data_management')}</h3>

         {/* Cloud Retention */}
         <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/10">
             <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-lg"><Database size={20}/></div>
                 <div>
                    <h4 className="font-bold text-palette-navy dark:text-white">{t('smart_cloud_opt')}</h4>
                    <p className="text-xs text-slate-500">{t('keep_data_duration')}</p>
                 </div>
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { val: 30, label: t('days_30_save') },
                    { val: 90, label: t('days_90') },
                    { val: 365, label: t('days_365') },
                    { val: 0, label: t('forever') }
                ].map(opt => (
                    <button
                        key={opt.val}
                        onClick={() => handleSettingsChange('cloudRetentionDays', opt.val)}
                        className={`p-3 rounded-xl border text-xs font-bold transition-all ${
                            localSettings.cloudRetentionDays === opt.val
                            ? 'bg-palette-mustard text-white border-palette-mustard shadow-md'
                            : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
             </div>
         </div>

         {/* Backup & Restore (Coming Soon/Placeholder functional) */}
         <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/10 opacity-80">
             <div className="flex items-center gap-3 mb-4">
                 <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 rounded-lg"><FileJson size={20}/></div>
                 <h4 className="font-bold text-palette-navy dark:text-white">Backup & Restore (Local)</h4>
             </div>
             <p className="text-xs text-slate-500 mb-4 whitespace-pre-line">{t('backup_restore_desc')}</p>
             
             <div className="flex gap-4">
                 <button className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2">
                    <Download size={16} /> {t('download_data')}
                 </button>
                 <button className="flex-1 py-3 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-white rounded-xl font-bold flex items-center justify-center gap-2">
                    <Upload size={16} /> {t('restore_btn')}
                 </button>
             </div>
         </div>
    </div>
  );

  const renderMembershipAndDev = () => (
    <div className="space-y-8 animate-fade-in">
        
        {/* MEMBER CARD PREVIEW SECTION */}
        <div>
            <h3 className="text-lg font-bold text-palette-navy dark:text-white flex items-center gap-2 mb-4">
                {t('member_card_footer')} Preview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-[#050510] p-8 rounded-3xl border border-slate-200 dark:border-white/5 relative overflow-hidden">
                {/* Mini Cosmic Background for Preview Area */}
                <div className="absolute inset-0 opacity-20 pointer-events-none">
                    <GamingBackground />
                </div>
                
                <CardPreview tier="BASIC" name="Member Baru" playtime="2.5" bonus={0} />
                <CardPreview tier="PLUS" name="Member Setia" playtime="25.0" bonus={2} />
                <CardPreview tier="VIP" name="Sultan Gaming" playtime="150.0" bonus={15} />
            </div>
        </div>

        {/* Membership Config */}
        <div>
            <h3 className="text-lg font-bold text-palette-navy dark:text-white flex items-center gap-2 mb-4">
                {t('membership_settings')}
            </h3>
            <div className="grid grid-cols-1 gap-6">
                {localMemberships.map(m => {
                const formStyle = {
                    card: m.id === 'VIP' ? 'border-amber-500/30 bg-amber-50 dark:bg-amber-900/10' : 
                          m.id === 'PLUS' ? 'border-purple-500/30 bg-purple-50 dark:bg-purple-900/10' : 
                          'border-cyan-500/30 bg-cyan-50 dark:bg-cyan-900/10',
                    iconColor: m.id === 'VIP' ? 'text-amber-500' : m.id === 'PLUS' ? 'text-purple-500' : 'text-cyan-500',
                    text: 'text-slate-900 dark:text-white'
                };

                return (
                <div key={m.id} className={`rounded-3xl border shadow-lg overflow-hidden flex flex-col relative ${formStyle.card}`}>
                    <div className="relative z-10 p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full bg-white dark:bg-white/10`}>
                                {getIcon(m.id, formStyle.iconColor)}
                            </div>
                            <div>
                                <h4 className={`font-bold text-lg ${formStyle.text}`}>{m.name}</h4>
                                <p className={`text-xs font-medium opacity-70 ${formStyle.text}`}>{m.id}</p>
                            </div>
                        </div>
                        <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" checked={m.isActive} onChange={(e) => handleMembershipChange(m.id, 'isActive', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-2 border-slate-200 appearance-none cursor-pointer checked:right-0 right-6 shadow-sm z-20" />
                            <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors z-10 ${m.isActive ? 'bg-palette-green' : 'bg-slate-300'}`}></label>
                        </div>
                    </div>

                    <div className="relative z-10 p-6 space-y-5 flex-1">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-70">{t('price_plan')}</label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold opacity-70">Rp</span>
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*" 
                                    value={formatNumber(m.price)} 
                                    onChange={e => handleMembershipChange(m.id, 'price', e.target.value)}
                                    className="w-full rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all bg-white/50 dark:bg-black/20"
                                />
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="relative flex-shrink-0">
                                    <input 
                                        type="number"
                                        inputMode="numeric" 
                                        value={m.durationDays} 
                                        onChange={e => handleMembershipChange(m.id, 'durationDays', e.target.value)}
                                        className="w-20 rounded-lg px-3 py-1.5 text-xs text-center font-bold focus:outline-none focus:ring-2 transition-all bg-white/50 dark:bg-black/20"
                                    />
                                </div>
                                <span className="text-xs font-medium opacity-70">{t('days_lifetime')}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70">{t('bonus_target')}</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        inputMode="numeric" 
                                        value={m.bonusThreshold} 
                                        onChange={e => handleMembershipChange(m.id, 'bonusThreshold', e.target.value)}
                                        className="w-full rounded-xl px-4 py-3 text-sm text-center font-bold focus:outline-none focus:ring-2 transition-all bg-white/50 dark:bg-black/20"
                                    />
                                    <span className="text-xs font-bold opacity-70">{t('jam')}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70">{t('reward')}</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        inputMode="numeric"
                                        value={m.bonusReward} 
                                        onChange={e => handleMembershipChange(m.id, 'bonusReward', e.target.value)}
                                        className="w-full rounded-xl px-4 py-3 text-sm text-center font-bold focus:outline-none focus:ring-2 transition-all bg-white/50 dark:bg-black/20"
                                    />
                                    <span className="text-xs font-bold opacity-70">{t('jam')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 rounded-xl text-xs font-medium border border-white/10 bg-white/30 dark:bg-black/10">
                            {t('rule_desc', {x: m.bonusThreshold, y: m.bonusReward})}
                        </div>
                    </div>
                </div>
                )})}
            </div>
        </div>

        {/* Developer Info */}
        <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group mt-8">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Code size={100} />
            </div>
            
            <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4 flex items-center gap-2">
                <Code size={20} className="text-palette-purple"/> {t('developer_info')}
            </h3>
            
            <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-palette-mustard to-palette-copper flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-palette-mustard/30">
                    FS
                </div>
                <div>
                    <p className="text-xs text-slate-500 uppercase font-bold">{t('developed_by')}</p>
                    <h4 className="text-lg font-bold text-palette-navy dark:text-white">Febri Suryanto</h4>
                    <p className="text-xs text-slate-400">Fullstack Developer</p>
                </div>
            </div>

            <div className="space-y-3">
                <a href="https://febrisuryanto.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-palette-cream dark:hover:bg-white/10 group/item transition-colors">
                    <div className="p-2 bg-white dark:bg-palette-navy rounded-full text-slate-500 group-hover/item:text-palette-mustard transition-colors shadow-sm"><Globe size={16} /></div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">febrisuryanto.com</span>
                </a>
                <a href="mailto:hello@febrisuryanto.com" className="flex items-center gap-3 p-3 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-palette-cream dark:hover:bg-white/10 group/item transition-colors">
                    <div className="p-2 bg-white dark:bg-palette-navy rounded-full text-slate-500 group-hover/item:text-palette-mustard transition-colors shadow-sm"><Mail size={16} /></div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">hello@febrisuryanto.com</span>
                </a>
                <a href="https://wa.me/6282312907731" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-full bg-slate-50 dark:bg-white/5 hover:bg-green-50 dark:hover:bg-green-900/20 group/item transition-colors">
                    <div className="p-2 bg-white dark:bg-palette-navy rounded-full text-slate-500 group-hover/item:text-green-500 transition-colors shadow-sm"><Phone size={16} /></div>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">+62 823-1290-7731</span>
                </a>
            </div>
        </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-140px)] flex flex-col md:flex-row gap-6">
      
      {/* Sidebar Navigation */}
      <nav className="w-full md:w-64 flex-shrink-0 flex flex-col gap-2">
          <div className="mb-2 hidden md:block">
            <h2 className="text-2xl font-bold text-palette-navy dark:text-white">{t('system_settings')}</h2>
            <p className="text-xs text-palette-brown/70 dark:text-palette-cream/60">{t('config_subtitle')}</p>
          </div>
          
          <div className="bg-white dark:bg-palette-navyLight rounded-3xl p-2 shadow-sm border border-slate-200 dark:border-white/5 space-y-1">
              {renderDesktopNavItem({ section: "BUSINESS", icon: Building2, label: t('business_profile') })}
              {renderDesktopNavItem({ section: "GENERAL", icon: Coins, label: t('general_settings') })}
              {renderDesktopNavItem({ section: "CONNECTIVITY", icon: Wifi, label: t('tv_connectivity') })}
              {renderDesktopNavItem({ section: "DATA", icon: Database, label: t('data_management') })}
              {renderDesktopNavItem({ section: "MEMBERSHIP", icon: Crown, label: t('membership_settings') })}
          </div>

          {/* Desktop Save Button - Positioned in sidebar for easy access */}
          <div className="mt-auto hidden md:block">
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                    isSaving ? 'bg-palette-green scale-105' : 'bg-palette-mustard hover:bg-palette-mustard/90 hover:-translate-y-1'
                }`}
            >
                {isSaving ? t('saved') : <><Save size={18} /> {t('save_changes')}</>}
            </button>
          </div>
      </nav>

      {/* Main Content Area - Added min-w-0 for flex layout safety */}
      <main className="flex-1 overflow-y-auto pr-1 pb-4 custom-scrollbar min-w-0">
          {activeSection === 'BUSINESS' && renderBusinessSettings()}
          {activeSection === 'GENERAL' && renderGeneralSettings()}
          {activeSection === 'CONNECTIVITY' && renderConnectivity()}
          {activeSection === 'DATA' && renderDataManagement()}
          {activeSection === 'MEMBERSHIP' && renderMembershipAndDev()}
      </main>

    </div>
  );
};

export default Settings;
