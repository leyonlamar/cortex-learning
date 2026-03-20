import { useState } from 'react';
import { Card, Button } from '../shared';
import type { QuizQuestion as QuizQuestionType } from '../../types/models';

interface QuizQuestionProps {
  question: QuizQuestionType;
  onAnswer: (answer: string) => void;
}

export function QuizQuestionCard({ question, onAnswer }: QuizQuestionProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [openAnswer, setOpenAnswer] = useState('');

  const options: string[] = question.options_json ? JSON.parse(question.options_json) : [];
  const isMultipleChoice = options.length > 0;

  const handleSubmit = () => {
    const answer = isMultipleChoice ? selected : openAnswer.trim();
    if (answer) onAnswer(answer);
  };

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span
          className="px-2 py-0.5 text-xs rounded"
          style={{
            background: 'var(--accent-info)',
            color: 'var(--text-inverse)',
            borderRadius: 'var(--border-radius)',
          }}
        >
          {question.question_type}
        </span>
        <span
          className="text-xs"
          style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-code)' }}
        >
          Difficulty: {question.difficulty.toFixed(1)}
        </span>
      </div>

      <p
        className="text-base font-medium"
        style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
      >
        {question.question_text}
      </p>

      {isMultipleChoice ? (
        <div className="flex flex-col gap-2">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => setSelected(opt)}
              className="text-left px-4 py-3 text-sm cursor-pointer border-none"
              style={{
                background: selected === opt ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                color: selected === opt ? 'var(--text-inverse)' : 'var(--text-primary)',
                borderRadius: 'var(--border-radius)',
                fontFamily: 'var(--font-body)',
              }}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <p
            className="text-xs"
            style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-body)' }}
          >
            Free response — type your answer below. Any non-empty answer will be accepted.
          </p>
          <textarea
            value={openAnswer}
            onChange={(e) => setOpenAnswer(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 text-sm"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--border-radius)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font-body)',
              resize: 'vertical',
            }}
            placeholder="Type your answer here..."
          />
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={isMultipleChoice ? !selected : !openAnswer.trim()}
      >
        Submit Answer
      </Button>
    </Card>
  );
}
