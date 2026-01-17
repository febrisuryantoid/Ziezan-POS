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

// LAZY LOAD HEAVY COMPONENTS
const Consoles = React.lazy(() => import('./components/Consoles'));
const Members = React.lazy(() => import('./components/Members'));
const Reports = React.lazy(() => import('./components/Reports'));
const Settings = React.lazy(() => import('./components/Settings'));
const PublicMemberCard = React.lazy(() => import('./components/PublicMemberCard'));

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTvMode, setIsTvMode] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [publicMemberNickname, setPublicMemberNickname] = useState<string | null>(null);

  useEffect(() => {
    // 0. Check for Public Member Route
    const path = window.location.pathname;
    if (path.startsWith('/member/')) {
        const nickname = path.split('/')[2];
        if (nickname) {
            setPublicMemberNickname(nickname);
            setShowSplash(false); // Skip splash for public link for faster load
            return;
        }
    }

    // 1. Check Platform
    if (isTV()) {
      setIsTvMode(true);
    }

    // 2. Load Session
    const session = localStorage.getItem('ziezan_user');
    if (session) {
      setUser(JSON.parse(session));
    }

    // 3. Splash Screen Timer
    // Set to 3000ms (3 seconds) to allow the splash animation to complete gracefully
    const timer = setTimeout(() => {
        setShowSplash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('ziezan_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ziezan_user');
    setActiveTab('dashboard');
  };

  // Simple Fallback Loader for Lazy Components
  const PageLoader = () => (
    <div className="flex items-center justify-center h-[50vh] w-full">
      <Loader2 className="w-8 h-8 animate-spin text-palette-mustard" />
    </div>
  );

  // -- PUBLIC MEMBER CARD RENDER --
  if (publicMemberNickname) {
      return (
        <ThemeProvider>
             <DataProvider>
                 <Suspense fallback={<div className="h-screen w-full bg-slate-100 animate-pulse"/>}>
                    <PublicMemberCard nickname={publicMemberNickname} />
                 </Suspense>
             </DataProvider>
        </ThemeProvider>
      );
  }

  // -- SPLASH SCREEN RENDER --
  if (showSplash) {
      return <SplashScreen />;
  }

  // -- TV MODE RENDER --
  if (isTvMode) {
    return (
      <DataProvider>
        <TVReceiver />
      </DataProvider>
    );
  }

  // -- MOBILE / DESKTOP MODE RENDER --
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ToastProvider>
          <BluetoothProvider>
            {!user ? (
              <Login onLogin={handleLogin} />
            ) : (
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
            )}
          </BluetoothProvider>
        </ToastProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;
