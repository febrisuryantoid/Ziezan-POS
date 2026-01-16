import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';
import { Save, Crown, Star, Shield, Coins, Bluetooth, BluetoothConnected, BluetoothOff, Globe, Mail, Phone, Code } from 'lucide-react';
import { MembershipConfig } from '../types';

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig } = useData();
  const { t } = useLanguage();
  const { isConnected, connect, disconnect } = useBluetooth();
  
  const [localSettings, setLocalSettings] = useState(settings);
  const [localMemberships, setLocalMemberships] = useState(membershipConfigs);
  const [saved, setSaved] = useState(false);

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
             return { ...m, [field]: cleanValue === '' ? 0 : parseInt(cleanValue, 10) };
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

  const getIcon = (id: string) => {
    switch(id) {
      case 'VIP': return <Crown size={24} className="text-brand-500" />;
      case 'PLUS': return <Star size={24} className="text-brand-400" />;
      default: return <Shield size={24} className="text-slate-400" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6">
      {/* 1. Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('system_settings')}</h2>
        <p className="text-slate-500">{t('config_subtitle')}</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: General, Bluetooth, Dev Info */}
        <div className="space-y-6">
          
          {/* A. General Settings */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <Coins size={20} className="text-brand-500"/> {t('general_settings')}
            </h3>
            <div className="space-y-3">
               <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">{t('hourly_rate')} (Rp)</label>
               <div className="relative group">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium group-focus-within:text-brand-500 transition-colors">Rp</span>
                 <input 
                  type="text" 
                  value={localSettings.hourlyRate === 0 && localSettings.hourlyRate.toString() !== '0' ? '' : formatNumber(localSettings.hourlyRate)}
                  onChange={e => handleNumericChange(e.target.value, 'hourlyRate')}
                  className="w-full bg-slate-50 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl pl-12 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 font-mono text-lg transition-all"
                 />
               </div>
               <p className="text-xs text-slate-500">{t('rate_desc')}</p>
             </div>
          </div>

          {/* B. Bluetooth Settings */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <Bluetooth size={20} className="text-blue-500"/> {t('bluetooth_settings')}
             </h3>
             <div className={`p-4 rounded-2xl mb-4 border ${isConnected ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center gap-3">
                   <div className={`p-2 rounded-full ${isConnected ? 'bg-blue-500 text-white' : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-300'}`}>
                      {isConnected ? <BluetoothConnected size={20} /> : <BluetoothOff size={20} />}
                   </div>
                   <div>
                      <p className={`font-bold ${isConnected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                         {isConnected ? t('bt_connected') : t('bt_disconnected')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Device Status</p>
                   </div>
                </div>
             </div>
             
             <p className="text-xs text-slate-500 mb-4 leading-relaxed">{t('bt_desc')}</p>
             
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
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-colors shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
                >
                  <Bluetooth size={16} /> {t('connect_bt')}
                </button>
             )}
          </div>

          {/* C. Developer Info */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
             {/* Decorative Background */}
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Code size={100} />
             </div>
             
             <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
               <Code size={20} className="text-purple-500"/> {t('developer_info')}
             </h3>
             
             <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-brand-500 to-brand-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-brand-500/30">
                   FS
                </div>
                <div>
                   <p className="text-xs text-slate-500 uppercase font-bold">{t('developed_by')}</p>
                   <h4 className="text-lg font-bold text-slate-900 dark:text-white">Febri Suryanto</h4>
                   <p className="text-xs text-slate-400">Fullstack Developer</p>
                </div>
             </div>

             <div className="space-y-3">
                <a href="https://febrisuryanto.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 group/item transition-colors">
                   <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 group-hover/item:text-brand-500 transition-colors shadow-sm">
                      <Globe size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-300">febrisuryanto.com</span>
                </a>
                
                <a href="mailto:hello@febrisuryanto.com" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-brand-50 dark:hover:bg-brand-900/20 group/item transition-colors">
                   <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 group-hover/item:text-brand-500 transition-colors shadow-sm">
                      <Mail size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-300">hello@febrisuryanto.com</span>
                </a>

                <a href="https://wa.me/6282312907731" target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-green-50 dark:hover:bg-green-900/20 group/item transition-colors">
                   <div className="p-2 bg-white dark:bg-slate-700 rounded-lg text-slate-500 group-hover/item:text-green-500 transition-colors shadow-sm">
                      <Phone size={16} />
                   </div>
                   <span className="text-sm font-medium text-slate-600 dark:text-slate-300">+62 823-1290-7731</span>
                </a>
             </div>
          </div>

        </div>

        {/* Right Column: Membership Settings */}
        <div className="lg:col-span-2">
           <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-4 pl-1">
             {t('membership_settings')}
           </h3>
           <div className="space-y-6">
             {localMemberships.map(m => (
              <div key={m.id} className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden flex flex-col ${m.id === 'VIP' ? 'border-brand-200 dark:border-brand-900/30 ring-1 ring-brand-100 dark:ring-brand-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
                  {/* Card Header */}
                  <div className={`p-4 border-b flex justify-between items-center ${
                     m.id === 'VIP' ? 'bg-brand-50/50 dark:bg-brand-900/10 border-brand-100 dark:border-brand-900/30' : 
                     m.id === 'PLUS' ? 'bg-brand-50/20 dark:bg-brand-900/5 border-brand-100 dark:border-brand-900/20' : 
                     'bg-slate-50/50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-800'
                  }`}>
                     <div className="flex items-center gap-3">
                        {getIcon(m.id)}
                        <h4 className="font-bold text-slate-900 dark:text-white">{m.name}</h4>
                     </div>
                     <div className="relative inline-block w-10 h-5 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" checked={m.isActive} onChange={(e) => handleMembershipChange(m.id, 'isActive', e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-5" />
                        <label className={`toggle-label block overflow-hidden h-5 rounded-full cursor-pointer ${m.isActive ? 'bg-green-500' : 'bg-slate-300'}`}></label>
                     </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-6 space-y-5 flex-1">
                     {/* Price Config */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('price_plan')}</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">Rp</span>
                          <input 
                             type="text" 
                             value={formatNumber(m.price)} 
                             onChange={e => handleMembershipChange(m.id, 'price', e.target.value)}
                             className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg pl-8 pr-3 py-2 text-sm font-mono"
                          />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                             <input 
                                type="text" 
                                value={m.durationDays} 
                                onChange={e => handleMembershipChange(m.id, 'durationDays', e.target.value)}
                                className="w-16 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-xs text-center"
                             />
                             <span className="text-xs text-slate-400">Hari (0 = Lifetime)</span>
                        </div>
                     </div>

                     {/* Bonus Config */}
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">{t('bonus_target')}</label>
                          <div className="flex items-center gap-2">
                             <input 
                                type="text" 
                                value={m.bonusThreshold} 
                                onChange={e => handleMembershipChange(m.id, 'bonusThreshold', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-center font-bold"
                             />
                             <span className="text-xs text-slate-400">Jam</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">{t('reward')}</label>
                          <div className="flex items-center gap-2">
                             <input 
                                type="text" 
                                value={m.bonusReward} 
                                onChange={e => handleMembershipChange(m.id, 'bonusReward', e.target.value)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-center font-bold"
                             />
                             <span className="text-xs text-slate-400">Jam</span>
                          </div>
                        </div>
                     </div>
                     
                     <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs text-slate-500">
                        Rule: Main <strong>{m.bonusThreshold} Jam</strong> dapat bonus <strong>{m.bonusReward} Jam</strong>.
                     </div>
                  </div>
              </div>
            ))}
           </div>
        </div>
      </div>

      <div className="flex justify-end pt-4 pb-12 sticky bottom-0 bg-gradient-to-t from-slate-50 via-slate-50 to-transparent dark:from-slate-950 dark:via-slate-950 p-6 -mx-6 md:-mx-8">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
              saved 
              ? 'bg-green-600 text-white shadow-green-500/20' 
              : 'bg-brand-400 hover:bg-brand-500 text-slate-900 shadow-brand-500/20 hover:-translate-y-1'
            }`}
          >
            {saved ? t('saved') : <><Save size={18} /> {t('save_changes')}</>}
          </button>
      </div>
    </div>
  );
};

export default Settings;