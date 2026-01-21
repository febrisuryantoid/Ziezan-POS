
import React, { useEffect } from 'react';
import { LayoutDashboard, Gamepad2, Users, Settings, LogOut, FileBarChart, Moon, Sun, Languages } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useData } from '../contexts/DataContext';

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
  const { settings } = useData();
  
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      metaThemeColor.setAttribute("content", theme === 'dark' ? '#030712' : '#f5f3ff');
    }
  }, [theme]);
  
  const NavItemDesktop = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <div 
        onClick={() => setTab(id)} 
        className={`group relative flex items-center justify-center w-14 h-14 mx-auto rounded-[1.2rem] cursor-pointer transition-all duration-500 mb-4
        ${isActive 
          ? 'bg-palette-mustard text-white shadow-2xl shadow-palette-mustard/40 scale-110 border border-white/20 backdrop-blur-md' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:scale-105'}`}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <div className="absolute left-full ml-5 px-3 py-1.5 bg-white dark:bg-[#0f1016]/90 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white text-[9px] font-black uppercase tracking-[0.2em] rounded-lg opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-2xl backdrop-blur-xl">
          {label}
        </div>
      </div>
    );
  };

  const MobileNavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = currentTab === id;
    const handleClick = () => {
        if (navigator.vibrate) navigator.vibrate(10); 
        setTab(id);
    };

    return (
      <button onClick={handleClick} className="flex-1 flex flex-col items-center justify-center relative group h-full active:scale-90 transition-transform duration-100 min-w-0">
        <div className={`transition-all duration-500 ease-out flex items-center justify-center rounded-2xl mb-1 relative ${isActive ? 'w-12 h-10 bg-palette-mustard/20 text-palette-mustard' : 'w-auto h-auto text-slate-500 dark:text-slate-500'}`}>
           {isActive && <div className="absolute inset-0 bg-palette-mustard/20 blur-xl rounded-full"></div>}
           <Icon size={isActive ? 22 : 24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
        </div>
        <span className={`text-[8px] font-black leading-none tracking-[0.1em] transition-all duration-500 truncate w-full text-center uppercase ${isActive ? 'text-palette-mustard scale-105' : 'text-slate-500 scale-90 opacity-60'}`}>{label}</span>
      </button>
    );
  };

  const appLogo = settings.businessLogo || "https://beeimg.com/images/t47564105964.png";
  const appName = settings.businessName || "Ziezan Station";

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300 fixed inset-0">
      
      {/* Sidebar - Enhanced Glassmorphism */}
      <aside className="hidden md:flex w-28 bg-white/60 dark:bg-[#0f1016]/40 backdrop-blur-3xl border-r border-slate-200 dark:border-white/5 flex-col items-center py-10 z-30 shadow-2xl transition-all duration-500 overflow-visible shrink-0 relative">
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-palette-mustard/30 to-transparent opacity-40"></div>

        <div className="mb-12 w-16 h-16 relative group">
           <div className="absolute inset-0 bg-palette-mustard/30 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
           <img 
             src={appLogo} 
             alt={appName} 
             className="w-full h-full object-cover cursor-pointer group-hover:scale-110 transition-all rounded-[1.5rem] shadow-2xl bg-black border border-white/20 relative z-10"
             onClick={() => setTab('dashboard')}
             onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")}
           />
        </div>

        <nav className="flex-1 w-full flex flex-col items-center">
            <NavItemDesktop id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItemDesktop id="consoles" icon={Gamepad2} label={t('consoles')} />
            <NavItemDesktop id="members" icon={Users} label={t('members')} />
            <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-slate-300/30 dark:via-white/20 to-transparent my-8"></div>
            <NavItemDesktop id="reports" icon={FileBarChart} label={t('reports')} />
            {user.role === 'ADMIN' && <NavItemDesktop id="settings" icon={Settings} label={t('settings')} />}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-6 pb-2">
           <button onClick={onLogout} className="group relative flex items-center justify-center w-12 h-12 rounded-2xl text-slate-500 hover:text-white hover:bg-red-500/80 transition-all border border-transparent hover:border-red-500/40 backdrop-blur-md shadow-inner" title={t('logout')}><LogOut size={20} /></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        
        {/* Header - Transparent Glass */}
        <header className="bg-white/50 dark:bg-transparent backdrop-blur-xl border-b border-slate-200 dark:border-white/5 h-20 flex justify-between items-center px-6 md:px-10 sticky top-0 z-20 transition-all duration-500 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
             <div className="w-11 h-11 rounded-[1rem] shadow-xl border border-white/20 overflow-hidden shrink-0 bg-black animate-zoom-in">
                <img src={appLogo} alt={appName} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")} />
             </div>
             <span className="font-black text-xl text-slate-900 dark:text-white tracking-tighter uppercase">ZIEZAN<span className="text-palette-mustard">.</span></span>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-xl font-black uppercase tracking-[0.1em] text-slate-900 dark:text-white flex items-center gap-4 animate-fade-in">
                <div className="flex h-3 w-3 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-palette-mustard opacity-75"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-palette-mustard shadow-[0_0_15px_#7c3aed]"></span></div>
                {t(currentTab as any)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} className="btn-glass"><Languages size={16} /> {language}</button>
            <button onClick={toggleTheme} className="btn-icon">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={onLogout} className="md:hidden btn-icon bg-red-500/10 text-red-500 border-red-500/20"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain relative custom-scrollbar">
          {/* REMOVED relative z-10 from the inner div to prevent stacking context locking */}
          <div className="w-full min-h-full p-4 sm:p-6 lg:p-10 pb-32 md:pb-12 relative">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-white/80 dark:bg-[#0f1016]/80 backdrop-blur-2xl border border-slate-200 dark:border-white/10 flex justify-between items-center px-4 pb-safe z-40 shadow-2xl rounded-[2rem] h-[72px] animate-slide-in">
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
