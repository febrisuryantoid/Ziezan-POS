import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus, PaymentMethod, Console, Transaction, MemberStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Power, Timer, Wrench, Trash2, Play, Plus, X, Wallet, QrCode, CheckCircle, ArrowRight, Loader2, Edit2, Save, Search, Gamepad2, Gift, User, Clock, AlertCircle, PlusCircle, Hourglass, Printer, Bluetooth, Filter, ArrowUpDown, ChevronDown, Check, UserPlus, GripHorizontal, Image as ImageIcon, Link as LinkIcon, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { printReceiptBrowser, generateEscPosCommand } from '../utils/receipt';
import { useBluetooth } from '../contexts/BluetoothContext';
import { bluetoothService } from '../services/bluetooth';
import { useToast } from '../contexts/ToastContext';

type SortOption = 'NAME_ASC' | 'NAME_DESC' | 'USAGE_DESC' | 'STATUS';

const DEFAULT_CONSOLE_IMAGE = "https://beeimg.com/images/j43189671173.png";

const Consoles: React.FC<{ operatorName: string }> = ({ operatorName }) => {
  const { consoles, members, startRental, stopRental, updateConsoleStatus, addConsole, updateConsole, deleteConsole, settings, transactions, addMember } = useData();
  const { t } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt } = useBluetooth();
  const { addToast } = useToast();
  
  // Header State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modal State (Rental)
  const [selectedConsoleId, setSelectedConsoleId] = useState<string | null>(null);
  const [rentalMemberId, setRentalMemberId] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [currentStep, setCurrentStep] = useState<'INPUT' | 'PAYMENT' | 'QRIS' | 'CONFIRM'>('INPUT');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CASH');
  
  // Member Search State (Combobox)
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // New/Edit Console State
  const [isAdding, setIsAdding] = useState(false);
  const [editingConsole, setEditingConsole] = useState<Console | null>(null);
  const [newConsoleName, setNewConsoleName] = useState('');
  const [newConsoleImage, setNewConsoleImage] = useState('');
  
  // Delete Confirmation State
  const [deletingConsole, setDeletingConsole] = useState<Console | null>(null);

  // Print Selection
  const [printTx, setPrintTx] = useState<Transaction | null>(null);
  
  // Real-time ticker for progress bars
  const [now, setNow] = useState(new Date());

  // Check for Mobile View
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortOption]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsMemberDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredConsoles = useMemo(() => {
    return consoles.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' ? true : 
                            filterStatus === 'AVAILABLE' ? c.status === ConsoleStatus.AVAILABLE :
                            filterStatus === 'IN_USE' ? c.status === ConsoleStatus.IN_USE :
                            c.status === ConsoleStatus.MAINTENANCE;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      switch (sortOption) {
        case 'NAME_ASC': return a.name.localeCompare(b.name);
        case 'NAME_DESC': return b.name.localeCompare(a.name);
        case 'USAGE_DESC': return b.totalHoursUsed - a.totalHoursUsed;
        case 'STATUS': return a.status.localeCompare(b.status);
        default: return 0;
      }
    });
  }, [consoles, searchTerm, filterStatus, sortOption]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredConsoles.length / itemsPerPage);
  const currentConsoles = filteredConsoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Sort Members A-Z and filter for dropdown
  const sortedAndFilteredMembers = useMemo(() => {
      const activeMembers = members.filter(m => m.status === 'ACTIVE');
      const sorted = activeMembers.sort((a, b) => a.name.localeCompare(b.name));
      if (!memberSearchTerm) return sorted;
      const lowerTerm = memberSearchTerm.toLowerCase();
      return sorted.filter(m => m.name.toLowerCase().includes(lowerTerm) || m.nickname.toLowerCase().includes(lowerTerm));
  }, [members, memberSearchTerm]);

  const calculation = useMemo(() => {
    if (!rentalMemberId || !rentalDuration) return null;
    const member = members.find(m => m.id === rentalMemberId);
    if (!member) return null;

    let hoursToPay = rentalDuration;
    let freeHoursUsed = 0;
    let discount = 0;
    let totalBaseCost = rentalDuration * settings.hourlyRate;

    // AUTOMATIC BONUS CALCULATION
    if (member.freeHoursBalance > 0) {
      if (member.freeHoursBalance >= rentalDuration) {
        // Case 1: Bonus covers EVERYTHING
        freeHoursUsed = rentalDuration;
        discount = totalBaseCost;
        totalBaseCost = 0; // Cost is 0
      } else {
        // Case 2: Partial Bonus
        freeHoursUsed = member.freeHoursBalance;
        discount = freeHoursUsed * settings.hourlyRate;
        totalBaseCost = totalBaseCost - discount;
      }
    }

    return { totalCost: totalBaseCost, freeHoursUsed, finalHoursToPay: hoursToPay };
  }, [rentalMemberId, rentalDuration, members, settings.hourlyRate]);

  const resetModal = () => {
    setSelectedConsoleId(null);
    setRentalMemberId('');
    setMemberSearchTerm('');
    setRentalDuration(1);
    setCurrentStep('INPUT');
    setSelectedPayment('CASH');
  };

  const handleNextStep = () => {
    if (currentStep === 'INPUT' && rentalMemberId) setCurrentStep('PAYMENT');
    else if (currentStep === 'PAYMENT') {
        // Logic: If Cost is 0 (Full Bonus), skip QRIS check/step and go straight to confirm
        if (calculation?.totalCost === 0) {
            setCurrentStep('CONFIRM');
        } else {
            selectedPayment === 'QRIS' ? setCurrentStep('QRIS') : setCurrentStep('CONFIRM');
        }
    }
    else if (currentStep === 'QRIS') setCurrentStep('CONFIRM');
  };

  const handleConfirmRental = () => {
    if (selectedConsoleId && rentalMemberId) {
      startRental(rentalMemberId, selectedConsoleId, rentalDuration, operatorName, selectedPayment);
      resetModal();
    }
  };

  const handleQuickAddMember = () => {
      if (!memberSearchTerm.trim()) return;
      const name = memberSearchTerm.trim();
      const newMemberId = addMember({
          name: name,
          nickname: name.split(' ')[0], 
          phone: '',
          address: '-',
          status: MemberStatus.ACTIVE,
          membershipId: 'BASIC',
          notes: 'Added via Quick Rental',
          joinDate: new Date().toISOString()
      });
      setRentalMemberId(newMemberId);
      setIsMemberDropdownOpen(false);
      addToast('success', 'Member Baru Ditambahkan', `Member ${name} berhasil dibuat dan dipilih.`);
  };

  const handleAddConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(newConsoleName.trim()) {
      const normalizedName = newConsoleName.trim().toLowerCase();
      const isDuplicate = consoles.some(c => c.name.toLowerCase() === normalizedName);
      if (isDuplicate) { addToast('error', 'Duplikasi Nama', 'Nama unit ini sudah ada.'); return; }
      addConsole({ name: newConsoleName.trim(), imageUrl: newConsoleImage });
      setNewConsoleName('');
      setNewConsoleImage('');
      setIsAdding(false);
      addToast('success', 'Unit Ditambahkan', `Console ${newConsoleName} berhasil dibuat.`);
    }
  }

  const handleUpdateConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingConsole && editingConsole.name) {
      const normalizedName = editingConsole.name.trim().toLowerCase();
      const isDuplicate = consoles.some(c => c.id !== editingConsole.id && c.name.toLowerCase() === normalizedName);
      if (isDuplicate) { addToast('error', 'Duplikasi Nama', 'Nama unit ini sudah digunakan.'); return; }
      updateConsole(editingConsole.id, editingConsole.name.trim(), editingConsole.imageUrl);
      setEditingConsole(null);
      addToast('success', 'Unit Diperbarui', 'Data console berhasil diubah.');
    }
  }

  // --- DELETE CONFIRMATION HANDLERS ---
  const openConfirmDelete = (console: Console) => {
    setDeletingConsole(console);
  };

  const executeDelete = () => {
    if(!deletingConsole) return;
    
    const success = deleteConsole(deletingConsole.id);
    if(!success) {
      addToast('error', 'Gagal Menghapus', t('unit_in_use'));
    } else {
      addToast('info', 'Unit Dihapus', `Data ${deletingConsole.name} telah dihapus.`);
    }
    setDeletingConsole(null);
  };

  const handlePrintWifi = () => { if (printTx) { printReceiptBrowser(printTx, settings); setPrintTx(null); } };
  const handlePrintBluetooth = async () => {
    if (!printTx) return;
    if (!isBtConnected) { try { await connectBt(); } catch (e) { addToast('error', 'Koneksi Gagal', 'Gagal terhubung ke printer Bluetooth.'); return; } }
    const rawData = generateEscPosCommand(printTx, settings);
    const success = await bluetoothService.sendRawData(rawData);
    if (success) { addToast('success', 'Print Berhasil', 'Data dikirim.'); setPrintTx(null); } else { addToast('error', 'Print Gagal', 'Gagal mengirim data.'); }
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');
    return h > 0 ? `${h}:${mStr}:${sStr}` : `${mStr}:${sStr}`;
  };

  const getSessionDetails = (consoleId: string, sessionId?: string) => {
     if(!sessionId) return null;
     const tx = transactions.find(t => t.id === sessionId);
     if(!tx) return null;
     const startTime = new Date(tx.startTime).getTime();
     const durationMs = tx.durationHours * 60 * 60 * 1000;
     const endTime = startTime + durationMs;
     const currentTimeMs = now.getTime();
     const timeRemainingMs = endTime - currentTimeMs;
     const elapsedMs = currentTimeMs - startTime;
     const progress = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));
     const isOvertime = timeRemainingMs < 0;
     const isWarning = timeRemainingMs > 0 && timeRemainingMs <= (15 * 60 * 1000); 
     return { tx, progress, isOvertime, isWarning, formattedElapsed: formatTime(elapsedMs), formattedRemaining: formatTime(timeRemainingMs) };
  }

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
        <div className="flex justify-center items-center gap-2 mt-8 animate-fade-in">
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
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
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
    <div className="flex flex-col gap-6 pb-20">
      {/* 1. Header & Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="mb-2 xl:mb-0">
          <h2 className="text-xl font-bold text-palette-navy dark:text-white">{t('consoles')}</h2>
          <p className="text-palette-brown/70 dark:text-palette-cream/60 text-xs">{t('manage_units_desc')}</p>
        </div>
        
        {/* RESPONSIVE FILTER GRID SYSTEM */}
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-3 items-center min-w-0">
           
           {/* Search */}
           <div className="relative col-span-2 md:col-span-12 lg:flex-1 lg:w-auto lg:min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="search" 
              placeholder={t('search_placeholder')} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-11 pl-10 pr-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Sort */}
          <div className="relative col-span-1 md:col-span-6 lg:w-48">
             <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-11 pl-10 pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none truncate cursor-pointer"
             >
                <option value="NAME_ASC">{t('sort_name_asc')}</option>
                <option value="NAME_DESC">{t('sort_name_desc')}</option>
                <option value="USAGE_DESC">{t('sort_usage_desc')}</option>
                <option value="STATUS">{t('status')}</option>
             </select>
          </div>

          {/* Filter Status */}
          <div className="relative col-span-1 md:col-span-6 lg:w-40">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-11 pl-10 pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none truncate cursor-pointer"
             >
                <option value="ALL">{t('filter_all')}</option>
                <option value="AVAILABLE">{t('filter_avail')}</option>
                <option value="IN_USE">{t('filter_in_use')}</option>
             </select>
          </div>

          {/* Add Button */}
          <button 
            onClick={() => setIsAdding(true)}
            className="col-span-2 md:col-span-12 lg:w-auto h-11 px-6 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md bg-palette-mustard text-white hover:bg-palette-mustard/90 shadow-palette-mustard/30 whitespace-nowrap active:scale-95"
          >
            <Plus size={18} /> {t('add_unit')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="space-y-4">
        {/* Widget Header with Count Badge */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-palette-mustard/10 rounded-full text-palette-mustard dark:text-palette-yellow shadow-sm">
            <Gamepad2 size={18} />
          </div>
          <h3 className="text-lg font-bold text-palette-navy dark:text-white">
            {t('active_consoles')}
          </h3>
          <span className="ml-auto text-[10px] font-bold text-palette-brown/70 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full shadow-sm">
            Total Unit: {filteredConsoles.length}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5">
          {currentConsoles.map(console => {
            const isActive = console.status === ConsoleStatus.IN_USE;
            const isMaintenance = console.status === ConsoleStatus.MAINTENANCE;
            const session = isActive ? getSessionDetails(console.id, console.currentSessionId) : null;
            const imageUrl = console.imageUrl || DEFAULT_CONSOLE_IMAGE;
            
            return (
              <div key={console.id} className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col shadow-sm hover:shadow-xl dark:shadow-none bg-white dark:bg-palette-navyLight ${
                isActive ? 'border-palette-mustard ring-2 ring-palette-mustard/30' : isMaintenance ? 'border-palette-copper/30 opacity-90' : 'border-slate-200 dark:border-white/5 hover:border-palette-green/50 hover:-translate-y-1'
              }`}>
                {/* Image Container */}
                <div className="relative w-full aspect-square bg-white dark:bg-transparent overflow-hidden p-8 flex items-center justify-center">
                    <img src={imageUrl} alt={console.name} className={`w-full h-full object-contain transition-transform duration-700 group-hover:scale-110 drop-shadow-xl ${isMaintenance ? 'grayscale opacity-50' : isActive ? 'opacity-40' : 'opacity-100'}`} onError={(e) => (e.currentTarget.src = DEFAULT_CONSOLE_IMAGE)}/>
                    
                    <div className="absolute top-4 right-4 z-10">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide backdrop-blur-md shadow-lg border border-white/10 ${isActive ? (session?.isOvertime ? 'bg-red-500 text-white animate-pulse' : 'bg-palette-mustard text-white') : isMaintenance ? 'bg-orange-500 text-white' : 'bg-emerald-500 text-white'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full bg-white ${isActive ? 'animate-ping' : ''}`} />
                            {isActive ? (session?.isOvertime ? 'OVERTIME' : 'PLAYING') : isMaintenance ? 'MAINTENANCE' : 'READY'}
                        </span>
                    </div>

                    {/* ACTIVE SESSION OVERLAY */}
                    {isActive && session && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 z-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] overflow-hidden">
                            <div className="relative w-20 h-20 md:w-24 md:h-24 mb-3 shrink-0">
                                <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                                    <circle cx="50%" cy="50%" r="45%" stroke="rgba(255,255,255,0.3)" strokeWidth="8" fill="transparent" />
                                    <circle cx="50%" cy="50%" r="45%" stroke={session.isOvertime ? '#ef4444' : '#fbbf24'} strokeWidth="8" fill="transparent" strokeDasharray={283} strokeDashoffset={283 - (283 * session.progress) / 100} strokeLinecap="round" className="transition-all duration-1000 ease-linear"/>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                                    <span className="text-lg md:text-xl font-black font-mono shadow-black drop-shadow-md tracking-tight">{session.formattedRemaining}</span>
                                    <span className="text-[8px] md:text-[9px] uppercase opacity-90 font-bold bg-black/20 px-2 rounded-full mt-0.5">{t('remaining')}</span>
                                </div>
                            </div>
                            
                            {/* Member Name Badge - ROUNDED FULL */}
                            <div className="bg-white/90 dark:bg-black/60 backdrop-blur-md rounded-full px-4 py-1.5 md:px-5 md:py-2 text-slate-900 dark:text-white flex items-center gap-2 border border-white/20 shadow-xl max-w-full z-10">
                                <User size={12} className="text-palette-mustard shrink-0"/>
                                <span className="text-[10px] md:text-xs font-bold truncate max-w-[100px] md:max-w-[120px]">{session.tx.memberName}</span>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons (Edit/Delete) */}
                    <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <button onClick={(e) => { e.stopPropagation(); setEditingConsole(console); setNewConsoleImage(console.imageUrl || ''); }} className="p-2 bg-white/90 hover:bg-white text-slate-700 shadow-md rounded-full backdrop-blur-md transition-colors"><Edit2 size={14}/></button>
                        <button onClick={(e) => { e.stopPropagation(); updateConsoleStatus(console.id, isMaintenance ? ConsoleStatus.AVAILABLE : ConsoleStatus.MAINTENANCE); }} className="p-2 bg-white/90 hover:bg-orange-500 hover:text-white text-slate-700 shadow-md rounded-full backdrop-blur-md transition-colors"><Wrench size={14}/></button>
                        {!isActive && (
                            <button onClick={(e) => { e.stopPropagation(); openConfirmDelete(console); }} className="p-2 bg-white/90 hover:bg-red-500 hover:text-white text-slate-700 shadow-md rounded-full backdrop-blur-md transition-colors"><Trash2 size={14}/></button>
                        )}
                    </div>
                </div>
                
                {/* Body Content */}
                <div className="p-5 flex flex-col gap-3 flex-1 justify-between bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-white/5">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate text-center" title={console.name}>{console.name}</h3>
                        {isActive && session && (<div className="flex justify-center items-center mt-1 text-xs text-slate-500 dark:text-slate-400"><span>{t('elapsed')}: <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{session.formattedElapsed}</span></span></div>)}
                        {!isActive && !isMaintenance && (<p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center justify-center gap-1"><CheckCircle size={12}/> Siap Digunakan</p>)}
                        {isMaintenance && (<p className="text-xs text-orange-500 font-medium mt-1 flex items-center justify-center gap-1"><Wrench size={12}/> Perbaikan</p>)}
                    </div>
                    {isActive ? (
                        <div className="grid grid-cols-4 gap-2">
                            <button className="col-span-1 py-2.5 rounded-xl bg-white dark:bg-white/10 border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/20 flex flex-col items-center justify-center transition-colors shadow-sm" title="Extend 1 Hour"><PlusCircle size={18}/></button>
                            <button onClick={() => session && setPrintTx(session.tx)} className="col-span-1 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 flex flex-col items-center justify-center transition-colors shadow-sm" title="Print Struk"><Printer size={18}/></button>
                            <button onClick={() => console.currentSessionId && stopRental(console.currentSessionId)} className="col-span-2 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs transition-all shadow-md shadow-red-500/20 flex items-center justify-center gap-2"><Power size={16} /> {t('stop_session')}</button>
                        </div>
                    ) : isMaintenance ? (
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/10 rounded-xl text-center border border-orange-200 dark:border-orange-900/30"><span className="text-xs font-bold text-orange-600 dark:text-orange-400">MAINTENANCE MODE</span></div>
                    ) : (
                        <button onClick={() => setSelectedConsoleId(console.id)} className="w-full py-3.5 bg-palette-mustard text-white rounded-xl font-bold transition-all shadow-lg shadow-palette-mustard/20 hover:bg-palette-mustard/90 hover:-translate-y-0.5 active:scale-95 flex items-center justify-center gap-2 group/btn"><Play size={20} className="fill-current group-hover/btn:scale-110 transition-transform" /> <span className="text-sm">{t('rent_unit')}</span></button>
                    )}
                </div>
              </div>
            );
          })}
           {filteredConsoles.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-slate-500 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/10">
               <div className="p-4 md:p-6 bg-slate-50 dark:bg-white/5 rounded-full mb-3 md:mb-4"><Gamepad2 className="w-8 h-8 md:w-12 md:h-12 text-slate-400/80" /></div>
               <p className="font-medium text-sm md:text-base">{t('no_data_consoles')}</p>
             </div>
           )}
        </div>

        {/* PAGINATION UI */}
        {renderPagination()}
      </div>

      {/* RENTAL MODAL */}
      {selectedConsoleId && (
         <div className="fixed inset-0 z-[100] flex items-center sm:items-center justify-center sm:bg-palette-navy/80 bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
           <div className="absolute inset-0 sm:hidden" onClick={resetModal}></div>
           <div className={`bg-white dark:bg-palette-navyLight w-full max-w-lg shadow-2xl overflow-hidden border-t sm:border border-slate-200 dark:border-white/10 flex flex-col ${isMobile ? 'fixed bottom-0 rounded-t-3xl max-h-[90vh] animate-slide-in' : 'rounded-3xl max-h-[90vh] relative'}`}>
              {isMobile && <div className="w-full flex justify-center pt-3 pb-1" onClick={resetModal}><div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-600 rounded-full"></div></div>}
              {/* Modal Body */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5"><div><h3 className="text-lg font-bold text-palette-navy dark:text-white flex items-center gap-2"><Gamepad2 className="text-palette-mustard" size={20} />{consoles.find(c => c.id === selectedConsoleId)?.name}</h3><p className="text-xs text-slate-500 dark:text-slate-400">{t('new_rental_session')}</p></div><button onClick={resetModal} className="p-2 bg-white dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors border border-slate-200 dark:border-white/10 text-slate-500"><X size={18}/></button></div>
              <div className="p-6 overflow-y-auto">
                  {/* ... Steps (INPUT, PAYMENT, QRIS, CONFIRM) ... */}
                  {currentStep === 'INPUT' && (
                    <div className="space-y-5">
                       <div className="space-y-2 relative" ref={dropdownRef}><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><User size={12}/> {t('select_member')}</label><div className="relative"><User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />{rentalMemberId ? (<div className="w-full bg-palette-mustard/10 border border-palette-mustard text-palette-navy dark:text-white text-sm rounded-xl pl-10 pr-10 py-3 font-bold flex items-center justify-between"><span>{members.find(m => m.id === rentalMemberId)?.name}</span><button onClick={() => { setRentalMemberId(''); setMemberSearchTerm(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-white/50 hover:bg-white text-palette-mustard"><X size={14} /></button></div>) : (<input type="search" className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-sm rounded-xl pl-10 pr-10 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none font-medium h-12 placeholder-slate-400" placeholder="Ketik nama member..." value={memberSearchTerm} onChange={(e) => { setMemberSearchTerm(e.target.value); setIsMemberDropdownOpen(true); }} onFocus={() => setIsMemberDropdownOpen(true)}/>)}{!rentalMemberId && (<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ChevronDown size={16} /></div>)}</div>{isMemberDropdownOpen && !rentalMemberId && (<div className="absolute z-50 w-full mt-1 bg-white dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden animate-fade-in custom-scrollbar">{sortedAndFilteredMembers.length > 0 ? (sortedAndFilteredMembers.map(m => (<button key={m.id} onClick={() => { setRentalMemberId(m.id); setMemberSearchTerm(m.name); setIsMemberDropdownOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 flex items-center justify-between group border-b border-slate-100 dark:border-white/5 last:border-0"><div><p className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</p>{m.nickname && <p className="text-xs text-slate-500">@{m.nickname}</p>}</div>{m.freeHoursBalance > 0 && (<span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1"><Gift size={10} /> {m.freeHoursBalance}h</span>)}</button>))) : (<div className="p-3 text-center"><p className="text-xs text-slate-500 mb-2">Member tidak ditemukan.</p>{memberSearchTerm.length > 2 && (<button onClick={handleQuickAddMember} className="w-full py-2 bg-palette-mustard text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 hover:bg-palette-mustard/90"><UserPlus size={14} /> Tambah "{memberSearchTerm}"</button>)}</div>)}</div>)}</div>
                       <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={12}/> {t('duration_hrs')}</label><div className="flex items-center gap-4"><button onClick={() => setRentalDuration(Math.max(1, rentalDuration - 1))} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xl hover:bg-palette-mustard/20 transition-colors flex items-center justify-center active:scale-95">-</button><div className="relative flex-1"><Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="number" inputMode="numeric" min="1" max="12" value={rentalDuration} onChange={(e) => setRentalDuration(Number(e.target.value))} className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xl text-center font-bold rounded-xl py-2.5 pl-8 focus:ring-2 focus:ring-palette-mustard focus:outline-none h-12"/></div><button onClick={() => setRentalDuration(rentalDuration + 1)} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xl hover:bg-palette-mustard/20 transition-colors flex items-center justify-center active:scale-95">+</button></div></div>
                       {calculation && (<div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2"><div className="flex justify-between text-slate-600 dark:text-slate-300 text-xs"><span>{t('duration_label')}</span><span className="font-bold">{rentalDuration} {t('jam')}</span></div><div className="flex justify-between text-slate-600 dark:text-slate-300 text-xs"><span>{t('cost')}:</span> <span>Rp {(rentalDuration * settings.hourlyRate).toLocaleString()}</span></div>{calculation.freeHoursUsed > 0 && (<div className="flex justify-between text-palette-green dark:text-palette-green font-bold bg-palette-green/10 px-2 py-1 rounded-lg text-xs"><span className="flex items-center gap-1"><Gift size={12}/> {t('use_bonus')}</span> <span>-{calculation.freeHoursUsed} {t('jam')}</span></div>)}<div className="border-t-2 border-dashed border-slate-200 dark:border-white/10 mt-2 pt-2 flex justify-between items-center"><span className="font-bold text-slate-900 dark:text-white text-sm">{t('total_pay')}</span> <span className="text-xl font-black text-palette-mustard">Rp {calculation.totalCost.toLocaleString()}</span></div></div>)}
                       <button onClick={handleNextStep} disabled={!rentalMemberId} className="w-full py-4 bg-palette-mustard hover:bg-palette-mustard/90 text-white rounded-xl font-bold text-sm mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-palette-mustard/30 hover:-translate-y-1 active:scale-95 h-14">{t('next_payment')}</button>
                       <div className="h-6 md:hidden"></div>
                    </div>
                  )}
                  {currentStep === 'PAYMENT' && (
                    <div className="space-y-6">
                        <div className="text-center">
                            {calculation?.totalCost === 0 ? (
                                // AUTOMATION: UI for Full Bonus Coverage
                                <div className="animate-fade-in">
                                    <div className="w-20 h-20 bg-palette-green/10 text-palette-green rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                                        <Gift size={40} />
                                    </div>
                                    <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
                                        Full Covered by Bonus!
                                    </h4>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Member menggunakan {calculation.freeHoursUsed} jam saldo bonus.
                                    </p>
                                </div>
                            ) : (
                                // Standard Payment Selection
                                <>
                                    <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">{t('pay_method')}</p>
                                    
                                    {/* INFO PARTIAL BONUS */}
                                    {calculation && calculation.freeHoursUsed > 0 && (
                                       <div className="mb-4 bg-blue-50 dark:bg-blue-900/10 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-2">
                                         <Gift size={14} /> Bonus terpakai: {calculation.freeHoursUsed} Jam
                                       </div>
                                    )}

                                    <div className="grid grid-cols-2 gap-4">
                                        <button onClick={() => setSelectedPayment('CASH')} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all h-32 active:scale-95 ${selectedPayment === 'CASH' ? 'bg-palette-green/10 border-palette-green text-palette-green ring-2 ring-palette-green/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                                            <Wallet size={32} className="mb-2" />
                                            <span className="text-sm font-bold">{t('pay_cash')}</span>
                                        </button>
                                        <button onClick={() => setSelectedPayment('QRIS')} className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all h-32 active:scale-95 ${selectedPayment === 'QRIS' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-600 ring-2 ring-blue-200' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}>
                                            <QrCode size={32} className="mb-2" />
                                            <span className="text-sm font-bold">QRIS</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-center border border-slate-100 dark:border-white/10">
                            <span className="text-xs text-slate-500">{t('total_bill')}</span>
                            <p className={`text-2xl font-black mt-1 ${calculation?.totalCost === 0 ? 'text-palette-green' : 'text-palette-navy dark:text-white'}`}>
                                Rp {calculation?.totalCost.toLocaleString()}
                            </p>
                            {calculation?.totalCost === 0 && <span className="text-[10px] font-bold text-palette-green uppercase tracking-wide">GRATIS</span>}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setCurrentStep('INPUT')} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 text-sm h-12 active:scale-95">{t('back')}</button>
                            <button onClick={handleNextStep} className="flex-[2] py-3 bg-palette-mustard text-white rounded-xl font-bold hover:bg-palette-mustard/90 shadow-lg shadow-palette-mustard/20 text-sm h-12 active:scale-95">
                                {calculation?.totalCost === 0 ? 'Klaim Bonus' : (selectedPayment === 'CASH' ? t('confirm_pay') : t('scan_qris'))}
                            </button>
                        </div>
                        <div className="h-6 md:hidden"></div>
                    </div>
                  )}
                  {currentStep === 'QRIS' && (<div className="text-center space-y-6"><div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-lg"><img src="https://beeimg.com/images/k55144992704.jpg" alt="QRIS" className="w-48 h-48 object-cover rounded-lg" /><p className="text-xs font-bold text-slate-900 mt-2">{t('scan_to_pay')}</p></div><div><p className="text-xs text-slate-500">{t('total')}</p><p className="text-2xl font-bold text-slate-900 dark:text-white">Rp {calculation?.totalCost.toLocaleString()}</p></div><div className="flex gap-3"><button onClick={() => setCurrentStep('PAYMENT')} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 text-sm h-12 active:scale-95">{t('back')}</button><button onClick={handleNextStep} className="flex-[2] py-3 bg-palette-green text-white rounded-xl font-bold hover:bg-palette-green/90 shadow-lg shadow-palette-green/20 text-sm h-12 active:scale-95">{t('paid_confirm')}</button></div><div className="h-6 md:hidden"></div></div>)}
                  {currentStep === 'CONFIRM' && (
                    <div className="text-center space-y-6 py-4">
                        <div className="w-20 h-20 bg-palette-green/10 text-palette-green rounded-full flex items-center justify-center mx-auto animate-zoom-in">
                            <CheckCircle size={40} />
                        </div>
                        <div>
                            <h4 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('ready_start')}</h4>
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl inline-block w-full text-left border border-slate-100 dark:border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs text-slate-500">{t('unit_label')}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{consoles.find(c => c.id === selectedConsoleId)?.name}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span className="text-xs text-slate-500">{t('duration_label')}</span>
                                    <span className="text-sm font-bold text-slate-900 dark:text-white">{rentalDuration} {t('jam')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-slate-500">{t('method_label')}</span>
                                    <span className={`text-sm font-bold ${calculation?.totalCost === 0 ? 'text-palette-green' : 'text-palette-mustard'}`}>
                                        {calculation?.totalCost === 0 ? 'BONUS (FREE)' : selectedPayment}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button onClick={handleConfirmRental} className="w-full py-4 bg-palette-mustard text-white rounded-xl font-bold text-base shadow-xl shadow-palette-mustard/30 hover:bg-palette-mustard/90 hover:-translate-y-1 transition-all h-14 active:scale-95">{t('start_session')}</button>
                        <div className="h-6 md:hidden"></div>
                    </div>
                  )}
              </div>
           </div>
         </div>
      )}

      {/* CREATE MODAL */}
      {isAdding && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-white/10"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('add_unit')}</h3><button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18}/></button></div><form onSubmit={handleAddConsole} className="space-y-4"><div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">{t('console_name')}</label><div className="relative"><Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" value={newConsoleName} onChange={(e) => setNewConsoleName(e.target.value)} className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all text-sm h-12" placeholder={t('console_name_placeholder')} required autoFocus/></div></div><div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Gambar (URL)</label><div className="relative mb-2"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="url" value={newConsoleImage} onChange={(e) => setNewConsoleImage(e.target.value)} className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all text-sm h-12" placeholder="https://..."/></div><div className="w-full aspect-video rounded-xl bg-slate-100 dark:bg-black/20 overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center p-4">{newConsoleImage ? (<img src={newConsoleImage} alt="Preview" className="h-full object-contain" onError={(e) => (e.currentTarget.src = DEFAULT_CONSOLE_IMAGE)} />) : (<div className="flex flex-col items-center text-slate-400"><ImageIcon size={24} className="mb-1"/><span className="text-[10px]">{t('preview_image')}</span></div>)}</div></div><div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2.5 bg-palette-mustard text-white rounded-xl font-bold flex items-center gap-2 hover:bg-palette-mustard/90 transition-all w-full justify-center sm:w-auto shadow-lg shadow-palette-mustard/20 text-sm h-12"><Save size={16} /> {t('save')}</button></div></form></div></div>
      )}

      {/* EDIT MODAL */}
      {editingConsole && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-white/10"><div className="flex justify-between items-center mb-6"><h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('edit_unit')}</h3><button onClick={() => setEditingConsole(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={18}/></button></div><form onSubmit={handleUpdateConsole} className="space-y-4"><div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">{t('console_name')}</label><div className="relative"><Gamepad2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all text-sm h-12" value={editingConsole.name} onChange={e => setEditingConsole({...editingConsole, name: e.target.value})} /></div></div><div><label className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">Gambar (URL)</label><div className="relative mb-2"><LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="url" value={editingConsole.imageUrl || ''} onChange={(e) => setEditingConsole({...editingConsole, imageUrl: e.target.value})} className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-300 dark:border-white/10 rounded-xl pl-10 pr-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all text-sm h-12" placeholder="https://..."/></div><div className="w-full aspect-video rounded-xl bg-slate-100 dark:bg-black/20 overflow-hidden border border-slate-200 dark:border-white/10 flex items-center justify-center p-4"><img src={editingConsole.imageUrl || DEFAULT_CONSOLE_IMAGE} alt="Preview" className="h-full object-contain" onError={(e) => (e.currentTarget.src = DEFAULT_CONSOLE_IMAGE)} /></div></div><div className="flex justify-end pt-4"><button type="submit" className="px-6 py-2.5 bg-palette-mustard text-white rounded-xl font-bold flex items-center gap-2 hover:bg-palette-mustard/90 transition-all w-full justify-center sm:w-auto shadow-lg shadow-palette-mustard/20 text-sm h-12"><Save size={16}/> {t('save')}</button></div></form></div></div>
      )}

      {/* CUSTOM DELETE CONFIRMATION MODAL */}
      {deletingConsole && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10 text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-zoom-in">
                 <AlertTriangle size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Konfirmasi Hapus</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                 Apakah Anda yakin untuk menghapus unit <strong>{deletingConsole.name}</strong> dari database?
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                 <button 
                    onClick={() => setDeletingConsole(null)}
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

      {/* PRINT MODAL */}
      {printTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in"><div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10 text-center"><h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('select_print_method')}</h3><p className="text-xs text-slate-500 mb-6">{t('receipt_for_tx', { name: printTx.memberName })}</p><div className="grid grid-cols-1 gap-3"><button onClick={handlePrintWifi} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard hover:bg-palette-mustard/5 transition-all text-slate-700 dark:text-slate-200 font-bold h-14"><Printer size={20} className="text-palette-mustard"/><span className="text-sm">{t('print_wifi')}</span></button><button onClick={handlePrintBluetooth} className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard hover:bg-palette-mustard/5 transition-all text-slate-700 dark:text-slate-200 font-bold h-14"><Bluetooth size={20} className="text-blue-500"/><span className="text-sm">{t('print_bt')}</span></button></div><button onClick={() => setPrintTx(null)} className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline p-2">{t('cancel')}</button></div></div>
      )}
    </div>
  );
};

export default Consoles;