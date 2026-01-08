# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gridfinity Layout Tool is a React + TypeScript web application for designing storage layouts for 3D-printed drawer organizers (Gridfinity system). Features multi-layer support, drag-and-drop bin placement, and print optimization.

## Commands

```bash
npm run dev          # Start Vite dev server with HMR
npm run build        # TypeScript compile + Vite production build (tsc -b && vite build)
npm run test         # Run Vitest in watch mode
npm run test:run     # Run Vitest once (CI mode)
npm run lint         # ESLint check
```

## Architecture

### State Management (Zustand + Immer)

Three stores in `src/store/`:
- **layout.ts** - Layout data (bins, layers, categories, drawer settings). Uses Immer for immutable updates.
- **ui.ts** - UI state (selection, zoom, panel visibility, current interaction mode)
- **history.ts** - Undo/redo stack (max 50 states)

Use `useUndoableAction()` hook to wrap layout mutations for automatic history tracking.

### Core Data Model (`src/types.ts`)

```
Layout → Drawer, Categories[], Layers[], Bins[]
Bin → position (x,y), size (width,depth,height), layerId, category, label
Layer → id, name, height (minimum bin height for this layer)
```

### Component Structure

- **Grid/** - Canvas-based grid rendering (`GridCanvas.tsx`) + DOM overlay for interactive bins (`Overlay.tsx`)
- **Sidebar/** - Left panel: layers, categories, bin palette
- **RightPanel.tsx** - Selection inspector and actions
- **mobile/** and **tablet/** - Responsive variants with distinct layouts

### Key Hooks

- `useInteraction.ts` - Handles draw, drag, resize, paint interactions
- `useGridCoords.ts` - Mouse/touch → grid coordinate conversion
- `useResponsive.ts` - Breakpoint detection (isMobile, isTablet)
- `useAutoSave.ts` - Debounced localStorage persistence

### Validation (`src/utils/`)

- `validation.ts` - `canPlaceBin()` checks bounds, height, collisions
- `collision.ts` - Collision detection, blocked zones, layer Z calculations
- `fill.ts` - Bulk operations (fillAllWithSize, fillGaps)

## Styling

Tailwind CSS 4 with semantic color tokens defined in `src/index.css`:
- Surface: `bg-surface`, `bg-surface-secondary`, `bg-surface-elevated`
- Content: `text-content`, `text-content-secondary`, `text-content-tertiary`
- Stroke: `border-stroke`, `border-stroke-subtle`
- Semantic: `text-success`, `bg-error`, `bg-warning-muted`, etc.

Dark theme by default. Use Tailwind classes, not inline styles.

## Constants

Key values in `src/constants.ts`:
- Grid: 1-50 units, BASE_CELL_SIZE = 32px
- Layers: 1-10 max
- Zoom: 0.25-4.0 range
- Default: 10×8 drawer, 42mm grid units, 7mm height units

## Testing

Tests in `src/test/`. Focus on pure utility functions (validation, collision, fill algorithms). Run single test file:
```bash
npx vitest run src/test/validation.test.ts
```
