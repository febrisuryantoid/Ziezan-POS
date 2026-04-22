
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
      metaThemeColor.setAttribute("content", theme === 'dark' ? '#0b0c15' : '#f8fafc');
    }
  }, [theme]);
  
  const NavItemDesktop = ({ id, icon: Icon, label }: { id: string, icon: any, label: string }) => {
    const isActive = currentTab === id;
    return (
      <button 
        onClick={() => setTab(id)} 
        className={`group relative flex items-center justify-start w-full px-4 py-3.5 mb-2 rounded-xl transition-all duration-300
        ${isActive 
          ? 'bg-primary/10 text-primary shadow-inner font-bold' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-foreground'}`}
      >
        {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_10px_rgba(139,92,246,0.5)]"></div>
        )}
        <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={`mr-4 transition-transform ${isActive ? 'scale-105' : 'group-hover:scale-105'}`} />
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      </button>
    );
  };

  const MobileNavItem = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => {
    const isActive = currentTab === id;
    const handleClick = () => {
        if (navigator.vibrate) navigator.vibrate(10); 
        setTab(id);
    };

    return (
      <button onClick={handleClick} className="relative flex flex-col items-center flex-1 h-full min-w-0 group justify-center pt-1 pb-safe">
        <div className={`relative z-10 transition-all duration-300 ease-out flex flex-col items-center justify-center`}>
           <div className={`p-1.5 sm:p-2 rounded-[14px] transition-all duration-300 mb-1 ${isActive ? 'bg-primary text-white shadow-md shadow-primary/40 scale-110' : 'text-slate-400 dark:text-slate-500 group-active:scale-95'}`}>
             <Icon size={18} strokeWidth={isActive ? 2.5 : 2} className="sm:w-5 sm:h-5" />
           </div>
           <span className={`text-[8px] sm:text-[9px] font-black tracking-widest uppercase transition-all duration-300 w-full text-center truncate px-1 max-w-[60px] ${isActive ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
              {label}
           </span>
        </div>
      </button>
    );
  };

  const appLogo = settings.businessLogo || "https://beeimg.com/images/t47564105964.png";
  const appName = settings.businessName || "Ziezan Station";

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden font-sans transition-colors duration-300 fixed inset-0 noise-bg">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-56 lg:w-64 bg-card/50 backdrop-blur-xl border-r border-border flex-col py-4 lg:py-6 px-3 lg:px-4 z-30 shadow-2xl transition-all duration-500 relative shrink-0">
        <div className="flex items-center gap-3 px-2 mb-6 lg:mb-10 shrink-0">
           <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-xl overflow-hidden shadow-lg border border-white/10 shrink-0 bg-black">
             <img src={appLogo} alt={appName} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = "https://beeimg.com/images/t47564105964.png")} />
           </div>
           <div className="min-w-0">
               <h1 className="font-black text-xs lg:text-sm uppercase tracking-tight truncate">{appName}</h1>
               <p className="text-[9px] lg:text-[10px] text-muted-foreground font-bold tracking-widest">Admin Terminal</p>
           </div>
        </div>

        <nav className="flex-1 w-full space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar pr-1">
            <p className="px-3 lg:px-4 text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1 lg:mb-2 mt-1 lg:mt-2">Main Menu</p>
            <NavItemDesktop id="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
            <NavItemDesktop id="consoles" icon={Gamepad2} label={t('consoles')} />
            <NavItemDesktop id="members" icon={Users} label={t('members')} />
            
            <p className="px-3 lg:px-4 text-[9px] lg:text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mb-1 lg:mb-2 mt-4 lg:mt-6">Management</p>
            <NavItemDesktop id="reports" icon={FileBarChart} label={t('reports')} />
            {user.role === 'ADMIN' && <NavItemDesktop id="settings" icon={Settings} label={t('settings')} />}
        </nav>

        <div className="mt-2 lg:mt-auto pt-4 lg:pt-6 border-t border-dashed border-border flex flex-col gap-2 shrink-0">
           <button onClick={onLogout} className="flex items-center gap-3 px-3 lg:px-4 py-2 lg:py-3 text-red-500 hover:bg-red-500/10 rounded-xl transition-all text-[10px] lg:text-xs font-bold uppercase tracking-wider">
               <LogOut size={16} className="lg:w-[18px] lg:h-[18px]" /> {t('logout')}
           </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative h-full">
        
        {/* HEADER */}
        <header className="h-20 px-6 md:px-8 flex justify-between items-center z-20 shrink-0">
          <div className="flex flex-col md:hidden">
             <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-black overflow-hidden border border-white/20">
                    <img src={appLogo} alt="Logo" className="w-full h-full object-cover" />
                </div>
                <span className="font-black text-lg tracking-tight">ZIEZAN<span className="text-primary">.</span></span>
             </div>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground flex items-center gap-3 animate-fade-in">
                {t(currentTab as any)}
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse"></div>
            </h2>
          </div>

          <div className="flex items-center gap-3 bg-white/50 dark:bg-black/20 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
            <button onClick={() => setLanguage(language === 'id' ? 'en' : 'id')} className="h-9 px-3 rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all text-[10px] font-black uppercase flex items-center gap-2">
                <Languages size={14} /> {language}
            </button>
            <div className="w-[1px] h-4 bg-border"></div>
            <button onClick={toggleTheme} className="h-9 w-9 flex items-center justify-center rounded-xl hover:bg-white/50 dark:hover:bg-white/10 transition-all text-foreground">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* SCROLLABLE CONTENT */}
        <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain relative custom-scrollbar">
          <div className="w-full min-h-full p-4 sm:p-6 lg:p-8 pb-32 md:pb-12 max-w-[1920px] mx-auto">
            {children}
          </div>
        </main>

        {/* MOBILE FLOATING NAV (ISLAND STYLE) */}
        <nav className="md:hidden fixed bottom-4 sm:bottom-6 left-4 right-4 pb-1 pt-1 min-h-[64px] bg-white/80 dark:bg-[#15151e]/80 backdrop-blur-2xl border border-white/20 dark:border-white/5 rounded-[20px] sm:rounded-[24px] flex justify-between items-center px-2 z-50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] animate-slide-in overflow-hidden">
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
