import { describe, it, expect } from 'vitest';
import { canPlaceBin, validateImport, clamp, truncate } from '../utils/validation';
import type { Layout } from '../types';

const createTestLayout = (): Layout => ({
  version: '1.0',
  name: 'Test',
  drawer: { width: 10, depth: 10, height: 12 },
  printBedSize: 168,  // 4 grid units * 42mm
  gridUnitMm: 42,
  heightUnitMm: 7,
  categories: [{ id: 'cat1', name: 'Test', color: '#000' }],
  layers: [
    { id: 'layer1', name: 'Layer 1', height: 3 },
    { id: 'layer2', name: 'Layer 2', height: 6 },
  ],
  bins: [],
});

describe('canPlaceBin', () => {
  it('allows valid placement', () => {
    const layout = createTestLayout();
    const result = canPlaceBin(
      { x: 0, y: 0, width: 2, depth: 2, height: 3 },
      'layer1',
      layout
    );
    expect(result.valid).toBe(true);
  });

  it('rejects out of bounds placement', () => {
    const layout = createTestLayout();
    const result = canPlaceBin(
      { x: -1, y: 0, width: 2, depth: 2, height: 3 },
      'layer1',
      layout
    );
    expect(result).toEqual({ valid: false, reason: 'out_of_bounds' });
  });

  it('rejects placement exceeding width', () => {
    const layout = createTestLayout();
    const result = canPlaceBin(
      { x: 9, y: 0, width: 2, depth: 2, height: 3 },
      'layer1',
      layout
    );
    expect(result).toEqual({ valid: false, reason: 'exceeds_width' });
  });

  it('rejects collision with existing bin', () => {
    const layout = createTestLayout();
    layout.bins = [
      { id: 'existing', layerId: 'layer1', x: 0, y: 0, width: 3, depth: 3, height: 3, category: 'cat1', label: '', notes: '' },
    ];
    const result = canPlaceBin(
      { x: 1, y: 1, width: 2, depth: 2, height: 3 },
      'layer1',
      layout
    );
    expect(result).toEqual({ valid: false, reason: 'collision' });
  });

  it('allows placement next to existing bin', () => {
    const layout = createTestLayout();
    layout.bins = [
      { id: 'existing', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'cat1', label: '', notes: '' },
    ];
    const result = canPlaceBin(
      { x: 2, y: 0, width: 2, depth: 2, height: 3 },
      'layer1',
      layout
    );
    expect(result.valid).toBe(true);
  });

  it('excludes specified bin from collision check', () => {
    const layout = createTestLayout();
    layout.bins = [
      { id: 'moving', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'cat1', label: '', notes: '' },
    ];
    const result = canPlaceBin(
      { x: 1, y: 1, width: 2, depth: 2, height: 3 },
      'layer1',
      layout,
      'moving' // exclude this bin
    );
    expect(result.valid).toBe(true);
  });

  it('rejects placement in blocked zone', () => {
    const layout = createTestLayout();
    layout.bins = [
      // Tall bin on layer 1 that protrudes into layer 2
      { id: 'tall', layerId: 'layer1', x: 0, y: 0, width: 3, depth: 3, height: 6, category: 'cat1', label: '', notes: '' },
    ];
    const result = canPlaceBin(
      { x: 1, y: 1, width: 2, depth: 2, height: 6 },
      'layer2',
      layout
    );
    expect(result).toEqual({ valid: false, reason: 'blocked_zone' });
  });
});

describe('validateImport', () => {
  it('accepts valid layout', () => {
    const layout = createTestLayout();
    const result = validateImport(layout);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects missing fields', () => {
    const result = validateImport({ name: 'Test' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing version');
  });

  it('rejects drawer out of range', () => {
    const layout = createTestLayout();
    layout.drawer.width = 100;
    const result = validateImport(layout);
    expect(result.valid).toBe(false);
  });

  it('rejects duplicate category names', () => {
    const layout = createTestLayout();
    layout.categories = [
      { id: '1', name: 'Tools', color: '#f00' },
      { id: '2', name: 'tools', color: '#0f0' }, // duplicate (case-insensitive)
    ];
    const result = validateImport(layout);
    expect(result.valid).toBe(false);
    expect(result.errors.some(e => e.includes('Duplicate'))).toBe(true);
  });
});

describe('clamp', () => {
  it('clamps values to range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('truncate', () => {
  it('truncates long strings', () => {
    expect(truncate('hello world', 5)).toBe('hello');
    expect(truncate('hi', 5)).toBe('hi');
  });
});
