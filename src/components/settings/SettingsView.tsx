import { useState } from 'react';
import { Card, Button } from '../shared';
import { ThemePicker } from './ThemePicker';
import { DataExport } from './DataExport';
import type { Theme } from '../../types/models';

interface SettingsViewProps {
  theme: Theme;
  onThemeSwitch: (theme: Theme) => void;
  userName: string | null;
  onCreateUser: (name: string) => void;
  onSwitchProfile?: () => void;
}

export function SettingsView({ theme, onThemeSwitch, userName, onCreateUser, onSwitchProfile }: SettingsViewProps) {
  const [nameInput, setNameInput] = useState('');

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <h2
        className="text-xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Settings
      </h2>

      {/* Profile */}
      <Card>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Profile
        </h3>
        {userName ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Signed in as <strong>{userName}</strong>
            </p>
            {onSwitchProfile && (
              <Button size="sm" variant="secondary" onClick={onSwitchProfile}>
                Switch Profile
              </Button>
            )}
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder="Your name"
              className="flex-1 px-3 py-2 text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--border-radius)',
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-body)',
              }}
            />
            <Button
              size="sm"
              onClick={() => { if (nameInput.trim()) onCreateUser(nameInput.trim()); }}
              disabled={!nameInput.trim()}
            >
              Create
            </Button>
          </div>
        )}
      </Card>

      {/* Theme Picker */}
      <Card>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Theme
        </h3>
        <ThemePicker current={theme} onSelect={onThemeSwitch} />
      </Card>

      {/* Data Export */}
      <DataExport />
    </div>
  );
}
