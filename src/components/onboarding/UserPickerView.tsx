import { Card, Button, Spinner } from '../shared';
import type { User, Theme } from '../../types/models';

const THEME_COLORS: Record<Theme, string> = {
  glass: '#6366f1',
  executive: '#1e293b',
  brutalist: '#000000',
  console: '#22c55e',
  cyberpunk: '#f0abfc',
  luxury: '#d4a574',
  nasa: '#0ea5e9',
  studyhall: '#f59e0b',
};

interface UserPickerViewProps {
  users: User[];
  onSelect: (userId: string) => void;
  onCreateNew: () => void;
  loading?: boolean;
}

export function UserPickerView({ users, onSelect, onCreateNew, loading }: UserPickerViewProps) {
  return (
    <div
      className="flex items-center justify-center"
      style={{ minHeight: '100vh', background: 'var(--bg-primary)', padding: '24px' }}
    >
      <Card className="w-full" style={{ maxWidth: '480px' }}>
        <div className="flex flex-col gap-6">
          <div className="text-center">
            <h1
              className="text-2xl font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Cortex
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
              Who's learning today?
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-6">
              <Spinner size={24} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {users.map((u) => {
                const color = THEME_COLORS[u.theme] ?? '#6366f1';
                return (
                  <button
                    key={u.id}
                    onClick={() => onSelect(u.id)}
                    className="flex items-center gap-3 px-4 py-3 text-sm cursor-pointer text-left"
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--border-radius)',
                      transition: 'border-color 0.15s ease, background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = color;
                      (e.currentTarget as HTMLButtonElement).style.background = color + '15';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-color)';
                      (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-tertiary)';
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center"
                      style={{ background: color + '30', border: `2px solid ${color}` }}
                    >
                      <span
                        className="text-xs font-bold"
                        style={{ color, fontFamily: 'var(--font-display)' }}
                      >
                        {u.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span
                        className="font-medium text-sm"
                        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                      >
                        {u.name}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {u.theme.charAt(0).toUpperCase() + u.theme.slice(1)} theme
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
            <Button onClick={onCreateNew} variant="ghost">
              + Create New Profile
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
