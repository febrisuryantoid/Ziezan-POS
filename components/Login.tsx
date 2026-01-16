import React, { useState } from 'react';
import { User } from '../types';
import * as Storage from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const { t, language, setLanguage } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = Storage.checkLogin(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300">
      <div className="max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 relative">
        <button
           onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
           className="absolute top-6 right-6 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        >
           {language.toUpperCase()}
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-brand-500/30">
             <span className="text-3xl font-bold text-white">Z</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('welcome')}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{t('username')}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
              placeholder=""
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">{t('password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-sm text-center font-medium">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 mt-2"
          >
            {t('sign_in')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-400">{t('system_access')}</p>
          <div className="flex justify-center gap-4 mt-2">
            <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-slate-600 dark:text-slate-300 font-mono">ziezan</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;