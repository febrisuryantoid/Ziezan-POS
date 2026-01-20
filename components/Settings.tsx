
import React, { useState, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';
import { Save, Crown, Star, Shield, Coins, Bluetooth, BluetoothConnected, BluetoothOff, Globe, Mail, Phone, Code, Database, Upload, Download, CloudLightning, FileJson, AlertTriangle, Wifi, Gift, ChevronRight, ChevronLeft, ArrowLeft, Banknote, Building2, MapPin, Image as ImageIcon, Camera, Loader2, Link as LinkIcon, WifiOff, RefreshCw, CheckCircle2, XCircle, Clock, Trophy, Zap, Sparkles, Hexagon, Gamepad2, Swords, Medal, Trash2, LayoutGrid, Edit3, HardDrive } from 'lucide-react';
import { MembershipConfig, AppSettings } from '../types';
import * as Storage from '../services/storage';
import { optimizeImage } from '../utils/imageOptimizer';
import { getTierTheme } from './PublicMemberCard'; 
import { syncService } from '../services/sync';

type SettingsSection = 'BUSINESS' | 'GENERAL' | 'CONNECTIVITY' | 'DATA' | 'MEMBERSHIP';

// --- HELPER COMPONENTS ---

const SectionHeader = ({ title, sub }: { title: string, sub?: string }) => (
    <div className="mb-6 border-l-4 border-palette-mustard pl-4 hidden lg:block">
        <h3 className="text-xl font-black text-white uppercase tracking-wide">{title}</h3>
        {sub && <p className="text-sm text-slate-400 font-medium mt-1">{sub}</p>}
    </div>
);

const InputGroup = ({ label, icon: Icon, children }: { label: string, icon?: any, children?: React.ReactNode }) => (
    <div className="group space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider group-focus-within:text-palette-mustard transition-colors flex items-center gap-2">
            {Icon && <Icon size={12} />} {label}
        </label>
        <div className="relative">
            {children}
        </div>
    </div>
);

const StyledInput = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input 
        {...props}
        className="w-full bg-[#0a0a12] border border-white/10 rounded-xl px-4 py-3 text-base md:text-sm font-bold text-white focus:outline-none focus:border-palette-mustard/50 focus:ring-1 focus:ring-palette-mustard/50 transition-all placeholder:text-slate-700"
    />
);

const StyledTextArea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea 
        {...props}
        className="w-full bg-[#0a0a12] border border-white/10 rounded-xl px-4 py-3 text-base md:text-sm font-bold text-white focus:outline-none focus:border-palette-mustard/50 focus:ring-1 focus:ring-palette-mustard/50 transition-all placeholder:text-slate-700 resize-none"
    />
);

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig, refreshData, resetSeason } = useData();
  const { t } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt, disconnect: disconnectBt } = useBluetooth();
  const { addToast } = useToast();

  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [localMemberships, setLocalMemberships] = useState<MembershipConfig[]>(membershipConfigs);
  const [activeSection, setActiveSection] = useState<SettingsSection>('BUSINESS');
  const [isSaving, setIsSaving] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  // Mobile Navigation State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

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

  const handleResetSeason = () => {
      if (confirm('Yakin ingin reset season? Semua Progress Playtime member akan kembali ke 0 dan Rank akan turun 1 tingkat.')) {
          resetSeason();
          addToast('info', 'Season Reset', 'Musim baru telah dimulai!');
      }
  };

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

  // --- BACKUP & RESTORE LOGIC ---
  const handleBackup = () => {
      try {
          const data = {
              consoles: Storage.getConsoles(),
              members: Storage.getMembers(),
              transactions: Storage.getTransactions(),
              settings: Storage.getSettings(),
              memberships: Storage.getMemberships(),
              timestamp: new Date().toISOString(),
              version: "1.1.0"
          };
          
          const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `ZiezanBackup_${new Date().toISOString().split('T')[0]}.json`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          addToast('success', 'Backup Berhasil', 'File database telah diunduh.');
      } catch (e) {
          addToast('error', 'Backup Gagal', 'Terjadi kesalahan saat memproses data.');
      }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              
              // Simple validation
              if (!json.members || !json.transactions) {
                  throw new Error(t('invalid_file'));
              }

              if (confirm(t('restore_confirm', { date: new Date(json.timestamp || Date.now()).toLocaleDateString() }))) {
                  if(json.consoles) Storage.saveConsoles(json.consoles);
                  if(json.members) Storage.saveMembers(json.members);
                  if(json.transactions) Storage.saveTransactions(json.transactions);
                  if(json.settings) Storage.saveSettings(json.settings);
                  if(json.memberships) Storage.saveMemberships(json.memberships);
                  
                  addToast('success', 'Restore Berhasil', t('restore_success'));
                  setTimeout(() => window.location.reload(), 1500);
              }
          } catch (err) {
              addToast('error', 'Restore Gagal', t('invalid_file'));
          }
      };
      reader.readAsText(file);
      // Reset input
      if (restoreInputRef.current) restoreInputRef.current.value = '';
  };

  const navigateToSection = (section: SettingsSection) => {
      setActiveSection(section);
      setIsMobileMenuOpen(false);
      window.scrollTo(0, 0);
  };

  const MobileMenuItem = ({ section, icon: Icon, label, desc }: { section: SettingsSection, icon: any, label: string, desc: string }) => (
    <button
        onClick={() => navigateToSection(section)}
        className="w-full bg-[#0f1016] p-5 rounded-2xl border border-white/5 flex items-center justify-between group active:scale-95 transition-all shadow-sm mb-3"
    >
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white/5 rounded-xl text-slate-300 group-hover:bg-palette-mustard group-hover:text-white transition-colors">
                <Icon size={20} />
            </div>
            <div className="text-left">
                <h4 className="font-bold text-white text-sm">{label}</h4>
                <p className="text-[10px] text-slate-500 font-medium">{desc}</p>
            </div>
        </div>
        <ChevronRight size={18} className="text-slate-600 group-hover:text-palette-mustard group-hover:translate-x-1 transition-all" />
    </button>
  );

  const renderDesktopNavItem = ({ section, icon: Icon, label }: { section: SettingsSection, icon: any, label: string }) => {
    const isActive = activeSection === section;
    return (
        <button
            onClick={() => setActiveSection(section)}
            className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl transition-all relative overflow-hidden group ${
                isActive 
                ? 'bg-palette-mustard text-white shadow-lg shadow-palette-mustard/20' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
        >
            {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-white/30"></div>}
            <Icon size={18} className={isActive ? 'animate-pulse' : ''} />
            <span className="font-bold text-xs tracking-wide uppercase">{label}</span>
            {isActive && <ChevronRight size={16} className="ml-auto opacity-50" />}
        </button>
    );
  };

  const renderBusinessSettings = () => (
    <div className="space-y-8 animate-fade-in pb-8 lg:pb-0">
        <SectionHeader title={t('business_profile')} sub="Identitas rental yang akan tampil di struk dan aplikasi." />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
                <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5 flex flex-col items-center text-center">
                    <div className="relative group cursor-pointer w-32 h-32 lg:w-40 lg:h-40 mb-4" onClick={() => logoInputRef.current?.click()}>
                        <div className="w-full h-full rounded-full bg-[#0a0a12] border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden relative z-10">
                            {localSettings.businessLogo ? (
                                <img src={localSettings.businessLogo} alt="Business Logo" className="w-full h-full object-cover" />
                            ) : (
                                <ImageIcon className="text-slate-600" size={32} />
                            )}
                        </div>
                        <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20 backdrop-blur-sm">
                            <Camera className="text-white" size={24} />
                        </div>
                        <div className="absolute -inset-2 bg-palette-mustard/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-0"></div>
                    </div>
                    <button onClick={() => logoInputRef.current?.click()} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors mb-2">{t('upload_data')}</button>
                    <input type="file" ref={logoInputRef} onChange={handleLogoUpload} className="hidden" accept="image/*" />
                    <div className="w-full mt-4 border-t border-white/5 pt-4">
                        <InputGroup label="Atau URL Logo">
                            <StyledInput value={localSettings.businessLogo} onChange={(e) => handleSettingsChange('businessLogo', e.target.value)} placeholder="https://..." />
                        </InputGroup>
                    </div>
                </div>
            </div>
            <div className="lg:col-span-2 space-y-5">
                <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <InputGroup label={t('business_name')} icon={Building2}>
                            <StyledInput value={localSettings.businessName} onChange={(e) => handleSettingsChange('businessName', e.target.value)} />
                        </InputGroup>
                        <InputGroup label={t('phone_number')} icon={Phone}>
                            <StyledInput value={localSettings.businessPhone} onChange={(e) => handleSettingsChange('businessPhone', e.target.value)} />
                        </InputGroup>
                    </div>
                    <InputGroup label={t('full_address')} icon={MapPin}>
                        <StyledTextArea rows={3} value={localSettings.businessAddress} onChange={(e) => handleSettingsChange('businessAddress', e.target.value)} />
                    </InputGroup>
                </div>
            </div>
        </div>
    </div>
  );

  const renderGeneralSettings = () => (
    <div className="space-y-8 animate-fade-in pb-8 lg:pb-0">
         <SectionHeader title={t('rate_and_bonus')} sub="Konfigurasi harga dasar dan bonus ulang tahun." />
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Banknote size={80}/></div>
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="p-3 bg-palette-mustard/10 rounded-xl text-palette-mustard"><Banknote size={24}/></div>
                     <div>
                        <h4 className="font-bold text-white text-lg">{t('hourly_rate')}</h4>
                        <p className="text-xs text-slate-500">Base Price</p>
                     </div>
                 </div>
                 <div className="relative z-10">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-500">Rp</span>
                    <StyledInput type="number" inputMode="numeric" value={localSettings.hourlyRate} onChange={(e) => handleSettingsChange('hourlyRate', parseInt(e.target.value) || 0)} style={{ paddingLeft: '2.5rem', fontSize: '1.25rem', fontFamily: 'monospace' }} />
                 </div>
             </div>
             <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity"><Gift size={80}/></div>
                 <div className="flex items-center gap-3 mb-6 relative z-10">
                     <div className="p-3 bg-palette-green/10 rounded-xl text-palette-green"><Gift size={24}/></div>
                     <div>
                        <h4 className="font-bold text-white text-lg">{t('birthday_bonus')}</h4>
                        <p className="text-xs text-slate-500">Auto Reward</p>
                     </div>
                 </div>
                 <div className="flex items-center gap-3 relative z-10">
                     <div className="w-32">
                        <StyledInput type="number" inputMode="numeric" value={localSettings.birthdayBonusHours} onChange={(e) => handleSettingsChange('birthdayBonusHours', parseInt(e.target.value) || 0)} style={{ textAlign: 'center', fontSize: '1.25rem', fontFamily: 'monospace' }} />
                     </div>
                     <span className="font-bold text-sm text-slate-400 uppercase tracking-wider">{t('jam')}</span>
                 </div>
             </div>
         </div>
    </div>
  );

  const renderConnectivity = () => (
    <div className="space-y-8 animate-fade-in pb-8 lg:pb-0">
         <SectionHeader title={t('tv_connectivity')} sub="Integrasi Hardware IoT & Bluetooth." />
         <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
             <div className="absolute left-0 top-0 w-1 h-full bg-blue-500"></div>
             <div className="flex items-center gap-5">
                 <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center relative">
                     <CloudLightning size={32} />
                     <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
                 </div>
                 <div>
                     <h4 className="font-bold text-white text-lg">Smart Cloud Link</h4>
                     <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">{t('cloud_link_desc')}</p>
                 </div>
             </div>
             <div className="flex items-center gap-3 px-4 py-2 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/20">
                 <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_10px_#3b82f6]"></div>
                 <span className="text-xs font-bold tracking-wider">{t('online')}</span>
             </div>
         </div>
         <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                 <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isBtConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-white/5 text-slate-500'}`}>
                         {isBtConnected ? <BluetoothConnected size={24} /> : <BluetoothOff size={24} />}
                     </div>
                     <div>
                         <h4 className="font-bold text-white">{t('bluetooth_settings')}</h4>
                         <p className="text-xs text-slate-500 mt-0.5">{t('bt_desc')}</p>
                     </div>
                 </div>
                 <div className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${isBtConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-500'}`}>
                     {isBtConnected ? t('bluetooth_connected') : t('bluetooth_disconnected')}
                 </div>
             </div>
             {isBtConnected ? (
                 <button onClick={disconnectBt} className="w-full py-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-bold hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"><XCircle size={18} /> {t('disconnect_bt')}</button>
             ) : (
                 <button onClick={connectBt} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-600/20 hover:bg-blue-500 transition-all flex items-center justify-center gap-2"><Bluetooth size={18} /> {t('connect_bt')}</button>
             )}
         </div>
    </div>
  );

  const renderDataManagement = () => (
    <div className="space-y-8 animate-fade-in pb-8 lg:pb-0">
         <SectionHeader title={t('data_management')} sub="Optimasi penyimpanan dan backup lokal." />
         
         {/* Cloud Optimizer */}
         <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Database size={24}/></div>
                 <div>
                    <h4 className="font-bold text-white">{t('smart_cloud_opt')}</h4>
                    <p className="text-xs text-slate-500">{t('keep_data_duration')}</p>
                 </div>
             </div>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { val: 30, label: t('days_30_save') },
                    { val: 90, label: t('days_90') },
                    { val: 365, label: t('days_365') },
                    { val: 0, label: t('forever') }
                ].map(opt => (
                    <button
                        key={opt.val}
                        onClick={() => handleSettingsChange('cloudRetentionDays', opt.val)}
                        className={`p-4 rounded-xl border text-xs font-bold transition-all relative overflow-hidden ${
                            localSettings.cloudRetentionDays === opt.val
                            ? 'bg-amber-500/10 text-amber-500 border-amber-500/50'
                            : 'bg-black/20 border-white/5 text-slate-500 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                        {localSettings.cloudRetentionDays === opt.val && <div className="absolute inset-0 bg-amber-500/10 blur-xl"></div>}
                        <span className="relative z-10">{opt.label}</span>
                    </button>
                ))}
             </div>
         </div>

         {/* Backup & Restore Section - PREVIOUSLY MISSING */}
         <div className="bg-[#0f1016] p-6 rounded-3xl border border-white/5">
             <div className="flex items-center gap-3 mb-6">
                 <div className="p-3 bg-indigo-500/10 text-indigo-500 rounded-xl"><HardDrive size={24}/></div>
                 <div>
                    <h4 className="font-bold text-white">Local Backup</h4>
                    <p className="text-xs text-slate-500 whitespace-pre-wrap">{t('backup_restore_desc')}</p>
                 </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Backup Button */}
                 <button 
                    onClick={handleBackup}
                    className="flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-black/30 border border-white/5 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-all group"
                 >
                     <div className="p-3 bg-white/5 rounded-full group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                         <Download size={24} />
                     </div>
                     <span className="font-bold text-sm text-slate-300 group-hover:text-white">{t('download_data')} (.json)</span>
                 </button>

                 {/* Restore Button */}
                 <div className="relative">
                     <input 
                        type="file" 
                        ref={restoreInputRef} 
                        onChange={handleRestore} 
                        accept=".json" 
                        className="hidden" 
                     />
                     <button 
                        onClick={() => restoreInputRef.current?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-black/30 border border-white/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
                     >
                         <div className="p-3 bg-white/5 rounded-full group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                             <Upload size={24} />
                         </div>
                         <span className="font-bold text-sm text-slate-300 group-hover:text-white">{t('upload_data')}</span>
                     </button>
                 </div>
             </div>
         </div>
    </div>
  );

  const renderMembershipAndDev = () => (
    <div className="space-y-8 animate-fade-in pb-8 lg:pb-0">
        <SectionHeader title={t('membership_settings')} sub="Atur Tier, Syarat Rank, dan Bonus." />
        <div className="bg-gradient-to-r from-[#1e1b4b] to-[#312e81] p-6 rounded-3xl border border-indigo-500/30 flex flex-col sm:flex-row justify-between items-center shadow-lg relative overflow-hidden group gap-4">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
            <div className="absolute -left-10 top-0 w-32 h-full bg-indigo-500/20 blur-[50px] group-hover:translate-x-[500px] transition-transform duration-1000"></div>
            <div className="relative z-10 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/20 rounded-2xl text-indigo-400 border border-indigo-500/30"><Trophy size={28} /></div>
                <div>
                    <h3 className="text-lg font-bold text-white tracking-wide">Season Reset</h3>
                    <p className="text-xs text-indigo-200 mt-1 max-w-sm">Reset ranking tahunan.</p>
                </div>
            </div>
            <button onClick={handleResetSeason} className="relative z-10 px-6 py-3 bg-red-500/20 hover:bg-red-500 text-red-300 hover:text-white border border-red-500/50 hover:border-red-500 font-bold rounded-xl text-xs transition-all uppercase tracking-wider flex items-center gap-2 group/btn">
                <RefreshCw size={14} className="group-hover/btn:rotate-180 transition-transform duration-500"/>
                Reset Now
            </button>
        </div>

        {/* Membership Config Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {localMemberships.map(m => {
            const theme = getTierTheme(m.id);
            return (
            <div key={m.id} className="relative group rounded-3xl bg-[#0f1016] border border-white/5 hover:border-white/10 overflow-hidden transition-all duration-300 hover:shadow-lg">
                <div className={`relative p-4 flex justify-between items-center bg-gradient-to-r ${theme.conic} bg-opacity-20 border-b border-white/5`}>
                    <div className="absolute inset-0 bg-black/60"></div>
                    <div className="relative z-10 flex items-center gap-3">
                        <div className={`p-2 rounded-xl bg-white/10 text-white shadow-inner ${theme.text}`}>
                            <img src={theme.iconUrl} alt={m.name} className="w-8 h-8 object-contain" />
                        </div>
                        <div>
                            <h4 className={`font-black text-sm uppercase tracking-wider ${theme.text}`}>{m.name}</h4>
                            <p className="text-[10px] font-bold text-slate-500">{m.id.replace('MYTHICAL_', 'M.')}</p>
                        </div>
                    </div>
                    <div className="relative z-10">
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" checked={m.isActive} onChange={(e) => handleMembershipChange(m.id, 'isActive', e.target.checked)} className="sr-only peer" />
                            <div className="w-9 h-5 bg-black/50 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </div>
                <div className="p-5 space-y-4 relative z-10">
                    <div className="flex items-center justify-between p-3 bg-black/30 rounded-xl border border-white/10">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1"><Trophy size={12}/> Syarat Rank</span>
                        <div className="flex items-center gap-2 group/input">
                            <input 
                                type="number" 
                                min="0" 
                                value={m.minHours} 
                                onFocus={(e) => e.target.select()}
                                onChange={e => handleMembershipChange(m.id, 'minHours', e.target.value)} 
                                className="w-16 text-center bg-transparent border-b border-slate-600 group-hover/input:border-white text-white font-mono font-bold focus:outline-none text-sm focus:border-palette-mustard transition-colors" 
                            />
                            <span className="text-[10px] font-bold text-slate-500">JAM</span>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-slate-500 pl-1">{t('bonus_target')}</label>
                            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/10 hover:border-white/20 transition-colors group/input">
                                <Zap size={14} className="text-yellow-500"/>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={m.bonusThreshold} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => handleMembershipChange(m.id, 'bonusThreshold', e.target.value)} 
                                    className="w-full bg-transparent text-sm font-bold text-white focus:outline-none text-center" 
                                />
                                <span className="text-[9px] font-bold text-slate-500">H</span>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold uppercase text-slate-500 pl-1">{t('reward')}</label>
                            <div className="flex items-center gap-2 bg-black/30 p-2 rounded-xl border border-white/10 hover:border-white/20 transition-colors group/input">
                                <Gift size={14} className="text-emerald-500"/>
                                <input 
                                    type="number" 
                                    min="1" 
                                    value={m.bonusReward} 
                                    onFocus={(e) => e.target.select()}
                                    onChange={e => handleMembershipChange(m.id, 'bonusReward', e.target.value)} 
                                    className="w-full bg-transparent text-sm font-bold text-white focus:outline-none text-center" 
                                />
                                <span className="text-[9px] font-bold text-slate-500">H</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            )})}
        </div>
    </div>
  );

  const getSectionTitle = () => {
      switch(activeSection) {
          case 'BUSINESS': return t('business_profile');
          case 'GENERAL': return t('general_settings');
          case 'CONNECTIVITY': return t('tv_connectivity');
          case 'DATA': return t('data_management');
          case 'MEMBERSHIP': return t('membership_settings');
          default: return 'Settings';
      }
  };

  return (
    <div className="max-w-[1600px] mx-auto h-full lg:h-[calc(100vh-140px)] flex flex-col lg:flex-row gap-8 lg:pb-4 relative">
      <div className={`lg:hidden w-full ${isMobileMenuOpen ? 'block' : 'hidden'} animate-fade-in pb-24`}>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{t('system_settings')}</h2>
            <p className="text-xs text-slate-500 mt-1">{t('config_subtitle')}</p>
          </div>
          <div className="space-y-1">
              <MobileMenuItem section="BUSINESS" icon={Building2} label={t('business_profile')} desc="Identitas & Logo" />
              <MobileMenuItem section="GENERAL" icon={Coins} label={t('general_settings')} desc="Harga & Bonus" />
              <MobileMenuItem section="CONNECTIVITY" icon={Wifi} label={t('tv_connectivity')} desc="Bluetooth & IoT" />
              <MobileMenuItem section="DATA" icon={Database} label={t('data_management')} desc="Backup & Cloud" />
              <MobileMenuItem section="MEMBERSHIP" icon={Crown} label={t('membership_settings')} desc="Rank & Rewards" />
          </div>
      </div>
      <nav className="hidden lg:flex w-72 flex-shrink-0 flex-col gap-6">
          <div className="pl-2">
            <h2 className="text-3xl font-black text-white tracking-tight">{t('system_settings')}</h2>
            <p className="text-xs text-slate-400 font-medium mt-1">{t('config_subtitle')}</p>
          </div>
          <div className="bg-[#0f1016]/80 backdrop-blur-xl rounded-3xl p-3 shadow-2xl border border-white/5 space-y-1">
              {renderDesktopNavItem({ section: "BUSINESS", icon: Building2, label: t('business_profile') })}
              {renderDesktopNavItem({ section: "GENERAL", icon: Coins, label: t('general_settings') })}
              {renderDesktopNavItem({ section: "CONNECTIVITY", icon: Wifi, label: t('tv_connectivity') })}
              {renderDesktopNavItem({ section: "DATA", icon: Database, label: t('data_management') })}
              {renderDesktopNavItem({ section: "MEMBERSHIP", icon: Crown, label: t('membership_settings') })}
          </div>
          <div className="mt-auto">
            <button onClick={handleSave} disabled={isSaving} className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 transition-all uppercase tracking-wider ${isSaving ? 'bg-emerald-600 scale-95' : 'bg-palette-mustard hover:bg-palette-mustard/90 hover:-translate-y-1 shadow-palette-mustard/25'}`}>
                {isSaving ? <Loader2 size={18} className="animate-spin"/> : <><Save size={18} /> {t('save_changes')}</>}
            </button>
          </div>
      </nav>
      <main className={`flex-1 min-w-0 ${!isMobileMenuOpen ? 'fixed inset-0 z-[60] bg-slate-50 dark:bg-[#030712] overflow-y-auto px-4 pb-32 pt-4' : 'hidden lg:block lg:overflow-y-auto lg:pr-2 custom-scrollbar'}`}>
          <div className="lg:hidden flex items-center gap-4 mb-6 sticky top-0 bg-slate-50/95 dark:bg-[#030712]/95 backdrop-blur-sm z-30 py-2 border-b border-slate-200 dark:border-white/5 -mx-4 px-4">
              <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 rounded-xl bg-white dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20 transition-colors shadow-sm border border-slate-200 dark:border-white/5"><ArrowLeft size={20} /></button>
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-wide truncate">{getSectionTitle()}</h3>
          </div>
          <div className="max-w-4xl">
            {activeSection === 'BUSINESS' && renderBusinessSettings()}
            {activeSection === 'GENERAL' && renderGeneralSettings()}
            {activeSection === 'CONNECTIVITY' && renderConnectivity()}
            {activeSection === 'DATA' && renderDataManagement()}
            {activeSection === 'MEMBERSHIP' && renderMembershipAndDev()}
          </div>
      </main>
      {!isMobileMenuOpen && (
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-[#0f1016] border-t border-slate-200 dark:border-white/10 lg:hidden z-[61] pb-safe">
            <button onClick={handleSave} disabled={isSaving} className="w-full h-12 rounded-xl bg-palette-mustard text-white shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 font-bold uppercase tracking-wider">
                {isSaving ? <Loader2 size={20} className="animate-spin"/> : <><Save size={20} /> {t('save_changes')}</>}
            </button>
          </div>
      )}
    </div>
  );
};

export default Settings;
