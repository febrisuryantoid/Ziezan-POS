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
           <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('members')}</h2>
           <p className="text-slate-500 text-sm">{t('manage_members_desc')}</p>
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
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-400 transition-all shadow-sm text-slate-900 dark:text-white"
            />
          </div>

          {/* Sort */}
          <select 
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as SortOption)}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-sm text-slate-900 dark:text-white"
          >
            <option value="NAME_ASC">{t('sort_name_asc')}</option>
            <option value="NAME_DESC">{t('sort_name_desc')}</option>
            <option value="PLAYTIME_DESC">{t('sort_playtime')}</option>
            <option value="JOIN_DATE_ASC">{t('sort_join')}</option>
          </select>

          {/* Add Button */}
          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg transition-all bg-brand-400 text-slate-900 hover:bg-brand-500 shadow-brand-400/20"
          >
            <UserPlus size={18} /> {t('add_member')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="space-y-4">
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-brand-400/20 rounded-lg text-brand-600 dark:text-brand-400 shadow-sm">
            <Users size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            {t('members')}
          </h3>
          <span className="ml-auto text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
            {filteredMembers.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
           {filteredMembers.map(member => {
             const membership = getMembershipConfig(member.membershipId);
             const isExpired = member.membershipExpiryDate && new Date() > new Date(member.membershipExpiryDate);
             const effectiveRate = getEffectiveRate(member);

             return (
             <div key={member.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col relative overflow-hidden">
                {/* Visual Accent for Tier */}
                <div className={`absolute top-0 left-0 w-1 h-full ${membership.color.split(' ')[0].replace('bg-', 'bg-')}`}></div>

                <div className="p-6 pb-4 flex justify-between items-start">
                   <div className="flex gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold shadow-inner ${
                          member.membershipId === 'VIP' ? 'bg-gradient-to-br from-brand-300 to-brand-500 text-slate-900' : 
                          'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}>
                         {member.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                         <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-tight">{member.name}</h3>
                         <div className="flex flex-col gap-1 mt-1">
                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide w-fit ${membership.color}`}>
                                {getMembershipIcon(membership.id)} {membership.name} {isExpired && "(EXPIRED)"}
                            </div>
                            {member.membershipExpiryDate && (
                                <span className="text-[10px] text-slate-400">
                                   Exp: {new Date(member.membershipExpiryDate).toLocaleDateString()}
                                </span>
                            )}
                         </div>
                      </div>
                   </div>
                   <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setUpgradingMember(member); setSelectedUpgradeTier(member.membershipId === 'BASIC' ? 'PLUS' : 'VIP'); }} className="p-2 hover:bg-brand-50 dark:hover:bg-brand-900/20 rounded-lg text-slate-400 hover:text-brand-600" title="Upgrade Membership"><ArrowUpCircle size={16}/></button>
                      <button onClick={() => openEdit(member)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400 hover:text-brand-600"><Edit2 size={16}/></button>
                      <button onClick={() => { if(confirm(t('delete_confirm'))) deleteMember(member.id) }} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500"><Trash2 size={16}/></button>
                   </div>
                </div>
                
                <div className="px-6 py-2 grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{t('total_play')}</p>
                       <p className="text-lg font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                          <Clock size={16} className="text-brand-500"/> {member.totalPlayTime}h
                       </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                       <p className="text-[10px] uppercase font-bold text-slate-400 mb-1">{t('bonus_balance')}</p>
                       <p className="text-lg font-bold text-brand-600 dark:text-brand-400 flex items-center gap-1">
                          <Gift size={16}/> {member.freeHoursBalance}h
                       </p>
                    </div>
                </div>

                <div className="px-6 pb-6 mt-auto">
                   <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                       <div className="flex justify-between text-xs text-slate-500">
                          <span>{t('bonus_progress')} ({membership.bonusThreshold}h = {membership.bonusReward}h)</span>
                          <span className="font-bold">{member.hoursProgressToNextBonus} / {membership.bonusThreshold} Jam</span>
                       </div>
                       <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${membership.id === 'VIP' ? 'bg-brand-400' : 'bg-slate-400'}`} style={{ width: `${Math.min((member.hoursProgressToNextBonus / membership.bonusThreshold) * 100, 100)}%` }} />
                       </div>
                       
                       {/* Effective Rate Display */}
                       <div className="flex items-center justify-between pt-2">
                           <div className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                               <TrendingDown size={12}/> Rp {effectiveRate.toLocaleString()}/jam
                           </div>
                           <div className="text-[10px] text-slate-400 font-medium text-right">
                              Joined: {new Date(member.joinDate).toLocaleDateString()}
                           </div>
                       </div>
                   </div>
                </div>
             </div>
           )})}
           {filteredMembers.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
                <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-700/50 rounded-full mb-3 md:mb-4">
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
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-6">
                   <h3 className="text-xl font-bold text-slate-900 dark:text-white">Upgrade Membership</h3>
                   <button onClick={() => setUpgradingMember(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
                </div>
                <div className="mb-4">
                    <p className="text-sm text-slate-500 mb-2">Member: <span className="font-bold text-slate-900 dark:text-white">{upgradingMember.name}</span></p>
                    <p className="text-sm text-slate-500">Current: {upgradingMember.membershipId}</p>
                </div>
                <form onSubmit={handleUpgrade} className="space-y-4">
                   <div className="space-y-2">
                     <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pilih Paket Baru</label>
                     <div className="grid grid-cols-1 gap-2">
                        {membershipConfigs.filter(c => c.price > 0).map(c => (
                            <button
                                type="button"
                                key={c.id}
                                onClick={() => setSelectedUpgradeTier(c.id)}
                                className={`p-3 rounded-xl border text-left transition-all ${selectedUpgradeTier === c.id ? `bg-brand-50 dark:bg-brand-900/10 border-brand-400 ring-1 ring-brand-400` : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${selectedUpgradeTier === c.id ? 'text-brand-700 dark:text-brand-300' : 'text-slate-700 dark:text-slate-200'}`}>{c.name}</span>
                                    <span className="text-xs font-bold bg-white dark:bg-slate-800 px-2 py-1 rounded border dark:border-slate-600">Rp {c.price.toLocaleString()}</span>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">Bonus {c.bonusThreshold} jam = {c.bonusReward} jam</p>
                            </button>
                        ))}
                     </div>
                   </div>
                   <button type="submit" className="w-full py-3 bg-brand-400 text-slate-900 rounded-xl font-bold hover:bg-brand-500 shadow-md mt-2">
                       Konfirmasi & Perbarui
                   </button>
                </form>
             </div>
          </div>
      )}

      {/* CREATE MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('add_member')}</h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('full_name')} <span className="text-red-500">*</span></label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all dark:text-white" 
                    placeholder="Nama Member"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('membership_plan')}</label>
                  <select 
                     value={formData.membershipId}
                     onChange={e => setFormData({...formData, membershipId: e.target.value as MembershipTierId})}
                     className="w-full bg-slate-50 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all dark:text-white"
                  >
                     {membershipConfigs.filter(c => c.isActive).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                     ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('phone')}</label>
                  <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all dark:text-white" 
                    placeholder="08..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('address')}</label>
                  <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} 
                    className="w-full bg-slate-50 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all dark:text-white" 
                    placeholder="Alamat domisili"
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                   <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">{t('join_date')}</label>
                   <input type="date" value={formData.joinDate} onChange={e => setFormData({...formData, joinDate: e.target.value})}
                      className="w-full bg-slate-50 dark:bg-slate-950 border-0 ring-1 ring-slate-200 dark:ring-slate-700 rounded-xl px-4 py-3 focus:ring-2 focus:ring-brand-400 focus:outline-none transition-all dark:text-white"
                   />
                </div>
                <div className="md:col-span-2 pt-4 flex justify-end gap-3">
                   <button type="submit" className="px-8 py-3 bg-brand-400 text-slate-900 rounded-xl font-bold hover:bg-brand-500 shadow-md transition-transform hover:-translate-y-0.5 w-full md:w-auto">{t('save')}</button>
                </div>
              </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white">{t('edit_member')}</h3>
                 <button onClick={() => setEditingMember(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase">{t('full_name')}</label>
                    <input required className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 dark:text-white" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} />
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="text-xs font-bold text-slate-500 uppercase">{t('membership_plan')}</label>
                       {/* Disabled in edit, use upgrade flow instead */}
                       <input disabled className="w-full mt-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl border-0 text-slate-500 cursor-not-allowed" value={editingMember.membershipId} />
                     </div>
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('phone')}</label>
                        <input className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 dark:text-white" value={editingMember.phone || ''} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} />
                    </div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('join_date')}</label>
                        <input type="datetime-local" className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 text-sm dark:text-white" 
                          value={editingMember.joinDate.slice(0, 16)} 
                          onChange={e => setEditingMember({...editingMember, joinDate: new Date(e.target.value).toISOString()})} />
                    </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">{t('address')}</label>
                        <input className="w-full mt-1 px-4 py-3 bg-slate-50 dark:bg-slate-950 rounded-xl border-0 ring-1 ring-slate-200 dark:ring-slate-700 dark:text-white" value={editingMember.address || ''} onChange={e => setEditingMember({...editingMember, address: e.target.value})} />
                     </div>
                 </div>
                 
                 <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-3 bg-brand-400 text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:bg-brand-500 w-full md:w-auto justify-center"><Save size={18}/> {t('save_changes')}</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Members;