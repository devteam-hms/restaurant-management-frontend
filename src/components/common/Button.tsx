import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold-outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  children,
  ...props
}) => {
  const baseStyles =
    'relative inline-flex items-center justify-center font-medium transition-all duration-300 rounded-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5 tracking-wider uppercase',
    md: 'text-sm px-5 py-2.5 gap-2 tracking-wide',
    lg: 'text-base px-7 py-3.5 gap-2.5 font-medium tracking-wide',
  };

  const variantStyles = {
    primary:
      'bg-primary text-[#0c0b0a] font-semibold hover:bg-primary-hover shadow-gold-glow hover:shadow-luxury-hover border border-primary/40',
    secondary:
      'bg-surface-secondary text-foreground hover:bg-surface-tertiary border border-border hover:border-primary/40',
    outline:
      'bg-transparent text-foreground border border-border hover:border-primary/60 hover:bg-surface-secondary/60',
    'gold-outline':
      'bg-transparent text-primary border border-primary/60 hover:bg-primary/10 hover:border-primary hover:shadow-gold-glow',
    ghost:
      'bg-transparent text-muted hover:text-foreground hover:bg-surface-secondary/40',
    danger:
      'bg-danger/20 text-danger border border-danger/40 hover:bg-danger/30 hover:border-danger',
  };

  return (
    <motion.button
      whileTap={{ scale: disabled || isLoading ? 1 : 0.98 }}
      disabled={disabled || isLoading}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      {...props}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
      {children}
    </motion.button>
  );
};

