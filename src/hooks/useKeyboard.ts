import { useEffect, useCallback } from 'react';
import { useUIStore, useLayoutStore, useHistoryStore, useUndoableAction } from '../store';
import { canPlaceBin } from '../utils/validation';
import { SHORTCUTS, STAGING_ID } from '../constants';

export function useKeyboard() {
  const selectedBinIds = useUIStore(state => state.selectedBinIds);
  const setSelectedBins = useUIStore(state => state.setSelectedBins);
  const setInteraction = useUIStore(state => state.setInteraction);
  const setPaintSize = useUIStore(state => state.setPaintSize);
  const zoomIn = useUIStore(state => state.zoomIn);
  const zoomOut = useUIStore(state => state.zoomOut);

  const layout = useLayoutStore(state => state.layout);
  const deleteBin = useLayoutStore(state => state.deleteBin);
  const duplicateBin = useLayoutStore(state => state.duplicateBin);
  const updateBin = useLayoutStore(state => state.updateBin);

  const undo = useHistoryStore(state => state.undo);
  const redo = useHistoryStore(state => state.redo);
  const canUndo = useHistoryStore(state => state.canUndo);
  const canRedo = useHistoryStore(state => state.canRedo);

  const { execute } = useUndoableAction();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Ignore if in input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }

    const key = e.key;
    const ctrlOrMeta = e.ctrlKey || e.metaKey;

    // Delete all selected bins
    if ((SHORTCUTS.DELETE as readonly string[]).includes(key) && selectedBinIds.length > 0) {
      e.preventDefault();
      execute(() => {
        for (const binId of selectedBinIds) {
          deleteBin(binId);
        }
      });
      setSelectedBins([]);
      return;
    }

    // Escape - clear selection and exit paint mode
    if ((SHORTCUTS.ESCAPE as readonly string[]).includes(key)) {
      e.preventDefault();
      setInteraction(null);
      setSelectedBins([]);
      setPaintSize(null);
      return;
    }

    // Undo
    if (ctrlOrMeta && key.toLowerCase() === SHORTCUTS.UNDO && !e.shiftKey) {
      e.preventDefault();
      if (canUndo) undo();
      return;
    }

    // Redo (Ctrl+Y or Ctrl+Shift+Z)
    if (ctrlOrMeta && (key.toLowerCase() === SHORTCUTS.REDO || (key === SHORTCUTS.REDO_ALT && e.shiftKey))) {
      e.preventDefault();
      if (canRedo) redo();
      return;
    }

    // Duplicate all selected bins (Ctrl+D)
    if (ctrlOrMeta && key.toLowerCase() === SHORTCUTS.DUPLICATE && selectedBinIds.length > 0) {
      e.preventDefault();
      execute(() => {
        const newIds: string[] = [];
        for (const binId of selectedBinIds) {
          const newId = duplicateBin(binId);
          if (newId) {
            newIds.push(newId);
          }
        }
        // Select the duplicated bins
        if (newIds.length > 0) {
          setSelectedBins(newIds);
        }
      });
      return;
    }

    // Zoom
    if ((SHORTCUTS.ZOOM_IN as readonly string[]).includes(key)) {
      e.preventDefault();
      zoomIn();
      return;
    }
    if ((SHORTCUTS.ZOOM_OUT as readonly string[]).includes(key)) {
      e.preventDefault();
      zoomOut();
      return;
    }

    // Arrow nudge - move all selected bins
    const nudgeKeys: readonly string[] = [SHORTCUTS.NUDGE_UP, SHORTCUTS.NUDGE_DOWN, SHORTCUTS.NUDGE_LEFT, SHORTCUTS.NUDGE_RIGHT];
    if (nudgeKeys.includes(key) && selectedBinIds.length > 0) {
      e.preventDefault();

      let dx = 0, dy = 0;
      if (key === SHORTCUTS.NUDGE_UP) dy = 1;
      if (key === SHORTCUTS.NUDGE_DOWN) dy = -1;
      if (key === SHORTCUTS.NUDGE_LEFT) dx = -1;
      if (key === SHORTCUTS.NUDGE_RIGHT) dx = 1;

      // Check if all bins can move
      const excludeIds = new Set(selectedBinIds);
      let allValid = true;

      for (const binId of selectedBinIds) {
        const bin = layout.bins.find(b => b.id === binId);
        if (!bin || bin.layerId === STAGING_ID) {
          allValid = false;
          break;
        }

        const newX = bin.x + dx;
        const newY = bin.y + dy;

        const result = canPlaceBin(
          { x: newX, y: newY, width: bin.width, depth: bin.depth, height: bin.height },
          bin.layerId,
          layout,
          binId,
          excludeIds
        );

        if (!result.valid) {
          allValid = false;
          break;
        }
      }

      if (allValid) {
        execute(() => {
          for (const binId of selectedBinIds) {
            const bin = layout.bins.find(b => b.id === binId);
            if (!bin) continue;
            updateBin(binId, { x: bin.x + dx, y: bin.y + dy });
          }
        });
      }
      return;
    }
  }, [selectedBinIds, layout, canUndo, canRedo, undo, redo, zoomIn, zoomOut, deleteBin, duplicateBin, updateBin, setSelectedBins, setInteraction, setPaintSize, execute]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
