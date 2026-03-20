import { FileQuestion, Play } from 'lucide-react';
import { Card, Button } from '../shared';

interface QuizCardProps {
  quizStatus: 'pending' | 'available' | 'completed';
  score: number | null;
  topicCount: number;
  onLaunch: () => void;
}

export function QuizCard({ quizStatus, score, topicCount, onLaunch }: QuizCardProps) {
  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h3
          className="text-sm font-semibold flex items-center gap-2"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
        >
          <FileQuestion size={16} style={{ color: 'var(--accent-info)' }} />
          Friday Quiz
        </h3>
        <span
          className="px-2 py-0.5 text-xs rounded"
          style={{
            background: quizStatus === 'completed' ? 'var(--accent-success)'
              : quizStatus === 'available' ? 'var(--accent-primary)'
              : 'var(--bg-tertiary)',
            color: quizStatus === 'pending' ? 'var(--text-muted)' : 'var(--text-inverse)',
            borderRadius: 'var(--border-radius)',
          }}
        >
          {quizStatus}
        </span>
      </div>

      {quizStatus === 'completed' && score !== null && (
        <div className="mb-3">
          <span
            className="text-2xl font-bold"
            data-value
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-code)' }}
          >
            {Math.round(score)}%
          </span>
        </div>
      )}

      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        {topicCount} topics covered this week
      </p>

      {quizStatus === 'available' && (
        <Button size="sm" onClick={onLaunch}>
          <Play size={14} />
          Start Quiz
        </Button>
      )}
    </Card>
  );
}
