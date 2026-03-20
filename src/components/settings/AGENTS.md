<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# settings

## Purpose
User profile management, theme switching, and data export/import controls.

## Key Files

| File | Description |
|------|-------------|
| `SettingsView.tsx` | Main view: user profile display, theme picker, data management section |
| `ThemePicker.tsx` | 8 theme thumbnail grid with preview and selection |
| `DataExport.tsx` | JSON export (clipboard + file) and import (file) buttons |

## For AI Agents

### Working In This Directory
- Theme changes apply instantly via `data-theme` attribute on `<html>`
- Export creates full DB snapshot as JSON
- Import replaces all data (destructive — should warn user)

<!-- MANUAL: -->
