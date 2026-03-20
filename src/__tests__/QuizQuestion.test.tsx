import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuizQuestionCard } from '../components/quiz/QuizQuestion';
import type { QuizQuestion } from '../types/models';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const mcQuestion: QuizQuestion = {
  id: 'q1',
  quiz_id: 'quiz1',
  topic_id: 'topic1',
  question_type: 'recall',
  difficulty: 0.5,
  question_text: 'What is 2 + 2?',
  options_json: JSON.stringify(['3', '4', '5', '6']),
  correct_answer: '4',
  user_answer: null,
  is_correct: null,
  sort_order: 0,
};

const openQuestion: QuizQuestion = {
  ...mcQuestion,
  id: 'q2',
  question_text: 'Explain the concept of recursion.',
  options_json: null,
};

describe('QuizQuestionCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crash', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('displays question text', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
  });

  it('displays question type badge', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('recall')).toBeInTheDocument();
  });

  it('displays difficulty value', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('Difficulty: 0.5')).toBeInTheDocument();
  });

  it('renders all multiple-choice options', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  it('submit button is disabled until an option is selected', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('Submit Answer')).toBeDisabled();
  });

  it('enables submit after selecting an option', () => {
    render(<QuizQuestionCard question={mcQuestion} onAnswer={vi.fn()} />);
    fireEvent.click(screen.getByText('4'));
    expect(screen.getByText('Submit Answer')).not.toBeDisabled();
  });

  it('calls onAnswer with the selected option when submitted', () => {
    const onAnswer = vi.fn();
    render(<QuizQuestionCard question={mcQuestion} onAnswer={onAnswer} />);
    fireEvent.click(screen.getByText('4'));
    fireEvent.click(screen.getByText('Submit Answer'));
    expect(onAnswer).toHaveBeenCalledWith('4');
  });

  it('renders a textarea for open-ended questions', () => {
    render(<QuizQuestionCard question={openQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByPlaceholderText('Type your answer here...')).toBeInTheDocument();
  });

  it('submit button is disabled when open answer is empty', () => {
    render(<QuizQuestionCard question={openQuestion} onAnswer={vi.fn()} />);
    expect(screen.getByText('Submit Answer')).toBeDisabled();
  });

  it('enables submit when open answer has text', () => {
    render(<QuizQuestionCard question={openQuestion} onAnswer={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Type your answer here...'), {
      target: { value: 'A function that calls itself.' },
    });
    expect(screen.getByText('Submit Answer')).not.toBeDisabled();
  });

  it('calls onAnswer with trimmed open-ended text when submitted', () => {
    const onAnswer = vi.fn();
    render(<QuizQuestionCard question={openQuestion} onAnswer={onAnswer} />);
    fireEvent.change(screen.getByPlaceholderText('Type your answer here...'), {
      target: { value: '  Recursion  ' },
    });
    fireEvent.click(screen.getByText('Submit Answer'));
    expect(onAnswer).toHaveBeenCalledWith('Recursion');
  });
});
