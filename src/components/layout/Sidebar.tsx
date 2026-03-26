import {
  LayoutDashboard, CalendarCheck, CalendarDays, GanttChart,
  BarChart3, TrendingUp, BookOpen, Settings, ChevronLeft, ChevronRight,
} from 'lucide-react';
import type { ViewId } from '../../types/routes';

interface SidebarProps {
  activeView: ViewId;
  onNavigate: (view: ViewId) => void;
  collapsed: boolean;
  onToggle: () => void;
  attendanceRate?: number;
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
};

const NAV_ITEMS: { id: ViewId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'today', label: 'Today', icon: 'calendar-check' },
  { id: 'quiz', label: 'Curriculum', icon: 'book-open' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar-days' },
  { id: 'timeline', label: 'Timeline', icon: 'gantt-chart' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
  { id: 'forecast', label: 'Forecast', icon: 'trending-up' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];

export function Sidebar({ activeView, onNavigate, collapsed, onToggle, attendanceRate }: SidebarProps) {
  const rate = attendanceRate ?? 0;
  const circumference = 2 * Math.PI * 18;
  const dashOffset = circumference - (rate / 100) * circumference;

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
        {/* Accent dot brand mark */}
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
        {NAV_ITEMS.map((item) => {
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
              {/* Active indicator bar */}
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
        })}
      </nav>

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
}
