---
active: true
iteration: 1
max_iterations: 15
completion_promise: "DONE"
started_at: "2026-01-08T07:35:49Z"
---

Consolidate multiple useUIStore and useLayoutStore selector calls into single calls using useShallow from zustand/shallow. Focus on components with 4+ store calls: Grid/index.tsx, GridCanvas.tsx, RightPanel.tsx, Header.tsx, Sidebar/index.tsx, ActiveLayerPanel.tsx. Output <promise>DONE</promise> when npm run build passes.
