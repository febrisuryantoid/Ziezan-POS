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

  // DYNAMIC ADDRESS BAR COLOR LOGIC
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      // Colors from tailwind config: Light (creamLight: #f5f3ff), Dark (navy: #0f0720)
      metaThemeColor.setAttribute("content", theme === 'dark' ? '#0f0720' : '#f5f3ff');
    }
  }, [theme]);

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
  
  // Desktop Sidebar Item (Minimized with Tooltip)
  const NavItemDesktop = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <div 
        onClick={() => setTab(id)} 
        className={`group relative flex items-center justify-center w-12 h-12 mx-auto rounded-xl cursor-pointer transition-all duration-300 mb-3
        ${isActive 
          ? 'bg-palette-mustard text-white shadow-lg shadow-palette-mustard/40' 
          : 'text-palette-brown/60 dark:text-palette-cream/50 hover:bg-palette-cream dark:hover:bg-palette-navyLight hover:text-palette-mustard dark:hover:text-palette-yellow'}`}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        
        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-3 py-1.5 bg-palette-navyLight text-white text-xs font-bold rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-xl border border-palette-mustard/20">
          {label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-palette-navyLight rotate-45 border-l border-b border-palette-mustard/20"></div>
        </div>
      </div>
    );
  };

  const MobileNavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = currentTab === id;
    return (
      <button 
        onClick={() => setTab(id)}
        className="flex-1 flex flex-col items-center justify-end pb-1 pt-1 relative group h-[50px]"
      >
        <div className={`
           absolute transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1) flex items-center justify-center z-20
           ${isActive 
             ? 'w-12 h-12 bg-palette-mustard dark:bg-palette-purple text-white rounded-full shadow-md shadow-palette-mustard/20 dark:shadow-palette-purple/20 -top-5' 
             : 'w-auto h-auto text-palette-brown/40 dark:text-palette-cream/40 top-1'
           }
        `}>
           <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} />
        </div>
        
        <span className={`
            text-[10px] font-bold leading-none tracking-tight transition-all duration-300 absolute bottom-1 z-10
            ${isActive 
                ? 'text-palette-mustard dark:text-palette-purple opacity-100 translate-y-0' 
                : 'text-palette-brown/40 dark:text-palette-cream/40 opacity-100'
            }
        `}>
            {label}
        </span>
      </button>
    );
  };

  return (
    // UPDATED: Added w-full, fixed inset-0, and dynamic viewport height support
    <div className="flex h-screen w-full bg-palette-creamLight dark:bg-palette-navy text-palette-brown dark:text-palette-cream overflow-hidden font-sans transition-colors duration-300 fixed inset-0 supports-[height:100dvh]:h-[100dvh]">
      
      {/* Sidebar - Desktop */}
      {/* UPDATED: Added rounded-r-[32px] for curved right side */}
      <aside className="hidden md:flex w-20 bg-white dark:bg-palette-navyLight border-r border-slate-200 dark:border-white/5 flex-col items-center py-6 z-50 shadow-xl rounded-r-[32px] transition-colors duration-300 overflow-visible shrink-0">
        
        {/* App Logo */}
        <div className="mb-8">
           <img 
             src="https://beeimg.com/images/t47564105964.png" 
             alt="Ziezan POS" 
             className="w-10 h-10 rounded-xl shadow-lg shadow-palette-mustard/20 cursor-pointer hover:scale-110 transition-transform ring-2 ring-white dark:ring-palette-navyLight"
             title="Ziezan POS"
           />
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full flex flex-col items-center gap-1">
            <NavItemDesktop id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItemDesktop id="consoles" icon={Gamepad2} label={t('consoles')} />
            <NavItemDesktop id="members" icon={Users} label={t('members')} />
            
            <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10 my-2"></div>
            
            <NavItemDesktop id="reports" icon={FileBarChart} label={t('reports')} />
            {user.role === 'ADMIN' && (
              <NavItemDesktop id="settings" icon={Settings} label={t('settings')} />
            )}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col items-center gap-4">
           {/* User Avatar */}
           <div className="group relative">
              <div className="w-10 h-10 rounded-full bg-palette-cream dark:bg-white/10 flex items-center justify-center text-palette-mustard font-bold text-sm ring-2 ring-transparent group-hover:ring-palette-mustard transition-all cursor-help">
                {user.username.charAt(0).toUpperCase()}
              </div>
           </div>

           <button 
            onClick={onLogout}
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-400 hover:text-palette-red hover:bg-palette-red/10 dark:hover:bg-palette-red/20 transition-colors"
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      {/* UPDATED: Added md:pl-6 to create a proportional gap between Sidebar and Header/Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full md:pl-6">
        
        {/* Top Status Bar (Harmonized) */}
        <div className="bg-white/50 dark:bg-palette-navy/50 backdrop-blur-sm text-slate-600 dark:text-slate-400 px-4 py-2 flex justify-end gap-5 text-xs font-bold tracking-wide z-20 border-b border-slate-200/50 dark:border-white/5 shrink-0">
            <div className={`flex items-center gap-1.5 ${isOnline ? 'text-palette-green' : 'text-palette-red'}`}>
                {isOnline ? <Wifi size={14}/> : <WifiOff size={14}/>} 
                {isOnline ? t('online') : t('offline')}
            </div>
            <div className={`flex items-center gap-1.5 ${isBtConnected ? 'text-blue-500 cursor-default' : 'text-slate-400 cursor-pointer hover:text-palette-mustard'}`} onClick={!isBtConnected ? connectBt : undefined}>
                {isBtConnected ? <Bluetooth size={14}/> : <BluetoothOff size={14}/>}
                {isBtConnected ? t('tv_connected') : t('tv_disconnected')}
            </div>
            <div className={`flex items-center gap-1.5 ${isSyncing ? 'text-palette-mustard animate-pulse' : 'text-slate-400'}`}>
                <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""}/>
                {isSyncing ? t('syncing') : t('synced')}
            </div>
        </div>

        {/* Top Header */}
        {/* UPDATED: Added rounded-b-[32px] for curved bottom corners */}
        <header className="bg-white/80 dark:bg-palette-navyLight/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 h-16 flex justify-between items-center px-4 md:px-8 sticky top-0 z-10 transition-colors duration-300 shrink-0 rounded-b-[32px] shadow-sm">
          <div className="flex items-center gap-3 md:hidden">
             <img 
               src="https://beeimg.com/images/t47564105964.png" 
               alt="Ziezan POS" 
               className="w-8 h-8 rounded-lg shadow-sm"
             />
             <span className="font-bold text-lg text-palette-navy dark:text-white">Ziezan <span className="text-palette-mustard">POS</span></span>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-xl font-bold capitalize text-palette-navy dark:text-white flex items-center gap-2">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-palette-mustard opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-palette-mustard"></span>
                </span>
                {t(currentTab as any)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
               onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
               className="h-10 px-4 rounded-xl bg-palette-cream/50 hover:bg-palette-cream dark:bg-white/5 dark:hover:bg-white/10 text-palette-brown dark:text-palette-cream font-bold text-xs flex items-center gap-2 border border-transparent transition-all"
            >
               <Languages size={18} />
               <span className="mt-0.5">{language.toUpperCase()}</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-palette-cream/50 hover:bg-palette-cream dark:bg-white/5 dark:hover:bg-white/10 text-palette-brown dark:text-palette-yellow transition-all"
            >
              {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button 
              onClick={onLogout} 
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-red-50 text-palette-red hover:bg-red-100 dark:bg-red-900/20 dark:text-palette-red dark:hover:bg-red-900/30 transition-all"
            >
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        {/* UPDATED: Changed padding bottom to pb-24 (96px) which is better for bottom nav spacing */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth pb-24 md:pb-8 overscroll-contain">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile */}
        {/* UPDATED: Height reduced to h-[60px], items-end with padding adjustment for tighter layout */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-palette-navyLight border-t border-slate-200 dark:border-white/5 flex justify-around items-end px-2 pb-safe z-50 shadow-[0_-8px_30px_rgba(0,0,0,0.12)] rounded-t-[32px] h-[60px]">
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