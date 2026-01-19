import React, { useState, useEffect, Suspense } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import TVReceiver from './components/TVReceiver';
import SplashScreen from './components/SplashScreen';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BluetoothProvider } from './contexts/BluetoothContext';
import { ToastProvider } from './contexts/ToastContext';
import { User } from './types';
import { isTV } from './utils/platform';
import { Loader2 } from 'lucide-react';

// LAZY LOAD COMPONENTS
// Standard lazy loading is sufficient as default exports are confirmed in component files
const Consoles = React.lazy(() => import('./components/Consoles'));
const Members = React.lazy(() => import('./components/Members'));
const Reports = React.lazy(() => import('./components/Reports'));
const Settings = React.lazy(() => import('./components/Settings'));
const PublicMemberCard = React.lazy(() => import('./components/PublicMemberCard'));

const App: React.FC = () => {
  // 1. Initialize Route/Platform State IMMEDIATELY (Lazy Initializer)
  // This prevents the "Flash" of Splash screen or Login screen on TV Mode
  const [publicMemberNickname] = useState<string | null>(() => {
     const path = window.location.pathname;
     if (path.startsWith('/member/')) {
        const segments = path.split('/');
        return segments[2] || null;
     }
     return null;
  });

  const [isTvMode, setIsTvMode] = useState<boolean>(() => isTV());

  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // 2. Only show splash if NOT a public page AND NOT TV mode
  const [showSplash, setShowSplash] = useState(() => !publicMemberNickname && !isTvMode);

  useEffect(() => {
    // 3. Platform Check (Double check for resizing events) & Session Restore
    const handleResize = () => {
       if (isTV() && !isTvMode) setIsTvMode(true);
    };
    window.addEventListener('resize', handleResize);

    const session = localStorage.getItem('ziezan_user');
    if (session) {
      setUser(JSON.parse(session));
    }

    // 4. Splash Timer
    let timer: ReturnType<typeof setTimeout>;
    if (showSplash) {
        timer = setTimeout(() => {
            setShowSplash(false);
        }, 3000);
    }

    return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', handleResize);
    };
  }, [showSplash, isTvMode]);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('ziezan_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ziezan_user');
    setActiveTab('dashboard');
  };

  const PageLoader = () => (
    <div className="flex items-center justify-center h-[50vh] w-full">
      <Loader2 className="w-8 h-8 animate-spin text-palette-mustard" />
    </div>
  );

  // --- RENDER CONTENT SELECTOR ---
  const renderContent = () => {
    // 1. Public Member Card (Priority 1)
    if (publicMemberNickname) {
       return (
         <DataProvider>
             <Suspense fallback={<div className="h-screen w-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-palette-mustard"/></div>}>
                <PublicMemberCard nickname={publicMemberNickname} />
             </Suspense>
         </DataProvider>
       );
    }

    // 2. TV Mode (Priority 2 - Skip Splash)
    // Wrapped in DataProvider because TVReceiver needs access to data context
    if (isTvMode) {
        return (
          <DataProvider>
             <TVReceiver />
          </DataProvider>
        );
    }

    // 3. Splash Screen (Priority 3 - Only for Admin/Operator App)
    if (showSplash) {
        return <SplashScreen />;
    }

    // 4. Login Screen
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    // 5. Main App
    return (
      <DataProvider>
        <Layout 
          currentTab={activeTab} 
          setTab={setActiveTab} 
          user={user} 
          onLogout={handleLogout}
        >
          <Suspense fallback={<PageLoader />}>
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'consoles' && <Consoles operatorName={user.username} />}
            {activeTab === 'members' && <Members />}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && user.role === 'ADMIN' && <Settings />}
            {activeTab === 'settings' && user.role !== 'ADMIN' && (
              <div className="p-8 text-center text-slate-500">Access Denied: Admin only.</div>
            )}
          </Suspense>
        </Layout>
      </DataProvider>
    );
  };

  // --- ROOT PROVIDER WRAPPER ---
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