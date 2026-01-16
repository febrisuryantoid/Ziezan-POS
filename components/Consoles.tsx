import React, { useState, useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus, PaymentMethod, Console } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Power, Timer, Wrench, Trash2, Play, Plus, X, Wallet, QrCode, CheckCircle, ArrowRight, Loader2, Edit2, Save, Search, Gamepad2, Gift } from 'lucide-react';

const Consoles: React.FC<{ operatorName: string }> = ({ operatorName }) => {
  const { consoles, members, startRental, stopRental, updateConsoleStatus, addConsole, updateConsole, deleteConsole, settings } = useData();
  const { t } = useLanguage();
  
  // Header State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  
  // Modal State
  const [selectedConsoleId, setSelectedConsoleId] = useState<string | null>(null);
  const [rentalMemberId, setRentalMemberId] = useState('');
  const [rentalDuration, setRentalDuration] = useState(1);
  const [currentStep, setCurrentStep] = useState<'INPUT' | 'PAYMENT' | 'QRIS' | 'CONFIRM'>('INPUT');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('CASH');
  
  // New/Edit Console State
  const [isAdding, setIsAdding] = useState(false);
  const [editingConsole, setEditingConsole] = useState<Console | null>(null);
  const [newConsoleName, setNewConsoleName] = useState('');

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

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Toolbar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        {/* Title Section */}
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('consoles')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">{t('manage_units_desc')}</p>
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
              className="pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
            />
          </div>

          {/* Filter */}
          <select 
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            <option value="ALL">{t('filter_all')}</option>
            <option value="AVAILABLE">{t('filter_avail')}</option>
            <option value="IN_USE">{t('filter_in_use')}</option>
          </select>

          {/* Add Button */}
          <button 
            onClick={() => setIsAdding(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm bg-brand-600 text-white hover:bg-brand-700 shadow-brand-500/20"
          >
            <Plus size={18} /> {t('add_unit')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="space-y-4">
        {/* Widget Header */}
        <div className="flex items-center gap-3 px-1">
          <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400 shadow-sm">
            <Gamepad2 size={20} className="md:w-6 md:h-6" />
          </div>
          <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
            {t('active_consoles')}
          </h3>
          <span className="ml-auto text-xs font-bold text-slate-500 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-full shadow-sm">
            {filteredConsoles.length}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredConsoles.map(console => {
            const isActive = console.status === ConsoleStatus.IN_USE;
            const isMaintenance = console.status === ConsoleStatus.MAINTENANCE;
            
            return (
              <div key={console.id} className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden ${
                isActive 
                  ? 'bg-white dark:bg-slate-900 border-brand-500 dark:border-brand-500 ring-1 ring-brand-500 shadow-lg shadow-brand-500/10' 
                  : isMaintenance 
                    ? 'bg-orange-50 dark:bg-slate-900 border-orange-200 dark:border-orange-900/50' 
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700'
              }`}>
                {/* Card Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800/50">
                   <div className="flex justify-between items-start">
                     <div>
                       <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                         {console.name}
                       </h3>
                       <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold mt-2 uppercase tracking-wide ${
                         isActive ? 'bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400' :
                         isMaintenance ? 'bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400' :
                         'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                       }`}>
                         <span className={`w-2 h-2 rounded-full ${
                            isActive ? 'bg-brand-500 animate-pulse' : isMaintenance ? 'bg-orange-500' : 'bg-emerald-500'
                         }`} />
                         {console.status.replace('_', ' ')}
                       </div>
                     </div>
                     
                     {!isActive && (
                       <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setEditingConsole(console)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-brand-600 transition-colors"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => updateConsoleStatus(console.id, isMaintenance ? ConsoleStatus.AVAILABLE : ConsoleStatus.MAINTENANCE)}
                            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-orange-500 transition-colors"
                            title="Toggle Maintenance"
                          >
                            <Wrench size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(console.id)}
                            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                       </div>
                     )}
                   </div>
                </div>

                {/* Card Body */}
                <div className="p-6">
                  {isActive ? (
                    <div className="space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl flex items-center gap-4">
                         <div className="p-3 bg-white dark:bg-slate-700 rounded-full text-brand-500 shadow-sm">
                            <Timer size={24} className="animate-pulse" />
                         </div>
                         <div>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('status')}</p>
                           <p className="text-sm font-bold text-slate-900 dark:text-white">{t('session_active')}</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => console.currentSessionId && stopRental(console.currentSessionId)}
                        className="w-full py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                      >
                        <Power size={18} /> {t('stop_session')}
                      </button>
                    </div>
                  ) : isMaintenance ? (
                    <div className="flex flex-col items-center justify-center h-32 text-orange-400 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl border border-dashed border-orange-200 dark:border-orange-800/50">
                      <Wrench size={32} className="mb-2 opacity-50" />
                      <p className="text-sm font-medium">{t('under_maintenance')}</p>
                    </div>
                  ) : (
                    <div>
                      {selectedConsoleId === console.id ? (
                        /* Rental Modal / Flow within Card */
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in relative">
                          <button onClick={resetModal} className="absolute top-2 right-2 text-slate-400 hover:text-slate-600"><X size={16}/></button>
                          
                          {/* STEP 1: INPUT */}
                          {currentStep === 'INPUT' && (
                            <div className="space-y-3">
                               <div className="space-y-1">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase">{t('select_member')}</label>
                                 <select 
                                   className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg px-2 py-2"
                                   value={rentalMemberId}
                                   onChange={(e) => setRentalMemberId(e.target.value)}
                                 >
                                   <option value="">-- {t('select_member')} --</option>
                                   {members.filter(m => m.status === 'ACTIVE').map(m => (
                                     <option key={m.id} value={m.id}>{m.name} {m.freeHoursBalance > 0 ? `(${m.freeHoursBalance}h Free)` : ''}</option>
                                   ))}
                                 </select>
                               </div>
                               <div className="space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500 uppercase">{t('duration_hrs')}</label>
                                  <input 
                                    type="number" min="1" max="12" value={rentalDuration} onChange={(e) => setRentalDuration(Number(e.target.value))}
                                    className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-900 dark:text-white text-sm rounded-lg px-2 py-2"
                                  />
                               </div>
                               {calculation && (
                                 <div className="bg-white dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 text-xs space-y-1">
                                    <div className="flex justify-between">
                                        <span>Durasi:</span>
                                        <span className="font-bold">{rentalDuration} Jam</span>
                                    </div>
                                    <div className="flex justify-between text-slate-500">
                                        <span>{t('cost')}:</span> 
                                        <span>Rp {(rentalDuration * settings.hourlyRate).toLocaleString()}</span>
                                    </div>
                                    {calculation.freeHoursUsed > 0 && (
                                       <div className="flex justify-between text-green-600 font-bold bg-green-50 dark:bg-green-900/10 px-1 rounded">
                                            <span className="flex items-center gap-1"><Gift size={10}/> Pakai Bonus:</span> 
                                            <span>-{calculation.freeHoursUsed} Jam</span>
                                       </div>
                                    )}
                                    <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1 flex justify-between font-bold text-sm">
                                       <span>Bayar:</span> <span className="text-brand-600">Rp {calculation.totalCost.toLocaleString()}</span>
                                    </div>
                                    {calculation.totalCost === 0 && (
                                        <div className="text-center text-[10px] text-green-600 font-bold mt-1">Gratis (Full Poin)</div>
                                    )}
                                 </div>
                               )}
                               <button onClick={handleNextStep} disabled={!rentalMemberId} className="w-full py-2 bg-brand-600 text-white rounded-lg text-xs font-bold mt-2 disabled:opacity-50">Lanjut Bayar</button>
                            </div>
                          )}

                          {/* STEP 2: PAYMENT METHOD */}
                          {currentStep === 'PAYMENT' && (
                            <div className="space-y-3">
                               <p className="text-xs font-bold text-center text-slate-600 dark:text-slate-300">{t('pay_method')}</p>
                               <div className="grid grid-cols-2 gap-2">
                                  <button 
                                    onClick={() => setSelectedPayment('CASH')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedPayment === 'CASH' ? 'bg-green-50 border-green-500 text-green-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                  >
                                     <Wallet size={20} className="mb-1" />
                                     <span className="text-[10px] font-bold">CASH</span>
                                  </button>
                                  <button 
                                    onClick={() => setSelectedPayment('QRIS')}
                                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedPayment === 'QRIS' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                  >
                                     <QrCode size={20} className="mb-1" />
                                     <span className="text-[10px] font-bold">QRIS</span>
                                  </button>
                                </div>
                               <button onClick={handleNextStep} className="w-full py-2 bg-brand-600 text-white rounded-lg text-xs font-bold mt-2">
                                 {selectedPayment === 'CASH' ? t('confirm_pay') : t('scan_qris')}
                               </button>
                            </div>
                          )}

                          {/* STEP 3: QRIS DISPLAY */}
                          {currentStep === 'QRIS' && (
                             <div className="text-center space-y-3">
                               <p className="text-xs font-bold text-slate-600 dark:text-slate-300">{t('scan_qris')}</p>
                               <div className="bg-white p-2 rounded-lg border border-slate-200 inline-block">
                                 <img src="https://beeimg.com/images/k55144992704.jpg" alt="QRIS" className="w-32 h-32 object-cover rounded" />
                               </div>
                               <p className="text-[10px] text-slate-400">{t('total')}: Rp {calculation?.totalCost.toLocaleString()}</p>
                               <button onClick={handleNextStep} className="w-full py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold mt-2 animate-pulse">
                                 {t('paid_confirm')}
                               </button>
                             </div>
                          )}

                          {/* STEP 4: CONFIRMATION */}
                          {currentStep === 'CONFIRM' && (
                             <div className="text-center space-y-3">
                               <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                                 <CheckCircle size={24} />
                               </div>
                               <div>
                                 <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{t('ready_start')}</p>
                                 <p className="text-[10px] text-slate-500 mt-1">
                                   {consoles.find(c => c.id === selectedConsoleId)?.name}<br/>
                                   Duration: {rentalDuration} Hours<br/>
                                   Pay: {selectedPayment} (Rp {calculation?.totalCost.toLocaleString()})
                                 </p>
                               </div>
                               <button onClick={handleConfirmRental} className="w-full py-2 bg-brand-600 text-white rounded-lg text-xs font-bold mt-2 shadow-lg shadow-brand-500/30">
                                 {t('start_session')}
                               </button>
                             </div>
                          )}
                        </div>
                      ) : (
                        <button 
                          onClick={() => setSelectedConsoleId(console.id)}
                          className="w-full py-3 bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-500 dark:text-slate-400 rounded-xl font-bold transition-all flex items-center justify-center gap-2 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/10"
                        >
                          <Play size={20} className="fill-current" /> {t('rent_unit')}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
           {filteredConsoles.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-12 md:py-20 text-slate-500 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-300 dark:border-slate-800">
               <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3 md:mb-4">
                 <Gamepad2 className="w-8 h-8 md:w-12 md:h-12 text-slate-400/80" />
               </div>
               <p className="font-medium text-sm md:text-base">{t('no_data_consoles')}</p>
             </div>
           )}
        </div>
      </div>

      {/* MODALS */}
      {/* ADD MODAL */}
      {isAdding && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('add_unit')}</h3>
                 <button onClick={() => setIsAdding(false)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
             </div>
             <form onSubmit={handleAddConsole} className="space-y-4">
               <div>
                 <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">{t('console_name')}</label>
                 <input 
                  type="text" 
                  value={newConsoleName} 
                  onChange={(e) => setNewConsoleName(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                  placeholder="e.g. PlayStation 5 - Unit 04"
                  required
                  autoFocus
                />
               </div>
               <div className="flex justify-end pt-4">
                  <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 transition-all w-full justify-center sm:w-auto">
                    <Save size={18} /> {t('save')}
                  </button>
               </div>
             </form>
           </div>
         </div>
      )}

      {/* EDIT MODAL */}
      {editingConsole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md shadow-2xl p-6">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('edit_unit')}</h3>
                 <button onClick={() => setEditingConsole(null)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              </div>
              <form onSubmit={handleUpdateConsole} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1.5">{t('console_name')}</label>
                    <input 
                      required 
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all" 
                      value={editingConsole.name} 
                      onChange={e => setEditingConsole({...editingConsole, name: e.target.value})} 
                    />
                 </div>
                 <div className="flex justify-end pt-4">
                    <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-brand-700 transition-all w-full justify-center sm:w-auto">
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