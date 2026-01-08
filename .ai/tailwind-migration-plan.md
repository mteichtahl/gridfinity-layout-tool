# Tailwind CSS Variable Migration Plan

## Goal
Replace inline styles using CSS variables with Tailwind utility classes by extending the Tailwind v4 theme.

## Current State
- ~200 inline `style={{}}` using CSS variables like `var(--text-tertiary)`
- CSS variables defined in `:root` in `index.css`
- Many components have `STYLES` constants as intermediate step
- Tailwind v4 uses CSS-first config (`@theme` directive)

## Migration Strategy

### Phase 1: Extend Tailwind Theme
Add `@theme` block to `index.css` mapping CSS variables to Tailwind utilities:

```css
@theme {
  /* Text colors */
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-text-tertiary: var(--text-tertiary);
  --color-text-disabled: var(--text-disabled);

  /* Background colors */
  --color-bg-primary: var(--bg-primary);
  --color-bg-secondary: var(--bg-secondary);
  --color-bg-elevated: var(--bg-elevated);
  --color-bg-hover: var(--bg-hover);

  /* Border colors */
  --color-border-subtle: var(--border-subtle);
  --color-border-default: var(--border-default);

  /* Semantic colors */
  --color-primary: var(--color-primary);
  --color-success: var(--color-success);
  --color-warning: var(--color-warning);
  --color-error: var(--color-error);
  --color-danger: var(--color-danger);

  /* Overlay colors */
  --color-overlay-light: var(--overlay-light);
  --color-overlay-medium: var(--overlay-medium);
  --color-overlay-dark: var(--overlay-dark);
}
```

### Phase 2: Migrate Text Colors
Replace patterns like:
- `style={{ color: 'var(--text-primary)' }}` → `className="text-text-primary"`
- `style={{ color: 'var(--text-secondary)' }}` → `className="text-text-secondary"`
- `style={{ color: 'var(--text-tertiary)' }}` → `className="text-text-tertiary"`
- `style={{ color: 'var(--text-disabled)' }}` → `className="text-text-disabled"`
- `style={{ color: 'var(--color-error)' }}` → `className="text-error"`
- `style={{ color: 'var(--color-primary)' }}` → `className="text-primary"`

### Phase 3: Migrate Background Colors
Replace patterns like:
- `style={{ backgroundColor: 'var(--bg-primary)' }}` → `className="bg-bg-primary"`
- `style={{ backgroundColor: 'var(--bg-secondary)' }}` → `className="bg-bg-secondary"`
- `style={{ backgroundColor: 'var(--bg-elevated)' }}` → `className="bg-bg-elevated"`
- `style={{ backgroundColor: 'var(--overlay-dark)' }}` → `className="bg-overlay-dark"`

### Phase 4: Migrate Border Colors
Replace patterns like:
- `style={{ borderColor: 'var(--border-subtle)' }}` → `className="border-border-subtle"`
- `style={{ borderTop: '1px solid var(--border-subtle)' }}` → `className="border-t border-border-subtle"`

### Phase 5: Cleanup
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
