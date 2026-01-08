import { create } from 'zustand';
import type { Interaction } from '../types';
import { CONSTRAINTS } from '../constants';

export type DropTarget = 'trash' | 'staging' | null;

export interface PaintSize {
  width: number;
  depth: number;
}

interface UIState {
  // Selection
  activeLayerId: string;
  selectedBinIds: string[];
  activeCategoryId: string;

  // View
  zoom: number;
  showOtherLayers: boolean;
  showLabels: boolean;

  // Panel visibility
  leftPanelCollapsed: boolean;
  rightPanelCollapsed: boolean;

  // Interaction
  interaction: Interaction | null;
  dropTarget: DropTarget;

  // Paint mode
  paintSize: PaintSize | null;

  // Actions
  setActiveLayer: (id: string) => void;
  setSelectedBin: (id: string | null) => void; // Single select (clears others)
  setSelectedBins: (ids: string[]) => void; // Set multiple
  addToSelection: (id: string) => void; // Add to existing selection
  removeFromSelection: (id: string) => void; // Remove from selection
  toggleSelection: (id: string) => void; // Toggle single bin in selection
  setActiveCategory: (id: string) => void;
  setZoom: (zoom: number) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  toggleShowOtherLayers: () => void;
  toggleShowLabels: () => void;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;

  // Interaction actions
  setInteraction: (interaction: Interaction | null) => void;
  setDropTarget: (target: DropTarget) => void;
  clearSelection: () => void;

  // Paint mode actions
  setPaintSize: (size: PaintSize | null) => void;
  togglePaintSize: (size: PaintSize) => void;
}

export const useUIStore = create<UIState>((set) => ({
  activeLayerId: '',
  selectedBinIds: [],
  activeCategoryId: 'coral',
  zoom: 1,
  showOtherLayers: true,
  showLabels: true,
  leftPanelCollapsed: false,
  rightPanelCollapsed: false,
  interaction: null,
  dropTarget: null,
  paintSize: null,

  setActiveLayer: (id) => set({
    activeLayerId: id,
    selectedBinIds: [] // Clear selection on layer change (PRD: selection is layer-scoped)
  }),

  // Single select - clears other selections
  setSelectedBin: (id) => set({ selectedBinIds: id ? [id] : [] }),

  // Set multiple bins as selected
  setSelectedBins: (ids) => set({ selectedBinIds: ids }),

  // Add a bin to existing selection
  addToSelection: (id) => set(state => ({
    selectedBinIds: state.selectedBinIds.includes(id)
      ? state.selectedBinIds
      : [...state.selectedBinIds, id]
  })),

  // Remove a bin from selection
  removeFromSelection: (id) => set(state => ({
    selectedBinIds: state.selectedBinIds.filter(binId => binId !== id)
  })),

  // Toggle a bin in selection (for Ctrl/Cmd+click)
  toggleSelection: (id) => set(state => ({
    selectedBinIds: state.selectedBinIds.includes(id)
      ? state.selectedBinIds.filter(binId => binId !== id)
      : [...state.selectedBinIds, id]
  })),

  setActiveCategory: (id) => set({ activeCategoryId: id }),

  setZoom: (zoom) => set({
    zoom: Math.max(CONSTRAINTS.ZOOM_MIN, Math.min(CONSTRAINTS.ZOOM_MAX, zoom))
  }),

  zoomIn: () => set(state => ({
    zoom: Math.min(CONSTRAINTS.ZOOM_MAX, state.zoom + CONSTRAINTS.ZOOM_STEP)
  })),

  zoomOut: () => set(state => ({
    zoom: Math.max(CONSTRAINTS.ZOOM_MIN, state.zoom - CONSTRAINTS.ZOOM_STEP)
  })),

  toggleShowOtherLayers: () => set(state => ({
    showOtherLayers: !state.showOtherLayers
  })),

  toggleShowLabels: () => set(state => ({
    showLabels: !state.showLabels
  })),

  toggleLeftPanel: () => set(state => ({
    leftPanelCollapsed: !state.leftPanelCollapsed
  })),

  toggleRightPanel: () => set(state => ({
    rightPanelCollapsed: !state.rightPanelCollapsed
  })),

  setInteraction: (interaction) => set({ interaction }),

  setDropTarget: (target) => set({ dropTarget: target }),

  clearSelection: () => set({ selectedBinIds: [], interaction: null }),

  setPaintSize: (size) => set({ paintSize: size }),

  togglePaintSize: (size) => set(state => ({
    paintSize: state.paintSize?.width === size.width && state.paintSize?.depth === size.depth
      ? null
      : size
  })),
}));
