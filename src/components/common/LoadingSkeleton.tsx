import React from 'react';
import { cn } from '@/lib/utils';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-lg bg-surface-secondary/70 border border-border/40',
        className
      )}
    />
  );
};

