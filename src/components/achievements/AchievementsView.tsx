import { useState, useEffect, useCallback } from 'react';
import {
  Trophy, Flame, Star, Brain, Pencil, Timer, Globe, Layers, Flag,
  Footprints, Lock, Sparkles,
} from 'lucide-react';
import { Card } from '../shared';
import { getAchievements, getXpState } from '../../lib/tauri-bridge';
import type { Achievement, XpState } from '../../types/models';

const ICON_MAP: Record<string, React.ElementType> = {
  footprints: Footprints,
  flame: Flame,
  star: Star,
  brain: Brain,
  pencil: Pencil,
  timer: Timer,
  globe: Globe,
  layers: Layers,
  flag: Flag,
  trophy: Trophy,
};

const CATEGORY_COLORS: Record<string, string> = {
  streak: 'var(--chart-5)',
  mastery: 'var(--accent-primary)',
  milestone: 'var(--accent-success)',
  special: 'var(--chart-4)',
};

export function AchievementsView() {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [xpState, setXpState] = useState<XpState | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [achs, xp] = await Promise.all([getAchievements(), getXpState()]);
    setAchievements(achs);
    setXpState(xp);
  }, []);

  useEffect(() => { load(); }, [load]);

  const unlocked = achievements.filter((a) => a.unlocked);
  const filtered = filter
    ? achievements.filter((a) => a.category === filter)
    : achievements;

  const xpProgress = xpState
    ? (xpState.total_xp / xpState.xp_to_next) * 100
    : 0;

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Achievements
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {unlocked.length}/{achievements.length} unlocked
          </p>
        </div>
        <Trophy size={28} style={{ color: 'var(--chart-4)', opacity: 0.6 }} />
      </div>

      {/* XP Bar */}
      {xpState && (
        <Card className="flex flex-col gap-3" glow>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, var(--accent-primary), var(--chart-4))`,
                }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: 'var(--text-inverse)', fontFamily: 'var(--font-code)' }}
                >
                  {xpState.level}
                </span>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                  Level {xpState.level}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                  {xpState.total_xp} / {xpState.xp_to_next} XP
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Flame size={14} style={{ color: 'var(--chart-5)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                    {xpState.current_streak}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>streak</div>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1">
                  <Star size={14} style={{ color: 'var(--chart-4)' }} />
                  <span className="text-sm font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                    {xpState.longest_streak}
                  </span>
                </div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>best</div>
              </div>
            </div>
          </div>

          {/* XP progress bar */}
          <div
            className="h-2 overflow-hidden"
            style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}
          >
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${xpProgress}%`,
                background: 'linear-gradient(90deg, var(--accent-primary), var(--chart-4))',
                borderRadius: 'var(--border-radius)',
              }}
            />
          </div>
        </Card>
      )}

      {/* Category filters */}
      <div className="flex gap-2">
        <FilterButton label="All" active={!filter} onClick={() => setFilter(null)} color="var(--text-primary)" />
        <FilterButton label="Streak" active={filter === 'streak'} onClick={() => setFilter('streak')} color={CATEGORY_COLORS.streak} />
        <FilterButton label="Mastery" active={filter === 'mastery'} onClick={() => setFilter('mastery')} color={CATEGORY_COLORS.mastery} />
        <FilterButton label="Milestone" active={filter === 'milestone'} onClick={() => setFilter('milestone')} color={CATEGORY_COLORS.milestone} />
        <FilterButton label="Special" active={filter === 'special'} onClick={() => setFilter('special')} color={CATEGORY_COLORS.special} />
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {filtered.map((ach) => {
          const Icon = ICON_MAP[ach.icon] ?? Trophy;
          const catColor = CATEGORY_COLORS[ach.category] ?? 'var(--text-muted)';
          return (
            <Card
              key={ach.id}
              className={`flex items-start gap-3 transition-all duration-200 ${ach.unlocked ? '' : 'opacity-60'}`}
              style={{
                borderLeft: `3px solid ${ach.unlocked ? catColor : 'var(--border-color)'}`,
              }}
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{
                  background: ach.unlocked ? catColor + '22' : 'var(--bg-tertiary)',
                }}
              >
                {ach.unlocked ? (
                  <Icon size={20} style={{ color: catColor }} />
                ) : (
                  <Lock size={16} style={{ color: 'var(--text-muted)' }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="text-sm font-semibold"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}
                  >
                    {ach.title}
                  </span>
                  {ach.unlocked && (
                    <Sparkles size={12} style={{ color: catColor }} />
                  )}
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {ach.description}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className="text-xs font-medium"
                    style={{ color: catColor, fontFamily: 'var(--font-code)' }}
                  >
                    +{ach.xp} XP
                  </span>
                  {!ach.unlocked && ach.target > 1 && (
                    <div className="flex items-center gap-2">
                      <div
                        className="h-1 w-16 overflow-hidden"
                        style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${Math.min(100, (ach.progress / ach.target) * 100)}%`,
                            background: catColor,
                            borderRadius: 'var(--border-radius)',
                          }}
                        />
                      </div>
                      <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                        {ach.progress}/{ach.target}
                      </span>
                    </div>
                  )}
                  {ach.unlocked && ach.unlocked_at && (
                    <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                      {new Date(ach.unlocked_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterButton({ label, active, onClick, color }: { label: string; active: boolean; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 text-xs font-medium border-none cursor-pointer transition-all duration-150"
      style={{
        background: active ? color + '22' : 'var(--bg-surface)',
        color: active ? color : 'var(--text-muted)',
        borderRadius: 'var(--border-radius)',
        border: `1px solid ${active ? color : 'var(--border-color)'}`,
      }}
    >
      {label}
    </button>
  );
}
