import {
  LayoutDashboard, CalendarCheck, CalendarDays, GanttChart,
  BarChart3, TrendingUp, BookOpen, Settings, ChevronLeft, ChevronRight,
  NotebookPen, Timer, Trophy, Layers, Search,
} from 'lucide-react';
import type { ViewId } from '../../types/routes';
import { NAV_ITEMS } from '../../types/routes';
import type { XpState } from '../../types/models';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  collapsed: boolean;
  onToggle: () => void;
  attendanceRate?: number;
  xpState?: XpState | null;
  onOpenCommandPalette?: () => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  'layout-dashboard': LayoutDashboard,
  'calendar-check': CalendarCheck,
  'calendar-days': CalendarDays,
  'gantt-chart': GanttChart,
  'bar-chart-3': BarChart3,
  'trending-up': TrendingUp,
  'book-open': BookOpen,
  'settings': Settings,
  'notebook-pen': NotebookPen,
  'timer': Timer,
  'trophy': Trophy,
  'layers': Layers,
};

export function Sidebar({ activeView, onNavigate, collapsed, onToggle, attendanceRate, xpState, onOpenCommandPalette }: SidebarProps) {
  const rate = attendanceRate ?? 0;
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference - (rate / 100) * circumference;

  const items = NAV_ITEMS ?? [];
  const mainItems = items.filter((i) => i.section === 'main');
  const toolItems = items.filter((i) => i.section === 'tools');
  const systemItems = items.filter((i) => i.section === 'system');

  return (
    <aside
      className="flex flex-col h-screen shrink-0 transition-all duration-300 animate-slide-left"
      style={{
        width: collapsed ? '56px' : 'var(--sidebar-width)',
        background: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-color)',
      }}
    >
      {/* Logo / App Name */}
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{ height: 'var(--header-height)' }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: 'var(--accent-primary)' }}
        />
        {!collapsed && (
          <span
            className="text-sm font-bold truncate tracking-tight"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Cortex
          </span>
        )}
      </div>

      {/* Quick Search Button */}
      {onOpenCommandPalette && (
        <div className="px-2 mb-1">
          <button
            onClick={onOpenCommandPalette}
            className={`flex items-center gap-2 w-full px-3 py-2 text-xs border-none cursor-pointer transition-colors duration-150 ${collapsed ? 'justify-center' : ''}`}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
              borderRadius: 'var(--border-radius)',
              fontFamily: 'var(--font-code)',
            }}
            title={collapsed ? 'Search (Ctrl+K)' : undefined}
          >
            <Search size={14} />
            {!collapsed && (
              <>
                <span className="flex-1 text-left">Search...</span>
                <kbd
                  className="text-xs px-1 py-0.5"
                  style={{
                    background: 'var(--bg-secondary)',
                    borderRadius: '3px',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.6rem',
                  }}
                >
                  ⌘K
                </kbd>
              </>
            )}
          </button>
        </div>
      )}

      {/* Progress Ring */}
      <div className="flex justify-center py-3">
        <svg width="44" height="44" viewBox="0 0 44 44" className="animate-scale-in">
          <circle
            cx="22" cy="22" r="18"
            fill="none"
            stroke="var(--border-color)"
            strokeWidth="3"
            opacity="0.5"
          />
          <circle
            cx="22" cy="22" r="18"
            fill="none"
            stroke="var(--accent-primary)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform="rotate(-90 22 22)"
            style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
          />
          {!collapsed && (
            <text
              x="22" y="22"
              textAnchor="middle"
              dominantBaseline="central"
              fill="var(--text-primary)"
              fontSize="10"
              fontWeight="600"
              fontFamily="var(--font-code)"
            >
              {Math.round(rate)}%
            </text>
          )}
        </svg>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-0.5 px-2 overflow-y-auto">
        {/* Main section */}
        {renderNavSection(mainItems, null)}

        {/* Tools section */}
        {!collapsed && (
          <div
            className="text-xs font-medium mt-3 mb-1 px-3"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.6rem', letterSpacing: '0.08em', textTransform: 'uppercase' }}
          >
            Tools
          </div>
        )}
        {collapsed && <div className="my-2" style={{ borderTop: '1px solid var(--border-color)' }} />}
        {renderNavSection(toolItems, null)}

        {/* Spacer */}
        <div className="flex-1" />

        {/* System section */}
        {renderNavSection(systemItems, null)}
      </nav>

      {/* XP indicator */}
      {xpState && (
        <div className="px-2 py-2">
          <button
            onClick={() => onNavigate('achievements')}
            className={`flex items-center gap-2 w-full px-3 py-2 border-none cursor-pointer transition-colors duration-150 ${collapsed ? 'justify-center' : ''}`}
            style={{
              background: 'var(--bg-tertiary)',
              borderRadius: 'var(--border-radius)',
            }}
            title={collapsed ? `Level ${xpState.level}` : undefined}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, var(--accent-primary), var(--chart-4))',
                fontSize: '0.6rem',
                fontWeight: 700,
                color: 'var(--text-inverse)',
                fontFamily: 'var(--font-code)',
              }}
            >
              {xpState.level}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                    Level {xpState.level}
                  </span>
                  <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)', fontSize: '0.6rem' }}>
                    {xpState.total_xp}/{xpState.xp_to_next}
                  </span>
                </div>
                <div
                  className="h-1 mt-1 overflow-hidden"
                  style={{ background: 'var(--bg-secondary)', borderRadius: '2px' }}
                >
                  <div
                    className="h-full"
                    style={{
                      width: `${(xpState.total_xp / xpState.xp_to_next) * 100}%`,
                      background: 'linear-gradient(90deg, var(--accent-primary), var(--chart-4))',
                      borderRadius: '2px',
                      transition: 'width 0.5s ease',
                    }}
                  />
                </div>
              </div>
            )}
          </button>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="flex items-center justify-center py-3 cursor-pointer border-none bg-transparent transition-colors duration-150"
        style={{ color: 'var(--text-muted)' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>
    </aside>
  );

  function renderNavSection(items: typeof NAV_ITEMS, _label: string | null) {
    return items.map((item) => {
      const Icon = ICON_MAP[item.icon];
      const isActive = activeView === item.id;
      return (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`group relative flex items-center gap-3 w-full px-3 py-2.5 text-sm cursor-pointer border-none transition-all duration-150 ${collapsed ? 'justify-center' : ''}`}
          style={{
            background: isActive ? 'var(--accent-primary)' : 'transparent',
            color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
            borderRadius: 'var(--border-radius)',
            fontFamily: 'var(--font-body)',
            fontWeight: isActive ? 600 : 400,
          }}
          title={collapsed ? item.label : undefined}
        >
          {isActive && (
            <div
              className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-r-full nav-active-indicator"
              style={{
                height: '60%',
                background: 'var(--text-inverse)',
                opacity: 0.6,
              }}
            />
          )}
          {Icon && <Icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />}
          {!collapsed && <span className="truncate">{item.label}</span>}
        </button>
      );
    });
  }
}
