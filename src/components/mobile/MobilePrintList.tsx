import { useMemo, useState, type CSSProperties } from 'react';
import { useLayoutStore } from '../../store';
import { calcMaxGridUnits } from '../../constants';
import { generatePrintList, getTotalBins, getTotalPieces, getTotalFilament, getSpoolEstimate } from '../../utils/split';
import { exportPrintListTSV } from '../../utils/storage';

// Style constants to avoid recreating objects on each render
const STYLES = {
  // Backgrounds
  bgElevated: { backgroundColor: 'var(--bg-elevated)' } as CSSProperties,
  // Text colors
  textPrimary: { color: 'var(--text-primary)' } as CSSProperties,
  textSecondary: { color: 'var(--text-secondary)' } as CSSProperties,
  textTertiary: { color: 'var(--text-tertiary)' } as CSSProperties,
  textDisabled: { color: 'var(--text-disabled)' } as CSSProperties,
  colorSuccess: { color: 'var(--color-success)' } as CSSProperties,
  // Badges
  splitBadge: {
    backgroundColor: 'var(--color-warning-muted)',
    color: 'var(--color-warning)',
  } as CSSProperties,
  // Split details
  splitDetails: {
    borderTop: '1px solid var(--border-subtle)',
    color: 'var(--text-tertiary)',
  } as CSSProperties,
} as const;

/**
 * Mobile-optimized print list with card-based display.
 */
export function MobilePrintList() {
  const [copyFeedback, setCopyFeedback] = useState(false);

  const layout = useLayoutStore(state => state.layout);
  const maxGridUnits = calcMaxGridUnits(layout.printBedSize, layout.gridUnitMm);

  const printRows = useMemo(
    () => generatePrintList(layout.bins, maxGridUnits),
    [layout.bins, maxGridUnits]
  );
  const totalBins = useMemo(() => getTotalBins(printRows), [printRows]);
  const totalPieces = useMemo(() => getTotalPieces(printRows), [printRows]);
  const totalFilament = useMemo(() => getTotalFilament(printRows), [printRows]);
  const spoolEstimate = useMemo(() => getSpoolEstimate(totalFilament), [totalFilament]);
  const hasAnySplits = useMemo(() => printRows.some(r => r.needsSplit), [printRows]);

  const handleCopy = () => {
    const tsv = exportPrintListTSV(printRows);
    navigator.clipboard.writeText(tsv);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  if (printRows.length === 0) {
    return (
      <div className="py-8 text-center">
        <div
          className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center"
          style={STYLES.bgElevated}
        >
          <svg className="w-8 h-8" style={STYLES.textDisabled} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <p style={STYLES.textSecondary}>No bins to print</p>
        <p className="text-sm mt-1" style={STYLES.textDisabled}>
          Draw bins on the grid to see them here
        </p>
      </div>
    );
  }

  return (
    <div className="pb-4">
      {/* Summary */}
      <div
        className="p-4 rounded-lg mb-4"
        style={STYLES.bgElevated}
      >
        <div className="flex items-center justify-between mb-3">
          <span className="font-semibold" style={STYLES.textPrimary}>
            {totalBins} Bins
          </span>
          {hasAnySplits && (
            <span className="text-sm" style={STYLES.textTertiary}>
              {totalPieces} pieces total
            </span>
          )}
        </div>
        <div
          className="flex items-center justify-between text-sm"
          style={STYLES.textTertiary}
        >
          <span>Estimated filament</span>
          <span>{totalFilament}m (~{spoolEstimate}× 1kg spool)</span>
        </div>
      </div>

      {/* Copy button */}
      <button
        onClick={handleCopy}
        className="btn btn-secondary w-full mb-4"
      >
        {copyFeedback ? (
          <>
            <svg className="w-5 h-5 mr-2" style={STYLES.colorSuccess} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Copy as TSV
          </>
        )}
      </button>

      {/* Print list items */}
      <div className="space-y-2">
        {printRows.map((row) => (
          <div
            key={`${row.size}-${row.height}-${row.labels.join(',')}`}
            className="p-3 rounded-lg"
            style={STYLES.bgElevated}
          >
            <div className="flex items-center gap-3">
              {/* Category colors */}
              <div className="flex gap-1">
                {row.categoryIds.slice(0, 3).map((catId) => {
                  const cat = layout.categories.find(c => c.id === catId);
                  return (
                    <div
                      key={catId}
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: cat?.color || '#6b7280' }}
                    />
                  );
                })}
                {row.categoryIds.length > 3 && (
                  <span className="text-xs" style={STYLES.textDisabled}>
                    +{row.categoryIds.length - 3}
                  </span>
                )}
              </div>

              {/* Size and quantity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={STYLES.textPrimary}>
                    {row.size}
                  </span>
                  <span className="text-sm" style={STYLES.textTertiary}>
                    {row.height}u
                  </span>
                  {row.needsSplit && (
                    <span
                      className="px-1.5 py-0.5 rounded text-xs"
                      style={STYLES.splitBadge}
                    >
                      Split
                    </span>
                  )}
                </div>
                {row.labels[0] && (
                  <span
                    className="text-sm truncate block"
                    style={STYLES.textTertiary}
                  >
                    {row.labels[0]}
                  </span>
                )}
              </div>

              {/* Count */}
              <div className="text-right">
                <span className="font-semibold" style={STYLES.textPrimary}>
                  ×{row.binCount}
                </span>
                {row.needsSplit && (
                  <div className="text-xs" style={STYLES.textTertiary}>
                    {row.totalPieces} pcs
                  </div>
                )}
              </div>
            </div>

            {/* Split details */}
            {row.needsSplit && (
              <div
                className="mt-2 pt-2 text-sm"
                style={STYLES.splitDetails}
              >
                Split into: {row.pieces.map(p => `${p.count}× ${p.width}×${p.depth}`).join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
