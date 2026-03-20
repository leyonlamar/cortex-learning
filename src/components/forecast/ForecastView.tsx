import { useEffect, useState } from 'react';
import { CompletionGauge } from './CompletionGauge';
import { DistributionChart } from './DistributionChart';
import { ScenarioPanel } from './ScenarioPanel';
import { Card, Spinner } from '../shared';
import { useIntelligence } from '../../hooks/useIntelligence';
import { useCalendar } from '../../hooks/useCalendar';

export function ForecastView() {
  const { forecastResult, loading: forecastLoading, fetchForecast } = useIntelligence();
  const { calendar, loadCalendar } = useCalendar();
  const [weeksRemaining, setWeeksRemaining] = useState(43);

  useEffect(() => {
    loadCalendar();
  }, [loadCalendar]);

  useEffect(() => {
    if (!calendar) return;
    const completed = calendar.weeks.filter(
      (ws) => ws.aggregate && ws.aggregate.total_hours && ws.aggregate.total_hours > 0,
    ).length;
    const remaining = Math.max(1, calendar.weeks.length - completed);
    setWeeksRemaining(remaining);
  }, [calendar]);

  const handleRun = (scenario: { attendanceRate: number; quizAvg: number }) => {
    fetchForecast(scenario.attendanceRate / 100, scenario.quizAvg, weeksRemaining);
  };

  // forecastResult is [medianAttendance, medianQuiz, completionConfidence]
  const confidence = forecastResult ? Math.round(forecastResult[2] * 100) : 0;
  const p10 = forecastResult ? Math.max(0, confidence - 15) : 0;
  const p50 = confidence;
  const p90 = forecastResult ? Math.min(100, confidence + 12) : 0;

  return (
    <div className="flex flex-col gap-6">
      <h2
        className="text-xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Forecast
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main column */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Gauge */}
          <Card className="flex justify-center py-6">
            <CompletionGauge probability={p50 / 100} />
          </Card>

          {/* Distributions */}
          <DistributionChart p10={p10} p50={p50} p90={p90} label="Completion Probability" />

          {/* Summary stats */}
          <Card>
            <h3
              className="text-sm font-semibold mb-3"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
            >
              Forecast Summary
            </h3>
            {forecastResult ? (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Attendance Proj.</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                    {Math.round(forecastResult[0] * 100)}%
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Quiz Avg Proj.</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                    {Math.round(forecastResult[1])}%
                  </div>
                </div>
                <div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Weeks Left</div>
                  <div className="text-lg font-bold" style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}>
                    {weeksRemaining}
                  </div>
                </div>
              </div>
            ) : (
              <div
                className="h-16 flex items-center justify-center text-sm"
                style={{ color: 'var(--text-muted)' }}
              >
                {forecastLoading ? <Spinner size={20} /> : 'Run a scenario to see projections'}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-4">
          <ScenarioPanel onRun={handleRun} loading={forecastLoading} />
        </div>
      </div>
    </div>
  );
}
