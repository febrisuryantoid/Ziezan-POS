
import React, { useState } from 'react';
import { User, Lock, LogIn, Globe } from 'lucide-react';
import { User as UserType } from '../types';
import * as Storage from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import GamingBackground from './GamingBackground';

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
    <div className="h-[100dvh] w-full bg-[#050b14] flex items-center justify-center p-4 transition-colors duration-300 relative overflow-hidden">
      <GamingBackground />

      <div className="relative w-full max-w-sm z-10 group flex flex-col max-h-full animate-fade-in">
        <div className="absolute -inset-[2px] rounded-[24px] overflow-hidden z-0">
             <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[conic-gradient(#7c3aed,#ec4899,#7c3aed,#ec4899,#7c3aed)] animate-spin-slow opacity-60"></div>
        </div>

        <div className="relative z-10 bg-popover/90 backdrop-blur-3xl rounded-[22px] px-6 py-8 shadow-2xl flex flex-col justify-between h-auto shrink-0 overflow-hidden border border-border">
          <button
            onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
            className="absolute top-4 right-4 text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors px-2 h-7 bg-secondary rounded-lg flex items-center gap-1.5 backdrop-blur-md border border-border"
          >
            <Globe size={12} />
            {language.toUpperCase()}
          </button>

          <div className="text-center mb-6 shrink-0">
            <div className="relative inline-block">
              <div className="absolute inset-0 bg-primary blur-2xl opacity-40 rounded-full scale-125"></div>
              <img 
                  src="https://beeimg.com/images/t47564105964.png" 
                  alt="Ziezan POS" 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-[1.2rem] mx-auto mb-4 shadow-lg relative z-10 object-cover bg-black ring-1 ring-white/20"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground tracking-tight leading-tight">{t('welcome')}</h1>
            <p className="text-muted-foreground text-xs font-medium mt-1">{t('login_title')}</p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide ml-1">{t('username')}</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                    type="text" 
                    autoCapitalize="none"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="input-standard w-full pl-10"
                    placeholder={t('enter_username')}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wide ml-1">{t('password')}</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-standard w-full pl-10"
                    placeholder={t('enter_password')}
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-500 p-3 rounded-xl text-xs text-center font-bold animate-pulse flex items-center justify-center gap-2">
                <Lock size={14} /> {error}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary w-full mt-2"
            >
              <LogIn size={16} /> {t('sign_in')}
            </button>
          </form>

          <div className="mt-6 text-center shrink-0">
            <p className="text-[10px] text-muted-foreground/50 font-black uppercase tracking-[0.2em]">
              &copy; {currentYear} Ziezan Station
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
