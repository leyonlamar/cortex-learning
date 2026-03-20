import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KPICard } from '../components/dashboard/KPICard';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

describe('KPICard', () => {
  it('renders without crash', () => {
    render(<KPICard label="Sessions" value="12" delta={null} deltaPositive={false} />);
    expect(screen.getByText('Sessions')).toBeInTheDocument();
  });

  it('displays the label', () => {
    render(<KPICard label="Total Hours" value="48" delta={null} deltaPositive={false} />);
    expect(screen.getByText('Total Hours')).toBeInTheDocument();
  });

  it('displays the metric value', () => {
    render(<KPICard label="Sessions" value="42" delta={null} deltaPositive={false} />);
    expect(screen.getByText('42')).toBeInTheDocument();
  });

  it('displays delta when provided', () => {
    render(<KPICard label="Score" value="85%" delta="+5%" deltaPositive />);
    expect(screen.getByText('+5%')).toBeInTheDocument();
  });

  it('does not display delta when null', () => {
    const { container } = render(
      <KPICard label="Score" value="85%" delta={null} deltaPositive={false} />
    );
    // Only label and value spans, no delta span
    const spans = container.querySelectorAll('span');
    const texts = Array.from(spans).map((s) => s.textContent);
    expect(texts).not.toContain('+5%');
  });

  it('renders sparkline SVG when sparkData has more than one point', () => {
    const { container } = render(
      <KPICard label="Score" value="80%" delta={null} deltaPositive={false} sparkData={[10, 20, 30]} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
    expect(container.querySelector('polyline')).toBeInTheDocument();
  });

  it('does not render sparkline when sparkData is a single point', () => {
    const { container } = render(
      <KPICard label="Score" value="80%" delta={null} deltaPositive={false} sparkData={[10]} />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('does not render sparkline when sparkData is absent', () => {
    const { container } = render(
      <KPICard label="Score" value="80%" delta={null} deltaPositive={false} />
    );
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('renders positive delta without error for different values', () => {
    render(<KPICard label="Mastery" value="72%" delta="+3%" deltaPositive />);
    expect(screen.getByText('+3%')).toBeInTheDocument();
  });

  it('renders negative delta without error', () => {
    render(<KPICard label="Energy" value="60%" delta="-2%" deltaPositive={false} />);
    expect(screen.getByText('-2%')).toBeInTheDocument();
  });
});
