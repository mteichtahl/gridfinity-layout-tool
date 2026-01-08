# Milestones

> Back to [PRD Index](./README.md)

## M1: Core Editor

The minimum viable product - basic layout creation and editing.

### Grid & Bins
- Grid rendering with layers
- Bin creation, selection, deletion
- Dimension tooltip while drawing (`WxD` near cursor)
- Drag to move bins (including cross-layer)

### Multi-Layer Support
- Independent bin height, 3D collision detection
- Blocked zone rendering (hatched overlay for protrusions)
- Blocked zone interaction (click to select + switch layer)
- Bin height control (input with +/- in properties)
- Tall bin indicator (`Nu` badge + chevron)

### Organization
- Categories (default set, color-coded bins)
- Bin count per layer badge

### Staging
- Basic staging area (bins moved here on drawer shrink)
- Display only (no drag-from-staging yet)

### Validation
- No overlaps (3D), bounds checking, height bounds
- Constraints enforced (50x50 max, 10 layers max, 1 layer min)
- Edge cases: drawer shrink -> staging, delete layer confirm
- Confirm dialogs for destructive actions

### Data
- Default new layout values
- Basic import/export JSON (manual file save/load)

### Accessibility (Baseline)
- Focus indicators
- Semantic HTML
- Keyboard operability
- Color contrast
- Input labels

## M2: Full Editing

Complete editing experience with undo/redo and productivity features.

### Editing
- Resize handles (min 12px)
- Undo/redo (50 states, Ctrl+Z/Y/Shift+Z)
- Keyboard shortcuts (including arrow nudge)
- Duplicate bin (Ctrl+D, offset or staging)
- Fit to content (Ctrl+0)

### Layer Management
- Coverage percentage per layer
- Double-click to rename (inline editing)

### Staging
- Full staging: drag to/from, "move to staging" button

### Print List
- Recursive split calculations

### View
- Ghost layers (adjacent only + "show all" toggle)

### Quick Fill
- Custom size input
- Fill All, Fill Gaps, Clear Layer

### Polish
- Keyboard shortcut tooltips

## M3: Data & Polish

Persistence, settings, and quality-of-life improvements.

### Data
- Auto-save to localStorage (1s debounce)
- localStorage error handling (quota, corruption)

### Settings
- Filament estimation (configurable multipliers)
- Category management UI (add/edit/delete, validation)

### UI
- Help modal
- Viewport check (1024px minimum message)
- Print list copy button (TSV)
- Export as image (PNG)
- Context menu (right-click bin)
- Duplicate layer

### View Options
- Measurement overlay (mm dimensions)
- Empty cell highlighting
- Per-layer visibility toggles

### Accessibility
- Basic ARIA labels
- Focus indicators (`:focus-visible`)

## M4: Nice-to-Haves

Advanced features and polish.

### Input
- Touch support
- Multi-select
- Copy/paste bins

### Templates
- Common layout templates

### PWA
- Offline support

### Keyboard
- 1-9 for quick category switch
- Tab/Shift+Tab to cycle selection
- Full grid cursor navigation

### Organization
- Layer/category reordering
- Category icons/patterns (color-blind)

### Sharing
- Share via URL (LZ-compressed)
- Gridfinity generator links

### Tracking
- Print checkboxes

### Onboarding
- First-time user tour

### Visualization
- 3D preview (isometric stacked layers)

## Out of Scope

Not planned for any milestone:

- User accounts / cloud sync
- Actual STL generation
- Integration with slicers
- Mobile-first design
