
import React, { useState, useEffect, Suspense, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import TVReceiver from './components/TVReceiver';
import LandingPage from './components/LandingPage';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BluetoothProvider } from './contexts/BluetoothContext';
import { ToastProvider } from './contexts/ToastContext';
import { User } from './types';
import { Loader2 } from 'lucide-react';

// LAZY LOAD COMPONENTS
const Consoles = React.lazy(() => import('./components/Consoles'));
const Members = React.lazy(() => import('./components/Members'));
const Reports = React.lazy(() => import('./components/Reports'));
const Settings = React.lazy(() => import('./components/Settings'));
const PublicMemberCard = React.lazy(() => import('./components/PublicMemberCard'));
const Leaderboard = React.lazy(() => import('./components/Leaderboard')); 

const App: React.FC = () => {
  // Source of truth for navigation
  const [path, setPath] = useState(window.location.pathname);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Session recovery
    const session = localStorage.getItem('ziezan_user');
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        localStorage.removeItem('ziezan_user');
      }
    }

    const handlePopState = () => {
      setPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('ziezan_user', JSON.stringify(u));
    handleNavigate('/dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ziezan_user');
    handleNavigate('/');
  };

  const handleNavigate = (newPath: string) => {
    const route = newPath.startsWith('/') ? newPath : `/${newPath}`;
    
    // Safety check for browser history access
    try {
        if (window.history && window.history.pushState) {
            window.history.pushState(null, '', route);
        }
    } catch (e) {
        console.warn('History API restricted in this environment. Using state-only routing.');
    }
    
    setPath(route);
  };

  const PageLoader = () => (
    <div className="flex items-center justify-center h-screen w-full bg-[#050b14]">
      <Loader2 className="w-10 h-10 animate-spin text-palette-mustard" />
    </div>
  );

  // Memoized route detection for performance
  const routeState = useMemo(() => {
    return {
        isRoot: path === '/' || path === '',
        isLogin: path === '/login',
        isTv: path === '/tv',
        isRank: path === '/rank',
        isMemberPublic: path.startsWith('/member/'),
        publicMemberNickname: path.startsWith('/member/') ? decodeURIComponent(path.split('/')[2] || '') : null
    };
  }, [path]);

  const renderContent = () => {
    // 1. PUBLIC LANDING PAGE
    if (routeState.isRoot) {
      return <LandingPage onNavigate={handleNavigate} />;
    }

    // 2. UNPROTECTED PUBLIC ROUTES
    if (routeState.isTv) {
      return (
        <DataProvider>
          <TVReceiver />
        </DataProvider>
      );
    }

    if (routeState.isRank) {
      return (
        <DataProvider>
          <Suspense fallback={<PageLoader />}>
            <Leaderboard />
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

    if (routeState.isLogin) {
      return <Login onLogin={handleLogin} onBack={() => handleNavigate('/')} />;
    }

    // 3. PROTECTED ADMIN ROUTES
    if (!user) {
      return <Login onLogin={handleLogin} onBack={() => handleNavigate('/')} />;
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
            {currentTab === 'dashboard' && <Dashboard />}
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
          </BluetoothProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
