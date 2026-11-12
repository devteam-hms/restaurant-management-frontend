import React from 'react';
import { Toaster } from 'sonner';
import { useTheme } from '@/context/ThemeContext';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export const GlobalToaster: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={isDark ? 'dark' : 'light'}
      closeButton
      icons={{
        success: <CheckCircle2 className="w-5 h-5 text-success shrink-0 mt-0.5" />,
        error: <AlertCircle className="w-5 h-5 text-danger shrink-0 mt-0.5" />,
        warning: <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />,
        info: <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />,
      }}
      toastOptions={{
        duration: 4500,
        className:
          '!bg-surface !text-foreground !border !border-border !shadow-luxury !rounded-2xl !p-4 !font-sans',
        classNames: {
          toast:
            'group !bg-surface !border-border !text-foreground !shadow-luxury !rounded-2xl !p-4 !gap-3',
          title: '!text-sm !font-semibold !text-foreground !tracking-wide',
          description: '!text-xs !text-muted !mt-1 !leading-relaxed',
          actionButton:
            '!bg-primary !text-primary-foreground !font-medium !text-xs !px-3.5 !py-1.5 !rounded-xl hover:!bg-primary-hover',
          cancelButton:
            '!bg-surface-secondary !text-muted !font-medium !text-xs !px-3.5 !py-1.5 !rounded-xl hover:!text-foreground',
          closeButton:
            '!bg-surface !text-muted hover:!text-foreground !border !border-border !rounded-lg',
        },
      }}
    />
  );
};
