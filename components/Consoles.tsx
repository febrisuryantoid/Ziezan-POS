import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus, PaymentMethod, Console, Transaction, MemberStatus } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Power, Timer, Wrench, Trash2, Play, Plus, X, Wallet, QrCode, CheckCircle, ArrowRight, Loader2, Edit2, Save, Search, Gamepad2, Gift, User, Clock, AlertCircle, PlusCircle, Hourglass, Printer, Bluetooth, Filter, ArrowUpDown, ChevronDown, Check, UserPlus, GripHorizontal, Image as ImageIcon, Link as LinkIcon, AlertTriangle, ChevronLeft, ChevronRight, Construction, ShoppingBag, Banknote } from 'lucide-react';
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
  
  // Modal State (Checkout / Stop Session)
  const [checkoutTx, setCheckoutTx] = useState<Transaction | null>(null);
  const [extraCost, setExtraCost] = useState(0);
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethod>('CASH');

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

  // --- CHECKOUT LOGIC ---
  const initiateCheckout = (tx: Transaction) => {
      setCheckoutTx(tx);
      setExtraCost(0); // Reset
      setCheckoutPayment(tx.paymentMethod); // Default to initial method
  };

  const confirmCheckout = () => {
      if (checkoutTx) {
          stopRental(checkoutTx.id, extraCost, checkoutPayment);
          addToast('success', 'Sesi Selesai', 'Transaksi berhasil disimpan.');
          setCheckoutTx(null);
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
      if (isDuplicate) { addToast('error', 'Duplikasi Nama', 'Nama console ini sudah ada.'); return; }
      addConsole({ name: newConsoleName.trim(), imageUrl: newConsoleImage });
      setNewConsoleName('');
      setNewConsoleImage('');
      setIsAdding(false);
      addToast('success', 'Console Ditambahkan', `Console ${newConsoleName} berhasil dibuat.`);
    }
  }

  const handleUpdateConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingConsole && editingConsole.name) {
      const normalizedName = editingConsole.name.trim().toLowerCase();
      const isDuplicate = consoles.some(c => c.id !== editingConsole.id && c.name.toLowerCase() === normalizedName);
      if (isDuplicate) { addToast('error', 'Duplikasi Nama', 'Nama console ini sudah digunakan.'); return; }
      updateConsole(editingConsole.id, editingConsole.name.trim(), editingConsole.imageUrl);
      setEditingConsole(null);
      addToast('success', 'Console Diperbarui', 'Data console berhasil diubah.');
    }
  }

  // --- TOGGLE MAINTENANCE ---
  const toggleMaintenance = (c: Console) => {
    if (c.status === ConsoleStatus.IN_USE) {
      addToast('error', 'Gagal', 'Console sedang digunakan. Selesaikan sesi terlebih dahulu.');
      return;
    }
    
    const newStatus = c.status === ConsoleStatus.MAINTENANCE ? ConsoleStatus.AVAILABLE : ConsoleStatus.MAINTENANCE;
    updateConsoleStatus(c.id, newStatus);
    
    if(newStatus === ConsoleStatus.MAINTENANCE) {
       addToast('warning', 'Mode Maintenance', `${c.name} kini dalam perbaikan.`);
    } else {
       addToast('success', 'Console Tersedia', `${c.name} sudah aktif kembali.`);
    }
  };

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
      addToast('info', 'Console Dihapus', `Data ${deletingConsole.name} telah dihapus.`);
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
          <h2 className="text-lg sm:text-xl font-bold text-palette-navy dark:text-white">{t('consoles')}</h2>
          <p className="text-palette-brown/70 dark:text-palette-cream/60 text-xs">{t('manage_units_desc')}</p>
        </div>
        
        {/* RESPONSIVE FILTER GRID SYSTEM - Optimized for 320px screens */}
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-2 sm:gap-3 items-center min-w-0">
           
           {/* Search - Full Width on Mobile */}
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

          {/* Sort - Half Width on Mobile */}
          <div className="relative col-span-1 md:col-span-6 lg:w-48">
             <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-10 sm:h-11 pl-10 pr-2 sm:pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none truncate cursor-pointer"
             >
                <option value="NAME_ASC">{t('sort_name_asc')}</option>
                <option value="NAME_DESC">{t('sort_name_desc')}</option>
                <option value="USAGE_DESC">{t('sort_usage_desc')}</option>
                <option value="STATUS">{t('status')}</option>
             </select>
          </div>

          {/* Filter Status - Half Width on Mobile */}
          <div className="relative col-span-1 md:col-span-6 lg:w-40">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-10 sm:h-11 pl-10 pr-2 sm:pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs sm:text-sm font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none truncate cursor-pointer"
             >
                <option value="ALL">{t('filter_all')}</option>
                <option value="AVAILABLE">{t('filter_avail')}</option>
                <option value="IN_USE">{t('filter_in_use')}</option>
             </select>
          </div>

          {/* Add Button - Full Width on Mobile */}
          <button 
            onClick={() => setIsAdding(true)}
            className="col-span-2 md:col-span-12 lg:w-auto h-10 sm:h-11 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-md bg-palette-mustard text-white hover:bg-palette-mustard/90 shadow-palette-mustard/30 whitespace-nowrap active:scale-95"
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
          {/* FIX TEXT COLOR CONTRAST: dark:text-slate-300 */}
          <span className="ml-auto text-[10px] font-bold text-palette-brown/70 dark:text-slate-300 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 px-2 py-0.5 rounded-full shadow-sm">
            Total Console: {filteredConsoles.length}
          </span>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-5">
          {currentConsoles.map(console => {
            const isActive = console.status === ConsoleStatus.IN_USE;
            const isMaintenance = console.status === ConsoleStatus.MAINTENANCE;
            const session = isActive ? getSessionDetails(console.id, console.currentSessionId) : null;
            const imageUrl = console.imageUrl || DEFAULT_CONSOLE_IMAGE;
            
            return (
              <div key={console.id} className={`group relative rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col shadow-sm hover:shadow-xl dark:shadow-none bg-white dark:bg-palette-navyLight ${
                isActive ? 'border-palette-mustard ring-2 ring-palette-mustard/30' : isMaintenance ? 'border-palette-copper/50 opacity-90' : 'border-slate-200 dark:border-white/5 hover:border-palette-green/50 hover:-translate-y-1'
              }`}>
                {/* Image Container */}
                <div className="aspect-video w-full bg-slate-100 dark:bg-black/20 relative">
                  <img 
                    src={imageUrl} 
                    alt={console.name} 
                    className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-105'} ${isMaintenance ? 'grayscale opacity-50' : ''}`}
                    onError={(e) => (e.currentTarget.src = DEFAULT_CONSOLE_IMAGE)}
                  />
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60"></div>
                  
                  {/* MAINTENANCE OVERLAY */}
                  {isMaintenance && (
                     <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-[1px] animate-fade-in">
                        <div className="w-full h-full absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(249,115,22,0.1)_10px,rgba(249,115,22,0.1)_20px)] pointer-events-none"></div>
                        <Construction size={48} className="text-palette-copper mb-2 animate-bounce" />
                        <span className="bg-palette-copper text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-lg border border-white/20 tracking-wider">UNDER MAINTENANCE</span>
                     </div>
                  )}
                  
                  {/* Top Right Actions */}
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                     {/* MAINTENANCE TOGGLE BUTTON */}
                     <button 
                        onClick={() => toggleMaintenance(console)} 
                        className={`p-2 backdrop-blur-md rounded-full text-white transition-colors ${isMaintenance ? 'bg-palette-copper hover:bg-palette-copper/80' : 'bg-slate-500/50 hover:bg-slate-500'}`}
                        title={isMaintenance ? "Selesai Perbaikan" : "Mode Perbaikan"}
                     >
                        <Wrench size={14} />
                     </button>
                     
                     <button onClick={() => setEditingConsole(console)} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/40"><Edit2 size={14} /></button>
                     <button onClick={() => openConfirmDelete(console)} className="p-2 bg-red-500/20 backdrop-blur-md rounded-full text-red-200 hover:bg-red-500/40"><Trash2 size={14} /></button>
                  </div>

                  {/* Status Badge */}
                  <div className="absolute top-3 left-3 z-20">
                     <span className={`px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-wide backdrop-blur-md border border-white/10 shadow-sm ${
                        isActive ? 'bg-palette-mustard/90 text-white animate-pulse' :
                        isMaintenance ? 'bg-palette-copper/90 text-white' :
                        'bg-palette-green/90 text-white'
                     }`}>
                        {isActive ? t('session_active') : isMaintenance ? t('maintenance') : t('available_status')}
                     </span>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-4 sm:p-5 flex flex-col flex-1 relative">
                   <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white truncate mb-1" title={console.name}>{console.name}</h3>
                   
                   {isActive && session ? (
                      <div className="mt-2 space-y-3">
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 max-w-[60%] truncate"><User size={12}/> {session.tx.memberName}</span>
                            <span className="font-mono font-bold text-slate-700 dark:text-slate-200">{session.formattedRemaining}</span>
                         </div>
                         {/* Progress Bar */}
                         <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-1000 ${session.isOvertime ? 'bg-red-500 animate-striped' : session.isWarning ? 'bg-palette-copper' : 'bg-palette-mustard'}`} 
                              style={{ width: `${session.progress}%` }}
                            ></div>
                         </div>
                         <div className="flex justify-between text-[9px] sm:text-[10px] font-bold uppercase text-slate-400">
                            <span>{t('elapsed')}</span>
                            <span>{session.isOvertime ? 'Overtime' : t('remaining')}</span>
                         </div>
                      </div>
                   ) : (
                      <div className="mt-2 flex-1 flex items-center text-slate-400 text-xs">
                         <div className={`flex items-center gap-2 px-3 py-2 rounded-lg w-full ${isMaintenance ? 'bg-palette-copper/10 text-palette-copper' : 'bg-slate-50 dark:bg-white/5'}`}>
                            {isMaintenance ? <Construction size={14}/> : <Clock size={14} />}
                            <span className="truncate">{isMaintenance ? 'Unit sedang diperbaiki' : t('ready_to_play')}</span>
                         </div>
                      </div>
                   )}

                   {/* Footer Action */}
                   <div className="mt-4 sm:mt-5 pt-4 border-t border-slate-100 dark:border-white/5">
                      {isActive && session ? (
                         <button 
                           onClick={() => initiateCheckout(session.tx)}
                           className="w-full py-3 rounded-xl bg-red-50 text-red-600 dark:bg-red-500/20 dark:text-red-400 font-bold text-sm hover:bg-red-100 dark:hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                         >
                            <Power size={16} /> Checkout / Stop
                         </button>
                      ) : (
                         <button 
                           onClick={() => setSelectedConsoleId(console.id)}
                           disabled={isMaintenance}
                           className={`w-full py-3 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-lg ${
                               isMaintenance 
                               ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none' 
                               : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 shadow-slate-900/10'
                           }`}
                         >
                            {isMaintenance ? (
                                <span className="text-[10px]">UNDER MAINTENANCE</span>
                            ) : (
                                <><Play size={16} fill="currentColor" /> {t('start_session')}</>
                            )}
                         </button>
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* PAGINATION UI */}
        {renderPagination()}
      </div>

      {/* --- MODALS --- */}

      {/* 1. CHECKOUT MODAL (NEW FEATURE FOR SAFETY & F&B) */}
      {checkoutTx && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                 <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Checkout Sesi</h3>
                    <p className="text-xs text-slate-500">Konfirmasi pembayaran akhir</p>
                 </div>
                 <button onClick={() => setCheckoutTx(null)} className="p-2 bg-white dark:bg-white/10 rounded-full hover:bg-slate-200"><X size={18} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-5">
                 {/* Bill Summary */}
                 <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Member</span>
                        <span className="font-bold dark:text-white">{checkoutTx.memberName}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Durasi Rental</span>
                        <span className="font-bold dark:text-white">{checkoutTx.durationHours} Jam</span>
                    </div>
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Biaya Rental</span>
                        <span className="font-mono dark:text-white">Rp {checkoutTx.cost.toLocaleString()}</span>
                    </div>
                    
                    {/* Add-ons / F&B Input (Simple Version) */}
                    <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-2">
                            <ShoppingBag size={16} className="text-palette-mustard"/>
                            <span className="text-xs font-bold uppercase text-slate-500">Jajanan / Tambahan (Rp)</span>
                        </div>
                        <input 
                            type="number" 
                            inputMode="numeric"
                            value={extraCost}
                            onChange={(e) => setExtraCost(Math.max(0, parseInt(e.target.value) || 0))}
                            className="w-full bg-white dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-lg px-3 py-2 text-right font-mono font-bold focus:ring-2 focus:ring-palette-mustard outline-none dark:text-white"
                            placeholder="0"
                        />
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-3 flex justify-between items-center">
                        <span className="text-lg font-bold text-slate-900 dark:text-white">Total Akhir</span>
                        <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            Rp {(checkoutTx.cost + extraCost).toLocaleString()}
                        </span>
                    </div>
                 </div>

                 {/* Payment Method Selector */}
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-2">Metode Pembayaran</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={() => setCheckoutPayment('CASH')}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${checkoutPayment === 'CASH' ? 'bg-palette-mustard text-white border-palette-mustard' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}
                        >
                            <Wallet size={16} /> Tunai
                        </button>
                        <button 
                            onClick={() => setCheckoutPayment('QRIS')}
                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 text-sm font-bold transition-all ${checkoutPayment === 'QRIS' ? 'bg-palette-mustard text-white border-palette-mustard' : 'border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300'}`}
                        >
                            <QrCode size={16} /> QRIS
                        </button>
                    </div>
                 </div>
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                 <button 
                    onClick={confirmCheckout}
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                 >
                    <Power size={18} /> Selesaikan & Simpan
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* 2. RENTAL MODAL */}
      {selectedConsoleId && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm sm:p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight w-full max-w-md sm:rounded-3xl rounded-t-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('new_rental_session')}</h3>
                 <button onClick={resetModal} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200"><X size={18} /></button>
              </div>
              
              <div className="p-6 overflow-y-auto">
                 {/* Step 1: Member & Duration */}
                 {currentStep === 'INPUT' && (
                    <div className="space-y-5">
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">{t('select_member')}</label>
                          <div className="relative" ref={dropdownRef}>
                             <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input 
                                   type="text" 
                                   placeholder={t('search_placeholder')} 
                                   value={memberSearchTerm}
                                   onFocus={() => setIsMemberDropdownOpen(true)}
                                   onChange={(e) => { setMemberSearchTerm(e.target.value); setIsMemberDropdownOpen(true); }}
                                   className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-base md:text-sm font-bold focus:ring-2 focus:ring-palette-mustard focus:outline-none dark:text-white"
                                />
                             </div>
                             
                             {isMemberDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-palette-navy border border-slate-200 dark:border-white/10 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                                   {sortedAndFilteredMembers.length > 0 ? (
                                      sortedAndFilteredMembers.map(m => (
                                         <div 
                                            key={m.id} 
                                            onClick={() => { setRentalMemberId(m.id); setMemberSearchTerm(m.name); setIsMemberDropdownOpen(false); }}
                                            className="p-3 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer border-b border-slate-100 dark:border-white/5 last:border-0"
                                         >
                                            <p className="text-sm font-bold text-slate-900 dark:text-white">{m.name}</p>
                                            <p className="text-xs text-slate-500">@{m.nickname} • {m.membershipId}</p>
                                         </div>
                                      ))
                                   ) : (
                                      <div className="p-3 text-center">
                                         <p className="text-xs text-slate-500 mb-2">Member tidak ditemukan.</p>
                                         <button onClick={handleQuickAddMember} className="text-xs font-bold text-palette-mustard hover:underline flex items-center justify-center gap-1 w-full"><UserPlus size={12}/> Tambah "{memberSearchTerm}"</button>
                                      </div>
                                   )}
                                </div>
                             )}
                          </div>
                          {rentalMemberId && <div className="text-xs text-emerald-500 font-bold flex items-center gap-1"><CheckCircle size={12}/> Member terpilih</div>}
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase">{t('duration_hrs')}</label>
                          <div className="flex items-center gap-4">
                             <button onClick={() => setRentalDuration(Math.max(1, rentalDuration - 1))} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-200"><ChevronLeft/></button>
                             <div className="flex-1 text-center">
                                <span className="text-3xl font-black text-slate-900 dark:text-white">{rentalDuration}</span>
                                <span className="text-xs text-slate-500 block">{t('jam')}</span>
                             </div>
                             <button onClick={() => setRentalDuration(rentalDuration + 1)} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-white hover:bg-slate-200"><ChevronRight/></button>
                          </div>
                       </div>
                    </div>
                 )}

                 {/* Step 2: Payment Method */}
                 {currentStep === 'PAYMENT' && calculation && (
                    <div className="space-y-4">
                       <div className="bg-slate-50 dark:bg-black/20 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between text-sm">
                             <span className="text-slate-500">{t('cost')} Normal</span>
                             <span className="font-mono text-slate-900 dark:text-white">Rp {(rentalDuration * settings.hourlyRate).toLocaleString()}</span>
                          </div>
                          {calculation.freeHoursUsed > 0 && (
                             <div className="flex justify-between text-sm text-emerald-500">
                                <span className="flex items-center gap-1"><Gift size={12}/> {t('use_bonus')} ({calculation.freeHoursUsed}h)</span>
                                <span className="font-mono">-Rp {(calculation.freeHoursUsed * settings.hourlyRate).toLocaleString()}</span>
                             </div>
                          )}
                          <div className="border-t border-slate-200 dark:border-white/10 my-2"></div>
                          <div className="flex justify-between text-lg font-bold">
                             <span className="text-slate-900 dark:text-white">{t('total_bill')}</span>
                             <span className="font-mono text-palette-mustard">Rp {calculation.totalCost.toLocaleString()}</span>
                          </div>
                       </div>

                       {calculation.totalCost > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                             <button 
                                onClick={() => setSelectedPayment('CASH')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPayment === 'CASH' ? 'border-palette-mustard bg-palette-mustard/5 text-palette-mustard' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}
                             >
                                <Wallet size={24} />
                                <span className="font-bold text-xs">{t('pay_cash')}</span>
                             </button>
                             <button 
                                onClick={() => setSelectedPayment('QRIS')}
                                className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${selectedPayment === 'QRIS' ? 'border-palette-mustard bg-palette-mustard/5 text-palette-mustard' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}
                             >
                                <QrCode size={24} />
                                <span className="font-bold text-xs">QRIS</span>
                             </button>
                          </div>
                       )}
                    </div>
                 )}

                 {/* Step 3: QRIS Scan (Mock) */}
                 {currentStep === 'QRIS' && (
                    <div className="flex flex-col items-center justify-center py-4">
                       <div className="w-48 h-48 bg-white p-2 rounded-xl shadow-lg mb-4">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_QRIS_PAYMENT" alt="QRIS" className="w-full h-full" />
                       </div>
                       <p className="text-sm font-bold text-slate-900 dark:text-white mb-1">{t('scan_to_pay')}</p>
                       <p className="text-xs text-slate-500">Scan QRIS di atas untuk pembayaran.</p>
                    </div>
                 )}

                 {/* Step 4: Confirm Start */}
                 {currentStep === 'CONFIRM' && (
                    <div className="text-center py-6">
                       <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                          <Gamepad2 size={40} />
                       </div>
                       <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('ready_start')}</h3>
                       <p className="text-slate-500 text-sm">Console akan menyala dan timer dimulai.</p>
                    </div>
                 )}
              </div>

              <div className="p-5 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-white/5">
                 {currentStep === 'INPUT' ? (
                    <button 
                       onClick={handleNextStep} disabled={!rentalMemberId}
                       className="w-full py-3.5 bg-palette-mustard text-white rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                       {t('next_payment')}
                    </button>
                 ) : currentStep === 'CONFIRM' ? (
                    <button 
                       onClick={handleConfirmRental}
                       className="w-full py-3.5 bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20"
                    >
                       {t('start_session')}
                    </button>
                 ) : (
                    <div className="flex gap-3">
                       <button onClick={() => setCurrentStep('INPUT')} className="flex-1 py-3.5 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-600 dark:text-slate-300">{t('back')}</button>
                       <button onClick={handleNextStep} className="flex-[2] py-3.5 bg-palette-mustard text-white rounded-xl font-bold">{currentStep === 'QRIS' ? t('paid_confirm') : t('confirm_pay')}</button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* 3. ADD / EDIT CONSOLE MODAL */}
      {(isAdding || editingConsole) && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white dark:bg-palette-navyLight w-full max-w-sm rounded-3xl shadow-2xl p-6">
               <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  {isAdding ? <PlusCircle size={20} className="text-palette-mustard"/> : <Edit2 size={20} className="text-palette-mustard"/>}
                  {isAdding ? t('add_unit') : t('edit_unit')}
               </h3>
               
               <form onSubmit={isAdding ? handleAddConsole : handleUpdateConsole} className="space-y-4">
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase">{t('console_name')}</label>
                     <input 
                        type="text" 
                        required
                        value={isAdding ? newConsoleName : editingConsole?.name}
                        onChange={(e) => isAdding ? setNewConsoleName(e.target.value) : setEditingConsole(prev => prev ? {...prev, name: e.target.value} : null)}
                        className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard font-bold dark:text-white"
                        placeholder={t('console_name_placeholder')}
                     />
                  </div>
                  <div className="space-y-1.5">
                     <label className="text-xs font-bold text-slate-500 uppercase">Image URL (Optional)</label>
                     <div className="relative">
                        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                           type="text"
                           value={isAdding ? newConsoleImage : editingConsole?.imageUrl || ''}
                           onChange={(e) => isAdding ? setNewConsoleImage(e.target.value) : setEditingConsole(prev => prev ? {...prev, imageUrl: e.target.value} : null)}
                           className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 rounded-xl text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard dark:text-white"
                           placeholder="https://..."
                        />
                     </div>
                  </div>
                  
                  <div className="pt-2 flex gap-3">
                     <button type="button" onClick={() => { setIsAdding(false); setEditingConsole(null); }} className="flex-1 py-3 border border-slate-200 dark:border-white/10 rounded-xl font-bold text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5">{t('cancel')}</button>
                     <button type="submit" className="flex-1 py-3 bg-palette-mustard text-white rounded-xl font-bold shadow-lg shadow-palette-mustard/20">{t('save')}</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* 4. DELETE CONFIRMATION */}
      {deletingConsole && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
              <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-sm shadow-2xl p-6 text-center">
                  <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-zoom-in">
                      <AlertTriangle size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{t('delete_confirm')}</h3>
                  <p className="text-sm text-slate-500 mb-6">Unit: {deletingConsole.name}</p>
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setDeletingConsole(null)} className="py-3 px-4 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/5 font-bold text-sm">{t('cancel')}</button>
                      <button onClick={executeDelete} className="py-3 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-sm shadow-lg shadow-red-500/20">Ya, Hapus</button>
                  </div>
              </div>
          </div>
      )}

      {/* 5. PRINT SELECTION MODAL */}
      {printTx && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('select_print_method')}</h3>
              
              <div className="grid grid-cols-1 gap-3">
                 <button 
                    onClick={handlePrintWifi}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard hover:bg-palette-mustard/5 transition-all text-slate-700 dark:text-slate-200 font-bold"
                 >
                    <Printer size={20} className="text-palette-mustard"/>
                    <span className="text-sm">{t('print_wifi')}</span>
                 </button>

                 <button 
                    onClick={handlePrintBluetooth}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard hover:bg-palette-mustard/5 transition-all text-slate-700 dark:text-slate-200 font-bold"
                 >
                    <Bluetooth size={20} className="text-blue-500"/>
                    <span className="text-sm">{t('print_bt')}</span>
                 </button>
              </div>

              <button onClick={() => setPrintTx(null)} className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline">
                 {t('cancel')}
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default Consoles;