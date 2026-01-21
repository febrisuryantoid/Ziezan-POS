
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
      metaThemeColor.setAttribute("content", theme === 'dark' ? '#030712' : '#f8fafc');
    }
  }, [theme]);
  
  const NavItemDesktop = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <div 
        onClick={() => setTab(id)} 
        className={`group relative flex items-center justify-center w-14 h-14 mx-auto rounded-[1.2rem] cursor-pointer transition-all duration-300 mb-4
        ${isActive 
          ? 'bg-palette-mustard text-white shadow-xl shadow-palette-mustard/30 scale-110' 
          : 'text-slate-400 dark:text-slate-500 hover:bg-white dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white hover:scale-105'}`}
        role="button"
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
        <div className="absolute left-full ml-4 px-3 py-2 bg-white dark:bg-[#1a1a1a] border border-slate-100 dark:border-white/10 text-slate-900 dark:text-white text-[10px] font-bold uppercase tracking-widest rounded-xl opacity-0 group-hover:opacity-100 translate-x-[-8px] group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-[100] shadow-xl">
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
      <button 
        onClick={handleClick} 
        className="flex-1 flex flex-col items-center justify-center relative group h-full active:scale-95 transition-transform duration-200 min-w-0"
        aria-label={label}
        aria-current={isActive ? 'page' : undefined}
      >
        <div className={`transition-all duration-300 ease-out flex items-center justify-center rounded-2xl mb-1 relative ${isActive ? 'w-12 h-10 text-palette-mustard' : 'w-auto h-auto text-slate-400'}`}>
           {isActive && <div className="absolute inset-0 bg-palette-mustard/10 blur-lg rounded-full"></div>}
           <Icon size={isActive ? 24 : 22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
        </div>
        <span className={`text-[9px] font-bold leading-none tracking-widest transition-all duration-300 truncate w-full text-center uppercase ${isActive ? 'text-palette-mustard opacity-100' : 'text-slate-400 opacity-60'}`}>{label}</span>
      </button>
    );
  };

  const appLogo = settings.businessLogo || "https://beeimg.com/images/t47564105964.png";
  const appName = settings.businessName || "Ziezan Station";

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300 fixed inset-0">
      
      {/* Sidebar - Enhanced Glassmorphism */}
      <aside className="hidden md:flex w-24 lg:w-28 bg-white/70 dark:bg-[#0f1016]/50 backdrop-blur-3xl border-r border-slate-200 dark:border-white/5 flex-col items-center py-8 z-30 shadow-2xl transition-all duration-500 overflow-visible shrink-0 relative">
        
        <div className="mb-10 w-14 h-14 lg:w-16 lg:h-16 relative group">
           <div className="absolute inset-0 bg-palette-mustard/40 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
           <img 
             src={appLogo} 
             alt={appName} 
             className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-all rounded-2xl shadow-xl bg-black border border-white/20 relative z-10"
             onClick={() => setTab('dashboard')}
             onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")}
           />
        </div>

        <nav className="flex-1 w-full flex flex-col items-center gap-1">
            <NavItemDesktop id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItemDesktop id="consoles" icon={Gamepad2} label={t('consoles')} />
            <NavItemDesktop id="members" icon={Users} label={t('members')} />
            <div className="w-10 h-[1px] bg-slate-200 dark:bg-white/10 my-4"></div>
            <NavItemDesktop id="reports" icon={FileBarChart} label={t('reports')} />
            {user.role === 'ADMIN' && <NavItemDesktop id="settings" icon={Settings} label={t('settings')} />}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-4 pb-4">
           <button onClick={onLogout} className="group relative flex items-center justify-center w-12 h-12 rounded-2xl text-slate-400 hover:text-white hover:bg-red-500/90 transition-all border border-transparent hover:border-red-500/40 backdrop-blur-md" title={t('logout')}><LogOut size={20} /></button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        
        {/* Header - Optimized Glass */}
        <header className="bg-white/70 dark:bg-[#030712]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 h-20 flex justify-between items-center px-6 md:px-10 sticky top-0 z-20 transition-all duration-300 shrink-0">
          <div className="flex items-center gap-4 md:hidden">
             <div className="w-10 h-10 rounded-xl shadow-lg border border-white/20 overflow-hidden shrink-0 bg-black animate-zoom-in">
                <img src={appLogo} alt={appName} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")} />
             </div>
             <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight uppercase">ZIEZAN<span className="text-palette-mustard">.</span></span>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-lg font-bold uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-4 animate-fade-in">
                <div className="flex h-2.5 w-2.5 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-palette-mustard opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-palette-mustard shadow-[0_0_15px_#7c3aed]"></span></div>
                {t(currentTab as any)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} className="btn-glass px-4 h-10"><Languages size={16} /> {language.toUpperCase()}</button>
            <button onClick={toggleTheme} className="btn-icon w-10 h-10 rounded-xl">{theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}</button>
            <button onClick={onLogout} className="md:hidden btn-icon w-10 h-10 rounded-xl bg-red-50 text-red-500 border-red-100 dark:bg-red-500/10 dark:text-red-500 dark:border-red-500/20"><LogOut size={18} /></button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain relative custom-scrollbar">
          {/* Main content padding adjustment */}
          <div className="w-full min-h-full p-4 sm:p-6 lg:p-10 pb-36 md:pb-12 relative max-w-[1600px] mx-auto">
            {children}
          </div>
        </main>

        {/* Mobile Bottom Nav - Updated Height & Safe Area */}
        <nav className="md:hidden fixed bottom-6 left-4 right-4 bg-white/90 dark:bg-[#0f1016]/90 backdrop-blur-2xl border border-slate-200 dark:border-white/10 flex justify-between items-center px-2 z-40 shadow-2xl rounded-[2rem] h-[72px] animate-slide-in pb-safe">
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
