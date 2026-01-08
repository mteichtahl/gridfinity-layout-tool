---
active: true
iteration: 1
max_iterations: 30
completion_promise: "DONE"
started_at: "2026-01-08T08:05:59Z"
---

Migrate inline styles to Tailwind classes using the @theme extension in index.css. Replace patterns like:
- style={{ color: 'var(--text-primary)' }} → className="text-text-primary"
- style={{ color: 'var(--text-secondary)' }} → className="text-text-secondary"  
- style={{ color: 'var(--text-tertiary)' }} → className="text-text-tertiary"
- style={{ color: 'var(--text-disabled)' }} → className="text-text-disabled"
- style={{ color: 'var(--color-error)' }} → className="text-error"
- style={{ color: 'var(--color-primary)' }} → className="text-primary"
- style={{ backgroundColor: 'var(--bg-primary)' }} → className="bg-bg-primary"
- style={{ backgroundColor: 'var(--bg-elevated)' }} → className="bg-bg-elevated"
- style={{ backgroundColor: 'var(--overlay-dark)' }} → className="bg-overlay-dark"
Merge with existing className when present. Remove STYLES constants and CSSProperties imports when no longer needed. Output <promise>DONE</promise> when npm run build passes and no more inline color/backgroundColor styles using CSS variables remain.
