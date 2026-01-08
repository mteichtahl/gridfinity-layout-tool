import { describe, it, expect } from 'vitest';
import {
  getLayerZStart,
  footprintsOverlap,
  binsCollide,
  getBlockedZones,
} from '../utils/collision';
import type { Layer, Bin } from '../types';

const layers: Layer[] = [
  { id: 'layer1', name: 'Layer 1', height: 3 },
  { id: 'layer2', name: 'Layer 2', height: 6 },
  { id: 'layer3', name: 'Layer 3', height: 3 },
];

describe('getLayerZStart', () => {
  it('returns 0 for first layer', () => {
    expect(getLayerZStart('layer1', layers)).toBe(0);
  });

  it('sums heights for subsequent layers', () => {
    expect(getLayerZStart('layer2', layers)).toBe(3);
    expect(getLayerZStart('layer3', layers)).toBe(9);
  });

  it('throws for unknown layer', () => {
    expect(() => getLayerZStart('unknown', layers)).toThrow();
  });
});

describe('footprintsOverlap', () => {
  it('detects overlapping rectangles', () => {
    const a = { x: 0, y: 0, width: 2, depth: 2 };
    const b = { x: 1, y: 1, width: 2, depth: 2 };
    expect(footprintsOverlap(a, b)).toBe(true);
  });

  it('returns false for adjacent rectangles', () => {
    const a = { x: 0, y: 0, width: 2, depth: 2 };
    const b = { x: 2, y: 0, width: 2, depth: 2 };
    expect(footprintsOverlap(a, b)).toBe(false);
  });

  it('returns false for separated rectangles', () => {
    const a = { x: 0, y: 0, width: 2, depth: 2 };
    const b = { x: 5, y: 5, width: 2, depth: 2 };
    expect(footprintsOverlap(a, b)).toBe(false);
  });
});

describe('binsCollide', () => {
  it('returns true for overlapping bins on same layer', () => {
    const binA: Bin = { id: '1', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    const binB: Bin = { id: '2', layerId: 'layer1', x: 1, y: 1, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    expect(binsCollide(binA, binB, layers)).toBe(true);
  });

  it('returns false for bins on different layers with no vertical overlap', () => {
    const binA: Bin = { id: '1', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    const binB: Bin = { id: '2', layerId: 'layer2', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    expect(binsCollide(binA, binB, layers)).toBe(false);
  });

  it('returns true for tall bin protruding into upper layer', () => {
    const binA: Bin = { id: '1', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 6, category: 'tools', label: '', notes: '' }; // extends into layer2
    const binB: Bin = { id: '2', layerId: 'layer2', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    expect(binsCollide(binA, binB, layers)).toBe(true);
  });

  it('returns false for staging bins', () => {
    const binA: Bin = { id: '1', layerId: '__staging__', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    const binB: Bin = { id: '2', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' };
    expect(binsCollide(binA, binB, layers)).toBe(false);
  });
});

describe('getBlockedZones', () => {
  it('returns empty array when no protrusions', () => {
    const bins: Bin[] = [
      { id: '1', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 3, category: 'tools', label: '', notes: '' },
    ];
    expect(getBlockedZones('layer2', bins, layers)).toEqual([]);
  });

  it('returns blocked zone for protruding bin', () => {
    const bins: Bin[] = [
      { id: '1', layerId: 'layer1', x: 0, y: 0, width: 2, depth: 2, height: 6, category: 'tools', label: '', notes: '' }, // protrudes 3u into layer2
    ];
    const zones = getBlockedZones('layer2', bins, layers);
    expect(zones).toHaveLength(1);
    expect(zones[0]).toMatchObject({ x: 0, y: 0, width: 2, depth: 2, sourceBinId: '1' });
  });
});
