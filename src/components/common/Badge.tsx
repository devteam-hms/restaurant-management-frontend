import React from 'react';
import { cn } from '@/lib/utils';
import { OrderStatus, PaymentStatus } from '@/types/order';

export interface BadgeProps {
  variant?: 'gold' | 'default' | 'success' | 'danger' | 'warning' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'default',
  size = 'sm',
  className,
  children,
}) => {
  const sizeStyles = {
    sm: 'text-[11px] px-2.5 py-0.5 tracking-wider uppercase font-medium',
    md: 'text-xs px-3 py-1 tracking-wide font-medium',
  };

  const variantStyles = {
    gold: 'bg-primary/15 text-primary border border-primary/30',
    default: 'bg-surface-secondary text-foreground/80 border border-border',
    success: 'bg-success/15 text-success border border-success/30',
    danger: 'bg-danger/15 text-danger border border-danger/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
    outline: 'bg-transparent text-muted border border-border',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-colors',
        sizeStyles[size],
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus | string }> = ({ status }) => {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'PLACED':
      return <Badge variant="warning">Placed</Badge>;
    case 'CONFIRMED':
      return <Badge variant="gold">Confirmed</Badge>;
    case 'PREPARING':
      return <Badge variant="gold">Preparing</Badge>;
    case 'READY':
      return <Badge variant="success">Ready for Service</Badge>;
    case 'COMPLETED':
      return <Badge variant="success">Completed</Badge>;
    case 'CANCELLED':
      return <Badge variant="danger">Cancelled</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

export const PaymentStatusBadge: React.FC<{ status: PaymentStatus | string }> = ({ status }) => {
  const upper = (status || '').toUpperCase();
  switch (upper) {
    case 'PAID':
      return <Badge variant="success">Paid</Badge>;
    case 'PENDING':
      return <Badge variant="warning">Pending</Badge>;
    case 'FAILED':
      return <Badge variant="danger">Failed</Badge>;
    case 'REFUNDED':
      return <Badge variant="outline">Refunded</Badge>;
    default:
      return <Badge variant="default">{status}</Badge>;
  }
};

