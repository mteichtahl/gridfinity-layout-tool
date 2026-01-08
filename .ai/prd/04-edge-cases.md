# Edge Cases & Validation

> Back to [PRD Index](./README.md)

## Drawer Resize

| Scenario | Behavior |
|----------|----------|
| Shrink causes bins out of bounds | Auto-move bins to staging. Toast: "N bin(s) moved to staging (out of bounds)" |
| Height < total layer heights | Prevent - clamp input to min = sum of layer heights |

## Layer Operations

| Scenario | Behavior |
|----------|----------|
| Delete layer with bins | Confirm: "Delete [Layer Name] and N bin(s)?" [Cancel] [Delete] |
| Delete last layer | Disabled - must have at least 1 layer |
| Reduce layer height | Bins keep height if still valid (>= new layer height). Bins never auto-shrink |
| Add layer | New layer selected. Default height = `min(3, remainingDrawerHeight)` |
| Add layer when no space | Disabled when remaining drawer height = 0 |
| Delete layer | Select previous layer; if deleting first, select new first |

## Bin Operations

| Scenario | Behavior |
|----------|----------|
| New bin default category | Uses currently selected category in sidebar |
| New bin default height | Base layer height (user can increase via properties) |
| Cross-layer drag | Allowed - dropping places bin on active layer; height kept if fits, else clamped |
| Duplicate bin (M2) | Place at (x+1, y+1) if space; try (x+1, y), then (x, y+1); else staging |
| Duplicate bin toast | "Bin duplicated" or "Bin duplicated to staging (no room)" |
| Duplicate layer (M3) | New layer with same height + all bins. Name = "[Original] copy" |

## Multi-Layer Bin Operations

| Scenario | Behavior |
|----------|----------|
| Increase bin height | Only allowed if vertical space above is clear |
| Decrease bin height | Always allowed down to base layer height |
| Delete layer with protrusions | Bins from below remain unchanged |
| Bin in blocked zone | Prevented - validation rejects placement |
| Blocked zone click | Selects blocking bin + switches to base layer |
| Multi-layer protrusion | Bin shows blocked on ALL layers in vertical range |

## Data Operations

| Scenario | Behavior |
|----------|----------|
| Import over existing | Confirm: "Replace current layout? This cannot be undone." |
| New layout | Confirm: "Start new layout? Current layout will be cleared." |
| Import validation failure | Show error list in modal, keep current layout |
| IDs on import | Regenerate all IDs to prevent collisions |
| All bins in staging | Print list: "No bins placed. Bins in staging are not included." |
| Empty localStorage first load | Create default layout |

## Selection Behavior

| Scenario | Behavior |
|----------|----------|
| Layer switch | Deselect any selected bin (selection is layer-scoped) |
| Bin deleted | Clear selection |
| Bin moved to staging | Keep selected (selection follows bin) |
| Click empty grid cell | Deselect current bin |
| Click bin | Select that bin (replaces previous) |

## Storage Errors

| Scenario | Behavior |
|----------|----------|
| localStorage full | Show "Storage full. Export your layout to save it." Disable auto-save |
| Corrupted localStorage | Show "Layout data corrupted. Start fresh?" [Reset] creates default |
| 80% capacity | Non-blocking warning: "Storage nearly full. Consider exporting." |

## Category Operations

| Scenario | Behavior |
|----------|----------|
| Delete category in use | Disabled. Tooltip: "Category in use by N bin(s)" |
| Delete last category | Disabled. Must have at least 1 |
| Add at limit (20) | Disabled. Tooltip: "Maximum 20 categories" |
| Duplicate name | Reject on blur. Error: "Category name already exists" |
| Active category deleted | Set active to first remaining |

## Constraint Enforcement

All constraints enforced on blur:

| Input | Constraint |
|-------|------------|
| Drawer width/depth | Clamp to 1-50 |
| Drawer height | Clamp to >= sum of layer heights |
| Layer height | Clamp to 1-(remaining drawer height) |
| Bin label | Truncate to 24 chars |
| Layout name | Truncate to 64 chars |
| Category name | Truncate to 24 chars |
| Bin notes | Truncate to 256 chars |

## Quick Fill Safeguards

| Safeguard | Behavior |
|-----------|----------|
| Max bins per operation | 500 |
| Confirmation threshold | >100 bins: "This will create N bins. Continue?" |
| Cancellation | Escape cancels (partial results kept) |
| Performance | >50 bins shows progress, yields every 20 bins |

## Import Validation

Validation runs in order. On any failure, reject import and show errors:

1. Required fields present with correct types
2. All bin.layerId references valid layer or "__staging__"
3. No bins out of drawer bounds (except staging)
4. Total layer heights <= drawer height
5. Bin heights valid: >= base layer height, <= space to drawer top
6. No 3D collisions between bins
7. Category names unique (case-insensitive)
8. Regenerate all IDs after validation passes
