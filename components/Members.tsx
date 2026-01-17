import React, { useState, useEffect } from 'react';
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
  
  // Search & Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTier, setFilterTier] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  
  // Modal States
  const [isAdding, setIsAdding] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [upgradingMember, setUpgradingMember] = useState<Member | null>(null);
  const [selectedUpgradeTier, setSelectedUpgradeTier] = useState<MembershipTierId>('PLUS');
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const [inputUrlMode, setInputUrlMode] = useState(false);
  const [tempImgUrl, setTempImgUrl] = useState('');

  // Delete Confirmation State
  const [deletingMember, setDeletingMember] = useState<Member | null>(null);

  // Form State
  const initialForm = { 
    name: '',
    nickname: '',
    phone: '', 
    address: 'Nyomplong', 
    status: MemberStatus.ACTIVE, 
    membershipId: 'BASIC' as MembershipTierId,
    notes: '',
    joinDate: new Date().toISOString().split('T')[0],
    dateOfBirth: '',
    photoUrl: '' 
  };
  const [formData, setFormData] = useState(initialForm);

  // Helper: Auto Capitalize Words (febri -> Febri)
  const toTitleCase = (str: string) => {
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Date Formatting Helper
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Filter & Sort Logic
  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          m.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.phone && m.phone.includes(searchTerm));
    
    const matchesTier = filterTier === 'ALL' ? true : m.membershipId === filterTier;

    return matchesSearch && matchesTier;
  }).sort((a, b) => {
    switch (sortOption) {
      case 'NAME_ASC': return a.nickname.localeCompare(b.nickname);
      case 'NAME_DESC': return b.nickname.localeCompare(a.nickname);
      case 'PLAYTIME_DESC': return b.totalPlayTime - a.totalPlayTime;
      case 'JOIN_DATE_ASC': return new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime();
      default: return 0;
    }
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentMembers = filteredMembers.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterTier, sortOption]);

  const validateForm = (name: string, phone: string, nickname: string): boolean => {
      if (!name.trim()) { addToast('error', 'Validasi Gagal', 'Nama lengkap tidak boleh kosong.'); return false; }
      if (!nickname.trim()) { addToast('error', 'Validasi Gagal', 'Nama panggilan tidak boleh kosong.'); return false; }
      if (name.length < 3) { addToast('error', 'Validasi Gagal', 'Nama member minimal 3 karakter.'); return false; }
      if (phone && phone.trim() !== '') {
          if (!/^\d+$/.test(phone)) { addToast('error', 'Validasi Gagal', 'Nomor HP hanya boleh berisi angka.'); return false; }
          if (phone.length < 10 || phone.length > 15) { addToast('error', 'Validasi Gagal', 'Nomor HP tidak valid.'); return false; }
      }
      return true;
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
    const file = e.target.files?.[0];
    if (file) processAndSetImage(file, isEdit);
  };

  const handleUrlSubmit = async (isEdit: boolean) => {
      if (!tempImgUrl) return;
      processAndSetImage(tempImgUrl, isEdit);
      setInputUrlMode(false);
      setTempImgUrl('');
  };

  const processAndSetImage = async (source: File | string, isEdit: boolean) => {
    setIsProcessingImg(true);
    try {
        const optimizedBase64 = await optimizeImage(source);
        if(isEdit && editingMember) {
            setEditingMember({ ...editingMember, photoUrl: optimizedBase64 });
        } else {
            setFormData({ ...formData, photoUrl: optimizedBase64 });
        }
        addToast('success', 'Foto Berhasil Diproses', 'Gambar telah dioptimasi.');
    } catch (error) {
        addToast('error', 'Gagal', 'Pastikan URL valid atau file tidak rusak.');
    } finally {
        setIsProcessingImg(false);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalNickname = formData.nickname.trim();
    if (!finalNickname && formData.name) finalNickname = formData.name.trim().split(' ')[0];
    if (!validateForm(formData.name, formData.phone, finalNickname)) return;

    const normalizedName = formData.name.trim().toLowerCase();
    const existingMember = members.find(m => m.name.toLowerCase() === normalizedName);

    if (existingMember) {
        const newAddress = (formData.address || '').trim().toLowerCase();
        const oldAddress = (existingMember.address || '').trim().toLowerCase();
        const isAddressMatch = oldAddress === newAddress || oldAddress === '';
        
        if (isAddressMatch) {
            const mergedMember: Member = {
                ...existingMember,
                nickname: finalNickname || existingMember.nickname,
                phone: formData.phone || existingMember.phone,
                address: formData.address || existingMember.address,
                dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : existingMember.dateOfBirth,
                photoUrl: formData.photoUrl || existingMember.photoUrl,
                notes: (existingMember.notes || '') + (formData.notes ? `\n${formData.notes}` : ''),
                synced: false
            };
            updateMember(mergedMember);
            setFormData(initialForm);
            setIsAdding(false);
            addToast('info', 'Data Digabungkan', `Data ${existingMember.name} diperbarui.`);
            return;
        } 
        addToast('warning', 'Nama Sama', 'Member baru dibuat karena Alamat berbeda.');
    }

    addMember({
        name: formData.name.trim(),
        nickname: finalNickname,
        phone: formData.phone.trim(),
        address: formData.address || 'Nyomplong',
        joinDate: new Date(formData.joinDate).toISOString(),
        dateOfBirth: formData.dateOfBirth ? new Date(formData.dateOfBirth).toISOString() : undefined,
        status: MemberStatus.ACTIVE,
        membershipId: formData.membershipId,
        notes: formData.notes,
        photoUrl: formData.photoUrl
    });
    setFormData(initialForm);
    setIsAdding(false);
    addToast('success', 'Berhasil', `${formData.name} ditambahkan.`);
  };

  const handleUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingMember) {
        if (!validateForm(editingMember.name, editingMember.phone || '', editingMember.nickname)) return;
        updateMember({
            ...editingMember,
            name: editingMember.name.trim(),
            nickname: editingMember.nickname.trim(),
            phone: editingMember.phone?.trim()
        });
        setEditingMember(null);
        addToast('success', 'Berhasil', 'Data diperbarui.');
    }
  };

  const handleUpgrade = (e: React.FormEvent) => {
    e.preventDefault();
    if(upgradingMember) {
      upgradeMember(upgradingMember.id, selectedUpgradeTier);
      setUpgradingMember(null);
      addToast('success', 'Upgrade Berhasil', `Membership ${upgradingMember.nickname} diperbarui.`);
    }
  };

  // --- DELETE CONFIRMATION HANDLERS ---
  const openConfirmDelete = (member: Member) => {
    setDeletingMember(member);
  };

  const executeDelete = () => {
    if(!deletingMember) return;
    deleteMember(deletingMember.id);
    addToast('info', 'Member Dihapus', `Data ${deletingMember.name} telah dihapus dari sistem.`);
    setDeletingMember(null);
  };

  const copyPublicLink = (nickname: string) => {
      // Force nickname to lowercase in URL for better aesthetics
      const url = `${window.location.origin}/member/${encodeURIComponent(nickname.toLowerCase())}`;
      navigator.clipboard.writeText(url).then(() => addToast('success', 'Link Disalin', `URL siap dibagikan.`));
  };

  const openEdit = (m: Member) => { setEditingMember(m); setInputUrlMode(false); }
  const getMembershipConfig = (id: string) => membershipConfigs.find(c => c.id === id) || membershipConfigs[0];
  const getMembershipIcon = (id: string) => {
      switch(id) {
          case 'VIP': return <Crown size={12} className="fill-current"/>;
          case 'PLUS': return <Star size={12} className="fill-current"/>;
          default: return <Shield size={12} className="fill-current"/>;
      }
  }

  const getCardStyle = (id: string) => {
    switch(id) {
      case 'VIP':
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
        return {
          card: 'bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700 border-purple-500',
          text: 'text-white',
          subText: 'text-white/70',
          statsBg: 'bg-white/20 border-white/10',
          barBg: 'bg-black/20',
          barFill: 'bg-white',
          iconColor: 'text-white',
          shineOpacity: 'opacity-20'
        };
      default:
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

  const getEffectiveRate = (m: Member) => {
    if (m.totalPlayTime === 0) return 0;
    return Math.round(m.totalAmountPaid / m.totalPlayTime);
  };

  const renderPageButton = (page: number) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={`w-9 h-9 rounded-lg font-bold text-xs transition-all ${
        currentPage === page
          ? 'bg-palette-mustard text-white shadow-lg shadow-palette-mustard/30 scale-105'
          : 'bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
      }`}
    >
      {page}
    </button>
  );

  const renderPaginationNumbers = () => {
    if (totalPages <= 6) return Array.from({ length: totalPages }, (_, i) => i + 1).map(renderPageButton);
    const pages: (number | string)[] = [];
    pages.push(1, 2);
    let start = Math.max(3, currentPage - 1);
    let end = Math.min(totalPages - 2, currentPage + 1);
    if (currentPage <= 3) end = 4;
    if (currentPage >= totalPages - 2) start = totalPages - 3;
    if (start > 3) pages.push('...');
    for (let i = start; i <= end; i++) { if (i > 2 && i < totalPages - 1) pages.push(i); }
    if (end < totalPages - 2) pages.push('...');
    pages.push(totalPages - 1, totalPages);
    return pages.map((page, index) => {
        if (page === '...') return <span key={`dots-${index}`} className="px-2 text-slate-400 select-none">...</span>;
        return renderPageButton(page as number);
    });
  };

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="mb-2 xl:mb-0">
           <h2 className="text-xl font-bold text-palette-navy dark:text-white">{t('members')}</h2>
           <p className="text-palette-brown/70 dark:text-palette-cream/60 text-xs">{t('manage_members_desc')}</p>
        </div>
        
        {/* RESPONSIVE FILTER GRID SYSTEM */}
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-3 items-center">
          
          {/* Search */}
          <div className="relative col-span-2 md:col-span-12 lg:flex-1 lg:w-auto lg:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Tier Filter */}
          <div className="relative col-span-1 md:col-span-4 lg:w-40">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="h-11 pl-10 pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer truncate"
             >
                <option value="ALL">{t('all')}</option>
                {membershipConfigs.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                ))}
             </select>
          </div>

          {/* Sort */}
          <div className="relative col-span-1 md:col-span-4 lg:w-48">
            <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <select 
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="h-11 pl-10 pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer truncate"
            >
              <option value="NAME_ASC">{t('sort_name_asc')}</option>
              <option value="NAME_DESC">{t('sort_name_desc')}</option>
              <option value="PLAYTIME_DESC">{t('sort_playtime')}</option>
              <option value="JOIN_DATE_ASC">{t('sort_join')}</option>
            </select>
          </div>

          {/* Add Button */}
          <button 
            onClick={() => { setIsAdding(true); setInputUrlMode(false); }}
            className="col-span-2 md:col-span-4 lg:w-auto h-11 px-6 rounded-xl flex items-center justify-center gap-2 text-sm font-bold shadow-md transition-all bg-palette-mustard text-white hover:bg-palette-mustard/90 shadow-palette-mustard/30 whitespace-nowrap active:scale-95"
          >
            <UserPlus size={18} /> {t('add_member')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="space-y-4">
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-1.5 bg-palette-mustard/10 rounded-lg text-palette-mustard dark:text-palette-yellow shadow-sm">
            <Users size={18} />
          </div>
          <h3 className="text-lg font-bold text-palette-navy dark:text-white">
            {t('members')}
          </h3>
          <span className="ml-auto text-[10px] font-bold text-palette-brown/70 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full shadow-sm">
            Total: {filteredMembers.length}
          </span>
        </div>

        {/* Member Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 min-h-[400px]">
           {currentMembers.map(member => {
             const membership = getMembershipConfig(member.membershipId);
             const isExpired = member.membershipExpiryDate && new Date() > new Date(member.membershipExpiryDate);
             const effectiveRate = getEffectiveRate(member);
             const style = getCardStyle(member.membershipId);
             const avatarSrc = member.photoUrl ? member.photoUrl : "https://beeimg.com/images/s77882238754.png";

             return (
             <div key={member.id} className={`rounded-2xl border shadow-sm hover:shadow-md transition-all duration-300 group flex flex-col relative overflow-hidden ${style.card}`}>
                <div className={`absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white to-transparent -translate-x-full animate-shimmer pointer-events-none z-0 ${style.shineOpacity}`} style={{ width: '200%' }}></div>
                <div className="relative z-10 p-4 pb-2 flex justify-between items-start">
                   <div className="flex gap-3 items-center min-w-0 flex-1 mr-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-inner ${style.statsBg} backdrop-blur-sm overflow-hidden border border-white/20 shrink-0`}>
                         <img src={avatarSrc} alt={member.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                         <h3 className={`font-bold text-base leading-tight truncate ${style.text}`} title={member.name}>{member.nickname}</h3>
                         <div className="flex flex-col gap-1 mt-1">
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide w-fit backdrop-blur-md shadow-sm border border-white/10 ${style.statsBg} ${style.text}`}>
                                {getMembershipIcon(membership.id)} 
                                <span>{membership.name}</span>
                                {isExpired && <span className="text-red-500 ml-1 font-black">!</span>}
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => { e.stopPropagation(); copyPublicLink(member.nickname); }} className={`p-1.5 rounded-lg transition-colors ${style.statsBg} ${style.iconColor} hover:bg-white hover:text-black`} title="Salin Link"><Copy size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); setUpgradingMember(member); setSelectedUpgradeTier(member.membershipId === 'BASIC' ? 'PLUS' : 'VIP'); }} className={`p-1.5 rounded-lg transition-colors ${style.statsBg} ${style.iconColor} hover:bg-white hover:text-black`} title="Upgrade"><ArrowUpCircle size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); openEdit(member); }} className={`p-1.5 rounded-lg transition-colors ${style.statsBg} ${style.iconColor} hover:bg-white hover:text-black`}><Edit2 size={16}/></button>
                      <button onClick={(e) => { e.stopPropagation(); openConfirmDelete(member); }} className={`p-1.5 rounded-lg transition-colors ${style.statsBg} text-red-500 hover:bg-red-500 hover:text-white`}><Trash2 size={16}/></button>
                   </div>
                </div>
                
                <div className="relative z-10 px-4 py-2 grid grid-cols-2 gap-2">
                    <div className={`p-2.5 rounded-xl backdrop-blur-sm ${style.statsBg}`}>
                       <p className={`text-[9px] uppercase font-bold mb-0.5 opacity-80 ${style.text}`}>{t('total_play')}</p>
                       <p className={`text-base font-black flex items-center gap-1 ${style.text}`}><Clock size={14} className="opacity-80"/> {member.totalPlayTime} {t('hour_short')}</p>
                    </div>
                    <div className={`p-2.5 rounded-xl backdrop-blur-sm ${style.statsBg}`}>
                       <p className={`text-[9px] uppercase font-bold mb-0.5 opacity-80 ${style.text}`}>{t('bonus_balance')}</p>
                       <p className={`text-base font-black flex items-center gap-1 ${style.text}`}><Gift size={14} className="opacity-80"/> {member.freeHoursBalance} {t('hour_short')}</p>
                    </div>
                </div>

                <div className="relative z-10 px-4 pb-4 mt-auto">
                   <div className={`pt-3 mt-1 border-t border-dashed ${style.statsBg.split(' ')[1] || 'border-black/10'} space-y-2`}>
                       <div className={`flex justify-between text-[10px] font-medium ${style.text}`}>
                          <span className="opacity-80">{t('bonus_progress')}</span>
                          <span className="font-bold">{member.hoursProgressToNextBonus}/{membership.bonusThreshold} {t('hour_short')}</span>
                       </div>
                       <div className={`w-full h-2 rounded-full overflow-hidden ${style.barBg}`}>
                          <div className={`h-full rounded-full transition-all duration-500 shadow-sm ${style.barFill}`} style={{ width: `${Math.min((member.hoursProgressToNextBonus / membership.bonusThreshold) * 100, 100)}%` }} />
                       </div>
                       
                       <div className="flex items-center justify-between pt-1">
                           <div className={`flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-md ${style.statsBg} ${style.text}`}><TrendingDown size={10}/> Rp {effectiveRate.toLocaleString()}/{t('hour_short')}</div>
                           <div className={`text-[9px] font-medium text-right opacity-70 ${style.text}`}>{t('since')}: {formatDate(member.joinDate)}</div>
                       </div>
                   </div>
                </div>
             </div>
           )})}
           
           {currentMembers.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-slate-500 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/10">
                <div className="p-4 md:p-6 bg-slate-50 dark:bg-white/5 rounded-full mb-3 md:mb-4"><Users className="w-8 h-8 md:w-12 md:h-12 text-slate-400/80" /></div>
                <p className="font-medium text-sm md:text-base">{t('no_data_members')}</p>
             </div>
           )}
        </div>

        {/* PAGINATION CONTROLS */}
        {totalPages > 1 && (
           <div className="flex items-center justify-center mt-6 pb-4 animate-fade-in">
              <div className="md:hidden flex items-center gap-4">
                 <button onClick={() => setCurrentPage(1)} disabled={currentPage === 1} className="p-2.5 rounded-full bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"><ChevronsLeft size={16} /></button>
                 <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="p-2.5 rounded-full bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"><ChevronLeft size={16} /></button>
                 <span className="text-xs font-bold text-slate-500 dark:text-slate-400">{currentPage} / {totalPages}</span>
                 <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="p-2.5 rounded-full bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"><ChevronRight size={16} /></button>
                 <button onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} className="p-2.5 rounded-full bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95 transition-all"><ChevronsRight size={16} /></button>
              </div>
              <div className="hidden md:flex items-center gap-2">
                 <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-palette-mustard hover:bg-palette-mustard/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronLeft size={18} /></button>
                 {renderPaginationNumbers()}
                 <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-500 hover:text-palette-mustard hover:bg-palette-mustard/10 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"><ChevronRight size={18} /></button>
              </div>
           </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
           <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10 m-auto">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-palette-navy dark:text-white">{t('add_member')}</h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18}/></button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="md:col-span-2 flex flex-col items-center gap-3">
                   <div className="relative group">
                       <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-white/20 overflow-hidden bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                           {isProcessingImg ? <Loader2 className="w-6 h-6 animate-spin text-palette-mustard" /> : <img src={formData.photoUrl || "https://beeimg.com/images/s77882238754.png"} alt="Preview" className="w-full h-full object-cover" />}
                       </div>
                       <label className={`absolute bottom-0 right-0 p-1.5 bg-palette-mustard text-white rounded-full cursor-pointer hover:bg-palette-mustard/90 shadow-lg ${isProcessingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                           <Camera size={14} /><input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, false)} disabled={isProcessingImg} />
                       </label>
                       <button type="button" onClick={() => setInputUrlMode(!inputUrlMode)} className="absolute bottom-0 left-0 p-1.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-full cursor-pointer hover:text-palette-mustard shadow-lg border border-slate-200 dark:border-white/10"><LinkIcon size={14}/></button>
                   </div>
                   {inputUrlMode ? (
                        <div className="w-full max-w-xs animate-slide-in flex gap-2">
                            <input type="text" placeholder={t('paste_link_hint')} value={tempImgUrl} onChange={(e) => setTempImgUrl(e.target.value)} className="flex-1 bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-palette-mustard" />
                            <button type="button" onClick={() => handleUrlSubmit(false)} className="px-3 py-1.5 bg-palette-mustard text-white rounded-lg text-xs font-bold">OK</button>
                        </div>
                   ) : <p className="text-[10px] text-slate-500">{t('upload_or_url')}</p>}
                </div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('full_name')} <span className="text-palette-red">*</span></label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: toTitleCase(e.target.value)})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" placeholder={t('full_name')}/></div></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Panggilan <span className="text-palette-red">*</span></label><div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input required type="text" value={formData.nickname} onChange={e => setFormData({...formData, nickname: toTitleCase(e.target.value)})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" placeholder="Panggilan"/></div></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('membership_plan')}</label><div className="relative"><Crown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><select value={formData.membershipId} onChange={e => setFormData({...formData, membershipId: e.target.value as MembershipTierId})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm appearance-none h-12">{membershipConfigs.filter(c => c.isActive).map(c => (<option key={c.id} value={c.id}>{c.name}</option>))}</select></div></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('phone')}</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" placeholder="08..."/></div></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('address')}</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" placeholder={t('address_placeholder')}/></div></div>
                <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Cake size={12}/> {t('dob')}</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="date" value={formData.dateOfBirth} onChange={e => setFormData({...formData, dateOfBirth: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" /></div></div>
                <div className="md:col-span-2 space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('notes')}</label><div className="relative"><StickyNote className="absolute left-3 top-3 text-slate-400" size={14} /><textarea rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white resize-none text-sm" placeholder={t('notes_placeholder')}></textarea></div></div>
                <div className="md:col-span-2 pt-2"><button type="submit" disabled={isProcessingImg} className="w-full py-3 bg-palette-mustard text-white rounded-xl font-bold hover:bg-palette-mustard/90 shadow-lg shadow-palette-mustard/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm h-14"><Save size={16} /> {t('save')}</button></div>
              </form>
           </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingMember && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
            <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-lg shadow-2xl p-6 md:p-8 border border-slate-200 dark:border-white/10 m-auto">
               <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-palette-navy dark:text-white">{t('edit_member')}</h3>
                  <button onClick={() => setEditingMember(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18}/></button>
               </div>
               <form onSubmit={handleUpdate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 
                 {/* Photo Section */}
                 <div className="md:col-span-2 flex flex-col items-center gap-3">
                   <div className="relative group">
                       <div className="w-20 h-20 rounded-full border-2 border-slate-200 dark:border-white/20 overflow-hidden bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                           {isProcessingImg ? <Loader2 className="w-6 h-6 animate-spin text-palette-mustard" /> : <img src={editingMember.photoUrl || "https://beeimg.com/images/s77882238754.png"} alt="Preview" className="w-full h-full object-cover" />}
                       </div>
                       <label className={`absolute bottom-0 right-0 p-1.5 bg-palette-mustard text-white rounded-full cursor-pointer hover:bg-palette-mustard/90 shadow-lg ${isProcessingImg ? 'opacity-50 pointer-events-none' : ''}`}>
                           <Camera size={14} /><input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, true)} disabled={isProcessingImg} />
                       </label>
                       <button type="button" onClick={() => setInputUrlMode(!inputUrlMode)} className="absolute bottom-0 left-0 p-1.5 bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-200 rounded-full cursor-pointer hover:text-palette-mustard shadow-lg border border-slate-200 dark:border-white/10"><LinkIcon size={14}/></button>
                   </div>
                   {inputUrlMode && (
                        <div className="w-full max-w-xs animate-slide-in flex gap-2">
                            <input type="text" placeholder={t('paste_link_hint')} value={tempImgUrl} onChange={(e) => setTempImgUrl(e.target.value)} className="flex-1 bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-xs focus:ring-1 focus:ring-palette-mustard" />
                            <button type="button" onClick={() => handleUrlSubmit(true)} className="px-3 py-1.5 bg-palette-mustard text-white rounded-lg text-xs font-bold">OK</button>
                        </div>
                   )}
                 </div>

                 {/* Fields */}
                 <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('full_name')}</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input required type="text" value={editingMember.name} onChange={e => setEditingMember({...editingMember, name: toTitleCase(e.target.value)})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" /></div></div>
                 <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">Nama Panggilan</label><div className="relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input required type="text" value={editingMember.nickname} onChange={e => setEditingMember({...editingMember, nickname: toTitleCase(e.target.value)})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" /></div></div>
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('phone')}</label><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" value={editingMember.phone || ''} onChange={e => setEditingMember({...editingMember, phone: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" /></div></div>
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('address')}</label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" value={editingMember.address || ''} onChange={e => setEditingMember({...editingMember, address: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" /></div></div>
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1"><Cake size={12}/> {t('dob')}</label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="date" value={editingMember.dateOfBirth || ''} onChange={e => setEditingMember({...editingMember, dateOfBirth: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white text-sm h-12" /></div></div>
                 <div className="space-y-1.5 md:col-span-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">{t('notes')}</label><div className="relative"><StickyNote className="absolute left-3 top-3 text-slate-400" size={14} /><textarea rows={2} value={editingMember.notes || ''} onChange={e => setEditingMember({...editingMember, notes: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border-0 ring-1 ring-slate-200 dark:ring-white/10 rounded-xl pl-9 pr-4 py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none transition-all dark:text-white resize-none text-sm"></textarea></div></div>
                 <div className="md:col-span-2 pt-2"><button type="submit" disabled={isProcessingImg} className="w-full py-3 bg-palette-mustard text-white rounded-xl font-bold hover:bg-palette-mustard/90 shadow-lg shadow-palette-mustard/20 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-sm h-14"><Save size={16} /> {t('save')}</button></div>
               </form>
            </div>
         </div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingMember && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-zoom-in">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Konfirmasi Hapus</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                 Apakah Anda yakin untuk menghapus member <strong>{deletingMember.name}</strong> dari database?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setDeletingMember(null)}
                    className="py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-sm transition-colors"
                 >
                    Tidak
                 </button>
                 <button 
                    onClick={executeDelete}
                    className="py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20 transition-all"
                 >
                    Ya, Hapus
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Members;