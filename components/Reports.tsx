import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { FileText, Calendar, Filter } from 'lucide-react';
import { PaymentMethod } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

const Reports: React.FC = () => {
  const { transactions } = useData();
  const { t } = useLanguage();
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | PaymentMethod>('ALL');

  const filteredTransactions = transactions.filter(tx => 
    paymentFilter === 'ALL' ? true : tx.paymentMethod === paymentFilter
  );

  // Group by date
  const groupedByDate = filteredTransactions.reduce((acc, tx) => {
    const date = tx.startTime.split('T')[0];
    if (!acc[date]) acc[date] = { count: 0, revenue: 0, hours: 0 };
    acc[date].count += 1;
    acc[date].revenue += tx.cost;
    acc[date].hours += tx.durationHours;
    return acc;
  }, {} as Record<string, { count: number, revenue: number, hours: number }>);

  const dates = Object.keys(groupedByDate).sort().reverse();

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Header & Filter */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reports')}</h2>
          <p className="text-slate-500 text-sm">{t('overview_subtitle')}</p>
        </div>
        
        {/* Payment Method Filter */}
        <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
           {(['ALL', 'CASH', 'QRIS'] as const).map(type => (
             <button
               key={type}
               onClick={() => setPaymentFilter(type)}
               className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                 paymentFilter === type 
                 ? 'bg-brand-600 text-white shadow-sm' 
                 : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
               }`}
             >
               {type === 'ALL' ? t('all') : type}
             </button>
           ))}
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400">
                  <FileText size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  {t('history_tx')}
                </h3>
             </div>
             <span className="text-xs font-bold text-slate-500 bg-slate-50 dark:bg-slate-950/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                {filteredTransactions.length}
             </span>
          </div>
          <div className="flex-1 max-h-[600px] overflow-y-auto custom-scrollbar">
            {filteredTransactions.length === 0 ? (
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
                   {filteredTransactions.slice().reverse().map(tx => (
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
                        <div className="flex justify-end mt-2 pt-2 border-t border-slate-50 dark:border-slate-800/50">
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
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredTransactions.slice().reverse().map(tx => (
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Daily Recap Widget */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
             <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg text-brand-600 dark:text-brand-400">
                  <Calendar size={20} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white">
                  {t('daily_recap')}
                </h3>
             </div>
             <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
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
    </div>
  );
};

export default Reports;