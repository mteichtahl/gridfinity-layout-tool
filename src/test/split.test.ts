import { describe, it, expect } from 'vitest';
import { splitBinSize, generatePrintList } from '../utils/split';
import type { Bin } from '../types';
import { STAGING_ID } from '../constants';

describe('splitBinSize', () => {
  const maxSize = 4;

  it('returns single piece for small bins', () => {
    const pieces = splitBinSize(3, 3, maxSize);
    expect(pieces).toEqual([{ width: 3, depth: 3, count: 1 }]);
  });

  it('splits width only when needed', () => {
    const pieces = splitBinSize(5, 3, maxSize);
    // 5×3 → 3×3 + 2×3
    expect(pieces).toHaveLength(2);
    expect(pieces).toContainEqual({ width: 3, depth: 3, count: 1 });
    expect(pieces).toContainEqual({ width: 2, depth: 3, count: 1 });
  });

  it('splits depth only when needed', () => {
    const pieces = splitBinSize(3, 5, maxSize);
    // 3×5 → 3×3 + 3×2
    expect(pieces).toHaveLength(2);
    expect(pieces).toContainEqual({ width: 3, depth: 3, count: 1 });
    expect(pieces).toContainEqual({ width: 3, depth: 2, count: 1 });
  });

  it('handles PRD example: 9×3 with max 4', () => {
    const pieces = splitBinSize(9, 3, maxSize);
    // 9×3 → 5×3 + 4×3 → 3×3 + 2×3 + 4×3
    expect(pieces).toHaveLength(3);
    const sizes = pieces.map(p => `${p.width}×${p.depth}`).sort();
    expect(sizes).toEqual(['2×3', '3×3', '4×3']);
  });

  it('handles both dimensions exceeding max', () => {
    const pieces = splitBinSize(5, 6, maxSize);
    // Should result in 4 pieces
    expect(pieces.length).toBeGreaterThanOrEqual(4);
    // All pieces should fit
    pieces.forEach(p => {
      expect(p.width).toBeLessThanOrEqual(maxSize);
      expect(p.depth).toBeLessThanOrEqual(maxSize);
    });
  });

  it('handles exact max size', () => {
    const pieces = splitBinSize(4, 4, maxSize);
    expect(pieces).toEqual([{ width: 4, depth: 4, count: 1 }]);
  });
});

describe('generatePrintList', () => {
  it('groups identical bins', () => {
    const bins: Bin[] = [
      { id: '1', layerId: 'l1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'c1', label: '', notes: '' },
      { id: '2', layerId: 'l1', x: 2, y: 0, width: 2, depth: 2, height: 3, category: 'c1', label: '', notes: '' },
    ];
    const rows = generatePrintList(bins, 4);
    expect(rows).toHaveLength(1);
    expect(rows[0].binCount).toBe(2);
    expect(rows[0].totalPieces).toBe(2);
  });

  it('excludes staging bins', () => {
    const bins: Bin[] = [
      { id: '1', layerId: 'l1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'c1', label: '', notes: '' },
      { id: '2', layerId: STAGING_ID, x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'c1', label: '', notes: '' },
    ];
    const rows = generatePrintList(bins, 4);
    expect(rows).toHaveLength(1);
    expect(rows[0].binCount).toBe(1);
  });

  it('separates bins with different heights', () => {
    const bins: Bin[] = [
      { id: '1', layerId: 'l1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'c1', label: '', notes: '' },
      { id: '2', layerId: 'l1', x: 2, y: 0, width: 2, depth: 2, height: 6, category: 'c1', label: '', notes: '' },
    ];
    const rows = generatePrintList(bins, 4);
    expect(rows).toHaveLength(2);
  });

  it('calculates split pieces correctly', () => {
    const bins: Bin[] = [
      { id: '1', layerId: 'l1', x: 0, y: 0, width: 5, depth: 3, height: 3, category: 'c1', label: '', notes: '' },
    ];
    const rows = generatePrintList(bins, 4);
    expect(rows[0].needsSplit).toBe(true);
    expect(rows[0].totalPieces).toBe(2); // 3×3 + 2×3
  });
});
