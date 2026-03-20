<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# forecast

## Purpose
Monte Carlo scenario runner view. Users configure attendance rate, quiz average, and weeks remaining, then run simulations to see completion probability at p10/p50/p90.

## Key Files

| File | Description |
|------|-------------|
| `ForecastView.tsx` | Main view: scenario inputs, triggers forecast, displays results |
| `CompletionGauge.tsx` | Animated radial gauge showing p50 completion probability |
| `DistributionChart.tsx` | Recharts visualization of p10/p50/p90 percentile bands |
| `ScenarioPanel.tsx` | Input controls: attendance rate, quiz avg, weeks remaining sliders |

## For AI Agents

### Working In This Directory
- Forecasts are computed on-demand via `runForecast` bridge call
- Results are ephemeral — not persisted to DB (forecasts table exists but unused)
- Gauge animation should respect theme `--transition-speed`
- Up to 50K simulations, <200ms in release build

<!-- MANUAL: -->
