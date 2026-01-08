# Technical Reference

> Back to [PRD Index](./README.md)

## JSON Schema

```typescript
interface Layout {
  version: string;           // "1.0" - for future migrations
  name: string;              // max 64 chars
  drawer: {
    width: number;           // 1-50
    depth: number;           // 1-50
    height: number;          // >= sum of layer heights
  };
  maxPrintSize: number;      // typically 4
  filamentBaseline: number;  // default 1.88
  categories: Category[];    // 1-20 items
  layers: Layer[];           // 1-10 items, index 0 = bottom
  bins: Bin[];
}

interface Category {
  id: string;
  name: string;              // max 24 chars, unique (case-insensitive)
  color: string;             // hex color
}

interface Layer {
  id: string;
  name: string;              // max 24 chars
  height: number;            // >= 1
}

interface Bin {
  id: string;
  layerId: string;           // base layer where bin sits (or "__staging__")
  x: number;                 // 0-based, from left
  y: number;                 // 0-based, from bottom
  width: number;             // >= 1
  depth: number;             // >= 1
  height: number;            // >= base layer height, <= space to drawer top
  category: string;          // references Category.id
  label: string;             // max 24 chars, optional
  notes: string;             // max 256 chars, optional
}
```

## Vertical Range Calculation

```typescript
// Layer Z start = sum of heights of all layers below
layerZStart(layer) = sum of heights of all layers with index < layer's index

// Bin vertical range
bin.zStart = layerZStart(bin's base layer)
bin.zEnd = bin.zStart + bin.height
```

## 3D Collision Detection

Two bins collide if:

1. **Footprints overlap:**
```typescript
(bin1.x < bin2.x + bin2.width) && (bin2.x < bin1.x + bin1.width) &&
(bin1.y < bin2.y + bin2.depth) && (bin2.y < bin1.y + bin1.depth)
```

2. **Vertical ranges overlap:**
```typescript
(bin1.zStart < bin2.zEnd) && (bin2.zStart < bin1.zEnd)
```

## Blocked Zone Calculation

For layer N, find all bins that protrude into it:

```typescript
for each bin where bin.layerId's index < N:
  if bin.zEnd > layerZStart(layer N):
    // This bin protrudes into layer N
    // Show blocked zone at bin's (x, y, width, depth)
```

## URL Share Security (M4)

### Input Validation
1. Decompress LZ string with size limit (reject if > 500KB decompressed)
2. Parse JSON with try/catch (reject malformed)
3. Run full import validation
4. Sanitize all string fields before display
5. Reject on any failure - show error, don't partially load

### XSS Prevention
- Render strings via textContent or React JSX (never innerHTML)
- Validate colors as hex: `/^#[0-9a-fA-F]{6}$/`
- No eval() or Function() on imported data
- No URLs/links stored in layout data

### Size Limits
- Max URL length: 8000 chars
- Max decompressed JSON: 500KB
- Over limit: "Layout too large to share via URL. Use JSON export instead."

### UX
- Loading confirmation: "Load shared layout '[Name]'? This will replace your current layout."
- Failed validation: "Could not load shared layout: [reason]"

## Data Migration Strategy

The `version` field enables schema evolution.

### Migration Rules
1. On load, check version against current schema
2. Apply migrations sequentially (1.0 -> 1.1 -> 1.2)
3. Migrations are pure functions
4. Update version field after migration
5. Save immediately (triggers auto-save)

### Migration Registry Pattern

```typescript
const migrations: Record<string, (layout: unknown) => unknown> = {
  "1.0": migrateV1ToV1_1,
  "1.1": migrateV1_1ToV1_2,
};

function migrate(layout: { version: string }): Layout {
  let current = layout;
  while (current.version !== CURRENT_VERSION) {
    const migrator = migrations[current.version];
    if (!migrator) throw new Error(`Unknown version: ${current.version}`);
    current = migrator(current);
  }
  return current as Layout;
}
```

### Backwards Compatibility
- New optional fields: provide defaults in migration
- Removed fields: delete silently
- Renamed fields: copy value, delete old
- Never break imports from older versions

## Filament Estimation

```
baseArea = width * depth * 42² (mm²)
wallArea = 2 * (width + depth) * 42 * height * 7 (mm²)
filamentPerBin = (baseArea * baseMultiplier + wallArea * wallMultiplier) * baseline * 0.5
totalFilament = sum of filamentPerBin for all bins (meters)
spoolsNeeded = ceil(totalFilament / spoolSize)
```

### Defaults
- baseMultiplier: 0.002
- wallMultiplier: 0.004
- baseline: 1.88
- spoolSize: 330m (standard 1kg PLA)

### Display
- Per-size: "~X.Xm"
- Total: "~XX.Xm total (~X.X spools)"
- Disclaimer: "Estimates only - actual usage varies by slicer settings"

## Fill Gaps Algorithm

```
1. Find all empty cells on current layer (not occupied, not blocked)
2. Group empty cells into contiguous rectangular regions
3. For each region (largest first):
   a. Calculate largest bin: min(region.width, maxPrintSize) x min(region.depth, maxPrintSize)
   b. Place bin at region's bottom-left
   c. Mark cells as occupied
   d. Repeat from step 2 until no empty cells
4. New bins get: active category, layer height, no label
```

### Priorities
- Bins that don't need splitting (<= maxPrintSize)
- Larger bins over smaller (fewer total)
- Bottom-left placement within region

## Split Logic (Greedy Recursive)

When bin exceeds maxPrintSize:

1. If width > max: split into ceil(w/2) and floor(w/2)
2. If depth > max: split into ceil(d/2) and floor(d/2)
3. Recursively apply until all pieces fit

### Examples
- 5x3 with max 4 -> 3x3 + 2x3 (2 pieces)
- 9x3 with max 4 -> 5x3 + 4x3 -> 3x3 + 2x3 + 4x3 (3 pieces)
- 5x6 with max 4 -> 3x3, 2x3, 3x3, 2x3 (4 pieces)

## File Structure Suggestion

```
src/
  components/     # UI components
  hooks/          # Custom hooks (useHistory, useGridCoords, etc.)
  utils/          # Pure functions (validation, calculations)
  types/          # TypeScript types
  constants/      # Default categories, grid sizes, etc.
```

## Technical Considerations

### Framework
Prototype used vanilla React via CDN. For production consider:
- Proper React setup with build tooling
- Lighter framework if bundle size matters
- Keep it simple if dependencies don't add value

### State Management
Consider:
- Whether a state library adds value
- Immer for immutable updates
- Structure for efficient drag updates

### Rendering
Options:
- Canvas for large grid performance
- SVG for resolution independence
- CSS Grid (probably fine for typical sizes)

### Testing
- Unit tests for bin placement validation
- Unit tests for print list calculations
- E2E tests for critical flows (create, move, export)
