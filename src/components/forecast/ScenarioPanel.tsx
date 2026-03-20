import { useState } from 'react';
import { Card, Button } from '../shared';

interface Scenario {
  name: string;
  attendanceRate: number;
  quizAvg: number;
}

const PRESETS: Scenario[] = [
  { name: 'Current Pace', attendanceRate: 80, quizAvg: 75 },
  { name: 'Perfect Attendance', attendanceRate: 100, quizAvg: 80 },
  { name: 'Minimal Effort', attendanceRate: 60, quizAvg: 65 },
  { name: 'Recovery Mode', attendanceRate: 90, quizAvg: 70 },
];

interface ScenarioPanelProps {
  onRun: (scenario: Scenario) => void;
  loading?: boolean;
}

export function ScenarioPanel({ onRun, loading }: ScenarioPanelProps) {
  const [selected, setSelected] = useState<string>('Current Pace');

  return (
    <Card>
      <h3
        className="text-sm font-semibold mb-3"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Scenario Analysis
      </h3>
      <div className="flex flex-col gap-2 mb-4">
        {PRESETS.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelected(s.name)}
            className="flex items-center justify-between px-3 py-2 text-sm cursor-pointer border-none text-left"
            style={{
              background: selected === s.name ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
              color: selected === s.name ? 'var(--text-inverse)' : 'var(--text-primary)',
              borderRadius: 'var(--border-radius)',
            }}
          >
            <span>{s.name}</span>
            <span style={{ fontFamily: 'var(--font-code)', opacity: 0.8 }}>
              {s.attendanceRate}% / {s.quizAvg}%
            </span>
          </button>
        ))}
      </div>
      <Button
        size="sm"
        onClick={() => {
          const scenario = PRESETS.find((s) => s.name === selected) ?? PRESETS[0];
          onRun(scenario);
        }}
        disabled={loading}
        className="w-full"
      >
        {loading ? 'Running...' : 'Run Forecast'}
      </Button>
    </Card>
  );
}
