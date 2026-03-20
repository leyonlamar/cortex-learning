import { useEffect } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  message: string;
  type?: ToastType;
  visible: boolean;
  onDismiss: () => void;
  durationMs?: number;
}

const typeColors: Record<ToastType, string> = {
  success: 'var(--accent-success)',
  error: 'var(--accent-danger)',
  info: 'var(--accent-info)',
  warning: 'var(--accent-warning)',
};

export function Toast({
  message,
  type = 'info',
  visible,
  onDismiss,
  durationMs = 4000,
}: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(onDismiss, durationMs);
    return () => clearTimeout(timer);
  }, [visible, durationMs, onDismiss]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 text-sm animate-fade-up glass-subtle"
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderLeft: `3px solid ${typeColors[type]}`,
        borderRadius: 'var(--border-radius)',
        boxShadow: 'var(--shadow-md)',
        color: 'var(--text-primary)',
        fontFamily: 'var(--font-body)',
      }}
    >
      <span>{message}</span>
      <button
        onClick={onDismiss}
        className="cursor-pointer border-none bg-transparent text-base leading-none transition-opacity duration-150"
        style={{ color: 'var(--text-muted)' }}
        aria-label="Dismiss"
      >
        &times;
      </button>
    </div>
  );
}
