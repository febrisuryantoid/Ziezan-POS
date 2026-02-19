import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { MemberStatus, Member, MembershipTierId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Search, UserPlus, Trash2, Gift, Clock, Edit2, X, Users, Copy, Loader2, ImagePlus, ArrowUpDown, Filter, AlertTriangle, ChevronLeft, ChevronRight, MapPin, Phone, FileText, Camera, History, Banknote, Gamepad2, PlusCircle, MinusCircle } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';
import { getTierTheme } from '../utils/tierTheme';
import DragonIcon from './DragonIcon'; // Import DragonIcon

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'PLAYTIME_DESC' | 'JOIN_DATE_ASC';

const Members: React.FC = () => {
  const { members, transactions, membershipConfigs, addMember, deleteMember, updateMember, adjustBonusHours } = useData();
  const { t, language } = useLanguage();
  const { addToast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  // FIX: Use enum member for type safety and to resolve TypeScript error.
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'ALL'>(MemberStatus.ACTIVE);
  const [now, setNow] = useState(new Date());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('Nyomplong');
  const [newPhoto, setNewPhoto] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]);
  const [newTier, setNewTier] = useState<MembershipTierId>('WARRIOR');
  const [newNotes, setNewNotes] = useState('');
  const [newBonusBalance, setNewBonusBalance] = useState<number>(0); 
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const [bonusAdjustment, setBonusAdjustment] = useState(0);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, filterTier, sortOption, filterStatus]);

  const getRealtimePlaytime = (member: Member) => {
     let total = member.totalPlayTime || 0;
     const activeTx = transactions.find(t => t.memberId === member.id && t.status === 'ACTIVE');
     if (activeTx) total += activeTx.durationHours;
     return total;
  };
  
  const memberTransactions = useMemo(() => {
    if (!editingMember) return [];
    return transactions
        .filter(tx => tx.memberId === editingMember.id)
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  }, [transactions, editingMember]);


  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const name = m.name || '';
      const nickname = m.nickname || '';
      const phone = m.phone || '';
      const term = searchTerm.toLowerCase();
      const matchesSearch = name.toLowerCase().includes(term) || nickname.toLowerCase().includes(term) || phone.includes(term);
      const matchesStatus = filterStatus === 'ALL' ? true : m.status === filterStatus; 
      const matchesTier = filterTier === 'ALL' ? true : m.membershipId === filterTier;
      return matchesSearch && matchesStatus && matchesTier;
    }).sort((a, b) => {
      const nickA = a.nickname || '';
      const nickB = b.nickname || '';
      switch (sortOption) {
        case 'NAME_ASC': return nickA.localeCompare(nickB);
        case 'NAME_DESC': return nickB.localeCompare(nickA);
        case 'PLAYTIME_DESC': return getRealtimePlaytime(b) - getRealtimePlaytime(a);
        case 'JOIN_DATE_ASC': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        default: return 0;
      }
    });
  }, [members, transactions, searchTerm, sortOption, filterTier, filterStatus, now]);

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessingPhoto(true);
          try {
              const optimized = await optimizeImage(file, { maxWidth: 300, maxHeight: 300 });
              if (isEdit && editingMember) setEditingMember({ ...editingMember, photoUrl: optimized });
              else setNewPhoto(optimized);
              addToast('success', t('photo_member'), t('saved'));
          } catch (err) { addToast('error', 'Error', 'Upload Failed'); } finally { setIsProcessingPhoto(false); }
      }
  };

  const resetForm = () => {
    setNewName(''); setNewNickname(''); setNewPhone(''); setNewAddress('Nyomplong'); setNewPhoto(''); setNewDob(''); 
    setNewJoinDate(new Date().toISOString().split('T')[0]); setNewTier('WARRIOR'); setNewNotes(''); setNewBonusBalance(0);
    setIsAdding(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      if (newPhone && members.some(m => m.phone === newPhone)) { addToast('error', 'Error', 'Phone number exists'); return; }
      addMember({ name: newName, nickname: newNickname || newName.split(' ')[0], phone: newPhone, address: newAddress, photoUrl: newPhoto, dateOfBirth: newDob || undefined, membershipId: newTier, status: MemberStatus.ACTIVE, joinDate: newJoinDate ? new Date(newJoinDate).toISOString() : new Date().toISOString(), notes: newNotes, freeHoursBalance: newBonusBalance });
      addToast('success', t('member_added'), `${t('welcome')} ${newNickname || newName}`);
      resetForm();
    }
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember?.id) { updateMember(editingMember); setEditingMember(null); addToast('success', t('member_updated'), t('saved')); }
    else addToast('error', 'Error', 'ID Not Found');
  };

  const handleBonusAdjustment = () => {
    if (!editingMember || bonusAdjustment === 0) return;
    adjustBonusHours(editingMember.id, bonusAdjustment);
    addToast('success', 'Bonus Diperbarui', `Saldo bonus ${editingMember.nickname} disesuaikan.`);
    setBonusAdjustment(0);
    // Refresh member data in modal
    const updatedMember = members.find(m => m.id === editingMember.id);
    if(updatedMember) setEditingMember(updatedMember);
  };

  const handleDeactivateMember = () => {
    if (deletingMemberId) {
      const success = deleteMember(deletingMemberId);
      if (success) addToast('info', t('member_deactivated'), t('saved'));
      else addToast('error', 'Error', 'Member Active!');
      setDeletingMemberId(null);
    }
  };

  const handleCopyLink = (nickname: string) => {
      const url = `${window.location.origin}/member/${encodeURIComponent(nickname)}`;
      navigator.clipboard.writeText(url).then(() => addToast('success', t('link_copied'), t('saved')));
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) for (let i = 1; i <= totalPages; i++) pages.push(i);
        else if (currentPage <= 3) pages.push(1, 2, 3, 4, '...', totalPages);
        else if (currentPage >= totalPages - 2) pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        else pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        return pages;
    };
    return (
        <div className="flex justify-center items-center gap-2 mt-8 animate-fade-in pb-12">
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn-icon disabled:opacity-30"><ChevronLeft size={18} /></button>
            {getPageNumbers().map((page, idx) => (
                <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} disabled={typeof page !== 'number'} className={`w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] rounded-full flex items-center justify-center font-black text-[10px] sm:text-xs transition-all backdrop-blur-md ${page === currentPage ? 'bg-palette-mustard text-white shadow-xl shadow-palette-mustard/30 scale-110' : typeof page === 'number' ? 'bg-white/40 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn-icon disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Search Bar - Glass Effect */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/40 dark:bg-white/[0.02] p-4 rounded-[2.5rem] border border-slate-300 dark:border-white/5 backdrop-blur-xl shadow-sm">
        <div className="mb-2 xl:mb-0 px-2">
          <h2 className="text-2xl font-black text-palette-navy dark:text-white uppercase tracking-tight">{t('members')}</h2>
          <p className="text-xs font-bold text-muted-foreground mt-1">{t('manage_members_desc')}</p>
        </div>

        <div className="w-full xl:w-auto flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1 sm:min-w-[200px]">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                <input type="search" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-glass pl-11 w-full" />
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
                <div className="relative col-span-1 sm:w-32">
                    <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                    <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="select-glass pl-11 pr-8 w-full text-xs">
                        <option value="NAME_ASC">{t('sort_name_asc')}</option>
                        <option value="NAME_DESC">{t('sort_name_desc')}</option>
                        <option value="PLAYTIME_DESC">{t('sort_playtime')}</option>
                        <option value="JOIN_DATE_ASC">{t('sort_join')}</option>
                    </select>
                </div>
                 <div className="relative col-span-1 sm:w-32">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as MemberStatus | 'ALL')} className="select-glass pl-11 pr-8 w-full text-xs">
                        <option value="ALL">{t('all_status')}</option>
                        <option value={MemberStatus.ACTIVE}>{t('active')}</option>
                        <option value={MemberStatus.INACTIVE}>{t('inactive')}</option>
                    </select>
                </div>
            </div>
            <div className="relative w-full sm:w-36">
                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)} className="select-glass pl-11 pr-8 w-full text-xs">
                    <option value="ALL">{t('all')}</option>
                    {membershipConfigs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            <button onClick={() => setIsAdding(true)} className="w-full sm:w-auto btn-primary px-6">
                <UserPlus size={18} /> {t('add_member')}
            </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-palette-mustard/10 rounded-full text-palette-mustard shadow-sm"><Users size={18} /></div>
          <h3 className="text-lg font-bold text-palette-navy dark:text-white uppercase tracking-tight">{t('members')}</h3>
          <span className="ml-auto text-label bg-white/40 dark:bg-white/5 border border-slate-300 dark:border-white/20 px-3 py-1 rounded-full shadow-sm backdrop-blur-md normal-case">Total: {filteredMembers.length}</span>
        </div>

        {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-white/40 dark:bg-white/[0.02] backdrop-blur-xl rounded-[3rem] border border-dashed border-slate-300 dark:border-white/20">
                <Users size={64} className="text-slate-300 mb-4 opacity-20" />
                <p className="text-slate-500 font-black uppercase tracking-widest text-xs opacity-50">{t('no_data_members')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentMembers.map(member => {
                    const theme = getTierTheme(member.membershipId);
                    const realtimePlaytime = getRealtimePlaytime(member);
                    const isPlaying = transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');
                    return (
                    <div 
                        key={member.id} 
                        className="group relative rounded-[2rem] bg-white/60 dark:bg-[#0f1016]/60 backdrop-blur-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 border border-slate-300/80 dark:border-white/10"
                    >
                        <div className={`absolute inset-0 ${theme.bg_tint} opacity-50`}></div>
                        <div className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none z-0">
                           <DragonIcon className={`w-40 h-40 opacity-[0.06] blur-sm -mr-10 text-transparent bg-clip-text bg-gradient-to-br ${theme.dragon_gradient} transition-all duration-500 group-hover:opacity-20 group-hover:blur-[2px]`} />
                        </div>

                        <div className="relative p-5 flex items-center gap-5">
                            <div className="relative shrink-0">
                                <div className={`relative w-16 h-16 rounded-full p-1 bg-gradient-to-br ${theme.conic} shadow-2xl`}>
                                    <img src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full rounded-full object-cover bg-black border border-black/50" />
                                    {isPlaying && <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-black animate-pulse z-20 shadow-lg shadow-emerald-500/50"></div>}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-7 h-7 rounded-xl flex items-center justify-center ${theme.badge} border-2 border-white dark:border-black shadow-xl overflow-hidden`}><img src={theme.iconUrl} className="w-5 h-5 object-contain" /></div>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className={`font-black text-lg leading-tight truncate drop-shadow-sm ${theme.text}`}>{member.nickname || t('unknown')}</h3>
                                <div className="flex items-center gap-2 mt-1 opacity-70"><span className={`text-xs font-black uppercase tracking-[0.2em] ${theme.text}`}>{theme.name}</span></div>
                            </div>
                            <div className="flex flex-col gap-2 shrink-0 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 z-20">
                                <button onClick={() => setEditingMember(member)} className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-slate-500 hover:text-primary shadow-sm backdrop-blur-md transition-all"><Edit2 size={14} /></button>
                                <button onClick={() => handleCopyLink(member.nickname)} className="p-2.5 rounded-xl bg-white/40 dark:bg-white/5 text-slate-500 hover:text-blue-500 shadow-sm backdrop-blur-md transition-all"><Copy size={14} /></button>
                                <button onClick={() => setDeletingMemberId(member.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white shadow-sm backdrop-blur-md transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="px-5 pb-5 mt-auto relative z-10">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/10 shadow-inner backdrop-blur-md">
                                    <div className="flex items-center gap-2 text-slate-500"><Clock size={12} /><span className="text-[9px] font-black uppercase tracking-widest">{t('play_stat')}</span></div>
                                    <span className={`text-sm font-black font-mono ${theme.text}`}>{realtimePlaytime.toFixed(0)}h</span>
                                </div>
                                <div className="bg-black/5 dark:bg-white/5 rounded-2xl p-3 flex items-center justify-between border border-white/10 shadow-inner backdrop-blur-md">
                                    <div className="flex items-center gap-2 text-slate-500"><Gift size={12} className={member.freeHoursBalance > 0 ? "text-emerald-500" : ""} /><span className="text-[9px] font-black uppercase tracking-widest">{t('bonus_stat')}</span></div>
                                    <span className="text-sm font-black text-slate-900 dark:text-white font-mono">{member.freeHoursBalance}h</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )})}
            </div>
        )}
        {renderPagination()}
      </div>

      {/* MODALS */}
      {(isAdding || editingMember) && (
          <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
              <div className="bg-white/95 dark:bg-palette-navyLight/95 w-full max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] backdrop-blur-3xl border border-slate-200 dark:border-white/20">
                  <div className="p-6 border-b border-slate-200 dark:border-white/10 flex justify-between items-center bg-black/5 dark:bg-white/10">
                      <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                          <div className="p-2 bg-primary/10 rounded-xl text-primary"><Users size={24}/></div>
                          {isAdding ? t('add_member') : t('edit_member')}
                      </h3>
                      <button onClick={() => { setIsAdding(false); setEditingMember(null); }} className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10"><X size={20} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                      <form id="member-form" onSubmit={isAdding ? handleAddMember : handleUpdateMember} className="space-y-6">
                          <div className="flex items-center gap-6 mb-4">
                              <div onClick={() => (isAdding ? photoInputRef : editPhotoInputRef).current?.click()} className="w-28 h-28 rounded-full bg-black/10 border-2 border-dashed border-white/40 flex items-center justify-center cursor-pointer hover:border-primary transition-all shadow-inner overflow-hidden relative group">
                                  {isProcessingPhoto ? <Loader2 className="animate-spin text-primary" /> : (isAdding ? newPhoto : editingMember?.photoUrl) ? <img src={isAdding ? newPhoto : editingMember?.photoUrl} className="w-full h-full object-cover" /> : <Camera size={32} className="text-slate-400 group-hover:text-primary" />}
                              </div>
                              <div className="flex-1 space-y-2">
                                  <label className="text-label">{t('photo_member')}</label>
                                  <input type="text" placeholder="https://..." value={isAdding ? newPhoto : editingMember?.photoUrl || ''} onChange={e => isAdding ? setNewPhoto(e.target.value) : setEditingMember({...editingMember!, photoUrl: e.target.value})} className="input-standard" />
                                  <input type="file" ref={isAdding ? photoInputRef : editPhotoInputRef} onChange={e => handlePhotoUpload(e, !isAdding)} className="hidden" accept="image/*" />
                                  <button type="button" onClick={() => (isAdding ? photoInputRef : editPhotoInputRef).current?.click()} className="text-label text-primary hover:underline flex items-center gap-2"><ImagePlus size={14} /> {t('upload_gallery')}</button>
                              </div>
                          </div>
                          <div className="grid grid-cols-2 gap-5">
                              <div className="space-y-2"><label className="text-label">{t('full_name')}</label><input required type="text" value={isAdding ? newName : editingMember?.name} onChange={e => isAdding ? setNewName(e.target.value) : setEditingMember({...editingMember!, name: e.target.value})} className="input-standard" /></div>
                              <div className="space-y-2"><label className="text-label">{t('nickname')}</label><input type="text" value={isAdding ? newNickname : editingMember?.nickname} onChange={e => isAdding ? setNewNickname(e.target.value) : setEditingMember({...editingMember!, nickname: e.target.value})} className="input-standard" /></div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-label">{t('phone_number')}</label>
                              <input 
                                  type="tel" 
                                  value={isAdding ? newPhone : editingMember?.phone || ''} 
                                  onChange={e => {
                                      const val = e.target.value.replace(/\D/g, ''); // ONLY NUMBERS
                                      isAdding ? setNewPhone(val) : setEditingMember({...editingMember!, phone: val});
                                  }} 
                                  className="input-standard font-mono" 
                                  placeholder="08xxxxxxxxxx"
                              />
                          </div>
                          <div className="space-y-2"><label className="text-label">{t('address')}</label><input type="text" value={isAdding ? newAddress : editingMember?.address || ''} onChange={e => isAdding ? setNewAddress(e.target.value) : setEditingMember({...editingMember!, address: e.target.value})} className="input-standard" /></div>
                          <div className="grid grid-cols-2 gap-5">
                              <div className="space-y-2">
                                  <label className="text-label">{t('membership')}</label>
                                  <select 
                                      value={isAdding ? newTier : editingMember?.membershipId} 
                                      onChange={e => isAdding ? setNewTier(e.target.value as MembershipTierId) : setEditingMember({...editingMember!, membershipId: e.target.value as MembershipTierId})} 
                                      className="input-standard"
                                  >
                                      {membershipConfigs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-2">
                                  <label className="text-label">{t('join_date')}</label>
                                  <input 
                                      type="date" 
                                      max={new Date().toISOString().split('T')[0]} // Cannot be future
                                      value={isAdding ? newJoinDate : editingMember?.joinDate.split('T')[0]} 
                                      onChange={e => isAdding ? setNewJoinDate(e.target.value) : setEditingMember({...editingMember!, joinDate: new Date(e.target.value).toISOString()})} 
                                      className="input-standard" 
                                  />
                              </div>
                          </div>
                          <div className="space-y-2">
                              <label className="text-label">{t('dob')}</label>
                              <input 
                                type="date" 
                                max={new Date().toISOString().split('T')[0]} // Cannot be future
                                value={isAdding ? newDob : editingMember?.dateOfBirth?.split('T')[0] || ''} 
                                onChange={e => isAdding ? setNewDob(e.target.value) : setEditingMember({...editingMember!, dateOfBirth: new Date(e.target.value).toISOString()})} 
                                className="input-standard" 
                              />
                          </div>
                      </form>

                      {editingMember && (
                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                            <h3 className="text-label flex items-center gap-2 mb-4"><Gift size={14} /> Penyesuaian Bonus</h3>
                             <div className="p-4 bg-slate-100/50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5 space-y-4 shadow-inner">
                                <div className="flex items-center gap-3">
                                    <button onClick={() => setBonusAdjustment(prev => prev - 1)} className="btn-icon bg-red-500/10 text-red-500 border-red-500/20"><MinusCircle size={18}/></button>
                                    <input type="number" value={bonusAdjustment} onChange={e => setBonusAdjustment(parseInt(e.target.value) || 0)} className="input-standard text-center font-black text-lg font-mono" />
                                    <button onClick={() => setBonusAdjustment(prev => prev + 1)} className="btn-icon bg-emerald-500/10 text-emerald-500 border-emerald-500/20"><PlusCircle size={18}/></button>
                                </div>
                                <button onClick={handleBonusAdjustment} disabled={bonusAdjustment === 0} className="w-full btn-primary disabled:opacity-50 text-xs">Simpan Penyesuaian</button>
                            </div>
                        </div>
                      )}

                      {editingMember && (
                          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-white/10">
                              <h3 className="text-label flex items-center gap-2 mb-4"><History size={14} /> {t('riwayat_aktivitas')}</h3>
                              {memberTransactions.length > 0 ? (
                                  <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
                                      {memberTransactions.map(tx => {
                                          const isBonus = tx.paymentMethod === 'BONUS';
                                          const Icon = isBonus ? Gift : tx.cost > 0 ? Banknote : Gamepad2;
                                          const color = isBonus ? 'text-emerald-500' : tx.cost > 0 ? 'text-slate-800 dark:text-slate-200' : 'text-slate-500';

                                          return (
                                              <div key={tx.id} className="flex items-center gap-4 p-3 bg-slate-100/50 dark:bg-black/20 rounded-2xl border border-slate-200 dark:border-white/5">
                                                  <div className={`p-2 rounded-lg ${
                                                      isBonus ? 'bg-emerald-500/10 text-emerald-500' 
                                                      : tx.cost > 0 ? 'bg-primary/10 text-primary'
                                                      : 'bg-slate-500/10 text-slate-500'
                                                  }`}>
                                                      <Icon size={16} />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                                                          {`Main di ${tx.consoleName}`}
                                                      </p>
                                                      <p className="text-xs text-slate-500 font-medium">
                                                          {new Date(tx.startTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                      </p>
                                                  </div>
                                                  <div className="text-right shrink-0">
                                                      <p className={`text-sm font-black font-mono ${color}`}>
                                                          {isBonus ? `-${tx.durationHours} Jam` : `Rp ${tx.cost.toLocaleString('id-ID')}`}
                                                      </p>
                                                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{tx.paymentMethod}</p>
                                                  </div>
                                              </div>
                                          );
                                      })}
                                  </div>
                              ) : (
                                  <p className="text-xs text-slate-500 mt-4 text-center py-4 bg-slate-100/50 dark:bg-black/20 rounded-2xl">{t('no_activity_history')}</p>
                              )}
                          </div>
                      )}
                  </div>
                  <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-black/5 shrink-0">
                      <button type="submit" form="member-form" className="w-full btn-primary">{t('save')}</button>
                  </div>
              </div>
          </div>
      )}
      
      {/* DEACTIVATE MODAL */}
      {deletingMemberId && (
          <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
              <div className="bg-white/95 dark:bg-palette-navyLight/95 sm:rounded-[2rem] rounded-t-[2rem] w-full max-w-sm shadow-2xl p-8 text-center border border-slate-200 dark:border-white/20 backdrop-blur-3xl">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl border border-red-500/20"><AlertTriangle size={36} /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{t('deactivate_confirm')}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8">{t('deactivate_member_msg')}</p>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDeletingMemberId(null)} className="btn-glass border-2 text-xs flex items-center justify-center">{t('cancel')}</button>
                      <button onClick={handleDeactivateMember} className="btn-primary bg-gradient-to-br from-red-500 to-red-700 text-white text-xs shadow-red-500/30 flex items-center justify-center">{t('yes_deactivate')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Members;
