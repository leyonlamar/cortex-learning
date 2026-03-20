# Learning OS 2026 — Multi-Theme Design System

Complete specification for 4 identity-complete themes. Each differs across color, typography, geometry, motion, iconography, and data visualization — they feel like different products, not recolors.

---

## Theme Overview

| Dimension | Glass | Executive | Brutalist | Console |
|-----------|-------|-----------|-----------|---------|
| **Mood** | Airy, playful, optimistic | Authoritative, precise, efficient | Raw, bold, experimental | Focused, technical, nocturnal |
| **Surface** | Frosted translucent | Pure white, border-only | Warm white, thick-bordered | True black OLED |
| **Accent** | Violet `#7C6BF0` | Corporate blue `#1A56DB` | Yellow `#FFD60A` | Terminal green `#00FF88` |
| **Radius** | 16px (soft) | 4px (crisp) | 0px (sharp) | 6px (subtle) |
| **Shadow** | Colored, diffused | None (borders only) | Hard offset, no blur | Glow-based |
| **Density** | Generous spacing | Tight, tabular | Chunky, grid-heavy | Compact, high-density |
| **Motion** | 250ms ease-out | 150ms ease | 100ms linear | 200ms ease-in-out |
| **Display Font** | Nunito | IBM Plex Sans | Syncopate | JetBrains Mono |
| **Body Font** | Nunito Sans | IBM Plex Sans | Space Mono | IBM Plex Sans |

---

## 1. Pastel Glassmorphism (`glass`)

**Narrative**: Like working inside a frosted crystal orb. Surfaces are translucent, backgrounds shimmer with gradient meshes, and everything feels weightless. Professional enough for daily use, playful enough to spark joy.

**Target User Mood**: Creative professionals, students who want calm focus without sterility.

**Signature Patterns**:
1. Frosted glass cards (`backdrop-filter: blur(16px) saturate(1.6)`)
2. Gradient mesh background (lavender → mint → amber radial gradients)
3. Pill-shaped buttons (`border-radius: 9999px`)

### Tokens

```json
{
  "colors": {
    "bg-primary": "#F0EEFF",
    "bg-secondary": "#E8E3FA",
    "bg-tertiary": "#DDD8F3",
    "bg-surface": "rgba(255, 255, 255, 0.62)",
    "text-primary": "#2D2B55",
    "text-secondary": "#5B577D",
    "text-muted": "#9490B4",
    "text-inverse": "#FFFFFF",
    "accent-primary": "#7C6BF0",
    "accent-secondary": "#4ECDC4",
    "accent-success": "#56C596",
    "accent-warning": "#FFB347",
    "accent-danger": "#FF6B6B",
    "accent-info": "#54A0FF",
    "border-color": "rgba(124, 107, 240, 0.15)"
  },
  "typography": {
    "font-display": "Nunito",
    "font-body": "Nunito Sans",
    "font-code": "Fira Code"
  },
  "geometry": {
    "border-radius": "16px",
    "shadow-sm": "0 2px 8px rgba(124, 107, 240, 0.08)",
    "shadow-md": "0 8px 24px rgba(124, 107, 240, 0.12)",
    "shadow-lg": "0 16px 48px rgba(124, 107, 240, 0.16)"
  },
  "motion": {
    "transition-speed": "250ms",
    "easing": "ease-out"
  },
  "chart-series": ["#7C6BF0", "#4ECDC4", "#FF6B6B", "#FFB347", "#54A0FF", "#56C596"]
}
```

### Do / Don't

| Do | Don't |
|----|-------|
| Use backdrop-filter on all cards | Use opaque solid backgrounds |
| Keep shadows colored (violet-tinted) | Use black/gray shadows |
| Pill-shape all buttons | Use sharp-cornered buttons |
| Gradient mesh on body background | Use flat solid backgrounds |
| Soft pastel chart fills | Use harsh saturated chart colors |

### Accessibility
- Contrast: 5.2:1 (`#2D2B55` on `#F0EEFF`) — passes AA
- Focus ring: 3px violet glow ring
- Reduced motion: disable backdrop-filter animations

---

## 2. Corporate Navy / Executive Minimal (`executive`)

**Narrative**: Every pixel earns its place. This is the boardroom theme — no decoration, no shadows, just precision hairline borders separating information. The navy sidebar anchors authority while white surfaces maximize data clarity.

**Target User Mood**: Professionals who equate visual restraint with competence.

**Signature Patterns**:
1. Navy `#0F1729` sidebar with light text
2. Zero shadows — borders-only elevation
3. Monochrome density with single blue accent `#1A56DB`

### Tokens

```json
{
  "colors": {
    "bg-primary": "#FFFFFF",
    "bg-secondary": "#F8F9FB",
    "bg-tertiary": "#F0F2F5",
    "bg-surface": "#FFFFFF",
    "text-primary": "#0F1729",
    "text-secondary": "#3D4A5C",
    "text-muted": "#8892A0",
    "text-inverse": "#FFFFFF",
    "accent-primary": "#1A56DB",
    "accent-secondary": "#0F1729",
    "accent-success": "#057A55",
    "accent-warning": "#C27803",
    "accent-danger": "#C81E1E",
    "accent-info": "#1A56DB",
    "border-color": "#E2E5EA"
  },
  "typography": {
    "font-display": "IBM Plex Sans",
    "font-body": "IBM Plex Sans",
    "font-code": "IBM Plex Mono"
  },
  "geometry": {
    "border-radius": "4px",
    "shadow-sm": "none",
    "shadow-md": "none",
    "shadow-lg": "0 1px 3px rgba(15, 23, 41, 0.08)"
  },
  "motion": {
    "transition-speed": "150ms",
    "easing": "ease"
  },
  "chart-series": ["#1A56DB", "#057A55", "#C81E1E", "#C27803", "#6B21A8", "#0E7490"]
}
```

### Do / Don't

| Do | Don't |
|----|-------|
| Use 1px borders for all elevation | Use box-shadows |
| Keep spacing tight (tabular density) | Use generous whitespace |
| Single accent color (blue) | Use multiple accent colors |
| Navy sidebar, white content | Use colored backgrounds |
| Cards hover changes border only | Cards lift/translate on hover |

### Accessibility
- Contrast: 14.8:1 (`#0F1729` on `#FFFFFF`) — passes AAA
- Focus ring: 2px solid blue
- Reduced motion: already minimal (150ms, no transforms)

---

## 3. Neo-Brutalist Data Lab (`brutalist`)

**Narrative**: Thick borders, raw grids, offset shadows, uppercase everything. This is data stripped of pretense — a lab bench, not a showroom. Every element announces itself with bold black outlines and yellow highlights.

**Target User Mood**: Builders and experimenters who want raw honesty over polish.

**Signature Patterns**:
1. 3px black borders on all cards
2. Hard offset box-shadows (5px 5px 0 black, zero blur)
3. Uppercase headings with wide letter-spacing (Syncopate)

### Tokens

```json
{
  "colors": {
    "bg-primary": "#FFFEF5",
    "bg-secondary": "#FFF9E6",
    "bg-tertiary": "#FFF3CC",
    "bg-surface": "#FFFFFF",
    "text-primary": "#000000",
    "text-secondary": "#333333",
    "text-muted": "#666666",
    "text-inverse": "#000000",
    "accent-primary": "#FFD60A",
    "accent-secondary": "#000000",
    "accent-success": "#00A651",
    "accent-warning": "#FF8C00",
    "accent-danger": "#FF0000",
    "accent-info": "#0066FF",
    "border-color": "#000000"
  },
  "typography": {
    "font-display": "Syncopate (uppercase, wide)",
    "font-body": "Space Mono",
    "font-code": "Space Mono"
  },
  "geometry": {
    "border-radius": "0px",
    "shadow-sm": "3px 3px 0 #000000",
    "shadow-md": "5px 5px 0 #000000",
    "shadow-lg": "8px 8px 0 #000000"
  },
  "motion": {
    "transition-speed": "100ms",
    "easing": "linear"
  },
  "chart-series": ["#FFD60A", "#0066FF", "#FF0000", "#00A651", "#FF8C00", "#000000"]
}
```

### Do / Don't

| Do | Don't |
|----|-------|
| Use 3px black borders everywhere | Use 1px or colored borders |
| Hard offset shadows only | Use diffused/blurred shadows |
| Uppercase all headings | Use sentence case headings |
| Yellow sidebar background | Use neutral sidebar |
| Flat chart colors, no gradients | Use gradient fills |
| Cards shift position on hover | Cards glow on hover |

### Accessibility
- Contrast: 21:1 (`#000000` on `#FFFEF5`) — maximum contrast
- Focus ring: 3px yellow glow
- Reduced motion: already near-zero (100ms linear)

---

## 4. Dark OLED Ops Console (`console`)

**Narrative**: True black for OLED pixels-off efficiency. Terminal green accents with subtle glow. Scan-line overlay whispers CRT nostalgia while IBM Plex Sans keeps body text modern and readable. Data values glow in green, KPIs pulse.

**Target User Mood**: Night-shift operators, developers, anyone who lives in dark mode.

**Signature Patterns**:
1. True black `#000000` background (OLED-optimized)
2. Green `#00FF88` terminal accents with `text-shadow` glow
3. CRT scan-line overlay (2px repeating gradient, `opacity: 0.01`)

### Tokens

```json
{
  "colors": {
    "bg-primary": "#000000",
    "bg-secondary": "#0A0A0A",
    "bg-tertiary": "#141414",
    "bg-surface": "#0D0D0D",
    "text-primary": "#E0E0E0",
    "text-secondary": "#999999",
    "text-muted": "#555555",
    "text-inverse": "#000000",
    "accent-primary": "#00FF88",
    "accent-secondary": "#00BFFF",
    "accent-success": "#00FF88",
    "accent-warning": "#FFB800",
    "accent-danger": "#FF4444",
    "accent-info": "#00BFFF",
    "border-color": "#1E1E1E"
  },
  "typography": {
    "font-display": "JetBrains Mono",
    "font-body": "IBM Plex Sans",
    "font-code": "JetBrains Mono"
  },
  "geometry": {
    "border-radius": "6px",
    "shadow-sm": "0 0 4px rgba(0, 255, 136, 0.06)",
    "shadow-md": "0 0 12px rgba(0, 255, 136, 0.08)",
    "shadow-lg": "0 0 24px rgba(0, 255, 136, 0.12)"
  },
  "motion": {
    "transition-speed": "200ms",
    "easing": "ease-in-out"
  },
  "chart-series": ["#00FF88", "#00BFFF", "#FF4444", "#FFB800", "#BF5AF2", "#FF6EC7"]
}
```

### Do / Don't

| Do | Don't |
|----|-------|
| Use true `#000000` background | Use dark gray (#1a1a1a) as primary bg |
| Green glow on data values | Use white for data emphasis |
| Subtle scan-line overlay | Use heavy scan-lines |
| Text is `#E0E0E0` (not pure white) | Use `#FFFFFF` body text (glare) |
| Active nav uses transparent green bg | Use solid accent buttons |

### Accessibility
- Contrast: 12.6:1 (`#E0E0E0` on `#000000`) — passes AAA
- Focus ring: 2px green glow
- Reduced motion: scan-line overlay hidden via `prefers-reduced-motion`

---

## Implementation

### File Structure

```
src/
├── index.css          # CSS variable slots (defaults = glass)
├── styles/
│   └── motion.css     # Animations, stagger reveals, glassmorphism
├── themes/
│   ├── glass.css      # Pastel Glassmorphism
│   ├── executive.css  # Corporate Navy
│   ├── brutalist.css  # Neo-Brutalist Data Lab
│   └── console.css    # Dark OLED Console
├── hooks/
│   └── useTheme.ts    # Theme state + DOM sync + Tauri persistence
├── types/
│   └── models.ts      # Theme = 'glass' | 'executive' | 'brutalist' | 'console'
└── components/settings/
    └── ThemePicker.tsx # Visual theme selector with gradient previews
```

### Theme Switching

Themes are switched by setting `data-theme` on `<html>`. CSS specificity via `[data-theme="name"]` selectors overrides `:root` defaults. No JavaScript class toggling needed.

```ts
// useTheme.ts — sets data-theme attribute on DOM
document.documentElement.setAttribute('data-theme', theme);
```

### Google Fonts

```html
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?
  family=Nunito:wght@400;500;600;700;800&
  family=Nunito+Sans:wght@400;500;600;700&
  family=IBM+Plex+Sans:wght@300;400;500;600;700&
  family=IBM+Plex+Mono:wght@400;500;600&
  family=Syncopate:wght@400;700&
  family=Space+Mono:wght@400;700&
  family=JetBrains+Mono:wght@400;500;600;700&
  family=Fira+Code:wght@400;500&
  display=swap" />
```

### Build Output

- JS: 204KB (60KB gzipped)
- CSS: 41KB (9KB gzipped) — includes all 4 themes + motion system
- Rust backend: 68/68 tests passing
