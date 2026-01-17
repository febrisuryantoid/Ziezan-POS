import React, { useState, useMemo, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { MemberStatus, Member, MembershipTierId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Search, UserPlus, Trash2, Gift, Clock, Edit2, X, Save, Users, Crown, Star, Shield, TrendingDown, ArrowUpCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Calendar, MapPin, Phone, Camera, Loader2, Link as LinkIcon, ImagePlus, Cake, AlertCircle, ExternalLink, Copy, User, Tag, StickyNote, ArrowUpDown, Filter, AlertTriangle } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'PLAYTIME_DESC' | 'JOIN_DATE_ASC';

const Members: React.FC = () => {
  const { members, membershipConfigs, addMember, deleteMember, updateMember, upgradeMember } = useData();
  const { t, language } = useLanguage();
  const { addToast } = useToast();

  // -- STATE --
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | MemberStatus>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);

  // Form State (New Member)
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPhoto, setNewPhoto] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newTier, setNewTier] = useState<MembershipTierId>('BASIC');
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  // -- FILTER & SORT LOGIC --
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone && m.phone.includes(searchTerm));
      const matchesStatus = filterStatus === 'ALL' ? true : m.status === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'NAME_ASC': return a.name.localeCompare(b.name);
        case 'NAME_DESC': return b.name.localeCompare(a.name);
        case 'PLAYTIME_DESC': return b.totalPlayTime - a.totalPlayTime;
        case 'JOIN_DATE_ASC': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        default: return 0;
      }
    });
  }, [members, searchTerm, filterStatus, sortOption]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // -- HANDLERS --

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
      const file = e.target.files?.[0];
      if (file) {
          setIsProcessingPhoto(true);
          try {
              const optimized = await optimizeImage(file, { maxWidth: 300, maxHeight: 300 });
              if (isEdit && editingMember) {
                  setEditingMember({ ...editingMember, photoUrl: optimized });
              } else {
                  setNewPhoto(optimized);
              }
              addToast('success', 'Foto Berhasil', 'Gambar berhasil diupload dan dikompresi.');
          } catch (err) {
              addToast('error', 'Gagal Upload', 'Terjadi kesalahan saat memproses gambar.');
          } finally {
              setIsProcessingPhoto(false);
          }
      }
  };

  const resetForm = () => {
    setNewName(''); setNewNickname(''); setNewPhone(''); setNewAddress(''); 
    setNewPhoto(''); setNewDob(''); setNewTier('BASIC');
    setIsAdding(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      addMember({
        name: newName,
        nickname: newNickname,
        phone: newPhone,
        address: newAddress,
        photoUrl: newPhoto,
        dateOfBirth: newDob || undefined,
        membershipId: newTier,
        status: MemberStatus.ACTIVE,
        joinDate: new Date().toISOString(),
        notes: ''
      });
      addToast('success', 'Member Ditambahkan', `Selamat datang, ${newName}!`);
      resetForm();
    }
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
      updateMember(editingMember);
      setEditingMember(null);
      addToast('success', 'Data Diperbarui', 'Perubahan data member berhasil disimpan.');
    }
  };

  const handleDeleteMember = () => {
    if (deletingMemberId) {
      deleteMember(deletingMemberId);
      setDeletingMemberId(null);
      addToast('info', 'Member Dihapus', 'Data member telah dihapus dari sistem.');
    }
  };

  const handleCopyLink = (nickname: string) => {
      const url = `${window.location.origin}/member/${encodeURIComponent(nickname)}`;
      navigator.clipboard.writeText(url).then(() => {
          addToast('success', 'Link Disalin', 'Link kartu member siap dibagikan.');
      });
  };

  // Helper for Membership Style
  const getTierIcon = (id: string) => {
     switch(id) {
         case 'VIP': return <Crown size={14} className="text-amber-500" />;
         case 'PLUS': return <Star size={14} className="text-purple-500" />;
         default: return <Shield size={14} className="text-slate-400" />;
     }
  };

  return (
    <div className="flex flex-col gap-6 pb-20">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('members')}</h2>
          <p className="text-slate-500 text-xs">{t('manage_members_desc')}</p>
        </div>

        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-3 items-center">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-8 lg:w-auto lg:min-w-[240px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="search" 
                    placeholder={t('search_placeholder')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-11 pl-10 pr-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white"
                />
            </div>

            {/* Sort */}
            <div className="relative col-span-1 md:col-span-4 lg:w-40">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="h-11 pl-10 pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer"
                >
                    <option value="NAME_ASC">{t('sort_name_asc')}</option>
                    <option value="NAME_DESC">{t('sort_name_desc')}</option>
                    <option value="PLAYTIME_DESC">{t('sort_playtime')}</option>
                    <option value="JOIN_DATE_ASC">{t('sort_join')}</option>
                </select>
            </div>

            {/* Add Button */}
            <button 
                onClick={() => setIsAdding(true)}
                className="col-span-1 md:col-span-12 lg:w-auto h-11 px-6 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md bg-palette-mustard text-white hover:bg-palette-mustard/90 active:scale-95 whitespace-nowrap"
            >
                <UserPlus size={16} /> {t('add_member')}
            </button>
        </div>
      </div>

      {/* MEMBER GRID */}
      {filteredMembers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5">
              <Users size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-medium">{t('no_data_members')}</p>
          </div>
      ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {currentMembers.map(member => (
                  <div key={member.id} className="bg-white dark:bg-palette-navyLight rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all overflow-hidden group">
                      <div className="p-4 flex items-start gap-4">
                          <div className="relative shrink-0" onClick={() => setViewingMember(member)}>
                              <img 
                                  src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                                  alt={member.name} 
                                  className="w-14 h-14 rounded-2xl object-cover bg-slate-100 dark:bg-black/20 cursor-pointer"
                              />
                              <div className="absolute -bottom-1 -right-1 bg-white dark:bg-palette-navyLight p-1 rounded-full shadow-sm">
                                  {getTierIcon(member.membershipId)}
                              </div>
                          </div>
                          <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-slate-900 dark:text-white truncate cursor-pointer hover:text-palette-mustard" onClick={() => setViewingMember(member)}>{member.name}</h3>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">@{member.nickname}</p>
                              <div className="flex flex-wrap gap-1">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/10 text-[10px] font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                      <Clock size={10} /> {member.totalPlayTime}h
                                  </span>
                                  {member.freeHoursBalance > 0 && (
                                      <span className="px-2 py-0.5 rounded-md bg-green-100 text-green-700 text-[10px] font-bold flex items-center gap-1">
                                          <Gift size={10} /> {member.freeHoursBalance}h
                                      </span>
                                  )}
                              </div>
                          </div>
                          <div className="flex flex-col gap-1">
                              <button onClick={() => setEditingMember(member)} className="p-2 text-slate-400 hover:text-palette-mustard hover:bg-slate-50 dark:hover:bg-white/5 rounded-lg transition-colors"><Edit2 size={14} /></button>
                              <button onClick={() => setDeletingMemberId(member.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                      </div>
                      <div className="bg-slate-50 dark:bg-black/10 px-4 py-2 border-t border-slate-100 dark:border-white/5 flex justify-between items-center">
                          <span className="text-[10px] text-slate-500 font-mono">{member.phone || '-'}</span>
                          <button onClick={() => handleCopyLink(member.nickname)} className="text-[10px] font-bold text-palette-mustard hover:underline flex items-center gap-1">
                              <ExternalLink size={10} /> Kartu Member
                          </button>
                      </div>
                  </div>
              ))}
          </div>
      )}

      {/* ADD MEMBER MODAL */}
      {isAdding && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
              <div className="bg-white dark:bg-palette-navyLight w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><UserPlus size={20} className="text-palette-mustard"/> {t('add_member')}</h3>
                      <button onClick={resetForm} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <form id="add-member-form" onSubmit={handleAddMember} className="space-y-4">
                          {/* Photo Upload */}
                          <div className="flex items-center gap-4 mb-4">
                              <div onClick={() => photoInputRef.current?.click()} className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-palette-mustard transition-colors relative overflow-hidden group">
                                  {isProcessingPhoto ? <Loader2 className="animate-spin text-palette-mustard" /> : newPhoto ? <img src={newPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-400 group-hover:text-palette-mustard" />}
                              </div>
                              <div className="flex-1">
                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Foto Profil</label>
                                  <input type="text" placeholder="https://..." value={newPhoto} onChange={e => setNewPhoto(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-palette-mustard" />
                                  <input type="file" ref={photoInputRef} onChange={e => handlePhotoUpload(e, false)} className="hidden" accept="image/*" />
                                  <button type="button" onClick={() => photoInputRef.current?.click()} className="mt-2 text-[10px] font-bold text-palette-mustard hover:underline flex items-center gap-1"><ImagePlus size={10} /> Upload dari Galeri</button>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('full_name')} *</label>
                                  <input required type="text" value={newName} onChange={e => setNewName(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" autoCapitalize="words" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nickname</label>
                                  <input type="text" value={newNickname} onChange={e => setNewNickname(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" placeholder="Panggilan" />
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('phone')} (WA)</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="tel" inputMode="numeric" pattern="[0-9]*" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" placeholder="08..." />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('dob')}</label>
                                  <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('membership')}</label>
                                  <select value={newTier} onChange={e => setNewTier(e.target.value as MembershipTierId)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white appearance-none">
                                      {membershipConfigs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                  </select>
                              </div>
                          </div>
                          
                          <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-500 uppercase">{t('address')}</label>
                               <textarea rows={2} value={newAddress} onChange={e => setNewAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white resize-none" placeholder="Alamat singkat..." />
                          </div>
                      </form>
                  </div>
                  <div className="p-5 border-t border-slate-100 dark:border-white/5 shrink-0">
                      <button type="submit" form="add-member-form" className="w-full py-4 bg-palette-mustard text-white rounded-xl font-bold shadow-lg shadow-palette-mustard/20 hover:bg-palette-mustard/90 active:scale-95 transition-all">{t('save')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* EDIT MEMBER MODAL */}
      {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
              <div className="bg-white dark:bg-palette-navyLight w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Edit2 size={20} className="text-palette-mustard"/> {t('edit_member')}</h3>
                      <button onClick={() => setEditingMember(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <form id="edit-member-form" onSubmit={handleUpdateMember} className="space-y-4">
                          {/* Photo */}
                          <div className="flex items-center gap-4 mb-4">
                              <div onClick={() => editPhotoInputRef.current?.click()} className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-palette-mustard transition-colors relative overflow-hidden group">
                                  {isProcessingPhoto ? <Loader2 className="animate-spin text-palette-mustard" /> : <img src={editingMember.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1">
                                  <input type="text" value={editingMember.photoUrl || ''} onChange={e => setEditingMember({...editingMember, photoUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-palette-mustard mb-2" placeholder="URL Foto..." />
                                  <input type="file" ref={editPhotoInputRef} onChange={e => handlePhotoUpload(e, true)} className="hidden" accept="image/*" />
                                  <button type="button" onClick={() => editPhotoInputRef.current?.click()} className="text-[10px] font-bold text-palette-mustard hover:underline flex items-center gap-1"><ImagePlus size={10} /> Ganti Foto</button>
                              </div>
                          </div>

                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('full_name')}</label>
                              <input required type="text" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                          </div>
                          
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('phone')}</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="tel" inputMode="numeric" pattern="[0-9]*" value={editingMember.phone || ''} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('membership')}</label>
                                  <select value={editingMember.membershipId} onChange={e => setEditingMember({...editingMember, membershipId: e.target.value as MembershipTierId})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white">
                                      {membershipConfigs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('bonus_balance')}</label>
                                  <input type="number" inputMode="numeric" value={editingMember.freeHoursBalance} onChange={e => setEditingMember({...editingMember, freeHoursBalance: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                          </div>
                      </form>
                  </div>
                  <div className="p-5 border-t border-slate-100 dark:border-white/5 shrink-0">
                      <button type="submit" form="edit-member-form" className="w-full py-4 bg-palette-mustard text-white rounded-xl font-bold shadow-lg shadow-palette-mustard/20 hover:bg-palette-mustard/90 active:scale-95 transition-all">{t('save_changes')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* DELETE CONFIRMATION */}
      {deletingMemberId && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-zoom-in">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('delete_confirm')}</h3>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                      <button onClick={() => setDeletingMemberId(null)} className="py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-sm">{t('cancel')}</button>
                      <button onClick={handleDeleteMember} className="py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20">Ya, Hapus</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Members;