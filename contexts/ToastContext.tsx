
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
    setToasts((prev) => [{ id, type, title, message }, ...prev]);

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
      
      <div className="fixed top-24 right-0 left-0 sm:left-auto sm:right-4 z-[9999] flex flex-col items-center sm:items-end gap-3 px-4 sm:px-0 pointer-events-none">
        {toasts.map((toast) => (
          <div 
            key={toast.id}
            className={`pointer-events-auto w-full sm:w-96 transform transition-all duration-300 animate-slide-in flex items-start gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md bg-popover/95 text-popover-foreground ${
              toast.type === 'success' ? 'border-palette-green/30' :
              toast.type === 'error' ? 'border-palette-red/30' :
              toast.type === 'warning' ? 'border-palette-copper/30' :
              'border-border'
            }`}
          >
             <div className={`mt-0.5 shrink-0 ${
               toast.type === 'success' ? 'text-palette-green' :
               toast.type === 'error' ? 'text-palette-red' :
               toast.type === 'warning' ? 'text-palette-copper' :
               'text-primary'
             }`}>
               {toast.type === 'success' && <CheckCircle size={20} />}
               {toast.type === 'error' && <AlertCircle size={20} />}
               {toast.type === 'warning' && <AlertTriangle size={20} />}
               {toast.type === 'info' && <Info size={20} />}
             </div>

             <div className="flex-1 min-w-0">
               <h4 className="text-sm font-bold leading-tight">{toast.title}</h4>
               {toast.message && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{toast.message}</p>}
             </div>

             <button 
               onClick={() => removeToast(toast.id)}
               className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
             >
               <X size={16} />
             </button>
             
             <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-muted rounded-full overflow-hidden">
                <div className={`h-full w-full origin-left animate-[shimmer_4s_linear_forwards] ${
                   toast.type === 'success' ? 'bg-palette-green' :
                   toast.type === 'error' ? 'bg-palette-red' :
                   toast.type === 'warning' ? 'bg-palette-copper' :
                   'bg-primary'
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
