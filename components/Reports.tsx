import React, { useState, useEffect } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, Filter, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ListFilter, Download, Search, Printer, Bluetooth, ArrowUpDown, Wallet } from 'lucide-react';
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
  const [sortOption, setSortOption] = useState<SortOption>('DATE_DESC');
  
  // Printing State
  const [selectedTxForPrint, setSelectedTxForPrint] = useState<Transaction | null>(null);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Date Formatting Helper
  const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatDateTime = (dateString: string) => {
      const date = new Date(dateString);
      const datePart = date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US');
      const timePart = date.toLocaleTimeString(language === 'id' ? 'id-ID' : 'en-US', { hour: '2-digit', minute: '2-digit' });
      return { datePart, timePart };
  };

  // Filter Logic
  const filteredTransactions = transactions.filter(tx => {
    const txDate = tx.startTime.split('T')[0];
    const isDateInRange = txDate >= startDate && txDate <= endDate;
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
      {/* 1. Header & Toolbar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
        <div className="mb-2 xl:mb-0">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('reports')}</h2>
          <p className="text-slate-500 text-xs">{t('overview_subtitle')}</p>
        </div>
        
        {/* RESPONSIVE FILTER GRID - OPTIMIZED FOR 320px MOBILE */}
        <div className="w-full xl:w-auto grid grid-cols-2 md:grid-cols-12 lg:flex lg:flex-row gap-2 sm:gap-3 items-center min-w-0">
           
           {/* Date Picker Start - 1/2 on Mobile */}
           <div className="relative col-span-1 md:col-span-4 lg:w-auto lg:min-w-[130px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                 type="date" 
                 value={startDate} 
                 onChange={(e) => setStartDate(e.target.value)}
                 className="h-10 sm:h-11 pl-9 pr-1 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-[10px] sm:text-xs w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white"
              />
           </div>
           
           {/* Date Picker End - 1/2 on Mobile */}
           <div className="relative col-span-1 md:col-span-4 lg:w-auto lg:min-w-[130px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input 
                 type="date" 
                 value={endDate} 
                 onChange={(e) => setEndDate(e.target.value)}
                 className="h-10 sm:h-11 pl-9 pr-1 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-[10px] sm:text-xs w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white"
              />
           </div>

           {/* Search - Full on Mobile */}
           <div className="relative col-span-2 md:col-span-4 lg:flex-grow lg:w-auto lg:min-w-[200px] xl:w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder={t('search_reports_placeholder')} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-10 sm:h-11 pl-10 pr-3 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-base md:text-xs w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard transition-all shadow-sm text-slate-900 dark:text-white placeholder:text-slate-400"
            />
          </div>

          {/* Payment Filter - 1/2 on Mobile */}
          <div className="relative col-span-1 md:col-span-6 lg:w-32">
             <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as 'ALL' | PaymentMethod)}
                className="h-10 sm:h-11 pl-10 pr-2 sm:pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer truncate"
             >
                <option value="ALL">{t('all')}</option>
                <option value="CASH">{t('pay_cash')}</option>
                <option value="QRIS">QRIS</option>
                <option value="BONUS">BONUS</option>
             </select>
          </div>

          {/* Sort - 1/2 on Mobile */}
          <div className="relative col-span-1 md:col-span-6 lg:w-40">
             <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as SortOption)}
                className="h-10 sm:h-11 pl-10 pr-2 sm:pr-8 bg-white dark:bg-palette-navyLight border border-slate-200 dark:border-white/10 rounded-xl text-xs font-medium w-full focus:outline-none focus:ring-2 focus:ring-palette-mustard shadow-sm text-slate-900 dark:text-white appearance-none cursor-pointer truncate"
             >
                <option value="DATE_DESC">{t('sort_date_new')}</option>
                <option value="DATE_ASC">{t('sort_date_old')}</option>
                <option value="COST_DESC">{t('sort_cost_hi')}</option>
                <option value="COST_ASC">{t('sort_cost_lo')}</option>
             </select>
          </div>

          {/* Export Button - Full on Mobile */}
          <button 
            onClick={handleExportCSV}
            className="col-span-2 md:col-span-12 lg:w-auto h-10 sm:h-11 px-6 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/20 whitespace-nowrap active:scale-95"
          >
            <Download size={16} /> {t('export_csv')}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Transaction History Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          
          {/* Widget Header & Rows Per Page Filter */}
          <div className="p-3 sm:p-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-2 sm:gap-4">
             <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                  <FileText size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {t('history_tx')}
                    </h3>
                </div>
                <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                    Total: {totalItems}
                </span>
             </div>
             
             <div className="flex items-center gap-2">
                <ListFilter size={14} className="text-slate-400"/>
                <select 
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                    className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                {/* Mobile / Tablet Portrait View: Stacked Cards (Hidden on Desktop/Landscape) */}
                <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                   {currentTransactions.map(tx => {
                     const { datePart, timePart } = formatDateTime(tx.startTime);
                     return (
                     <div key={tx.id} className="p-3 sm:p-4 flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                           <span className="text-[9px] sm:text-[10px] font-medium text-slate-500">{datePart} • {timePart}</span>
                           <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                             tx.status === 'ACTIVE' 
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' 
                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                           }`}>
                             {tx.status}
                           </span>
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">{tx.memberName}</h4>
                          <div className="flex justify-between items-center mt-1">
                             <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[100px] sm:max-w-[150px]">{tx.consoleName}</span>
                             <div className="flex items-center gap-2 shrink-0">
                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                  tx.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-600' : 
                                  tx.paymentMethod === 'BONUS' ? 'bg-purple-100 text-purple-600' :
                                  'bg-green-50 text-green-600'
                                }`}>
                                  {tx.paymentMethod || 'CASH'}
                                </span>
                                <span className="text-[10px] font-semibold text-slate-500">{tx.durationHours} {t('hour_short')}</span>
                             </div>
                          </div>
                        </div>
                        <div className="flex justify-between items-center mt-1 pt-2 border-t border-slate-50 dark:border-slate-800/50">
                           <button onClick={() => setSelectedTxForPrint(tx)} className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white active:scale-95">
                              <Printer size={14} />
                           </button>
                           <span className="text-sm font-mono font-bold text-slate-900 dark:text-white">
                              {tx.discountApplied > 0 && <span className="line-through text-[10px] text-slate-400 mr-2 decoration-red-400 font-sans">{tx.discountApplied + tx.cost}</span>}
                              Rp {tx.cost.toLocaleString()}
                           </span>
                        </div>
                     </div>
                   );})}
                </div>

                {/* Desktop View: Table (Hidden on Mobile/Tablet Portrait) */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-left text-sm whitespace-nowrap">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase sticky top-0 border-b border-slate-200 dark:border-slate-800 z-10 backdrop-blur-sm tracking-wider">
                      <tr>
                        <th className="px-6 py-3">{t('join_date')}</th>
                        <th className="px-6 py-3">{t('members')}</th>
                        <th className="px-6 py-3">{t('consoles')}</th>
                        <th className="px-6 py-3">{t('duration')}</th>
                        <th className="px-6 py-3 text-center">Via</th>
                        <th className="px-6 py-3 text-right">{t('cost')}</th>
                        <th className="px-6 py-3 text-center">{t('status')}</th>
                        <th className="px-6 py-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {currentTransactions.map(tx => {
                        const { datePart, timePart } = formatDateTime(tx.startTime);
                        return (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          <td className="px-6 py-3 text-slate-500 dark:text-slate-400">
                            <div className="flex flex-col">
                              <span className="font-medium text-slate-700 dark:text-slate-300 text-xs">{datePart}</span>
                              <span className="text-[10px] text-slate-400">{timePart}</span>
                            </div>
                          </td>
                          <td className="px-6 py-3 text-slate-900 dark:text-white font-medium text-xs max-w-[150px] truncate" title={tx.memberName}>{tx.memberName}</td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-300 text-xs max-w-[120px] truncate" title={tx.consoleName}>{tx.consoleName}</td>
                          <td className="px-6 py-3 text-slate-600 dark:text-slate-300 text-xs">{tx.durationHours} {t('hour_short')}</td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-lg ${
                                tx.paymentMethod === 'QRIS' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 
                                tx.paymentMethod === 'BONUS' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400' :
                                'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400'
                            }`}>
                              {tx.paymentMethod || 'CASH'}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-right font-mono text-slate-700 dark:text-slate-200 font-bold text-xs">
                            {tx.discountApplied > 0 && <span className="line-through text-[10px] text-slate-400 mr-2 decoration-red-400">{tx.discountApplied + tx.cost}</span>}
                            Rp {tx.cost.toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-center">
                            <span className={`text-[9px] uppercase font-bold px-2 py-0.5 rounded-md ${
                              tx.status === 'ACTIVE' 
                                ? 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400' 
                                : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-3 text-center">
                             <button onClick={() => setSelectedTxForPrint(tx)} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500 hover:text-slate-900 dark:hover:text-white" title="Cetak Struk">
                                <Printer size={14}/>
                             </button>
                          </td>
                        </tr>
                      );})}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
             <div className="p-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center bg-slate-50/50 dark:bg-slate-900/50">
                <div className="flex items-center gap-2">
                   <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   >
                      <ChevronLeft size={16} />
                   </button>
                   
                   <span className="text-xs font-bold text-slate-500 mx-2">
                      {currentPage} / {totalPages}
                   </span>

                   <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                   >
                      <ChevronRight size={16} />
                   </button>
                </div>
             </div>
          )}
        </div>

        {/* Daily Recap Widget */}
        <div className="space-y-4 sm:space-y-6">
           {/* Summary Card */}
           <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-xl shadow-brand-500/20">
              <p className="text-brand-100 font-medium text-xs mb-1">{t('gross_revenue')}</p>
              <h3 className="text-xl sm:text-2xl font-bold">Rp {totalRevenuePeriod.toLocaleString()}</h3>
              <p className="text-[10px] text-brand-200 mt-2 flex items-center gap-1 opacity-80">
                 <Calendar size={12}/> {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
              </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-3 sm:p-4">
             <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="p-1.5 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
                  <Calendar size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                  {t('daily_recap')}
                </h3>
             </div>
             <div className="space-y-2 sm:space-y-3 max-h-[400px] sm:max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
               {dates.map(date => (
                 <div key={date} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-brand-200 dark:hover:border-brand-800 transition-colors group">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
                        {new Date(date).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">{groupedByDate[date].count} Tx</span>
                      </div>
                    </div>
                    <div className="text-right">
                       <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">Rp {groupedByDate[date].revenue.toLocaleString()}</p>
                       <p className="text-[10px] text-slate-500">{groupedByDate[date].hours} {t('hour_short')}</p>
                    </div>
                 </div>
               ))}
               {dates.length === 0 && <p className="text-center text-slate-400 text-xs py-4">{t('no_tx')}</p>}
             </div>
          </div>
        </div>
      </div>

      {/* PRINT OPTION MODAL */}
      {selectedTxForPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-palette-navy/80 backdrop-blur-sm p-4 animate-fade-in">
           <div className="bg-white dark:bg-palette-navyLight rounded-2xl w-full max-w-sm shadow-2xl p-6 border border-slate-200 dark:border-white/10 text-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">{t('select_print_method')}</h3>
              <p className="text-xs text-slate-500 mb-6">{t('receipt_for_tx', { name: selectedTxForPrint.memberName })}</p>
              
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

              <button onClick={() => setSelectedTxForPrint(null)} className="mt-6 text-xs text-slate-400 hover:text-slate-600 underline">
                 {t('cancel')}
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Reports;