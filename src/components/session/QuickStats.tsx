import { Flame, Target, TrendingUp, Zap } from 'lucide-react';
import { Card } from '../shared';

interface QuickStatsProps {
  streak: number;
  weekProgress: number; // 0-100
  masteryDelta: number;
  energyAvg: number; // 1-5
}

export function QuickStats({ streak, weekProgress, masteryDelta, energyAvg }: QuickStatsProps) {
  const stats = [
    {
      icon: Flame,
      label: 'Streak',
      value: `${streak}d`,
      color: 'var(--accent-warning)',
    },
    {
      icon: Target,
      label: 'Week',
      value: `${Math.round(weekProgress)}%`,
      color: 'var(--accent-primary)',
    },
    {
      icon: TrendingUp,
      label: 'Mastery',
      value: `${masteryDelta >= 0 ? '+' : ''}${masteryDelta.toFixed(1)}%`,
      color: masteryDelta >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
    },
    {
      icon: Zap,
      label: 'Energy',
      value: `${energyAvg.toFixed(1)}`,
      color: 'var(--accent-info)',
    },
  ];

  return (
    <Card>
      <h3
        className="text-xs font-semibold mb-3 uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
      >
        Quick Stats
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => (
          <div
            key={stat.label}
            className="flex items-center gap-2.5 animate-pop"
            style={{ animationDelay: `${i * 80}ms` }}
          >
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg"
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <stat.icon size={15} style={{ color: stat.color }} />
            </div>
            <div>
              <div
                className="text-base font-bold tabular-nums"
                data-value
                style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)', lineHeight: 1.2 }}
              >
                {stat.value}
              </div>
              <div
                className="text-xs"
                style={{ color: 'var(--text-muted)', lineHeight: 1.2 }}
              >
                {stat.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
