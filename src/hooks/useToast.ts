import { useState, useCallback } from 'react';
import type { ToastMessage } from '@/types';
import { v4 as uuid } from 'uuid';

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback(
    (type: ToastMessage['type'], title: string, message?: string) => {
      const toast: ToastMessage = { id: uuid(), type, title, message };
      setToasts((prev) => [...prev, toast]);
      setTimeout(() => removeToast(toast.id), 5000);
    },
    []
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return {
    toasts,
    success: (title: string, msg?: string) => addToast('success', title, msg),
    error: (title: string, msg?: string) => addToast('error', title, msg),
    warning: (title: string, msg?: string) => addToast('warning', title, msg),
    info: (title: string, msg?: string) => addToast('info', title, msg),
    removeToast,
  };
}

export type UseToastReturn = ReturnType<typeof useToast>;
