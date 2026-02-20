
import React, { useMemo } from 'react';
import { useData } from '../contexts/DataContext';
import { ConsoleStatus } from '../types';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Activity, CreditCard, Clock, Users, MonitorPlay, Gamepad2, Trophy, TrendingUp, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

interface DashboardProps {
  setTab: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ setTab }) => {
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
      totalMembers: members.length,
      recentTx: transactions.slice(0, 7)
    };
  }, [consoles, transactions, members]);

  const consoleUsageData = consoles.map(c => {
    const safeName = c.name || t('unit');
    const shortName = safeName.includes(' - ') ? safeName.split(' - ')[1] : safeName;
    return {
      name: shortName,
      hours: c.totalHoursUsed || 0
    };
  });

  return (
    <div className="flex flex-col gap-4 sm:gap-6 animate-fade-in pb-20 sm:pb-10">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4 px-2">
        <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tighter uppercase leading-none mb-1">{t('dashboard')}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground font-medium">{t('overview_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black bg-white/50 dark:bg-white/5 px-3 py-1.5 rounded-full border border-white/10 backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            SYSTEM ONLINE
        </div>
      </div>

      {/* BENTO GRID LAYOUT */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
        
        {/* BIG CARD: ACTIVE STATUS */}
        <div className="col-span-2 glass-panel p-5 sm:p-6 relative overflow-hidden group bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Gamepad2 size={100} className="sm:w-[120px] sm:h-[120px]" />
            </div>
            <div className="relative z-10 h-full flex flex-col justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="px-2 py-1 rounded-md bg-indigo-500/20 text-indigo-500 text-[10px] font-black uppercase tracking-widest">{t('realtime_status')}</span>
                    </div>
                    <h3 className="text-4xl sm:text-5xl font-black text-foreground tracking-tighter">
                        {stats.activeConsoles} <span className="text-xl sm:text-2xl text-muted-foreground/50 font-bold">/ {consoles.length}</span>
                    </h3>
                    <p className="text-xs sm:text-sm font-bold text-muted-foreground mt-1">{t('active_consoles')}</p>
                </div>
                <div className="mt-2 sm:mt-6">
                    <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: `${(stats.activeConsoles / consoles.length) * 100}%` }}></div>
                    </div>
                </div>
            </div>
        </div>

        {/* REVENUE CARD */}
        <div className="col-span-1 glass-panel p-4 sm:p-6 flex flex-col justify-between gap-2 group hover:border-emerald-500/30 transition-colors">
            <div className="flex justify-between items-start">
                <div className="p-2.5 sm:p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">
                    <CreditCard size={20} className="sm:w-6 sm:h-6" />
                </div>
                <TrendingUp size={16} className="text-emerald-500 opacity-50 hidden sm:block" />
            </div>
            <div>
                <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">{t('gross_revenue')}</p>
                <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">Rp {stats.revenueToday.toLocaleString('id-ID')}</h3>
            </div>
        </div>

        {/* DURATION CARD */}
        <div className="col-span-1 glass-panel p-4 sm:p-6 flex flex-col justify-between gap-2 group hover:border-orange-500/30 transition-colors">
            <div className="flex justify-between items-start">
                <div className="p-2.5 sm:p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                    <Clock size={20} className="sm:w-6 sm:h-6" />
                </div>
            </div>
            <div>
                <p className="text-[9px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1 truncate">{t('total_duration_sub')}</p>
                <h3 className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate">{stats.hoursToday} {t('hour_short')}</h3>
            </div>
        </div>

        {/* CHART SECTION (WIDE) */}
        <div className="col-span-2 lg:col-span-3 glass-panel p-4 sm:p-8 min-h-[250px] sm:min-h-[300px]">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 sm:gap-3">
                    <MonitorPlay size={16} className="text-primary sm:w-[18px] sm:h-[18px]"/> {t('console_util')}
                </h3>
            </div>
            <div className="h-[200px] sm:h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consoleUsageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === 'dark' ? '#52525b' : '#a1a1aa'}
                      fontSize={10} tickLine={false} axisLine={false} dy={10} fontFamily='Plus Jakarta Sans' fontWeight='700'
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? '#52525b' : '#a1a1aa'}
                      fontSize={10} tickLine={false} axisLine={false} fontFamily='Plus Jakarta Sans' fontWeight='700'
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(139, 92, 246, 0.1)', radius: 8 }}
                      contentStyle={{ 
                        backgroundColor: 'var(--popover)', 
                        borderColor: 'var(--border)',
                        color: 'var(--foreground)',
                        borderRadius: '16px',
                        boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        padding: '12px 16px',
                      }}
                    />
                    <Bar dataKey="hours" radius={[6, 6, 0, 0]} barSize={40}>
                       {consoleUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'var(--primary)' : '#ec4899'} fillOpacity={0.9} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* RANK CTA CARD */}
        <button onClick={() => setTab('rank')} className="col-span-2 md:col-span-1 glass-panel p-4 sm:p-6 flex flex-row md:flex-col justify-start md:justify-center items-center text-left md:text-center gap-4 group hover:bg-yellow-500/10 hover:border-yellow-500/30 transition-all cursor-pointer">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-500 group-hover:scale-110 transition-transform shrink-0">
                <Trophy size={24} className="sm:w-8 sm:h-8" />
            </div>
            <div>
                <h3 className="font-black text-base sm:text-lg text-foreground uppercase tracking-tight">{t('leaderboard_title')}</h3>
                <p className="text-[10px] sm:text-xs text-muted-foreground font-bold mt-0.5 sm:mt-1">{t('view_board')}</p>
            </div>
            <ArrowRight size={16} className="ml-auto md:hidden text-muted-foreground" />
        </button>

        {/* RECENT TRANSACTIONS */}
        <div className="col-span-2 md:col-span-3 lg:col-span-4 glass-panel overflow-hidden flex flex-col">
            <div className="p-4 sm:p-6 border-b border-border flex justify-between items-center">
                <h3 className="font-black text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2 sm:gap-3">
                    <Activity size={16} className="text-primary sm:w-[18px] sm:h-[18px]"/> {t('recent_tx')}
                </h3>
                <button onClick={() => setTab('reports')} className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline flex items-center gap-1">
                    See All <ArrowRight size={12}/>
                </button>
            </div>
            
            {/* DESKTOP TABLE */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        <tr>
                            <th className="px-6 py-4">{t('members')}</th>
                            <th className="px-6 py-4">{t('consoles')}</th>
                            <th className="px-6 py-4 text-center">{t('status')}</th>
                            <th className="px-6 py-4 text-right">{t('duration')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border text-sm font-medium">
                        {stats.recentTx.map(tx => (
                            <tr key={tx.id} className="hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 font-bold text-foreground">{tx.memberName}</td>
                                <td className="px-6 py-4 text-muted-foreground text-xs font-bold uppercase">{tx.consoleName}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${
                                        tx.status === 'ACTIVE' 
                                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                                        : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                                    }`}>
                                        {tx.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono text-xs">{tx.durationHours}h</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* MOBILE LIST VIEW */}
            <div className="sm:hidden flex flex-col divide-y divide-border">
                {stats.recentTx.map(tx => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                        <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-foreground">{tx.memberName}</span>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{tx.consoleName}</span>
                                <span className={`text-[9px] font-black uppercase tracking-wider ${
                                    tx.status === 'ACTIVE' ? 'text-emerald-500' : 'text-slate-500'
                                }`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                        <div className="text-right">
                             <span className="block font-mono text-sm font-black text-foreground">{tx.durationHours}h</span>
                             <span className="text-[10px] text-muted-foreground font-medium">{new Date(tx.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                    </div>
                ))}
            </div>

            {stats.recentTx.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-50">
                    {t('no_tx')}
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
