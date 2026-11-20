import React, { createContext, useContext, useCallback } from 'react';
import { toast, ToastType } from '@/utils/toast';

interface ToastContextValue {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismissToast: (id?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const showToast = useCallback(
        (type: ToastType, title: string, message?: string, duration?: number) => {
          const options = { description: message, duration };
          switch (type) {
            case 'success':
              toast.success(title, options);
              break;
            case 'error':
              toast.error(title, options);
              break;
            case 'warning':
              toast.warning(title, options);
              break;
            case 'info':
              toast.info(title, options);
              break;
          }
        },
          []
  );

  const success = useCallback((title: string, message?: string) => toast.success(title, message), []);
  const error = useCallback((title: string, message?: string) => toast.error(title, message), []);
  const warning = useCallback((title: string, message?: string) => toast.warning(title, message), []);
  const info = useCallback((title: string, message?: string) => toast.info(title, message), []);
  const dismissToast = useCallback((id?: string) => toast.dismiss(id), []);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, dismissToast }}>
      {children}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
