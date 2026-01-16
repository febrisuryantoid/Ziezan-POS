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
  
  // Dynamic Year
  const currentYear = new Date().getFullYear();

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
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-brand-600 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-sm w-full bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/10 dark:border-slate-700/50 p-8 rounded-3xl shadow-2xl relative z-10">
        <button
           onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
           className="absolute top-6 right-6 text-xs font-bold text-slate-400 hover:text-brand-400 transition-colors"
        >
           {language.toUpperCase()}
        </button>

        <div className="text-center mb-10">
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-brand-400 blur-xl opacity-20 rounded-full"></div>
             <img 
                src="https://beeimg.com/images/q27160638941.png" 
                alt="Ziezan POS" 
                className="w-24 h-24 rounded-[2rem] mx-auto mb-6 shadow-xl relative z-10"
             />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">{t('welcome')}</h1>
          <p className="text-slate-400 mt-2 text-sm font-medium">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-400 uppercase tracking-wide">{t('username')}</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-medium placeholder-slate-600"
              placeholder="Enter username"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-brand-400 uppercase tracking-wide">{t('password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-900/50 border border-slate-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all font-medium placeholder-slate-600"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm text-center font-bold">
              {error}
            </div>
          )}

          <button 
            type="submit" 
            className="w-full bg-brand-400 hover:bg-brand-500 text-slate-950 font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-brand-500/20 hover:-translate-y-0.5 mt-4"
          >
            {t('sign_in')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-xs text-slate-500">{t('system_access')}</p>
          <div className="flex justify-center gap-4 mt-2 mb-6">
            <span className="text-xs bg-slate-800 border border-slate-700 px-2 py-1 rounded text-slate-400 font-mono">ziezan</span>
          </div>

          <p className="text-[10px] text-slate-500 font-medium">
            &copy; {currentYear} Ziezan Station
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;