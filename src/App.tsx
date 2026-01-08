import { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { useLayoutStore, useUIStore } from './store';
import { useKeyboard, useAutoSave, useResponsive } from './hooks';
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
import {
  MobileHeader,
  BottomNavBar,
  BottomSheet,
  getPanelTitle,
  MobileLayersPanel,
  MobileCategoriesPanel,
  MobileInspector,
  MobilePrintList,
  MobileSettingsPanel,
} from './components/mobile';
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
  const { isMobile } = useResponsive();
  const activeMobilePanel = useUIStore(state => state.activeMobilePanel);
  const setActiveMobilePanel = useUIStore(state => state.setActiveMobilePanel);

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

  // Mobile layout
  if (isMobile) {
    return (
      <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
        {/* Mobile Header */}
        <MobileHeader onMenuClick={() => setActiveMobilePanel('settings')} />

        {/* Main content area - Grid takes full width */}
        <main className="flex-1 flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <Grid />
          <Staging />
        </main>

        {/* Bottom Navigation */}
        <BottomNavBar />

        {/* Bottom Sheet for panels */}
        {activeMobilePanel && (
          <BottomSheet title={getPanelTitle(activeMobilePanel)}>
            <MobilePanelContent panel={activeMobilePanel} />
          </BottomSheet>
        )}

        {/* Drop zones (appear when dragging) */}
        <DropZones />

        {/* Floating drag preview */}
        <DragPreview />

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

  // Desktop layout (unchanged)
  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
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

/**
 * Mobile panel content based on active panel type.
 */
function MobilePanelContent({ panel }: { panel: string }) {
  switch (panel) {
    case 'layers':
      return <MobileLayersPanel />;
    case 'inspector':
      return <MobileInspector />;
    case 'categories':
      return <MobileCategoriesPanel />;
    case 'print':
      return <MobilePrintList />;
    case 'settings':
      return <MobileSettingsPanel />;
    default:
      return null;
  }
}
