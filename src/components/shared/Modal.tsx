import { useEffect, useRef, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  }, [open]);

  if (!open) return null;

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(e) => { if (e.target === dialogRef.current) onClose(); }}
      className="fixed inset-0 z-50 m-0 flex items-center justify-center border-none bg-transparent p-0"
      style={{ maxWidth: '100vw', maxHeight: '100vh' }}
    >
      <div
        data-modal-backdrop
        className="fixed inset-0 glass animate-fade-in"
        style={{ background: 'rgba(0,0,0,0.4)' }}
      />
      <div
        className="relative z-10 w-full max-w-lg p-6 animate-scale-in"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--border-radius)',
          boxShadow: 'var(--shadow-lg)',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2
            className="text-lg font-semibold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            className="cursor-pointer border-none bg-transparent text-xl leading-none transition-opacity duration-150"
            style={{ color: 'var(--text-muted)' }}
            aria-label="Close"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
