
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';
import { Save, Crown, Bluetooth, BluetoothConnected, BluetoothOff, Globe, Phone, Database, Upload, Download, CloudLightning, ImageIcon, Camera, Loader2, RefreshCw, ChevronRight, ArrowLeft, Banknote, Building2, MapPin, Gift, Trophy, Zap, HardDrive, Link as LinkIcon } from 'lucide-react';
import { MembershipConfig, AppSettings } from '../types';
import * as Storage from '../services/storage';
import { optimizeImage } from '../utils/imageOptimizer';
import { getTierTheme } from '../utils/tierTheme'; 
import { syncService } from '../services/sync';

type SettingsSection = 'BUSINESS' | 'GENERAL' | 'CONNECTIVITY' | 'DATA' | 'MEMBERSHIP';

const SectionHeader = ({ title, sub }: { title: string, sub?: string }) => (
    <div className="mb-8 border-l-[6px] border-palette-mustard pl-5 hidden lg:block">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{title}</h3>
        {sub && <p className="text-label mt-2">{sub}</p>}
    </div>
);

const InputGroup = ({ label, icon: Icon, children }: { label: string, icon?: any, children?: React.ReactNode }) => (
    <div className="group space-y-3">
        <label className="text-label group-focus-within:text-palette-mustard transition-colors flex items-center gap-2">
            {Icon && <Icon size={14} />} {label}
        </label>
        <div className="relative">
            {children}
        </div>
    </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props}
        className="input-standard w-full px-5"
    />
);

const StyledTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea 
        {...props}
        className="textarea-standard"
    />
);

interface FormattedNumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: number;
    onChange: (value: number) => void;
    suffix?: string;
    isCurrency?: boolean;
}

const FormattedNumberInput: React.FC<FormattedNumberInputProps> = ({ value, onChange, suffix, isCurrency, style, ...props }) => {
    const [displayValue, setDisplayValue] = useState<string>('');
    useEffect(() => {
        setDisplayValue(value.toLocaleString('id-ID'));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, ''); // FORCE NUMBERS ONLY
        const sanitized = raw.replace(/^0+/, '') || '0';
        const numValue = parseInt(sanitized, 10);
        setDisplayValue(numValue.toLocaleString('id-ID'));
        onChange(numValue);
    };

    return (
        <div className="relative w-full">
            {isCurrency && (
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500 z-10">Rp</span>
            )}
            <input 
                {...props}
                type="text" 
                inputMode="numeric"
                value={displayValue}
                onChange={handleChange}
                className="input-standard w-full px-5"
                style={{
                    paddingLeft: isCurrency ? '2.5rem' : '1.25rem',
                    paddingRight: suffix ? '3rem' : '1.25rem',
                    ...style
                }}
            />
            {suffix && (
                <span className="absolute right-5 top-1/2 -translate-y-1/2 text-label">{suffix}</span>
            )}
        </div>
    );
};

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig, resetSeason } = useData();
  const { t } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt, disconnect: disconnectBt } = useBluetooth();
  const { addToast } = useToast();

  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localMemberships, setLocalMemberships] = useState<MembershipConfig[]>(membershipConfigs);
  const [activeSection, setActiveSection] = useState<SettingsSection>('BUSINESS');
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  useEffect(() => { setLocalSettings(settings); }, [settings]);
  useEffect(() => { setLocalMemberships(membershipConfigs); }, [membershipConfigs]);

  const handleSettingsChange = (key: keyof AppSettings, value: any) => { setLocalSettings(prev => ({ ...prev, [key]: value })); };
  const handleMembershipChange = (id: string, key: keyof MembershipConfig, value: any) => {
    setLocalMemberships(prev => prev.map(m => m.id === id ? { ...m, [key]: key === 'isActive' ? value : Number(value) } : m));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
        updateSettings(localSettings);
        localMemberships.forEach(m => updateMembershipConfig(m));
        await syncService.syncNow();
        addToast('success', t('saved'), t('saved'));
    } catch (e) {
        addToast('error', 'Error', 'Error');
    } finally {
        setIsSaving(false);
    }
  };

  const handleResetSeason = () => {
      if (confirm(t('delete_confirm'))) {
          resetSeason();
          addToast('info', 'Season Reset', t('saved'));
      }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        try {
            const optimized = await optimizeImage(file, { maxWidth: 200, maxHeight: 200 });
            handleSettingsChange('businessLogo', optimized);
            addToast('success', t('saved'), t('saved'));
        } catch (err) {
            addToast('error', 'Error', 'Error');
        }
    }
  };

  const handleBackup = () => {
      try {
          const data = { consoles: Storage.getConsoles(), members: Storage.getMembers(), transactions: Storage.getTransactions(), settings: Storage.getSettings(), memberships: Storage.getMemberships(), timestamp: new Date().toISOString(), version: "1.1.0" };
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ZiezanBackup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addToast('success', 'Backup', t('saved'));
      } catch (e) { addToast('error', 'Error', 'Error'); }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (!json.members) throw new Error();
              if (confirm(t('delete_confirm'))) {
                  if(json.consoles) Storage.saveConsoles(json.consoles);
                  if(json.members) Storage.saveMembers(json.members);
                  if(json.transactions) Storage.saveTransactions(json.transactions);
                  if(json.settings) Storage.saveSettings(json.settings);
                  if(json.memberships) Storage.saveMemberships(json.memberships);
                  addToast('success', 'Restore', t('saved'));
                  setTimeout(() => window.location.reload(), 1500);
              }
          } catch (err) { addToast('error', 'Error', t('invalid_file')); }
      };
      reader.readAsText(file);
      if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  const navigateToSection = (section: SettingsSection) => {
      setActiveSection(section);
      setIsMobileMenuOpen(false);
      window.scrollTo(0, 0);
  };

  const MobileMenuItem = ({ section, icon: Icon, label, desc }: { section: SettingsSection, icon: any, label: string, desc: string }) => (
    <button onClick={() => navigateToSection(section)} className="w-full glass-panel p-4 flex items-center gap-4 active:scale-[0.98] transition-all shadow-sm mb-3 min-h-[88px] border border-white/20 relative overflow-hidden group">
        <div className="absolute inset-0 bg-gradient-to-r from-palette-mustard/0 to-palette-mustard/0 group-hover:from-palette-mustard/5 group-hover:to-transparent transition-all duration-500"></div>
        <div className="p-3.5 bg-palette-mustard/10 rounded-2xl text-palette-mustard group-hover:bg-palette-mustard group-hover:text-white transition-all shadow-inner shrink-0">
            <Icon size={24} />
        </div>
        <div className="text-left flex-1 min-w-0">
            <h4 className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight truncate">{label}</h4>
            <p className="text-xs text-muted-foreground truncate mt-0.5">{desc}</p>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-palette-mustard group-hover:translate-x-1 transition-all">
            <ChevronRight size={16} />
        </div>
    </button>
  );

  const renderDesktopNavItem = ({ section, icon: Icon, label }: { section: SettingsSection, icon: any, label: string }) => {
    const isActive = activeSection === section;
    return (
        <button onClick={() => setActiveSection(section)} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all relative overflow-hidden group ${isActive ? 'bg-palette-mustard text-white shadow-xl shadow-palette-mustard/30 scale-[1.02]' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'}`}>
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-white/40"></div>}
            <Icon size={20} className={`shrink-0 ${isActive ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
            <span className="font-black text-xs tracking-[0.15em] uppercase whitespace-nowrap flex-1 text-left">{label}</span>
            {isActive && <ChevronRight size={16} className="opacity-50 shrink-0" />}
        </button>
    );
  };

  const renderBusinessSettings = () => (
    <div className="space-y-10 animate-fade-in pb-12 lg:pb-0">
        <SectionHeader title={t('business_profile')} sub={t('id_card_rental')} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
                <div className="glass-panel p-8 flex flex-col items-center text-center shadow-xl">
                    <div className="relative group cursor-pointer w-40 h-40 lg:w-48 lg:h-48 mb-6" onClick={() => logoInputRef.current?.click()}>
                        <div className="w-full h-full rounded-[2.5rem] bg-black/40 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden relative z-10 shadow-inner">
                            {localSettings.businessLogo ? ( <img src={localSettings.businessLogo} alt="Logo" className="w-full h-full object-cover" /> ) : ( <ImageIcon className="text-slate-600" size={48} /> )}
                        </div>
                        <div className="absolute inset-0 bg-black/60 rounded-[2.5rem] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all z-20 backdrop-blur-sm">
                            <Camera className="text-white" size={32} />
                        </div>
                        <div className="absolute -inset-4 bg-palette-mustard/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} className="btn-primary px-6 rounded-full">{t('upload_data')}</button>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    <div className="w-full mt-8 border-t border-slate-200 dark:border-white/10 pt-8">
                        <InputGroup label={t('direct_url')} icon={LinkIcon}>
                            <StyledInput value={localSettings.businessLogo} onChange={(e) => handleSettingsChange('businessLogo', e.target.value)} placeholder="https://..." />
                        </InputGroup>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-6">
                <div className="glass-panel p-8 space-y-6 shadow-xl">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InputGroup label={t('business_name')} icon={Building2}>
                            <StyledInput value={localSettings.businessName} onChange={(e) => handleSettingsChange('businessName', e.target.value)} />
                        </InputGroup>
                        <InputGroup label={t('phone_number')} icon={Phone}>
                            <StyledInput 
                                type="tel"
                                value={localSettings.businessPhone} 
                                onChange={(e) => handleSettingsChange('businessPhone', e.target.value.replace(/\D/g, ''))} // NUMBER ONLY
                                placeholder="08xxxxxxxxxx"
                            />
                        </InputGroup>
                    </div>
                    <InputGroup label={t('full_address')} icon={MapPin}>
                        <StyledTextArea value={localSettings.businessAddress} onChange={(e) => handleSettingsChange('businessAddress', e.target.value)} />
                    </InputGroup>
                </div>
            </div>
        </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-10 animate-fade-in pb-12 lg:pb-0">
         <SectionHeader title={t('rate_and_bonus')} sub={t('profit_loyalty')} />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="glass-panel p-8 relative overflow-hidden group shadow-xl">
                 <div className="absolute right-[-20px] top-[-20px] p-4 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-1000"><Banknote size={120}/></div>
                 <div className="flex items-center gap-5 mb-8 relative z-10">
                     <div className="p-4 bg-palette-mustard/10 rounded-[1.5rem] text-palette-mustard shadow-inner"><Banknote size={32}/></div>
                     <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">{t('hourly_rate')}</h4>
                        <p className="text-label">{t('base_price_desc')}</p>
                     </div>
                 </div>
                 <div className="relative z-10">
                    <FormattedNumberInput value={localSettings.hourlyRate} onChange={(val) => handleSettingsChange('hourlyRate', val)} isCurrency style={{ fontSize: '1.25rem', fontFamily: 'monospace', borderRadius: '1.5rem', height: '60px' }} />
                 </div>
             </div>
             <div className="glass-panel p-8 relative overflow-hidden group shadow-xl">
                 <div className="absolute right-[-20px] top-[-20px] p-4 opacity-5 group-hover:opacity-20 group-hover:scale-110 transition-all duration-1000"><Gift size={120}/></div>
                 <div className="flex items-center gap-5 mb-8 relative z-10">
                     <div className="p-4 bg-palette-green/10 rounded-[1.5rem] text-palette-green shadow-inner"><Gift size={32}/></div>
                     <div>
                        <h4 className="font-black text-slate-900 dark:text-white text-lg tracking-tight uppercase">{t('birthday_bonus')}</h4>
                        <p className="text-label">{t('auto_reward_desc')}</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-4 relative z-10">
                    <FormattedNumberInput value={localSettings.birthdayBonusHours} onChange={(val) => handleSettingsChange('birthdayBonusHours', val)} suffix={t('jam')} style={{ textAlign: 'center', fontSize: '1.25rem', fontFamily: 'monospace', borderRadius: '1.5rem', height: '60px' }} />
                 </div>
             </div>
         </div>
    </div>
  );

  const renderConnectivity = () => (
    <div className="space-y-10 animate-fade-in pb-12 lg:pb-0">
         <SectionHeader title={t('tv_connectivity')} sub={t('iot_infra')} />
         <div className="bg-white/40 dark:bg-blue-600/10 backdrop-blur-xl p-8 rounded-[3rem] border border-slate-300 dark:border-blue-500/20 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden shadow-xl">
             <div className="absolute left-0 top-0 w-2 h-full bg-blue-500 opacity-50"></div>
             <div className="flex items-center gap-6">
                 <div className="w-20 h-20 rounded-[2rem] bg-blue-500/20 text-blue-500 flex items-center justify-center relative shadow-inner">
                     <CloudLightning size={40} />
                     <div className="absolute inset-0 bg-blue-500/20 blur-2xl rounded-full"></div>
                 </div>
                 <div>
                     <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">Smart Cloud Link</h4>
                     <p className="text-sm font-bold text-slate-500 dark:text-blue-200/60 max-w-sm mt-2 leading-relaxed uppercase tracking-widest">{t('cloud_link_desc')}</p>
                 </div>
             </div>
             <div className="flex items-center gap-3 px-6 py-3 bg-blue-500 text-white rounded-full shadow-2xl shadow-blue-500/30">
                 <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse"></div>
                 <span className="text-xs font-black tracking-widest uppercase">{t('online')}</span>
             </div>
         </div>
         <div className="glass-panel p-8 shadow-xl">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                 <div className="flex items-center gap-5">
                     <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-inner transition-all duration-500 ${isBtConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-black/10 text-slate-500 border border-slate-300 dark:border-white/10'}`}>
                         {isBtConnected ? <BluetoothConnected size={32} /> : <BluetoothOff size={32} />}
                     </div>
                     <div>
                         <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">{t('bluetooth_settings')}</h4>
                         <p className="text-label mt-1">{t('bt_desc')}</p>
                     </div>
                 </div>
                 <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-[0.2em] border ${isBtConnected ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-black/10 text-slate-500 border-slate-300 dark:border-white/10'}`}>
                     {isBtConnected ? 'Active' : 'Disconnected'}
                 </div>
             </div>
             {isBtConnected ? (
                 <button onClick={disconnectBt} className="w-full h-control rounded-[1.5rem] bg-red-500/10 text-red-500 border border-red-500/20 font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center justify-center gap-3"><Bluetooth size={20} /> {t('disconnect_bt')}</button>
             ) : (
                 <button onClick={connectBt} className="w-full h-control rounded-[1.5rem] bg-blue-600 text-white font-black uppercase tracking-widest shadow-2xl shadow-blue-600/30 hover:bg-blue-500 transition-all flex items-center justify-center gap-3"><Bluetooth size={20} /> {t('connect_bt')}</button>
             )}
         </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-10 animate-fade-in pb-12 lg:pb-0">
         <SectionHeader title={t('data_management')} sub={t('integrity_db')} />
         <div className="glass-panel p-8 shadow-xl">
             <div className="flex items-center gap-5 mb-8">
                 <div className="p-4 bg-amber-500/10 text-amber-500 rounded-[1.5rem] shadow-inner"><Database size={32}/></div>
                 <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">{t('smart_cloud_opt')}</h4>
                    <p className="text-label">{t('keep_data_duration')}</p>
                 </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[ { val: 30, label: t('days_30_save') }, { val: 90, label: t('days_90') }, { val: 365, label: t('days_365') }, { val: 0, label: t('forever') } ].map(opt => (
                    <button key={opt.val} onClick={() => handleSettingsChange('cloudRetentionDays', opt.val)} className={`h-control rounded-2xl border font-black text-xs uppercase tracking-widest transition-all relative overflow-hidden backdrop-blur-md ${localSettings.cloudRetentionDays === opt.val ? 'bg-amber-500/10 text-amber-500 border-amber-500/50 shadow-lg' : 'bg-black/10 border-slate-300 dark:border-white/10 text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        {opt.label}
                    </button>
                ))}
             </div>
         </div>

         <div className="glass-panel p-8 shadow-xl">
             <div className="flex items-center gap-5 mb-8">
                 <div className="p-4 bg-indigo-500/10 text-indigo-500 rounded-[1.5rem] shadow-inner"><HardDrive size={32}/></div>
                 <div>
                    <h4 className="font-black text-slate-900 dark:text-white text-lg uppercase tracking-tight">{t('manual_backup')}</h4>
                    <p className="text-label whitespace-pre-wrap">{t('backup_restore_desc')}</p>
                 </div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button onClick={handleBackup} className="flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-black/10 dark:bg-black/20 border border-slate-300 dark:border-white/5 hover:border-indigo-500/40 transition-all group backdrop-blur-md shadow-inner">
                     <div className="p-4 bg-white/5 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-all"><Download size={28} /></div>
                     <span className="font-black text-xs text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-[0.2em]">{t('download_data')}</span>
                 </button>
                 <div className="relative">
                     <input type="file" ref={restoreInputRef} onChange={handleRestore} accept=".json" className="hidden" />
                     <button onClick={() => restoreInputRef.current?.click()} className="w-full h-full flex flex-col items-center justify-center gap-4 p-8 rounded-[2rem] bg-black/10 dark:bg-black/20 border border-slate-300 dark:border-white/5 hover:border-emerald-500/40 transition-all group backdrop-blur-md shadow-inner">
                         <div className="p-4 bg-white/5 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-all"><Upload size={28} /></div>
                         <span className="font-black text-xs text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-[0.2em]">{t('upload_data')}</span>
                     </button>
                 </div>
             </div>
         </div>
    </div>
  );

  const renderMembershipAndDev = () => (
    <div className="space-y-10 animate-fade-in pb-12 lg:pb-0">
        <SectionHeader title={t('membership_settings')} sub={t('ranking_hierarchy')} />
        <div className="bg-gradient-to-r from-indigo-900/80 to-purple-900/80 backdrop-blur-2xl p-8 rounded-[3rem] border border-slate-300 dark:border-white/20 flex flex-col sm:flex-row justify-between items-center shadow-2xl relative overflow-hidden group gap-6">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="relative z-10 flex items-center gap-6">
                <div className="p-5 bg-white/10 rounded-[2rem] text-white border border-white/10 shadow-2xl shadow-black/40"><Trophy size={40} /></div>
                <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">{t('annual_reset')}</h3>
                    <p className="text-xs font-black text-indigo-200 uppercase tracking-widest opacity-60">{t('reset_desc')}</p>
                </div>
            </div>
            <button onClick={handleResetSeason} className="relative z-10 px-8 py-4 bg-red-500 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-2xl shadow-red-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                <RefreshCw size={16} /> {t('reset_season_btn')}
            </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {localMemberships.map(m => {
            const theme = getTierTheme(m.id);
            return (
            <div key={m.id} className="relative group rounded-[2.5rem] glass-card overflow-hidden hover:shadow-2xl shadow-lg">
                <div className={`relative p-5 flex justify-between items-center bg-gradient-to-r ${theme.conic} bg-opacity-20 border-b border-white/10`}>
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
                    <div className="relative z-10 flex items-center gap-4">
                        <div className={`p-2.5 rounded-2xl bg-white/10 shadow-inner ${theme.text}`}><img src={theme.iconUrl} alt={m.name} className="w-10 h-10 object-contain" /></div>
                        <div>
                            <h4 className={`font-black text-base uppercase tracking-wider ${theme.text}`}>{m.name}</h4>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">{m.id.replace('MYTHICAL_', 'M.')}</p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={m.isActive} onChange={(e) => handleMembershipChange(m.id, 'isActive', e.target.checked)} className="sr-only peer" />
                            <div className="w-11 h-6 bg-black/50 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                        </label>
                    </div>
                </div>
                <div className="p-6 space-y-5 relative z-10">
                    <div className="flex items-center justify-between p-4 bg-black/10 dark:bg-black/30 rounded-2xl border border-slate-300 dark:border-white/10 shadow-inner">
                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Trophy size={14}/> {t('xp_req')}</span>
                        <div className="flex items-center gap-3">
                            <FormattedNumberInput value={m.minHours} onChange={(val) => handleMembershipChange(m.id, 'minHours', val)} style={{ width: '4rem', padding: '0', textAlign: 'center', background: 'transparent', border: 'none', borderBottom: '2px solid #7c3aed', color: '#7c3aed', fontWeight: '900' }} />
                            <span className="text-xs font-black text-slate-400">{t('jam')}</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">{t('bonus_target')}</label>
                            <div className="flex items-center gap-3 bg-black/10 dark:bg-black/30 p-3 rounded-2xl border border-slate-300 dark:border-white/10 shadow-inner">
                                <Zap size={16} className="text-yellow-500"/>
                                <FormattedNumberInput value={m.bonusThreshold} onChange={(val) => handleMembershipChange(m.id, 'bonusThreshold', val)} style={{ width: '100%', padding: '0', textAlign: 'center', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: '900' }} />
                                <span className="text-xs font-black text-slate-400">H</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest ml-1">{t('reward')}</label>
                            <div className="flex items-center gap-3 bg-black/10 dark:bg-black/30 p-3 rounded-2xl border border-slate-300 dark:border-white/10 shadow-inner">
                                <Gift size={16} className="text-emerald-500"/>
                                <FormattedNumberInput value={m.bonusReward} onChange={(val) => handleMembershipChange(m.id, 'bonusReward', val)} style={{ width: '100%', padding: '0', textAlign: 'center', background: 'transparent', border: 'none', fontSize: '14px', fontWeight: '900' }} />
                                <span className="text-xs font-black text-slate-400">H</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )})}
        </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto h-full lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-6 lg:gap-10 lg:pb-6 relative px-4 lg:px-2">
      <div className={`lg:hidden w-full ${isMobileMenuOpen ? 'block' : 'hidden'} animate-fade-in pb-32`}>
          <div className="mb-6 pt-4">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{t('system_settings')}</h2>
            <p className="text-xs font-bold text-muted-foreground mt-1">{t('config_subtitle')}</p>
          </div>
          <div className="flex flex-col gap-3">
              <MobileMenuItem section="BUSINESS" icon={Building2} label={t('business_profile')} desc="Identitas & Branding" />
              <MobileMenuItem section="GENERAL" icon={Banknote} label={t('general_settings')} desc="Tarif & Biaya" />
              <MobileMenuItem section="CONNECTIVITY" icon={Bluetooth} label={t('tv_connectivity')} desc="IoT & Smart Link" />
              <MobileMenuItem section="DATA" icon={Database} label={t('data_management')} desc="Backup & Optimizer" />
              <MobileMenuItem section="MEMBERSHIP" icon={Crown} label={t('membership_settings')} desc="Loyalty Hierarchy" />
          </div>
      </div>
      
      {/* 
         UPDATED: Width increased to w-80 (20rem / 320px) to prevent wrapping. 
         Added flex-shrink-0 to ensure it doesn't collapse. 
      */}
      <nav className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-6 h-full">
          <div className="pl-2 pt-2">
            <h2 className="text-2xl font-black text-palette-navy dark:text-white tracking-tight uppercase leading-none">{t('system_settings')}</h2>
            <p className="text-xs font-bold text-muted-foreground mt-2">{t('config_subtitle')}</p>
          </div>
          <div className="glass-panel p-3 shadow-2xl flex flex-col gap-2 overflow-y-auto custom-scrollbar flex-1">
              {renderDesktopNavItem({ section: "BUSINESS", icon: Building2, label: t('business_profile') })}
              {renderDesktopNavItem({ section: "GENERAL", icon: Banknote, label: t('general_settings') })}
              {renderDesktopNavItem({ section: "CONNECTIVITY", icon: Bluetooth, label: t('tv_connectivity') })}
              {renderDesktopNavItem({ section: "DATA", icon: Database, label: t('data_management') })}
              {renderDesktopNavItem({ section: "MEMBERSHIP", icon: Crown, label: t('membership_settings') })}
          </div>
          <div className="mt-auto pt-2">
            <button onClick={handleSave} disabled={isSaving} className={`btn-primary w-full h-[48px] text-sm ${isSaving ? 'bg-emerald-600 scale-95' : 'bg-palette-mustard hover:shadow-palette-mustard/30'}`}>
                {isSaving ? <Loader2 size={20} className="animate-spin"/> : <><Save size={20} /> {t('save_changes')}</>}
            </button>
          </div>
      </nav>

      <main className={`flex-1 min-w-0 ${!isMobileMenuOpen ? 'fixed inset-0 z-modal bg-slate-50 dark:bg-[#030712] overflow-y-auto px-4 pb-32 pt-4' : 'hidden lg:block lg:overflow-y-auto lg:pr-2 custom-scrollbar'}`}>
          <div className="lg:hidden flex items-center gap-4 mb-6 sticky top-0 bg-slate-50/95 dark:bg-[#030712]/95 backdrop-blur-md z-sticky py-3 border-b border-slate-200 dark:border-white/10 -mx-4 px-4 shadow-sm">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2.5 rounded-xl bg-white/40 dark:bg-white/10 text-slate-900 dark:text-white shadow-sm border border-slate-300 dark:border-white/20 active:scale-90 transition-transform"><ArrowLeft size={20} /></button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{(activeSection as any).replace('_', ' ')}</h3>
          </div>
          <div className="max-w-4xl pb-10 mx-auto">
            {activeSection === 'BUSINESS' && renderBusinessSettings()}
            {activeSection === 'GENERAL' && renderGeneralSettings()}
            {activeSection === 'CONNECTIVITY' && renderConnectivity()}
            {activeSection === 'DATA' && renderDataManagement()}
            {activeSection === 'MEMBERSHIP' && renderMembershipAndDev()}
          </div>
      </main>

      {!isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#0f1016]/90 border-t border-slate-200 dark:border-white/10 lg:hidden z-[160] pb-safe backdrop-blur-2xl">
            <button onClick={handleSave} disabled={isSaving} className="btn-primary w-full h-[40px]">
                {isSaving ? <Loader2 size={24} className="animate-spin"/> : <><Save size={24} /> {t('save_changes')}</>}
            </button>
          </div>
      )}
    </div>
  );
};

export default Settings;
