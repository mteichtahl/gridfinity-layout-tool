# Core Concepts

> Back to [PRD Index](./README.md)

## Drawer

The container being organized. Defined by width x depth x height in gridfinity units (1u = 42mm).

- Example: 7x12x6u (IKEA Alex drawer)
- **Maximum grid size:** 50x50 (performance constraint)
- **Minimum:** 1x1x1 (edge case allowed)

### Coordinate System

| Aspect | Internal (JSON) | Display (UI) |
|--------|-----------------|--------------|
| Origin | (0,0) = bottom-left | Bottom-left |
| X-axis | 0 to width-1, increases right | Labels 1 to width (left to right) |
| Y-axis | 0 to depth-1, increases up | Labels 1 to depth (bottom to top) |
| Z-axis | 0 = drawer floor | Layer 1 = bottom layer |

**Mapping:** UI label = internal coordinate + 1. Example: bin at (0,0) displays at "Column 1, Row 1".

## Layers

Vertical subdivisions of the drawer.

- Each layer has a height (e.g., 3u for shallow items, 9u for tall items)
- Layers stack; total height must not exceed drawer height
- User edits one layer at a time
- **Maximum:** 10 layers per drawer
- **Minimum:** 1 layer (cannot delete last layer)
- **Stack order:** array index = physical stack (index 0 = bottom layer)
- **Names:** max 24 chars, duplicates allowed

## Bins

Rectangular containers placed on layers.

### Dimensions
- Width x depth x height
- Minimum footprint: 1x1
- **Height is independent:** bins can extend upward through multiple layers
  - Minimum height = base layer height (bin fills at least its own layer)
  - Maximum height = remaining drawer space above bin's base
  - User adjusts height via properties panel

### Properties
- **Label:** short name (max 24 chars), displayed on bin face
- **Notes:** longer description (max 256 chars), for contents/print notes - visible in panel and tooltip only
- **Category:** for visual organization (color-coded)
- **Tall bin indicator:** bins exceeding layer height show `Nu` badge + top-edge chevron

## Staging Area

Temporary storage for bins being rearranged.

- Bins in staging are **excluded from print calculations**
- **Staged bin coordinates:** x=0, y=0 (ignored; staging uses flow layout)
- **Staged bin height:** preserved from when moved; editable in properties
- **Staged bin max height:** drawer height (no layer constraint)
- **Dragging from staging (M2):** bin centers on cursor; height clamped to available space at drop

### Overflow Behavior

| Condition | Behavior |
|-----------|----------|
| 0 bins | Placeholder: "Drag bins here or they'll appear when moved out of bounds" |
| 1-10 bins | Single row, chips wrap naturally |
| 11-20 bins | Horizontal scroll, scroll indicators on edges |
| 21+ bins | Same + count badge: "21 bins in staging" |
| Max bins | 100 |

### Visual Design
- Container height: fixed 64px
- Chip size: proportional to bin footprint, clamped 40-80px width
- Chip content: `WxDxH` + category color bar + label (truncated)
- Overflow: fade gradient + arrow on scrollable edge
- Scroll: horizontal drag or Shift+wheel

## Blocked Zones

When a bin extends upward from a lower layer, it blocks space on layers above.

### Rendering

| Element | Style |
|---------|-------|
| Fill | Bin's category color at 30% opacity |
| Pattern | Diagonal hatching (45deg, 4px spacing) |
| Border | 1px dashed, category color at 50% |
| Label | `WxD` dimensions centered |
| Hover | Tooltip: "[Label] from [Layer] (click to select)" |
| Cursor | `pointer` |

### Interaction
- Cannot place bins in blocked zones
- Clicking blocked zone -> selects blocking bin + switches to base layer
- Blocked zones are non-resizable (must select actual bin)

## Categories

Used for visual organization (color-coded bins).

- **Maximum:** 20 categories
- Default set provided; users can add/edit/delete
- **Names must be unique** (case-insensitive)
- Name max 24 chars; colors need not be unique

### Default Categories

| Name | Color | ID |
|------|-------|-----|
| Tools | #ef4444 (red) | tools |
| 3D Printing | #3b82f6 (blue) | printing |
| Electronics | #10b981 (green) | electronics |
| Household | #8b5cf6 (purple) | household |
| Open | #6b7280 (gray) | open |

## Print Constraints

Bins exceeding max print size must be split into pieces.

- **Greedy recursive splitting:** keep halving until all pieces fit
- Example: 9x3 bin with max 4u -> 5x3 + 4x3 -> 3x3 + 2x3 + 4x3 (3 pieces)
- Print list aggregates all bins by size for batch printing

See [Technical Reference](./05-technical-reference.md) for split algorithm details.
