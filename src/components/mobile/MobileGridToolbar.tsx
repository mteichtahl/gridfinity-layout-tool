import { useShallow } from 'zustand/shallow';
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
  const {
    zoom,
    zoomIn,
    zoomOut,
    activeLayerId,
    paintSize,
    setPaintSize,
    toggleMobilePanel,
  } = useUIStore(
    useShallow((state) => ({
      zoom: state.zoom,
      zoomIn: state.zoomIn,
      zoomOut: state.zoomOut,
      activeLayerId: state.activeLayerId,
      paintSize: state.paintSize,
      setPaintSize: state.setPaintSize,
      toggleMobilePanel: state.toggleMobilePanel,
    }))
  );

  const layers = useLayoutStore(state => state.layout.layers);
  const activeLayer = layers.find(l => l.id === activeLayerId);

  const canZoomOut = zoom > CONSTRAINTS.ZOOM_MIN;
  const canZoomIn = zoom < CONSTRAINTS.ZOOM_MAX;

  return (
    <div
      className="flex items-center justify-between px-3 py-2 flex-shrink-0 bg-surface-secondary border-b border-stroke-subtle"
    >
      {/* Left: Layer indicator (tappable) */}
      <button
        onClick={() => toggleMobilePanel('layers')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors bg-surface-elevated border border-stroke-subtle"
      >
        <div
          className="w-2 h-2 rounded-full flex-shrink-0 bg-accent"
        />
        <span
          className="font-medium truncate max-w-[80px] text-sm text-content"
        >
          {activeLayer?.name || 'Layer'}
        </span>
        <svg className="w-3 h-3 flex-shrink-0 text-content-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Center: Paint mode indicator (if active) */}
      {paintSize && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-accent"
          style={{
            backgroundColor: 'var(--color-primary-muted)',
          }}
        >
          <svg className="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span
            className="font-medium text-sm text-accent"
          >
            {paintSize.width}×{paintSize.depth}
          </span>
          <button
            onClick={() => setPaintSize(null)}
            className="p-1 rounded text-accent"
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
