import { useState } from 'react';
import { useLayoutStore, useUIStore, useUndoableAction } from '../../store';
import { useToastStore } from '../../store/toast';
import { ConfirmDialog } from '../modals/ConfirmDialog';

export function ActiveLayerPanel() {
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [rotateRectangles, setRotateRectangles] = useState(false);
  const layout = useLayoutStore(state => state.layout);
  const activeLayerId = useUIStore(state => state.activeLayerId);
  const activeCategoryId = useUIStore(state => state.activeCategoryId);
  const paintSize = useUIStore(state => state.paintSize);
  const togglePaintSize = useUIStore(state => state.togglePaintSize);

  const fillLayer = useLayoutStore(state => state.fillLayer);
  const fillLayerGaps = useLayoutStore(state => state.fillLayerGaps);
  const clearLayer = useLayoutStore(state => state.clearLayer);
  const setSelectedBins = useUIStore(state => state.setSelectedBins);
  const addToast = useToastStore(state => state.addToast);

  const { execute } = useUndoableAction();

  const isPaintActive = (w: number, d: number) =>
    paintSize?.width === w && paintSize?.depth === d;

  const activeLayer = layout.layers.find(l => l.id === activeLayerId);
  const layerBins = layout.bins.filter(b => b.layerId === activeLayerId);
  const binCount = layerBins.length;

  // Calculate coverage for Fill Gaps button state
  const totalCells = layout.drawer.width * layout.drawer.depth;
  const coveredCells = layerBins.reduce((sum, b) => sum + b.width * b.depth, 0);
  const coverage = totalCells > 0 ? Math.round((coveredCells / totalCells) * 100) : 0;

  const handleFill = (width: number, depth: number) => {
    if (!activeLayerId) return;
    const beforeCount = layerBins.length;
    execute(() => {
      fillLayer(activeLayerId, width, depth, activeCategoryId);
    });
    // Count will be updated after state change, so use a timeout
    setTimeout(() => {
      const afterCount = useLayoutStore.getState().layout.bins.filter(b => b.layerId === activeLayerId).length;
      const added = afterCount - beforeCount;
      if (added > 0) {
        addToast(`Added ${added} ${width}×${depth} bins`, 'success');
      }
    }, 0);
  };

  const handleFillGaps = () => {
    if (!activeLayerId) return;
    const beforeCount = layerBins.length;
    execute(() => {
      fillLayerGaps(activeLayerId, activeCategoryId);
    });
    setTimeout(() => {
      const afterCount = useLayoutStore.getState().layout.bins.filter(b => b.layerId === activeLayerId).length;
      const added = afterCount - beforeCount;
      if (added > 0) {
        addToast(`Filled ${added} gaps with 1×1 bins`, 'success');
      }
    }, 0);
  };

  const handleClear = () => {
    if (!activeLayerId || layerBins.length === 0) return;
    const count = layerBins.length;
    execute(() => {
      clearLayer(activeLayerId);
      setSelectedBins([]);
    });
    addToast(`Cleared ${count} bins from layer`, 'success');
  };

  if (!activeLayer) return null;

  return (
    <div
      className="panel"
      style={{
        padding: 'var(--space-lg)',
      }}
    >
      {/* Bin Palette header */}
      <h2 className="section-header" style={{ margin: 0, marginBottom: 'var(--space-md)' }}>
        Bin Palette
      </h2>

      {/* Bin size grid - organized by shape */}
      <div className="space-y-3">
        {/* Squares row */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginBottom: '6px' }}>Squares</div>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map(size => {
              const isActive = isPaintActive(size, size);
              return (
                <button
                  key={`${size}×${size}`}
                  onClick={() => togglePaintSize({ width: size, depth: size })}
                  onDoubleClick={() => handleFill(size, size)}
                  className={`btn flex-1 flex flex-col items-center justify-center gap-0.5 ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: 0, height: '44px', padding: '4px' }}
                  aria-label={`${isActive ? 'Deselect' : 'Select'} ${size}×${size} for painting`}
                  title={`Click to paint ${size}×${size} bins. Double-click to fill layer.`}
                >
                  <div
                    style={{
                      width: `${6 + size * 2}px`,
                      height: `${6 + size * 2}px`,
                      backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : '#94a3b8',
                      borderRadius: '2px',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: isActive ? 'inherit' : 'var(--text-tertiary)' }}>{size}×{size}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Rectangles - organized by width */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--text-disabled)', marginBottom: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Rectangles</span>
            <button
              onClick={() => setRotateRectangles(!rotateRectangles)}
              className={`btn ${rotateRectangles ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '2px 6px', fontSize: '9px', display: 'flex', alignItems: 'center', gap: '3px' }}
              aria-label={rotateRectangles ? 'Show vertical rectangles' : 'Show horizontal rectangles'}
              title={rotateRectangles ? 'Vertical (taller)' : 'Horizontal (wider)'}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 0 0-9-9M3 12a9 9 0 0 1 9-9M21 12a9 9 0 0 1-9 9M3 12a9 9 0 0 0 9 9" />
                <polyline points="16 3 21 3 21 8" />
                <polyline points="8 21 3 21 3 16" />
              </svg>
              {rotateRectangles ? 'Wide' : 'Tall'}
            </button>
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[
              [1,2], [1,3], [1,4], [1,5], [1,6],
              [2,3], [2,4], [2,5], [2,6],
              [3,4], [3,5], [3,6],
              [4,5], [4,6],
              [5,6],
            ].map(([baseW, baseD]) => {
              // When rotated, swap width and depth to make horizontal rectangles
              const w = rotateRectangles ? baseD : baseW;
              const d = rotateRectangles ? baseW : baseD;
              const isActive = isPaintActive(w, d);
              return (
                <button
                  key={`${w}×${d}`}
                  onClick={() => togglePaintSize({ width: w, depth: d })}
                  onDoubleClick={() => handleFill(w, d)}
                  className={`btn flex flex-col items-center justify-center gap-0.5 ${isActive ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ minWidth: 0, height: '44px', padding: '4px' }}
                  aria-label={`${isActive ? 'Deselect' : 'Select'} ${w}×${d} for painting`}
                  title={`Click to paint ${w}×${d} bins. Double-click to fill layer.`}
                >
                  <div
                    style={{
                      width: `${6 + w * 2}px`,
                      height: `${6 + d * 2}px`,
                      backgroundColor: isActive ? 'rgba(0,0,0,0.3)' : '#94a3b8',
                      borderRadius: '2px',
                    }}
                  />
                  <span style={{ fontSize: '9px', color: isActive ? 'inherit' : 'var(--text-tertiary)' }}>{w}×{d}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Fill Gaps and Clear */}
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleFillGaps}
          disabled={coverage === 100}
          className="btn flex-1 justify-center"
          style={{
            background: coverage === 100
              ? 'var(--bg-disabled)'
              : 'linear-gradient(180deg, var(--color-success) 0%, #16a34a 100%)',
            color: coverage === 100 ? 'var(--text-disabled)' : '#fff',
          }}
          aria-label="Fill gaps with 1×1 bins"
          title="Fill remaining empty cells with 1×1 bins"
        >
          Fill Gaps
        </button>
        <button
          onClick={() => setShowClearConfirm(true)}
          disabled={layerBins.length === 0}
          className="btn btn-danger flex-1 justify-center"
          aria-label={`Clear all ${layerBins.length} bins from layer`}
          title="Remove all bins from this layer"
        >
          Clear
        </button>
      </div>

      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Layer"
        message={`Are you sure you want to remove all ${binCount} bin${binCount !== 1 ? 's' : ''} from "${activeLayer.name}"? This action can be undone.`}
        confirmText="Clear All"
        destructive
        onConfirm={handleClear}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
