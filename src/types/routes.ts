export type ViewId =
  | 'dashboard' | 'today' | 'weekly' | 'timeline'
  | 'analytics' | 'forecast' | 'quiz' | 'settings'
  | 'notes' | 'flashcards' | 'focus' | 'achievements';

export interface NavItem {
  id: ViewId;
  label: string;
  icon: string;
  section?: 'main' | 'tools' | 'system';
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'layout-dashboard', section: 'main' },
  { id: 'today', label: 'Today', icon: 'calendar-check', section: 'main' },
  { id: 'quiz', label: 'Curriculum', icon: 'book-open', section: 'main' },
  { id: 'flashcards', label: 'Flashcards', icon: 'layers', section: 'main' },
  { id: 'weekly', label: 'Weekly', icon: 'calendar-days', section: 'main' },
  { id: 'timeline', label: 'Timeline', icon: 'gantt-chart', section: 'main' },
  { id: 'analytics', label: 'Analytics', icon: 'bar-chart-3', section: 'main' },
  { id: 'forecast', label: 'Forecast', icon: 'trending-up', section: 'main' },
  { id: 'notes', label: 'Notes', icon: 'notebook-pen', section: 'tools' },
  { id: 'focus', label: 'Focus', icon: 'timer', section: 'tools' },
  { id: 'achievements', label: 'Achievements', icon: 'trophy', section: 'tools' },
  { id: 'settings', label: 'Settings', icon: 'settings', section: 'system' },
];
