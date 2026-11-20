import React from 'react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  isLoading,
  emptyMessage = 'No records found.',
  className,
}: TableProps<T>) {
  return (
    <div className={cn('w-full overflow-x-auto rounded-xl border border-border bg-surface', className)}>
      <table className="w-full text-left border-collapse text-sm">
        <thead>
          <tr className="border-b border-border/80 bg-surface-secondary/60">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-5 py-3.5 text-xs font-medium uppercase tracking-wider text-muted',
                  col.className
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-muted">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
                  <span className="text-xs tracking-wider uppercase">Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-5 py-12 text-center text-muted">
                <p className="text-sm font-serif italic text-muted">{emptyMessage}</p>
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick && onRowClick(row)}
                className={cn(
                  'transition-colors duration-150',
                  onRowClick
                    ? 'cursor-pointer hover:bg-surface-secondary/80'
                    : 'hover:bg-surface-secondary/40'
                )}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-5 py-4 text-foreground/90', col.className)}>
                    {col.render ? col.render(row) : (row as any)[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

