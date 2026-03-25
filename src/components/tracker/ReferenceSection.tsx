import { useState, type ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface ReferenceSectionProps {
  title: string;
  badge?: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

export function ReferenceSection({ title, badge, children, defaultOpen = false }: ReferenceSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="tk-accordion">
      <button
        className="tk-accordion-header"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>
          {title}
          {badge && (
            <span
              style={{
                marginLeft: 8,
                fontSize: '0.7rem',
                fontFamily: "'Fira Code', 'Consolas', monospace",
                color: 'var(--tk-text-muted)',
                background: 'var(--tk-bg-deep)',
                padding: '2px 8px',
                borderRadius: 999,
              }}
            >
              {badge}
            </span>
          )}
        </span>
        <ChevronDown size={16} className={`tk-accordion-chevron${open ? ' open' : ''}`} />
      </button>
      {open && <div className="tk-accordion-body">{children}</div>}
    </div>
  );
}
