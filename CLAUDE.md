# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gridfinity Layout Tool - A React web app for planning drawer organization using the Gridfinity modular storage system (1 unit = 42mm). Users place bins on a grid representing their drawer, manage multiple vertical layers, and generate print lists for 3D printing.

## Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # Type-check (tsc -b) then build for production
npm run lint         # ESLint check
npm run test         # Run Vitest in watch mode
npm run test:run     # Run tests once (CI)
```

## Architecture

### State Management (Zustand + Immer)

Three stores in `src/store/`:
- **layout.ts** - Layout data (drawer, layers, bins, categories). All mutations use Immer for immutability. Key operations: `addBin`, `updateBin`, `fillLayer`, `fillLayerGaps`
- **ui.ts** - UI state (active layer, selected bin, zoom, interaction mode)
- **history.ts** - Undo/redo via `useUndoableAction` hook wrapper

### Core Domain Model (`src/types.ts`)

- **Layout** - Root object: drawer dimensions, layers[], bins[], categories[], maxPrintSize
- **Layer** - Vertical subdivision with height; bins can extend through multiple layers
- **Bin** - Placed container with position, dimensions, category, label, notes. `layerId: "__staging__"` means bin is in staging area
- **BlockedZone** - Space blocked on upper layers by tall bins from below

### Coordinate System

Origin (0,0) = bottom-left internally. UI displays as 1-indexed. Max grid: 50x50.

### Key Utilities (`src/utils/`)

- **validation.ts** - `canPlaceBin()` checks bounds, collisions, blocked zones
- **collision.ts** - Bin overlap detection, layer reorder collision checking
- **fill.ts** - `fillAllWithSize()` and `fillGaps()` for quick fill operations
- **split.ts** - Greedy recursive splitting of oversized bins for print list

### Component Structure

```
App.tsx
├── Header            # Layout name, import/export, zoom controls
├── Sidebar           # Drawer config, layers panel, categories, quick fill
├── Grid/             # Main canvas with bins, overlay for interactions
│   ├── GridCanvas    # Cell rendering, drop targets
│   ├── Bin           # Individual bin display
│   └── Overlay       # Draw/drag/resize preview
├── Staging           # Temp storage area (bins excluded from print)
└── RightPanel        # Selected bin properties, print list
```

### Interactions (`src/hooks/`)

- **useInteraction.ts** - Mouse handlers for draw, drag, resize operations
- **useKeyboard.ts** - Global shortcuts (delete, undo/redo, duplicate, nudge)
- **useGridCoords.ts** - Convert mouse position to grid coordinates

## Key Constants (`src/constants.ts`)

- `STAGING_ID = "__staging__"` - Special layerId for staging area
- `DEFAULT_CATEGORY_COLOR = "#6b7280"` - Fallback color for undefined categories
- `CONSTRAINTS` - Max grid 50, max 10 layers, max 20 categories, zoom 0.25-4.0
- `BASE_CELL_SIZE = 32` - Pixels per grid cell at 100% zoom

## Styling Architecture (`src/index.css`)

### Tailwind v4 + CSS Variables

Uses Tailwind CSS v4 with CSS-first configuration:

```css
@theme {
  /* Semantic color mappings - use as bg-surface, text-content, border-stroke */
  --color-surface: var(--bg-primary);
  --color-content: var(--text-primary);
  --color-stroke: var(--border-default);
  /* Semantic colors: success, warning, error, info, accent */
}

@layer components {
  /* All component styles (.btn, .panel, .badge, .input) */
}
```

### CSS Variable Naming

- **Surfaces** (backgrounds): `bg-surface`, `bg-surface-secondary`, `bg-surface-elevated`
- **Content** (text): `text-content`, `text-content-secondary`, `text-content-tertiary`, `text-content-disabled`
- **Strokes** (borders): `border-stroke`, `border-stroke-subtle`, `border-stroke-strong`
- **Semantic**: `text-success`, `bg-error-muted`, `border-warning`, etc.

### Component Classes

- `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-danger`, `.btn-ghost`, `.btn-icon`
- `.panel` - Card-like container with gradient background
- `.badge`, `.badge-info`, `.badge-warning`, `.badge-success`, `.badge-error`
- `.input` - Form input styling
- `.section-header` - Panel section headings

### Typography Tokens

- `--text-xxs`: 9px (tiny labels)
- `--text-xs`: 11px (subtle labels)
- `--text-sm`: 13px (secondary text)
- `--text-base`: 14px (body)

## PRD Documentation

Detailed requirements in `.ai/prd/`:
- `01-core-concepts.md` - Drawer, layers, bins, staging, blocked zones
- `02-functional-requirements.md` - Feature specs
- `05-technical-reference.md` - Data model, algorithms
