import { useEffect, useRef } from 'react';
import { useLayoutStore } from '../store';
import { saveLayout } from '../utils/storage';

const SAVE_DEBOUNCE_MS = 1000;

export function useAutoSave() {
  const layout = useLayoutStore(state => state.layout);
  const timeoutRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Clear any pending save
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Schedule save
    timeoutRef.current = window.setTimeout(() => {
      try {
        saveLayout(layout);
      } catch (e) {
        console.error('Auto-save failed:', e);
        // Could emit a toast notification here
      }
    }, SAVE_DEBOUNCE_MS);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [layout]);
}
