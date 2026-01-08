import type { RefObject } from 'react';
import { useUIStore, useLayoutStore } from '../../store';

interface OverlayProps {
  gridRef: RefObject<HTMLDivElement | null>;
  cellSize: number;
  gap: number;
}

/**
 * Draw/drag/resize preview overlay.
 * Shows amber dashed border for draw, green/red for drag/resize.
 * Supports multi-bin drag and resize previews.
 */
export function Overlay({ cellSize, gap }: OverlayProps) {
  const interaction = useUIStore((state) => state.interaction);
  const drawer = useLayoutStore((state) => state.layout.drawer);
  const bins = useLayoutStore((state) => state.layout.bins);

  if (!interaction) return null;

  const previews: React.ReactNode[] = [];
  let tooltipContent: string | null = null;
  let tooltipPosition: { left: number; top: number } | null = null;

  if (interaction.type === 'draw') {
    const { start, current } = interaction;
    const x1 = Math.min(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const x2 = Math.max(start.x, current.x);
    const y2 = Math.max(start.y, current.y);
    const width = x2 - x1 + 1;
    const depth = y2 - y1 + 1;

    const left = gap + x1 * (cellSize + gap);
    const top = gap + (drawer.depth - y2 - 1) * (cellSize + gap);
    const rectWidth = width * cellSize + (width - 1) * gap;
    const rectHeight = depth * cellSize + (depth - 1) * gap;

    previews.push(
      <div
        key="draw-preview"
        style={{
          position: 'absolute',
          left,
          top,
          width: rectWidth,
          height: rectHeight,
          border: '2px dashed #f59e0b',
          pointerEvents: 'none',
          backgroundColor: 'rgba(245, 158, 11, 0.1)',
        }}
      />
    );

    tooltipContent = `${width}×${depth}`;
    tooltipPosition = { left: left + rectWidth + 8, top: top + rectHeight - 24 };
  } else if (interaction.type === 'drag') {
    const { binIds, currentCoord, valid, isOverGrid } = interaction;

    // Only show grid preview when mouse is over the grid
    if (!isOverGrid) {
      // Don't render any preview when dragging outside grid
    } else {
      const primaryBin = bins.find((b) => b.id === binIds[0]);
      if (!primaryBin) return null;

      const color = valid ? '#10b981' : '#ef4444'; // green or red

      // Calculate delta from primary bin's original position
      const deltaX = currentCoord.x - primaryBin.x;
      const deltaY = currentCoord.y - primaryBin.y;

      // Draw preview for each bin being dragged
      for (const binId of binIds) {
        const bin = bins.find((b) => b.id === binId);
        if (!bin) continue;

        const newX = Math.max(0, Math.min(bin.x + deltaX, drawer.width - bin.width));
        const newY = Math.max(0, Math.min(bin.y + deltaY, drawer.depth - bin.depth));

        const left = gap + newX * (cellSize + gap);
        const top = gap + (drawer.depth - newY - bin.depth) * (cellSize + gap);
        const rectWidth = bin.width * cellSize + (bin.width - 1) * gap;
        const rectHeight = bin.depth * cellSize + (bin.depth - 1) * gap;

        previews.push(
          <div
            key={`drag-preview-${binId}`}
            style={{
              position: 'absolute',
              left,
              top,
              width: rectWidth,
              height: rectHeight,
              border: `2px solid ${color}`,
              pointerEvents: 'none',
              backgroundColor: `${color}20`,
            }}
          />
        );
      }

      // Tooltip for multi-select shows count
      if (binIds.length > 1) {
        tooltipContent = `${binIds.length} bins`;
      } else {
        tooltipContent = `${primaryBin.width}×${primaryBin.depth}`;
      }

      const left = gap + currentCoord.x * (cellSize + gap);
      const top = gap + (drawer.depth - currentCoord.y - primaryBin.depth) * (cellSize + gap);
      const rectWidth = primaryBin.width * cellSize + (primaryBin.width - 1) * gap;
      const rectHeight = primaryBin.depth * cellSize + (primaryBin.depth - 1) * gap;
      tooltipPosition = { left: left + rectWidth + 8, top: top + rectHeight - 24 };
    }
  } else if (interaction.type === 'resize') {
    const { binIds, currentRects, valid } = interaction;
    const color = valid ? '#10b981' : '#ef4444'; // green or red

    // Draw preview for each bin being resized
    for (const binId of binIds) {
      const currentRect = currentRects.get(binId);
      const originalBin = bins.find((b) => b.id === binId);
      if (!currentRect || !originalBin) continue;

      const left = gap + currentRect.x * (cellSize + gap);
      const top = gap + (drawer.depth - currentRect.y - currentRect.depth) * (cellSize + gap);
      const rectWidth = currentRect.width * cellSize + (currentRect.width - 1) * gap;
      const rectHeight = currentRect.depth * cellSize + (currentRect.depth - 1) * gap;

      previews.push(
        <div
          key={`resize-preview-${binId}`}
          style={{
            position: 'absolute',
            left,
            top,
            width: rectWidth,
            height: rectHeight,
            border: `2px solid ${color}`,
            pointerEvents: 'none',
            backgroundColor: `${color}20`,
          }}
        />
      );

      // Show removed areas when shrinking (red overlay on portions being cut)
      const origRight = originalBin.x + originalBin.width;
      const origTop = originalBin.y + originalBin.depth;
      const newRight = currentRect.x + currentRect.width;
      const newTop = currentRect.y + currentRect.depth;

      // Right edge removed
      if (newRight < origRight) {
        const removedWidth = origRight - newRight;
        const removedLeft = gap + newRight * (cellSize + gap);
        const removedTop = gap + (drawer.depth - Math.min(origTop, newTop) - Math.min(originalBin.depth, currentRect.depth)) * (cellSize + gap);
        const removedW = removedWidth * cellSize + (removedWidth - 1) * gap;
        const removedH = Math.min(originalBin.depth, currentRect.depth) * cellSize + (Math.min(originalBin.depth, currentRect.depth) - 1) * gap;
        previews.push(
          <div
            key={`resize-removed-right-${binId}`}
            style={{
              position: 'absolute',
              left: removedLeft,
              top: removedTop,
              width: removedW,
              height: removedH,
              pointerEvents: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
            }}
          />
        );
      }

      // Left edge removed
      if (currentRect.x > originalBin.x) {
        const removedWidth = currentRect.x - originalBin.x;
        const removedLeft = gap + originalBin.x * (cellSize + gap);
        const removedTop = gap + (drawer.depth - Math.min(origTop, newTop) - Math.min(originalBin.depth, currentRect.depth)) * (cellSize + gap);
        const removedW = removedWidth * cellSize + (removedWidth - 1) * gap;
        const removedH = Math.min(originalBin.depth, currentRect.depth) * cellSize + (Math.min(originalBin.depth, currentRect.depth) - 1) * gap;
        previews.push(
          <div
            key={`resize-removed-left-${binId}`}
            style={{
              position: 'absolute',
              left: removedLeft,
              top: removedTop,
              width: removedW,
              height: removedH,
              pointerEvents: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
            }}
          />
        );
      }

      // Top edge removed (visually top = high y value)
      if (newTop < origTop) {
        const removedDepth = origTop - newTop;
        const removedLeft = gap + originalBin.x * (cellSize + gap);
        const removedTop = gap + (drawer.depth - origTop) * (cellSize + gap);
        const removedW = originalBin.width * cellSize + (originalBin.width - 1) * gap;
        const removedH = removedDepth * cellSize + (removedDepth - 1) * gap;
        previews.push(
          <div
            key={`resize-removed-top-${binId}`}
            style={{
              position: 'absolute',
              left: removedLeft,
              top: removedTop,
              width: removedW,
              height: removedH,
              pointerEvents: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
            }}
          />
        );
      }

      // Bottom edge removed (visually bottom = low y value)
      if (currentRect.y > originalBin.y) {
        const removedDepth = currentRect.y - originalBin.y;
        const removedLeft = gap + originalBin.x * (cellSize + gap);
        const removedTop = gap + (drawer.depth - currentRect.y) * (cellSize + gap);
        const removedW = originalBin.width * cellSize + (originalBin.width - 1) * gap;
        const removedH = removedDepth * cellSize + (removedDepth - 1) * gap;
        previews.push(
          <div
            key={`resize-removed-bottom-${binId}`}
            style={{
              position: 'absolute',
              left: removedLeft,
              top: removedTop,
              width: removedW,
              height: removedH,
              pointerEvents: 'none',
              backgroundColor: 'rgba(239, 68, 68, 0.35)',
            }}
          />
        );
      }
    }

    // Use first bin's rect for tooltip
    const firstBinId = binIds[0];
    const firstRect = currentRects.get(firstBinId);
    if (firstRect) {
      if (binIds.length > 1) {
        tooltipContent = `${binIds.length} bins`;
      } else {
        tooltipContent = `${firstRect.width}×${firstRect.depth}`;
      }
      const left = gap + firstRect.x * (cellSize + gap);
      const top = gap + (drawer.depth - firstRect.y - firstRect.depth) * (cellSize + gap);
      const rectWidth = firstRect.width * cellSize + (firstRect.width - 1) * gap;
      const rectHeight = firstRect.depth * cellSize + (firstRect.depth - 1) * gap;
      tooltipPosition = { left: left + rectWidth + 8, top: top + rectHeight - 24 };
    }
  } else if (interaction.type === 'stagingDrag') {
    const { binId, currentCoord, valid } = interaction;
    const bin = bins.find((b) => b.id === binId);

    // Only show preview if we have a valid coordinate (mouse is over grid)
    if (bin && currentCoord) {
      const color = valid ? '#10b981' : '#ef4444'; // green or red

      const left = gap + currentCoord.x * (cellSize + gap);
      const top = gap + (drawer.depth - currentCoord.y - bin.depth) * (cellSize + gap);
      const rectWidth = bin.width * cellSize + (bin.width - 1) * gap;
      const rectHeight = bin.depth * cellSize + (bin.depth - 1) * gap;

      previews.push(
        <div
          key={`staging-drag-preview-${binId}`}
          style={{
            position: 'absolute',
            left,
            top,
            width: rectWidth,
            height: rectHeight,
            border: `2px solid ${color}`,
            borderStyle: 'dashed',
            pointerEvents: 'none',
            backgroundColor: `${color}20`,
          }}
        />
      );

      tooltipContent = `${bin.width}×${bin.depth}`;
      tooltipPosition = { left: left + rectWidth + 8, top: top + rectHeight - 24 };
    }
  } else if (interaction.type === 'paint') {
    const { start, current, paintSize } = interaction;
    const x1 = Math.min(start.x, current.x);
    const y1 = Math.min(start.y, current.y);
    const x2 = Math.max(start.x, current.x);
    const y2 = Math.max(start.y, current.y);
    const areaWidth = x2 - x1 + 1;
    const areaDepth = y2 - y1 + 1;

    // Calculate how many bins fit
    const binsAcross = Math.floor(areaWidth / paintSize.width);
    const binsDown = Math.floor(areaDepth / paintSize.depth);
    const totalBins = binsAcross * binsDown;

    // Calculate remainder (leftover space)
    const usedWidth = binsAcross * paintSize.width;
    const usedDepth = binsDown * paintSize.depth;
    const remainderWidth = areaWidth - usedWidth;
    const remainderDepth = areaDepth - usedDepth;
    const hasRemainder = remainderWidth > 0 || remainderDepth > 0;

    // Outer selection area (amber dashed like draw)
    const areaLeft = gap + x1 * (cellSize + gap);
    const areaTop = gap + (drawer.depth - y2 - 1) * (cellSize + gap);
    const areaPixelWidth = areaWidth * cellSize + (areaWidth - 1) * gap;
    const areaPixelHeight = areaDepth * cellSize + (areaDepth - 1) * gap;

    previews.push(
      <div
        key="paint-area"
        style={{
          position: 'absolute',
          left: areaLeft,
          top: areaTop,
          width: areaPixelWidth,
          height: areaPixelHeight,
          border: `2px dashed ${hasRemainder ? '#f59e0b' : '#10b981'}`,
          pointerEvents: 'none',
          backgroundColor: hasRemainder ? 'rgba(245, 158, 11, 0.05)' : 'rgba(16, 185, 129, 0.05)',
        }}
      />
    );

    // Draw grid of bin previews
    if (binsAcross > 0 && binsDown > 0) {
      for (let row = 0; row < binsDown; row++) {
        for (let col = 0; col < binsAcross; col++) {
          const binX = x1 + col * paintSize.width;
          const binY = y1 + row * paintSize.depth;

          const left = gap + binX * (cellSize + gap);
          const top = gap + (drawer.depth - binY - paintSize.depth) * (cellSize + gap);
          const rectWidth = paintSize.width * cellSize + (paintSize.width - 1) * gap;
          const rectHeight = paintSize.depth * cellSize + (paintSize.depth - 1) * gap;

          previews.push(
            <div
              key={`paint-bin-${col}-${row}`}
              style={{
                position: 'absolute',
                left,
                top,
                width: rectWidth,
                height: rectHeight,
                border: '1px solid #10b981',
                pointerEvents: 'none',
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
              }}
            />
          );
        }
      }
    }

    // Show remainder area as red/warning if it exists
    if (hasRemainder) {
      // Right remainder strip
      if (remainderWidth > 0 && binsDown > 0) {
        const stripX = x1 + usedWidth;
        const stripLeft = gap + stripX * (cellSize + gap);
        const stripTop = gap + (drawer.depth - y1 - usedDepth) * (cellSize + gap);
        const stripWidth = remainderWidth * cellSize + (remainderWidth - 1) * gap;
        const stripHeight = usedDepth * cellSize + (usedDepth - 1) * gap;

        previews.push(
          <div
            key="paint-remainder-right"
            style={{
              position: 'absolute',
              left: stripLeft,
              top: stripTop,
              width: stripWidth,
              height: stripHeight,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              pointerEvents: 'none',
            }}
          />
        );
      }

      // Top remainder strip (full width)
      if (remainderDepth > 0) {
        const stripY = y1 + usedDepth;
        const stripLeft = gap + x1 * (cellSize + gap);
        const stripTop = gap + (drawer.depth - stripY - remainderDepth) * (cellSize + gap);
        const stripWidth = areaWidth * cellSize + (areaWidth - 1) * gap;
        const stripHeight = remainderDepth * cellSize + (remainderDepth - 1) * gap;

        previews.push(
          <div
            key="paint-remainder-top"
            style={{
              position: 'absolute',
              left: stripLeft,
              top: stripTop,
              width: stripWidth,
              height: stripHeight,
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              pointerEvents: 'none',
            }}
          />
        );
      }
    }

    // Tooltip
    if (totalBins > 0) {
      tooltipContent = hasRemainder
        ? `${totalBins}× ${paintSize.width}×${paintSize.depth} (${remainderWidth > 0 ? `${remainderWidth}w` : ''}${remainderWidth > 0 && remainderDepth > 0 ? ', ' : ''}${remainderDepth > 0 ? `${remainderDepth}d` : ''} unused)`
        : `${totalBins}× ${paintSize.width}×${paintSize.depth}`;
    } else {
      tooltipContent = `Area too small for ${paintSize.width}×${paintSize.depth}`;
    }
    tooltipPosition = { left: areaLeft + areaPixelWidth + 8, top: areaTop + areaPixelHeight - 24 };
  }

  return (
    <>
      {previews}
      {tooltipContent && tooltipPosition && (
        <div
          className="absolute bg-zinc-900 text-amber-400 text-xs font-bold px-2 py-1 rounded shadow-lg pointer-events-none whitespace-nowrap"
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            zIndex: 50,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </>
  );
}
