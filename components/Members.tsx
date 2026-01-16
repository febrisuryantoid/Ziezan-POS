import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { MemberStatus, Member, MembershipTierId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Search, UserPlus, Trash2, User, Gift, MapPin, Clock, Edit2, X, Save, Users, Crown, Star, Shield, TrendingDown, ArrowUpCircle } from 'lucide-react';

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'PLAYTIME_DESC' | 'JOIN_DATE_ASC';

const Members: React.FC = () => {
  const { members, membershipConfigs, addMember, deleteMember, updateMember, upgradeMember } = useData();
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  
  // States
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [upgradingMember, setUpgradingMember] = useState<Member | null>(null);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<MembershipTierId>('PLUS');
  
  // Form State
  const initialForm = { 
    name: '', 
    phone: '', 
    address: 'Nyomplong', 
    status: MemberStatus.ACTIVE, 
    membershipId: 'BASIC' as MembershipTierId,
    notes: '',
    joinDate: new Date().toISOString().split('T')[0] 
  };
  const [formData, setFormData] = useState(initialForm);

  // Sorting Logic
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (m.phone && m.phone.includes(searchTerm))
  ).sort((a, b) => {
    switch (sortOption) {
      case 'NAME_ASC': return a.name.localeCompare(b.name);
      case 'NAME_DESC': return b.name.localeCompare(a.name);
      case 'PLAYTIME_DESC': return b.totalPlayTime - a.totalPlayTime;
      case 'JOIN_DATE_ASC': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      default: return 0;
    }
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if(formData.name) {
      addMember({
        name: formData.name,
        phone: formData.phone,
        address: formData.address || 'Nyomplong',
        joinDate: new Date(formData.joinDate).toISOString(),
        status: MemberStatus.ACTIVE,
        membershipId: formData.membershipId,
        notes: formData.notes
      });
      setFormData(initialForm);
      setIsAdding(false);
    }
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingMember && editingMember.name) {
      updateMember(editingMember);
      setEditingMember(null);
    }
  };

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if(upgradingMember) {
      upgradeMember(upgradingMember.id, selectedUpgradeTier);
      setUpgradingMember(null);
    }
  };

  const openEdit = (m: Member) => {
    setEditingMember(m);
  }

  const getMembershipConfig = (id: string) => membershipConfigs.find(c => c.id === id) || membershipConfigs[0];

  const getMembershipIcon = (id: string) => {
      switch(id) {
          case 'VIP': return <Crown size={14} className="fill-current"/>;
          case 'PLUS': return <Star size={14} className="fill-current"/>;
          default: return <Shield size={14} className="fill-current"/>;
      }
  }

  const getCardStyle = (id: string) => {
    switch(id) {
      case 'VIP':
        // GOLD GRADIENT
        return {
          card: 'bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-500 border-yellow-400',
          text: 'text-amber-950',
          subText: 'text-amber-900/70',
          statsBg: 'bg-white/40 border-white/20',
          barBg: 'bg-black/10',
          barFill: 'bg-amber-800',
          iconColor: 'text-amber-900',
          shineOpacity: 'opacity-30'
        };
      case 'PLUS':
        // PURPLE GRADIENT (Ungu)
        return {
          card: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 border-purple-500',
          text: 'text-white',
          subText: 'text-white/70',
          statsBg: 'bg-white/10 border-white/10',
          barBg: 'bg-black/20',
          barFill: 'bg-white',
          iconColor: 'text-white',
          shineOpacity: 'opacity-20'
        };
      default: // BASIC
        // SILVER GRADIENT
        return {
          card: 'bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 border-slate-300 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 dark:border-slate-600',
          text: 'text-slate-800 dark:text-white',
          subText: 'text-slate-500 dark:text-slate-400',
          statsBg: 'bg-white/60 dark:bg-black/20 border-white/40 dark:border-white/5',
          barBg: 'bg-slate-300 dark:bg-white/10',
          barFill: 'bg-slate-600 dark:bg-slate-300',
          iconColor: 'text-slate-700 dark:text-slate-200',
          shineOpacity: 'opacity-40'
        };
    }
  };

  // Calculate Effective Rate
  const getEffectiveRate = (m: Member) => {
    if (m.totalPlayTime === 0) return 0;
    return Math.round(m.totalAmountPaid / m.totalPlayTime);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
           <h2 className="text-2xl font-bold text-palette-navy dark:text-white">{t('members')}</h2>
           <p className="text-palette-brown/70 dark:text-palette-cream/60 text-sm">{t('manage_members_desc')}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-4 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Sort */}
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="h-11 px-4 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white"
          >
            <option value="NAME_ASC">{t('sort_name_asc')}</option>
            <option value="NAME_DESC">{t('sort_name_desc')}</option>
            <option value="PLAYTIME_DESC">{t('sort_playtime')}</option>
            <option value="JOIN_DATE_ASC">{t('sort_join')}</option>
          </select>

          {/* Add Button - DESIGN SYSTEM: PRIMARY ACTION (Mustard + White Text) */}
          <button 
            onClick={() => setIsAdding(true)}
            className="h-11 px-5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg transition-all bg-palette-mustard text-white hover:bg-palette-mustard/90 shadow-palette-mustard/30"
          >
            <UserPlus size={18} /> {t('add_member')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="space-y-4">
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-palette-mustard/10 rounded-lg text-palette-mustard dark:text-palette-yellow shadow-sm">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-palette-navy dark:text-white">
            {t('members')}
          </h3>
          <span className="ml-auto text-xs font-bold text-palette-brown/70 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full shadow-sm">
            {filteredMembers.length}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
           {filteredMembers.map(member => {
             const membership = getMembershipConfig(member.membershipId);
             const isExpired = member.membershipExpiryDate && new Date() > new Date(member.membershipExpiryDate);
             const effectiveRate = getEffectiveRate(member);
             const style = getCardStyle(member.membershipId);

             return (
             <div key={member.id} className={`rounded-3xl border shadow-lg hover:shadow-xl transition-all duration-500 group flex flex-col relative overflow-hidden ${style.card}`}>
                
                {/* PREMIUM SHINE EFFECT ANIMATION */}
                <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer pointer-events-none z-0 ${style.shineOpacity}`} style={{ width: '200%' }}></div>

                {/* Content Container - z-10 to stay above shine */}
                <div className="relative z-10 p-6 pb-4 flex justify-between items-start">
                   <div className="flex gap-4 items-center">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shadow-inner ${style.statsBg} ${style.text} backdrop-blur-sm`}>
                         {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <h3 className={`font-bold text-lg leading-tight ${style.text}`}>{member.name}</h3>
                         <div className="flex flex-col gap-1 mt-1">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide w-fit ${style.statsBg} ${style.text}`}>
                                {getMembershipIcon(membership.id)} {membership.name} {isExpired && "(EXPIRED)"}
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   {/* Action Buttons with adaptive colors */}
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setUpgradingMember(member); setSelectedUpgradeTier(member.membershipId === 'BASIC' ? 'PLUS' : 'VIP'); }} 
                        className={`p-2 rounded-lg transition-colors ${style.statsBg} ${style.iconColor} hover:bg-white hover:text-black`} 
                        title="Upgrade Membership">
                          <ArrowUpCircle size={18}/>
                      </button>
                      <button onClick={() => openEdit(member)} 
                        className={`p-2 rounded-lg transition-colors ${style.statsBg} ${style.iconColor} hover:bg-white hover:text-black`}>
                          <Edit2 size={18}/>
                      </button>
                      <button onClick={() => { if(confirm(t('delete_confirm'))) deleteMember(member.id) }} 
                        className={`p-2 rounded-lg transition-colors ${style.statsBg} text-red-500 hover:bg-red-500 hover:text-white`}>
                          <Trash2 size={18}/>
                      </button>
                   </div>
                </div>
                
                <div className="relative z-10 px-6 py-2 grid grid-cols-2 gap-3">
                    <div className={`p-3 rounded-2xl backdrop-blur-sm ${style.statsBg}`}>
                       <p className={`text-[10px] uppercase font-bold mb-1 opacity-80 ${style.text}`}>{t('total_play')}</p>
                       <p className={`text-lg font-black flex items-center gap-1 ${style.text}`}>
                          <Clock size={16} className="opacity-80"/> {member.totalPlayTime}h
                       </p>
                    </div>
                    <div className={`p-3 rounded-2xl backdrop-blur-sm ${style.statsBg}`}>
                       <p className={`text-[10px] uppercase font-bold mb-1 opacity-80 ${style.text}`}>{t('bonus_balance')}</p>
                       <p className={`text-lg font-black flex items-center gap-1 ${style.text}`}>
                          <Gift size={16} className="opacity-80"/> {member.freeHoursBalance}h
                       </p>
                    </div>
                </div>

                <div className="relative z-10 px-6 pb-6 mt-auto">
                   <div className={`pt-4 mt-2 border-t border-dashed ${style.statsBg.split(' ')[1] || 'border-black/10'} space-y-3`}>
                       <div className={`flex justify-between text-xs font-medium ${style.text}`}>
                          <span className="opacity-80">{t('bonus_progress')}</span>
                          <span className="font-bold">{member.hoursProgressToNextBonus}/{membership.bonusThreshold} {t('jam')}</span>
                       </div>
                       <div className={`w-full h-2.5 rounded-full overflow-hidden ${style.barBg}`}>
                          <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${style.barFill}`} style={{ width: `${Math.min((member.hoursProgressToNextBonus / membership.bonusThreshold) * 100, 100)}%` }} />
                       </div>
                       
                       {/* Footer Details */}
                       <div className="flex items-center justify-between pt-2">
                           <div className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-md ${style.statsBg} ${style.text}`}>
                               <TrendingDown size={12}/> Rp {effectiveRate.toLocaleString()}/{t('jam')}
                           </div>
                           <div className={`text-[10px] font-medium text-right opacity-70 ${style.text}`}>
                              Since: {new Date(member.joinDate).toLocaleDateString()}
                           </div>
                       </div>
                   </div>
                </div>
             </div>
           )})}
           {filteredMembers.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-slate-500 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/10">
                <div className="p-4 md:p-6 bg-slate-50 dark:bg-white/5 rounded-full mb-3 md:mb-4">
                   <Users className="w-8 h-8 md:w-12 md:h-12 text-slate-400/80" />
                </div>
                <p className="font-medium text-sm md:text-base">{t('no_data_members')}</p>
             </div>
           )}
        </div>
      </div>

      {/* MODALS */}
      {/* UPGRADE MODAL */}
      {upgradingMember && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-palette-navy dark:text-white">{t('upgrade_membership')}</h3>
                   <button onClick={() => setUpgradingMember(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
                </div>
                <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">{t('member_label')} <span className="font-bold text-slate-900 dark:text-white">{upgradingMember.name}</span></p>
                    <p className="text-sm text-slate-500">{t('current_plan')} {upgradingMember.membershipId}</p>
                </div>
                <form onSubmit={handleUpgrade} className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('select_new_plan')}</label>
                     <div className="grid grid-cols-1 gap-2">
                        {membershipConfigs.filter(c => c.price > 0).map(c => (
                            <button
                                type="button"
                                key={c.id}
                                onClick={() => setSelectedUpgradeTier(c.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedUpgradeTier === c.id ? `bg-palette-mustard/10 border-palette-mustard ring-1 ring-palette-mustard` : 'border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${selectedUpgradeTier === c.id ? 'text-palette-mustard' : 'text-slate-700 dark:text-slate-200'}`}>{c.name}</span>
                                    <span className="text-xs font-bold bg-white dark:bg-palette-navy px-2 py-1 rounded border dark:border-white/10">Rp {c.price.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Bonus {c.bonusThreshold} {t('jam')} = {c.bonusReward} {t('jam')}</p>
                            </button>
                        ))}
                     </div>
                   </div>
                   {/* PRIMARY ACTION BUTTON */}
                   <button type="submit" className="w-full py-3 bg-palette-mustard text-white rounded-xl font-bold hover:bg-palette-mustard/90 shadow-md mt-2 shadow-palette-mustard/20">
                       {t('confirm_update')}
                   </button>
                </form>
             </div>
          </div>
      )}

      {/* CREATE MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-palette-navy dark:text-white">{t('add_member')}</h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('full_name')} <span className="text-palette-red">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white" 
                    placeholder={t('full_name')}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('membership_plan')}</label>
                  <select 
                     value={formData.membershipId}
                     onChange={e => setFormData({...formData, membershipId: e.target.value as MembershipTierId})}
                     className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white"
                  >
                     {membershipConfigs.filter(c => c.isActive).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('phone')}</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white" 
                    placeholder="08..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('address')}</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white" 
                    placeholder={t('address')}
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('join_date')}</label>
                   <input type="date" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white"
                   />
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                   {/* PRIMARY ACTION BUTTON */}
                   <button type="submit" className="px-8 py-3 bg-palette-mustard text-white rounded-xl font-bold hover:bg-palette-mustard/90 shadow-md transition-transform hover:-translate-y-0.5 w-full md:w-auto shadow-palette-mustard/20">{t('save')}</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-palette-navy dark:text-white">{t('edit_member')}</h3>
                 <button onClick={() => setEditingMember(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">{t('full_name')}</label>
                    <input required className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-palette-navy rounded-xl border-0 ring-1 ring-slate-200 dark:ring-white/10 dark:text-white focus:ring-2 focus:ring-palette-mustard focus:outline-none" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">{t('membership_plan')}</label>
                       {/* Disabled in edit, use upgrade flow instead */}
                       <input disabled className="w-full mt-1 px-4 py-3 bg-slate-100 dark:bg-white/5 rounded-xl border-0 text-slate-500 cursor-not-allowed" value={editingMember.membershipId} />
                     </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('phone')}</label>
                        <input className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-palette-navy rounded-xl border-0 ring-1 ring-slate-200 dark:ring-white/10 dark:text-white focus:ring-2 focus:ring-palette-mustard focus:outline-none" value={editingMember.phone || ''} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('join_date')}</label>
                        <input type="datetime-local" className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-palette-navy rounded-xl border-0 ring-1 ring-slate-200 dark:ring-white/10 text-sm dark:text-white focus:ring-2 focus:ring-palette-mustard focus:outline-none" 
                          value={editingMember.joinDate.slice(0, 16)} 
                          onChange={e => setEditingMember({...editingMember, joinDate: new Date(e.target.value).toISOString()})} />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('address')}</label>
                        <input className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-palette-navy rounded-xl border-0 ring-1 ring-slate-200 dark:ring-white/10 dark:text-white focus:ring-2 focus:ring-palette-mustard focus:outline-none" value={editingMember.address || ''} onChange={e => setEditingMember({...editingMember, address: e.target.value})} />
                     </div>
                 </div>
                 
                 <div className="flex justify-end pt-4">
                    {/* PRIMARY ACTION BUTTON */}
                    <button type="submit" className="px-6 py-3 bg-palette-mustard text-white rounded-xl font-bold flex items-center gap-2 hover:bg-palette-mustard/90 w-full md:w-auto justify-center shadow-lg shadow-palette-mustard/20"><Save size={18}/> {t('save_changes')}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Members;