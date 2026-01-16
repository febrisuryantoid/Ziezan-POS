import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Consoles from './components/Consoles';
import Members from './components/Members';
import Reports from './components/Reports';
import Settings from './components/Settings';
import Login from './components/Login';
import TVReceiver from './components/TVReceiver';
import { DataProvider } from './contexts/DataContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { BluetoothProvider } from './contexts/BluetoothContext';
import { User } from './types';
import { isTV } from './utils/platform';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isTvMode, setIsTvMode] = useState(false);

  useEffect(() => {
    // 1. Check Platform
    if (isTV()) {
      setIsTvMode(true);
    }

    // 2. Load Session
    const session = localStorage.getItem('ziezan_user');
    if (session) {
      setUser(JSON.parse(session));
    }
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
                {activeTab === 'dashboard' && <Dashboard />}
                {activeTab === 'consoles' && <Consoles operatorName={user.username} />}
                {activeTab === 'members' && <Members />}
                {activeTab === 'reports' && <Reports />}
                {activeTab === 'settings' && user.role === 'ADMIN' && <Settings />}
                {activeTab === 'settings' && user.role !== 'ADMIN' && (
                  <div className="p-8 text-center text-slate-500">Access Denied: Admin only.</div>
                )}
              </Layout>
            </DataProvider>
          )}
        </BluetoothProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
};

export default App;