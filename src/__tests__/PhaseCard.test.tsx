import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PhaseCard } from '../components/session/PhaseCard';

// Mock @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const defaultProps = {
  phase: 'retrieval' as const,
  index: 0,
  unlocked: true,
  completed: false,
  isCurrent: false,
  onComplete: vi.fn(),
};

describe('PhaseCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crash', () => {
    render(<PhaseCard {...defaultProps} />);
    expect(screen.getByText('Retrieval Practice')).toBeInTheDocument();
  });

  it('displays the phase label for each phase type', () => {
    const phases = [
      { phase: 'retrieval' as const, label: 'Retrieval Practice' },
      { phase: 'learning' as const, label: 'New Learning' },
      { phase: 'micro_task' as const, label: 'Micro-Task' },
      { phase: 'reflection' as const, label: 'Reflection' },
    ];

    for (const { phase, label } of phases) {
      const { unmount } = render(<PhaseCard {...defaultProps} phase={phase} index={0} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('displays phase index as "Phase N+1"', () => {
    render(<PhaseCard {...defaultProps} index={2} />);
    expect(screen.getByText('Phase 3')).toBeInTheDocument();
  });

  it('displays the default duration in minutes', () => {
    render(<PhaseCard {...defaultProps} phase="retrieval" />);
    expect(screen.getByText('5m')).toBeInTheDocument();
  });

  it('shows lock icon when unlocked is false', () => {
    const { container } = render(<PhaseCard {...defaultProps} unlocked={false} />);
    // Lock icon rendered by lucide-react as SVG; button should be disabled
    const btn = container.querySelector('button');
    expect(btn).toBeDisabled();
  });

  it('shows "done" when completed', () => {
    render(<PhaseCard {...defaultProps} completed />);
    expect(screen.getByText('done')).toBeInTheDocument();
  });

  it('expands content when isCurrent is true and unlocked', () => {
    render(<PhaseCard {...defaultProps} isCurrent unlocked completed={false} />);
    expect(screen.getByText('Complete Phase')).toBeInTheDocument();
  });

  it('calls onComplete with defaultMin when Complete Phase is clicked', () => {
    const onComplete = vi.fn();
    render(<PhaseCard {...defaultProps} isCurrent unlocked completed={false} onComplete={onComplete} />);
    fireEvent.click(screen.getByText('Complete Phase'));
    expect(onComplete).toHaveBeenCalledWith(5, null, null);
  });

  it('toggles expand/collapse on header click when unlocked', () => {
    render(<PhaseCard {...defaultProps} unlocked completed={false} isCurrent={false} />);
    const btn = screen.getByRole('button', { name: /Phase 1/i });
    // Initially collapsed (isCurrent=false)
    expect(screen.queryByText('Complete Phase')).not.toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.getByText('Complete Phase')).toBeInTheDocument();
    fireEvent.click(btn);
    expect(screen.queryByText('Complete Phase')).not.toBeInTheDocument();
  });

  it('does not expand when unlocked is false', () => {
    render(<PhaseCard {...defaultProps} unlocked={false} isCurrent={false} />);
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(screen.queryByText('Complete Phase')).not.toBeInTheDocument();
  });

  it('renders children inside expanded area', () => {
    render(
      <PhaseCard {...defaultProps} isCurrent unlocked completed={false}>
        <span>Custom child content</span>
      </PhaseCard>
    );
    expect(screen.getByText('Custom child content')).toBeInTheDocument();
  });
});
