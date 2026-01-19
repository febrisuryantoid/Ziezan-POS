
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
  
  // DYNAMIC ADDRESS BAR COLOR LOGIC
  useEffect(() => {
    const metaThemeColor = document.querySelector("meta[name=theme-color]");
    if (metaThemeColor) {
      // Dark: #030712 (Deep Void), Light: #f5f3ff
      metaThemeColor.setAttribute("content", theme === 'dark' ? '#030712' : '#f5f3ff');
    }
  }, [theme]);
  
  // Desktop Sidebar Item (Minimized with Tooltip)
  const NavItemDesktop = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <div 
        onClick={() => setTab(id)} 
        className={`group relative flex items-center justify-center w-12 h-12 mx-auto rounded-2xl cursor-pointer transition-all duration-300 mb-4
        ${isActive 
          ? 'bg-gradient-to-br from-palette-mustard to-palette-purple text-white shadow-[0_0_20px_-5px_rgba(124,58,237,0.5)] scale-110 border border-white/20' 
          : 'text-slate-400 hover:bg-white/10 hover:text-white hover:scale-105'}`}
      >
        <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
        
        {/* Tooltip (Cyberpunk Style) */}
        <div className="absolute left-full ml-5 px-3 py-1.5 bg-[#0f1016] border border-white/10 text-white text-[10px] font-bold uppercase tracking-wider rounded opacity-0 group-hover:opacity-100 translate-x-[-10px] group-hover:translate-x-0 transition-all duration-200 pointer-events-none whitespace-nowrap z-[100] shadow-xl backdrop-blur-md">
          {label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-2 h-2 bg-[#0f1016] rotate-45 border-l border-b border-white/10"></div>
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
        className="flex-1 flex flex-col items-center justify-center relative group h-full active:scale-95 transition-transform duration-100 min-w-0"
      >
        <div className={`
           transition-all duration-300 ease-out flex items-center justify-center rounded-xl mb-1 relative
           ${isActive 
             ? 'w-10 h-10 sm:w-12 sm:h-10 bg-palette-mustard/20 text-palette-mustard' 
             : 'w-auto h-auto text-slate-500'
           }
        `}>
           {isActive && <div className="absolute inset-0 bg-palette-mustard/20 blur-lg rounded-full"></div>}
           <Icon size={isActive ? 22 : 24} strokeWidth={isActive ? 2.5 : 2} className="relative z-10" />
        </div>
        
        <span className={`
            text-[9px] font-bold leading-none tracking-wide transition-all duration-300 truncate w-full text-center uppercase
            ${isActive 
                ? 'text-palette-mustard scale-100' 
                : 'text-slate-500 scale-90'
            }
        `}>
            {label}
        </span>
      </button>
    );
  };

  const appLogo = settings.businessLogo || "https://beeimg.com/images/t47564105964.png";
  const appName = settings.businessName || "Ziezan Station";

  return (
    // MAIN WRAPPER: Deep Void Background for Gaming Feel
    <div className="flex h-screen w-full bg-slate-50 dark:bg-[#030712] text-slate-800 dark:text-slate-200 overflow-hidden font-sans transition-colors duration-300 fixed inset-0 supports-[height:100dvh]:h-[100dvh]">
      
      {/* Sidebar - Desktop (Glass HUD) */}
      <aside className="hidden md:flex w-24 bg-white/80 dark:bg-[#0f1016]/60 backdrop-blur-2xl border-r border-slate-200/50 dark:border-white/5 flex-col items-center py-8 z-50 shadow-2xl transition-colors duration-300 overflow-visible shrink-0 relative">
        
        {/* Glow Line */}
        <div className="absolute top-0 right-0 w-[1px] h-full bg-gradient-to-b from-transparent via-palette-mustard/50 to-transparent opacity-50"></div>

        {/* App Logo */}
        <div className="mb-10 w-14 h-14 relative group">
           <div className="absolute inset-0 bg-palette-mustard/30 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
           <img 
             src={appLogo} 
             alt={appName} 
             className="w-full h-full object-cover cursor-pointer hover:rotate-6 transition-transform rounded-2xl shadow-lg bg-black border border-white/10 relative z-10"
             title={appName}
             onClick={() => setTab('dashboard')}
             onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")}
           />
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full flex flex-col items-center">
            <NavItemDesktop id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItemDesktop id="consoles" icon={Gamepad2} label={t('consoles')} />
            <NavItemDesktop id="members" icon={Users} label={t('members')} />
            
            <div className="w-10 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent my-6"></div>
            
            <NavItemDesktop id="reports" icon={FileBarChart} label={t('reports')} />
            {user.role === 'ADMIN' && (
              <NavItemDesktop id="settings" icon={Settings} label={t('settings')} />
            )}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col items-center gap-6">
           
           <div className="group relative cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-palette-mustard to-palette-purple p-[2px] shadow-lg shadow-purple-500/20">
                <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-white font-black text-sm">
                    {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
           </div>

           <button 
            onClick={onLogout}
            className="group relative flex items-center justify-center w-10 h-10 rounded-xl text-slate-500 hover:text-white hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/50"
            title={t('logout')}
          >
            <LogOut size={20} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        
        {/* Top Header (Glassmorphism) */}
        <header className="bg-white/60 dark:bg-[#0f1016]/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 h-20 flex justify-between items-center px-6 md:px-10 sticky top-0 z-10 transition-colors duration-300 shrink-0">
          
          {/* Mobile Logo */}
          <div className="flex items-center gap-3 md:hidden">
             <div className="w-10 h-10 rounded-xl shadow-lg border border-white/10 overflow-hidden shrink-0 bg-black">
                <img 
                  src={appLogo} 
                  alt={appName} 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")}
                />
             </div>
             <span className="hidden min-[360px]:inline-block font-black text-lg text-white tracking-wide truncate max-w-[120px]">
                ZIEZAN<span className="text-palette-mustard">.</span>
             </span>
          </div>
          
          {/* Desktop Title */}
          <div className="hidden md:block">
            <h2 className="text-2xl font-black uppercase tracking-wide text-slate-900 dark:text-white flex items-center gap-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-palette-mustard opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-palette-mustard shadow-[0_0_10px_#7c3aed]"></span>
                </span>
                {t(currentTab as any)}
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
               onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
               className="h-10 px-4 rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-white font-bold text-[10px] flex items-center gap-2 hover:bg-white/10 hover:border-palette-mustard transition-all active:scale-95"
            >
               <Languages size={16} />
               <span className="mt-0.5">{language.toUpperCase()}</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="h-10 w-10 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-palette-yellow transition-all hover:border-palette-mustard active:scale-95"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={onLogout} 
              className="md:hidden h-10 w-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 active:scale-95 transition-all"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain bg-slate-100 dark:bg-transparent relative">
          {/* Decorative Grid Background for Dark Mode */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03] dark:bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          {/* 
             NOTE: Removed animate-fade-in from here to prevent fixed modals inside children 
             from being clipped by stacking context created by transform/opacity animations.
             Use relative only for children positioning, but ensure no z-index creates context trapping.
          */}
          <div className="w-full min-h-full p-4 sm:p-6 lg:p-10 pb-32 md:pb-10 relative">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile (Premium Glassmorphism) */}
        <nav className="md:hidden fixed bottom-6 left-6 right-6 bg-[#0f1016]/90 backdrop-blur-2xl border border-white/10 flex justify-between items-center px-2 pb-safe z-50 shadow-2xl rounded-2xl h-[72px]">
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
