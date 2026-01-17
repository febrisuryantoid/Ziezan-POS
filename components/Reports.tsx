import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ListFilter, Download, Search, Printer, Bluetooth } from 'lucide-react';
import { PaymentMethod, Transaction } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { printReceiptBrowser, generateEscPosCommand } from '../utils/receipt';
import { bluetoothService } from '../services/bluetooth';
import { useBluetooth } from '../contexts/BluetoothContext';
import { useToast } from '../contexts/ToastContext';

const Reports: React.FC = () => {
  const { transactions, settings } = useData();
  const { t } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt, sendCommand } = useBluetooth();
  const { addToast } = useToast();
  
  // Default Dates
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

  // Filters State
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');
  const [startDate, setStartDate] = useState<string>(firstDay.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(today.toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Printing State
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // ... (Filter Logic remains same) ...
  const filteredTransactions = transactions.filter(tx => {
    const txDate = tx.startTime.split('T')[0];
    const isDateInRange = txDate >= startDate && txDate <= endDate;
    const isPaymentMatch = paymentFilter === 'ALL' ? true : tx.paymentMethod === paymentFilter;
    const isSearchMatch = 
        tx.memberName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        tx.consoleName.toLowerCase().includes(searchQuery.toLowerCase());

    return isDateInRange && isPaymentMatch && isSearchMatch;
  });

  const handleExportCSV = () => {
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
        // Try to connect if not connected
        try {
            await connectBt();
            // Note: connectBt handles the state update via context, but we might need to check result
            // For now, assuming if context updates, we can try printing next click or immediately
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
  }, [paymentFilter, itemsPerPage, startDate, endDate, searchQuery]);

  const sortedTransactions = [...filteredTransactions].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  const currentTransactions = itemsPerPage === -1 
    ? sortedTransactions 
    : sortedTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const date = tx.startTime.split('T')[0];
    if (!acc[date]) acc[date] = { count: 0, revenue: 0, hours: 0 };
    acc[date].count += 1;
    acc[date].revenue += tx.cost;
    acc[date].hours += tx.durationHours;
    return acc;
  }, {} as Record<string, { count: number, revenue: number, hours: number }>);

  const dates = Object.keys(groupedByDate).sort().reverse();
  const totalRevenuePeriod = filteredTransactions.reduce((acc, curr) => acc + curr.cost, 0);

  // Pagination Render Helper
  const renderPageButton = (page: number) => (
    <button
      key={page}
      onClick={() => setCurrentPage(page)}
      className={`w-8 h-8 rounded-lg font-bold text-xs transition-all ${
        currentPage === page
          ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md scale-105'
          : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
      }`}
    >
      {page}
    </button>
  );

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reports')}</h2>
              <p className="text-slate-500 text-sm">{t('overview_subtitle')}</p>
            </div>
            
            <button 
               onClick={handleExportCSV}
               className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
               <Download size={16} /> {t('export_csv')}
            </button>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col lg:flex-row gap-4 items-center justify-between">
           {/* Date Range & Search */}
           <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                 <div className="relative flex-1 sm:flex-none">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                    <input 
                       type="date" 
                       value={startDate} 
                       onChange={(e) => setStartDate(e.target.value)}
                       className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium w-full"
                    />
                 </div>
                 <span className="text-slate-400">-</span>
                 <div className="relative flex-1 sm:flex-none">
                    <input 
                       type="date" 
                       value={endDate} 
                       onChange={(e) => setEndDate(e.target.value)}
                       className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium w-full"
                    />
                 </div>
              </div>

              <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                 <input 
                    type="text" 
                    placeholder={t('search_reports_placeholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm w-full focus:outline-none focus:ring-2 focus:ring-brand-500"
                 />
              </div>
           </div>

           {/* Payment Filter */}
           <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-full lg:w-auto">
               {(['ALL', 'CASH', 'QRIS'] as const).map(type => (
                 <button
                   key={type}
                   onClick={() => setPaymentFilter(type)}
                   className={`flex-1 lg:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                     paymentFilter === type 
                     ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                     : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                   }`}
                 >
                   {type === 'ALL' ? t('all') : type}
                 </button>
               ))}
           </div>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          
          {/* Widget Header & Rows Per Page Filter */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                  <FileText size={20} className="md:w-6 md:h-6" />
                </div>
                <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                    {t('history_tx')}
                    </h3>
                    <p className="text-xs text-slate-500">{t('total_data_count', { count: totalItems })}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                <ListFilter size={16} className="text-slate-400"/>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={-1}>{t('all')}</option>
                </select>
             </div>
          </div>

          {/* Table Content */}
          <div className="flex-1 min-h-[400px]">
            {currentTransactions.length === 0 ? (
               <div className="flex flex-col items-center justify-center py-12 md:py-20 text-slate-500">
                  <div className="p-4 md:p-6 bg-slate-50 dark:bg-slate-800/50 rounded-full mb-3 md:mb-4">
                     <FileText className="w-8 h-8 md:w-12 md:h-12 text-slate-400/80" />
                  </div>
                  <p className="font-medium text-sm md:text-base">{t('no_tx')}</p>
               </div>
            ) : (
              <>
                {/* Mobile View: Stacked Cards */}
                <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                   {currentTransactions.map(tx => (
                     <div key={tx.id} className="p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <span className="text-xs font-medium text-slate-500">{new Date(tx.startTime).toLocaleDateString()} • {new Date(tx.startTime).toLocaleTimeString().slice(0,5)}</span>
                           <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                             tx.status === 'ACTIVE' 
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                           }`}>
                             {tx.status}
                           </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 dark:text-white">{tx.memberName}</h4>
                          <div className="flex justify-between items-center mt-1">
                             <span className="text-sm text-slate-600 dark:text-slate-400">{tx.consoleName}</span>
                             <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                  tx.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'
                                }`}>
                                  {tx.paymentMethod || 'CASH'}
                                </span>
                                <span className="text-xs font-semibold text-slate-500">{tx.durationHours}h</span>
                             </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                           <button onClick={() => setSelectedTxForPrint(tx)} className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white">
                              <Printer size={16} />
                           </button>
                           <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                              {tx.discountApplied > 0 && <span className="line-through text-xs text-slate-400 mr-2 decoration-red-400 font-sans">{tx.discountApplied + tx.cost}</span>}
                              Rp {tx.cost.toLocaleString()}
                           </span>
                        </div>
                     </div>
                   ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10 backdrop-blur-sm">
                      <tr>
                        <th className="px-6 py-4">{t('join_date')}</th>
                        <th className="px-6 py-4">{t('members')}</th>
                        <th className="px-6 py-4">{t('consoles')}</th>
                        <th className="px-6 py-4">{t('duration')}</th>
                        <th className="px-6 py-4 text-center">Via</th>
                        <th className="px-6 py-4 text-right">{t('cost')}</th>
                        <th className="px-6 py-4 text-center">{t('status')}</th>
                        <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3.5 text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{new Date(tx.startTime).toLocaleDateString()}</span>
                              <span className="text-[10px] text-slate-400">{new Date(tx.startTime).toLocaleTimeString().slice(0,5)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-900 dark:text-white font-medium">{tx.memberName}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300 text-xs">{tx.consoleName}</td>
                          <td className="px-6 py-3.5 text-slate-600 dark:text-slate-300">{tx.durationHours}h</td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                tx.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {tx.paymentMethod || 'CASH'}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono text-slate-700 dark:text-slate-200 font-bold">
                            {tx.discountApplied > 0 && <span className="line-through text-xs text-slate-400 mr-2 decoration-red-400">{tx.discountApplied + tx.cost}</span>}
                            Rp {tx.cost.toLocaleString()}
                          </td>
                          <td className="px-6 py-3.5 text-center">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-md ${
                              tx.status === 'ACTIVE' 
                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' 
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 text-center">
                             <button onClick={() => setSelectedTxForPrint(tx)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white" title="Cetak Struk">
                                <Printer size={16}/>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
             <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
                 {/* ... Pagination Controls Same as Before ... */}
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   >
                      <ChevronLeft size={16} />
                   </button>
                   
                   {/* Mobile / Simple pagination just current / total */}
                   <span className="text-xs font-bold text-slate-500 mx-2">
                      {currentPage} / {totalPages}
                   </span>

                   <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   >
                      <ChevronRight size={16} />
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* Daily Recap Widget */}
        <div className="space-y-6">
           {/* ... Summary Card & Daily Recap List (Unchanged) ... */}
           <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-3xl p-6 text-white shadow-xl shadow-brand-500/20">
              <p className="text-brand-100 font-medium text-sm mb-1">{t('gross_revenue')}</p>
              <h3 className="text-3xl font-bold">Rp {totalRevenuePeriod.toLocaleString()}</h3>
              <p className="text-xs text-brand-200 mt-2 flex items-center gap-1 opacity-80">
                 <Calendar size={12}/> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
                  <Calendar size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  {t('daily_recap')}
                </h3>
             </div>
             <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {dates.map(date => (
                 <div key={date} className="flex justify-between items-center p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {new Date(date).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{groupedByDate[date].count} Tx</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Rp {groupedByDate[date].revenue.toLocaleString()}</p>
                       <p className="text-xs text-slate-500">{groupedByDate[date].hours}h</p>
                    </div>
                 </div>
               ))}
               {dates.length === 0 && <p className="text-center text-slate-400 text-sm py-4">{t('no_tx')}</p>}
             </div>
          </div>
        </div>
      </div>

      {/* PRINT OPTION MODAL */}
      {selectedTxForPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Pilih Metode Cetak</h3>
              <p className="text-sm text-slate-500 mb-6">Struk untuk transaksi {selectedTxForPrint.memberName}</p>
              
              <div className="grid grid-cols-1 gap-3">
                 <button 
                    onClick={handlePrintWifi}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard hover:bg-palette-mustard/5 transition-all text-slate-700 dark:text-slate-200 font-bold"
                 >
                    <Printer size={24} className="text-palette-mustard"/>
                    <span>Browser Print / Wi-Fi</span>
                 </button>

                 <button 
                    onClick={handlePrintBluetooth}
                    className="flex items-center justify-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-white/10 hover:border-palette-mustard hover:bg-palette-mustard/5 transition-all text-slate-700 dark:text-slate-200 font-bold"
                 >
                    <Bluetooth size={24} className="text-blue-500"/>
                    <span>Bluetooth Thermal</span>
                 </button>
              </div>

              <button onClick={() => setSelectedTxForPrint(null)} className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline">
                 Batal
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;