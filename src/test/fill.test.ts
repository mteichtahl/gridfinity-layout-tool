import { describe, it, expect } from 'vitest';
import { fillAllWithSize, fillGaps, getLayerCoverage } from '../utils/fill';
import type { Layout } from '../types';

const createTestLayout = (): Layout => ({
  version: '1.0',
  name: 'Test',
  drawer: { width: 6, depth: 6, height: 9 },
  printBedSize: 168,  // 4 grid units * 42mm
  gridUnitMm: 42,
  heightUnitMm: 7,
  categories: [{ id: 'cat1', name: 'Test', color: '#000' }],
  layers: [{ id: 'layer1', name: 'Layer 1', height: 3 }],
  bins: [],
});

describe('fillAllWithSize', () => {
  it('fills empty layer with specified size', () => {
    const layout = createTestLayout();
    const result = fillAllWithSize(layout, 'layer1', 2, 2, 'cat1');

    // 6×6 grid with 2×2 bins = 9 bins
    expect(result.bins).toHaveLength(9);
    expect(result.skippedCells).toBe(0);
  });

  it('skips cells occupied by existing bins', () => {
    const layout = createTestLayout();
    layout.bins = [
      { id: 'existing', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'cat1', label: '', notes: '' },
    ];

    const result = fillAllWithSize(layout, 'layer1', 2, 2, 'cat1');

    // One position should be skipped
    expect(result.bins).toHaveLength(8);
  });

  it('handles non-divisible grid sizes', () => {
    const layout = createTestLayout();
    layout.drawer.width = 5;
    layout.drawer.depth = 5;

    const result = fillAllWithSize(layout, 'layer1', 2, 2, 'cat1');

    // Should create bins, some may be 1-wide at edges
    expect(result.bins.length).toBeGreaterThan(0);
  });
});

describe('fillGaps', () => {
  it('fills gaps with optimal sizes', () => {
    const layout = createTestLayout();
    layout.bins = [
      { id: 'existing', layerId: 'layer1', x: 0, y: 0, width: 4, depth: 4, height: 3, category: 'cat1', label: '', notes: '' },
    ];

    const result = fillGaps(layout, 'layer1', 'cat1', 4);

    // Should fill remaining space
    expect(result.bins.length).toBeGreaterThan(0);
  });

  it('returns empty array for full layer', () => {
    const layout = createTestLayout();
    layout.drawer.width = 2;
    layout.drawer.depth = 2;
    layout.bins = [
      { id: 'full', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'cat1', label: '', notes: '' },
    ];

    const result = fillGaps(layout, 'layer1', 'cat1', 4);

    expect(result.bins).toHaveLength(0);
  });
});

describe('getLayerCoverage', () => {
  it('returns 0 for empty layer', () => {
    const layout = createTestLayout();
    expect(getLayerCoverage(layout, 'layer1')).toBe(0);
  });

  it('calculates correct percentage', () => {
    const layout = createTestLayout();
    // 6×6 = 36 cells, 3×3 = 9 cells = 25%
    layout.bins = [
      { id: 'bin1', layerId: 'layer1', x: 0, y: 0, width: 3, depth: 3, height: 3, category: 'cat1', label: '', notes: '' },
    ];
    expect(getLayerCoverage(layout, 'layer1')).toBe(25);
  });

  it('returns 100 for full layer', () => {
    const layout = createTestLayout();
    layout.bins = [
      { id: 'full', layerId: 'layer1', x: 0, y: 0, width: 6, depth: 6, height: 3, category: 'cat1', label: '', notes: '' },
    ];
    expect(getLayerCoverage(layout, 'layer1')).toBe(100);
  });
});
