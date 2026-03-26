import { useEffect, useState, useCallback } from 'react';
import { Settings, ChevronsDown, ChevronsUp, Download, FileSpreadsheet } from 'lucide-react';
import { useCalendar } from '../../hooks/useCalendar';
import { useCurriculum } from '../../hooks/useCurriculum';
import { useIntelligence } from '../../hooks/useIntelligence';
import { useToast } from '../../hooks/useToast';
import { getReviewStats, exportJson, exportCsvToFile } from '../../lib/tauri-bridge';
import type { SpacedRepState, Domain, Topic } from '../../types/models';

import { ProgressBar } from './ProgressBar';
import { StatsBar } from './StatsBar';
import { ReferenceSection } from './ReferenceSection';
import { WeekBlock } from './WeekBlock';
import { Spinner } from '../shared';

interface TrackerPageProps {
  onOpenSettings: () => void;
}

export function TrackerPage({ onOpenSettings }: TrackerPageProps) {
  const { calendar, loading: calLoading, loadCalendar } = useCalendar();
  const { domains, topicsByDomain, loadDomains, loadTopics } = useCurriculum();
  const { forecastResult, alerts, fetchForecast, fetchAlerts } = useIntelligence();
  const { showToast } = useToast();

  const [reviewItems, setReviewItems] = useState<SpacedRepState[]>([]);
  const [allExpanded, setAllExpanded] = useState(false);
  const [allCollapsed, setAllCollapsed] = useState(false);
  // Toggling expand/collapse: use a key to force re-render of WeekBlocks
  const [expandKey, setExpandKey] = useState(0);

  // Initial data load
  useEffect(() => {
    loadCalendar();
    loadDomains();
    fetchAlerts();

    getReviewStats()
      .then((items) => {
        // Sort by recall probability ascending (most urgent first)
        items.sort((a, b) => a.recall_probability - b.recall_probability);
        setReviewItems(items);
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Load topics for each domain
  useEffect(() => {
    domains.forEach((d) => {
      if (!topicsByDomain[d.id]) {
        loadTopics(d.id);
      }
    });
  }, [domains]); // eslint-disable-line react-hooks/exhaustive-deps

  // Run forecast once we have calendar data
  useEffect(() => {
    if (!calendar || !Array.isArray(calendar.weeks)) return;
    const completedWeeks = calendar.weeks.filter((w) => {
      const completed = w.sessions.filter((s) => s.status === 'completed').length;
      return completed === w.sessions.length && w.sessions.length > 0;
    }).length;
    const weeksRemaining = Math.max(1, 43 - completedWeeks);
    const quizAvg = 70; // reasonable default
    fetchForecast(calendar.attendance_rate, quizAvg, weeksRemaining);
  }, [calendar]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRefresh = useCallback(() => {
    loadCalendar();
  }, [loadCalendar]);

  const handleExpandAll = () => {
    setAllExpanded(true);
    setAllCollapsed(false);
    setExpandKey((k) => k + 1);
  };

  const handleCollapseAll = () => {
    setAllCollapsed(true);
    setAllExpanded(false);
    setExpandKey((k) => k + 1);
  };

  const handleExportJson = async () => {
    try {
      const json = await exportJson();
      await navigator.clipboard.writeText(json);
      showToast('JSON exported to clipboard', 'success');
    } catch (err) {
      showToast(`Export failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  const handleExportCsv = async () => {
    try {
      const ts = new Date().toISOString().slice(0, 10);
      const outDir = await exportCsvToFile(`~desktop/learning-os-export-${ts}`);
      showToast(`CSV saved to: ${outDir}`, 'success');
    } catch (err) {
      showToast(`CSV export failed: ${err instanceof Error ? err.message : String(err)}`, 'error');
    }
  };

  // Compute aggregate stats
  const completedSessions = calendar?.completed_sessions ?? 0;
  const totalSessions = calendar?.total_sessions ?? 0;
  const totalHours = calendar
    ? calendar.weeks.reduce((sum, w) => sum + (w.aggregate?.total_hours ?? 0), 0)
    : 0;
  // Mastery: use attendance rate as a proxy (real mastery requires per-topic fetch)
  const masteryPct = calendar ? Math.round(calendar.attendance_rate * 100) : 0;

  const forecastPct = forecastResult ? Math.round(forecastResult[0] * 100) : null;

  if (calLoading && !calendar) {
    return (
      <div className="tracker-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <div className="tracker-page">
      {/* ── Sticky Header ───────────────────────────────────────────── */}
      <div className="tk-header">
        <div className="tk-header-top">
          <div>
            <h1 className="tk-header-title">Cortex</h1>
            <p className="tk-header-subtitle">
              {completedSessions}/{totalSessions} sessions &middot; {totalHours.toFixed(1)}h invested
            </p>
          </div>
          <div className="tk-header-actions">
            <button className="tk-btn" onClick={handleExpandAll} title="Expand All">
              <ChevronsDown size={14} />
              Expand All
            </button>
            <button className="tk-btn" onClick={handleCollapseAll} title="Collapse All">
              <ChevronsUp size={14} />
              Collapse All
            </button>
            <button
              className="tk-btn tk-btn-icon"
              onClick={onOpenSettings}
              title="Settings"
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
        <ProgressBar completed={completedSessions} total={totalSessions} />
      </div>

      {/* ── Stats Bar ───────────────────────────────────────────────── */}
      <StatsBar
        sessionsCompleted={completedSessions}
        totalHours={totalHours}
        currentMastery={masteryPct}
      />

      {/* ── Reference Sections ──────────────────────────────────────── */}
      <div className="tk-section">
        <h2 className="tk-section-title">Reference</h2>

        <ReferenceSection
          title="Curriculum Overview"
          badge={`${domains.length} domains`}
        >
          <div className="tk-domain-list">
            {domains.map((d: Domain) => {
              const topics: Topic[] = topicsByDomain[d.id] ?? [];
              return (
                <div key={d.id} className="tk-domain-item">
                  <div className="tk-domain-dot" style={{ background: d.color || 'var(--tk-cyan)' }} />
                  <span className="tk-domain-name">{d.name}</span>
                  <span className="tk-domain-count">
                    {topics.length} topic{topics.length !== 1 ? 's' : ''}
                  </span>
                </div>
              );
            })}
            {domains.length === 0 && (
              <p style={{ color: 'var(--tk-text-muted)', fontSize: '0.8rem' }}>
                No curriculum data loaded yet.
              </p>
            )}
          </div>
        </ReferenceSection>

        <ReferenceSection
          title="Review Queue"
          badge={`${reviewItems.length} items`}
        >
          <div className="tk-review-list">
            {reviewItems.slice(0, 15).map((item) => {
              const urgency = item.recall_probability < 0.3
                ? 'high'
                : item.recall_probability < 0.6
                  ? 'medium'
                  : 'low';
              return (
                <div key={item.topic_id} className="tk-review-item">
                  <span className="tk-review-topic">Topic #{item.topic_id.slice(0, 8)}</span>
                  <span className={`tk-review-urgency ${urgency}`}>
                    {Math.round(item.recall_probability * 100)}% recall
                  </span>
                </div>
              );
            })}
            {reviewItems.length === 0 && (
              <p style={{ color: 'var(--tk-text-muted)', fontSize: '0.8rem' }}>
                No items due for review.
              </p>
            )}
          </div>
        </ReferenceSection>
      </div>

      {/* ── Weekly Roadmap ──────────────────────────────────────────── */}
      <div className="tk-section">
        <h2 className="tk-section-title">Weekly Roadmap</h2>
        {calendar?.weeks.map((weekData) => (
          <WeekBlock
            key={`${weekData.week.id}-${expandKey}`}
            weekData={weekData}
            forceOpen={allExpanded ? true : allCollapsed ? false : undefined}
            onSessionUpdate={handleRefresh}
          />
        ))}
        {(!calendar || calendar.weeks.length === 0) && (
          <p style={{ color: 'var(--tk-text-muted)', fontSize: '0.85rem' }}>
            No weeks loaded. Calendar data may still be initializing.
          </p>
        )}
      </div>

      {/* ── Bottom Section ──────────────────────────────────────────── */}
      <div className="tk-bottom">
        {/* Forecast */}
        {forecastPct !== null && (
          <div className="tk-forecast-panel">
            <div className="tk-forecast-gauge">
              <svg width={120} height={120} viewBox="0 0 120 120">
                <circle
                  cx={60} cy={60} r={50}
                  fill="none"
                  stroke="var(--tk-bg-elevated)"
                  strokeWidth="8"
                />
                <circle
                  cx={60} cy={60} r={50}
                  fill="none"
                  stroke={forecastPct >= 75 ? 'var(--tk-green)' : forecastPct >= 50 ? 'var(--tk-gold)' : 'var(--tk-red)'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - forecastPct / 100)}
                  transform="rotate(-90 60 60)"
                />
                <text
                  x={60} y={55}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--tk-text-primary)"
                  fontSize="22"
                  fontFamily="'Fira Code', 'Consolas', monospace"
                  fontWeight="bold"
                >
                  {forecastPct}%
                </text>
                <text
                  x={60} y={75}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill="var(--tk-text-muted)"
                  fontSize="9"
                  fontFamily="'Nunito Sans', system-ui, sans-serif"
                >
                  completion
                </text>
              </svg>
            </div>
            <div className="tk-forecast-info">
              <h3 className="tk-forecast-title">Completion Forecast</h3>
              <p className="tk-forecast-desc">
                Based on your attendance rate and quiz performance, Monte Carlo simulation
                estimates a {forecastPct}% probability of completing the full program.
                {forecastResult && (
                  <> P10: {Math.round(forecastResult[1] * 100)}% | P90: {Math.round(forecastResult[2] * 100)}%</>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Behavioral Alerts */}
        {alerts.length > 0 && (
          <div className="tk-alerts">
            {alerts.map((alert) => (
              <div key={alert.id} className="tk-alert">
                <div className="tk-alert-type">{alert.alert_type} &middot; {alert.severity}</div>
                {alert.message}
              </div>
            ))}
          </div>
        )}

        {/* Export Buttons */}
        <div className="tk-export-row">
          <button className="tk-btn" onClick={handleExportJson}>
            <Download size={14} />
            Export JSON
          </button>
          <button className="tk-btn" onClick={handleExportCsv}>
            <FileSpreadsheet size={14} />
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
