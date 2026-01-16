import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, Crown, Star, Shield, Coins } from 'lucide-react';
import { MembershipConfig } from '../types';

const Settings: React.FC = () => {
  const { settings, membershipConfigs, updateSettings, updateMembershipConfig } = useData();
  const { t } = useLanguage();
  
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
      case 'VIP': return <Crown size={24} className="text-amber-500" />;
      case 'PLUS': return <Star size={24} className="text-violet-500" />;
      default: return <Shield size={24} className="text-slate-500" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* 1. Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('system_settings')}</h2>
        <p className="text-slate-500">{t('config_subtitle')}</p>
      </div>
      
      {/* 2. General Settings */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
           <Coins size={20} className="text-brand-500"/> {t('general_settings')}
        </h3>
        <div className="space-y-3 max-w-sm">
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

      {/* 3. Membership Settings */}
      <div className="grid grid-cols-1 gap-6">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2 mt-4">
           {t('membership_settings')}
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {localMemberships.map(m => (
            <div key={m.id} className={`bg-white dark:bg-slate-900 rounded-3xl border shadow-sm overflow-hidden flex flex-col ${m.id === 'VIP' ? 'border-amber-200 dark:border-amber-900/30 ring-1 ring-amber-100 dark:ring-amber-900/20' : 'border-slate-200 dark:border-slate-800'}`}>
                {/* Card Header */}
                <div className={`p-4 border-b flex justify-between items-center ${
                   m.id === 'VIP' ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-900/30' : 
                   m.id === 'PLUS' ? 'bg-violet-50/50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/30' : 
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

      <div className="flex justify-end pt-4 pb-12">
          <button 
            onClick={handleSave}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-bold transition-all shadow-lg ${
              saved 
              ? 'bg-green-600 text-white shadow-green-500/20' 
              : 'bg-brand-600 hover:bg-brand-700 text-white shadow-brand-500/20 hover:-translate-y-1'
            }`}
          >
            {saved ? t('saved') : <><Save size={18} /> {t('save_changes')}</>}
          </button>
      </div>
    </div>
  );
};

export default Settings;