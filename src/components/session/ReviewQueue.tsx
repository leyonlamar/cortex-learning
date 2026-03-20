import { Card } from '../shared';

interface ReviewItem {
  topicId: string;
  topicName: string;
  domainSlug: string;
  recallProbability: number;
}

interface ReviewQueueProps {
  items: ReviewItem[];
  limit?: number;
}

export function ReviewQueue({ items, limit = 10 }: ReviewQueueProps) {
  const sorted = [...items]
    .sort((a, b) => a.recallProbability - b.recallProbability)
    .slice(0, limit);

  return (
    <Card>
      <h3
        className="text-xs font-semibold mb-3 uppercase tracking-wider"
        style={{ fontFamily: 'var(--font-display)', color: 'var(--text-muted)' }}
      >
        Review Queue
      </h3>
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center py-4 animate-fade-in">
          <div
            className="text-xs"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            No topics to review yet.
          </div>
          <div
            className="w-full h-1 mt-3 overflow-hidden"
            style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}
          >
            <div className="shimmer h-full w-full" />
          </div>
        </div>
      ) : (
        <ul className="flex flex-col gap-2 stagger-children">
          {sorted.map((item) => {
            const pct = Math.round(item.recallProbability * 100);
            const urgency = pct < 30 ? 'var(--accent-danger)'
              : pct < 60 ? 'var(--accent-warning)'
              : 'var(--accent-success)';
            return (
              <li
                key={item.topicId}
                className="flex items-center justify-between text-sm group"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-2 h-2 rounded-full shrink-0 pulse-dot"
                    style={{ background: urgency, animationDelay: `${pct * 20}ms` }}
                  />
                  <span
                    className="truncate"
                    style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
                  >
                    {item.topicName}
                  </span>
                </div>
                <span
                  className="text-xs tabular-nums shrink-0 ml-2"
                  style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
                >
                  {pct}%
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
