import { useState } from 'react';
import { useUIStore, useLayoutStore, useUndoableAction } from '../../store';
import { STAGING_ID, CONSTRAINTS, calcMaxGridUnits } from '../../constants';
import { getLayerZStart } from '../../utils/collision';
import { ConfirmDialog } from '../modals/ConfirmDialog';

/**
 * Mobile-optimized bin inspector with large touch targets.
 */
export function MobileInspector() {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const selectedBinIds = useUIStore(state => state.selectedBinIds);
  const setSelectedBins = useUIStore(state => state.setSelectedBins);
  const closeMobilePanel = useUIStore(state => state.closeMobilePanel);

  const layout = useLayoutStore(state => state.layout);
  const updateBin = useLayoutStore(state => state.updateBin);
  const deleteBin = useLayoutStore(state => state.deleteBin);
  const moveBinToStaging = useLayoutStore(state => state.moveBinToStaging);

  const { execute } = useUndoableAction();

  const selectedBins = layout.bins.filter(b => selectedBinIds.includes(b.id));
  const isMultiSelect = selectedBins.length > 1;
  const bin = selectedBins.length === 1 ? selectedBins[0] : null;
  const category = bin ? layout.categories.find(c => c.id === bin.category) : null;
  const layer = bin ? layout.layers.find(l => l.id === bin.layerId) : null;

  const maxGridUnits = calcMaxGridUnits(layout.printBedSize, layout.gridUnitMm);

  // Calculate max height
  const maxBinHeight = bin && layer
    ? layout.drawer.height - getLayerZStart(bin.layerId, layout.layers)
    : 1;

  const handleUpdateBin = (field: string, value: string | number) => {
    if (!bin) return;
    execute(() => {
      if (field === 'width' || field === 'depth') {
        updateBin(bin.id, { [field]: Math.max(1, parseInt(value as string, 10) || 1) });
      } else if (field === 'height') {
        const minHeight = layer?.height || 1;
        const newHeight = Math.max(minHeight, Math.min(maxBinHeight, typeof value === 'number' ? value : parseInt(value, 10) || minHeight));
        updateBin(bin.id, { height: newHeight });
      } else {
        updateBin(bin.id, { [field]: value });
      }
    });
  };

  const handleUpdateMultiCategory = (categoryId: string) => {
    execute(() => {
      for (const b of selectedBins) {
        updateBin(b.id, { category: categoryId });
      }
    });
  };

  const handleDeleteBin = () => {
    execute(() => {
      for (const b of selectedBins) {
        deleteBin(b.id);
      }
    });
    setSelectedBins([]);
    setConfirmDelete(false);
    closeMobilePanel();
  };

  const handleMoveToStaging = () => {
    execute(() => {
      for (const b of selectedBins) {
        moveBinToStaging(b.id);
      }
    });
    closeMobilePanel();
  };

  // Empty state
  if (selectedBins.length === 0) {
    return (
      <div className="py-6 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-elevated)' }}
        >
          <svg className="w-8 h-8" style={{ color: 'var(--text-disabled)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
        </div>
        <p className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>No bin selected</p>
        <p className="text-sm mb-4" style={{ color: 'var(--text-disabled)' }}>
          Tap a bin on the grid to edit it
        </p>

        {/* Creation hint */}
        <div
          className="mx-4 p-3 rounded-lg text-left"
          style={{ backgroundColor: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)' }}
        >
          <p className="text-sm font-medium mb-2" style={{ color: 'var(--text-secondary)' }}>
            How to create bins:
          </p>
          <ul className="text-sm space-y-1.5" style={{ color: 'var(--text-tertiary)' }}>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-primary)' }}>1.</span>
              <span>Tap and drag on empty grid cells to draw a bin</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-primary)' }}>2.</span>
              <span>Or use <strong>Layers</strong> tab to select a size, then tap to place</span>
            </li>
            <li className="flex items-start gap-2">
              <span style={{ color: 'var(--color-primary)' }}>3.</span>
              <span>Long-press a bin for quick actions</span>
            </li>
          </ul>
        </div>
      </div>
    );
  }

  // Multi-select
  if (isMultiSelect) {
    const commonCategory = selectedBins.every(b => b.category === selectedBins[0]?.category)
      ? selectedBins[0]?.category
      : null;

    return (
      <div className="pb-4">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg"
            style={{ backgroundColor: 'var(--color-primary)', color: '#000' }}
          >
            {selectedBins.length}
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
              {selectedBins.length} Bins Selected
            </h3>
            <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
              Move or delete together
            </p>
          </div>
        </div>

        {/* Category selector */}
        <div className="mb-4">
          <label
            className="block text-sm mb-2"
            style={{ color: 'var(--text-tertiary)' }}
          >
            Category
          </label>
          <select
            value={commonCategory || ''}
            onChange={(e) => handleUpdateMultiCategory(e.target.value)}
            className="input w-full h-12"
          >
            {!commonCategory && (
              <option value="" disabled>Mixed categories</option>
            )}
            {layout.categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {selectedBins.some(b => b.layerId !== STAGING_ID) && (
            <button onClick={handleMoveToStaging} className="btn btn-secondary flex-1">
              To Staging
            </button>
          )}
          <button onClick={() => setConfirmDelete(true)} className="btn btn-danger flex-1">
            Delete All
          </button>
        </div>

        <ConfirmDialog
          isOpen={confirmDelete}
          title="Delete Bins"
          message={`Delete ${selectedBins.length} selected bins?`}
          confirmText="Delete"
          destructive
          onConfirm={handleDeleteBin}
          onCancel={() => setConfirmDelete(false)}
        />
      </div>
    );
  }

  // Single bin - after early returns, bin is guaranteed to be non-null
  // TypeScript needs explicit guard since the early returns don't directly check `bin`
  if (!bin) return null;

  const needsSplit = bin.width > maxGridUnits || bin.depth > maxGridUnits;

  return (
    <div className="pb-4">
      {/* Bin header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-12 h-12 rounded-lg flex-shrink-0"
          style={{ backgroundColor: category?.color || '#6b7280' }}
        />
        <div>
          <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {bin.width}×{bin.depth} Bin
          </h3>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
            {layer?.name || 'Unknown layer'}
          </p>
        </div>
      </div>

      {/* Size controls */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Width
          </label>
          <div className="flex items-center">
            <button
              onClick={() => handleUpdateBin('width', bin.width - 1)}
              disabled={bin.width <= 1}
              className="btn btn-secondary w-12 h-12 p-0 rounded-r-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span
              className="flex-1 h-12 flex items-center justify-center font-semibold"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              {bin.width}
            </span>
            <button
              onClick={() => handleUpdateBin('width', bin.width + 1)}
              className="btn btn-secondary w-12 h-12 p-0 rounded-l-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
            Depth
          </label>
          <div className="flex items-center">
            <button
              onClick={() => handleUpdateBin('depth', bin.depth - 1)}
              disabled={bin.depth <= 1}
              className="btn btn-secondary w-12 h-12 p-0 rounded-r-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            <span
              className="flex-1 h-12 flex items-center justify-center font-semibold"
              style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
            >
              {bin.depth}
            </span>
            <button
              onClick={() => handleUpdateBin('depth', bin.depth + 1)}
              className="btn btn-secondary w-12 h-12 p-0 rounded-l-none"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Height control */}
      <div className="mb-4">
        <label className="block text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
          Height
        </label>
        <div className="flex items-center">
          <button
            onClick={() => handleUpdateBin('height', bin.height - 1)}
            disabled={bin.height <= (layer?.height ?? 1)}
            className="btn btn-secondary w-12 h-12 p-0 rounded-r-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span
            className="flex-1 h-12 flex items-center justify-center font-semibold"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-primary)' }}
          >
            {bin.height}u
          </span>
          <button
            onClick={() => handleUpdateBin('height', bin.height + 1)}
            disabled={bin.height >= maxBinHeight}
            className="btn btn-secondary w-12 h-12 p-0 rounded-l-none"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="text-center text-xs mt-1" style={{ color: 'var(--text-disabled)' }}>
          Range: {layer?.height}u – {maxBinHeight}u
        </div>
      </div>

      {/* Split warning */}
      {needsSplit && (
        <div
          className="flex items-center gap-2 p-3 rounded-lg mb-4"
          style={{
            backgroundColor: 'var(--color-warning-muted)',
            border: '1px solid var(--color-warning)',
            color: 'var(--color-warning)',
          }}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm">Will be split for printing</span>
        </div>
      )}

      {/* Category */}
      <div className="mb-4">
        <label className="block text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
          Category
        </label>
        <select
          value={bin.category}
          onChange={(e) => handleUpdateBin('category', e.target.value)}
          className="input w-full h-12"
        >
          {layout.categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Label */}
      <div className="mb-4">
        <label className="block text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
          Label
        </label>
        <input
          type="text"
          value={bin.label}
          onChange={(e) => handleUpdateBin('label', e.target.value.slice(0, CONSTRAINTS.LABEL_MAX_LENGTH))}
          className="input w-full h-12"
          placeholder="Optional label"
        />
      </div>

      {/* Notes */}
      <div className="mb-4">
        <label className="block text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
          Notes
        </label>
        <textarea
          value={bin.notes}
          onChange={(e) => handleUpdateBin('notes', e.target.value.slice(0, CONSTRAINTS.NOTES_MAX_LENGTH))}
          className="input w-full"
          placeholder="Optional notes"
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {bin.layerId !== STAGING_ID && (
          <button onClick={handleMoveToStaging} className="btn btn-secondary flex-1">
            To Staging
          </button>
        )}
        <button onClick={() => setConfirmDelete(true)} className="btn btn-danger flex-1">
          Delete
        </button>
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        title="Delete Bin"
        message={`Delete this ${bin?.width}×${bin?.depth} bin?`}
        confirmText="Delete"
        destructive
        onConfirm={handleDeleteBin}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
