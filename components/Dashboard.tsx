
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
    const safeName = c.name || t('unit');
    const shortName = safeName.includes(' - ') ? safeName.split(' - ')[1] : safeName;
    return {
      name: shortName,
      hours: c.totalHoursUsed || 0
    };
  });

  const StatCard = ({ title, value, sub, icon: Icon, colorClass, bgClass }: any) => {
    const isPulse = title === t('active_consoles') && stats.activeConsoles > 0;
    return (
      <div className="glass-card p-5 sm:p-6 hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden group">
        <div className={`absolute -right-6 -top-6 w-28 h-28 rounded-full opacity-10 group-hover:scale-125 group-hover:opacity-20 transition-all duration-700 ${bgClass.replace('/10', '/40').replace('/20', '/60')}`}></div>
        <div className="flex justify-between items-start relative z-10">
          <div className="min-w-0 pr-2">
            <p className="text-label mb-2 opacity-80">{title}</p>
            <h3 className={`text-2xl sm:text-3xl font-black ${colorClass} tracking-tighter break-words`}>{value}</h3>
          </div>
          <div className={`p-3.5 sm:p-4 rounded-2xl shrink-0 shadow-lg ${bgClass} ${colorClass.replace('text', 'text-opacity-100')} ${isPulse ? 'animate-pulse' : ''}`}>
            <Icon size={20} className="sm:w-6 sm:h-6" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${bgClass.replace('/10', '/100')} ${isPulse ? 'animate-pulse' : ''}`}></div>
            <p className="text-[9px] sm:text-[10px] text-muted-foreground/70 font-bold uppercase tracking-widest truncate">{sub}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 sm:gap-8 animate-fade-in">
      <div className="flex flex-col gap-1 px-1">
        <h2 className="text-2xl font-black text-foreground tracking-tight uppercase">{t('dashboard')}</h2>
        <p className="text-label">{t('overview_subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 min-[400px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
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
          colorClass="text-primary"
          bgClass="bg-primary/10"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col min-h-[450px]">
          <div className="p-6 border-b border-border flex justify-between items-center bg-card/10">
            <h3 className="font-black text-sm sm:text-base text-foreground flex items-center gap-3 uppercase tracking-wider">
              <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner"><Activity size={18} /></div>
              {t('recent_tx')}
            </h3>
          </div>
          <div className="flex-1">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground opacity-40">
                <Activity className="w-12 h-12 mb-4" />
                <p className="text-label">{t('no_tx')}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left whitespace-nowrap">
                  <thead className="text-[10px] text-muted-foreground font-black uppercase bg-secondary/50 border-b border-border tracking-widest">
                    <tr>
                      <th className="px-8 py-5">{t('members')}</th>
                      <th className="px-8 py-5">{t('consoles')}</th>
                      <th className="px-8 py-5">{t('status')}</th>
                      <th className="px-8 py-5 text-right">{t('duration')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {recentTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-primary/5 transition-colors group">
                        <td className="px-8 py-5 font-black text-foreground text-xs max-w-[200px] truncate">{tx.memberName || t('unknown')}</td>
                        <td className="px-8 py-5 text-muted-foreground font-bold text-xs">{tx.consoleName || t('unknown')}</td>
                        <td className="px-8 py-5">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm ${
                            tx.status === 'ACTIVE' 
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' 
                              : 'bg-secondary text-muted-foreground border-border'
                          }`}>
                            {tx.status === 'ACTIVE' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse"/>}
                            {tx.status}
                          </span>
                        </td>
                        <td className="px-8 py-5 text-foreground/80 text-right text-xs font-mono font-black">{tx.durationHours} {t('hour_short')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 sm:p-8 flex flex-col">
          <h3 className="font-black text-sm sm:text-base text-foreground mb-6 flex items-center gap-3 uppercase tracking-wider">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shadow-inner"><MonitorPlay size={18} /></div>
            {t('console_util')}
          </h3>
          
          <div className="w-full h-[300px]">
             {consoleUsageData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={consoleUsageData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="5 5" vertical={false} stroke={theme === 'dark' ? 'hsl(var(--border))' : 'hsl(var(--border))'} />
                    <XAxis 
                      dataKey="name" 
                      stroke={theme === 'dark' ? 'hsl(240 5% 65%)' : 'hsl(240 4% 46%)'}
                      fontSize={9} tickLine={false} axisLine={false} dy={10} fontFamily='Plus Jakarta Sans' fontWeight='800'
                    />
                    <YAxis 
                      stroke={theme === 'dark' ? 'hsl(240 5% 65%)' : 'hsl(240 4% 46%)'}
                      fontSize={9} tickLine={false} axisLine={false} fontFamily='Plus Jakarta Sans' fontWeight='800'
                    />
                    <Tooltip 
                      cursor={{ fill: 'hsla(var(--primary), 0.1)', radius: 10 }}
                      contentStyle={{ 
                        backgroundColor: 'hsla(var(--popover), 0.9)', 
                        borderColor: 'hsl(var(--border))',
                        color: 'hsl(var(--popover-foreground))',
                        borderRadius: '20px',
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)',
                        fontSize: '11px',
                        padding: '16px',
                        backdropFilter: 'blur(20px)',
                        fontWeight: '800',
                        textTransform: 'uppercase'
                      }}
                    />
                    <Bar dataKey="hours" radius={[10, 10, 0, 0]} barSize={35}>
                       {consoleUsageData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : '#ec4899'} fillOpacity={0.8} />
                        ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
             ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-30">
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
