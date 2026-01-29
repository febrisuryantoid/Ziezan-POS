
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, Filter, ChevronLeft, ChevronRight, Download, Search, Printer, Bluetooth, ArrowUpDown, Wallet, Receipt, DollarSign, Clock, Share2, Loader2 } from 'lucide-react';
import { PaymentMethod, Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { printReceiptBrowser, generateEscPosCommand } from '../utils/receipt';
import { bluetoothService } from '../services/bluetooth';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';
import { shareReceiptAsImage } from '../utils/shareReceipt';

type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'COST_DESC' | 'COST_ASC';

const Reports: React.FC = () => {
  const { transactions, settings } = useData();
  const { t, language } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt } = useBluetooth();
  const { addToast } = useToast();
  
  const toLocalDateString = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [startDate, setStartDate] = useState<string>(toLocalDateString(firstDay));
  const [endDate, setEndDate] = useState<string>(toLocalDateString(today));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);
  const [isSharing, setIsSharing] = useState<string | null>(null);

  const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      const datePart = date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });
      const timePart = date.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      return { datePart, timePart };
  };

  const filteredTransactions = transactions.filter(tx => {
    const memberName = tx.memberName || '';
    const consoleName = tx.consoleName || '';
    const txDateObj = new Date(tx.startTime);
    const txDateLocal = toLocalDateString(txDateObj);

    const isDateInRange = txDateLocal >= startDate && txDateLocal <= endDate;
    const isPaymentMatch = paymentFilter === 'ALL' ? true : tx.paymentMethod === paymentFilter;
    const isSearchMatch = 
        memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        consoleName.toLowerCase().includes(searchQuery.toLowerCase());

    return isDateInRange && isPaymentMatch && isSearchMatch;
  }).sort((a, b) => {
    switch (sortOption) {
        case 'DATE_DESC': return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
        case 'DATE_ASC': return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        case 'COST_DESC': return b.cost - a.cost;
        case 'COST_ASC': return a.cost - b.cost;
        default: return 0;
    }
  });

  const handleExportCSV = () => {
    // Localized Headers for CSV
    const headers = [
        "ID", 
        t('tx_time'), 
        t('member_identity'), 
        t('unit_used'), 
        t('duration_hrs'), 
        t('method'), 
        t('nominal'), 
        "Operator", 
        t('status')
    ];
    const rows = filteredTransactions.map(tx => [
        tx.id,
        new Date(tx.startTime).toLocaleDateString() + ' ' + new Date(tx.startTime).toLocaleTimeString(),
        `"${tx.memberName || t('unknown')}"`,
        `"${tx.consoleName || t('unknown')}"`,
        tx.durationHours,
        tx.paymentMethod,
        tx.cost,
        tx.operatorName,
        tx.status
    ]);
    const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Ziezan_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintWifi = () => { if (selectedTxForPrint) { printReceiptBrowser(selectedTxForPrint, settings); setSelectedTxForPrint(null); } };

  const handlePrintBluetooth = async () => {
    if (!selectedTxForPrint) return;
    if (!isBtConnected) { try { await connectBt(); } catch (e) { addToast('error', 'Error', 'Bluetooth Error'); return; } }
    const rawData = generateEscPosCommand(selectedTxForPrint, settings);
    const success = await bluetoothService.sendRawData(rawData);
    if (success) { addToast('success', t('print'), t('saved')); setSelectedTxForPrint(null); } else { addToast('error', 'Error', 'Print Failed'); }
  };
  
  const handleShare = async (tx: Transaction) => {
    setIsSharing(tx.id);
    const result = await shareReceiptAsImage(tx, settings);
    if (result.success) {
      addToast('success', 'Berhasil', result.message);
    } else {
      if (result.message !== 'Dibatalkan.') {
        addToast('error', 'Gagal', result.message);
      }
    }
    setIsSharing(null);
  };


  const totalItems = filteredTransactions.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [paymentFilter, itemsPerPage, startDate, endDate, searchQuery, sortOption]);

  const currentTransactions = itemsPerPage === -1 ? filteredTransactions : filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalRevenuePeriod = filteredTransactions.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div className="px-2">
          <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
             <div className="p-2 bg-palette-mustard/10 rounded-xl text-palette-mustard"><FileText size={24} /></div> {t('reports')}
          </h2>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">{t('audit_desc')}</p>
        </div>

        <div className="w-full lg:w-auto bg-white/40 dark:bg-emerald-600/30 backdrop-blur-xl rounded-3xl p-5 shadow-2xl text-emerald-600 dark:text-emerald-100 flex items-center gap-5 border border-slate-300 dark:border-emerald-500/20 relative overflow-hidden group">
            <div className="absolute -right-8 -top-8 w-24 h-24 bg-emerald-500/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
            <div className="p-4 bg-emerald-500/10 dark:bg-white/10 rounded-[1.5rem] backdrop-blur-md shadow-inner">
                <DollarSign size={28} className="text-emerald-500 dark:text-emerald-200" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('gross_revenue')}</p>
                <h3 className="text-3xl font-black tracking-tighter">Rp {totalRevenuePeriod.toLocaleString()}</h3>
            </div>
        </div>
      </div>
        
      {/* Search & Filter Bar - Glass Effect */}
      <div className="bg-white/40 dark:bg-white/[0.03] backdrop-blur-2xl rounded-[2.5rem] p-5 border border-slate-300 dark:border-white/5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-4 items-end">
           
           <div className="col-span-2 md:col-span-4 flex gap-2 items-center bg-white/40 dark:bg-black/40 p-1.5 rounded-2xl border border-slate-300 dark:border-white/10 backdrop-blur-md shadow-inner">
              <div className="relative flex-1">
                  <input 
                     type="date" 
                     value={startDate} 
                     onChange={(e) => setStartDate(e.target.value)}
                     className="w-full bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-700 dark:text-white focus:ring-0 px-3 py-2 [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                  />
              </div>
              <span className="text-slate-400 font-bold">/</span>
              <div className="relative flex-1">
                  <input 
                     type="date" 
                     value={endDate} 
                     onChange={(e) => setEndDate(e.target.value)}
                     className="w-full bg-transparent border-none text-[10px] sm:text-xs font-black text-slate-700 dark:text-white focus:ring-0 px-3 py-2 [color-scheme:light] dark:[color-scheme:dark] cursor-pointer"
                  />
              </div>
           </div>

           <div className="relative col-span-2 md:col-span-3">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t('search_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass pl-11"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
             <div className="relative">
                <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                <select 
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | PaymentMethod)}
                    className="select-glass pl-11 pr-4"
                >
                    <option value="ALL">{t('all')}</option>
                    <option value="CASH">CASH</option>
                    <option value="QRIS">QRIS</option>
                    <option value="BONUS">BONUS</option>
                </select>
             </div>
          </div>

          <div className="col-span-1 md:col-span-2">
             <div className="relative">
                <ArrowUpDown className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400" size={16} />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="select-glass pl-11 pr-4"
                >
                    <option value="DATE_DESC">Baru - Lama</option>
                    <option value="DATE_ASC">Lama - Baru</option>
                    <option value="COST_DESC">Nominal ↑</option>
                    <option value="COST_ASC">Nominal ↓</option>
                </select>
             </div>
          </div>

          <button onClick={handleExportCSV} className="col-span-2 md:col-span-1 btn-primary" title={t('export_csv')}>
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Main Table Container - Glass Effect */}
      <div className="bg-white/40 dark:bg-[#0f1016]/40 backdrop-blur-xl rounded-[2.5rem] border border-slate-300 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[550px]">
          <div className="p-5 border-b border-slate-300 dark:border-white/10 flex justify-between items-center bg-white/20 dark:bg-white/5">
             <div className="flex items-center gap-3 px-2">
                <div className="p-1.5 bg-white/10 rounded-lg text-slate-500"><Receipt size={18} /></div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{t('history_tx')}</span>
             </div>
             <div className="flex items-center gap-3 bg-black/10 dark:bg-white/5 px-3 py-1.5 rounded-xl border border-slate-300 dark:border-white/10">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('rows')}</span>
                <select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-transparent border-none text-slate-900 dark:text-white text-[10px] font-black focus:ring-0 cursor-pointer">
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={-1}>All</option>
                </select>
             </div>
          </div>
          
          {currentTransactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-80 text-slate-500 opacity-30">
                  <Search className="w-16 h-16 mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">{t('no_tx')}</p>
               </div>
          ) : (
            <>
              {/* DESKTOP TABLE */}
              <div className="hidden md:block flex-1 overflow-x-auto custom-scrollbar">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-transparent text-slate-500 text-[10px] font-black uppercase border-b border-slate-300 dark:border-white/10 tracking-widest">
                    <tr>
                      <th className="px-8 py-5">{t('tx_time')}</th>
                      <th className="px-8 py-5">{t('member_identity')}</th>
                      <th className="px-8 py-5">{t('unit_used')}</th>
                      <th className="px-8 py-5 text-center">{t('method')}</th>
                      <th className="px-8 py-5 text-right">{t('nominal')}</th>
                      <th className="px-8 py-5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-white/5">
                    {currentTransactions.map(tx => {
                      const { datePart, timePart } = formatDateTime(tx.startTime);
                      return (
                      <tr key={tx.id} className="group hover:bg-palette-mustard/5 transition-colors">
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="font-black text-slate-800 dark:text-white text-xs">{datePart}</span>
                            <span className="text-[9px] text-slate-400 font-black uppercase mt-1 tracking-widest opacity-60">{timePart}</span>
                          </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex flex-col">
                              <span className="font-black text-slate-900 dark:text-white text-sm">{tx.memberName || t('unknown')}</span>
                              <span className="text-[9px] text-palette-mustard font-mono tracking-widest uppercase mt-0.5">#{tx.id.substring(0,8)}</span>
                           </div>
                        </td>
                        <td className="px-8 py-5">
                           <div className="flex items-center gap-3">
                              <div className="p-2 bg-white/10 rounded-xl text-slate-500 shadow-inner group-hover:text-palette-mustard transition-colors">
                                  <Clock size={14} />
                              </div>
                              <div>
                                  <span className="block text-xs font-black text-slate-800 dark:text-slate-300 uppercase">{tx.consoleName || t('unknown')}</span>
                                  <span className="block text-[9px] font-black text-slate-500 opacity-60 uppercase">{tx.durationHours} {t('jam_main')}</span>
                              </div>
                           </div>
                        </td>
                        <td className="px-8 py-5 text-center">
                          <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] border shadow-sm ${
                              tx.paymentMethod === 'QRIS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/30' : 
                              tx.paymentMethod === 'BONUS' ? 'bg-purple-500/10 text-purple-500 border-purple-500/30' :
                              'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                          }`}>
                            {tx.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-right">
                          <span className="font-mono text-base font-black text-slate-900 dark:text-white tracking-tighter">
                             Rp {tx.cost.toLocaleString()}
                          </span>
                          {tx.discountApplied > 0 && (
                              <div className="text-[9px] text-red-500/60 font-bold line-through uppercase tracking-tighter">
                                  Rp {(tx.cost + tx.discountApplied).toLocaleString()}
                              </div>
                          )}
                        </td>
                        <td className="px-8 py-5 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => setSelectedTxForPrint(tx)} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-palette-mustard transition-all active:scale-90" title="Cetak Struk">
                                <Printer size={16}/>
                            </button>
                             <button onClick={() => handleShare(tx)} disabled={isSharing === tx.id} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-palette-mustard transition-all active:scale-90 disabled:opacity-50" title="Bagikan Struk">
                                {isSharing === tx.id ? <Loader2 size={16} className="animate-spin"/> : <Share2 size={16}/>}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );})}
                  </tbody>
                </table>
              </div>
              
              {/* MOBILE LIST */}
              <div className="md:hidden flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
                  {currentTransactions.map(tx => {
                      const { datePart, timePart } = formatDateTime(tx.startTime);
                      return (
                          <div key={tx.id} className="bg-white/50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/10 shadow-sm space-y-4">
                              <div className="flex justify-between items-start gap-3">
                                  <div>
                                      <h4 className="font-black text-slate-900 dark:text-white">{tx.memberName || t('unknown')}</h4>
                                      <span className="text-[10px] text-palette-mustard font-mono tracking-widest uppercase">#{tx.id.substring(0, 8)}</span>
                                  </div>
                                  <span className="font-mono text-lg font-black text-slate-900 dark:text-white tracking-tighter text-right">
                                      Rp {tx.cost.toLocaleString()}
                                  </span>
                              </div>

                              <div className="grid grid-cols-2 gap-4 text-xs p-3 bg-slate-100/50 dark:bg-black/20 rounded-xl border border-slate-200 dark:border-white/5">
                                  <div className="space-y-1">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Unit & Durasi</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-200 truncate">{tx.consoleName}</p>
                                      <p className="font-bold text-slate-500">{tx.durationHours} Jam</p>
                                  </div>
                                  <div className="space-y-1">
                                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Waktu & Metode</p>
                                      <p className="font-bold text-slate-700 dark:text-slate-200">{datePart} {timePart}</p>
                                      <p className="font-bold text-slate-500">{tx.paymentMethod}</p>
                                  </div>
                              </div>

                              <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-white/10">
                                  <button onClick={() => setSelectedTxForPrint(tx)} className="flex-1 btn-glass h-10 text-xs">
                                      <Printer size={16}/> Cetak
                                  </button>
                                  <button onClick={() => handleShare(tx)} disabled={isSharing === tx.id} className="flex-1 btn-primary h-10 text-xs disabled:opacity-70">
                                      {isSharing === tx.id ? <Loader2 size={16} className="animate-spin"/> : <Share2 size={16}/>}
                                      Bagikan
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
            </>
          )}

          {totalPages > 1 && (
             <div className="p-6 border-t border-slate-200 dark:border-white/10 flex items-center justify-center bg-white/20 dark:bg-white/5">
                <div className="flex items-center gap-6">
                   <button onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1} className="btn-icon disabled:opacity-20"><ChevronLeft size={20} /></button>
                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Hlm {currentPage} / {totalPages}</span>
                   <button onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages} className="btn-icon disabled:opacity-20"><ChevronRight size={20} /></button>
                </div>
             </div>
          )}
      </div>

      {/* Print Method Modal */}
      {selectedTxForPrint && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md sm:p-4 animate-fade-in">
           <div className="bg-white/95 dark:bg-[#0f1016]/95 sm:rounded-[2.5rem] rounded-t-[2.5rem] w-full max-w-sm shadow-2xl p-8 border border-slate-200 dark:border-white/5 text-center relative overflow-hidden backdrop-blur-3xl">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-transparent via-palette-mustard to-transparent opacity-50"></div>
              <div className="p-4 bg-palette-mustard/10 rounded-[2rem] w-20 h-20 flex items-center justify-center mx-auto mb-6 text-palette-mustard shadow-2xl shadow-palette-mustard/10"><Printer size={36} /></div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{t('select_print_method')}</h3>
              <p className="text-xs text-slate-500 mb-8 font-bold uppercase tracking-widest">{selectedTxForPrint.memberName}</p>
              
              <div className="flex flex-col gap-4">
                 <button onClick={handlePrintWifi} className="flex items-center gap-5 p-5 rounded-[2rem] border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard/50 hover:bg-palette-mustard/10 transition-all group backdrop-blur-md shadow-lg">
                    <div className="p-3.5 bg-slate-100 dark:bg-white/5 rounded-[1.2rem] text-slate-500 group-hover:text-palette-mustard group-hover:bg-white/20 transition-all"><Printer size={24} /></div>
                    <div className="text-left">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('wifi_pdf')}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{t('standard_pc')}</p>
                    </div>
                 </button>
                 <button onClick={handlePrintBluetooth} className="flex items-center gap-5 p-5 rounded-[2rem] border-2 border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all group backdrop-blur-md shadow-lg">
                    <div className="p-3.5 bg-slate-100 dark:bg-white/5 rounded-[1.2rem] text-slate-500 group-hover:text-blue-500 group-hover:bg-white/20 transition-all"><Bluetooth size={24} /></div>
                    <div className="text-left">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">{t('bluetooth')}</h4>
                        <p className="text-[10px] text-slate-500 font-bold">{t('thermal_mobile')}</p>
                    </div>
                 </button>
              </div>
              <button onClick={() => setSelectedTxForPrint(null)} className="mt-8 text-[10px] font-black text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors uppercase tracking-[0.2em]">{t('cancel')}</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;