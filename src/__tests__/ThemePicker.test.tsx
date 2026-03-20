import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemePicker } from '../components/settings/ThemePicker';
import type { Theme } from '../types/models';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}));

const THEME_LABELS: Record<Theme, string> = {
  glass: 'Pastel Glassmorphism',
  executive: 'Executive Minimal',
  brutalist: 'Neo-Brutalist Lab',
  console: 'OLED Ops Console',
  cyberpunk: 'Cyberpunk Neon',
  luxury: 'Luxury Gold',
  nasa: 'NASA Mission Control',
  studyhall: 'Study Hall',
};

describe('ThemePicker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crash', () => {
    render(<ThemePicker current="glass" onSelect={vi.fn()} />);
    expect(screen.getByText('Pastel Glassmorphism')).toBeInTheDocument();
  });

  it('renders all 8 theme options', () => {
    render(<ThemePicker current="glass" onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
  });

  it('displays all theme labels', () => {
    render(<ThemePicker current="glass" onSelect={vi.fn()} />);
    for (const label of Object.values(THEME_LABELS)) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('calls onSelect with the correct theme when a theme button is clicked', () => {
    const onSelect = vi.fn();
    render(<ThemePicker current="glass" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Executive Minimal'));
    expect(onSelect).toHaveBeenCalledWith('executive');
  });

  it('calls onSelect with cyberpunk when cyberpunk theme is clicked', () => {
    const onSelect = vi.fn();
    render(<ThemePicker current="glass" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Cyberpunk Neon'));
    expect(onSelect).toHaveBeenCalledWith('cyberpunk');
  });

  it('calls onSelect with studyhall when studyhall theme is clicked', () => {
    const onSelect = vi.fn();
    render(<ThemePicker current="glass" onSelect={onSelect} />);
    fireEvent.click(screen.getByText('Study Hall'));
    expect(onSelect).toHaveBeenCalledWith('studyhall');
  });

  it('shows active indicator dot for the current theme', () => {
    const { container } = render(<ThemePicker current="nasa" onSelect={vi.fn()} />);
    // The active dot has class "pulse-dot"
    const dot = container.querySelector('.pulse-dot');
    expect(dot).toBeInTheDocument();
  });

  it('shows exactly one active indicator dot', () => {
    const { container } = render(<ThemePicker current="luxury" onSelect={vi.fn()} />);
    const dots = container.querySelectorAll('.pulse-dot');
    expect(dots).toHaveLength(1);
  });

  it('each theme button has the correct accessible role', () => {
    render(<ThemePicker current="glass" onSelect={vi.fn()} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(8);
  });

  it('renders theme description text', () => {
    render(<ThemePicker current="glass" onSelect={vi.fn()} />);
    expect(screen.getByText(/Lavender, violet, mint/)).toBeInTheDocument();
  });
});
