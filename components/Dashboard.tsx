
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Activity, CreditCard, Clock, Users, MonitorPlay, Gamepad2, ChevronRight } from 'lucide-react';
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
    const safeName = c.name || t('unit');
    // More robust short name logic
    const shortName = safeName.length > 8 ? (safeName.includes('-') ? safeName.split('-').pop()?.trim() : safeName.substring(0, 6) + '..') : safeName;
    return {
      name: shortName,
      hours: c.totalHoursUsed || 0
    };
  });

  const StatCard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => (
    <div className="glass-card p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
      <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700 ${bgClass.replace('/10', '/40').replace('/20', '/60')}`}></div>
      <div className="flex justify-between items-start relative z-10">
        <div className="min-w-0 pr-2">
          <p className="text-label mb-2 opacity-80">{title}</p>
          <h3 className={`text-3xl font-extrabold ${colorClass} truncate tracking-tight`}>{value}</h3>
        </div>
        <div className={`p-4 rounded-2xl shrink-0 shadow-lg ${bgClass} ${colorClass.replace('text', 'text-opacity-100')}`}>
          <Icon size={24} />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${bgClass.replace('/10', '/100')} animate-pulse`}></div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">{sub}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-palette-navy dark:text-white tracking-tight uppercase">{t('dashboard')}</h2>
        <p className="text-sm text-slate-500 font-medium">{t('overview_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 min-[450px]:grid-cols-2 xl:grid-cols-4 gap-5">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* RECENT TRANSACTIONS: Responsive (Card List on Mobile, Table on Desktop) */}
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/5">
            <h3 className="font-bold text-base text-palette-navy dark:text-white flex items-center gap-3 uppercase tracking-wider">
              <div className="p-2 bg-palette-mustard/10 rounded-xl text-palette-mustard shadow-inner"><Activity size={18} /></div>
              {t('recent_tx')}
            </h3>
          </div>
          <div className="flex-1 p-0 sm:p-2">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 opacity-50">
                <Activity className="w-12 h-12 mb-4" />
                <p className="text-label">{t('no_tx')}</p>
              </div>
            ) : (
              <>
                {/* Mobile View: Card List */}
                <div className="block sm:hidden space-y-3 p-4">
                    {recentTransactions.map(tx => (
                        <div key={tx.id} className="bg-white/60 dark:bg-white/5 rounded-2xl p-4 border border-slate-200 dark:border-white/5 shadow-sm">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{tx.memberName || t('unknown')}</h4>
                                    <span className="text-[10px] text-slate-500 font-medium">{tx.consoleName}</span>
                                </div>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border ${
                                    tx.status === 'ACTIVE' 
                                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
                                }`}>
                                    {tx.status}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-xs border-t border-slate-100 dark:border-white/5 pt-3 mt-1">
                                <span className="font-mono text-slate-500">{tx.durationHours} {t('hour_short')}</span>
                                <span className="font-bold text-slate-900 dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-1 rounded-lg">Rp {tx.cost.toLocaleString()}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Desktop View: Table */}
                <div className="hidden sm:block overflow-x-auto">
                    <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="text-[10px] text-slate-500 font-bold uppercase bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/5 tracking-widest">
                        <tr>
                        <th className="px-8 py-5">{t('members')}</th>
                        <th className="px-8 py-5">{t('consoles')}</th>
                        <th className="px-8 py-5">{t('status')}</th>
                        <th className="px-8 py-5 text-right">{t('duration')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {recentTransactions.map(tx => (
                        <tr key={tx.id} className="hover:bg-palette-mustard/5 transition-colors group">
                            <td className="px-8 py-5 font-bold text-slate-900 dark:text-white text-sm max-w-[200px] truncate">{tx.memberName || t('unknown')}</td>
                            <td className="px-8 py-5 text-slate-500 dark:text-slate-400 text-xs font-medium">{tx.consoleName || t('unknown')}</td>
                            <td className="px-8 py-5">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-wider border shadow-sm ${
                                tx.status === 'ACTIVE' 
                                ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                                : 'bg-slate-100 dark:bg-white/5 text-slate-500 border-slate-200 dark:border-white/10'
                            }`}>
                                {tx.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"/>}
                                {tx.status}
                            </span>
                            </td>
                            <td className="px-8 py-5 text-slate-700 dark:text-slate-300 text-right text-xs font-mono font-bold">{tx.durationHours} {t('hour_short')}</td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
              </>
            )}
          </div>
        </div>

        {/* CHART SECTION */}
        <div className="glass-panel p-6 sm:p-8 flex flex-col">
          <h3 className="font-bold text-base text-palette-navy dark:text-white mb-6 flex items-center gap-3 uppercase tracking-wider">
            <div className="p-2 bg-palette-mustard/10 rounded-xl text-palette-mustard shadow-inner"><MonitorPlay size={18} /></div>
            {t('console_util')}
          </h3>
          
          <div className="w-full h-[300px]">
             {consoleUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consoleUsageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                      dy={10}
                      fontFamily='Plus Jakarta Sans'
                      fontWeight='600'
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#94a3b8' : '#64748b'} 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      fontFamily='Plus Jakarta Sans'
                      fontWeight='600'
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(124, 58, 237, 0.1)', radius: 10 }}
                      contentStyle={{ 
                        backgroundColor: theme === 'dark' ? 'rgba(15, 7, 32, 0.95)' : 'rgba(255, 255, 255, 0.95)', 
                        borderColor: 'rgba(255,255,255,0.1)',
                        color: theme === 'dark' ? '#f8fafc' : '#0f172a',
                        borderRadius: '16px',
                        boxShadow: '0 20px 40px -10px rgba(0,0,0,0.3)',
                        fontSize: '11px',
                        padding: '12px 16px',
                        fontWeight: '700',
                        textTransform: 'uppercase'
                      }}
                    />
                    <Bar dataKey="hours" radius={[8, 8, 8, 8]} barSize={28}>
                       {consoleUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#7c3aed' : '#ec4899'} fillOpacity={0.9} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 opacity-40">
                    <MonitorPlay size={48} className="mb-4"/>
                    <span className="text-label">{t('no_data_consoles')}</span>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
