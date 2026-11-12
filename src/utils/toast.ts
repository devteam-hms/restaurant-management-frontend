import { toast as sonnerToast } from 'sonner';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

// Recent toast deduplication cache: message -> timestamp (ms)
const recentToasts = new Map<string, number>();
const DEDUPLICATION_WINDOW_MS = 2000;

function isDuplicate(message: string): boolean {
  const now = Date.now();
  const lastTime = recentToasts.get(message);
  if (lastTime && now - lastTime < DEDUPLICATION_WINDOW_MS) {
    return true;
  }
  recentToasts.set(message, now);

  // Periodic cleanup
  if (recentToasts.size > 50) {
    for (const [key, time] of recentToasts.entries()) {
      if (now - time > DEDUPLICATION_WINDOW_MS * 2) {
        recentToasts.delete(key);
      }
    }
  }
  return false;
}

export interface ToastOptions {
  description?: string;
  duration?: number;
  id?: string | number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export const toast = {
  success(message: string, description?: string | ToastOptions) {
    const desc = typeof description === 'string' ? description : description?.description;
    const key = `success:${message}:${desc || ''}`;
    if (isDuplicate(key)) return;

    return sonnerToast.success(message, {
      description: desc,
      duration: typeof description === 'object' ? description.duration || 4000 : 4000,
      id: typeof description === 'object' ? description.id : undefined,
      action: typeof description === 'object' ? description.action : undefined,
    });
  },

  error(message: string, description?: string | ToastOptions) {
    const desc = typeof description === 'string' ? description : description?.description;
    const key = `error:${message}:${desc || ''}`;
    if (isDuplicate(key)) return;

    return sonnerToast.error(message, {
      description: desc,
      duration: typeof description === 'object' ? description.duration || 6000 : 6000,
      id: typeof description === 'object' ? description.id : undefined,
      action: typeof description === 'object' ? description.action : undefined,
    });
  },

  warning(message: string, description?: string | ToastOptions) {
    const desc = typeof description === 'string' ? description : description?.description;
    const key = `warning:${message}:${desc || ''}`;
    if (isDuplicate(key)) return;

    return sonnerToast.warning(message, {
      description: desc,
      duration: typeof description === 'object' ? description.duration || 5000 : 5000,
      id: typeof description === 'object' ? description.id : undefined,
      action: typeof description === 'object' ? description.action : undefined,
    });
  },

  info(message: string, description?: string | ToastOptions) {
    const desc = typeof description === 'string' ? description : description?.description;
    const key = `info:${message}:${desc || ''}`;
    if (isDuplicate(key)) return;

    return sonnerToast.info(message, {
      description: desc,
      duration: typeof description === 'object' ? description.duration || 4500 : 4500,
      id: typeof description === 'object' ? description.id : undefined,
      action: typeof description === 'object' ? description.action : undefined,
    });
  },

  dismiss(id?: string | number) {
    sonnerToast.dismiss(id);
  },
};

export default toast;

