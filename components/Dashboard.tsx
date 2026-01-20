
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Activity, CreditCard, Clock, Users, MonitorPlay, Gamepad2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const Dashboard: React.FC = () => {
  const { consoles, transactions, members } = useData();
  const { theme } = useTheme();
  const { t } = useLanguage();

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaysTx = transactions.filter(t => t.startTime && t.startTime.startsWith(today));
    
    return {
      activeConsoles: consoles.filter(c => c.status === ConsoleStatus.IN_USE).length,
      revenueToday: todaysTx.reduce((sum, t) => sum + (t.cost || 0), 0),
      hoursToday: todaysTx.reduce((sum, t) => sum + (t.durationHours || 0), 0),
      totalMembers: members.length
    };
  }, [consoles, transactions, members]);

  const recentTransactions = transactions.slice(0, 5);

  const consoleUsageData = consoles.map(c => {
    // FIX: Safe Name Parsing
    const safeName = c.name || 'Unit';
    const shortName = safeName.includes(' - ') ? safeName.split(' - ')[1] : safeName;
    return {
      name: shortName,
      hours: c.totalHoursUsed || 0
    };
  });

  const StatCard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white dark:bg-[#0f1016] p-4 sm:p-5 rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 group-hover:scale-110 transition-transform duration-500 ${bgClass.replace('/10', '/30').replace('/20', '/40')}`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="min-w-0 pr-2">
          <p className="text-slate-500 dark:text-slate-400 text-[10px] sm:text-xs font-black uppercase tracking-wide truncate opacity-70">{title}</p>
          <h3 className={`text-xl sm:text-2xl font-black mt-1 sm:mt-2 ${colorClass} truncate`}>{value}</h3>
        </div>
        <div className={`p-2.5 sm:p-3 rounded-2xl shrink-0 ${bgClass} ${colorClass.replace('text', 'text-opacity-100')}`}>
          <Icon size={18} className="sm:w-5 sm:h-5" />
        </div>
      </div>
      <p className="text-[9px] sm:text-[10px] text-slate-400 mt-2 font-bold truncate">{sub}</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg sm:text-xl font-bold text-palette-navy dark:text-white">{t('dashboard')}</h2>
        <p className="text-palette-brown/70 dark:text-palette-cream/60 text-xs">{t('overview_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard 
          title={t('active_consoles')}
          value={`${stats.activeConsoles} / ${consoles.length}`}
          sub={t('realtime_status')}
          icon={Gamepad2}
          colorClass="text-palette-green"
          bgClass="bg-palette-green/10"
        />
        <StatCard 
          title={t('revenue')}
          value={`Rp ${stats.revenueToday.toLocaleString('id-ID')}`}
          sub={t('gross_revenue')}
          icon={CreditCard}
          colorClass="text-palette-mustard"
          bgClass="bg-palette-mustard/10"
        />
        <StatCard 
          title={t('duration')} 
          value={`${stats.hoursToday} ${t('hour_short')}`}
          sub={t('total_duration_sub')}
          icon={Clock}
          colorClass="text-palette-purple"
          bgClass="bg-palette-purple/10"
        />
        <StatCard 
          title={t('total_members')} 
          value={stats.totalMembers}
          sub={t('registered_sub')}
          icon={Users}
          colorClass="text-palette-red"
          bgClass="bg-palette-red/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-[#0f1016] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
          <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-sm text-palette-navy dark:text-white flex items-center gap-2">
              <Activity size={16} className="text-palette-mustard" /> {t('recent_tx')}
            </h3>
          </div>
          <div className="flex-1 p-0">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-slate-500">
                <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-full mb-3 opacity-50">
                   <Activity className="w-6 h-6" />
                </div>
                <p className="font-medium text-xs">{t('no_tx')}</p>
              </div>
            ) : (
              <>
                <div className="md:hidden">
                   {recentTransactions.map(tx => (
                     <div key={tx.id} className="p-4 border-b border-slate-100 dark:border-white/5 last:border-0 bg-white dark:bg-transparent">
                       <div className="flex justify-between items-start mb-2 gap-2">
                         <div className="min-w-0 flex-1">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">{t('members')}</span>
                            <span className="font-bold text-sm text-slate-900 dark:text-white truncate block">{tx.memberName || 'Unknown'}</span>
                         </div>
                         <span className={`inline-flex items-center px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wide shrink-0 border ${
                            tx.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                              : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-transparent'
                          }`}>
                            {tx.status}
                          </span>
                       </div>
                       <div className="flex justify-between items-end mt-2 pt-2 border-t border-dashed border-slate-100 dark:border-white/5">
                         <div className="min-w-0 flex-1">
                           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{t('consoles')}</div>
                           <div className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{tx.consoleName || 'Unknown'}</div>
                         </div>
                         <div className="text-right shrink-0 ml-2">
                           <div className="text-xs font-mono font-bold text-palette-mustard">{tx.durationHours} {t('hour_short')}</div>
                         </div>
                       </div>
                     </div>
                   ))}
                </div>

                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[10px] text-slate-400 font-bold uppercase bg-slate-50/50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 tracking-wider">
                      <tr>
                        <th className="px-6 py-4">{t('members')}</th>
                        <th className="px-6 py-4">{t('consoles')}</th>
                        <th className="px-6 py-4">{t('status')}</th>
                        <th className="px-6 py-4 text-right">{t('duration')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {recentTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900 dark:text-white text-xs max-w-[150px] truncate" title={tx.memberName}>{tx.memberName || 'Unknown'}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-xs max-w-[150px] truncate" title={tx.consoleName}>{tx.consoleName || 'Unknown'}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                              tx.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                                : 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 border-transparent'
                            }`}>
                              {tx.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"/>}
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-right text-xs font-mono font-bold">{tx.durationHours} {t('hour_short')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#0f1016] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm p-5 flex flex-col">
          <h3 className="font-bold text-sm text-palette-navy dark:text-white mb-4 flex items-center gap-2">
            <MonitorPlay size={16} className="text-palette-mustard" /> {t('console_util')}
          </h3>
          
          <div className="w-full h-[200px] sm:h-[300px]">
             {consoleUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consoleUsageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} strokeOpacity={0.3} />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <Tooltip 
                      cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.2 }}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? '#181825' : '#ffffff', 
                        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0',
                        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                        borderRadius: '16px',
                        boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                        fontSize: '12px',
                        padding: '12px'
                      }}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                       {consoleUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7c3aed' : '#facc15'} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <MonitorPlay size={32} className="mb-2 opacity-30"/>
                    <span className="text-xs opacity-50">{t('no_data_consoles')}</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
