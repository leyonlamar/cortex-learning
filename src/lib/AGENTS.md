<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-03-19 | Updated: 2026-03-19 -->

# lib

## Purpose
Tauri IPC bridge providing 24 typed async wrappers over Rust backend commands. This is the single point of communication between React frontend and Rust backend.

## Key Files

| File | Description |
|------|-------------|
| `tauri-bridge.ts` | 24 typed command wrappers: user (3), curriculum (3), calendar (4), session (4), intelligence (7), quiz (3), export (4) |

## For AI Agents

### Working In This Directory
- Every function maps 1:1 to a registered Tauri command in `src-tauri/src/lib.rs`
- Parameter names must match Rust handler `#[tauri::command]` parameter names exactly
- All functions are async and use `invoke()` from `@tauri-apps/api/core`
- Return types must match `models.ts` definitions

### Adding New Commands
1. Add Rust handler in `src-tauri/src/commands/`
2. Register in `src-tauri/src/lib.rs` invoke_handler
3. Add typed wrapper here in `tauri-bridge.ts`
4. Add hook function in `src/hooks/` to call the bridge
5. Wire to component

## Dependencies

### Internal
- `../types/models.ts` — All return type definitions

### External
- `@tauri-apps/api/core` — `invoke()` function

<!-- MANUAL: -->
