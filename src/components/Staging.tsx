import { useMemo, useState } from 'react';
import { useLayoutStore, useUIStore, useUndoableAction } from '../store';
import { useToastStore } from '../store/toast';
import { STAGING_ID, BASE_CELL_SIZE } from '../constants';
import { getContrastColor } from '../utils/color';
import { ConfirmDialog } from './modals/ConfirmDialog';

interface PackedBin {
  id: string;
  x: number; // Position in staging grid
  y: number;
  width: number;
  depth: number;
  height: number;
  category: string;
  label: string;
}

/**
 * Auto-pack bins into staging grid (simple left-to-right, bottom-up packing)
 */
function packBins(bins: PackedBin[], gridWidth: number): PackedBin[] {
  if (bins.length === 0) return [];

  const packed: PackedBin[] = [];
  const occupied = new Set<string>();

  const isOccupied = (x: number, y: number, w: number, d: number): boolean => {
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < d; dy++) {
        if (occupied.has(`${x + dx},${y + dy}`)) return true;
      }
    }
    return false;
  };

  const occupy = (x: number, y: number, w: number, d: number) => {
    for (let dx = 0; dx < w; dx++) {
      for (let dy = 0; dy < d; dy++) {
        occupied.add(`${x + dx},${y + dy}`);
      }
    }
  };

  // Sort by area (largest first) for better packing
  const sortedBins = [...bins].sort((a, b) => (b.width * b.depth) - (a.width * a.depth));

  for (const bin of sortedBins) {
    let placed = false;
    // Try to place at each position, scanning left-to-right, bottom-to-top
    for (let y = 0; y < 50 && !placed; y++) {
      for (let x = 0; x <= gridWidth - bin.width && !placed; x++) {
        if (!isOccupied(x, y, bin.width, bin.depth)) {
          packed.push({ ...bin, x, y });
          occupy(x, y, bin.width, bin.depth);
          placed = true;
        }
      }
    }
  }

  return packed;
}

/**
 * Staging area with grid visualization for temporarily holding bins.
 * Bins are displayed at actual scale, matching the main grid.
 */
export function Staging() {
  const layout = useLayoutStore(state => state.layout);
  const deleteBin = useLayoutStore(state => state.deleteBin);
  const zoom = useUIStore(state => state.zoom);
  const interaction = useUIStore(state => state.interaction);
  const setInteraction = useUIStore(state => state.setInteraction);
  const { execute } = useUndoableAction();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  const stagingBins = useMemo(() =>
    layout.bins.filter(bin => bin.layerId === STAGING_ID),
    [layout.bins]
  );

  const cellSize = Math.round(BASE_CELL_SIZE * zoom);
  const gap = 1;
  const gridWidth = layout.drawer.width; // Match main drawer width

  // Pack bins and calculate required height
  const packedBins = useMemo(() => {
    const bins = stagingBins.map(b => ({
      id: b.id,
      x: 0,
      y: 0,
      width: b.width,
      depth: b.depth,
      height: b.height,
      category: b.category,
      label: b.label,
    }));
    return packBins(bins, gridWidth);
  }, [stagingBins, gridWidth]);

  // Calculate required grid height (minimum 2 rows when bins present, 1 when empty)
  const gridHeight = useMemo(() => {
    if (packedBins.length === 0) return 1;
    const maxY = Math.max(...packedBins.map(b => b.y + b.depth));
    return Math.max(2, maxY);
  }, [packedBins]);

  const getCategory = (categoryId: string) =>
    layout.categories.find(c => c.id === categoryId);

  const handleBinPointerDown = (binId: string, e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    setInteraction({
      type: 'stagingDrag',
      binId,
      currentCoord: null,
      valid: false,
    });
  };

  const handleClearStaging = () => {
    const count = stagingBins.length;
    execute(() => {
      for (const bin of stagingBins) {
        deleteBin(bin.id);
      }
    });
    setShowClearConfirm(false);
    addToast(`Deleted ${count} staged bins`, 'success');
  };

  const isDraggingStagingBin = interaction?.type === 'stagingDrag';
  const draggingBinId = isDraggingStagingBin ? interaction.binId : null;

  // Generate grid cells for visual reference
  const cells: React.JSX.Element[] = [];
  for (let y = gridHeight - 1; y >= 0; y--) {
    for (let x = 0; x < gridWidth; x++) {
      cells.push(
        <div
          key={`staging-${x}-${y}`}
          style={{
            gridColumn: x + 1,
            gridRow: gridHeight - y,
            width: cellSize,
            height: cellSize,
            backgroundColor: 'var(--staging-cell)',
            borderRadius: '2px',
          }}
        />
      );
    }
  }

  // Don't render anything if no bins are staged
  if (stagingBins.length === 0) {
    return null;
  }

  return (
    <div
      className="px-4 py-3 overflow-x-auto"
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        borderTop: '2px dashed var(--border-default)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4"
            style={{ color: 'var(--text-tertiary)' }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', fontWeight: 'var(--font-medium)' }}>
            Staging
          </span>
          <span
            className="px-1.5 py-0.5 rounded"
            style={{
              fontSize: 'var(--text-xs)',
              backgroundColor: 'var(--bg-hover)',
              color: 'var(--text-tertiary)',
            }}
          >
            {stagingBins.length} {stagingBins.length === 1 ? 'bin' : 'bins'}
          </span>
        </div>

        <button
          onClick={() => setShowClearConfirm(true)}
          className="btn btn-ghost flex items-center gap-1.5"
          style={{
            padding: '4px 8px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-tertiary)',
          }}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Clear All
        </button>
      </div>

      {/* Staging Grid */}
      <div
        className="relative inline-block rounded-lg"
        style={{
          width: gridWidth * (cellSize + gap) + gap,
          height: gridHeight * (cellSize + gap) + gap,
          backgroundColor: 'var(--staging-bg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* CSS Grid container */}
        <div
          className="absolute inset-0"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridWidth}, ${cellSize}px)`,
            gridTemplateRows: `repeat(${gridHeight}, ${cellSize}px)`,
            gap: `${gap}px`,
            padding: `${gap}px`,
          }}
        >
          {/* Grid cells */}
          {cells}

          {/* Staged bins */}
          {packedBins.map((bin) => {
            const category = getCategory(bin.category);
            const bgColor = category?.color || '#6b7280';
            const textColor = getContrastColor(bgColor);
            const isDragging = bin.id === draggingBinId;

            return (
              <div
                key={bin.id}
                data-staging-bin-id={bin.id}
                className="relative flex flex-col items-center justify-center transition-all duration-150 cursor-move"
                style={{
                  touchAction: 'none',
                  gridColumn: `${bin.x + 1} / span ${bin.width}`,
                  gridRow: `${gridHeight - bin.y - bin.depth + 1} / span ${bin.depth}`,
                  backgroundColor: bgColor,
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-on-color)',
                  opacity: isDragging ? 0.3 : 1,
                  pointerEvents: isDragging ? 'none' : 'auto',
                  boxShadow: 'var(--shadow-sm)',
                  zIndex: 10,
                }}
                onPointerDown={(e) => handleBinPointerDown(bin.id, e)}
                title={`${bin.label || 'Unlabeled'} — ${bin.width}×${bin.depth}×${bin.height}u\nDrag to place on grid`}
              >
                {/* Size label */}
                <div
                  className="text-center pointer-events-none select-none"
                  style={{ color: textColor }}
                >
                  <div
                    className="text-sm font-semibold"
                    style={{ textShadow: 'var(--shadow-sm)' }}
                  >
                    {bin.width}×{bin.depth}
                  </div>
                  {bin.label && (
                    <div
                      className="text-xs truncate px-1"
                      style={{ opacity: 0.85, maxWidth: '100%' }}
                    >
                      {bin.label}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Clear confirmation dialog */}
      <ConfirmDialog
        isOpen={showClearConfirm}
        title="Clear Staging"
        message={`Delete all ${stagingBins.length} staged bins? This cannot be undone.`}
        confirmText="Clear All"
        destructive
        onConfirm={handleClearStaging}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
