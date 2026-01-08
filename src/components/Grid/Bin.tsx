import type { PointerEvent } from 'react';
import type { Bin as BinType, Category, Layer, ResizeHandle } from '../../types';
import { useUIStore, useLayoutStore } from '../../store';
import { calcMaxGridUnits } from '../../constants';

interface BinProps {
  bin: BinType;
  category?: Category;
  layer?: Layer;
  drawer: { width: number; depth: number };
  isGhost: boolean;
  isSelected: boolean;
  onStartDrag: (binId: string, clientX: number, clientY: number) => void;
  onStartResize: (binId: string, handle: ResizeHandle) => void;
}

/**
 * Calculate optimal text color based on background luminance
 */
function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
}

/**
 * Single bin with selection ring and resize handles.
 * Features improved selection states with glow effect and refined handles.
 */
export function Bin({ bin, category, layer, drawer, isGhost, isSelected, onStartDrag, onStartResize }: BinProps) {
  const setSelectedBin = useUIStore((state) => state.setSelectedBin);
  const toggleSelection = useUIStore((state) => state.toggleSelection);
  const addToSelection = useUIStore((state) => state.addToSelection);
  const selectedBinIds = useUIStore((state) => state.selectedBinIds);
  const interaction = useUIStore((state) => state.interaction);
  const zoom = useUIStore((state) => state.zoom);
  const showLabels = useUIStore((state) => state.showLabels);
  const printBedSize = useLayoutStore((state) => state.layout.printBedSize);
  const gridUnitMm = useLayoutStore((state) => state.layout.gridUnitMm);

  // Check if this bin is currently being dragged
  const isBeingDragged = interaction?.type === 'drag' && interaction.binIds.includes(bin.id);

  // Hide resize handles during multi-select
  const isMultiSelect = selectedBinIds.length > 1;

  // Calculate max grid units that fit on print bed (accounting for gaps)
  const maxGridUnits = calcMaxGridUnits(printBedSize, gridUnitMm);
  const needsSplit = bin.width > maxGridUnits || bin.depth > maxGridUnits;
  const isTall = layer && bin.height > layer.height;

  const dimensionsText = `${bin.width}×${bin.depth}`;
  // Only show label text if showLabels is enabled
  const labelText = showLabels ? (bin.label || '') : '';

  // Rotate text for tall narrow bins (depth > 1.5x width)
  const shouldRotate = bin.depth > bin.width * 1.5;

  // Hide dimensions when there's a label and not enough space:
  // - Very small bins (area < 2)
  // - Shallow bins (depth = 1) - not enough vertical space for both lines
  // - Narrow bins (width = 1) - rotation handles this but still tight
  const showDimensions = !labelText || (bin.width * bin.depth >= 2 && bin.depth > 1 && bin.width > 1);

  // Scale font size with zoom (dampened: 0.6 + 0.4 * zoom)
  // At 50% zoom: 0.8x, at 100%: 1.0x, at 200%: 1.4x
  const fontScale = 0.6 + 0.4 * zoom;
  const dimensionFontSize = Math.round(14 * fontScale);
  const labelFontSize = Math.round(12 * fontScale);

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (isGhost) return;
    e.preventDefault();
    e.stopPropagation();

    if (e.button === 0) {
      const isMultiSelectKey = e.ctrlKey || e.metaKey;
      const isRangeSelectKey = e.shiftKey;

      if (isMultiSelectKey) {
        // Ctrl/Cmd+click: toggle this bin in selection
        toggleSelection(bin.id);
      } else if (isRangeSelectKey) {
        // Shift+click: add to selection (range select could be enhanced later)
        addToSelection(bin.id);
      } else {
        // Normal click: single select and start drag
        if (!isSelected) {
          setSelectedBin(bin.id);
        }
        onStartDrag(bin.id, e.clientX, e.clientY);
      }
    }
  };

  const handleResizePointerDown = (e: PointerEvent<HTMLDivElement>, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.button === 0) {
      onStartResize(bin.id, handle);
    }
  };

  const bgColor = category?.color || '#6b7280';
  const textColor = getContrastColor(bgColor);

  // Selection and hover styles
  const getBoxShadow = () => {
    if (isGhost) return 'none';
    if (isSelected) {
      return '0 0 0 2px var(--selection-ring), 0 0 20px var(--selection-glow), 0 4px 12px rgba(0,0,0,0.3)';
    }
    return '0 2px 4px rgba(0,0,0,0.2)';
  };

  const getTransform = () => {
    if (isGhost) return 'none';
    if (isSelected) return 'scale(1.01)';
    return 'none';
  };

  return (
    <div
      data-bin-id={bin.id}
      className={`relative flex flex-col items-center justify-center transition-all duration-150 ${
        isSelected && !isGhost ? 'animate-settle-in' : ''
      }`}
      style={{
        gridColumn: `${bin.x + 1} / span ${bin.width}`,
        gridRow: `${drawer.depth - bin.y - bin.depth + 1} / span ${bin.depth}`,
        backgroundColor: bgColor,
        borderRadius: 'var(--radius-sm)',
        border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.2)',
        cursor: isGhost ? 'default' : 'move',
        touchAction: 'none',
        pointerEvents: isGhost || isBeingDragged ? 'none' : 'auto',
        opacity: isGhost ? 0.3 : isBeingDragged ? 0.3 : 1,
        zIndex: isGhost ? 5 : isSelected ? 20 : 10,
        boxShadow: getBoxShadow(),
        transform: getTransform(),
      }}
      onPointerDown={handlePointerDown}
      role="button"
      aria-label={`Bin ${bin.width} by ${bin.depth}${bin.label ? `, labeled ${bin.label}` : ''}${category ? `, category ${category.name}` : ''}`}
      aria-pressed={isSelected}
      tabIndex={isGhost ? -1 : 0}
      title={isGhost ? undefined : (bin.label ? `${dimensionsText} - ${bin.label}` : undefined)}
    >
      {/* Tall bin indicator badge */}
      {isTall && !isGhost && (
        <div
          className="absolute top-0.5 right-0.5 px-1.5 py-0.5 rounded-sm flex items-center gap-0.5 pointer-events-none"
          style={{
            backgroundColor: 'var(--bg-primary)',
            color: 'var(--color-warning)',
            fontSize: 'var(--text-xs)',
            fontWeight: 'var(--font-medium)',
            boxShadow: 'var(--shadow-sm)'
          }}
          title={`Spans multiple layers (${bin.height}u)`}
        >
          <span>{bin.height}u</span>
          <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Size label in center */}
      <div
        className="text-center pointer-events-none select-none flex flex-col items-center justify-center overflow-hidden px-1"
        style={{
          color: textColor,
          transform: shouldRotate ? 'rotate(-90deg)' : 'none',
          // When rotated, expand width to use depth space (percentage of parent width × depth/width ratio)
          width: shouldRotate ? `${(bin.depth / bin.width) * 90}%` : 'auto',
          maxWidth: shouldRotate ? 'none' : '95%',
          maxHeight: '90%',
        }}
      >
        {showDimensions && (
          <div
            className="font-semibold flex items-center justify-center gap-0.5 leading-tight"
            style={{
              fontSize: `${dimensionFontSize}px`,
              textShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {dimensionsText}
            {needsSplit && !isGhost && (
              <span
                className="ml-0.5 rounded-sm"
                title="Exceeds print size, will be split"
                style={{
                  fontSize: `${Math.round(labelFontSize * 0.9)}px`,
                  padding: '0px 3px',
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'var(--color-warning)',
                  fontWeight: 'var(--font-medium)',
                }}
              >
                Split
              </span>
            )}
          </div>
        )}
        {labelText && (
          <div
            className={`leading-tight ${shouldRotate ? 'whitespace-nowrap' : 'truncate w-full'}`}
            style={{
              fontSize: `${labelFontSize}px`,
              fontWeight: showDimensions ? 'normal' : 500,
              opacity: showDimensions ? 0.85 : 1,
              marginTop: showDimensions ? '1px' : 0,
            }}
          >
            {labelText}
          </div>
        )}
      </div>

      {/* Resize handles - only for single selected bin, not during multi-select */}
      {isSelected && !isGhost && !isMultiSelect && (
        <>
          {/* Right edge handle */}
          <div
            className="absolute transition-transform hover:scale-110"
            style={{
              right: -5,
              top: '25%',
              width: 10,
              height: '50%',
              minHeight: 20,
              background: 'var(--selection-ring)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'ew-resize',
              boxShadow: 'var(--shadow-sm)',
            }}
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            role="slider"
            aria-label="Resize width"
            aria-orientation="horizontal"
          />
          {/* Bottom edge handle */}
          <div
            className="absolute transition-transform hover:scale-110"
            style={{
              bottom: -5,
              left: '25%',
              width: '50%',
              minWidth: 20,
              height: 10,
              background: 'var(--selection-ring)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'ns-resize',
              boxShadow: 'var(--shadow-sm)',
            }}
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            role="slider"
            aria-label="Resize depth"
            aria-orientation="vertical"
          />
          {/* SE corner handle */}
          <div
            className="absolute transition-transform hover:scale-125"
            style={{
              right: -6,
              bottom: -6,
              width: 12,
              height: 12,
              background: 'var(--selection-ring)',
              borderRadius: 'var(--radius-sm)',
              cursor: 'nwse-resize',
              boxShadow: 'var(--shadow-md)',
            }}
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            role="slider"
            aria-label="Resize width and depth"
          />
        </>
      )}
    </div>
  );
}
