import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Zap, CheckCircle2 } from 'lucide-react';
import { Card, Button } from '../shared';
import { saveFocusSession, listFocusSessions, awardXp } from '../../lib/tauri-bridge';
import type { TimerMode, FocusSession } from '../../types/models';

const MODE_CONFIG: Record<TimerMode, { label: string; minutes: number; color: string; icon: React.ElementType }> = {
  work: { label: 'Focus', minutes: 25, color: 'var(--accent-primary)', icon: Brain },
  short_break: { label: 'Short Break', minutes: 5, color: 'var(--accent-success)', icon: Coffee },
  long_break: { label: 'Long Break', minutes: 15, color: 'var(--chart-4)', icon: Zap },
};

export function FocusView() {
  const [mode, setMode] = useState<TimerMode>('work');
  const [secondsLeft, setSecondsLeft] = useState(MODE_CONFIG.work.minutes * 60);
  const [running, setRunning] = useState(false);
  const [completedToday, setCompletedToday] = useState(0);
  const [sessions, setSessions] = useState<FocusSession[]>([]);
  const [startTime, setStartTime] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const config = MODE_CONFIG[mode];
  const totalSeconds = config.minutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const loadSessions = useCallback(async () => {
    const all = await listFocusSessions();
    setSessions(all);
    const today = new Date().toISOString().slice(0, 10);
    setCompletedToday(all.filter((s) => s.completed && s.started_at.startsWith(today) && s.mode === 'work').length);
  }, []);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  useEffect(() => {
    if (running && secondsLeft > 0) {
      intervalRef.current = setInterval(() => {
        setSecondsLeft((s) => {
          if (s <= 1) {
            clearInterval(intervalRef.current!);
            handleComplete();
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleComplete = async () => {
    setRunning(false);
    // Play a notification sound via Web Audio API
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = 800;
      gain.gain.value = 0.1;
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } catch { /* audio not available */ }

    if (startTime) {
      await saveFocusSession({
        started_at: startTime,
        completed_at: new Date().toISOString(),
        mode,
        duration_min: config.minutes,
        completed: true,
        domain_slug: null,
      });
      if (mode === 'work') {
        await awardXp(25);
      }
      setStartTime(null);
      await loadSessions();
    }

    // Auto-advance mode
    if (mode === 'work') {
      const nextCompleted = completedToday + 1;
      if (nextCompleted % 4 === 0) {
        switchMode('long_break');
      } else {
        switchMode('short_break');
      }
    } else {
      switchMode('work');
    }
  };

  const switchMode = (newMode: TimerMode) => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setMode(newMode);
    setSecondsLeft(MODE_CONFIG[newMode].minutes * 60);
    setStartTime(null);
  };

  const handleStart = () => {
    setRunning(true);
    if (!startTime) setStartTime(new Date().toISOString());
  };

  const handlePause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const handleReset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setSecondsLeft(totalSeconds);
    setStartTime(null);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;

  // Stats
  const todaySessions = sessions.filter((s) => s.started_at.startsWith(new Date().toISOString().slice(0, 10)));
  const todayMinutes = todaySessions.filter((s) => s.completed && s.mode === 'work').reduce((sum, s) => sum + s.duration_min, 0);
  const totalFocusHours = sessions.filter((s) => s.completed && s.mode === 'work').reduce((sum, s) => sum + s.duration_min, 0) / 60;

  // SVG arc params
  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto">
      <h2
        className="text-xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Focus Timer
      </h2>

      {/* Mode tabs */}
      <div className="flex gap-2">
        {(Object.keys(MODE_CONFIG) as TimerMode[]).map((m) => {
          const mc = MODE_CONFIG[m];
          const Icon = mc.icon;
          const isActive = mode === m;
          return (
            <button
              key={m}
              onClick={() => switchMode(m)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium border-none cursor-pointer transition-all duration-150"
              style={{
                background: isActive ? config.color : 'var(--bg-surface)',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
                borderRadius: 'var(--border-radius)',
                border: isActive ? 'none' : '1px solid var(--border-color)',
              }}
            >
              <Icon size={16} />
              {mc.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Timer circle */}
        <div className="lg:col-span-2 flex flex-col items-center gap-6">
          <Card className="flex flex-col items-center py-10 w-full">
            <div className="relative">
              <svg width="280" height="280" viewBox="0 0 280 280">
                {/* Background circle */}
                <circle
                  cx="140" cy="140" r={radius}
                  fill="none"
                  stroke="var(--bg-tertiary)"
                  strokeWidth="8"
                />
                {/* Progress arc */}
                <circle
                  cx="140" cy="140" r={radius}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 140 140)"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
                {/* Time display */}
                <text
                  x="140" y="130"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-primary)"
                  fontSize="48"
                  fontFamily="var(--font-code)"
                  fontWeight="bold"
                >
                  {String(minutes).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                </text>
                <text
                  x="140" y="165"
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--text-muted)"
                  fontSize="14"
                  fontFamily="var(--font-body)"
                >
                  {config.label}
                </text>
              </svg>
              {/* Animated pulse when running */}
              {running && (
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
                  style={{
                    width: `${radius * 2 + 20}px`,
                    height: `${radius * 2 + 20}px`,
                    border: `2px solid ${config.color}`,
                    opacity: 0.3,
                    animation: 'pulse 2s ease-in-out infinite',
                  }}
                />
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 mt-6">
              {!running ? (
                <Button onClick={handleStart} style={{ background: config.color }}>
                  <Play size={18} /> Start
                </Button>
              ) : (
                <Button onClick={handlePause} variant="secondary">
                  <Pause size={18} /> Pause
                </Button>
              )}
              <Button onClick={handleReset} variant="ghost">
                <RotateCcw size={16} /> Reset
              </Button>
            </div>

            {/* Pomodoro dots */}
            <div className="flex items-center gap-2 mt-4">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    background: i < (completedToday % 4) ? config.color : 'var(--bg-tertiary)',
                    border: `2px solid ${i < (completedToday % 4) ? config.color : 'var(--border-color)'}`,
                  }}
                />
              ))}
              <span className="text-xs ml-2" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                {completedToday % 4}/4 until long break
              </span>
            </div>
          </Card>
        </div>

        {/* Stats sidebar */}
        <div className="flex flex-col gap-4">
          <Card>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Today's Stats
            </h3>
            <div className="flex flex-col gap-3">
              <StatRow icon={CheckCircle2} label="Sessions" value={`${completedToday}`} color="var(--accent-success)" />
              <StatRow icon={Brain} label="Focus time" value={`${todayMinutes}m`} color="var(--accent-primary)" />
              <StatRow icon={Zap} label="All time" value={`${totalFocusHours.toFixed(1)}h`} color="var(--chart-4)" />
            </div>
          </Card>

          <Card>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Recent Sessions
            </h3>
            <div className="flex flex-col gap-2">
              {sessions.slice(0, 5).map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between text-xs py-1"
                  style={{ borderBottom: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: s.completed
                          ? MODE_CONFIG[s.mode]?.color ?? 'var(--accent-primary)'
                          : 'var(--text-muted)',
                      }}
                    />
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {MODE_CONFIG[s.mode]?.label ?? s.mode}
                    </span>
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                    {s.duration_min}m
                  </span>
                </div>
              ))}
              {sessions.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No sessions yet</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatRow({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
      </div>
      <span
        className="text-sm font-semibold"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}
      >
        {value}
      </span>
    </div>
  );
}
