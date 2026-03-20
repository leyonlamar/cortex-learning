import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: boolean;
  glow?: boolean;
}

export function Card({
  children,
  padding = true,
  glow = false,
  className = '',
  style,
  ...props
}: CardProps) {
  return (
    <div
      data-card
      className={`${padding ? 'p-4' : ''} ${className}`}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--border-radius)',
        boxShadow: glow
          ? 'var(--shadow-md), 0 0 0 1px var(--accent-primary)'
          : 'var(--shadow-sm)',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
}
