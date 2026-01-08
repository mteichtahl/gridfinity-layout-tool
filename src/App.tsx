import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useLayoutStore, useUIStore } from './store';
import { useKeyboard, useAutoSave } from './hooks';
import { loadLayout } from './utils/storage';
import { Grid } from './components/Grid';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Staging } from './components/Staging';
import { RightPanel } from './components/RightPanel';
import { DropZones } from './components/DropZones';
import { DragPreview } from './components/DragPreview';
import { HelpModal } from './components/modals/HelpModal';
import { ToastContainer } from './components/Toast';
import { SHORTCUTS } from './constants';

// Load layout once at module level to avoid effect setState issues
let initialLoadError: Error | null = null;
try {
  const savedLayout = loadLayout();
  if (savedLayout) {
    useLayoutStore.getState().importLayout(savedLayout);
  }
} catch (e) {
  console.error('Error loading layout:', e);
  initialLoadError = e as Error;
}

export default function App() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [showViewportWarning, setShowViewportWarning] = useState(false);

  // Check viewport size
  useEffect(() => {
    const checkViewport = () => {
      setShowViewportWarning(window.innerWidth < 1024);
    };
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  const layout = useLayoutStore(state => state.layout);
  const activeLayerId = useUIStore(state => state.activeLayerId);
  const activeCategoryId = useUIStore(state => state.activeCategoryId);
  const setActiveLayer = useUIStore(state => state.setActiveLayer);
  const setActiveCategory = useUIStore(state => state.setActiveCategory);
  const paintSize = useUIStore(state => state.paintSize);
  const setPaintSize = useUIStore(state => state.setPaintSize);

  // Initialize activeLayerId and activeCategoryId to valid values (sync before paint)
  useLayoutEffect(() => {
    // Check if current activeLayerId is valid for the current layout
    const layerExists = layout.layers.some(l => l.id === activeLayerId);
    if ((!activeLayerId || !layerExists) && layout.layers.length > 0) {
      setActiveLayer(layout.layers[0].id);
    }
    // Ensure activeCategoryId is valid for current layout
    const categoryExists = layout.categories.some(c => c.id === activeCategoryId);
    if (!categoryExists && layout.categories.length > 0) {
      setActiveCategory(layout.categories[0].id);
    }
  }, [activeLayerId, activeCategoryId, layout.layers, layout.categories, setActiveLayer, setActiveCategory]);

  // Global keyboard shortcuts
  useKeyboard();

  // Auto-save to localStorage
  useAutoSave();

  // Help modal keyboard shortcut
  const handleHelpKeyboard = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
      return;
    }
    if (e.key === SHORTCUTS.HELP) {
      e.preventDefault();
      setIsHelpOpen(prev => !prev);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleHelpKeyboard);
    return () => window.removeEventListener('keydown', handleHelpKeyboard);
  }, [handleHelpKeyboard]);

  if (initialLoadError) {
    return (
      <div className="h-screen flex items-center justify-center bg-red-900 text-white">
        <div>
          <h1>Error loading app</h1>
          <pre>{initialLoadError.message}</pre>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Viewport warning */}
      {showViewportWarning && (
        <div className="px-4 py-2 text-sm flex items-center justify-between" style={{ backgroundColor: 'var(--color-warning-muted)', color: 'var(--color-warning)' }}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            This tool works best on screens 1024px or wider
          </span>
          <button
            onClick={() => setShowViewportWarning(false)}
            className="hover:opacity-80 ml-4 p-1 rounded transition-opacity"
            aria-label="Dismiss warning"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Header */}
      <Header onHelpClick={() => setIsHelpOpen(true)} />

      {/* Main content area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left sidebar */}
        <Sidebar />

        {/* Grid area */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <Grid />
          <Staging />
        </main>

        {/* Right panel - Selection & Actions */}
        <RightPanel />
      </div>

      {/* Drop zones (appear when dragging) */}
      <DropZones />

      {/* Floating drag preview */}
      <DragPreview />

      {/* Modals */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />

      {/* Paint mode indicator */}
      {paintSize && (
        <div className="paint-mode-indicator" role="status" aria-live="polite">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Paint Mode: {paintSize.width}×{paintSize.depth}</span>
          <button
            onClick={() => setPaintSize(null)}
            className="ml-1 hover:opacity-80 transition-opacity"
            aria-label="Exit paint mode"
          >
            <kbd>Esc</kbd>
          </button>
        </div>
      )}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
