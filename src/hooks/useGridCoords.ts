import { useCallback } from 'react';
import type { RefObject } from 'react';
import type { Coord } from '../types';
import { useUIStore, useLayoutStore } from '../store';
import { BASE_CELL_SIZE } from '../constants';
import { clamp } from '../utils/validation';

/**
 * Convert mouse position to grid coordinates.
 */
export function useGridCoords(gridRef: RefObject<HTMLDivElement | null>) {
  const zoom = useUIStore(state => state.zoom);
  const drawer = useLayoutStore(state => state.layout.drawer);

  const cellSize = Math.round(BASE_CELL_SIZE * zoom);
  const gap = 1; // 1px gap between cells

  const getGridCoords = useCallback((clientX: number, clientY: number): Coord | null => {
    if (!gridRef.current) return null;

    const rect = gridRef.current.getBoundingClientRect();
    const relX = clientX - rect.left;
    const relY = clientY - rect.top;

    // Account for gap
    const x = Math.floor(relX / (cellSize + gap));
    // Y is inverted (0 at bottom in our coordinate system)
    const y = drawer.depth - 1 - Math.floor(relY / (cellSize + gap));

    return { x, y };
  }, [gridRef, cellSize, drawer.depth]);

  const clampCoords = useCallback((coord: Coord): Coord => ({
    x: clamp(coord.x, 0, drawer.width - 1),
    y: clamp(coord.y, 0, drawer.depth - 1),
  }), [drawer.width, drawer.depth]);

  const isInBounds = useCallback((coord: Coord): boolean => {
    return coord.x >= 0 && coord.x < drawer.width &&
           coord.y >= 0 && coord.y < drawer.depth;
  }, [drawer.width, drawer.depth]);

  return { getGridCoords, clampCoords, isInBounds, cellSize };
}
