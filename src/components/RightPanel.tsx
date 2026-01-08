import React, { useState, useMemo } from 'react';
import { useUIStore, useLayoutStore, useUndoableAction } from '../store';
import { STAGING_ID, CONSTRAINTS, calcMaxGridUnits } from '../constants';
import { generatePrintList, getTotalBins, getTotalPieces, getTotalFilament, getSpoolEstimate } from '../utils/split';
import { getLayerZStart } from '../utils/collision';
import { exportPrintListTSV } from '../utils/storage';
import { ConfirmDialog } from './modals/ConfirmDialog';
import type { PrintPiece } from '../types';

/**
 * Visual preview of how a bin will be split for printing.
 * Shows a grid diagram with the split pieces.
 */
function SplitPreview({ width, depth, pieces }: { width: number; depth: number; pieces: PrintPiece[] }) {
  // Create a 2D grid to place pieces
  const grid: (PrintPiece | null)[][] = Array.from({ length: depth }, () =>
    Array.from({ length: width }, () => null)
  );

  // Place pieces using greedy left-to-right, bottom-to-top
  const placedPieces: Array<{ piece: PrintPiece; x: number; y: number }> = [];
  const piecesToPlace = pieces.flatMap(p => Array(p.count).fill({ width: p.width, depth: p.depth }));

  for (const piece of piecesToPlace) {
    // Find first available position
    outer: for (let y = 0; y < depth; y++) {
      for (let x = 0; x < width; x++) {
        // Check if piece fits at this position
        let fits = true;
        if (x + piece.width > width || y + piece.depth > depth) {
          fits = false;
        } else {
          for (let py = y; py < y + piece.depth && fits; py++) {
            for (let px = x; px < x + piece.width && fits; px++) {
              if (grid[py][px] !== null) fits = false;
            }
          }
        }

        if (fits) {
          // Place the piece
          for (let py = y; py < y + piece.depth; py++) {
            for (let px = x; px < x + piece.width; px++) {
              grid[py][px] = piece;
            }
          }
          placedPieces.push({ piece, x, y });
          break outer;
        }
      }
    }
  }

  const cellSize = 16;
  const gap = 2;

  return (
    <div
      className="relative"
      style={{
        width: width * cellSize + (width - 1) * gap,
        height: depth * cellSize + (depth - 1) * gap,
      }}
    >
      {placedPieces.map((placed, i) => (
        <div
          key={i}
          className="absolute flex items-center justify-center"
          style={{
            left: placed.x * (cellSize + gap),
            bottom: placed.y * (cellSize + gap),
            width: placed.piece.width * cellSize + (placed.piece.width - 1) * gap,
            height: placed.piece.depth * cellSize + (placed.piece.depth - 1) * gap,
            backgroundColor: 'var(--color-primary-muted)',
            border: '1px solid var(--color-primary)',
            borderRadius: '2px',
            fontSize: '9px',
            color: 'var(--text-secondary)',
          }}
        >
          {placed.piece.width}×{placed.piece.depth}
        </div>
      ))}
    </div>
  );
}

export function RightPanel() {
  const [confirmDelete, setConfirmDelete] = useState<{
    title: string;
    message: string;
  } | null>(null);
  const [printListExpanded, setPrintListExpanded] = useState(true);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [expandedSplitRow, setExpandedSplitRow] = useState<number | null>(null);

  const selectedBinIds = useUIStore(state => state.selectedBinIds);
  const setSelectedBins = useUIStore(state => state.setSelectedBins);
  const collapsed = useUIStore(state => state.rightPanelCollapsed);
  const toggle = useUIStore(state => state.toggleRightPanel);

  const layout = useLayoutStore(state => state.layout);
  const updateBin = useLayoutStore(state => state.updateBin);
  const deleteBin = useLayoutStore(state => state.deleteBin);
  const moveBinToStaging = useLayoutStore(state => state.moveBinToStaging);

  const { execute } = useUndoableAction();

  // Single selection vs multi-selection
  const selectedBins = layout.bins.filter(b => selectedBinIds.includes(b.id));
  const isMultiSelect = selectedBins.length > 1;
  const bin = selectedBins.length === 1 ? selectedBins[0] : null;
  const category = bin ? layout.categories.find(c => c.id === bin.category) : null;
  const layer = bin ? layout.layers.find(l => l.id === bin.layerId) : null;

  // Calculate max height for selected bin
  const maxBinHeight = bin && layer
    ? layout.drawer.height - getLayerZStart(bin.layerId, layout.layers)
    : 1;

  // Calculate max grid units from print bed size (accounting for gaps between bins)
  const maxGridUnits = calcMaxGridUnits(layout.printBedSize, layout.gridUnitMm);

  // Memoize print list calculation - expensive operation
  const printRows = useMemo(
    () => generatePrintList(layout.bins, maxGridUnits),
    [layout.bins, maxGridUnits]
  );
  const totalBins = useMemo(() => getTotalBins(printRows), [printRows]);
  const totalPieces = useMemo(() => getTotalPieces(printRows), [printRows]);
  const totalFilament = useMemo(() => getTotalFilament(printRows), [printRows]);
  const spoolEstimate = useMemo(() => getSpoolEstimate(totalFilament), [totalFilament]);
  const hasAnySplits = useMemo(() => printRows.some(r => r.needsSplit), [printRows]);

  const handleUpdateBin = (field: 'width' | 'depth' | 'height' | 'category' | 'label' | 'notes', value: string | number) => {
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
    if (selectedBins.length === 0) return;
    execute(() => {
      for (const b of selectedBins) {
        updateBin(b.id, { category: categoryId });
      }
    });
  };

  const handleDeleteBin = () => {
    if (selectedBins.length === 0) return;
    setConfirmDelete({
      title: selectedBins.length > 1 ? 'Delete Bins' : 'Delete Bin',
      message: selectedBins.length > 1
        ? `Delete ${selectedBins.length} selected bins?`
        : `Delete this ${bin?.width}×${bin?.depth} bin?`,
    });
  };

  const confirmDeleteBin = () => {
    if (selectedBins.length === 0) return;
    execute(() => {
      for (const b of selectedBins) {
        deleteBin(b.id);
      }
    });
    setSelectedBins([]);
    setConfirmDelete(null);
  };

  const handleMoveToStaging = () => {
    if (selectedBins.length === 0) return;
    execute(() => {
      for (const b of selectedBins) {
        moveBinToStaging(b.id);
      }
    });
  };

  const needsSplit = bin ? (bin.width > maxGridUnits || bin.depth > maxGridUnits) : false;

  if (collapsed) {
    return (
      <aside
        className="flex-shrink-0 flex flex-col transition-all duration-200 ease-in-out"
        style={{
          width: '40px',
          backgroundColor: 'var(--bg-secondary)',
          borderLeft: '1px solid var(--border-subtle)',
        }}
      >
        <div className="flex flex-col items-center pt-3">
          <button
            onClick={toggle}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Expand panel"
            aria-label="Expand right panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>
      </aside>
    );
  }

  const collapseButton = (
    <button
      onClick={toggle}
      className="flex-shrink-0 p-1 rounded transition-colors"
      style={{ color: 'var(--text-tertiary)' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
        e.currentTarget.style.color = 'var(--text-primary)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = 'var(--text-tertiary)';
      }}
      title="Collapse panel"
      aria-label="Collapse right panel"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
      </svg>
    </button>
  );

  return (
    <aside
      className="flex-shrink-0 flex flex-col h-full overflow-hidden transition-all duration-200 ease-in-out"
      style={{
        width: '288px',
        backgroundColor: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 py-3"
        style={{ borderBottom: '1px solid var(--border-subtle)' }}
      >
        {collapseButton}
        <h2
          style={{
            fontSize: 'var(--text-sm)',
            fontWeight: 'var(--font-semibold)',
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}
        >
          Inspector
        </h2>
      </div>

      {/* Selection Panel */}
      {isMultiSelect ? (
        /* Multi-selection panel */
        <div
          className="p-4 animate-fade-in"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-primary)', boxShadow: 'var(--shadow-sm)' }}
              aria-hidden="true"
            >
              <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#000' }}>{selectedBins.length}</span>
            </div>
            <h2 className="flex-1" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
              {selectedBins.length} Bins Selected
            </h2>
            <button
              onClick={() => setSelectedBins([])}
              className="btn btn-ghost w-7 h-7 p-0"
              style={{ minWidth: 'auto', minHeight: 'auto' }}
              aria-label="Deselect all bins"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-md)' }}>
            Drag to move all selected bins together, or use arrow keys to nudge.
          </p>

          {/* Category for multiple bins */}
          <div className="mb-3">
            <label
              className="block mb-1"
              style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
            >
              Category
            </label>
            <select
              value={
                // Show common category if all selected bins have the same one, otherwise empty
                selectedBins.every(b => b.category === selectedBins[0]?.category)
                  ? selectedBins[0]?.category || ''
                  : ''
              }
              onChange={(e) => handleUpdateMultiCategory(e.target.value)}
              className="input w-full"
              aria-label="Category for selected bins"
            >
              {!selectedBins.every(b => b.category === selectedBins[0]?.category) && (
                <option value="" disabled>Mixed categories</option>
              )}
              {layout.categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Actions for multiple bins */}
          <div className="flex gap-2">
            {selectedBins.some(b => b.layerId !== STAGING_ID) && (
              <button
                onClick={handleMoveToStaging}
                className="btn btn-secondary flex-1"
              >
                To Staging
              </button>
            )}
            <button
              onClick={handleDeleteBin}
              className="btn btn-danger flex-1"
            >
              Delete All
            </button>
          </div>
        </div>
      ) : bin ? (
        <div
          className="p-4 animate-fade-in"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <div
              className="w-5 h-5 rounded flex-shrink-0"
              style={{ backgroundColor: category?.color || '#6b7280', boxShadow: 'var(--shadow-sm)' }}
              aria-hidden="true"
            />
            <h2 className="flex-1" style={{ fontSize: 'var(--text-lg)', fontWeight: 'var(--font-semibold)', color: 'var(--text-primary)' }}>
              {bin.width}×{bin.depth} Bin
            </h2>
            <button
              onClick={() => setSelectedBins([])}
              className="btn btn-ghost w-7 h-7 p-0"
              style={{ minWidth: 'auto', minHeight: 'auto' }}
              aria-label="Deselect bin"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Size inputs */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block mb-1"
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
                >
                  Width
                </label>
                <input
                  type="number"
                  value={bin.width}
                  onChange={(e) => handleUpdateBin('width', e.target.value)}
                  className="input w-full"
                  min={1}
                  aria-label="Bin width"
                />
              </div>
              <div>
                <label
                  className="block mb-1"
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
                >
                  Depth
                </label>
                <input
                  type="number"
                  value={bin.depth}
                  onChange={(e) => handleUpdateBin('depth', e.target.value)}
                  className="input w-full"
                  min={1}
                  aria-label="Bin depth"
                />
              </div>
            </div>

            {/* Height control with +/- buttons */}
            <div>
              <label
                className="block mb-1"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
              >
                Height
              </label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleUpdateBin('height', bin.height - 1)}
                  disabled={bin.height <= (layer?.height ?? 1)}
                  className="btn btn-secondary w-10 h-10 p-0"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                  aria-label="Decrease height"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </button>
                <span
                  className="flex-1 text-center font-semibold"
                  style={{ fontSize: 'var(--text-lg)', color: 'var(--text-primary)' }}
                >
                  {bin.height}u
                </span>
                <button
                  onClick={() => handleUpdateBin('height', bin.height + 1)}
                  disabled={bin.height >= maxBinHeight}
                  className="btn btn-secondary w-10 h-10 p-0"
                  style={{ minWidth: '40px', minHeight: '40px' }}
                  aria-label="Increase height"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </button>
              </div>
              <div
                className="text-center mt-1"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}
              >
                Range: {layer?.height}u – {maxBinHeight}u
              </div>
            </div>

            {/* Split warning */}
            {needsSplit && (
              <div
                className="flex items-center gap-2 p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-warning-muted)',
                  border: '1px solid var(--color-warning)',
                  color: 'var(--color-warning)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Exceeds print bed — will be split into {Math.ceil(bin.width / maxGridUnits) * Math.ceil(bin.depth / maxGridUnits)} pieces</span>
              </div>
            )}

            {/* Category */}
            <div>
              <label
                className="block mb-1"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
              >
                Category
              </label>
              <select
                value={bin.category}
                onChange={(e) => handleUpdateBin('category', e.target.value)}
                className="input w-full"
                aria-label="Bin category"
              >
                {layout.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Label */}
            <div>
              <label
                className="block mb-1"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
              >
                Label
              </label>
              <input
                type="text"
                value={bin.label}
                onChange={(e) => handleUpdateBin('label', e.target.value.slice(0, CONSTRAINTS.LABEL_MAX_LENGTH))}
                className="input w-full"
                placeholder="Optional label"
                aria-label="Bin label"
              />
            </div>

            {/* Notes */}
            <div>
              <label
                className="block mb-1"
                style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
              >
                Notes
              </label>
              <textarea
                value={bin.notes}
                onChange={(e) => handleUpdateBin('notes', e.target.value.slice(0, CONSTRAINTS.NOTES_MAX_LENGTH))}
                className="input w-full"
                placeholder="Optional notes"
                aria-label="Bin notes"
                rows={3}
                style={{ resize: 'vertical', minHeight: '60px' }}
              />
              <div
                className="text-right mt-1"
                style={{ fontSize: '10px', color: 'var(--text-disabled)' }}
              >
                {bin.notes.length}/{CONSTRAINTS.NOTES_MAX_LENGTH}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              {bin.layerId !== STAGING_ID && (
                <button
                  onClick={handleMoveToStaging}
                  className="btn btn-secondary flex-1"
                >
                  To Staging
                </button>
              )}
              <button
                onClick={handleDeleteBin}
                className="btn btn-danger flex-1"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty state when no bin selected */
        <div className="p-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
          <div className="empty-state py-4">
            <div className="empty-state-icon">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              No bin selected
            </p>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-disabled)' }}>
              Click a bin to edit its properties
            </p>
          </div>
        </div>
      )}

      {/* Print List - Collapsible */}
      <div className="flex-1 flex flex-col min-h-0">
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: printListExpanded ? '1px solid var(--border-subtle)' : 'none' }}
        >
          <button
            className="flex items-center gap-2 transition-colors"
            style={{ background: 'transparent' }}
            onClick={() => setPrintListExpanded(!printListExpanded)}
            aria-expanded={printListExpanded}
          >
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${printListExpanded ? 'rotate-0' : '-rotate-90'}`}
              style={{ color: 'var(--text-tertiary)' }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <h2 className="section-header" style={{ margin: 0 }}>Print List</h2>
            {printRows.length > 0 && (
              <span className="badge badge-info">{totalBins}</span>
            )}
          </button>
          {printRows.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                const tsv = exportPrintListTSV(printRows);
                navigator.clipboard.writeText(tsv);
                setCopyFeedback(true);
                setTimeout(() => setCopyFeedback(false), 2000);
              }}
              className="btn btn-ghost p-1.5"
              style={{ minWidth: 'auto', minHeight: 'auto' }}
              title="Copy as TSV for spreadsheets"
              aria-label="Copy print list as TSV"
            >
              {copyFeedback ? (
                <svg className="w-4 h-4" style={{ color: 'var(--color-success)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          )}
        </div>

        <div
          className={`flex-1 flex flex-col min-h-0 transition-all duration-200 ${printListExpanded ? 'opacity-100' : 'opacity-0 max-h-0'}`}
        >
          <div className="flex-1 overflow-y-auto scrollbar-thin min-h-0">
            {printRows.length === 0 ? (
              <div className="empty-state py-6 px-4">
                <div className="empty-state-icon">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-tertiary)' }}>
                  No bins placed yet
                </p>
              </div>
            ) : (
              <table className="w-full" style={{ fontSize: 'var(--text-sm)', tableLayout: 'auto' }}>
                <thead style={{ backgroundColor: 'var(--bg-elevated)' }}>
                  <tr>
                    <th
                      className="pl-4 pr-2 py-2 text-left font-medium sticky top-0"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }}
                    >
                      Size
                    </th>
                    <th
                      className="px-2 py-2 text-left font-medium sticky top-0"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }}
                      title="Height"
                    >
                      H
                    </th>
                    <th
                      className="px-2 py-2 text-right font-medium sticky top-0"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }}
                      title="Quantity"
                    >
                      Qty
                    </th>
                    {hasAnySplits && (
                      <th
                        className="px-2 py-2 text-right font-medium sticky top-0"
                        style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }}
                        title="Pieces after split"
                      >
                        Pcs
                      </th>
                    )}
                    <th
                      className="pl-2 pr-4 py-2 text-right font-medium sticky top-0"
                      style={{ color: 'var(--text-secondary)', backgroundColor: 'var(--bg-elevated)' }}
                      title="Estimated filament (meters)"
                    >
                      ~m
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {printRows.map((row, index) => {
                    const isExpanded = expandedSplitRow === index;
                    const [w, d] = row.size.split('×').map(Number);

                    return (
                      <React.Fragment key={index}>
                        <tr
                          className="transition-colors"
                          style={{
                            borderBottom: isExpanded ? 'none' : '1px solid var(--border-subtle)',
                            cursor: row.needsSplit ? 'pointer' : 'default',
                          }}
                          onClick={() => row.needsSplit && setExpandedSplitRow(isExpanded ? null : index)}
                          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-hover)'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = isExpanded ? 'var(--bg-elevated)' : 'transparent'; }}
                        >
                          <td className="pl-4 pr-2 py-2" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex flex-col gap-0.5">
                              <span className="inline-flex items-center gap-1.5">
                                {/* Category color dots with name tooltip */}
                                <span
                                  className="inline-flex gap-0.5"
                                  title={row.categoryIds.map(catId => layout.categories.find(c => c.id === catId)?.name || 'Unknown').join(', ')}
                                >
                                  {row.categoryIds.slice(0, 3).map((catId, i) => {
                                    const cat = layout.categories.find(c => c.id === catId);
                                    return (
                                      <span
                                        key={i}
                                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: cat?.color || '#6b7280' }}
                                        aria-label={cat?.name || 'Unknown category'}
                                      />
                                    );
                                  })}
                                  {row.categoryIds.length > 3 && (
                                    <span style={{ fontSize: '9px', color: 'var(--text-disabled)' }}>+{row.categoryIds.length - 3}</span>
                                  )}
                                </span>
                                {row.size}
                                {row.needsSplit && (
                                  <svg
                                    className={`w-3.5 h-3.5 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                    style={{ color: 'var(--color-warning)' }}
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    aria-label="Click to see split preview"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </span>
                              {/* Label and Notes */}
                              {(row.labels[0] || row.notes) && (
                                <span className="flex items-center gap-1">
                                  {row.labels[0] && (
                                    <span
                                      className="text-xs truncate"
                                      style={{ color: 'var(--text-tertiary)', maxWidth: '80px' }}
                                      title={row.labels[0]}
                                    >
                                      {row.labels[0]}
                                    </span>
                                  )}
                                  {row.notes && (
                                    <span title={row.notes}>
                                      <svg
                                        className="w-3 h-3 flex-shrink-0"
                                        style={{ color: 'var(--text-disabled)' }}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                                      </svg>
                                    </span>
                                  )}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-2 py-2" style={{ color: 'var(--text-tertiary)' }}>
                            {row.height}u
                          </td>
                          <td className="px-2 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                            {row.binCount}
                          </td>
                          {hasAnySplits && (
                            <td className="px-2 py-2 text-right" style={{ color: 'var(--text-primary)' }}>
                              {row.totalPieces}
                            </td>
                          )}
                          <td className="pl-2 pr-4 py-2 text-right" style={{ color: 'var(--text-tertiary)' }}>
                            {row.filament}
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ backgroundColor: 'var(--bg-elevated)' }}>
                            <td
                              colSpan={hasAnySplits ? 5 : 4}
                              className="px-4 py-3"
                              style={{ borderBottom: '1px solid var(--border-subtle)' }}
                            >
                              <div className="flex items-start gap-4">
                                <SplitPreview width={w} depth={d} pieces={row.pieces} />
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>
                                  <div style={{ fontWeight: 'var(--font-medium)', marginBottom: '4px' }}>
                                    Split into {row.totalPieces} pieces:
                                  </div>
                                  {row.pieces.map((piece, i) => (
                                    <div key={i} style={{ color: 'var(--text-tertiary)' }}>
                                      {piece.count}× {piece.width}×{piece.depth}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {printRows.length > 0 && (
            <div
              className="px-4 py-3"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-elevated)',
              }}
            >
              <div
                className="flex justify-between font-medium mb-2"
                style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}
              >
                <span>Total</span>
                <span>{totalBins} bins{hasAnySplits ? `, ${totalPieces} pieces` : ''}</span>
              </div>
              <div
                className="flex justify-between pt-2"
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                  borderTop: '1px solid var(--border-subtle)',
                }}
              >
                <span style={{ color: 'var(--text-tertiary)' }}>Est. filament</span>
                <span title="Based on 1kg spool (~330m of 1.75mm PLA)">{totalFilament}m (~{spoolEstimate}× 1kg)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDelete !== null}
        title={confirmDelete?.title || ''}
        message={confirmDelete?.message || ''}
        confirmText="Delete"
        destructive
        onConfirm={confirmDeleteBin}
        onCancel={() => setConfirmDelete(null)}
      />
    </aside>
  );
}
