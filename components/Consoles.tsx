import React, { useState, useMemo, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus, PaymentMethod, Console } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Power, Timer, Wrench, Trash2, Play, Plus, X, Wallet, QrCode, CheckCircle, ArrowRight, Loader2, Edit2, Save, Search, Gamepad2, Gift, User, Clock, AlertCircle, PlusCircle, Hourglass } from 'lucide-react';

const Consoles: React.FC<{ operatorName: string }> = ({ operatorName }) => {
  const { consoles, members, startRental, stopRental, updateConsoleStatus, addConsole, updateConsole, deleteConsole, settings, transactions } = useData();
  const { t } = useLanguage();
  
  // Header State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Modal State (Rental)
  const [selectedConsoleId, setSelectedConsoleId] = useState<string | null>(null);
  const [rentalMemberId, setRentalMemberId] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [currentStep, setCurrentStep] = useState<'INPUT' | 'PAYMENT' | 'QRIS' | 'CONFIRM'>('INPUT');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CASH');
  
  // New/Edit Console State
  const [isAdding, setIsAdding] = useState(false);
  const [editingConsole, setEditingConsole] = useState<Console | null>(null);
  const [newConsoleName, setNewConsoleName] = useState('');
  
  // Real-time ticker for progress bars
  const [now, setNow] = useState(new Date());

  // HIGH ACCURACY TIMER: Update every 1 second
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000); 
    return () => clearInterval(timer);
  }, []);

  // Filtering Logic
  const filteredConsoles = consoles.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'ALL' ? true : 
                          filterStatus === 'AVAILABLE' ? c.status === ConsoleStatus.AVAILABLE :
                          filterStatus === 'IN_USE' ? c.status === ConsoleStatus.IN_USE :
                          c.status === ConsoleStatus.MAINTENANCE;
    return matchesSearch && matchesFilter;
  });

  // Derived Values for Calculation
  const calculation = useMemo(() => {
    if (!rentalMemberId || !rentalDuration) return null;
    const member = members.find(m => m.id === rentalMemberId);
    if (!member) return null;

    let hoursToPay = rentalDuration;
    let freeHoursUsed = 0;

    if (member.freeHoursBalance > 0) {
      if (member.freeHoursBalance >= rentalDuration) {
        freeHoursUsed = rentalDuration;
        hoursToPay = 0;
      } else {
        freeHoursUsed = member.freeHoursBalance;
        hoursToPay = rentalDuration - member.freeHoursBalance;
      }
    }

    return {
      totalCost: hoursToPay * settings.hourlyRate,
      freeHoursUsed,
      finalHoursToPay: hoursToPay
    };
  }, [rentalMemberId, rentalDuration, members, settings.hourlyRate]);

  const resetModal = () => {
    setSelectedConsoleId(null);
    setRentalMemberId('');
    setRentalDuration(1);
    setCurrentStep('INPUT');
    setSelectedPayment('CASH');
  };

  const handleNextStep = () => {
    if (currentStep === 'INPUT' && rentalMemberId) {
      setCurrentStep('PAYMENT');
    } else if (currentStep === 'PAYMENT') {
      if (selectedPayment === 'QRIS') {
        setCurrentStep('QRIS');
      } else {
        setCurrentStep('CONFIRM');
      }
    } else if (currentStep === 'QRIS') {
      setCurrentStep('CONFIRM');
    }
  };

  const handleConfirmRental = () => {
    if (selectedConsoleId && rentalMemberId) {
      startRental(rentalMemberId, selectedConsoleId, rentalDuration, operatorName, selectedPayment);
      resetModal();
    }
  };

  const handleAddConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(newConsoleName) {
      addConsole({ name: newConsoleName });
      setNewConsoleName('');
      setIsAdding(false);
    }
  }

  const handleUpdateConsole = (e: React.FormEvent) => {
    e.preventDefault();
    if(editingConsole && editingConsole.name) {
      updateConsole(editingConsole.id, editingConsole.name);
      setEditingConsole(null);
    }
  }

  const handleDelete = (id: string) => {
    if(confirm(t('delete_confirm'))) {
      const success = deleteConsole(id);
      if(!success) {
        alert(t('unit_in_use'));
      }
    }
  }

  // Helper to format Seconds into HH:MM:SS
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const mStr = m.toString().padStart(2, '0');
    const sStr = s.toString().padStart(2, '0');

    if (h > 0) return `${h}:${mStr}:${sStr}`;
    return `${mStr}:${sStr}`;
  };

  // UX Helper: Get active session details
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
     
     // Progress Calculation (0 to 100)
     const progress = Math.min(100, Math.max(0, (elapsedMs / durationMs) * 100));
     
     const isOvertime = timeRemainingMs < 0;
     const isWarning = timeRemainingMs > 0 && timeRemainingMs <= (15 * 60 * 1000); // 15 mins

     return { 
        tx, 
        progress, 
        isOvertime, 
        isWarning,
        formattedElapsed: formatTime(elapsedMs),
        formattedRemaining: formatTime(timeRemainingMs)
     };
  }

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Title Section */}
        <div>
          <h2 className="text-2xl font-bold text-palette-navy dark:text-white">{t('consoles')}</h2>
          <p className="text-palette-brown/70 dark:text-palette-cream/60 text-sm">{t('manage_units_desc')}</p>
        </div>
        
        {/* Actions Section */}
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

          {/* Filter */}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-11 px-4 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white"
          >
            <option value="ALL">{t('filter_all')}</option>
            <option value="AVAILABLE">{t('filter_avail')}</option>
            <option value="IN_USE">{t('filter_in_use')}</option>
          </select>

          {/* Add Button */}
          <button 
            onClick={() => setIsAdding(true)}
            className="h-11 px-5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg bg-palette-mustard text-white hover:bg-palette-mustard/90 shadow-palette-mustard/30"
          >
            <Plus size={18} /> {t('add_unit')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="space-y-4">
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-palette-mustard/10 rounded-lg text-palette-mustard dark:text-palette-yellow shadow-sm">
            <Gamepad2 size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-palette-navy dark:text-white">
            {t('active_consoles')}
          </h3>
          <span className="ml-auto text-xs font-bold text-palette-brown/70 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 px-3 py-1 rounded-full shadow-sm">
            {filteredConsoles.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConsoles.map(console => {
            const isActive = console.status === ConsoleStatus.IN_USE;
            const isMaintenance = console.status === ConsoleStatus.MAINTENANCE;
            const session = isActive ? getSessionDetails(console.id, console.currentSessionId) : null;
            
            return (
              <div key={console.id} className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                isActive 
                  ? 'bg-white dark:bg-palette-navyLight border-palette-mustard ring-1 ring-palette-mustard shadow-xl shadow-palette-mustard/20' 
                  : isMaintenance 
                    ? 'bg-white dark:bg-palette-navyLight border-palette-copper/30' 
                    : 'bg-white dark:bg-palette-navyLight border-slate-200 dark:border-white/5 hover:border-palette-green/50 dark:hover:border-palette-green/50 hover:shadow-lg'
              }`}>
                {/* Active Indicator Strip */}
                {isActive && (
                   <div className={`absolute top-0 left-0 w-full h-1.5 ${
                       session?.isOvertime ? 'bg-palette-red animate-pulse' : 
                       session?.isWarning ? 'bg-palette-copper' : 'bg-palette-mustard'
                   }`}></div>
                )}

                {/* Card Header */}
                <div className="p-5 pb-2">
                   <div className="flex justify-between items-start">
                     <div className="flex-1 mr-2 min-w-0">
                       <h3 className="text-lg font-bold text-palette-navy dark:text-white leading-tight truncate" title={console.name}>
                         {console.name}
                       </h3>
                       <div className="flex flex-wrap gap-2 mt-2">
                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide flex-shrink-0 ${
                                isActive 
                                    ? (session?.isOvertime ? 'bg-palette-red/10 text-palette-red' : 'bg-palette-mustard/10 text-palette-mustard dark:text-palette-yellow')
                                    : isMaintenance ? 'bg-palette-copper/10 text-palette-copper' : 'bg-palette-green/10 text-palette-green'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    isActive ? 'bg-current animate-pulse' : 'bg-current'
                                }`} />
                                {isActive && session?.isOvertime ? 'OVERTIME' : console.status.replace('_', ' ')}
                            </div>
                            
                            {/* Member Name Badge if Active */}
                            {isActive && session && (
                                <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 text-xs font-bold truncate max-w-[120px]">
                                    <User size={10} /> {session.tx.memberName}
                                </div>
                            )}
                       </div>
                     </div>
                     
                     {!isActive && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                          <button onClick={() => setEditingConsole(console)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-palette-mustard transition-colors"><Edit2 size={16} /></button>
                          <button onClick={() => updateConsoleStatus(console.id, isMaintenance ? ConsoleStatus.AVAILABLE : ConsoleStatus.MAINTENANCE)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 hover:text-palette-copper transition-colors"><Wrench size={16} /></button>
                          <button onClick={() => handleDelete(console.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                       </div>
                     )}
                   </div>
                </div>

                {/* Card Body & UX Visuals */}
                <div className="p-5 pt-2 flex-1 flex flex-col justify-end">
                  {isActive && session ? (
                    <div className="space-y-4">
                      {/* VISUAL TIMER & PROGRESS */}
                      <div className="flex items-center gap-4 py-3">
                         {/* Circular Progress - Fixed size & Shrink prevention */}
                         <div className="relative w-14 h-14 flex-shrink-0">
                             <svg className="w-full h-full transform -rotate-90">
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100 dark:text-white/10" />
                                <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="transparent" 
                                    strokeDasharray={150.7} 
                                    strokeDashoffset={150.7 - (150.7 * session.progress) / 100}
                                    strokeLinecap="round"
                                    className={`transition-all duration-1000 ease-linear ${session.isOvertime ? 'text-palette-red' : session.isWarning ? 'text-palette-copper' : 'text-palette-mustard'}`}
                                />
                             </svg>
                             <div className="absolute inset-0 flex items-center justify-center">
                                 <Timer size={20} className={session.isOvertime ? 'text-palette-red animate-pulse' : 'text-slate-400'} />
                             </div>
                         </div>
                         
                         {/* Text Details - High Precision */}
                         <div className="flex-1 grid grid-cols-2 gap-x-2 gap-y-1">
                             <div className="flex flex-col">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Jalan</span>
                                <span className="text-lg font-black font-mono leading-none text-palette-navy dark:text-white">
                                    {session.formattedElapsed}
                                </span>
                             </div>
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Sisa</span>
                                <span className={`text-lg font-black font-mono leading-none ${session.isOvertime ? 'text-palette-red animate-pulse' : session.isWarning ? 'text-palette-copper' : 'text-palette-green'}`}>
                                    {session.isOvertime ? '-' : ''}{session.formattedRemaining}
                                </span>
                             </div>
                             <div className="col-span-2 pt-1">
                                <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full rounded-full transition-all duration-1000 ease-linear ${session.isOvertime ? 'bg-palette-red w-full' : session.isWarning ? 'bg-palette-copper' : 'bg-palette-mustard'}`} style={{ width: `${session.progress}%` }}></div>
                                </div>
                             </div>
                         </div>
                      </div>

                      {/* QUICK ACTIONS ROW */}
                      <div className="grid grid-cols-4 gap-2">
                          <button className="col-span-1 py-2 rounded-lg bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/20 flex flex-col items-center justify-center gap-0.5 text-[10px] font-bold transition-colors" title="Extend 1 Hour">
                              <PlusCircle size={14}/> +1 Jam
                          </button>
                          <button 
                            onClick={() => console.currentSessionId && stopRental(console.currentSessionId)}
                            className="col-span-3 py-2.5 bg-palette-red hover:bg-palette-red/90 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-palette-red/20 flex items-center justify-center gap-2"
                          >
                            <Power size={16} /> {t('stop_session')}
                          </button>
                      </div>
                    </div>
                  ) : isMaintenance ? (
                    <div className="flex flex-col items-center justify-center h-32 text-palette-copper bg-orange-50 dark:bg-orange-900/10 rounded-xl border border-palette-copper/20">
                      <Wrench size={32} className="mb-2 opacity-80" />
                      <p className="text-sm font-bold">{t('under_maintenance')}</p>
                    </div>
                  ) : (
                    <button 
                      onClick={() => setSelectedConsoleId(console.id)}
                      className="w-full py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-palette-green hover:bg-palette-green/5 text-slate-500 hover:text-palette-green dark:text-slate-400 rounded-2xl font-bold transition-all flex flex-col items-center justify-center gap-1"
                    >
                      <Play size={24} className="fill-current mb-1" /> 
                      <span className="text-sm">{t('rent_unit')}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
           {filteredConsoles.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-slate-500 bg-white dark:bg-palette-navyLight rounded-3xl border border-slate-200 dark:border-white/10">
               <div className="p-4 md:p-6 bg-slate-50 dark:bg-white/5 rounded-full mb-3 md:mb-4">
                 <Gamepad2 className="w-8 h-8 md:w-12 md:h-12 text-slate-400/80" />
               </div>
               <p className="font-medium text-sm md:text-base">{t('no_data_consoles')}</p>
             </div>
           )}
        </div>
      </div>

      {/* --- MODALS --- */}
      
      {/* 1. RENTAL MODAL (Center Overlay) */}
      {selectedConsoleId && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10 flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="px-6 py-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50 dark:bg-white/5">
                 <div>
                    <h3 className="text-xl font-bold text-palette-navy dark:text-white flex items-center gap-2">
                       <Gamepad2 className="text-palette-mustard" size={24} />
                       {consoles.find(c => c.id === selectedConsoleId)?.name}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('new_rental_session')}</p>
                 </div>
                 <button onClick={resetModal} className="p-2 bg-white dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors border border-slate-200 dark:border-white/10 text-slate-500">
                    <X size={20}/>
                 </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto">
                 {/* STEP 1: INPUT */}
                  {currentStep === 'INPUT' && (
                    <div className="space-y-5">
                       <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><User size={14}/> {t('select_member')}</label>
                         <div className="relative">
                            <select 
                               className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-base rounded-xl px-4 py-3 focus:ring-2 focus:ring-palette-mustard focus:outline-none appearance-none font-medium"
                               value={rentalMemberId}
                               onChange={(e) => setRentalMemberId(e.target.value)}
                             >
                               <option value="">{t('select_member_placeholder')}</option>
                               {members.filter(m => m.status === 'ACTIVE').map(m => (
                                 <option key={m.id} value={m.id}>{m.name} {m.freeHoursBalance > 0 ? `(Bonus: ${m.freeHoursBalance}h)` : ''}</option>
                               ))}
                             </select>
                             <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <ArrowRight size={16} className="rotate-90" />
                             </div>
                         </div>
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={14}/> {t('duration_hrs')}</label>
                          <div className="flex items-center gap-4">
                             <button onClick={() => setRentalDuration(Math.max(1, rentalDuration - 1))} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xl hover:bg-palette-mustard/20 transition-colors">-</button>
                             <input 
                                type="number" min="1" max="12" value={rentalDuration} onChange={(e) => setRentalDuration(Number(e.target.value))}
                                className="flex-1 bg-slate-50 dark:bg-palette-navy border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-xl text-center font-bold rounded-xl py-2.5 focus:ring-2 focus:ring-palette-mustard focus:outline-none"
                              />
                             <button onClick={() => setRentalDuration(rentalDuration + 1)} className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold text-xl hover:bg-palette-mustard/20 transition-colors">+</button>
                          </div>
                       </div>

                       {calculation && (
                         <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10 space-y-2">
                            <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                                <span>{t('duration_label')}</span>
                                <span className="font-bold">{rentalDuration} {t('jam')}</span>
                            </div>
                            <div className="flex justify-between text-slate-600 dark:text-slate-300 text-sm">
                                <span>{t('cost')}:</span> 
                                <span>Rp {(rentalDuration * settings.hourlyRate).toLocaleString()}</span>
                            </div>
                            {calculation.freeHoursUsed > 0 && (
                               <div className="flex justify-between text-palette-green dark:text-palette-green font-bold bg-palette-green/10 px-2 py-1 rounded-lg text-sm">
                                    <span className="flex items-center gap-1"><Gift size={14}/> {t('use_bonus')}</span> 
                                    <span>-{calculation.freeHoursUsed} {t('jam')}</span>
                               </div>
                            )}
                            <div className="border-t-2 border-dashed border-slate-200 dark:border-white/10 mt-2 pt-2 flex justify-between items-center">
                               <span className="font-bold text-slate-900 dark:text-white">{t('total_pay')}</span> 
                               <span className="text-xl font-black text-palette-mustard">Rp {calculation.totalCost.toLocaleString()}</span>
                            </div>
                         </div>
                       )}
                       
                       <button 
                          onClick={handleNextStep} 
                          disabled={!rentalMemberId} 
                          className="w-full py-4 bg-palette-mustard hover:bg-palette-mustard/90 text-white rounded-xl font-bold text-base mt-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-palette-mustard/30 hover:-translate-y-1"
                        >
                          Lanjut Pembayaran
                        </button>
                    </div>
                  )}

                  {/* STEP 2: PAYMENT METHOD */}
                  {currentStep === 'PAYMENT' && (
                    <div className="space-y-6">
                       <div className="text-center">
                          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">{t('pay_method')}</p>
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => setSelectedPayment('CASH')}
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${selectedPayment === 'CASH' ? 'bg-palette-green/10 border-palette-green text-palette-green ring-2 ring-palette-green/20' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}
                              >
                                 <Wallet size={32} className="mb-2" />
                                 <span className="text-sm font-bold">{t('pay_cash')}</span>
                              </button>
                              <button 
                                onClick={() => setSelectedPayment('QRIS')}
                                className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${selectedPayment === 'QRIS' ? 'bg-blue-50 dark:bg-blue-900/10 border-blue-500 text-blue-600 ring-2 ring-blue-200' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 hover:border-slate-300'}`}
                              >
                                 <QrCode size={32} className="mb-2" />
                                 <span className="text-sm font-bold">QRIS</span>
                              </button>
                            </div>
                       </div>
                       
                       <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl text-center border border-slate-100 dark:border-white/10">
                          <span className="text-sm text-slate-500">{t('total_bill')}</span>
                          <p className="text-2xl font-black text-palette-navy dark:text-white mt-1">Rp {calculation?.totalCost.toLocaleString()}</p>
                       </div>

                       <div className="flex gap-3">
                         <button onClick={() => setCurrentStep('INPUT')} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200">{t('back')}</button>
                         <button onClick={handleNextStep} className="flex-[2] py-3 bg-palette-mustard text-white rounded-xl font-bold hover:bg-palette-mustard/90 shadow-lg shadow-palette-mustard/20">
                           {selectedPayment === 'CASH' ? t('confirm_pay') : t('scan_qris')}
                         </button>
                       </div>
                    </div>
                  )}

                  {/* STEP 3: QRIS DISPLAY */}
                  {currentStep === 'QRIS' && (
                     <div className="text-center space-y-6">
                       <div className="bg-white p-4 rounded-2xl border border-slate-200 inline-block shadow-lg">
                         <img src="https://beeimg.com/images/k55144992704.jpg" alt="QRIS" className="w-48 h-48 object-cover rounded-lg" />
                         <p className="text-xs font-bold text-slate-900 mt-2">{t('scan_to_pay')}</p>
                       </div>
                       <div>
                          <p className="text-sm text-slate-500">{t('total')}</p>
                          <p className="text-2xl font-bold text-slate-900 dark:text-white">Rp {calculation?.totalCost.toLocaleString()}</p>
                       </div>
                       <div className="flex gap-3">
                         <button onClick={() => setCurrentStep('PAYMENT')} className="flex-1 py-3 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200">{t('back')}</button>
                         <button onClick={handleNextStep} className="flex-[2] py-3 bg-palette-green text-white rounded-xl font-bold hover:bg-palette-green/90 shadow-lg shadow-palette-green/20">
                           {t('paid_confirm')}
                         </button>
                       </div>
                     </div>
                  )}

                  {/* STEP 4: CONFIRMATION */}
                  {currentStep === 'CONFIRM' && (
                     <div className="text-center space-y-6 py-4">
                       <div className="w-20 h-20 bg-palette-green/10 text-palette-green rounded-full flex items-center justify-center mx-auto animate-zoom-in">
                         <CheckCircle size={40} />
                       </div>
                       <div>
                         <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('ready_start')}</h4>
                         <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl inline-block w-full text-left border border-slate-100 dark:border-white/10">
                             <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-500">{t('unit_label')}</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{consoles.find(c => c.id === selectedConsoleId)?.name}</span>
                             </div>
                             <div className="flex justify-between mb-2">
                                <span className="text-sm text-slate-500">{t('duration_label')}</span>
                                <span className="text-sm font-bold text-slate-900 dark:text-white">{rentalDuration} {t('jam')}</span>
                             </div>
                             <div className="flex justify-between">
                                <span className="text-sm text-slate-500">{t('method_label')}</span>
                                <span className="text-sm font-bold text-palette-mustard">{selectedPayment}</span>
                             </div>
                         </div>
                       </div>
                       <button onClick={handleConfirmRental} className="w-full py-4 bg-palette-mustard text-white rounded-xl font-bold text-lg shadow-xl shadow-palette-mustard/30 hover:bg-palette-mustard/90 hover:-translate-y-1 transition-all">
                         {t('start_session')}
                       </button>
                     </div>
                  )}
              </div>
           </div>
         </div>
      )}

      {/* 2. ADD MODAL */}
      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-white/10">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('add_unit')}</h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
             </div>
             <form onSubmit={handleAddConsole} className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">{t('console_name')}</label>
                 <input 
                  type="text" 
                  value={newConsoleName} 
                  onChange={(e) => setNewConsoleName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all"
                  placeholder={t('console_name_placeholder')}
                  required
                  autoFocus
                />
               </div>
               <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-2.5 bg-palette-mustard text-white rounded-xl font-bold flex items-center gap-2 hover:bg-palette-mustard/90 transition-all w-full justify-center sm:w-auto shadow-lg shadow-palette-mustard/20">
                    <Save size={18} /> {t('save')}
                  </button>
               </div>
             </form>
           </div>
         </div>
      )}

      {/* 3. EDIT MODAL */}
      {editingConsole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-md shadow-2xl p-6 border border-slate-200 dark:border-white/10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('edit_unit')}</h3>
                 <button onClick={() => setEditingConsole(null)} className="p-2 bg-slate-100 dark:bg-white/5 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleUpdateConsole} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">{t('console_name')}</label>
                    <input 
                      required 
                      className="w-full bg-slate-50 dark:bg-palette-navy border border-slate-300 dark:border-white/10 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all" 
                      value={editingConsole.name} 
                      onChange={e => setEditingConsole({...editingConsole, name: e.target.value})} 
                    />
                 </div>
                 <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 bg-palette-mustard text-white rounded-xl font-bold flex items-center gap-2 hover:bg-palette-mustard/90 transition-all w-full justify-center sm:w-auto shadow-lg shadow-palette-mustard/20">
                      <Save size={18}/> {t('save')}
                    </button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default Consoles;