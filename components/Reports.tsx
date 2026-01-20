
import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, Filter, ChevronLeft, ChevronRight, Download, Search, Printer, Bluetooth, ArrowUpDown, Wallet, Receipt, DollarSign, Clock } from 'lucide-react';
import { PaymentMethod, Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { printReceiptBrowser, generateEscPosCommand } from '../utils/receipt';
import { bluetoothService } from '../services/bluetooth';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';

type SortOption = 'DATE_DESC' | 'DATE_ASC' | 'COST_DESC' | 'COST_ASC';

const Reports: React.FC = () => {
  const { transactions, settings } = useData();
  const { t, language } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt } = useBluetooth();
  const { addToast } = useToast();
  
  // Default Dates (Local Timezone aware)
  // We use this trick to get YYYY-MM-DD in local time
  const toLocalDateString = (date: Date) => {
      const offset = date.getTimezoneOffset();
      const localDate = new Date(date.getTime() - (offset * 60 * 1000));
      return localDate.toISOString().split('T')[0];
  };

  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  // Filters State
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [startDate, setStartDate] = useState<string>(toLocalDateString(firstDay));
  const [endDate, setEndDate] = useState<string>(toLocalDateString(today));
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
  
  // Printing State
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Date Formatting Helper
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short', year: '2-digit' });
  };

  const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      const datePart = date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'short' });
      const timePart = date.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      return { datePart, timePart };
  };

  // Filter Logic - ROOT CAUSE FIX for TIMEZONE
  const filteredTransactions = transactions.filter(tx => {
    // Convert transaction UTC time to LOCAL YYYY-MM-DD for comparison
    const txDateObj = new Date(tx.startTime);
    const txDateLocal = toLocalDateString(txDateObj);

    const isDateInRange = txDateLocal >= startDate && txDateLocal <= endDate;
    const isPaymentMatch = paymentFilter === 'ALL' ? true : tx.paymentMethod === paymentFilter;
    const isSearchMatch = 
        tx.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tx.consoleName.toLowerCase().includes(searchQuery.toLowerCase());

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
    // Export memberName (which is nickname)
    const headers = ["ID", "Tanggal", "Member", "Unit", "Durasi (Jam)", "Metode", "Total (Rp)", "Operator", "Status"];
    const rows = filteredTransactions.map(tx => [
        tx.id,
        new Date(tx.startTime).toLocaleDateString() + ' ' + new Date(tx.startTime).toLocaleTimeString(),
        `"${tx.memberName}"`,
        `"${tx.consoleName}"`,
        tx.durationHours,
        tx.paymentMethod,
        tx.cost,
        tx.operatorName,
        tx.status
    ]);

    const csvContent = "\uFEFF" + "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Ziezan_${startDate}_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printing Handlers
  const handlePrintWifi = () => {
    if (selectedTxForPrint) {
        printReceiptBrowser(selectedTxForPrint, settings);
        setSelectedTxForPrint(null);
    }
  };

  const handlePrintBluetooth = async () => {
    if (!selectedTxForPrint) return;

    if (!isBtConnected) {
        try {
            await connectBt();
        } catch (e) {
            addToast('error', 'Koneksi Gagal', 'Gagal terhubung ke printer Bluetooth.');
            return;
        }
    }

    const rawData = generateEscPosCommand(selectedTxForPrint, settings);
    const success = await bluetoothService.sendRawData(rawData);
    
    if (success) {
        addToast('success', 'Print Berhasil', 'Data dikirim ke printer Bluetooth.');
        setSelectedTxForPrint(null);
    } else {
        addToast('error', 'Print Gagal', 'Gagal mengirim data. Cek koneksi printer.');
    }
  };

  // Pagination Logic
  const totalItems = filteredTransactions.length;
  const totalPages = itemsPerPage === -1 ? 1 : Math.ceil(totalItems / itemsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [paymentFilter, itemsPerPage, startDate, endDate, searchQuery, sortOption]);

  const currentTransactions = itemsPerPage === -1 
    ? filteredTransactions 
    : filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalRevenuePeriod = filteredTransactions.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      {/* 1. Header & Financial Summary */}
      <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wide flex items-center gap-2">
             <FileText className="text-palette-mustard" /> {t('reports')}
          </h2>
          <p className="text-slate-500 text-xs font-medium mt-1">Analisa performa bisnis & riwayat transaksi.</p>
        </div>

        {/* Revenue Card (Compact) */}
        <div className="w-full lg:w-auto bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-4 shadow-lg shadow-emerald-900/20 text-white flex items-center gap-4 border border-white/10 relative overflow-hidden">
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/10 rounded-full blur-2xl"></div>
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <DollarSign size={24} className="text-emerald-200" />
            </div>
            <div>
                <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider opacity-80">{t('gross_revenue')}</p>
                <h3 className="text-2xl font-black tracking-tight">Rp {totalRevenuePeriod.toLocaleString()}</h3>
            </div>
        </div>
      </div>
        
      {/* 2. Control Panel (Filters) - Modernized */}
      <div className="bg-white dark:bg-[#0f1016] rounded-3xl p-4 border border-slate-200 dark:border-white/5 shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-3 items-end">
           
           {/* Date Range - Unified Label */}
           <div className="col-span-2 md:col-span-4 flex gap-2 items-center bg-slate-50 dark:bg-white/5 p-1 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="relative flex-1">
                  <input 
                     type="date" 
                     value={startDate} 
                     onChange={(e) => setStartDate(e.target.value)}
                     className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-700 dark:text-white focus:ring-0 px-3 py-2 [color-scheme:dark]"
                  />
              </div>
              <span className="text-slate-400">-</span>
              <div className="relative flex-1">
                  <input 
                     type="date" 
                     value={endDate} 
                     onChange={(e) => setEndDate(e.target.value)}
                     className="w-full bg-transparent border-none text-xs sm:text-sm font-bold text-slate-700 dark:text-white focus:ring-0 px-3 py-2 [color-scheme:dark]"
                  />
              </div>
           </div>

           {/* Search */}
           <div className="relative col-span-2 md:col-span-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Cari Transaksi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 w-full pl-9 pr-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold focus:outline-none focus:border-palette-mustard transition-colors text-slate-900 dark:text-white placeholder:text-slate-500"
            />
          </div>

          {/* Filters Row */}
          <div className="col-span-1 md:col-span-2">
             <div className="relative">
                <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                    value={paymentFilter}
                    onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | PaymentMethod)}
                    className="h-10 w-full pl-9 pr-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold focus:outline-none focus:border-palette-mustard appearance-none text-slate-700 dark:text-white cursor-pointer"
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
                <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select 
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as SortOption)}
                    className="h-10 w-full pl-9 pr-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-xl text-xs font-bold focus:outline-none focus:border-palette-mustard appearance-none text-slate-700 dark:text-white cursor-pointer"
                >
                    <option value="DATE_DESC">Baru - Lama</option>
                    <option value="DATE_ASC">Lama - Baru</option>
                    <option value="COST_DESC">Termahal</option>
                    <option value="COST_ASC">Termurah</option>
                </select>
             </div>
          </div>

          {/* Export Button - Full on Mobile */}
          <button 
            onClick={handleExportCSV}
            className="col-span-2 md:col-span-1 h-10 w-full rounded-xl flex items-center justify-center bg-palette-mustard text-white hover:bg-palette-mustard/90 transition-all shadow-lg shadow-palette-mustard/20 active:scale-95"
            title={t('export_csv')}
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* 3. Modern Glass Table */}
      <div className="bg-white dark:bg-[#0f1016] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          
          {/* Table Header */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-slate-50/50 dark:bg-white/[0.02]">
             <div className="flex items-center gap-2">
                <Receipt size={16} className="text-slate-400" />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t('history_tx')}</span>
             </div>
             <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400">Show:</span>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-transparent border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white text-xs font-bold rounded-lg px-2 py-1 focus:outline-none"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={-1}>All</option>
                </select>
             </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-x-auto">
            {currentTransactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                  <Search className="w-10 h-10 mb-3 opacity-20" />
                  <p className="text-xs font-bold opacity-50">Tidak ada data ditemukan</p>
               </div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-transparent text-slate-400 text-[10px] font-bold uppercase border-b border-slate-100 dark:border-white/5">
                  <tr>
                    <th className="px-6 py-4">Waktu</th>
                    <th className="px-6 py-4">Detail Member</th>
                    <th className="px-6 py-4">Console</th>
                    <th className="px-6 py-4 text-center">Metode</th>
                    <th className="px-6 py-4 text-right">Total</th>
                    <th className="px-6 py-4 text-center">Struk</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {currentTransactions.map(tx => {
                    const { datePart, timePart } = formatDateTime(tx.startTime);
                    return (
                    <tr key={tx.id} className="group hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                      {/* Time */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-700 dark:text-slate-200 text-xs">{datePart}</span>
                          <span className="text-[10px] text-slate-400 font-mono mt-0.5">{timePart}</span>
                        </div>
                      </td>
                      
                      {/* Member - NICKNAME ONLY */}
                      <td className="px-6 py-4">
                         <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">{tx.memberName}</span>
                            <span className="text-[10px] text-slate-500 font-mono tracking-wide">#{tx.id.substring(0,8).toUpperCase()}</span>
                         </div>
                      </td>

                      {/* Console & Duration */}
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-500">
                                <Clock size={12} />
                            </div>
                            <div>
                                <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">{tx.consoleName}</span>
                                <span className="block text-[10px] text-slate-500">{tx.durationHours} Jam</span>
                            </div>
                         </div>
                      </td>

                      {/* Payment Method */}
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                            tx.paymentMethod === 'QRIS' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : 
                            tx.paymentMethod === 'BONUS' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20' :
                            'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        }`}>
                          {tx.paymentMethod || 'CASH'}
                        </span>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-sm font-bold text-slate-800 dark:text-white">
                           Rp {tx.cost.toLocaleString()}
                        </span>
                        {tx.discountApplied > 0 && (
                            <div className="text-[10px] text-red-400 line-through decoration-red-500/50">
                                Rp {(tx.cost + tx.discountApplied).toLocaleString()}
                            </div>
                        )}
                      </td>

                      {/* Action */}
                      <td className="px-6 py-4 text-center">
                         <button 
                            onClick={() => setSelectedTxForPrint(tx)} 
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-palette-mustard transition-all active:scale-95 shadow-sm hover:shadow-palette-mustard/30"
                            title="Cetak Struk"
                         >
                            <Printer size={16}/>
                         </button>
                      </td>
                    </tr>
                  );})}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer Pagination */}
          {totalPages > 1 && (
             <div className="p-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-center bg-slate-50/50 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                   <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-palette-mustard text-slate-500 hover:text-palette-mustard disabled:opacity-30 disabled:hover:border-transparent transition-all"
                   >
                      <ChevronLeft size={16} />
                   </button>
                   
                   <span className="text-xs font-black text-slate-500">
                      HALAMAN {currentPage} / {totalPages}
                   </span>

                   <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:border-palette-mustard text-slate-500 hover:text-palette-mustard disabled:opacity-30 disabled:hover:border-transparent transition-all"
                   >
                      <ChevronRight size={16} />
                   </button>
                </div>
             </div>
          )}
      </div>

      {/* PRINT OPTION MODAL - RESPONSIVE FIX */}
      {selectedTxForPrint && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm sm:p-4 animate-fade-in">
           <div className="bg-white dark:bg-[#0f1016] sm:rounded-3xl rounded-t-3xl w-full max-w-sm shadow-2xl p-6 border border-white/10 text-center relative overflow-hidden">
              {/* Decorative Blur */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-gradient-to-r from-transparent via-palette-mustard to-transparent opacity-50"></div>
              
              <h3 className="text-lg font-black text-slate-900 dark:text-white mb-2">{t('select_print_method')}</h3>
              <p className="text-xs text-slate-500 mb-6 font-medium">Struk untuk member <span className="text-palette-mustard">{selectedTxForPrint.memberName}</span></p>
              
              <div className="flex flex-col gap-3">
                 <button 
                    onClick={handlePrintWifi}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-palette-mustard/50 hover:bg-palette-mustard/5 transition-all group"
                 >
                    <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 group-hover:text-palette-mustard group-hover:bg-palette-mustard/10 transition-colors">
                        <Printer size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-palette-mustard">Browser / Wi-Fi</h4>
                        <p className="text-[10px] text-slate-500">Gunakan printer PC atau PDF</p>
                    </div>
                 </button>

                 <button 
                    onClick={handlePrintBluetooth}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-slate-200 dark:border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                 >
                    <div className="p-3 bg-slate-100 dark:bg-white/5 rounded-xl text-slate-500 group-hover:text-blue-500 group-hover:bg-blue-500/10 transition-colors">
                        <Bluetooth size={20} />
                    </div>
                    <div className="text-left">
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-500">Bluetooth Thermal</h4>
                        <p className="text-[10px] text-slate-500">Koneksi langsung ke printer mobile</p>
                    </div>
                 </button>
              </div>

              <button onClick={() => setSelectedTxForPrint(null)} className="mt-6 text-xs font-bold text-slate-400 hover:text-white transition-colors">
                 {t('cancel')}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
