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
      // Colors from tailwind config: Light (creamLight: #f5f3ff), Dark (navy: #0f0720)
      metaThemeColor.setAttribute("content", theme === 'dark' ? '#0f0720' : '#f5f3ff');
    }
  }, [theme]);
  
  // Desktop Sidebar Item (Minimized with Tooltip)
  const NavItemDesktop = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <div 
        onClick={() => setTab(id)} 
        className={`group relative flex items-center justify-center w-10 h-10 mx-auto rounded-full cursor-pointer transition-all duration-300 mb-3
        ${isActive 
          ? 'bg-palette-mustard text-white shadow-lg shadow-palette-mustard/40 scale-105' 
          : 'text-palette-brown/60 dark:text-palette-cream/50 hover:bg-white dark:hover:bg-white/10 hover:text-palette-mustard dark:hover:text-palette-yellow hover:scale-105'}`}
      >
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
        
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
    const handleClick = () => {
        // Haptic feedback simulation for mobile feel
        if (navigator.vibrate) navigator.vibrate(10); 
        setTab(id);
    };

    return (
      <button 
        onClick={handleClick}
        className="flex-1 flex flex-col items-center justify-center relative group h-full active:scale-95 transition-transform duration-100 min-w-0"
      >
        <div className={`
           transition-all duration-300 ease-out flex items-center justify-center rounded-full mb-0.5
           ${isActive 
             ? 'w-10 h-7 sm:w-12 sm:h-8 bg-palette-mustard/10 text-palette-mustard dark:bg-palette-purple/20 dark:text-palette-purple' 
             : 'w-auto h-auto text-slate-400 dark:text-slate-500'
           }
        `}>
           <Icon size={isActive ? 20 : 22} strokeWidth={isActive ? 2.5 : 2} className="sm:w-6 sm:h-6" />
        </div>
        
        <span className={`
            text-[9px] sm:text-[10px] font-bold leading-none tracking-tight transition-all duration-300 truncate w-full text-center
            ${isActive 
                ? 'text-palette-mustard dark:text-palette-purple scale-100' 
                : 'text-slate-400 dark:text-slate-500 scale-90'
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
    // UPDATED: Added w-full, fixed inset-0, and dynamic viewport height support
    <div className="flex h-screen w-full bg-palette-creamLight dark:bg-palette-navy text-palette-brown dark:text-palette-cream overflow-hidden font-sans transition-colors duration-300 fixed inset-0 supports-[height:100dvh]:h-[100dvh]">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex w-20 bg-white/80 dark:bg-palette-navyLight/80 backdrop-blur-xl border-r border-slate-200/50 dark:border-white/5 flex-col items-center py-6 z-50 shadow-2xl transition-colors duration-300 overflow-visible shrink-0">
        
        {/* App Logo - CIRCLE DESIGN SYSTEM */}
        <div className="mb-8 w-12 h-12">
           <img 
             src={appLogo} 
             alt={appName} 
             className="w-full h-full object-cover cursor-pointer hover:rotate-12 transition-transform rounded-full shadow-md bg-white border-2 border-white dark:border-white/10"
             title={appName}
             onClick={() => setTab('dashboard')}
             onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")}
           />
        </div>

        {/* Navigation */}
        <nav className="flex-1 w-full flex flex-col items-center gap-1">
            <NavItemDesktop id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItemDesktop id="consoles" icon={Gamepad2} label={t('consoles')} />
            <NavItemDesktop id="members" icon={Users} label={t('members')} />
            
            <div className="w-8 h-[1px] bg-slate-200 dark:bg-white/10 my-3 rounded-full"></div>
            
            <NavItemDesktop id="reports" icon={FileBarChart} label={t('reports')} />
            {user.role === 'ADMIN' && (
              <NavItemDesktop id="settings" icon={Settings} label={t('settings')} />
            )}
        </nav>

        {/* Footer Actions */}
        <div className="mt-auto flex flex-col items-center gap-5">
           
           {/* User Avatar - Already Rounded Full */}
           <div className="group relative cursor-pointer">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-palette-mustard to-palette-purple p-[2px] shadow-lg">
                <div className="w-full h-full rounded-full bg-white dark:bg-palette-navyLight flex items-center justify-center text-palette-mustard font-black text-xs">
                    {user.username.charAt(0).toUpperCase()}
                </div>
              </div>
           </div>

           <button 
            onClick={onLogout}
            className="group relative flex items-center justify-center w-9 h-9 rounded-full text-slate-400 hover:text-white hover:bg-palette-red transition-all shadow-sm hover:shadow-palette-red/30"
            title={t('logout')}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        
        {/* Top Header */}
        <header className="bg-white/60 dark:bg-palette-navyLight/60 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 h-16 flex justify-between items-center px-4 md:px-8 sticky top-0 z-10 transition-colors duration-300 shrink-0">
          <div className="flex items-center gap-3 md:hidden">
             <div className="w-9 h-9 rounded-full shadow-md border border-white/20 overflow-hidden shrink-0">
                <img 
                  src={appLogo} 
                  alt={appName} 
                  className="w-full h-full object-cover"
                  onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")}
                />
             </div>
             {/* Hide Name on VERY small screens (iPhone 5S width 320px) to prevent overlap */}
             <span className="hidden min-[360px]:inline-block font-extrabold text-lg text-palette-navy dark:text-white tracking-tight truncate max-w-[120px]">{appName}<span className="text-palette-mustard">.</span></span>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-xl font-bold capitalize text-palette-navy dark:text-white flex items-center gap-3">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-palette-mustard opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-palette-mustard"></span>
                </span>
                {t(currentTab as any)}
            </h2>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
               onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
               className="h-9 px-2.5 sm:h-10 sm:px-3 rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-palette-brown dark:text-palette-cream font-bold text-[10px] flex items-center gap-2 hover:border-palette-mustard transition-all active:scale-95 shadow-sm"
            >
               <Languages size={14} className="sm:w-4 sm:h-4" />
               <span className="mt-0.5">{language.toUpperCase()}</span>
            </button>
            <button 
              onClick={toggleTheme}
              className="h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-palette-brown dark:text-palette-yellow transition-all hover:border-palette-mustard active:scale-95 shadow-sm"
            >
              {theme === 'dark' ? <Sun size={16} className="sm:w-[18px] sm:h-[18px]" /> : <Moon size={16} className="sm:w-[18px] sm:h-[18px]" />}
            </button>
            <button 
              onClick={onLogout} 
              className="md:hidden h-9 w-9 sm:h-10 sm:w-10 flex items-center justify-center rounded-full bg-red-50 text-palette-red border border-red-100 dark:bg-red-900/20 dark:border-red-900/30 active:scale-95 transition-all shadow-sm"
            >
              <LogOut size={16} className="sm:w-[18px] sm:h-[18px]" />
            </button>
          </div>
        </header>

        {/* Content Scroll Area */}
        {/* FIX: Optimized padding for 320px devices (p-3) */}
        <main className="flex-1 overflow-y-auto scroll-smooth pb-32 md:pb-8 overscroll-contain bg-slate-50/50 dark:bg-black/20">
          <div className="w-full h-full p-3 sm:p-6 lg:p-8 animate-fade-in">
            {children}
          </div>
        </main>

        {/* Bottom Navigation - Mobile (Premium Glassmorphism) */}
        <nav className="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 dark:bg-palette-navyLight/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex justify-between items-center px-1 pb-safe z-50 shadow-2xl shadow-palette-navy/20 rounded-3xl sm:rounded-full h-[65px] sm:h-[70px]">
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