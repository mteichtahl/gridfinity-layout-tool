import { useUIStore, useLayoutStore } from '../../store';
import { CONSTRAINTS } from '../../constants';

interface MobileGridToolbarProps {
  onFitToScreen: () => void;
}

/**
 * Simplified toolbar for mobile grid view.
 * Shows layer indicator, paint mode, and basic zoom.
 */
export function MobileGridToolbar({ onFitToScreen }: MobileGridToolbarProps) {
  const zoom = useUIStore(state => state.zoom);
  const zoomIn = useUIStore(state => state.zoomIn);
  const zoomOut = useUIStore(state => state.zoomOut);
  const activeLayerId = useUIStore(state => state.activeLayerId);
  const paintSize = useUIStore(state => state.paintSize);
  const setPaintSize = useUIStore(state => state.setPaintSize);
  const toggleMobilePanel = useUIStore(state => state.toggleMobilePanel);

  const layers = useLayoutStore(state => state.layout.layers);
  const activeLayer = layers.find(l => l.id === activeLayerId);

  const canZoomOut = zoom > CONSTRAINTS.ZOOM_MIN;
  const canZoomIn = zoom < CONSTRAINTS.ZOOM_MAX;

  return (
    <div
      className="flex items-center justify-between px-3 py-2 flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      {/* Left: Layer indicator (tappable) */}
      <button
        onClick={() => toggleMobilePanel('layers')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0"
          style={{ backgroundColor: 'var(--color-primary)' }}
        />
        <span
          className="font-medium truncate max-w-[80px]"
          style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
        >
          {activeLayer?.name || 'Layer'}
        </span>
        <svg className="w-3 h-3 flex-shrink-0" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Center: Paint mode indicator (if active) */}
      {paintSize && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            backgroundColor: 'var(--color-primary-muted)',
            border: '1px solid var(--color-primary)',
          }}
        >
          <svg className="w-4 h-4" style={{ color: 'var(--color-primary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span
            className="font-medium"
            style={{ fontSize: 'var(--text-sm)', color: 'var(--color-primary)' }}
          >
            {paintSize.width}×{paintSize.depth}
          </span>
          <button
            onClick={() => setPaintSize(null)}
            className="p-1 rounded"
            style={{ color: 'var(--color-primary)' }}
            aria-label="Exit paint mode"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Right: Zoom controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={zoomOut}
          disabled={!canZoomOut}
          className="btn btn-secondary w-10 h-10 p-0"
          aria-label="Zoom out"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={onFitToScreen}
          className="btn btn-secondary px-3 h-10"
          aria-label="Fit to screen"
        >
          <span className="text-sm font-medium">{Math.round(zoom * 100)}%</span>
        </button>
        <button
          onClick={zoomIn}
          disabled={!canZoomIn}
          className="btn btn-secondary w-10 h-10 p-0"
          aria-label="Zoom in"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>
    </div>
  );
}
