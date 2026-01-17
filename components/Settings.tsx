import React, { useState, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import { Save, Crown, Star, Shield, Coins, Bluetooth, BluetoothConnected, BluetoothOff, Globe, Mail, Phone, Code, Database, Upload, Download, CloudLightning, FileJson, AlertTriangle, Wifi, Gift } from 'lucide-react';
import { MembershipConfig } from '../types';
import * as Storage from '../services/storage';

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig, refreshData } = useData();
  const { t } = useLanguage();
  const { isConnected, connect, disconnect } = useBluetooth();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [localMemberships, setLocalMemberships] = useState(membershipConfigs);
  const [saved, setSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper for Numeric Input
  const formatNumber = (num: number) => num.toLocaleString('id-ID');
  
  const handleNumericChange = (value: string, field: keyof typeof localSettings) => {
    const cleanValue = value.replace(/\D/g, '');
    const intValue = cleanValue === '' ? 0 : parseInt(cleanValue, 10);
    setLocalSettings(prev => ({ ...prev, [field]: intValue }));
  };

  const handleMembershipChange = (id: string, field: keyof MembershipConfig, value: any) => {
     setLocalMemberships(prev => prev.map(m => {
       if (m.id === id) {
          if (field === 'price' || field === 'bonusThreshold' || field === 'bonusReward' || field === 'durationDays') {
             const cleanValue = value.toString().replace(/\D/g, '');
             return { ...m, [field]: cleanValue === '' ? 0 : parseInt(cleanValue, 10); };
          }
          return { ...m, [field]: value };
       }
       return m;
     }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    localMemberships.forEach(m => updateMembershipConfig(m));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  // --- MANUAL BACKUP LOGIC ---
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
  };

  // --- MANUAL RESTORE LOGIC ---
  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Basic Validation
        if (!json.consoles || !json.members) {
           throw new Error(t('invalid_file'));
        }

        if (confirm(t('restore_confirm', { date: json.timestamp || 'Unknown' }))) {
            
            // Execute Restore
            Storage.saveConsoles(json.consoles);
            Storage.saveMembers(json.members);
            Storage.saveTransactions(json.transactions || []);
            if (json.settings) Storage.saveSettings(json.settings);
            if (json.memberships) Storage.saveMemberships(json.memberships);
            
            refreshData();
            alert(t('restore_success'));
            window.location.reload(); // Refresh to ensure clean state
        }
      } catch (err: any) {
        alert(t('restore_error', { msg: err.message }));
      }
    };
    reader.readAsText(file);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // PREMIUM CARD STYLING LOGIC
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

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* 1. Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-palette-navy dark:text-white">{t('system_settings')}</h2>
        <p className="text-palette-brown/70 dark:text-palette-cream/60">{t('config_subtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: General, Bluetooth, Data, Dev Info */}
        <div className="space-y-6">
          
          {/* A. General Settings */}
          <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
            <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4 flex items-center gap-2">
               <Coins size={20} className="text-palette-mustard"/> {t('general_settings')}
            </h3>
            
            {/* Hourly Rate */}
            <div className="space-y-3 mb-5">
               <label className="block text-sm font-semibold text-palette-brown dark:text-white">{t('hourly_rate')} (Rp)</label>
               <div className="relative group">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-palette-mustard transition-colors">Rp</span>
                 <input 
                  type="text" 
                  value={localSettings.hourlyRate === 0 && localSettings.hourlyRate.toString() !== '0' ? '' : formatNumber(localSettings.hourlyRate)}
                  onChange={e => handleNumericChange(e.target.value, 'hourlyRate')}
                  className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-12 pr-4 py-3 text-palette-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard font-mono text-lg transition-all"
                 />
               </div>
               <p className="text-xs text-slate-500">{t('rate_desc')}</p>
             </div>

             {/* Birthday Bonus */}
             <div className="space-y-3 border-t border-slate-100 dark:border-white/5 pt-4">
                <div className="flex items-center gap-2 text-palette-brown dark:text-white">
                   <Gift size={16} className="text-palette-red"/>
                   <span className="text-sm font-semibold">{t('birthday_bonus')}</span>
                </div>
                <div className="flex items-center gap-3">
                   <input 
                      type="text" 
                      value={localSettings.birthdayBonusHours || 0}
                      onChange={e => handleNumericChange(e.target.value, 'birthdayBonusHours')}
                      className="w-20 bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-2.5 text-center font-bold text-lg text-palette-navy dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard"
                   />
                   <span className="text-sm font-bold text-slate-500">{t('jam')}</span>
                </div>
                <p className="text-xs text-slate-500">{t('birthday_bonus_desc')}</p>
             </div>
          </div>

          {/* B. Connectivity Settings (Bluetooth & Wi-Fi) */}
          <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
             <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4 flex items-center gap-2">
               <Wifi size={20} className="text-blue-500"/> {t('tv_connectivity')}
             </h3>
             
             {/* Wi-Fi / Cloud Status */}
             <div className="mb-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30">
                <div className="flex items-center gap-3">
                   <div className="p-2 rounded-full bg-blue-500 text-white animate-pulse">
                      <CloudLightning size={20} />
                   </div>
                   <div>
                      <p className="font-bold text-blue-700 dark:text-blue-400">
                         Ziezan Cloud Link (Wi-Fi)
                      </p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{t('cloud_link_desc')}</p>
                   </div>
                </div>
             </div>

             {/* Bluetooth Controls */}
             <div className={`p-4 rounded-2xl mb-4 border ${isConnected ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-900/30' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${isConnected ? 'bg-emerald-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                      {isConnected ? <BluetoothConnected size={20} /> : <BluetoothOff size={20} />}
                   </div>
                   <div>
                      <p className={`font-bold ${isConnected ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`}>
                         {isConnected ? t('bluetooth_connected') : t('bluetooth_disconnected')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">{t('device_status')}</p>
                   </div>
                </div>
             </div>
             
             {isConnected ? (
                <button 
                  onClick={disconnect}
                  className="w-full py-2.5 rounded-xl border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <BluetoothOff size={16} /> {t('disconnect_bt')}
                </button>
             ) : (
                <button 
                  onClick={connect}
                  className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-sm transition-colors shadow-lg shadow-slate-500/20 flex items-center justify-center gap-2"
                >
                  <Bluetooth size={16} /> {t('connect_bt')}
                </button>
             )}
          </div>

          {/* C. Data Management - MANUAL BACKUP */}
          <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm">
             <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4 flex items-center gap-2">
               <Database size={20} className="text-emerald-500"/> {t('data_management')}
             </h3>
             
             <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/10 mb-4">
                <div className="flex items-center gap-2 mb-2">
                   <CloudLightning size={16} className="text-palette-mustard"/>
                   <span className="text-sm font-bold text-slate-900 dark:text-white">{t('smart_cloud_opt')}</span>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase">{t('keep_data_duration')}</label>
                  <select 
                     value={localSettings.cloudRetentionDays || 90}
                     onChange={(e) => handleNumericChange(e.target.value, 'cloudRetentionDays')}
                     className="w-full bg-white dark:bg-palette-navy border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-lg px-3 py-2 focus:ring-2 focus:ring-palette-mustard focus:outline-none"
                  >
                     <option value={30}>{t('days_30_save')}</option>
                     <option value={90}>{t('days_90')}</option>
                     <option value={365}>{t('days_365')}</option>
                     <option value={0}>{t('forever')}</option>
                  </select>
                </div>
             </div>

             <div className="space-y-4">
                <p className="text-xs text-slate-500 leading-relaxed whitespace-pre-line">
                   {t('backup_restore_desc')}
                </p>

                <div className="grid grid-cols-2 gap-3">
                    {/* DOWNLOAD / BACKUP BUTTON */}
                    <button 
                       onClick={handleBackup}
                       className="group relative flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all hover:-translate-y-1 overflow-hidden"
                    >
                       <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                       <Download size={24} className="mb-1" />
                       <div className="text-center">
                          <span className="block text-xs font-bold uppercase tracking-wider opacity-80">{t('backup_btn')}</span>
                          <span className="block text-sm font-bold">{t('download_data')}</span>
                       </div>
                    </button>

                    {/* UPLOAD / RESTORE BUTTON */}
                    <button 
                       onClick={() => fileInputRef.current?.click()}
                       className="group relative flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-palette-mustard dark:hover:border-palette-mustard hover:bg-slate-50 dark:hover:bg-slate-700 transition-all"
                    >
                       <Upload size={24} className="mb-1 text-slate-400 group-hover:text-palette-mustard transition-colors" />
                       <div className="text-center">
                          <span className="block text-xs font-bold uppercase tracking-wider opacity-60">{t('restore_btn')}</span>
                          <span className="block text-sm font-bold">{t('upload_data')}</span>
                       </div>
                    </button>
                </div>
                <input 
                   type="file" 
                   ref={fileInputRef} 
                   onChange={handleRestore} 
                   accept=".json" 
                   className="hidden"
                />
             </div>
          </div>

          {/* D. Developer Info */}
          <div className="bg-white dark:bg-palette-navyLight p-6 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Code size={100} />
             </div>
             
             <h3 className="text-lg font-bold text-palette-navy dark:text-white mb-4 flex items-center gap-2">
               <Code size={20} className="text-palette-purple"/> {t('developer_info')}
             </h3>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-palette-mustard to-palette-copper flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-palette-mustard/30">
                   FS
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase font-bold">{t('developed_by')}</p>
                   <h4 className="text-lg font-bold text-palette-navy dark:text-white">Febri Suryanto</h4>
                   <p className="text-xs text-slate-400">Fullstack Developer</p>
                </div>
             </div>

             <div className="space-y-3">
                <a href="https://febrisuryanto.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-palette-cream dark:hover:bg-white/10 group/item transition-colors">
                   <div className="p-2 bg-white dark:bg-palette-navy rounded-lg text-slate-500 group-hover/item:text-palette-mustard transition-colors shadow-sm">
                      <Globe size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-300">febrisuryanto.com</span>
                </a>
                
                <a href="mailto:hello@febrisuryanto.com" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-palette-cream dark:hover:bg-white/10 group/item transition-colors">
                   <div className="p-2 bg-white dark:bg-palette-navy rounded-lg text-slate-500 group-hover/item:text-palette-mustard transition-colors shadow-sm">
                      <Mail size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-300">hello@febrisuryanto.com</span>
                </a>

                <a href="https://wa.me/6282312907731" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-green-50 dark:hover:bg-green-900/20 group/item transition-colors">
                   <div className="p-2 bg-white dark:bg-palette-navy rounded-lg text-slate-500 group-hover/item:text-green-500 transition-colors shadow-sm">
                      <Phone size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-300">+62 823-1290-7731</span>
                </a>
             </div>
          </div>

        </div>

        {/* Right Column: Membership Settings */}
        <div className="lg:col-span-2">
           <h3 className="text-lg font-bold text-palette-navy dark:text-white flex items-center gap-2 mb-4 pl-1">
             {t('membership_settings')}
           </h3>
           <div className="space-y-6">
             {localMemberships.map(m => {
               const style = getTierStyle(m.id);
               return (
                <div key={m.id} className={`rounded-3xl border shadow-lg overflow-hidden flex flex-col relative ${style.card}`}>
                    {/* PREMIUM SHINE EFFECT */}
                    <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer pointer-events-none z-0 ${style.shineOpacity}`} style={{ width: '200%' }}></div>

                    {/* Card Header - z-10 for layering over shine */}
                    <div className="relative z-10 p-5 border-b border-black/5 dark:border-white/5 flex justify-between items-center backdrop-blur-sm">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl backdrop-blur-md ${style.inputBg}`}>
                            {getIcon(m.id, style.iconColor)}
                          </div>
                          <div>
                            <h4 className={`font-bold text-lg ${style.text}`}>{m.name}</h4>
                            <p className={`text-xs font-medium ${style.subText}`}>{m.id} TIER CONFIGURATION</p>
                          </div>
                       </div>
                       <div className="relative inline-block w-12 h-6 align-middle select-none transition duration-200 ease-in">
                          <input type="checkbox" checked={m.isActive} onChange={(e) => handleMembershipChange(m.id, 'isActive', e.target.checked)} className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-2 border-slate-200 appearance-none cursor-pointer checked:right-0 right-6 shadow-sm z-20" />
                          <label className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer transition-colors z-10 ${m.isActive ? 'bg-palette-green' : style.toggleBg}`}></label>
                       </div>
                    </div>

                    {/* Card Body */}
                    <div className="relative z-10 p-6 space-y-5 flex-1">
                       {/* Price Config */}
                       <div className="space-y-2">
                          <label className={`text-xs font-bold uppercase tracking-wider ${style.subText}`}>{t('price_plan')}</label>
                          <div className="relative">
                            <span className={`absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold ${style.subText}`}>Rp</span>
                            <input 
                               type="text" 
                               value={formatNumber(m.price)} 
                               onChange={e => handleMembershipChange(m.id, 'price', e.target.value)}
                               className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 transition-all backdrop-blur-sm ${style.inputBg}`}
                            />
                          </div>
                          <div className="flex items-center gap-3 mt-1.5">
                               <div className="relative flex-shrink-0">
                                 <input 
                                    type="text" 
                                    value={m.durationDays} 
                                    onChange={e => handleMembershipChange(m.id, 'durationDays', e.target.value)}
                                    className={`w-20 rounded-lg px-3 py-1.5 text-xs text-center font-bold focus:outline-none focus:ring-2 transition-all ${style.inputBg}`}
                                 />
                               </div>
                               <span className={`text-xs font-medium ${style.subText}`}>{t('days_lifetime')}</span>
                          </div>
                       </div>

                       {/* Bonus Config */}
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className={`text-xs font-bold uppercase tracking-wider ${style.subText}`}>{t('bonus_target')}</label>
                            <div className="flex items-center gap-2">
                               <input 
                                  type="text" 
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
                                  type="text" 
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
      </div>

      <div className="mt-8 flex justify-end pt-4 border-t border-slate-200 dark:border-white/5">
          {/* PRIMARY ACTION BUTTON - Consistently Mustard Background + White Text */}
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
              saved 
              ? 'bg-palette-green text-white shadow-green-500/20' 
              : 'bg-palette-mustard hover:bg-palette-mustard/90 text-white shadow-palette-mustard/20 hover:-translate-y-1'
            }`}
          >
            {saved ? t('saved') : <><Save size={18} /> {t('save_changes')}</>}
          </button>
      </div>
    </div>
  );
};

export default Settings;