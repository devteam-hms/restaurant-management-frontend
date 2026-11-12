import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLMotionProps<'div'> {
  isInteractive?: boolean;
  elevation?: 'flat' | 'elevated' | 'glass';
}

export const Card: React.FC<CardProps> = ({
  className,
  isInteractive = false,
  elevation = 'flat',
  children,
  ...props
}) => {
  const elevationStyles = {
    flat: 'bg-surface border border-border',
    elevated: 'bg-surface-secondary border border-border/80 shadow-luxury',
    glass: 'glass-panel shadow-luxury',
  };

  return (
    <motion.div
      whileHover={isInteractive ? { y: -4, borderColor: 'rgb(var(--primary) / 0.5)' } : undefined}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={cn(
        'rounded-xl p-6 transition-colors duration-300 relative overflow-hidden',
        elevationStyles[elevation],
        isInteractive && 'cursor-pointer hover:shadow-luxury-hover',
        className
      )}
      {...props}
    >
      {children}
    </motion.div>
  );
};

