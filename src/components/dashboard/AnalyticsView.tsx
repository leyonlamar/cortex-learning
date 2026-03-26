import { useEffect, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { KPICard } from './KPICard';
import { BurnoutIndicator } from './BurnoutIndicator';
import { SuccessCriteriaCard } from './SuccessCriteriaCard';
import { Card, Spinner } from '../shared';
import { useCalendar } from '../../hooks/useCalendar';
import { useIntelligence } from '../../hooks/useIntelligence';
import type { WeekWithSessions } from '../../types/models';

interface WeekChartPoint {
  week: string;
  hours: number;
  cumHours: number;
  quizScore: number | null;
  attendance: number;
}

function buildChartData(weeks: WeekWithSessions[]): WeekChartPoint[] {
  let cumHours = 0;
  return weeks.map((ws) => {
    const h = ws.aggregate?.total_hours ?? 0;
    cumHours += h;
    return {
      week: ws.week.id,
      hours: Math.round(h * 10) / 10,
      cumHours: Math.round(cumHours * 10) / 10,
      quizScore: ws.aggregate?.quiz_score ?? null,
      attendance: (ws.aggregate?.attendance_rate ?? 0) * 100,
    };
  });
}

export function AnalyticsView() {
  const { calendar, loading, loadCalendar } = useCalendar();
  const { fetchForecast, forecastResult, fetchAlerts, alerts } = useIntelligence();
  const [chartData, setChartData] = useState<WeekChartPoint[]>([]);

  useEffect(() => {
    loadCalendar();
    fetchAlerts();
  }, [loadCalendar, fetchAlerts]);

  useEffect(() => {
    if (!calendar || !Array.isArray(calendar.weeks)) return;
    const data = buildChartData(calendar.weeks);
    setChartData(data);

    // Run forecast with current stats
    const weeksTotal = calendar.weeks.length;
    const completedWeeks = data.filter((d) => d.hours > 0).length;
    const weeksRemaining = Math.max(1, weeksTotal - completedWeeks);
    const quizScores = data.filter((d) => d.quizScore !== null).map((d) => d.quizScore!);
    const quizAvg = quizScores.length > 0 ? quizScores.reduce((a, b) => a + b, 0) / quizScores.length : 50;
    fetchForecast(calendar.attendance_rate, quizAvg, weeksRemaining);
  }, [calendar, fetchForecast]);

  if (loading && !calendar) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size={24} />
      </div>
    );
  }

  const totalHours = chartData.length > 0 ? chartData[chartData.length - 1].cumHours : 0;
  const quizScores = chartData.filter((d) => d.quizScore !== null).map((d) => d.quizScore!);
  const quizAvg = quizScores.length > 0 ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length) : 0;
  const attendanceRate = calendar ? Math.round(calendar.attendance_rate * 100) : 0;
  const completedSessions = calendar?.completed_sessions ?? 0;
  const totalSessions = calendar?.total_sessions ?? 1;
  const forecastConfidence = forecastResult ? Math.round(forecastResult[2] * 100) : 0;

  // Spark data: last 8 weeks of hours
  const recentHours = chartData.slice(-8).map((d) => d.hours);
  const recentQuiz = chartData.slice(-8).map((d) => d.quizScore ?? 0);
  const recentAttendance = chartData.slice(-8).map((d) => d.attendance);

  // Burnout severity from behavioral engine alerts
  const burnoutAlerts = alerts.filter(
    (a) => a.alert_type.toLowerCase().includes('burnout') ||
           a.severity === 'warning' ||
           a.severity === 'critical',
  );
  const hasCritical = burnoutAlerts.some((a) => a.severity === 'critical');
  const burnoutSeverity = Math.min(5, hasCritical ? 5 : burnoutAlerts.length > 0 ? Math.min(4, burnoutAlerts.length * 2) : 0);

  // Success criteria
  const criteria = [
    { label: 'Attendance Rate', current: `${attendanceRate}%`, target: '≥90%', met: attendanceRate >= 90 ? true : attendanceRate > 0 ? false : null },
    { label: 'Quiz Average', current: `${quizAvg}%`, target: '≥80%', met: quizAvg >= 80 ? true : quizAvg > 0 ? false : null },
    { label: 'Hours Logged', current: `${Math.round(totalHours)}h`, target: '430h', met: totalHours >= 430 ? true : totalHours > 0 ? false : null },
    { label: 'Sessions Done', current: `${completedSessions}`, target: `${totalSessions}`, met: completedSessions >= totalSessions ? true : completedSessions > 0 ? false : null },
    { label: 'Forecast Confidence', current: `${forecastConfidence}%`, target: '≥75%', met: forecastConfidence >= 75 ? true : forecastConfidence > 0 ? false : null },
  ];

  const tooltipStyle = {
    contentStyle: { background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius)', fontSize: '12px' },
    labelStyle: { color: 'var(--text-primary)' },
  };

  return (
    <div className="flex flex-col gap-4">
      <h2
        className="text-xl font-bold"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
      >
        Analytics
      </h2>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KPICard label="Total Hours" value={`${Math.round(totalHours)}h`} delta={null} deltaPositive sparkData={recentHours} />
        <KPICard label="Quiz Avg" value={`${quizAvg}%`} delta={null} deltaPositive sparkData={recentQuiz} />
        <KPICard label="Attendance" value={`${attendanceRate}%`} delta={null} deltaPositive sparkData={recentAttendance} />
        <BurnoutIndicator severity={burnoutSeverity} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Card>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Cumulative Hours
          </h3>
          <div className="h-36">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip {...tooltipStyle} />
                  <Area type="monotone" dataKey="cumHours" stroke="var(--accent-primary)" fill="var(--accent-primary)" fillOpacity={0.15} name="Hours" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
                Complete sessions to see data
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Quiz Scores
          </h3>
          <div className="h-36">
            {quizScores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.filter((d) => d.quizScore !== null)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="quizScore" stroke="var(--accent-secondary)" strokeWidth={2} dot={{ r: 3 }} name="Score %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
                Complete quizzes to see data
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Weekly Hours
          </h3>
          <div className="h-36">
            {chartData.some((d) => d.hours > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="hours" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
                Complete sessions to see data
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h3
            className="text-sm font-semibold mb-3"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Attendance Trend
          </h3>
          <div className="h-36">
            {chartData.some((d) => d.attendance > 0) ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <Tooltip {...tooltipStyle} />
                  <Line type="monotone" dataKey="attendance" stroke="var(--accent-success)" strokeWidth={2} dot={{ r: 3 }} name="Attendance %" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
                Complete sessions to see data
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Success Criteria */}
      <div className="mt-1">
        <SuccessCriteriaCard criteria={criteria} />
      </div>
    </div>
  );
}
