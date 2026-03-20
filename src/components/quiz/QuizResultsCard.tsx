import { Card } from '../shared';
import type { QuizResults } from '../../types/models';

interface QuizResultsCardProps {
  results: QuizResults;
}

export function QuizResultsCard({ results }: QuizResultsCardProps) {
  const { raw_score, weighted_score, total_questions, correct_count, category_breakdown, topics_to_review } = results;

  return (
    <div className="flex flex-col gap-4">
      {/* Score summary */}
      <Card className="text-center py-6">
        <div
          className="text-4xl font-bold mb-2"
          data-value
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}
        >
          {Math.round(raw_score * 100)}%
        </div>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          {correct_count}/{total_questions} correct
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
          Weighted: {Math.round(weighted_score * 100)}%
        </p>
      </Card>

      {/* Category breakdown */}
      <Card>
        <h3
          className="text-sm font-semibold mb-3"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          Category Breakdown
        </h3>
        <div className="flex flex-col gap-2">
          {(['recall', 'applied', 'synthesis'] as const).map((cat) => {
            const data = category_breakdown[cat];
            const pct = data.total > 0 ? (data.correct / data.total) * 100 : 0;
            return (
              <div key={cat} className="flex items-center justify-between text-sm">
                <span className="capitalize" style={{ color: 'var(--text-primary)' }}>{cat}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-2 overflow-hidden" style={{ background: 'var(--bg-tertiary)', borderRadius: 'var(--border-radius)' }}>
                    <div
                      className="h-full"
                      style={{
                        width: `${pct}%`,
                        background: pct >= 80 ? 'var(--accent-success)' : pct >= 60 ? 'var(--accent-warning)' : 'var(--accent-danger)',
                        borderRadius: 'var(--border-radius)',
                      }}
                    />
                  </div>
                  <span style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}>
                    {data.correct}/{data.total}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Topics to review */}
      {topics_to_review.length > 0 && (
        <Card>
          <h3
            className="text-sm font-semibold mb-2"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Topics to Review
          </h3>
          <ul className="flex flex-col gap-1">
            {topics_to_review.map((t) => (
              <li key={t} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                {t}
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
