<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# themes

## Purpose
8 CSS theme files that define visual identity through CSS custom properties. Applied via `data-theme` attribute on `<html>`.

## Key Files

| File | Description |
|------|-------------|
| `glass.css` | Default: pastel glassmorphism, 16px radius, backdrop-filter blur, colored shadows |
| `executive.css` | Corporate: navy/white, 4px radius, borders only, zero shadows |
| `brutalist.css` | Neo-brutalist: 0px radius, 3px black borders, hard offset shadows |
| `console.css` | Dark OLED: true black #000, terminal green glow, scan-line overlay |
| `cyberpunk.css` | Neon: purple/pink gradients, glitch animations, gradient borders |
| `luxury.css` | Editorial: serif fonts, gold accents, elegant spacing |
| `nasa.css` | Mission control: amber/cyan, dashed borders, uppercase labels |
| `studyhall.css` | Warm: sage/terracotta, pill buttons, soft textures |

## For AI Agents

### Working In This Directory
- Each theme defines 30+ CSS custom properties (colors, typography, geometry, motion, chart series)
- Reference `docs/DESIGN-SYSTEM.md` for the full token specification
- Never add theme-specific styles inline in components — use custom properties
- Test all 8 themes when changing shared component styles
- Chart palettes (`--chart-1` through `--chart-6`) must be defined per theme

### Token Categories
- Colors: `--bg-primary/secondary/tertiary`, `--text-primary/secondary/muted`, `--accent-*`
- Typography: `--font-display`, `--font-body`, `--font-code`
- Geometry: `--radius`, `--shadow-sm/md/lg`
- Motion: `--transition-speed`, `--easing`

<!-- MANUAL: -->
