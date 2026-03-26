import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, LayoutDashboard, CalendarCheck, BookOpen, CalendarDays,
  GanttChart, BarChart3, TrendingUp, Settings, NotebookPen, Timer,
  Trophy, Layers, ArrowRight,
} from 'lucide-react';
import type { ViewId } from '../../types/routes';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (view: ViewId) => void;
}

interface CommandItem {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  action: () => void;
  keywords: string[];
}


export function CommandPalette({ open, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const commands: CommandItem[] = [
    { id: 'dashboard', label: 'Dashboard', description: 'Main overview & roadmap', icon: LayoutDashboard, action: () => onNavigate('dashboard'), keywords: ['home', 'overview', 'main'] },
    { id: 'today', label: 'Today', description: "Today's session & phases", icon: CalendarCheck, action: () => onNavigate('today'), keywords: ['session', 'daily', 'current'] },
    { id: 'quiz', label: 'Curriculum', description: 'Browse topics & take quizzes', icon: BookOpen, action: () => onNavigate('quiz'), keywords: ['topics', 'study', 'learn', 'curriculum'] },
    { id: 'flashcards', label: 'Flashcards', description: 'Spaced repetition review', icon: Layers, action: () => onNavigate('flashcards'), keywords: ['cards', 'review', 'memorize', 'srs'] },
    { id: 'weekly', label: 'Weekly Review', description: 'Weekly progress summary', icon: CalendarDays, action: () => onNavigate('weekly'), keywords: ['week', 'review', 'summary'] },
    { id: 'timeline', label: 'Timeline', description: '43-week program timeline', icon: GanttChart, action: () => onNavigate('timeline'), keywords: ['gantt', 'schedule', 'plan'] },
    { id: 'analytics', label: 'Analytics', description: 'Charts & performance data', icon: BarChart3, action: () => onNavigate('analytics'), keywords: ['charts', 'stats', 'data', 'performance'] },
    { id: 'forecast', label: 'Forecast', description: 'Completion probability', icon: TrendingUp, action: () => onNavigate('forecast'), keywords: ['predict', 'probability', 'monte carlo'] },
    { id: 'notes', label: 'Notes', description: 'Learning journal & notes', icon: NotebookPen, action: () => onNavigate('notes'), keywords: ['journal', 'write', 'notebook'] },
    { id: 'focus', label: 'Focus Timer', description: 'Pomodoro focus sessions', icon: Timer, action: () => onNavigate('focus'), keywords: ['pomodoro', 'timer', 'concentrate'] },
    { id: 'achievements', label: 'Achievements', description: 'XP, badges & milestones', icon: Trophy, action: () => onNavigate('achievements'), keywords: ['badges', 'xp', 'gamification', 'rewards'] },
    { id: 'settings', label: 'Settings', description: 'Profile, theme & export', icon: Settings, action: () => onNavigate('settings'), keywords: ['profile', 'theme', 'export', 'preferences'] },
  ];

  const filtered = query.trim()
    ? commands.filter((cmd) => {
        const q = query.toLowerCase();
        return (
          cmd.label.toLowerCase().includes(q) ||
          cmd.description.toLowerCase().includes(q) ||
          cmd.keywords.some((k) => k.includes(q))
        );
      })
    : commands;

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIndex] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filtered[selectedIndex]) {
          filtered[selectedIndex].action();
          onClose();
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [filtered, selectedIndex, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh] animate-fade-in"
      style={{ zIndex: 9999 }}
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} />

      {/* Palette */}
      <div
        className="relative w-full max-w-lg overflow-hidden animate-scale-in"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: 'calc(var(--border-radius) * 1.5)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-color)' }}
        >
          <Search size={18} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search views, actions..."
            className="flex-1 text-sm bg-transparent border-none outline-none"
            style={{
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
            }}
          />
          <kbd
            className="text-xs px-1.5 py-0.5"
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-color)',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              fontFamily: 'var(--font-code)',
            }}
          >
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div
          ref={listRef}
          className="overflow-y-auto py-2"
          style={{ maxHeight: '320px' }}
        >
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No results found
            </div>
          )}
          {filtered.map((cmd, idx) => {
            const Icon = cmd.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={cmd.id}
                className="w-full flex items-center gap-3 px-4 py-2.5 border-none cursor-pointer text-left transition-colors duration-75"
                style={{
                  background: isSelected ? 'var(--accent-primary)' : 'transparent',
                  color: isSelected ? 'var(--text-inverse)' : 'var(--text-primary)',
                }}
                onClick={() => { cmd.action(); onClose(); }}
                onMouseEnter={() => setSelectedIndex(idx)}
              >
                <Icon size={18} strokeWidth={1.8} style={{ flexShrink: 0, opacity: 0.8 }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium" style={{ fontFamily: 'var(--font-display)' }}>
                    {cmd.label}
                  </div>
                  <div
                    className="text-xs truncate"
                    style={{
                      color: isSelected ? 'var(--text-inverse)' : 'var(--text-muted)',
                      opacity: isSelected ? 0.8 : 1,
                    }}
                  >
                    {cmd.description}
                  </div>
                </div>
                {isSelected && <ArrowRight size={14} style={{ flexShrink: 0, opacity: 0.6 }} />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div
          className="flex items-center gap-4 px-4 py-2 text-xs"
          style={{
            borderTop: '1px solid var(--border-color)',
            color: 'var(--text-muted)',
            fontFamily: 'var(--font-code)',
          }}
        >
          <span><kbd style={{ fontWeight: 600 }}>↑↓</kbd> navigate</span>
          <span><kbd style={{ fontWeight: 600 }}>↵</kbd> select</span>
          <span><kbd style={{ fontWeight: 600 }}>esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
