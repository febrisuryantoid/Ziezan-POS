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
  
  // Sidebar Item Styling
  const navItemClass = (id: string) => `
    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 cursor-pointer mb-1.5 font-medium
    ${currentTab === id 
      ? 'bg-brand-400 text-slate-900 shadow-md shadow-brand-500/20 font-bold' 
      : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-brand-300'}
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
            <span className="absolute top-0 w-8 h-0.5 bg-brand-500 dark:bg-brand-400 rounded-b-full shadow-[0_0_8px_rgba(212,175,55,0.5)]"></span>
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
             <img 
               src="https://beeimg.com/images/q27160638941.png" 
               alt="Ziezan POS" 
               className="w-10 h-10 rounded-xl shadow-lg shadow-brand-500/20"
             />
             <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  Ziezan <span className="text-brand-500">POS</span>
                </h1>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mt-1">Station</p>
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
                <div className="w-10 h-10 rounded-full bg-slate-900 dark:bg-slate-700 flex items-center justify-center text-brand-400 font-bold text-sm ring-2 ring-brand-400/20">
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
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-slate-50 dark:bg-slate-950">
        
        {/* Top Status Bar (Midnight Blue) */}
        <div className="bg-slate-950 text-slate-300 px-4 py-1.5 flex justify-end gap-5 text-[10px] font-bold tracking-wide z-20 border-b border-slate-900">
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-emerald-400' : 'text-red-400'}`}>
                {isOnline ? <Wifi size={12}/> : <WifiOff size={12}/>} 
                {isOnline ? 'ONLINE' : 'OFFLINE'}
            </div>
            <div className={`flex items-center gap-1.5 ${isBtConnected ? 'text-brand-400 cursor-default' : 'text-slate-500 cursor-pointer hover:text-white'}`} onClick={!isBtConnected ? connectBt : undefined}>
                {isBtConnected ? <Bluetooth size={12}/> : <BluetoothOff size={12}/>}
                {isBtConnected ? 'TV CONNECTED' : 'TV DISCONNECTED'}
            </div>
            <div className={`flex items-center gap-1.5 ${isSyncing ? 'text-brand-400 animate-pulse' : 'text-slate-500'}`}>
                <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""}/>
                {isSyncing ? 'SYNCING...' : 'SYNCED'}
            </div>
        </div>

        {/* Top Header - Premium Midnight Blue in Light Mode too, for consistency with Brand */}
        <header className="bg-slate-900 text-white backdrop-blur-md border-b border-slate-800 h-16 flex justify-between items-center px-4 md:px-6 sticky top-0 z-10 transition-colors duration-300 shadow-md">
          <div className="flex items-center gap-3 md:hidden">
             <img 
               src="https://beeimg.com/images/q27160638941.png" 
               alt="Ziezan POS" 
               className="w-9 h-9 rounded-xl shadow-sm border border-slate-700"
             />
             <span className="font-bold text-lg text-white">Ziezan <span className="text-brand-400">POS</span></span>
          </div>
          
          <div className="hidden md:block">
            {/* Breadcrumb-like indicator */}
            <h2 className="text-lg font-bold capitalize text-white flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-brand-400"></span>
                {t(currentTab as any)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
               onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
               className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1 w-12 justify-center border border-slate-700 transition-colors"
            >
               {language.toUpperCase()}
            </button>
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-brand-400 border border-slate-700 transition-colors"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onLogout} 
              className="md:hidden p-2 rounded-lg bg-red-900/50 text-red-400 hover:bg-red-900 border border-red-900"
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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex justify-around items-end px-2 pb-safe z-50 shadow-lg">
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