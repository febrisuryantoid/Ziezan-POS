import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';
import { Save, Crown, Star, Shield, Coins, Bluetooth, BluetoothConnected, BluetoothOff, Globe, Mail, Phone, Code, Database, Upload, Download, CloudLightning, FileJson, AlertTriangle, Wifi, Gift, ChevronRight, ChevronLeft, ArrowLeft, Banknote, Building2, MapPin, Image as ImageIcon, Camera, Loader2, Link as LinkIcon } from 'lucide-react';
import { MembershipConfig } from '../types';
import * as Storage from '../services/storage';
import { optimizeImage } from '../utils/imageOptimizer';

type SettingsSection = 'BUSINESS' | 'GENERAL' | 'CONNECTIVITY' | 'DATA' | 'MEMBERSHIP';

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig, refreshData } = useData();
  const { t } = useLanguage();
  const { isConnected, connect, disconnect } = useBluetooth();
  const { addToast } = useToast();
  
  // Responsive State
  const [activeSection, setActiveSection] = useState<SettingsSection>('BUSINESS');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(true);

  // Form States (Local)
  const [localSettings, setLocalSettings] = useState(settings);
  const [localMemberships, setLocalMemberships] = useState(membershipConfigs);
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleResize = () => {
        const mobile = window.innerWidth < 1024;
        setIsMobile(mobile);
        if (!mobile) setMobileMenuOpen(false); // Reset on desktop
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update local state when context changes (e.g. after sync)
  useEffect(() => {
      setLocalSettings(settings);
      setLocalMemberships(membershipConfigs);
  }, [settings, membershipConfigs]);

  // Helper for Numeric Input
  const formatNumber = (num: number) => num.toLocaleString('id-ID');
  
  const handleNumericChange = (value: string, field: keyof typeof localSettings) => {
    const cleanValue = value.replace(/\D/g, '');
    const intValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    setLocalSettings(prev => ({ ...prev, [field]: intValue }));
  };

  const handleTextChange = (value: string, field: keyof typeof localSettings) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleMembershipChange = (id: string, field: keyof MembershipConfig, value: any) => {
     setLocalMemberships(prev => prev.map(m => {
       if (m.id === id) {
          if (field === 'price' || field === 'bonusThreshold' || field === 'bonusReward' || field === 'durationDays') {
             const cleanValue = value.toString().replace(/\D/g, '');
             return { ...m, [field]: cleanValue === '' ? 0 : parseInt(cleanValue, 10) };
          }
          return { ...m, [field]: value };
       }
       return m;
     }));
  };

  // --- LOGO UPLOAD HANDLER (AVIF/WebP) ---
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessingLogo(true);
          try {
              // Convert to efficient format (AVIF/WebP)
              const optimizedBase64 = await optimizeImage(file, { maxWidth: 300, maxHeight: 300 });
              setLocalSettings(prev => ({ ...prev, businessLogo: optimizedBase64 }));
              addToast('success', 'Logo Dioptimasi', 'Gambar dikompresi ke format modern (AVIF/WebP).');
          } catch (err) {
              addToast('error', 'Gagal Upload', 'Gagal memproses gambar.');
          } finally {
              setIsProcessingLogo(false);
          }
      }
  };

  const handleSave = () => {
    setIsSaving(true);
    try {
        updateSettings(localSettings);
        localMemberships.forEach(m => updateMembershipConfig(m));
        addToast('success', 'Berhasil Disimpan', 'Konfigurasi sistem telah diperbarui.');
    } catch (e) {
        addToast('error', 'Gagal Menyimpan', 'Terjadi kesalahan saat menyimpan data.');
    } finally {
        setTimeout(() => setIsSaving(false), 500);
    }
  };

  // --- BACKUP & RESTORE ---
  const handleBackup = () => {
    const data = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      consoles: Storage.getConsoles(),
      members: Storage.getMembers(),
      transactions: Storage.getTransactions(),
      settings: Storage.getSettings(),
      memberships: Storage.getMemberships()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `Ziezan_Backup_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('success', 'Backup Selesai', 'File backup telah diunduh.');
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (!json.consoles || !json.members) throw new Error(t('invalid_file'));

        if (confirm(t('restore_confirm', { date: json.timestamp || 'Unknown' }))) {
            Storage.saveConsoles(json.consoles);
            Storage.saveMembers(json.members);
            Storage.saveTransactions(json.transactions || []);
            if (json.settings) Storage.saveSettings(json.settings);
            if (json.memberships) Storage.saveMemberships(json.memberships);
            
            refreshData();
            addToast('success', 'Restore Berhasil', 'Aplikasi akan dimuat ulang...');
            setTimeout(() => window.location.reload(), 1500);
        }
      } catch (err: any) {
        addToast('error', 'Restore Gagal', err.message);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // --- STYLING HELPERS ---
  const getTierStyle = (id: string) => {
    switch(id) {
      case 'VIP':
        return {
          card: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-yellow-400',
          text: 'text-amber-950',
          subText: 'text-amber-900/80',
          inputBg: 'bg-white/40 border-white/20 text-amber-950 placeholder:text-amber-900/50 focus:ring-amber-700',
          iconColor: 'text-amber-900',
          shineOpacity: 'opacity-30',
          toggleBg: 'bg-amber-950/20'
        };
      case 'PLUS':
        return {
          card: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 border-purple-500',
          text: 'text-white',
          subText: 'text-white/80',
          inputBg: 'bg-white/20 border-white/10 text-white placeholder:text-white/50 focus:ring-white',
          iconColor: 'text-white',
          shineOpacity: 'opacity-20',
          toggleBg: 'bg-white/20'
        };
      default: // BASIC
        return {
          card: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border-slate-300 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 dark:border-slate-600',
          text: 'text-slate-800 dark:text-white',
          subText: 'text-slate-500 dark:text-slate-400',
          inputBg: 'bg-white/60 dark:bg-black/20 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-slate-500',
          iconColor: 'text-slate-600 dark:text-slate-300',
          shineOpacity: 'opacity-40',
          toggleBg: 'bg-slate-300 dark:bg-slate-600'
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

  // --- RENDER FUNCTIONS (Correctly Defined Outside or Inline) ---

  const renderBusinessSettings = () => (
    <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col animate-fade-in overflow-y-auto">
        <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-6 flex items-center gap-2">
            <Building2 size={20} className="text-palette-mustard"/> {t('business_profile')}
        </h3>
        
        <div className="space-y-5 pb-4">
            {/* Logo Upload Section - ROUNDED */}
            <div className="flex flex-col items-center sm:items-start gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide w-full">{t('logo_label')}</span>
                <div className="flex flex-row gap-4 items-center w-full">
                    <div className="relative group shrink-0">
                        <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-white/20 overflow-hidden bg-white dark:bg-palette-navy flex items-center justify-center">
                            {isProcessingLogo ? (
                                <Loader2 className="w-6 h-6 animate-spin text-palette-mustard" />
                            ) : (
                                <img 
                                    src={localSettings.businessLogo} 
                                    alt="Logo" 
                                    className="w-full h-full object-cover" 
                                    onError={(e) => (e.currentTarget.src = 'https://beeimg.com/images/s77882238754.png')}
                                />
                            )}
                        </div>
                        <button 
                            onClick={() => logoInputRef.current?.click()}
                            className="absolute -bottom-1 -right-1 p-2 bg-palette-mustard text-white rounded-full shadow-lg hover:bg-palette-mustard/90 transition-transform active:scale-95"
                            title="Upload Logo"
                        >
                            <Camera size={14} />
                        </button>
                        <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                    </div>
                    {/* Fixed: Use flex-1 to prevent overflow in flex container */}
                    <div className="flex-1 min-w-0 space-y-2">
                        <label className="text-[10px] text-slate-400 block truncate">{t('or_use_url')}</label>
                        <div className="relative w-full">
                            <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="url" 
                                value={localSettings.businessLogo}
                                onChange={e => handleTextChange(e.target.value, 'businessLogo')}
                                className="w-full bg-white dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs focus:ring-2 focus:ring-palette-mustard dark:text-white truncate"
                                placeholder="https://..."
                            />
                        </div>
                        <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1 truncate">
                            <CloudLightning size={10}/> Auto-Compress: AVIF / WebP Support
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('business_name')}</label>
                <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        value={localSettings.businessName}
                        onChange={e => handleTextChange(e.target.value, 'businessName')}
                        className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all dark:text-white font-bold"
                        placeholder="Nama Bisnis Anda"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('full_address')}</label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                    <textarea 
                        rows={3}
                        value={localSettings.businessAddress}
                        onChange={e => handleTextChange(e.target.value, 'businessAddress')}
                        className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all dark:text-white resize-none"
                        placeholder="Alamat lengkap usaha"
                    ></textarea>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('phone_number')}</label>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="tel" 
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={localSettings.businessPhone}
                        onChange={e => handleTextChange(e.target.value, 'businessPhone')}
                        className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all dark:text-white"
                        placeholder="+62..."
                    />
                </div>
            </div>
        </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col animate-fade-in overflow-y-auto">
        <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-6 flex items-center gap-2">
            <Coins size={20} className="text-palette-mustard"/> {t('general_settings')}
        </h3>
        
        {/* Hourly Rate */}
        <div className="space-y-3 mb-6">
            <label className="block text-sm font-semibold text-palette-brown dark:text-white">{t('hourly_rate')} (Rp)</label>
            <div className="relative group">
                <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                type="text" 
                inputMode="numeric"
                pattern="[0-9]*"
                value={localSettings.hourlyRate === 0 && localSettings.hourlyRate.toString() !== '0' ? '' : formatNumber(localSettings.hourlyRate)}
                onChange={e => handleNumericChange(e.target.value, 'hourlyRate')}
                className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-12 pr-4 py-4 text-palette-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard font-mono text-xl font-bold transition-all"
                />
            </div>
            <p className="text-xs text-slate-500">{t('rate_desc')}</p>
        </div>

        {/* Birthday Bonus */}
        <div className="space-y-4 border-t border-slate-100 dark:border-white/5 pt-6">
            <div className="flex items-center gap-2 text-palette-brown dark:text-white mb-2">
                <Gift size={18} className="text-palette-red"/>
                <span className="text-sm font-semibold">{t('birthday_bonus')}</span>
            </div>
            <div className="flex items-center gap-4">
                {/* Fixed: Use flex-1 instead of w-full to allow space for the unit label */}
                <input 
                    type="number" 
                    inputMode="numeric"
                    value={localSettings.birthdayBonusHours || 0}
                    onChange={e => handleNumericChange(e.target.value, 'birthdayBonusHours')}
                    className="flex-1 bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-3 text-center font-bold text-xl text-palette-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard"
                />
                <span className="text-base font-bold text-slate-500 whitespace-nowrap shrink-0">{t('jam')}</span>
            </div>
            <p className="text-xs text-slate-500">{t('birthday_bonus_desc')}</p>
        </div>
    </div>
  );

  const renderConnectivity = () => (
    <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col animate-fade-in overflow-y-auto">
        <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-6 flex items-center gap-2">
            <Wifi size={20} className="text-blue-500"/> {t('tv_connectivity')}
        </h3>
        
        {/* Wi-Fi / Cloud Status */}
        <div className="mb-6 p-5 rounded-3xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
            <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-blue-500 text-white animate-pulse">
                    <CloudLightning size={24} />
                </div>
                <div>
                    <p className="font-bold text-base text-blue-700 dark:text-blue-400">
                        Ziezan Cloud Link (Wi-Fi)
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">{t('cloud_link_desc')}</p>
                </div>
            </div>
        </div>

        {/* Bluetooth Controls */}
        <div className={`p-5 rounded-3xl mb-6 border transition-colors ${isConnected ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
            <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${isConnected ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                    {isConnected ? <BluetoothConnected size={24} /> : <BluetoothOff size={24} />}
                </div>
                <div>
                    <p className={`font-bold text-base ${isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                        {isConnected ? t('bluetooth_connected') : t('bluetooth_disconnected')}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">{t('device_status')}</p>
                </div>
            </div>
        </div>
        
        {isConnected ? (
            <button 
                onClick={disconnect}
                className="w-full py-4 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-base transition-colors flex items-center justify-center gap-2 mt-auto"
            >
                <BluetoothOff size={20} /> {t('disconnect_bt')}
            </button>
        ) : (
            <button 
                onClick={connect}
                className="w-full py-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-base transition-colors shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2 mt-auto"
            >
                <Bluetooth size={20} /> {t('connect_bt')}
            </button>
        )}
    </div>
  );

  const renderDataManagement = () => (
    <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm h-full flex flex-col animate-fade-in overflow-y-auto">
        <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-6 flex items-center gap-2">
            <Database size={20} className="text-emerald-500"/> {t('data_management')}
        </h3>
        
        <div className="bg-slate-50 dark:bg-white/5 rounded-3xl p-5 border border-slate-100 dark:border-white/10 mb-6">
            <div className="flex items-center gap-2 mb-3">
                <CloudLightning size={18} className="text-palette-mustard"/>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{t('smart_cloud_opt')}</span>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">{t('keep_data_duration')}</label>
                <select 
                    value={localSettings.cloudRetentionDays || 90}
                    onChange={(e) => handleNumericChange(e.target.value, 'cloudRetentionDays')}
                    className="w-full bg-white dark:bg-palette-navy border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-base rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none"
                >
                    <option value={30}>{t('days_30_save')}</option>
                    <option value={90}>{t('days_90')}</option>
                    <option value={365}>{t('days_365')}</option>
                    <option value={0}>{t('forever')}</option>
                </select>
            </div>
        </div>

        <div className="space-y-4 mt-auto">
            <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line mb-4">
                {t('backup_restore_desc')}
            </p>

            <button 
                onClick={handleBackup}
                className="w-full group relative flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-3xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all overflow-hidden"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-white/20 rounded-full"><Download size={20}/></div>
                    <div className="text-left">
                        <span className="block text-sm font-bold">{t('backup_btn')}</span>
                        <span className="block text-[10px] opacity-80">{t('download_data')}</span>
                    </div>
                </div>
                <ChevronRight className="opacity-50" />
            </button>

            <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full group relative flex items-center justify-between p-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-palette-mustard active:scale-95 transition-all"
            >
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full"><Upload size={20}/></div>
                    <div className="text-left">
                        <span className="block text-sm font-bold">{t('restore_btn')}</span>
                        <span className="block text-[10px] opacity-60">{t('upload_data')}</span>
                    </div>
                </div>
                <ChevronRight className="opacity-50" />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleRestore} 
                accept=".json" 
                className="hidden"
            />
        </div>
    </div>
  );

  const renderMembershipAndDev = () => (
    <div className="space-y-6 animate-fade-in">
        {/* Membership Config */}
        <div>
            <h3 className="text-lg font-bold text-palette-navy dark:text-white flex items-center gap-2 mb-4">
                {t('membership_settings')}
            </h3>
            <div className="grid grid-cols-1 gap-6">
                {localMemberships.map(m => {
                const style = getTierStyle(m.id);
                return (
                <div key={m.id} className={`rounded-3xl border shadow-lg overflow-hidden flex flex-col relative ${style.card}`}>
                    <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer pointer-events-none z-0 ${style.shineOpacity}`} style={{ width: '200%' }}></div>

                    <div className="relative z-10 p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full backdrop-blur-md ${style.inputBg}`}>
                                {getIcon(m.id, style.iconColor)}
                            </div>
                            <div>
                                <h4 className={`font-bold text-lg ${style.text}`}>{m.name}</h4>
                                <p className={`text-xs font-medium ${style.subText}`}>{m.id}</p>
                            </div>
                        </div>
                        <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                            <input type="checkbox" checked={m.isActive} onChange={(e) => handleMembershipChange(m.id, 'isActive', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-2 border-slate-200 appearance-none cursor-pointer checked:right-0 right-6 shadow-sm z-20" />
                            <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors z-10 ${m.isActive ? 'bg-palette-green' : style.toggleBg}`}></label>
                        </div>
                    </div>

                    <div className="relative z-10 p-6 space-y-5 flex-1">
                        <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${style.subText}`}>{t('price_plan')}</label>
                            <div className="relative">
                                <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ${style.subText}`}>Rp</span>
                                <input 
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*" 
                                    value={formatNumber(m.price)} 
                                    onChange={e => handleMembershipChange(m.id, 'price', e.target.value)}
                                    className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 transition-all backdrop-blur-sm ${style.inputBg}`}
                                />
                            </div>
                            <div className="flex items-center gap-3 mt-1.5">
                                <div className="relative flex-shrink-0">
                                    <input 
                                        type="number"
                                        inputMode="numeric" 
                                        value={m.durationDays} 
                                        onChange={e => handleMembershipChange(m.id, 'durationDays', e.target.value)}
                                        className={`w-20 rounded-lg px-3 py-1.5 text-xs text-center font-bold focus:outline-none focus:ring-2 transition-all ${style.inputBg}`}
                                    />
                                </div>
                                <span className={`text-xs font-medium ${style.subText}`}>{t('days_lifetime')}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${style.subText}`}>{t('bonus_target')}</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number"
                                        inputMode="numeric" 
                                        value={m.bonusThreshold} 
                                        onChange={e => handleMembershipChange(m.id, 'bonusThreshold', e.target.value)}
                                        className={`w-full rounded-xl px-4 py-3 text-sm text-center font-bold focus:outline-none focus:ring-2 transition-all ${style.inputBg}`}
                                    />
                                    <span className={`text-xs font-bold ${style.subText}`}>{t('jam')}</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className={`text-xs font-bold uppercase tracking-wider ${style.subText}`}>{t('reward')}</label>
                                <div className="flex items-center gap-2">
                                    <input 
                                        type="number" 
                                        inputMode="numeric"
                                        value={m.bonusReward} 
                                        onChange={e => handleMembershipChange(m.id, 'bonusReward', e.target.value)}
                                        className={`w-full rounded-xl px-4 py-3 text-sm text-center font-bold focus:outline-none focus:ring-2 transition-all ${style.inputBg}`}
                                    />
                                    <span className={`text-xs font-bold ${style.subText}`}>{t('jam')}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className={`p-3 rounded-xl text-xs font-medium border backdrop-blur-sm ${style.inputBg}`}>
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

  // --- DESKTOP SIDEBAR NAVIGATION ITEM ---
  const renderDesktopNavItem = ({ section, icon: Icon, label }: { section: SettingsSection, icon: any, label: string }) => (
      <button 
        key={section}
        onClick={() => setActiveSection(section)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-full transition-all font-bold text-sm ${
            activeSection === section 
            ? 'bg-palette-mustard text-white shadow-md' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
        }`}
      >
          <Icon size={18} /> {label}
      </button>
  );

  // --- MOBILE RENDER LOGIC ---
  if (isMobile && mobileMenuOpen) {
      return (
        <div className="flex flex-col gap-4 animate-fade-in pb-safe">
            <div className="mb-2">
                <h2 className="text-2xl font-bold text-palette-navy dark:text-white">{t('system_settings')}</h2>
                <p className="text-palette-brown/70 dark:text-palette-cream/60">{t('config_subtitle')}</p>
            </div>

            <button onClick={() => { setActiveSection('BUSINESS'); setMobileMenuOpen(false); }} className="flex items-center justify-between p-5 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm active:scale-98 transition-transform">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-palette-mustard/10 rounded-full text-palette-mustard"><Building2 size={24}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-palette-navy dark:text-white">{t('business_profile')}</h3>
                        <p className="text-xs text-slate-500">Nama, Alamat & Logo</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300" />
            </button>

            <button onClick={() => { setActiveSection('GENERAL'); setMobileMenuOpen(false); }} className="flex items-center justify-between p-5 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm active:scale-98 transition-transform">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-palette-mustard/10 rounded-full text-palette-mustard"><Coins size={24}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-palette-navy dark:text-white">{t('general_settings')}</h3>
                        <p className="text-xs text-slate-500">{t('rate_and_bonus')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300" />
            </button>

            <button onClick={() => { setActiveSection('CONNECTIVITY'); setMobileMenuOpen(false); }} className="flex items-center justify-between p-5 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm active:scale-98 transition-transform">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600"><Wifi size={24}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-palette-navy dark:text-white">{t('tv_connectivity')}</h3>
                        <p className="text-xs text-slate-500">{t('bluetooth_settings')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300" />
            </button>

            <button onClick={() => { setActiveSection('DATA'); setMobileMenuOpen(false); }} className="flex items-center justify-between p-5 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm active:scale-98 transition-transform">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600"><Database size={24}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-palette-navy dark:text-white">{t('data_management')}</h3>
                        <p className="text-xs text-slate-500">Backup & Restore</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300" />
            </button>

            <button onClick={() => { setActiveSection('MEMBERSHIP'); setMobileMenuOpen(false); }} className="flex items-center justify-between p-5 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm active:scale-98 transition-transform">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600"><Crown size={24}/></div>
                    <div className="text-left">
                        <h3 className="font-bold text-lg text-palette-navy dark:text-white">{t('membership') + ' & Info'}</h3>
                        <p className="text-xs text-slate-500">{t('membership_settings')}</p>
                    </div>
                </div>
                <ChevronRight className="text-slate-300" />
            </button>
        </div>
      );
  } else if (isMobile && !mobileMenuOpen) {
      // Mobile Subpage View
      let title = '';
      let content = null;
      switch(activeSection) {
          case 'BUSINESS': title = t('business_profile'); content = renderBusinessSettings(); break;
          case 'GENERAL': title = t('general_settings'); content = renderGeneralSettings(); break;
          case 'CONNECTIVITY': title = t('tv_connectivity'); content = renderConnectivity(); break;
          case 'DATA': title = t('data_management'); content = renderDataManagement(); break;
          case 'MEMBERSHIP': title = t('membership_settings'); content = renderMembershipAndDev(); break;
      }

      return (
        <div className="fixed inset-0 z-[60] bg-palette-creamLight dark:bg-palette-navy flex flex-col animate-slide-in">
            {/* Header */}
            <div className="px-4 py-4 bg-white dark:bg-palette-navyLight border-b border-slate-200 dark:border-white/5 flex items-center gap-3 shrink-0 shadow-sm">
                <button onClick={() => setMobileMenuOpen(true)} className="p-2 -ml-2 rounded-full hover:bg-slate-100 dark:hover:bg-white/10 text-slate-600 dark:text-white transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h2 className="text-lg font-bold text-palette-navy dark:text-white flex-1">{title}</h2>
            </div>
            
            {/* Content Scroll */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {content}
                
                {/* STATIC SAVE BUTTON AT BOTTOM OF SCROLL AREA */}
                <div className="mt-8 mb-safe pb-8">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className={`w-full py-4 rounded-2xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2 transition-all ${
                            isSaving ? 'bg-palette-green' : 'bg-palette-mustard active:scale-95'
                        }`}
                    >
                        {isSaving ? t('saved') : <><Save size={20} /> {t('save_changes')}</>}
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- DESKTOP / TABLET VIEW (Responsive Sidebar Layout) ---
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