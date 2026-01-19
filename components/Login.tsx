import React, { useState } from 'react';
import { User, Lock, LogIn, Globe } from 'lucide-react';
import { User as UserType } from '../types';
import * as Storage from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState(''); 
  const [error, setError] = useState('');
  const { t, language, setLanguage } = useLanguage();
  
  const currentYear = new Date().getFullYear();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = Storage.checkLogin(username, password);
    if (user) {
      onLogin(user);
    } else {
      setError(t('invalid_login'));
    }
  };

  return (
    // h-[100dvh] forces full viewport height, overflow-hidden prevents scrolling
    <div className="h-[100dvh] w-full bg-slate-50 dark:bg-palette-navy flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full opacity-30 dark:opacity-20 pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-palette-mustard dark:bg-palette-purple rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-palette-green dark:bg-blue-600 rounded-full blur-[100px]"></div>
      </div>

      {/* Main Container - Scalable */}
      <div className="relative w-full max-w-sm z-10 group flex flex-col max-h-full">
        
        {/* Animated Border */}
        <div className="absolute -inset-[2px] rounded-[24px] overflow-hidden z-0">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(#7c3aed,#06b6d4,#f43f5e,#7c3aed,#06b6d4,#f43f5e,#7c3aed)] animate-spin-slow"></div>
        </div>

        {/* Card Content - Flex column with scaling gaps */}
        <div className="relative z-10 bg-white/95 dark:bg-palette-navyLight/95 backdrop-blur-xl rounded-[22px] px-6 py-6 sm:py-8 shadow-xl dark:shadow-2xl flex flex-col justify-between h-auto shrink-0 overflow-hidden">
          
          {/* Lang Switcher */}
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="absolute top-4 right-4 text-[10px] font-bold text-slate-400 hover:text-palette-mustard transition-colors px-2 py-1.5 bg-slate-100 dark:bg-white/5 rounded-lg flex items-center gap-1.5"
          >
            <Globe size={12} />
            {language.toUpperCase()}
          </button>

          {/* Header Section: Logo & Titles */}
          <div className="text-center mb-4 sm:mb-6 shrink-0">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-palette-mustard blur-xl opacity-20 rounded-full"></div>
              {/* Responsive Logo Size - Smaller on very short screens if needed */}
              <img 
                  src="https://beeimg.com/images/t47564105964.png" 
                  alt="Ziezan POS" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.2rem] mx-auto mb-3 sm:mb-4 shadow-lg relative z-10 object-cover"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">{t('welcome')}</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-medium">{t('login_title')}</p>
          </div>

          {/* Form Section */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4 w-full">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                {/* FIX: text-base on mobile prevents iOS zoom */}
                <input 
                    type="text" 
                    autoCapitalize="none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 pr-3 py-3 rounded-xl text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard focus:border-transparent transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600"
                    placeholder={t('enter_username')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                {/* FIX: text-base on mobile prevents iOS zoom */}
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-black/20 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white pl-10 pr-3 py-3 rounded-xl text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-palette-mustard focus:border-transparent transition-all font-medium placeholder-slate-400 dark:placeholder-slate-600"
                    placeholder={t('enter_password')}
                />
              </div>
            </div>

            {error && (
              <div className="bg-palette-red/10 border border-palette-red/20 text-palette-red p-3 rounded-xl text-xs text-center font-bold animate-pulse flex items-center justify-center gap-2">
                <Lock size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              className="w-full bg-palette-mustard hover:bg-palette-purple text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-palette-mustard/20 hover:-translate-y-0.5 mt-2 text-sm sm:text-base flex items-center justify-center gap-2"
            >
              <LogIn size={18} /> {t('sign_in')}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-4 sm:mt-6 text-center shrink-0">
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