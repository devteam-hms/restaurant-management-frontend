import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { cn } from '@/lib/utils';

export interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className,
  showLabel = false,
  size = 'md',
}) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={toggleTheme}
      type="button"
      className={cn(
        'relative inline-flex items-center gap-2 p-2 rounded-xl transition-all duration-300',
        'border border-border/80 hover:border-primary/60 bg-surface/80 hover:bg-surface-secondary text-foreground',
        'focus:outline-none focus:ring-1 focus:ring-primary/40 select-none shadow-sm',
        size === 'sm' && 'p-1.5 text-xs',
        className
      )}
      aria-label={isDark ? 'Switch to Warm Ivory Light Theme' : 'Switch to Luxury Dark Theme'}
      title={isDark ? 'Switch to Warm Ivory Light Theme' : 'Switch to Luxury Dark Theme'}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <AnimatePresence mode="wait" initial={false}>
          {isDark ? (
            <motion.div
              key="sun"
              initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-primary"
            >
              <Sun className="w-4 h-4" />
            </motion.div>
          ) : (
            <motion.div
              key="moon"
              initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-primary"
            >
              <Moon className="w-4 h-4" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showLabel && (
        <span className="text-xs font-medium tracking-wide">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      )}
    </motion.button>
  );
};

