
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { MemberStatus, Member, MembershipTierId } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Search, UserPlus, Trash2, Gift, Clock, Edit2, X, Users, Copy, Loader2, ImagePlus, ArrowUpDown, Filter, AlertTriangle, ChevronLeft, ChevronRight, MapPin, Phone, FileText, Camera } from 'lucide-react';
import { optimizeImage } from '../utils/imageOptimizer';
import { getTierTheme } from './PublicMemberCard';

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'PLAYTIME_DESC' | 'JOIN_DATE_ASC';

const Members: React.FC = () => {
  const { members, transactions, membershipConfigs, addMember, deleteMember, updateMember } = useData();
  const { t } = useLanguage();
  const { addToast } = useToast();

  // -- STATE --
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [now, setNow] = useState(new Date()); // For Realtime updates
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

  // Form State (New Member)
  const [newName, setNewName] = useState('');
  const [newNickname, setNewNickname] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('Nyomplong'); // Default Address
  const [newPhoto, setNewPhoto] = useState('');
  const [newDob, setNewDob] = useState('');
  const [newJoinDate, setNewJoinDate] = useState(new Date().toISOString().split('T')[0]); // Default Today
  const [newTier, setNewTier] = useState<MembershipTierId>('WARRIOR'); // Default Basic
  const [newNotes, setNewNotes] = useState('');
  const [newBonusBalance, setNewBonusBalance] = useState<number>(0); 
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);

  // Refs
  const photoInputRef = useRef<HTMLInputElement>(null);
  const editPhotoInputRef = useRef<HTMLInputElement>(null);

  // Realtime Tick (Update every 1 minute to refresh playtime stats in list)
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTier, sortOption]);

  // -- HELPER: Calculate Realtime Playtime --
  const getRealtimePlaytime = (member: Member) => {
     // 1. Get stored historical time
     let total = member.totalPlayTime;
     
     // 2. Find ACTIVE transaction
     const activeTx = transactions.find(t => t.memberId === member.id && t.status === 'ACTIVE');
     
     // 3. Add FULL DURATION of active transaction (Projected Total)
     if (activeTx) {
         total += activeTx.durationHours;
     }

     return total;
  };

  // -- FILTER & SORT LOGIC --
  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      // Allows searching by Name (for admin convenience) BUT display will be Nickname only
      const matchesSearch = 
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        m.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.phone && m.phone.includes(searchTerm));
      
      const matchesStatus = m.status === 'ACTIVE'; 
      const matchesTier = filterTier === 'ALL' ? true : m.membershipId === filterTier;

      return matchesSearch && matchesStatus && matchesTier;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'NAME_ASC': return a.nickname.localeCompare(b.nickname);
        case 'NAME_DESC': return b.nickname.localeCompare(a.nickname);
        case 'PLAYTIME_DESC': 
            // Sort by REALTIME playtime
            return getRealtimePlaytime(b) - getRealtimePlaytime(a);
        case 'JOIN_DATE_ASC': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
        default: return 0;
      }
    });
  }, [members, transactions, searchTerm, sortOption, filterTier, now]);

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
    setNewName(''); setNewNickname(''); setNewPhone(''); 
    setNewAddress('Nyomplong'); // Default Value
    setNewPhoto(''); setNewDob(''); 
    setNewJoinDate(new Date().toISOString().split('T')[0]);
    setNewTier('WARRIOR'); // Default Value
    setNewNotes('');
    setNewBonusBalance(0);
    setIsAdding(false);
  };

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim()) {
      // FIX: Prevent Duplicate Phone
      if (newPhone && members.some(m => m.phone === newPhone)) {
          addToast('error', 'Gagal', 'Nomor HP ini sudah terdaftar.');
          return;
      }

      addMember({
        name: newName,
        nickname: newNickname || newName.split(' ')[0], // Ensure nickname exists
        phone: newPhone,
        address: newAddress,
        photoUrl: newPhoto,
        dateOfBirth: newDob || undefined,
        membershipId: newTier,
        status: MemberStatus.ACTIVE,
        joinDate: newJoinDate ? new Date(newJoinDate).toISOString() : new Date().toISOString(),
        notes: newNotes,
        freeHoursBalance: newBonusBalance 
      });
      addToast('success', 'Member Ditambahkan', `Selamat datang, ${newNickname || newName}!`);
      resetForm();
    }
  };

  const handleUpdateMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember && editingMember.id) {
      updateMember(editingMember);
      setEditingMember(null);
      addToast('success', 'Data Diperbarui', 'Perubahan data member berhasil disimpan.');
    } else {
      addToast('error', 'Gagal Update', 'ID Member tidak ditemukan.');
    }
  };

  const handleDeleteMember = () => {
    if (deletingMemberId) {
      // Call Context which now returns boolean for success
      const success = deleteMember(deletingMemberId);
      if (success) {
          addToast('info', 'Member Dihapus', 'Data member telah dihapus dari sistem.');
      } else {
          addToast('error', 'Gagal Hapus', 'Member sedang bermain! Selesaikan sesi dahulu.');
      }
      setDeletingMemberId(null);
    }
  };

  const handleCopyLink = (nickname: string) => {
      const url = `${window.location.origin}/member/${encodeURIComponent(nickname)}`;
      navigator.clipboard.writeText(url).then(() => {
          addToast('success', 'Link Disalin', 'Link kartu member siap dibagikan.');
      });
  };

  // --- PAGINATION RENDERER ---
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const getPageNumbers = () => {
        const pages = [];
        if (totalPages <= 5) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (currentPage <= 3) {
                pages.push(1, 2, 3, 4, '...', totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
            } else {
                pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
            }
        }
        return pages;
    };

    return (
        <div className="flex justify-center items-center gap-2 mt-8 animate-fade-in pb-8">
            <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronLeft size={18} />
            </button>

            {getPageNumbers().map((page, idx) => (
                <button
                    key={idx}
                    onClick={() => typeof page === 'number' && setCurrentPage(page)}
                    disabled={typeof page !== 'number'}
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        page === currentPage 
                        ? 'bg-palette-mustard text-white shadow-lg shadow-palette-mustard/30 scale-105' 
                        : typeof page === 'number'
                            ? 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10'
                            : 'text-slate-400 cursor-default'
                    }`}
                >
                    {page}
                </button>
            ))}

            <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="w-10 h-10 rounded-full flex items-center justify-center bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ChevronRight size={18} />
            </button>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* HEADER & FILTERS */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="mb-2 xl:mb-0">
          <h2 className="text-lg sm:text-xl font-bold text-palette-navy dark:text-white">{t('members')}</h2>
          <p className="text-palette-brown/70 dark:text-palette-cream/60 text-xs">{t('manage_members_desc')}</p>
        </div>

        {/* RESPONSIVE FILTER GRID SYSTEM */}
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-2 sm:gap-3 items-center min-w-0">
            {/* Search */}
            <div className="relative col-span-2 md:col-span-12 lg:flex-1 lg:w-auto lg:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                    type="search" 
                    placeholder={t('search_placeholder')} 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="h-10 sm:h-11 pl-10 pr-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-base md:text-sm w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
                />
            </div>

            {/* Sort */}
            <div className="relative col-span-1 md:col-span-6 lg:w-48">
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="h-10 sm:h-11 pl-10 pr-2 sm:pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer truncate"
                >
                    <option value="NAME_ASC">{t('sort_name_asc')}</option>
                    <option value="NAME_DESC">{t('sort_name_desc')}</option>
                    <option value="PLAYTIME_DESC">{t('sort_playtime')}</option>
                    <option value="JOIN_DATE_ASC">{t('sort_join')}</option>
                </select>
            </div>

            {/* Filter Tier */}
            <div className="relative col-span-1 md:col-span-6 lg:w-40">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    value={filterTier}
                    onChange={(e) => setFilterTier(e.target.value)}
                    className="h-10 sm:h-11 pl-10 pr-2 sm:pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer truncate"
                >
                    <option value="ALL">{t('all')}</option>
                    {membershipConfigs.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                </select>
            </div>

            {/* Add Button */}
            <button 
                onClick={() => setIsAdding(true)}
                className="col-span-2 md:col-span-12 lg:w-auto h-10 sm:h-11 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md bg-palette-mustard text-white hover:bg-palette-mustard/90 shadow-palette-mustard/30 whitespace-nowrap active:scale-95"
            >
                <UserPlus size={18} /> {t('add_member')}
            </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-palette-mustard/10 rounded-full text-palette-mustard dark:text-palette-yellow shadow-sm">
            <Users size={18} />
          </div>
          <h3 className="text-lg font-bold text-palette-navy dark:text-white">
            {t('active_status')}
          </h3>
          <span className="ml-auto text-[10px] font-bold text-palette-brown/70 dark:text-slate-300 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full shadow-sm">
            Total: {filteredMembers.length}
          </span>
        </div>

        {/* MEMBER GRID */}
        {filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/5">
                <Users size={48} className="text-slate-300 mb-4" />
                <p className="text-slate-500 font-medium">{t('no_data_members')}</p>
            </div>
        ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {currentMembers.map(member => {
                    const theme = getTierTheme(member.membershipId);
                    const realtimePlaytime = getRealtimePlaytime(member);
                    const isPlaying = transactions.some(t => t.memberId === member.id && t.status === 'ACTIVE');

                    return (
                    <div key={member.id} className={`group relative rounded-2xl border ${theme.borderInner} bg-white dark:bg-[#0f1016] overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg dark:hover:shadow-none hover:-translate-y-0.5`}>
                        
                        {/* Subtle Header Gradient based on Tier */}
                        <div className={`absolute top-0 inset-x-0 h-16 bg-gradient-to-b ${theme.conic} opacity-10 dark:opacity-20`}></div>

                        {/* Card Content - Slim Layout */}
                        <div className="relative p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
                            
                            {/* Avatar Section */}
                            <div className="relative shrink-0">
                                <div className={`relative w-12 h-12 sm:w-14 sm:h-14 rounded-full p-0.5 bg-gradient-to-br ${theme.conic}`}>
                                    <img 
                                        src={member.photoUrl || "https://beeimg.com/images/s77882238754.png"} 
                                        alt={member.nickname} 
                                        className="w-full h-full rounded-full object-cover bg-black border border-black/50"
                                    />
                                    {isPlaying && (
                                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-black animate-pulse z-20"></div>
                                    )}
                                </div>
                                <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center ${theme.badge} border border-white dark:border-black shadow-sm overflow-hidden`}>
                                    {/* Using Tier Image Icon */}
                                    <img src={theme.iconUrl} alt="Tier" className="w-4 h-4 object-contain" />
                                </div>
                            </div>

                            {/* Identity Section - STRICTLY NICKNAME ONLY */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <h3 className={`font-bold text-sm sm:text-base leading-tight truncate ${theme.text}`}>
                                        {member.nickname}
                                    </h3>
                                    {member.membershipId.includes('MYTHICAL_IMMORTAL') && <span className="text-[9px] font-black text-red-500 animate-pulse">GOD</span>}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
                                    <span className={`font-black uppercase ${theme.text}`}>{member.membershipId.replace('MYTHICAL_', 'M.')}</span>
                                </div>
                            </div>

                            {/* Action Buttons (Compact) */}
                            <div className="flex flex-col gap-1 shrink-0">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setEditingMember(member); }} 
                                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-palette-mustard hover:bg-palette-mustard/10 transition-colors"
                                >
                                    <Edit2 size={14} />
                                </button>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); handleCopyLink(member.nickname); }} 
                                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                                >
                                    <Copy size={14} />
                                </button>
                                {/* Added Delete Button */}
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setDeletingMemberId(member.id); }} 
                                    className="p-1.5 rounded-lg bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>

                        {/* Slim Stats Grid */}
                        <div className="px-3 pb-3 sm:px-4 sm:pb-4 mt-auto">
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 flex items-center justify-between border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                        <Clock size={12} />
                                        <span className="text-[9px] font-bold uppercase">Main</span>
                                    </div>
                                    <span className={`text-xs font-black ${theme.text}`}>
                                        {/* INTEGER DISPLAY */}
                                        {realtimePlaytime.toFixed(0)}h
                                    </span>
                                </div>
                                <div className="bg-slate-50 dark:bg-white/5 rounded-lg p-2 flex items-center justify-between border border-slate-100 dark:border-white/5">
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                        <Gift size={12} className={member.freeHoursBalance > 0 ? "text-emerald-500" : ""} />
                                        <span className="text-[9px] font-bold uppercase">Bonus</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                        {member.freeHoursBalance}h
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );})}
            </div>
        )}

        {/* PAGINATION UI */}
        {renderPagination()}
      </div>

      {/* ADD MEMBER MODAL - (Admin only view, Full Name Allowed) */}
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
                              <div onClick={() => photoInputRef.current?.click()} className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-palette-mustard transition-colors relative overflow-hidden group">
                                  {isProcessingPhoto ? <Loader2 className="animate-spin text-palette-mustard" /> : newPhoto ? <img src={newPhoto} className="w-full h-full object-cover" /> : <Camera className="text-slate-400 group-hover:text-palette-mustard" />}
                              </div>
                              <div className="flex-1">
                                  <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Foto Profil</label>
                                  <input type="text" placeholder="https://..." value={newPhoto} onChange={e => setNewPhoto(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-palette-mustard" />
                                  <input type="file" ref={photoInputRef} onChange={e => handlePhotoUpload(e, false)} className="hidden" accept="image/*" />
                                  <button type="button" onClick={() => photoInputRef.current?.click()} className="mt-2 text-[10px] font-bold text-palette-mustard hover:underline flex items-center gap-1"><ImagePlus size={10} /> Upload dari Galeri</button>
                              </div>
                          </div>

                          {/* 1. Nama Lengkap & Panggilan - Full Name input is retained for Admin record */}
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

                          {/* 2. No WA & Alamat (Default Nyomplong) */}
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('phone')} (WA)</label>
                              <div className="relative">
                                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                  <input type="tel" inputMode="numeric" pattern="[0-9]*" value={newPhone} onChange={e => setNewPhone(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" placeholder="08..." />
                              </div>
                          </div>
                          <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-500 uppercase">{t('address')}</label>
                               <div className="relative">
                                  <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                                  <textarea rows={2} value={newAddress} onChange={e => setNewAddress(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white resize-none" placeholder="Alamat lengkap..." />
                               </div>
                          </div>

                          {/* 3. Membership & Tanggal Daftar */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('membership')}</label>
                                  <select value={newTier} onChange={e => setNewTier(e.target.value as MembershipTierId)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white appearance-none">
                                      {membershipConfigs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('join_date')}</label>
                                  <input type="date" value={newJoinDate} onChange={e => setNewJoinDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                          </div>

                          {/* 4. Tanggal Lahir & Bonus */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('dob')}</label>
                                  <input type="date" value={newDob} onChange={e => setNewDob(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('bonus_balance')} (Y Jam)</label>
                                  <div className="relative">
                                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input type="number" inputMode="numeric" value={newBonusBalance} onChange={e => setNewBonusBalance(parseInt(e.target.value) || 0)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                                  </div>
                              </div>
                          </div>
                          
                          <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-500 uppercase">{t('notes')}</label>
                               <div className="relative">
                                  <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                                  <textarea rows={2} value={newNotes} onChange={e => setNewNotes(e.target.value)} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white resize-none" placeholder={t('notes_placeholder')} />
                                </div>
                               <p className="text-[9px] text-slate-400">*Catatan ini akan otomatis terisi riwayat bonus ulang tahun.</p>
                          </div>
                      </form>
                  </div>
                  <div className="p-5 border-t border-slate-100 dark:border-white/5 shrink-0">
                      <button type="submit" form="add-member-form" className="w-full py-4 bg-palette-mustard text-white rounded-xl font-bold shadow-lg shadow-palette-mustard/20 hover:bg-palette-mustard/90 active:scale-95 transition-all">{t('save')}</button>
                  </div>
              </div>
          </div>
      )}

      {/* EDIT MEMBER MODAL - (Admin only view, Full Name Allowed) */}
      {editingMember && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
              <div className="bg-white dark:bg-palette-navyLight w-full max-w-lg sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh]">
                  <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center shrink-0">
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2"><Edit2 size={20} className="text-palette-mustard"/> {t('edit_member')}</h3>
                      <button onClick={() => setEditingMember(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18} /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-6">
                      <form id="edit-member-form" onSubmit={handleUpdateMember} className="space-y-4">
                          {/* Photo - Same Layout */}
                          <div className="flex items-center gap-4 mb-4">
                              <div onClick={() => editPhotoInputRef.current?.click()} className="w-24 h-24 rounded-full bg-slate-100 dark:bg-white/5 border-2 border-dashed border-slate-300 dark:border-white/10 flex items-center justify-center cursor-pointer hover:border-palette-mustard transition-colors relative overflow-hidden group">
                                  {isProcessingPhoto ? <Loader2 className="animate-spin text-palette-mustard" /> : <img src={editingMember.photoUrl || "https://beeimg.com/images/s77882238754.png"} className="w-full h-full object-cover" />}
                              </div>
                              <div className="flex-1">
                                  <input type="text" value={editingMember.photoUrl || ''} onChange={e => setEditingMember({...editingMember, photoUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-palette-mustard mb-2" placeholder="URL Foto..." />
                                  <input type="file" ref={editPhotoInputRef} onChange={e => handlePhotoUpload(e, true)} className="hidden" accept="image/*" />
                                  <button type="button" onClick={() => editPhotoInputRef.current?.click()} className="text-[10px] font-bold text-palette-mustard hover:underline flex items-center gap-1"><ImagePlus size={10} /> Ganti Foto</button>
                              </div>
                          </div>

                          {/* 1. Nama Lengkap & Panggilan */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('full_name')}</label>
                                  <input required type="text" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nickname</label>
                                  <input type="text" value={editingMember.nickname} onChange={e => setEditingMember({...editingMember, nickname: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                          </div>
                          
                          {/* 2. No WA & Alamat */}
                          <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">{t('phone')}</label>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input type="tel" inputMode="numeric" pattern="[0-9]*" value={editingMember.phone || ''} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                          </div>
                          <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-500 uppercase">{t('address')}</label>
                               <div className="relative">
                                  <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                                  <textarea rows={2} value={editingMember.address || 'Nyomplong'} onChange={e => setEditingMember({...editingMember, address: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white resize-none" />
                               </div>
                          </div>

                          {/* 3. Membership & Tanggal Daftar */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('membership')}</label>
                                  <select value={editingMember.membershipId} onChange={e => setEditingMember({...editingMember, membershipId: e.target.value as MembershipTierId})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white">
                                      {membershipConfigs.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                  </select>
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('join_date')}</label>
                                  <input type="date" value={editingMember.joinDate ? editingMember.joinDate.split('T')[0] : ''} onChange={e => setEditingMember({...editingMember, joinDate: new Date(e.target.value).toISOString()})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                          </div>

                          {/* 4. Tanggal Lahir & Bonus (Edit Only) */}
                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('dob')}</label>
                                  <input type="date" value={editingMember.dateOfBirth ? editingMember.dateOfBirth.split('T')[0] : ''} onChange={e => setEditingMember({...editingMember, dateOfBirth: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                              </div>
                              <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('bonus_balance')} (Y Jam)</label>
                                  <div className="relative">
                                      <Gift className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                      <input type="number" inputMode="numeric" value={editingMember.freeHoursBalance} onChange={e => setEditingMember({...editingMember, freeHoursBalance: parseInt(e.target.value) || 0})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm font-mono focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white" />
                                  </div>
                              </div>
                          </div>

                          {/* 5. Catatan */}
                          <div className="space-y-1.5">
                               <label className="text-[10px] font-bold text-slate-500 uppercase">{t('notes')}</label>
                               <div className="relative">
                                  <FileText className="absolute left-3 top-3 text-slate-400" size={16} />
                                  <textarea rows={3} value={editingMember.notes || ''} onChange={e => setEditingMember({...editingMember, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white resize-none" />
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
          <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
              <div className="bg-white dark:bg-palette-navyLight sm:rounded-3xl rounded-t-3xl w-full max-w-sm shadow-2xl p-6 text-center">
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
