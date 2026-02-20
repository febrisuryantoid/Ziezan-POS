
import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import SplashScreen from './components/SplashScreen';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BluetoothProvider } from './contexts/BluetoothContext';
import { ToastProvider } from './contexts/ToastContext';
import { User } from './types';
import { Loader2 } from 'lucide-react';
import InstallPrompt from './components/InstallPrompt';

// LAZY LOAD COMPONENTS
const Consoles = React.lazy(() => import('./components/Consoles'));
const Members = React.lazy(() => import('./components/Members'));
const Reports = React.lazy(() => import('./components/Reports'));
const Settings = React.lazy(() => import('./components/Settings'));
const PublicMemberCard = React.lazy(() => import('./components/PublicMemberCard'));
const Leaderboard = React.lazy(() => import('./components/Leaderboard')); 

const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const SESSION_KEY = 'ziezan_admin_session';

const App: React.FC = () => {
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState<User | null>(null);
  const [isSessionChecked, setIsSessionChecked] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);

  useEffect(() => {
    try {
        const sessionString = localStorage.getItem(SESSION_KEY);
        if (sessionString) {
          try {
            const session = JSON.parse(sessionString);
            if (session && session.user && session.expiry > Date.now()) {
              setUser(session.user);
              // If a valid session exists, immediately navigate to dashboard
              if (window.location.pathname === '/' || window.location.pathname === '/login') {
                setPath('/dashboard'); 
              }
            } else {
              localStorage.removeItem(SESSION_KEY);
            }
          } catch (e) {
            console.error("Failed to parse session, clearing storage.", e);
            localStorage.removeItem(SESSION_KEY);
          }
        }
    } catch (e) {
        console.warn("LocalStorage access denied or failed", e);
    }
    setIsSessionChecked(true);

    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    
    const handleBeforeInstallPrompt = (e: Event) => {
        e.preventDefault();
        setInstallPromptEvent(e);
    };
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    if (!isStandalone) {
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }

    return () => {
        window.removeEventListener('popstate', handlePopState);
        if (!isStandalone) {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        }
    };
  }, []);

  const handleLogin = (u: User) => {
    const sessionData = { user: u, expiry: Date.now() + SESSION_DURATION };
    setUser(u);
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    handleNavigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setShowSplash(true); // Reset splash screen for next login
    localStorage.removeItem(SESSION_KEY);
    handleNavigate('/');
  };

  const handleNavigate = (newPath: string) => {
    const route = newPath.startsWith('/') ? newPath : `/${newPath}`;
    try {
        if (window.history && window.history.pushState) {
            window.history.pushState(null, '', route);
        }
    } catch (e) {
        console.warn('History API restricted. Using state-only routing.');
    }
    setPath(route);
  };

  const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-full bg-[#050b14]">
      <Loader2 className="w-10 h-10 animate-spin text-white" />
    </div>
  );

  const routeState = useMemo(() => {
    return {
        isRank: path === '/rank',
        isMemberPublic: path.startsWith('/member/'),
        publicMemberNickname: path.startsWith('/member/') ? decodeURIComponent(path.split('/')[2] || '') : null
    };
  }, [path]);

  const renderContent = () => {
    if (!isSessionChecked) {
      return <PageLoader />;
    }

    if (routeState.isRank) {
      return (
        <DataProvider>
          <Suspense fallback={<PageLoader />}>
            <Leaderboard onNavigateBack={handleNavigate} />
          </Suspense>
        </DataProvider>
      );
    }

    if (routeState.publicMemberNickname) {
      return (
        <DataProvider>
          <Suspense fallback={<PageLoader />}>
            <PublicMemberCard nickname={routeState.publicMemberNickname} />
          </Suspense>
        </DataProvider>
      );
    }

    if (!user) {
      if (showSplash) {
          return <SplashScreen onComplete={() => setShowSplash(false)} />;
      }
      return <Login onLogin={handleLogin} />;
    }

    const currentTab = path.replace('/', '') || 'dashboard';

    return (
      <DataProvider>
        <Layout 
          currentTab={currentTab} 
          setTab={handleNavigate} 
          user={user} 
          onLogout={handleLogout}
        >
          <Suspense fallback={<div className="p-10 flex justify-center"><Loader2 className="animate-spin text-palette-mustard" /></div>}>
            {currentTab === 'dashboard' && <Dashboard setTab={handleNavigate} />}
            {currentTab === 'consoles' && <Consoles operatorName={user.username} />}
            {currentTab === 'members' && <Members />}
            {currentTab === 'reports' && <Reports />}
            {currentTab === 'settings' && (user.role === 'ADMIN' ? <Settings /> : <div className="p-8 text-center text-slate-500">Akses Ditolak</div>)}
          </Suspense>
        </Layout>
      </DataProvider>
    );
  };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <BluetoothProvider>
             {renderContent()}
             {installPromptEvent && <InstallPrompt promptEvent={installPromptEvent} onClose={() => setInstallPromptEvent(null)} />}
          </BluetoothProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
