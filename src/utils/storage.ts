import type { Layout } from '../types';
import { validateImport } from './validation';
import { generateId } from '../constants';

const STORAGE_KEY = 'gridfinity-layout-v1';

/**
 * Save layout to localStorage.
 */
export function saveLayout(layout: Layout): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  } catch (e) {
    console.error('Failed to save layout:', e);
    throw new Error('Storage full. Export your layout to save it.');
  }
}

/**
 * Migrate old layout data to current schema.
 * Adds default values for any missing fields.
 */
function migrateLayout(data: Record<string, unknown>): Record<string, unknown> {
  // Add gridUnitMm and heightUnitMm if missing (added in later version)
  if (data.gridUnitMm === undefined) {
    data.gridUnitMm = 42;
  }
  if (data.heightUnitMm === undefined) {
    data.heightUnitMm = 7;
  }
  // Migrate maxPrintSize (grid units) -> printBedSize (mm)
  const gridUnitMm = (data.gridUnitMm as number) || 42;
  if (data.maxPrintSize !== undefined && data.printBedSize === undefined) {
    // Convert old grid units to mm
    data.printBedSize = (data.maxPrintSize as number) * gridUnitMm;
    delete data.maxPrintSize;
  }
  // Also fix if printBedSize was saved in grid units (< 42 means it's probably not in mm)
  if (data.printBedSize !== undefined && (data.printBedSize as number) < 42) {
    data.printBedSize = (data.printBedSize as number) * gridUnitMm;
  }
  if (data.printBedSize === undefined) {
    data.printBedSize = 256;  // Default 256mm
  }
  return data;
}

/**
 * Load layout from localStorage.
 */
export function loadLayout(): Layout | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;

    let parsed = JSON.parse(stored);

    // Migrate old data to current schema
    parsed = migrateLayout(parsed);

    const validation = validateImport(parsed);

    if (!validation.valid) {
      console.error('Stored layout invalid:', validation.errors);
      return null;
    }

    return parsed as Layout;
  } catch (e) {
    console.error('Failed to load layout:', e);
    return null;
  }
}

/**
 * Clear stored layout.
 */
export function clearStorage(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export layout as JSON string.
 */
export function exportLayoutJSON(layout: Layout): string {
  return JSON.stringify(layout, null, 2);
}

/**
 * Import layout from JSON string.
 * Regenerates all IDs to prevent collisions.
 */
export function importLayoutJSON(json: string): { layout: Layout | null; errors: string[] } {
  try {
    const parsed = JSON.parse(json);
    const validation = validateImport(parsed);

    if (!validation.valid) {
      return { layout: null, errors: validation.errors };
    }

    // Regenerate all IDs
    const layout = parsed as Layout;
    const idMap = new Map<string, string>();

    // Regenerate layer IDs
    layout.layers = layout.layers.map(layer => {
      const newId = generateId();
      idMap.set(layer.id, newId);
      return { ...layer, id: newId };
    });

    // Regenerate category IDs
    layout.categories = layout.categories.map(cat => {
      const newId = generateId();
      idMap.set(cat.id, newId);
      return { ...cat, id: newId };
    });

    // Regenerate bin IDs and update references
    layout.bins = layout.bins.map(bin => ({
      ...bin,
      id: generateId(),
      layerId: bin.layerId === '__staging__' ? '__staging__' : (idMap.get(bin.layerId) || bin.layerId),
      category: idMap.get(bin.category) || bin.category,
    }));

    return { layout, errors: [] };
  } catch (e) {
    return { layout: null, errors: [`Parse error: ${(e as Error).message}`] };
  }
}

/**
 * Export print list as TSV for spreadsheet paste.
 */
export function exportPrintListTSV(rows: Array<{ size: string; height: number; binCount: number; totalPieces: number; labels?: string[]; notes?: string }>): string {
  const header = 'Size\tHeight\tBins\tPieces\tLabel\tNotes';
  const lines = rows.map(r => {
    const label = r.labels?.[0] || '';
    const notes = r.notes || '';
    return `${r.size}\t${r.height}u\t${r.binCount}\t${r.totalPieces}\t${label}\t${notes}`;
  });
  return [header, ...lines].join('\n');
}

/**
 * Get storage usage percentage.
 */
export function getStorageUsage(): number {
  try {
    let total = 0;
    for (const key in localStorage) {
      if (Object.prototype.hasOwnProperty.call(localStorage, key)) {
        total += localStorage[key].length * 2; // UTF-16
      }
    }
    // Assume 5MB limit
    return Math.round((total / (5 * 1024 * 1024)) * 100);
  } catch {
    return 0;
  }
}
