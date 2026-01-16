import React, { useEffect, useState } from 'react';
import { LayoutDashboard, Gamepad2, Users, Settings, LogOut, FileBarChart, Moon, Sun, Languages, Bluetooth, BluetoothOff, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useBluetooth } from '../contexts/BluetoothContext';

interface LayoutProps {
  children: React.ReactNode;
  currentTab: string;
  setTab: (tab: string) => void;
  user: { username: string, role: string };
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, currentTab, setTab, user, onLogout }) => {
  const { theme, toggleTheme } = useTheme();
  const { t, language, setLanguage } = useLanguage();
  const { isConnected: isBtConnected, connect: connectBt } = useBluetooth();
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Dynamic Year
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    const handleSyncStart = () => setIsSyncing(true);
    const handleSyncEnd = () => setIsSyncing(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('sync-start', handleSyncStart);
    window.addEventListener('sync-end', handleSyncEnd);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('sync-start', handleSyncStart);
      window.removeEventListener('sync-end', handleSyncEnd);
    };
  }, []);
  
  const navItemClass = (id: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer mb-1.5 font-medium
    ${currentTab === id 
      ? 'bg-brand-50 text-brand-600 dark:bg-brand-900/30 dark:text-brand-400 shadow-sm' 
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'}
  `;

  const MobileNavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = currentTab === id;
    return (
      <button 
        onClick={() => setTab(id)}
        className={`flex-1 flex flex-col items-center justify-center py-2 transition-colors relative group ${
          isActive ? 'text-brand-600 dark:text-brand-400' : 'text-slate-400 dark:text-slate-500'
        }`}
      >
        {isActive && (
            <span className="absolute top-0 w-8 h-0.5 bg-brand-600 dark:bg-brand-400 rounded-b-full shadow-[0_0_8px_rgba(14,165,233,0.5)]"></span>
        )}
        <div className={`p-1 rounded-full transition-all ${isActive ? 'bg-brand-50 dark:bg-brand-900/20 translate-y-0.5' : 'group-active:scale-95'}`}>
           <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-medium leading-none tracking-tight mt-1">{label}</span>
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col shadow-sm z-20 transition-colors duration-300">
        <div className="p-8">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-brand-500/30">Z</div>
             <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  Ziezan <span className="text-brand-600">POS</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">POS System</p>
             </div>
          </div>
        </div>

        <nav className="flex-1 px-4 overflow-y-auto">
          <div className="mb-6">
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Main</p>
            <div onClick={() => setTab('dashboard')} className={navItemClass('dashboard')}>
              <LayoutDashboard size={20} /> {t('dashboard')}
            </div>
            <div onClick={() => setTab('consoles')} className={navItemClass('consoles')}>
              <Gamepad2 size={20} /> {t('consoles')}
            </div>
            <div onClick={() => setTab('members')} className={navItemClass('members')}>
              <Users size={20} /> {t('members')}
            </div>
          </div>
          
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin</p>
            <div onClick={() => setTab('reports')} className={navItemClass('reports')}>
              <FileBarChart size={20} /> {t('reports')}
            </div>
            {user.role === 'ADMIN' && (
              <div onClick={() => setTab('settings')} className={navItemClass('settings')}>
                <Settings size={20} /> {t('settings')}
              </div>
            )}
          </div>
        </nav>

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 m-4 mb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700/50">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white capitalize">{user.username}</p>
                  <p className="text-xs text-brand-600 dark:text-brand-400 font-medium">{user.role}</p>
                </div>
             </div>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center justify-center gap-2 w-full py-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-xl transition-all text-sm font-medium"
          >
            <LogOut size={18} /> {t('logout')}
          </button>
          
          {/* Copyright Footer */}
          <div className="mt-4 text-center">
            <p className="text-[10px] text-slate-400 font-medium">
              &copy; {currentYear} Ziezan POS
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Top Status Bar (New) */}
        <div className="bg-slate-900 text-white px-4 py-1 flex justify-end gap-4 text-[10px] font-bold tracking-wide z-20">
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>} 
                {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div className={`flex items-center gap-1.5 ${isBtConnected ? 'text-blue-400 cursor-default' : 'text-slate-400 cursor-pointer hover:text-white'}`} onClick={!isBtConnected ? connectBt : undefined}>
                {isBtConnected ? <Bluetooth size={12}/> : <BluetoothOff size={12}/>}
                {isBtConnected ? 'TV CONNECTED' : 'TV DISCONNECTED'}
            </div>
            <div className={`flex items-center gap-1.5 ${isSyncing ? 'text-yellow-400 animate-pulse' : 'text-slate-500'}`}>
                <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""}/>
                {isSyncing ? 'SYNCING...' : 'SYNCED'}
            </div>
        </div>

        {/* Top Header */}
        <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex justify-between items-center px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300">
          <div className="flex items-center gap-3 md:hidden">
             <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-brand-500/20">Z</div>
             <span className="font-bold text-lg text-slate-900 dark:text-white">Ziezan POS</span>
          </div>
          
          <div className="hidden md:block">
            {/* Breadcrumb-like indicator */}
            <h2 className="text-lg font-semibold capitalize text-slate-700 dark:text-slate-200">{t(currentTab as any)}</h2>
          </div>

          <div className="flex items-center gap-3">
            <button
               onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
               className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center gap-1 w-12 justify-center border border-slate-200 dark:border-slate-700"
            >
               {language.toUpperCase()}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onLogout} 
              className="md:hidden p-2 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24 md:pb-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile Only */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-end px-2 pb-safe z-50">
             <MobileNavItem id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
             <MobileNavItem id="consoles" icon={Gamepad2} label={t('consoles')} />
             <MobileNavItem id="members" icon={Users} label={t('members')} />
             <MobileNavItem id="reports" icon={FileBarChart} label={t('reports')} />
             {user.role === 'ADMIN' && <MobileNavItem id="settings" icon={Settings} label={t('settings')} />}
        </nav>
      </div>
    </div>
  );
};

export default Layout;