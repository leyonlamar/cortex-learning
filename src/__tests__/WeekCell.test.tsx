import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { WeekCell } from '../components/timeline/WeekCell';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const defaultProps = {
  weekNum: 1,
  attendanceRate: 80,
  quizScore: null,
  isCurrent: false,
  onClick: vi.fn(),
};

describe('WeekCell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crash', () => {
    render(<WeekCell {...defaultProps} />);
    expect(screen.getByText('01')).toBeInTheDocument();
  });

  it('displays week number zero-padded to two digits', () => {
    render(<WeekCell {...defaultProps} weekNum={5} />);
    expect(screen.getByText('05')).toBeInTheDocument();
  });

  it('displays double-digit week number', () => {
    render(<WeekCell {...defaultProps} weekNum={12} />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<WeekCell {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('applies animate-pulse class when isCurrent', () => {
    const { container } = render(<WeekCell {...defaultProps} isCurrent />);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('animate-pulse');
  });

  it('does not apply animate-pulse when not current', () => {
    const { container } = render(<WeekCell {...defaultProps} isCurrent={false} />);
    const btn = container.querySelector('button');
    expect(btn?.className).not.toContain('animate-pulse');
  });

  it('renders quiz score dot when quizScore is provided', () => {
    const { container } = render(<WeekCell {...defaultProps} quizScore={75} />);
    // The dot is an absolutely positioned div
    const dot = container.querySelector('div.absolute');
    expect(dot).toBeInTheDocument();
  });

  it('does not render quiz score dot when quizScore is null', () => {
    const { container } = render(<WeekCell {...defaultProps} quizScore={null} />);
    const dot = container.querySelector('div.absolute');
    expect(dot).not.toBeInTheDocument();
  });

  it('includes attendance rate in title attribute', () => {
    render(<WeekCell {...defaultProps} weekNum={3} attendanceRate={60} />);
    const btn = screen.getByRole('button');
    expect(btn.title).toContain('60%');
  });

  it('includes quiz score in title when provided', () => {
    render(<WeekCell {...defaultProps} weekNum={3} quizScore={88} />);
    const btn = screen.getByRole('button');
    expect(btn.title).toContain('quiz: 88%');
  });

  it('does not mention quiz in title when quizScore is null', () => {
    render(<WeekCell {...defaultProps} weekNum={3} quizScore={null} />);
    const btn = screen.getByRole('button');
    expect(btn.title).not.toContain('quiz');
  });
});
