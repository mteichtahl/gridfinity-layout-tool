import { useEffect, useState } from 'react';
import { useUIStore, useLayoutStore } from '../store';
import { BASE_CELL_SIZE } from '../constants';

/**
 * Floating drag preview that follows the cursor during drag operations.
 * Shows a visual representation of the bin(s) being dragged.
 */
export function DragPreview() {
  const interaction = useUIStore((state) => state.interaction);
  const zoom = useUIStore((state) => state.zoom);
  const bins = useLayoutStore((state) => state.layout.bins);
  const categories = useLayoutStore((state) => state.layout.categories);

  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Track mouse position during drag
  useEffect(() => {
    const isDragging = interaction && (interaction.type === 'drag' || interaction.type === 'stagingDrag');
    if (!isDragging) {
      setMousePos(null);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };

    // Set initial position
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [interaction?.type]);

  if (!interaction || !mousePos) return null;

  const cellSize = Math.round(BASE_CELL_SIZE * zoom);
  const gap = 1;

  // Get bins being dragged
  let draggedBins: typeof bins = [];
  if (interaction.type === 'drag') {
    draggedBins = bins.filter(b => interaction.binIds.includes(b.id));
  } else if (interaction.type === 'stagingDrag') {
    const bin = bins.find(b => b.id === interaction.binId);
    if (bin) draggedBins = [bin];
  }

  if (draggedBins.length === 0) return null;

  // Calculate bounding box of all dragged bins (relative to first bin)
  const minX = Math.min(...draggedBins.map(b => b.x));
  const minY = Math.min(...draggedBins.map(b => b.y));

  return (
    <div
      className="fixed pointer-events-none z-[100]"
      style={{
        left: mousePos.x - cellSize / 2,
        top: mousePos.y - cellSize / 2,
      }}
    >
      {draggedBins.map((bin) => {
        const category = categories.find(c => c.id === bin.category);
        const bgColor = category?.color || '#6b7280';
        const textColor = getContrastColor(bgColor);

        // Position relative to first bin
        const offsetX = (bin.x - minX) * (cellSize + gap);
        const offsetY = -(bin.y - minY) * (cellSize + gap); // Invert Y for screen coords

        const width = bin.width * cellSize + (bin.width - 1) * gap;
        const height = bin.depth * cellSize + (bin.depth - 1) * gap;

        return (
          <div
            key={bin.id}
            className="absolute flex items-center justify-center rounded"
            style={{
              left: offsetX,
              top: offsetY,
              width,
              height,
              backgroundColor: bgColor,
              opacity: 0.85,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.2)',
              transform: 'scale(1.02)',
            }}
          >
            <div className="text-center pointer-events-none select-none" style={{ color: textColor }}>
              <div className="text-sm font-semibold">
                {bin.width}×{bin.depth}
              </div>
              {bin.label && (
                <div className="text-xs truncate px-1" style={{ opacity: 0.85 }}>
                  {bin.label}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.95)';
}
