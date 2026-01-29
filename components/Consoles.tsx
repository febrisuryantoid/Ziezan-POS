
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

const FormattedNumberInput: React.FC<{ value: number; onChange: (v: number) => void; className?: string; placeholder?: string }> = ({ value, onChange, className, placeholder }) => {
    const [display, setDisplay] = useState(value === 0 ? '' : value.toLocaleString('id-ID'));
    
    useEffect(() => {
        if (value !== parseInt(display.replace(/\./g, '') || '0')) {
             setDisplay(value === 0 ? '' : value.toLocaleString('id-ID'));
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        const sanitized = raw.replace(/^0+/, '') || '0';
        const num = parseInt(sanitized, 10);
        
        setDisplay(num === 0 ? '' : num.toLocaleString('id-ID'));
        onChange(num);
    };

    return (
        <input 
            type="text" 
            inputMode="numeric"
            value={display}
            onChange={handleChange}
            className={className}
            placeholder={placeholder}
        />
    );
};

const Consoles: React.FC<{ operatorName: string }> = ({ operatorName }) => {
  const { consoles, members, startRental, stopRental, updateConsoleStatus, addConsole, updateConsole, deleteConsole, settings, transactions, addMember } = useData();
  const { t } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt } = useBluetooth();
  const { addToast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortOption, setSortOption] = useState<SortOption>('NAME_ASC');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const [selectedConsoleId, setSelectedConsoleId] = useState<string | null>(null);
  const [rentalMemberId, setRentalMemberId] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [currentStep, setCurrentStep] = useState<'INPUT' | 'PAYMENT' | 'QRIS' | 'CONFIRM'>('INPUT');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CASH');
  
  const [checkoutTx, setCheckoutTx] = useState<Transaction | null>(null);
  const [extraCost, setExtraCost] = useState(0);
  const [checkoutPayment, setCheckoutPayment] = useState<PaymentMethod>('CASH');

  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [editingConsole, setEditingConsole] = useState<Console | null>(null);
  const [newConsoleName, setNewConsoleName] = useState('');
  const [newConsoleImage, setNewConsoleImage] = useState('');
  
  const [deletingConsole, setDeletingConsole] = useState<Console | null>(null);

  const [printTx, setPrintTx] = useState<Transaction | null>(null);
  
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, sortOption]);

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
      const safeName = c.name || '';
      const matchesSearch = safeName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'ALL' ? true : 
                            filterStatus === 'AVAILABLE' ? c.status === ConsoleStatus.AVAILABLE :
                            filterStatus === 'IN_USE' ? c.status === ConsoleStatus.IN_USE :
                            c.status === ConsoleStatus.MAINTENANCE;
      return matchesSearch && matchesFilter;
    }).sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';
      switch (sortOption) {
        case 'NAME_ASC': return nameA.localeCompare(nameB);
        case 'NAME_DESC': return nameB.localeCompare(nameA);
        case 'USAGE_DESC': return b.totalHoursUsed - a.totalHoursUsed;
        case 'STATUS': return a.status.localeCompare(b.status);
        default: return 0;
      }
    });
  }, [consoles, searchTerm, filterStatus, sortOption]);

  const totalPages = Math.ceil(filteredConsoles.length / itemsPerPage);
  const currentConsoles = filteredConsoles.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const sortedAndFilteredMembers = useMemo(() => {
      const activeMembers = members.filter(m => m.status === 'ACTIVE');
      const sorted = activeMembers.sort((a, b) => (a.nickname || '').localeCompare(b.nickname || ''));
      if (!memberSearchTerm) return sorted;
      const lowerTerm = memberSearchTerm.toLowerCase();
      return sorted.filter(m => (m.name || '').toLowerCase().includes(lowerTerm) || (m.nickname || '').toLowerCase().includes(lowerTerm));
  }, [members, memberSearchTerm]);

  const calculation = useMemo(() => {
    if (!rentalMemberId || !rentalDuration) return null;
    const member = members.find(m => m.id === rentalMemberId);
    if (!member) return null;

    let freeHoursUsed = 0;
    let totalBaseCost = rentalDuration * settings.hourlyRate;
    const canUseBonus = member.freeHoursBalance >= 1;

    if (selectedPayment === 'BONUS') {
        if (member.freeHoursBalance >= rentalDuration) {
            freeHoursUsed = rentalDuration;
            totalBaseCost = 0;
        } else {
            freeHoursUsed = member.freeHoursBalance;
            totalBaseCost = (rentalDuration - freeHoursUsed) * settings.hourlyRate;
        }
    }

    return { totalCost: totalBaseCost, freeHoursUsed, canUseBonus, memberBonus: member.freeHoursBalance };
  }, [rentalMemberId, rentalDuration, members, settings.hourlyRate, selectedPayment]);

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
        if (selectedPayment === 'BONUS' && calculation?.totalCost === 0) {
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

  const initiateCheckout = (tx: Transaction) => {
      setCheckoutTx(tx);
      setExtraCost(0);
      setCheckoutPayment(tx.paymentMethod); 
  };

  const confirmCheckout = () => {
      if (checkoutTx) {
          stopRental(checkoutTx.id, extraCost, checkoutPayment);
          addToast('success', t('session_ended_toast'), t('saved'));
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
          membershipId: 'WARRIOR',
          notes: 'Added via Quick Rental',
          joinDate: new Date().toISOString()
      });
      setRentalMemberId(newMemberId);
      setMemberSearchTerm(name.split(' ')[0]); 
      setIsMemberDropdownOpen(false);
      addToast('success', t('member_added'), `${t('welcome')} ${name}`);
  };

  const handleAddConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(newConsoleName.trim()) {
      const normalizedName = newConsoleName.trim().toLowerCase();
      const isDuplicate = consoles.some(c => (c.name || '').toLowerCase() === normalizedName);
      if (isDuplicate) { addToast('error', 'Error', 'Name Exists'); return; }
      addConsole({ name: newConsoleName.trim(), imageUrl: newConsoleImage });
      setNewConsoleName('');
      setNewConsoleImage('');
      setIsAdding(false);
      addToast('success', t('console_added'), newConsoleName);
    }
  }

  const handleUpdateConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingConsole && editingConsole.name) {
      const normalizedName = editingConsole.name.trim().toLowerCase();
      const isDuplicate = consoles.some(c => c.id !== editingConsole.id && (c.name || '').toLowerCase() === normalizedName);
      if (isDuplicate) { addToast('error', 'Error', 'Name Exists'); return; }
      updateConsole(editingConsole.id, editingConsole.name.trim(), editingConsole.imageUrl);
      setEditingConsole(null);
      addToast('success', t('console_updated'), t('saved'));
    }
  }

  const toggleMaintenance = (c: Console) => {
    if (c.status === ConsoleStatus.IN_USE) {
      addToast('error', 'Error', t('unit_in_use'));
      return;
    }
    const newStatus = c.status === ConsoleStatus.MAINTENANCE ? ConsoleStatus.AVAILABLE : ConsoleStatus.MAINTENANCE;
    updateConsoleStatus(c.id, newStatus);
    if(newStatus === ConsoleStatus.MAINTENANCE) {
       addToast('warning', t('repair_mode'), c.name);
    } else {
       addToast('success', t('available_status'), c.name);
    }
  };

  const executeDelete = () => {
    if(!deletingConsole) return;
    const success = deleteConsole(deletingConsole.id);
    if(!success) {
      addToast('error', 'Error', t('unit_in_use'));
    } else {
      addToast('info', t('console_deleted'), deletingConsole.name);
    }
    setDeletingConsole(null);
  };

  const handlePrintWifi = () => { if (printTx) { printReceiptBrowser(printTx, settings); setPrintTx(null); } };
  const handlePrintBluetooth = async () => {
    if (!printTx) return;
    if (!isBtConnected) { try { await connectBt(); } catch (e) { addToast('error', 'Error', 'Bluetooth Error'); return; } }
    const rawData = generateEscPosCommand(printTx, settings);
    const success = await bluetoothService.sendRawData(rawData);
    if (success) { addToast('success', t('print'), t('saved')); setPrintTx(null); } else { addToast('error', 'Error', 'Print Failed'); }
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
            <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed"><ChevronLeft size={18} /></button>
            {getPageNumbers().map((page, idx) => (
                <button key={idx} onClick={() => typeof page === 'number' && setCurrentPage(page)} disabled={typeof page !== 'number'} className={`w-[30px] h-[30px] sm:w-[40px] sm:h-[40px] rounded-full flex items-center justify-center font-bold text-[10px] sm:text-sm transition-all backdrop-blur-md ${page === currentPage ? 'bg-palette-mustard text-white shadow-lg shadow-palette-mustard/30 scale-105' : typeof page === 'number' ? 'bg-white/40 dark:bg-white/5 border border-slate-300 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/10' : 'text-slate-400 cursor-default'}`}>{page}</button>
            ))}
            <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn-icon disabled:opacity-50 disabled:cursor-not-allowed"><ChevronRight size={18} /></button>
        </div>
    );
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Control Bar with Glass Effect */}
      <div className="glass-panel p-4 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="mb-2 xl:mb-0 px-2">
          <h2 className="text-2xl font-black text-palette-navy dark:text-white tracking-tight uppercase">{t('consoles')}</h2>
          <p className="text-label">{t('manage_units_desc')}</p>
        </div>
        
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-2 sm:gap-3 items-center min-w-0">
           <div className="relative col-span-2 md:col-span-12 lg:flex-1 lg:w-auto lg:min-w-[200px]">
            {/* Updated Icon Color for Visibility */}
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
            <input type="search" placeholder={t('search_placeholder')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="input-glass pl-10" />
          </div>
          <div className="relative col-span-1 md:col-span-6 lg:w-48">
             <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
             <select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="select-glass pl-10 pr-8">
                <option value="NAME_ASC">{t('sort_name_asc')}</option>
                <option value="NAME_DESC">{t('sort_name_desc')}</option>
                <option value="USAGE_DESC">{t('sort_usage_desc')}</option>
                <option value="STATUS">{t('status')}</option>
             </select>
          </div>
          <div className="relative col-span-1 md:col-span-6 lg:w-40">
             <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
             <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select-glass pl-10 pr-8">
                <option value="ALL">{t('filter_all')}</option>
                <option value="AVAILABLE">{t('filter_avail')}</option>
                <option value="IN_USE">{t('filter_in_use')}</option>
             </select>
          </div>
          <button onClick={() => setIsAdding(true)} className="col-span-2 md:col-span-12 lg:w-auto btn-primary px-6">
            <Plus size={18} /> {t('add_unit')}
          </button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-palette-mustard/10 rounded-full text-palette-mustard dark:text-palette-yellow shadow-sm"><Gamepad2 size={18} /></div>
          <h3 className="text-lg font-bold text-palette-navy dark:text-white uppercase tracking-tight">{t('active_consoles')}</h3>
          <span className="ml-auto text-label bg-white/30 dark:bg-white/5 border border-slate-300 dark:border-white/10 px-3 py-1 rounded-full shadow-sm backdrop-blur-md normal-case">Total: {filteredConsoles.length}</span>
        </div>

        <div className="grid grid-cols-1 min-[350px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
          {currentConsoles.map(console => {
            const isActive = console.status === ConsoleStatus.IN_USE;
            const isMaintenance = console.status === ConsoleStatus.MAINTENANCE;
            const session = isActive ? getSessionDetails(console.id, console.currentSessionId) : null;
            const imageUrl = console.imageUrl || DEFAULT_CONSOLE_IMAGE;
            
            return (
              <div key={console.id} className={`glass-card flex flex-col overflow-hidden group hover:shadow-2xl rounded-[2rem] ${isActive ? 'border-primary animate-pulse-border' : isMaintenance ? 'border-palette-copper/50 opacity-90' : 'hover:border-primary/40 hover:-translate-y-1 hover:shadow-inner'}`}>
                <div className="aspect-video w-full bg-slate-100 dark:bg-black/20 relative">
                  <img src={imageUrl} alt={console.name} className={`w-full h-full object-cover transition-all duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-105'} ${isMaintenance ? 'grayscale opacity-50' : ''}`} onError={(e) => (e.currentTarget.src = DEFAULT_CONSOLE_IMAGE)} />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70"></div>
                  
                  {isMaintenance && (
                     <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/70 backdrop-blur-[2px] animate-fade-in">
                        <div className="w-full h-full absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(249,115,22,0.1)_10px,rgba(249,115,22,0.1)_20px)] pointer-events-none"></div>
                        <Construction size={48} className="text-palette-copper mb-2 animate-bounce" />
                        <span className="bg-palette-copper text-white text-[10px] font-black px-4 py-1.5 rounded-full shadow-2xl border border-white/20 tracking-widest uppercase">{t('maintenance')}</span>
                     </div>
                  )}
                  
                  <div className="absolute top-3 right-3 flex flex-col md:flex-row gap-2 opacity-0 group-hover:opacity-100 transition-all z-20 translate-y-2 group-hover:translate-y-0">
                     <button onClick={() => toggleMaintenance(console)} className={`p-2.5 backdrop-blur-md rounded-full text-white transition-all shadow-lg ${isMaintenance ? 'bg-palette-copper hover:bg-palette-copper/80' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`} title={isMaintenance ? t('repair_done') : t('repair_mode')}><Wrench size={14} /></button>
                     <button onClick={() => setEditingConsole(console)} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 border border-white/10 shadow-lg"><Edit2 size={14} /></button>
                     <button onClick={() => setDeletingConsole(console)} className="p-2.5 bg-red-500/20 backdrop-blur-md rounded-full text-red-200 hover:bg-red-500/40 border border-red-500/20 shadow-lg"><Trash2 size={14} /></button>
                  </div>

                  <div className="absolute top-3 left-3 z-20">
                     <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 shadow-lg ${isActive ? 'bg-primary/90 text-white animate-pulse' : isMaintenance ? 'bg-palette-copper/90 text-white' : 'bg-emerald-500/90 text-white'}`}>
                        {isActive ? t('session_active') : isMaintenance ? t('maintenance') : t('available_status')}
                     </span>
                  </div>
                </div>

                <div className="p-4 sm:p-5 flex flex-col flex-1 relative">
                   <h3 className="font-black text-base sm:text-lg text-slate-900 dark:text-white truncate mb-1" title={console.name}>{console.name}</h3>
                   
                   {isActive && session ? (
                      <div className="mt-2 space-y-3">
                         <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-500 dark:text-slate-400 flex items-center gap-2 font-bold max-w-[65%] truncate">
                                <div className="p-1 bg-primary/10 rounded-lg text-primary"><User size={10}/></div>
                                {session.tx.memberName}
                            </span>
                            <span className="font-mono font-black text-slate-900 dark:text-primary text-lg bg-black/5 dark:bg-white/5 px-2 py-0.5 rounded-lg">{session.formattedRemaining}</span>
                         </div>
                         <div className="h-3 w-full bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden shadow-inner">
                            <div className={`h-full transition-all duration-1000 ${session.isOvertime ? 'bg-red-500 animate-striped' : session.isWarning ? 'bg-palette-copper' : 'bg-gradient-to-r from-palette-mustard to-palette-purple'}`} style={{ width: `${session.progress}%` }}></div>
                         </div>
                         <div className="flex justify-between text-[9px] font-black uppercase tracking-tighter text-slate-400">
                            <span>{t('elapsed')} {session.formattedElapsed}</span>
                            <span className={session.isWarning ? 'text-palette-copper' : ''}>{session.isOvertime ? 'Overtime' : t('remaining')}</span>
                         </div>
                      </div>
                   ) : (
                      <div className="mt-2 flex-1 flex items-center text-slate-400 text-xs">
                         <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl w-full border border-dashed transition-colors ${isMaintenance ? 'bg-palette-copper/5 border-palette-copper/20 text-palette-copper' : 'bg-black/5 dark:bg-white/[0.02] border-slate-300 dark:border-white/10'}`}>
                            {isMaintenance ? <Construction size={16}/> : <Clock size={16} className="text-primary" />}
                            <span className="font-bold uppercase tracking-widest text-[10px]">{isMaintenance ? t('under_repair') : t('ready_to_play')}</span>
                         </div>
                      </div>
                   )}

                   <div className="mt-4 pt-4 border-t border-slate-200 dark:border-white/5">
                      {isActive && session ? (
                         <button onClick={() => initiateCheckout(session.tx)} className="w-full btn-primary bg-gradient-to-br from-red-500 to-red-700 shadow-lg shadow-red-500/40"><Power size={16} /> {t('stop_session')}</button>
                      ) : (
                         <button onClick={() => setSelectedConsoleId(console.id)} disabled={isMaintenance} className={`w-full h-control rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${isMaintenance ? 'bg-slate-100 dark:bg-slate-800/50 text-slate-400 cursor-not-allowed border border-white/5' : 'bg-gradient-to-br from-palette-green to-emerald-600 text-white hover:-translate-y-0.5 shadow-lg shadow-palette-green/30 active:scale-95'}`}>
                            {isMaintenance ? <span className="text-[10px]">Disabled</span> : <><Play size={16} fill="currentColor" /> {t('start_session')}</>}
                         </button>
                      )}
                   </div>
                </div>
              </div>
            );
          })}
        </div>
        {renderPagination()}
      </div>

      {/* RENTAL MODAL */}
      {selectedConsoleId && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
           <div className="bg-white/95 dark:bg-palette-navyLight/95 w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/5 backdrop-blur-3xl">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center shrink-0">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{t('new_rental_session')}</h3>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Ziezan Terminal v1.1.0</p>
                 </div>
                 <button onClick={resetModal} className="p-2.5 bg-black/5 dark:bg-white/5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"><X size={20} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto custom-scrollbar space-y-6">
                 {currentStep === 'INPUT' && (
                    <div className="space-y-6">
                       <div className="p-5 bg-black/5 dark:bg-black/20 rounded-3xl border border-slate-300 dark:border-white/10 shadow-inner">
                          <label className="text-label ml-1 mb-3 block">{t('select_member')}</label>
                          <div className="relative" ref={dropdownRef}>
                             <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                                <input type="text" placeholder={t('search_placeholder')} value={memberSearchTerm} onFocus={() => setIsMemberDropdownOpen(true)} onChange={(e) => { setMemberSearchTerm(e.target.value); setIsMemberDropdownOpen(true); }} className="input-standard pl-12" />
                             </div>
                             
                             {isMemberDropdownOpen && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white/95 dark:bg-palette-navy/95 border border-slate-300 dark:border-white/10 rounded-2xl shadow-2xl max-h-56 overflow-y-auto z-[160] backdrop-blur-2xl p-2 animate-zoom-in">
                                   {sortedAndFilteredMembers.length > 0 ? (
                                      sortedAndFilteredMembers.map(m => (
                                         <div key={m.id} onClick={() => { setRentalMemberId(m.id); setMemberSearchTerm(m.nickname || m.name); setIsMemberDropdownOpen(false); }} className="p-4 hover:bg-primary hover:text-white rounded-xl cursor-pointer transition-colors border-b border-black/5 dark:border-white/5 last:border-0 group">
                                            <p className="text-sm font-black truncate text-slate-800 dark:text-white group-hover:text-white">{m.nickname}</p>
                                            <p className="text-[10px] font-bold opacity-60 group-hover:opacity-100">{m.membershipId}</p>
                                         </div>
                                      ))
                                   ) : (
                                      <div className="p-4 text-center">
                                         <p className="text-xs text-slate-500 mb-3 font-bold">{t('member_not_found')}</p>
                                         <button onClick={handleQuickAddMember} className="w-full py-3 rounded-xl bg-primary/10 text-primary font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2"><UserPlus size={14}/> {t('add_new')}</button>
                                      </div>
                                   )}
                                </div>
                             )}
                          </div>
                          {rentalMemberId && <div className="text-xs text-emerald-500 font-black flex items-center gap-2 px-1 mt-3 animate-slide-in"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div> {t('member_selected')}</div>}
                       </div>

                       <div className="p-5 bg-black/5 dark:bg-black/20 rounded-3xl border border-slate-300 dark:border-white/10 shadow-inner">
                          <label className="text-label ml-1 mb-3 block">{t('duration_hrs')}</label>
                          <div className="flex items-center gap-5 bg-black/5 dark:bg-black/20 p-2 rounded-[2rem] border border-slate-300 dark:border-white/10">
                             <button onClick={() => setRentalDuration(Math.max(1, rentalDuration - 1))} className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 shadow-md flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 transition-all active:scale-90"><ChevronLeft size={24}/></button>
                             <div className="flex-1 text-center">
                                <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">{rentalDuration}</span>
                                <span className="text-[10px] font-black text-slate-500 block uppercase tracking-widest mt-1">{t('jam')}</span>
                             </div>
                             <button onClick={() => setRentalDuration(rentalDuration + 1)} className="w-14 h-14 rounded-2xl bg-white dark:bg-white/5 shadow-md flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 transition-all active:scale-90"><ChevronRight size={24}/></button>
                          </div>
                       </div>
                    </div>
                 )}

                 {currentStep === 'PAYMENT' && calculation && (
                    <div className="space-y-6 animate-fade-in">
                       <div className="bg-primary/10 p-6 rounded-3xl border border-primary/20 space-y-3 backdrop-blur-md shadow-inner">
                          <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                             <span className="text-slate-500">{t('normal_price')}</span>
                             <span className="text-slate-900 dark:text-white font-mono">Rp {(rentalDuration * settings.hourlyRate).toLocaleString()}</span>
                          </div>
                          {selectedPayment === 'BONUS' && calculation.freeHoursUsed > 0 && (
                             <div className="flex justify-between text-xs font-black text-emerald-500 uppercase tracking-wider">
                                <span className="flex items-center gap-1"><Gift size={14}/> {t('use_bonus')}</span>
                                <span className="font-mono">-Rp {(calculation.freeHoursUsed * settings.hourlyRate).toLocaleString()}</span>
                             </div>
                          )}
                          <div className="border-t border-primary/10 my-3"></div>
                          <div className="flex justify-between items-end">
                             <span className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('total_bill')}</span>
                             <span className="text-3xl font-black text-primary font-mono">Rp {calculation.totalCost.toLocaleString()}</span>
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => setSelectedPayment('CASH')} className={`p-5 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all backdrop-blur-md ${selectedPayment === 'CASH' ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20 scale-105' : 'border-slate-300 dark:border-white/5 text-slate-500 hover:border-slate-400 dark:hover:border-white/40'}`}>
                                <Wallet size={28} />
                                <span className="text-label">{t('pay_cash')}</span>
                            </button>
                            <button onClick={() => setSelectedPayment('QRIS')} className={`p-5 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all backdrop-blur-md ${selectedPayment === 'QRIS' ? 'border-primary bg-primary/10 text-primary shadow-lg shadow-primary/20 scale-105' : 'border-slate-300 dark:border-white/5 text-slate-500 hover:border-slate-400 dark:hover:border-white/40'}`}>
                                <QrCode size={28} />
                                <span className="text-label">QRIS</span>
                            </button>
                            <button onClick={() => { if(calculation.canUseBonus) setSelectedPayment('BONUS'); }} disabled={!calculation.canUseBonus} className={`col-span-2 p-5 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all backdrop-blur-md ${selectedPayment === 'BONUS' ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 shadow-lg shadow-emerald-500/20 scale-105' : 'border-slate-300 dark:border-white/5 text-slate-500 disabled:opacity-30 disabled:cursor-not-allowed hover:border-emerald-500/30'}`}>
                                <Gift size={28} />
                                <span className="text-label">{t('bonus_balance')} ({calculation.memberBonus} {t('jam')})</span>
                            </button>
                        </div>
                    </div>
                 )}

                 {currentStep === 'QRIS' && (
                    <div className="flex flex-col items-center justify-center py-6 animate-zoom-in">
                       <div className="w-56 h-56 bg-white p-4 rounded-3xl shadow-2xl mb-6 ring-4 ring-primary/10">
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MOCK_QRIS_PAYMENT" alt="QRIS" className="w-full h-full" />
                       </div>
                       <p className="text-lg font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{t('scan_to_pay')}</p>
                       <p className="text-xs text-slate-500 font-bold">{t('waiting_payment')}</p>
                    </div>
                 )}

                 {currentStep === 'CONFIRM' && (
                    <div className="text-center py-8 animate-zoom-in">
                       <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/20 border border-emerald-500/20 animate-pulse">
                          <Gamepad2 size={48} />
                       </div>
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight uppercase">{t('ready_start')}</h3>
                       <p className="text-slate-500 text-sm font-medium">{t('ready_start_desc')}</p>
                    </div>
                 )}
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-black/5 dark:bg-white/[0.02] shrink-0">
                 {currentStep === 'INPUT' ? (
                    <button onClick={handleNextStep} disabled={!rentalMemberId} className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed">{t('next_payment')}</button>
                 ) : currentStep === 'CONFIRM' ? (
                    <button onClick={handleConfirmRental} className="w-full btn-primary bg-gradient-to-br from-emerald-500 to-emerald-700 shadow-emerald-500/30">{t('start_session')}</button>
                 ) : (
                    <div className="flex gap-4">
                       <button onClick={() => setCurrentStep('INPUT')} className="flex-1 btn-glass border-2 hover:bg-white/10">{t('back')}</button>
                       <button onClick={handleNextStep} className="flex-[2] btn-primary">{currentStep === 'QRIS' ? t('paid_confirm') : t('confirm_pay')}</button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* CHECKOUT MODAL */}
      {checkoutTx && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
           <div className="bg-white/95 dark:bg-palette-navyLight/95 w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-200 dark:border-white/5 backdrop-blur-3xl">
              <div className="p-6 border-b border-slate-200 dark:border-white/5 flex justify-between items-center bg-black/5 dark:bg-white/5">
                 <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('checkout_session')}</h3>
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('finish_payment')}</p>
                 </div>
                 <button onClick={() => setCheckoutTx(null)} className="p-2.5 bg-black/10 dark:bg-white/10 rounded-full hover:bg-red-500 hover:text-white transition-all"><X size={20} /></button>
              </div>
              
              <div className="p-8 overflow-y-auto space-y-6">
                 <div className="space-y-4">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-slate-500">{t('members')}</span>
                        <span className="text-slate-900 dark:text-white">{checkoutTx.memberName}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-slate-500">{t('rental_duration')}</span>
                        <span className="text-slate-900 dark:text-white font-mono">{checkoutTx.durationHours} {t('jam')}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                        <span className="text-slate-500">{t('base_cost')}</span>
                        <span className="text-slate-900 dark:text-white font-mono">Rp {checkoutTx.cost.toLocaleString()}</span>
                    </div>
                    
                    <div className="p-5 bg-black/5 dark:bg-black/20 rounded-3xl border-2 border-dashed border-slate-300 dark:border-white/10 shadow-inner">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="p-2 bg-primary/10 rounded-xl text-primary"><ShoppingBag size={18}/></div>
                            <span className="text-label">{t('extra_cafe')}</span>
                        </div>
                        <FormattedNumberInput 
                            value={extraCost}
                            onChange={(v) => setExtraCost(v)}
                            className="w-full bg-white dark:bg-palette-navy/60 border border-white/40 dark:border-white/10 rounded-2xl px-5 py-4 text-right font-mono font-black text-xl focus:ring-2 focus:ring-primary outline-none text-slate-900 dark:text-white shadow-inner backdrop-blur-md"
                            placeholder="0"
                        />
                    </div>

                    <div className="border-t border-slate-200 dark:border-white/10 pt-4 flex justify-between items-center">
                        <span className="text-base font-black text-slate-900 dark:text-white uppercase tracking-widest">{t('final_total')}</span>
                        <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            Rp {(checkoutTx.cost + extraCost).toLocaleString()}
                        </span>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="text-label ml-1">{t('payment_settlement')}</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setCheckoutPayment('CASH')} className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${checkoutPayment === 'CASH' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-slate-300 dark:border-white/10 text-slate-500 backdrop-blur-md'}`}><Wallet size={18} /> {t('cash')}</button>
                        <button onClick={() => setCheckoutPayment('QRIS')} className={`p-4 rounded-2xl border-2 flex items-center justify-center gap-3 text-xs font-black uppercase tracking-widest transition-all ${checkoutPayment === 'QRIS' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-slate-300 dark:border-white/10 text-slate-500 backdrop-blur-md'}`}><QrCode size={18} /> QRIS</button>
                    </div>
                 </div>
              </div>

              <div className="p-6 border-t border-slate-200 dark:border-white/5 bg-black/5 dark:bg-white/[0.02]">
                 <button onClick={confirmCheckout} className="w-full btn-primary bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 shadow-red-500/30 gap-3"><Power size={20} /> {t('finish_save')}</button>
              </div>
           </div>
        </div>
      )}

      {/* ADD/EDIT MODAL */}
      {(isAdding || editingConsole) && (
         <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
            <div className="bg-white/95 dark:bg-palette-navyLight/95 w-full max-w-sm sm:rounded-[2rem] rounded-t-[2rem] shadow-2xl p-8 border border-slate-200 dark:border-white/5 backdrop-blur-3xl">
               <h3 className="text-xl font-black text-slate-900 dark:text-white mb-6 flex items-center gap-3 uppercase tracking-tight">
                  <div className="p-2 bg-primary/10 rounded-xl text-primary">{isAdding ? <PlusCircle size={22}/> : <Edit2 size={22}/>}</div>
                  {isAdding ? t('add_unit') : t('edit_unit')}
               </h3>
               
               <form onSubmit={isAdding ? handleAddConsole : handleUpdateConsole} className="space-y-5">
                  <div className="space-y-2">
                     <label className="text-label ml-1">{t('console_name')}</label>
                     <input type="text" required value={isAdding ? newConsoleName : editingConsole?.name} onChange={(e) => isAdding ? setNewConsoleName(e.target.value) : setEditingConsole(prev => prev ? {...prev, name: e.target.value} : null)} className="input-standard" placeholder={t('console_name_placeholder')} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-label ml-1">Image URL</label>
                     <div className="relative group">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
                        <input type="text" value={isAdding ? newConsoleImage : editingConsole?.imageUrl || ''} onChange={(e) => isAdding ? setNewConsoleImage(e.target.value) : setEditingConsole(prev => prev ? {...prev, imageUrl: e.target.value} : null)} className="input-standard pl-12" placeholder="https://..." />
                     </div>
                  </div>
                  <div className="pt-4 flex gap-4">
                     <button type="button" onClick={() => { setIsAdding(false); setEditingConsole(null); }} className="flex-1 btn-glass border-2 text-xs hover:bg-black/5">{t('cancel')}</button>
                     <button type="submit" className="flex-1 btn-primary text-xs">{t('save')}</button>
                  </div>
               </form>
            </div>
         </div>
      )}
      
      {/* DELETE CONFIRM */}
      {deletingConsole && (
          <div className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
              <div className="bg-white/95 dark:bg-palette-navyLight/95 sm:rounded-[2rem] rounded-t-[2rem] w-full max-w-sm shadow-2xl p-8 text-center border border-slate-200 dark:border-white/5 backdrop-blur-3xl">
                  <div className="w-20 h-20 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-zoom-in border border-red-500/20 shadow-2xl shadow-red-500/10"><AlertTriangle size={36} /></div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{t('delete_confirm')}</h3>
                  <p className="text-sm font-bold text-slate-500 mb-8 px-4">{t('delete_console_msg', { name: deletingConsole.name })}</p>
                  <div className="grid grid-cols-2 gap-4">
                      <button onClick={() => setDeletingConsole(null)} className="btn-glass border-2 text-xs">{t('cancel')}</button>
                      <button onClick={executeDelete} className="btn-primary bg-gradient-to-br from-red-500 to-red-700 text-xs shadow-red-500/30">{t('yes_delete')}</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Consoles;