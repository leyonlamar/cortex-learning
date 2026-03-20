import type { Theme } from '../../types/models';

interface ThemePickerProps {
  current: Theme;
  onSelect: (theme: Theme) => void;
}

const THEME_META: Record<Theme, { label: string; description: string; preview: string }> = {
  glass: {
    label: 'Pastel Glassmorphism',
    description: 'Lavender, violet, mint \u2014 Nunito',
    preview: 'linear-gradient(135deg, #F0EEFF 0%, #7C6BF0 50%, #4ECDC4 100%)',
  },
  executive: {
    label: 'Executive Minimal',
    description: 'Navy, white, corporate blue \u2014 IBM Plex',
    preview: 'linear-gradient(135deg, #FFFFFF 0%, #1A56DB 50%, #0F1729 100%)',
  },
  brutalist: {
    label: 'Neo-Brutalist Lab',
    description: 'Yellow, black, raw grid \u2014 Syncopate',
    preview: 'linear-gradient(135deg, #FFFEF5 0%, #FFD60A 50%, #000000 100%)',
  },
  console: {
    label: 'OLED Ops Console',
    description: 'True black, green, amber \u2014 JetBrains Mono',
    preview: 'linear-gradient(135deg, #000000 0%, #00FF88 50%, #FFB800 100%)',
  },
  cyberpunk: {
    label: 'Cyberpunk Neon',
    description: 'Hot pink, cyan, dark purple \u2014 Orbitron',
    preview: 'linear-gradient(135deg, #0D0221 0%, #FF2E97 50%, #00F0FF 100%)',
  },
  luxury: {
    label: 'Luxury Gold',
    description: 'Black, gold, warm ivory \u2014 Playfair Display',
    preview: 'linear-gradient(135deg, #1A1A2E 0%, #D4AF37 50%, #FFFBF0 100%)',
  },
  nasa: {
    label: 'NASA Mission Control',
    description: 'Deep blue, white, red accents \u2014 Space Grotesk',
    preview: 'linear-gradient(135deg, #0B3D91 0%, #FFFFFF 50%, #FC3D21 100%)',
  },
  studyhall: {
    label: 'Study Hall',
    description: 'Warm cream, forest green, wood \u2014 Merriweather',
    preview: 'linear-gradient(135deg, #FDF6E3 0%, #2D6A4F 50%, #8B5E3C 100%)',
  },
};

export function ThemePicker({ current, onSelect }: ThemePickerProps) {
  return (
    <div className="grid grid-cols-2 gap-3 stagger-children">
      {(Object.keys(THEME_META) as Theme[]).map((t) => {
        const meta = THEME_META[t];
        const isActive = current === t;
        return (
          <button
            key={t}
            onClick={() => onSelect(t)}
            className="flex flex-col overflow-hidden cursor-pointer border-none text-left group"
            style={{
              borderRadius: 'var(--border-radius)',
              border: isActive ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
              background: 'var(--bg-surface)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, box-shadow 0.2s ease',
              boxShadow: isActive ? 'var(--shadow-md)' : 'var(--shadow-sm)',
            }}
            onMouseDown={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = '';
            }}
          >
            {/* Gradient preview */}
            <div
              className="h-16 w-full"
              style={{ background: meta.preview }}
            />
            <div className="p-3">
              <div className="flex items-center gap-1.5">
                {isActive && (
                  <div
                    className="w-1.5 h-1.5 rounded-full pulse-dot"
                    style={{ background: 'var(--accent-primary)' }}
                  />
                )}
                <div
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                >
                  {meta.label}
                </div>
              </div>
              <div
                className="text-xs mt-1"
                style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
              >
                {meta.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
