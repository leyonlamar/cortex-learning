export type ViewId = 'dashboard' | 'today' | 'weekly' | 'timeline' | 'analytics' | 'forecast' | 'quiz' | 'settings';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard' },
  { id: 'today', label: 'Today', icon: 'calendar-check' },
  { id: 'quiz', label: 'Curriculum', icon: 'book-open' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar-days' },
  { id: 'timeline', label: 'Timeline', icon: 'gantt-chart' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3' },
  { id: 'forecast', label: 'Forecast', icon: 'trending-up' },
  { id: 'settings', label: 'Settings', icon: 'settings' },
];
