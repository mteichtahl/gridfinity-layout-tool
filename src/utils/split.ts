import type { Bin, PrintPiece, PrintRow } from '../types';
import { STAGING_ID } from '../constants';


/**
 * Estimate filament usage in meters for a single bin.
 *
 * Calibrated against real Prusa Slicer data:
 * - 4×4×3u light bin = 11.67m (walls only, minimal base)
 * - We target ~15m for "typical" bin (middle ground between light and filled/dividers)
 *
 * Formula uses grid units directly:
 * - Base: 0.5m per grid unit² (floor, stacking features, internal structure)
 * - Walls: 0.15m per perimeter unit per height unit
 *
 * Examples:
 * - 1×1×3u: 0.5 + 1.8 = 2.3m
 * - 2×2×3u: 2 + 3.6 = 5.6m
 * - 4×4×3u: 8 + 7.2 = 15.2m (vs 11.67m light = ~30% buffer for dividers)
 */
function calcFilament(
  width: number,
  depth: number,
  height: number
): number {
  // Base: floor, stacking lip, and internal grid structure
  const baseContribution = 0.5 * width * depth;

  // Walls: perimeter walls scaled by height
  const perimeter = 2 * (width + depth);
  const wallContribution = 0.15 * perimeter * height;

  return Math.round((baseContribution + wallContribution) * 10) / 10;
}

/**
 * Recursively split a bin size until all pieces fit within maxSize.
 * Uses greedy halving strategy from PRD.
 *
 * Examples (maxSize = 4):
 * - 5×3 → [3×3, 2×3]
 * - 9×3 → [5×3, 4×3] → [3×3, 2×3, 4×3]
 * - 5×6 → [3×3, 2×3, 3×3, 2×3]
 */
export function splitBinSize(width: number, depth: number, maxSize: number): PrintPiece[] {
  if (width <= maxSize && depth <= maxSize) {
    return [{ width, depth, count: 1 }];
  }

  const pieces: PrintPiece[] = [];

  if (width > maxSize && depth <= maxSize) {
    // Split width only
    const left = Math.ceil(width / 2);
    const right = Math.floor(width / 2);
    pieces.push(...splitBinSize(left, depth, maxSize));
    if (right > 0) {
      pieces.push(...splitBinSize(right, depth, maxSize));
    }
  } else if (width <= maxSize && depth > maxSize) {
    // Split depth only
    const top = Math.ceil(depth / 2);
    const bottom = Math.floor(depth / 2);
    pieces.push(...splitBinSize(width, top, maxSize));
    if (bottom > 0) {
      pieces.push(...splitBinSize(width, bottom, maxSize));
    }
  } else {
    // Split both dimensions
    const leftW = Math.ceil(width / 2);
    const rightW = Math.floor(width / 2);
    const topD = Math.ceil(depth / 2);
    const bottomD = Math.floor(depth / 2);

    pieces.push(...splitBinSize(leftW, topD, maxSize));
    if (rightW > 0) pieces.push(...splitBinSize(rightW, topD, maxSize));
    if (bottomD > 0) pieces.push(...splitBinSize(leftW, bottomD, maxSize));
    if (rightW > 0 && bottomD > 0) pieces.push(...splitBinSize(rightW, bottomD, maxSize));
  }

  return pieces.filter(p => p.width > 0 && p.depth > 0);
}

/**
 * Merge identical pieces to consolidate counts.
 */
function mergePieces(pieces: PrintPiece[]): PrintPiece[] {
  const map = new Map<string, PrintPiece>();

  for (const piece of pieces) {
    const key = `${piece.width}×${piece.depth}`;
    const existing = map.get(key);
    if (existing) {
      existing.count += piece.count;
    } else {
      map.set(key, { ...piece });
    }
  }

  return Array.from(map.values());
}

/**
 * Generate the print list from bins.
 * Groups bins by size×height, calculates split pieces.
 */
export function generatePrintList(
  bins: Bin[],
  maxPrintSize: number
): PrintRow[] {
  // Filter out staging bins
  const placedBins = bins.filter(b => b.layerId !== STAGING_ID);

  // Group by size, height, category, and label (labeled bins are not grouped together)
  const groups = new Map<string, { width: number; depth: number; height: number; count: number; categoryId: string; label: string; notes: string }>();

  for (const bin of placedBins) {
    // Labeled bins get their own row; unlabeled bins are grouped by size+height+category
    const key = bin.label
      ? `${bin.width}×${bin.depth}×${bin.height}:${bin.category}:${bin.id}` // Unique key for labeled bins
      : `${bin.width}×${bin.depth}×${bin.height}:${bin.category}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
    } else {
      groups.set(key, { width: bin.width, depth: bin.depth, height: bin.height, count: 1, categoryId: bin.category, label: bin.label, notes: bin.notes });
    }
  }

  // Generate print rows
  const rows: PrintRow[] = [];

  for (const [, group] of groups) {
    const pieces = splitBinSize(group.width, group.depth, maxPrintSize);
    const mergedPieces = mergePieces(pieces);
    const needsSplit = group.width > maxPrintSize || group.depth > maxPrintSize;
    const totalPieces = mergedPieces.reduce((sum, p) => sum + p.count, 0) * group.count;

    // Calculate filament for all pieces in this row
    const filamentPerBin = mergedPieces.reduce(
      (sum, p) => sum + calcFilament(p.width, p.depth, group.height) * p.count,
      0
    );
    const filament = Math.round(filamentPerBin * group.count * 10) / 10; // Round to 1 decimal

    rows.push({
      size: `${group.width}×${group.depth}`,
      height: group.height,
      binCount: group.count,
      pieces: mergedPieces,
      totalPieces,
      needsSplit,
      filament,
      categoryIds: [group.categoryId],
      labels: group.label ? [group.label] : [],
      notes: group.notes,
    });
  }

  // Sort by total area descending (batch efficiency)
  rows.sort((a, b) => {
    const areaA = parseInt(a.size.split('×')[0], 10) * parseInt(a.size.split('×')[1], 10) * a.binCount;
    const areaB = parseInt(b.size.split('×')[0], 10) * parseInt(b.size.split('×')[1], 10) * b.binCount;
    return areaB - areaA;
  });

  return rows;
}

/**
 * Calculate total pieces across all rows.
 */
export function getTotalPieces(rows: PrintRow[]): number {
  return rows.reduce((sum, row) => sum + row.totalPieces, 0);
}

/**
 * Calculate total bins across all rows.
 */
export function getTotalBins(rows: PrintRow[]): number {
  return rows.reduce((sum, row) => sum + row.binCount, 0);
}

/**
 * Calculate total filament in meters across all rows.
 */
export function getTotalFilament(rows: PrintRow[]): number {
  return Math.round(rows.reduce((sum, row) => sum + row.filament, 0) * 10) / 10;
}

/**
 * Estimate number of spools needed (standard 1kg spool ≈ 330m of PLA).
 */
export function getSpoolEstimate(totalFilament: number): number {
  const METERS_PER_SPOOL = 330;
  return Math.ceil(totalFilament / METERS_PER_SPOOL * 10) / 10; // Round up to 0.1
}
