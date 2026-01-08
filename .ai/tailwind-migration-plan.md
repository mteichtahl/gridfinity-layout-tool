# Tailwind CSS Variable Migration Plan

## Goal
Replace inline styles using CSS variables with Tailwind utility classes by extending the Tailwind v4 theme.

## Current State
- ~200 inline `style={{}}` using CSS variables like `var(--text-tertiary)`
- CSS variables defined in `:root` in `index.css`
- Many components have `STYLES` constants as intermediate step
- Tailwind v4 uses CSS-first config (`@theme` directive)

## Migration Strategy

### Phase 1: Extend Tailwind Theme (COMPLETED)
Added `@theme` block to `index.css` with semantic naming to avoid redundant class names:

```css
@theme {
  /* Surface colors (backgrounds) - use as bg-surface, bg-surface-secondary, etc. */
  --color-surface: var(--bg-primary);
  --color-surface-secondary: var(--bg-secondary);
  --color-surface-elevated: var(--bg-elevated);
  --color-surface-hover: var(--bg-hover);
  --color-surface-active: var(--bg-active);

  /* Content colors (text) - use as text-content, text-content-secondary, etc. */
  --color-content: var(--text-primary);
  --color-content-secondary: var(--text-secondary);
  --color-content-tertiary: var(--text-tertiary);
  --color-content-disabled: var(--text-disabled);
  --color-on-light: var(--text-on-light);
  --color-on-dark: var(--text-on-dark);

  /* Stroke colors (borders) - use as border-stroke, border-stroke-subtle, etc. */
  --color-stroke: var(--border-default);
  --color-stroke-subtle: var(--border-subtle);
  --color-stroke-strong: var(--border-strong);

  /* Semantic colors - use as text-success, bg-error, etc. */
  --color-success, --color-warning, --color-error, --color-danger, --color-info;
  --color-accent: var(--color-primary);  /* Primary action color */
}
```

### Phase 2: Migrate Inline Styles
Replace patterns using semantic class names:

**Text colors:**
- `style={{ color: 'var(--text-primary)' }}` → `className="text-content"`
- `style={{ color: 'var(--text-secondary)' }}` → `className="text-content-secondary"`
- `style={{ color: 'var(--text-tertiary)' }}` → `className="text-content-tertiary"`
- `style={{ color: 'var(--text-disabled)' }}` → `className="text-content-disabled"`
- `style={{ color: 'var(--color-error)' }}` → `className="text-error"`
- `style={{ color: 'var(--color-primary)' }}` → `className="text-accent"`

**Background colors:**
- `style={{ backgroundColor: 'var(--bg-primary)' }}` → `className="bg-surface"`
- `style={{ backgroundColor: 'var(--bg-secondary)' }}` → `className="bg-surface-secondary"`
- `style={{ backgroundColor: 'var(--bg-elevated)' }}` → `className="bg-surface-elevated"`
- `style={{ backgroundColor: 'var(--overlay-dark)' }}` → `className="bg-overlay-dark"`

**Border colors:**
- `style={{ borderColor: 'var(--border-subtle)' }}` → `className="border-stroke-subtle"`
- `style={{ borderTop: '1px solid var(--border-subtle)' }}` → `className="border-t border-stroke-subtle"`

### Phase 3: Cleanup
- Remove unused `STYLES` constants from components
- Remove unused `CSSProperties` imports
- Verify build passes

## Files to Modify (by inline style count)
1. src/components/Sidebar/LayersPanel.tsx (15)
2. src/components/mobile/MobileLayersPanel.tsx (13)
3. src/components/mobile/BinContextMenu.tsx (13)
4. src/components/Staging.tsx (12)
5. src/components/Sidebar/ActiveLayerPanel.tsx (12)
6. src/components/Grid/index.tsx (12)
7. src/components/RightPanel.tsx (10)
8. src/components/Sidebar/CategoriesPanel.tsx (10)
9. src/components/Grid/Overlay.tsx (10)
10. src/components/Grid/Bin.tsx (9)
11. src/components/DropZones.tsx (9)
12. src/components/mobile/MobileGridToolbar.tsx (9)
... and more

## Validation
After each phase:
1. Run `npm run build` - must pass
2. Run `npm run test:run` - must pass
3. Visual check in browser for styling regressions
