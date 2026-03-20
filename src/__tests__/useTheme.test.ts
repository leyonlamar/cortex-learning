import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTheme } from '../hooks/useTheme';

// Mock the tauri-bridge which internally uses @tauri-apps/api/core
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue(undefined),
}));

describe('useTheme', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset data-theme attribute before each test
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    document.documentElement.removeAttribute('data-theme');
  });

  it('initialises with the provided theme', () => {
    const { result } = renderHook(() => useTheme(null, 'executive'));
    expect(result.current.theme).toBe('executive');
  });

  it('defaults to "glass" when no initialTheme is supplied', () => {
    const { result } = renderHook(() => useTheme(null));
    expect(result.current.theme).toBe('glass');
  });

  it('sets data-theme on <html> on mount', () => {
    renderHook(() => useTheme(null, 'brutalist'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('brutalist');
  });

  it('exposes all 8 valid themes', () => {
    const { result } = renderHook(() => useTheme(null));
    expect(result.current.themes).toHaveLength(8);
    expect(result.current.themes).toContain('glass');
    expect(result.current.themes).toContain('studyhall');
  });

  it('switchTheme updates theme state', async () => {
    const { result } = renderHook(() => useTheme(null, 'glass'));
    await act(async () => {
      await result.current.switchTheme('cyberpunk');
    });
    expect(result.current.theme).toBe('cyberpunk');
  });

  it('switchTheme updates data-theme on <html>', async () => {
    const { result } = renderHook(() => useTheme(null, 'glass'));
    await act(async () => {
      await result.current.switchTheme('console');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('console');
  });

  it('switchTheme ignores invalid themes', async () => {
    const { result } = renderHook(() => useTheme(null, 'glass'));
    await act(async () => {
      await result.current.switchTheme('invalid-theme' as any);
    });
    expect(result.current.theme).toBe('glass');
  });

  it('calls setThemeApi when userId is provided', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const { result } = renderHook(() => useTheme('user-123', 'glass'));
    await act(async () => {
      await result.current.switchTheme('luxury');
    });
    expect(invoke).toHaveBeenCalledWith('set_theme', { userId: 'user-123', theme: 'luxury' });
  });

  it('does not call setThemeApi when userId is null', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    const { result } = renderHook(() => useTheme(null, 'glass'));
    await act(async () => {
      await result.current.switchTheme('nasa');
    });
    expect(invoke).not.toHaveBeenCalled();
  });

  it('still applies theme visually even when backend call fails', async () => {
    const { invoke } = await import('@tauri-apps/api/core');
    vi.mocked(invoke).mockRejectedValueOnce(new Error('Backend error'));
    const { result } = renderHook(() => useTheme('user-456', 'glass'));
    await act(async () => {
      await result.current.switchTheme('nasa');
    });
    expect(result.current.theme).toBe('nasa');
    expect(document.documentElement.getAttribute('data-theme')).toBe('nasa');
  });
});
