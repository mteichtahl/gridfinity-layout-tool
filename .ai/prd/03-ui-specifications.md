# UI Specifications

> Back to [PRD Index](./README.md)

## Overall Structure

```
┌─────────────────────────────────────────────────────────────┐
│ Header: Layout name (editable) | Undo/Redo | ? | Import/Export/New │
├──────────────┬──────────────────────────────────────────────┤
│   Sidebar    │                                              │
│   (256px)    │              Grid Area                       │
│              │   ┌──────────────────────────────────┐       │
│ ┌──────────┐ │   │  Column labels (1, 2, 3...)     │       │
│ │ Drawer   │ │   │  ┌─────────────────────────────┐ │       │
│ │ Settings │ │   │ R│                             │ │       │
│ │ W D H    │ │   │ o│        Grid cells           │ │       │
│ └──────────┘ │   │ w│        + Bins               │ │       │
│ ┌──────────┐ │   │  │        + Blocked zones      │ │       │
│ │ Layers   │ │   │ L│                             │ │       │
│ │ L1 (5) □ │ │   │ a│                             │ │       │
│ │ L2 (3) □ │ │   │ b│                             │ │       │
│ │ [+ Add]  │ │   │ e│                             │ │       │
│ └──────────┘ │   │ l│                             │ │       │
│ ┌──────────┐ │   │ s│                             │ │       │
│ │Categories│ │   │  └─────────────────────────────┘ │       │
│ │ ● ● ● ●  │ │   │ [☑ Others][☐ mm][☐ Empty]       │       │
│ └──────────┘ │   │                    [Fit][−]100%[+]│       │
│ ┌──────────┐ │   └──────────────────────────────────┘       │
│ │Quick Fill│ │                                              │
│ │[2]×[3]   │ │   ┌──────────────────────────────────┐       │
│ │[Fill All]│ │   │ Staging Area (horizontal chips)  │       │
│ │[Gaps|Clr]│ │   └──────────────────────────────────┘       │
│ └──────────┘ │                                              │
│ ┌──────────┐ │   ┌──────────────────────────────────┐       │
│ │ Selected │ │   │ Print List (table)               │       │
│ │   Bin    │ │   └──────────────────────────────────┘       │
│ │ [Dup|Del]│ │                                              │
│ └──────────┘ │                                              │
└──────────────┴──────────────────────────────────────────────┘
```

Legend: (5) = bin count, □ = visibility toggle, ● = category color swatch

## Sidebar Panels

Top to bottom:

### 1. Drawer Settings
- Width/depth/height inputs (in gridfinity units)
- Max print size input

### 2. Layers
- List with height inputs
- Add/delete/duplicate buttons
- Click to select active layer
- Each row shows:
  - Name (double-click to edit)
  - Height input
  - Bin count badge
  - Coverage %
  - Visibility toggle (M3)

### 3. Categories
- Color swatches with names
- Click to select active category for new bins

### 4. Quick Fill
- Size inputs: `[W] x [D]` (remembers last-used)
- [Fill All]: fill empty cells with specified size
- [Fill Gaps]: auto-fill with optimally-sized bins
- [Clear Layer]: remove all bins (confirm if >0)

### 5. Selected Bin (conditional)
Shows when bin selected:
- Dimensions display
- Height +/- controls
- Category dropdown
- Label input
- Notes textarea
- Duplicate button
- Delete button

## Grid Area Controls

- **Column/row labels:** 1-indexed, outside grid
- **Bottom-left:** Show others toggle, measurement overlay (M3), empty cells (M3)
- **Bottom-right:** Fit button, zoom controls (- / percentage / +)

## Design Tokens

Use CSS custom properties for consistency.

### Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-bg-primary` | #ffffff | Main background |
| `--color-bg-secondary` | #f3f4f6 | Sidebar, panels |
| `--color-bg-grid` | #fafafa | Grid background |
| `--color-border` | #e5e7eb | Panel borders |
| `--color-border-grid` | #d1d5db | Grid lines |
| `--color-text-primary` | #111827 | Main text |
| `--color-text-secondary` | #6b7280 | Labels, hints |
| `--color-focus` | #f59e0b | Focus ring (amber) |
| `--color-error` | #dc2626 | Error states |
| `--color-success` | #16a34a | Success states |
| `--color-selection` | #fbbf24 | Selected bin ring |
| `--color-invalid` | #fee2e2 | Invalid placement |
| `--color-ghost` | rgba(0,0,0,0.1) | Ghost bin overlay |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | 4px | Tight gaps |
| `--space-sm` | 8px | Component padding |
| `--space-md` | 16px | Section gaps |
| `--space-lg` | 24px | Panel padding |
| `--space-xl` | 32px | Major sections |

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-family` | system-ui, sans-serif | All text |
| `--font-size-xs` | 11px | Bin labels (small) |
| `--font-size-sm` | 13px | UI labels |
| `--font-size-md` | 15px | Body text |
| `--font-size-lg` | 18px | Section headers |
| `--font-weight-normal` | 400 | Body |
| `--font-weight-medium` | 500 | Labels |
| `--font-weight-bold` | 600 | Headers |

### Sizing

| Token | Value | Usage |
|-------|-------|-------|
| `--sidebar-width` | 256px | Left sidebar |
| `--grid-cell-size` | 32px | Base at 100% zoom |
| `--handle-size` | 12px | Resize handle min |
| `--focus-ring-width` | 2px | Focus indicator |
| `--border-radius-sm` | 4px | Buttons, inputs |
| `--border-radius-md` | 8px | Panels, cards |

### Animation

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-fast` | 100ms | Hover states |
| `--transition-normal` | 200ms | Panel transitions |
| `--transition-slow` | 300ms | Modal open/close |
| `--easing-default` | ease-out | Standard easing |

## Toast Notifications

| Property | Value |
|----------|-------|
| Duration | 3 seconds |
| Position | Bottom-right |
| Max visible | 3 (older dismissed) |
| Dismissable | Click to dismiss |
| Style | Dark bg, white text, category color accent |

## Loading & Progress States

| Operation | Threshold | UI Feedback |
|-----------|-----------|-------------|
| Page load | Always | Skeleton grid + "Loading..." |
| JSON import | >100ms | Modal: "Importing layout..." |
| Quick Fill | >50 bins | Progress toast: "Filling... X bins" |
| Image export | Always | Modal: "Generating image..." |
| URL decode | >100ms | Modal: "Loading shared layout..." |
| Auto-save | Never | Silent |

**Blocking:** Import, export, URL decode (modal, no interaction)
**Non-blocking:** Quick Fill (toast, Escape to cancel), Auto-save (silent)

## Small Viewport Handling

- Below 1024px: overlay message, semi-transparent backdrop
- Message: "This tool works best on larger screens. Please use a tablet in landscape mode or a desktop browser."
- No dismiss - must resize to use

## UX Notes from Prototyping

### What Worked Well
- Document-level mouse tracking for drag/resize (prevents losing cursor)
- Ghost preview showing where bin will land
- Hiding original bin during drag (reduces visual noise)
- Red preview for invalid placement
- Yellow selection ring + resize handles on select
- Dashed ghost bins for other layers (subtle but informative)

### Addressed Pain Points
- Resize handles too small -> min 12px handles
- Zoom affects handle size -> min 12px threshold
- Touch support -> deferred to M4
