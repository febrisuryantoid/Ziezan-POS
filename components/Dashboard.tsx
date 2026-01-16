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
    const todaysTx = transactions.filter(t => t.startTime.startsWith(today));
    
    return {
      activeConsoles: consoles.filter(c => c.status === ConsoleStatus.IN_USE).length,
      revenueToday: todaysTx.reduce((sum, t) => sum + t.cost, 0),
      hoursToday: todaysTx.reduce((sum, t) => sum + t.durationHours, 0),
      totalMembers: members.length
    };
  }, [consoles, transactions, members]);

  const recentTransactions = transactions.slice(0, 5);

  const consoleUsageData = consoles.map(c => ({
    name: c.name.split(' - ')[1] || c.name,
    hours: c.totalHoursUsed
  }));

  const StatCard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="bg-white dark:bg-palette-navyLight p-6 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
      {/* Decorative background blob */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${bgClass.replace('/10', '/30').replace('/20', '/40')}`}></div>
      
      <div className="flex justify-between items-start relative z-10">
        <div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{title}</p>
          <h3 className={`text-3xl font-bold mt-2 ${colorClass}`}>{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${bgClass} ${colorClass.replace('text', 'text-opacity-100')}`}>
          <Icon size={24} />
        </div>
      </div>
      <p className="text-xs text-slate-400 mt-2 font-medium">{sub}</p>
    </div>
  );

  return (
    // UPDATED: Removed h-full to allow content to grow naturally without colliding with parent height constraints
    <div className="flex flex-col gap-8">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold text-palette-navy dark:text-white">{t('dashboard')}</h2>
        <p className="text-palette-brown/70 dark:text-palette-cream/60">{t('overview_subtitle')}</p>
      </div>

      {/* 2. Stats Grid Widget - USING PALETTE COLORS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
          value={`${stats.hoursToday}h`}
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

      {/* 3. Main Content Widgets (Table & Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Rentals Table / List */}
        <div className="lg:col-span-2 bg-white dark:bg-palette-navyLight rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
            <h3 className="font-bold text-palette-navy dark:text-white flex items-center gap-2">
              <Activity size={18} className="text-palette-mustard" /> {t('recent_tx')}
            </h3>
          </div>
          <div className="flex-1 p-0">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-full mb-3">
                   <Activity className="w-8 h-8 text-slate-400/80" />
                </div>
                <p className="font-medium text-sm">{t('no_tx')}</p>
              </div>
            ) : (
              <>
                {/* Mobile View: Vertical Stack */}
                <div className="md:hidden">
                   {recentTransactions.map(tx => (
                     <div key={tx.id} className="p-4 border-b border-slate-100 dark:border-white/5 last:border-0">
                       <div className="flex justify-between items-start mb-2">
                         <div>
                            <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">{t('members')}</span>
                            <span className="font-bold text-slate-900 dark:text-white">{tx.memberName}</span>
                         </div>
                         <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                            tx.status === 'ACTIVE' 
                              ? 'bg-palette-green/10 text-palette-green' 
                              : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                          }`}>
                            {tx.status}
                          </span>
                       </div>
                       <div className="flex justify-between items-end mt-3">
                         <div>
                           <div className="text-xs text-slate-500 mb-1">{t('consoles')}</div>
                           <div className="text-sm text-slate-700 dark:text-slate-300">{tx.consoleName}</div>
                         </div>
                         <div className="text-right">
                           <div className="text-xs text-slate-500 mb-1">{t('duration')}</div>
                           <div className="text-sm font-semibold text-palette-mustard">{tx.durationHours}h</div>
                         </div>
                       </div>
                     </div>
                   ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                      <tr>
                        <th className="px-6 py-4 font-semibold">{t('members')}</th>
                        <th className="px-6 py-4 font-semibold">{t('consoles')}</th>
                        <th className="px-6 py-4 font-semibold">{t('status')}</th>
                        <th className="px-6 py-4 font-semibold text-right">{t('duration')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                      {recentTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                          <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{tx.memberName}</td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{tx.consoleName}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                              tx.status === 'ACTIVE' 
                                ? 'bg-palette-green/10 text-palette-green' 
                                : 'bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400'
                            }`}>
                              {tx.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-palette-green mr-1.5 animate-pulse"/>}
                              {tx.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600 dark:text-slate-300 text-right">{tx.durationHours}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts Widget - Using Palette Colors */}
        <div className="bg-white dark:bg-palette-navyLight rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm p-6 flex flex-col">
          <h3 className="font-bold text-palette-navy dark:text-white mb-6 flex items-center gap-2">
            <MonitorPlay size={18} className="text-palette-mustard" /> {t('console_util')}
          </h3>
          <div className="flex-1 min-h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consoleUsageData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false}
                  dy={10}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9', opacity: 0.4 }}
                  contentStyle={{ 
                    backgroundColor: theme === 'dark' ? '#181825' : '#ffffff', 
                    borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
                    color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                   {consoleUsageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#D98D28' : '#F4CD46'} /> // Mustard & Yellow from Palette
                    ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;