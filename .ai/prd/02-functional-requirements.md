# Functional Requirements

> Back to [PRD Index](./README.md)

## Layout Management

- Create, save, load, and export layouts
- Auto-save to prevent data loss
- Import/export as JSON for sharing
- **Export as image** (M3): PNG export of current layer view
- **Share via URL** (M4): LZ-compressed JSON in URL fragment. See [URL Share Security](./05-technical-reference.md#url-share-security-m4)

## Grid Editor

### Core Interactions
- Visual grid representing current layer
- Click-drag to create bins (initial height = layer height)
  - **Dimension tooltip:** show `WxD` near cursor while drawing
- Click to select bins
- Drag bins to reposition
- Resize bins via handles or direct input
  - **Resize handles:** scale with zoom, minimum 12px (always grabbable)

### Visual Feedback
- Valid/invalid placement indicators
- **3D collision detection:** bins cannot overlap in footprint AND vertical range
- **Blocked zones:** show where bins from lower layers protrude
- **Ghost layers:** show bins from adjacent layers (one above, one below)
  - "Show all layers" toggle for full visibility
  - Ghost bins: dashed outlines, non-interactive

### View Controls
- **Fit to content:** button to auto-zoom entire drawer into view
- **Measurement overlay** (M3): toggle mm dimensions (42mm per unit)
- **Empty cell highlighting** (M3): toggle to highlight unfilled cells
- **Per-layer visibility** (M3): individual show/hide per layer

## Layer Management

- Add/remove layers
- Set height per layer
- Rename layers (double-click to edit inline)
- Switch between layers for editing
- Validate total height doesn't exceed drawer
- **Bin count badge:** e.g., "Layer 1 (12 bins)"
- **Coverage percentage:** e.g., "85% filled"
- **Duplicate layer** (M3): copy layer with all bins

## Bin Properties Panel

Shows when a bin is selected:

- **Category:** dropdown with color coding
- **Label:** short name input (24 chars), shown on bin face
- **Notes:** textarea (256 chars), shown in panel only
  - Use for: item contents, print instructions, model links
- **Height:** input with +/- buttons
  - Helper text: "Height: [-] [ 6 ] [+] u (max 9)"
  - Clamped to valid range
  - Buttons disabled at bounds
- **Move to staging:** button
- **Duplicate bin** (M2): Ctrl+D or button
- **Context menu** (M3): right-click for Duplicate, Delete, Move to Staging, Change Category

## Categories

- Default set: Tools, 3D Printing, Electronics, Household, Open
- Add custom categories with name and color
- Edit/delete categories (cannot delete if in use)
- See [Core Concepts](./01-core-concepts.md#categories) for defaults

## Print List

- Group bins by size x height
- Show piece count (accounting for recursive splits)
- **Sort order:** by total piece area descending (batch efficiency)
- **Filament estimation:** configurable multipliers
  - Exposed in collapsible "Advanced" settings
  - Disclaimer: "Estimate only - actual usage varies by slicer settings"
- Indicate which bins require splitting
- **Copy button:** export as TSV for spreadsheet paste
- **Print checkboxes** (M4): track printed pieces
- **Gridfinity generator links** (M4): pre-filled params for standard sizes

## Keyboard Shortcuts

### Core (M1-M2)

| Key | Action |
|-----|--------|
| Delete/Backspace | Delete selected bin |
| Escape | Cancel/deselect |
| Ctrl+Z | Undo |
| Ctrl+Y / Ctrl+Shift+Z | Redo |
| +/- | Zoom in/out |
| ? | Help modal |
| Arrow keys | Nudge selected bin by 1 cell |
| Ctrl+D | Duplicate selected bin (M2) |
| Ctrl+0 | Fit to content (M2) |

### M4 Additions

| Key | Action |
|-----|--------|
| 1-9 | Quick category switch (by position) |
| Tab | Cycle selection through bins |
| Shift+Tab | Cycle selection backwards |

**Shortcut hints:** All buttons show shortcut in tooltip, e.g., "Delete bin (Del)"

## Undo System

50 state limit. Each state captures complete layout snapshot.

### Actions That Create Undo States

| Action | Creates State |
|--------|--------------|
| Bin created (draw complete) | Yes |
| Bin moved (drag end) | Yes |
| Bin resized (resize end) | Yes |
| Bin deleted | Yes |
| Bin property changed (on blur/enter) | Yes |
| Layer added/deleted/renamed | Yes |
| Layer height changed (on blur) | Yes |
| Drawer dimensions changed (on blur) | Yes |
| Category added/edited/deleted | Yes |
| Quick Fill operation | Yes (single state) |
| Clear Layer | Yes |
| Import layout | Yes (clears history first) |
| Keystroke in text field | No (wait for blur) |
| Drag in progress | No (wait for drop) |
| Resize in progress | No (wait for release) |

### Undo Behavior
- Restores full layout state (bins, layers, categories, drawer)
- Selection is NOT restored
- Active layer is NOT restored
- Scroll/zoom position NOT restored

## Quick Fill

Rapid bin creation tools in sidebar.

### Operations

| Operation | Behavior |
|-----------|----------|
| Fill All | Fill empty cells with specified WxD size, skip occupied/blocked |
| Fill Gaps | Auto-fill with optimally-sized bins <= max print size |
| Clear Layer | Remove all bins from layer (confirm if >0) |

### Safeguards
- **Max bins per operation:** 500
- **Confirmation threshold:** >100 bins triggers confirm dialog
- **Cancellation:** Escape cancels in-progress fill
- **Performance:** >50 bins shows progress, yields every 20 bins

### Toasts
- Fill All: "Added N bins (M cells couldn't fit)"
- Fill Gaps: "Added N bins of varying sizes"
- Clear: Confirm dialog first

**Size memory:** last-used WxD values persist for session
