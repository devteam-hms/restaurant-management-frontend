import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, AlertCircle, Info, X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="w-6 h-6 text-danger" />;
      case 'warning':
        return <AlertTriangle className="w-6 h-6 text-warning" />;
      default:
        return <Info className="w-6 h-6 text-primary" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-danger/15 border-danger/30';
      case 'warning':
        return 'bg-warning/15 border-warning/30';
      default:
        return 'bg-primary/15 border-primary/30';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={isLoading ? undefined : onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md rounded-2xl bg-surface border border-border shadow-luxury overflow-hidden z-10 p-6 space-y-5"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3.5">
                <div
                  className={cn(
                    'w-11 h-11 rounded-xl flex items-center justify-center border shrink-0',
                    getIconBg()
                  )}
                >
                  {getIcon()}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-normal text-foreground tracking-wide">
                    {title}
                  </h3>
                </div>
              </div>

              {!isLoading && (
                <button
                  onClick={onClose}
                  className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-surface-secondary transition-colors"
                  aria-label="Close dialog"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <p className="text-xs text-muted leading-relaxed pl-1">
              {description}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/80">
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                disabled={isLoading}
              >
                {cancelText}
              </Button>
              <Button
                variant={variant === 'danger' ? 'danger' : 'primary'}
                size="sm"
                onClick={onConfirm}
                isLoading={isLoading}
              >
                {confirmText}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

