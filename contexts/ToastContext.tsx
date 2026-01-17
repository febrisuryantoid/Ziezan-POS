import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastMessage, ToastType } from '../types';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

interface ToastContextType {
  addToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, type, title, message }]);

    // Auto remove after 4 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      
      {/* Toast Container - Fixed Position */}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 max-w-[90vw] w-96 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto transform transition-all duration-300 animate-slide-in flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md ${
              toast.type === 'success' ? 'bg-white/95 dark:bg-palette-navy/95 border-palette-green/20 dark:border-palette-green/30 text-slate-800 dark:text-white' :
              toast.type === 'error' ? 'bg-white/95 dark:bg-palette-navy/95 border-palette-red/20 dark:border-palette-red/30 text-slate-800 dark:text-white' :
              toast.type === 'warning' ? 'bg-white/95 dark:bg-palette-navy/95 border-palette-copper/20 dark:border-palette-copper/30 text-slate-800 dark:text-white' :
              'bg-white/95 dark:bg-palette-navy/95 border-slate-200 dark:border-white/10 text-slate-800 dark:text-white'
            }`}
          >
             {/* Icon */}
             <div className={`mt-0.5 shrink-0 ${
               toast.type === 'success' ? 'text-palette-green' :
               toast.type === 'error' ? 'text-palette-red' :
               toast.type === 'warning' ? 'text-palette-copper' :
               'text-palette-mustard'
             }`}>
               {toast.type === 'success' && <CheckCircle size={20} />}
               {toast.type === 'error' && <AlertCircle size={20} />}
               {toast.type === 'warning' && <AlertTriangle size={20} />}
               {toast.type === 'info' && <Info size={20} />}
             </div>

             <div className="flex-1 min-w-0">
               <h4 className="text-sm font-bold leading-tight">{toast.title}</h4>
               {toast.message && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{toast.message}</p>}
             </div>

             <button 
               onClick={() => removeToast(toast.id)}
               className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
             >
               <X size={16} />
             </button>
             
             {/* Progress Bar Animation (Visual flair) */}
             <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                <div className={`h-full w-full origin-left animate-[shimmer_4s_linear_forwards] ${
                   toast.type === 'success' ? 'bg-palette-green' :
                   toast.type === 'error' ? 'bg-palette-red' :
                   toast.type === 'warning' ? 'bg-palette-copper' :
                   'bg-palette-mustard'
                }`}></div>
             </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
};