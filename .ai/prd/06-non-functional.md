# Non-Functional Requirements

> Back to [PRD Index](./README.md)

## Performance

| Scenario | Target | Test Method |
|----------|--------|-------------|
| Idle render | <4ms per frame | Chrome DevTools |
| Drag/resize | <16ms per frame (60fps) | Automated simulation |
| Initial load | <100ms to interactive | Lighthouse |
| Large grid (50x50, 200 bins) | <16ms drag, <50ms re-render | Benchmark |
| Undo/redo | <50ms state restore | Unit test |
| JSON import (500 bins) | <200ms parse + validate | Unit test |
| Auto-save | <100ms serialize | Unit test |

### Test Grid Configurations
- **Small:** 10x10, 20 bins (typical use)
- **Medium:** 7x12, 30 bins (IKEA Alex)
- **Large:** 30x20, 100 bins (stress test)
- **Maximum:** 50x50, 200 bins (edge case)

## Compatibility

- **Browsers:** Chrome, Firefox, Safari, Edge (modern versions)
- **Minimum viewport:** 1024px (tablet landscape)
- **Touch support:** M4 nice-to-have

## Data Storage

- No backend - all client-side
- localStorage for persistence
- JSON export for portability

### Storage Scope
- **Persisted:** Layout object (JSON schema)
- **Session-only:** zoom, activeLayerId, selectedBinId, showOtherLayers
- **On page load:** first layer active, no selection, 100% zoom

### Storage Budget

| Item | Size | Notes |
|------|------|-------|
| Layout metadata | ~200 bytes | name, version, drawer |
| Per category | ~80 bytes | id, name, color |
| Per layer | ~60 bytes | id, name, height |
| Per bin | ~150 bytes | all properties |
| Typical (50 bins) | ~10 KB | Well within limits |
| Maximum (500 bins) | ~80 KB | Still safe |
| localStorage limit | ~5 MB | Browser-dependent |

**Warning at 80% capacity:** "Storage nearly full. Consider exporting."

## Accessibility

### M1 (Required for Launch)
- **Focus indicators:** visible `:focus-visible` ring (2px amber)
- **Semantic HTML:** `<button>`, `<input>`, proper headings
- **Keyboard operability:** Tab navigation, Enter/Space activation
- **Color contrast:** 4.5:1 text, 3:1 UI (WCAG AA)
- **Input labels:** all fields have labels (visible or aria-label)

### M3 (Enhanced)
- **ARIA labels:** grid, bins, layer buttons
- **Live regions:** announce bin creation/deletion, errors
- **Skip links:** "Skip to grid" for keyboard users

### M4 (Advanced)
- **Color-blind support:** icons/patterns per category
- **Keyboard grid navigation:** full cursor mode
- **Screen reader optimization:** drag announcements

## Internationalization (i18n)

**Current scope:** English only. Structure for future localization.

### M1-M3 (Preparation)
- Extract strings to constants file
- Use template literals: `${count} bins` not concatenation
- Avoid phrase concatenation (word order varies)
- Use `Intl.NumberFormat` for numbers
- Store dates as ISO 8601, display via `Intl.DateTimeFormat`

### M4+ (If Needed)
- Add i18n library (i18next, FormatJS)
- Translation files per locale
- Language selector in settings
- RTL support if needed

### Strings to Externalize
- UI labels, buttons, tooltips
- Error messages and confirmations
- Toast notifications
- Help modal content
- Unit labels ("u", "mm")

## Telemetry & Analytics (M3+)

### Privacy Principles
- No PII (names, emails, IPs)
- No layout content (labels, notes, names)
- Aggregate counts only
- Respect Do Not Track
- Self-hosted or privacy-focused service (Plausible)

### Events to Track

| Event | Data | Purpose |
|-------|------|---------|
| session_start | viewport_size, referrer_domain | Demographics |
| layout_created | drawer_dims, layer_count | Use cases |
| bin_created | method (draw/duplicate/quickfill) | Feature usage |
| export_used | format (json/image/url) | Preferences |
| import_used | source, success | Reliability |
| feature_used | feature_name | M4 prioritization |
| error_occurred | error_type, context | Bug detection |
| session_duration | bucket (1m/5m/15m/30m+) | Engagement |

### Implementation
- Defer until M3
- Lightweight library (<5KB)
- Batch events, send on idle/unload
- Graceful degradation if blocked
