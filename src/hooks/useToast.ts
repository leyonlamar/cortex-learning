import { createContext, useCallback, useContext, useState } from 'react';

type ToastSeverity = 'success' | 'error' | 'info' | 'warning';

interface ToastEntry {
  id: number;
  message: string;
  severity: ToastSeverity;
}

interface ToastContextValue {
  toasts: ToastEntry[];
  showToast: (message: string, severity?: ToastSeverity) => void;
  dismissToast: (id: number) => void;
}

let _nextId = 0;

export const ToastContext = createContext<ToastContextValue>({
  toasts: [],
  showToast: () => {},
  dismissToast: () => {},
});

export function useToastState(): ToastContextValue {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, severity: ToastSeverity = 'info') => {
    const id = _nextId++;
    setToasts((prev) => [...prev, { id, message, severity }]);
  }, []);

  return { toasts, showToast, dismissToast };
}

export function useToast(): Pick<ToastContextValue, 'showToast'> {
  const ctx = useContext(ToastContext);
  return { showToast: ctx.showToast };
}
