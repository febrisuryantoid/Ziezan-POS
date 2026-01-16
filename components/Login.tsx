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
    <div className="min-h-screen bg-slate-50 dark:bg-palette-navy flex items-center justify-center p-6 transition-colors duration-300 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-palette-mustard dark:bg-palette-purple rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-palette-green dark:bg-blue-600 rounded-full blur-[120px]"></div>
      </div>

      {/* Wrapper for the Animated Border */}
      <div className="relative max-w-sm w-full z-10 group">
        
        {/* ANIMATED BORDER LAYER: 
            Conic Gradient rotating Clockwise (animate-spin-slow).
            Colors: Electric Violet (#7c3aed), Cyan (#06b6d4), Rose (#f43f5e)
        */}
        <div className="absolute -inset-[2px] rounded-[24px] overflow-hidden z-0">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(#7c3aed,#06b6d4,#f43f5e,#7c3aed,#06b6d4,#f43f5e,#7c3aed)] animate-spin-slow"></div>
        </div>

        {/* CONTENT CARD: 
            Background matches theme to cover the center, leaving only the 2px border visible.
        */}
        <div className="relative z-10 bg-white/95 dark:bg-palette-navyLight/95 backdrop-blur-xl rounded-[22px] p-8 shadow-xl dark:shadow-2xl h-full">
          
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="absolute top-6 right-6 text-xs font-bold text-slate-400 hover:text-palette-mustard transition-colors"
          >
            {language.toUpperCase()}
          </button>

          <div className="text-center mb-10">
            <div className="relative inline-block">
              {/* Subtle inner glow for the logo */}
              <div className="absolute inset-0 bg-palette-mustard blur-xl opacity-20 rounded-full"></div>
              <img 
                  src="https://beeimg.com/images/q27160638941.png" 
                  alt="Ziezan POS" 
                  className="w-24 h-24 rounded-[2rem] mx-auto mb-6 shadow-xl relative z-10"
              />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{t('welcome')}</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium">{t('login_title')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('username')}</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-mustard focus:border-transparent transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="Enter username"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('password')}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-palette-mustard focus:border-transparent transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="bg-palette-red/10 border border-palette-red/20 text-palette-red p-3 rounded-lg text-sm text-center font-bold">
                {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-palette-mustard hover:bg-palette-purple text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-palette-mustard/20 hover:-translate-y-0.5 mt-4"
            >
              {t('sign_in')}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
              &copy; {currentYear} Ziezan Station
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;