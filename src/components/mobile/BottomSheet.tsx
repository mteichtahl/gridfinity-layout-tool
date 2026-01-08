import { useEffect, useRef, useState, useCallback } from 'react';
import { useUIStore, type MobilePanel } from '../../store/ui';

interface BottomSheetProps {
  children: React.ReactNode;
  title: string;
}

/**
 * Bottom sheet container for mobile panels.
 * Features gesture dismiss (swipe down) and backdrop tap to close.
 */
export function BottomSheet({ children, title }: BottomSheetProps) {
  const activeMobilePanel = useUIStore(state => state.activeMobilePanel);
  const closeMobilePanel = useUIStore(state => state.closeMobilePanel);

  const sheetRef = useRef<HTMLDivElement>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);

  const isOpen = activeMobilePanel !== null;

  // Handle swipe down to dismiss
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    // Only track drags on the header area
    if (!(e.target as HTMLElement).closest('[data-sheet-header]')) return;

    setIsDragging(true);
    dragStartY.current = e.clientY;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging) return;

    const deltaY = e.clientY - dragStartY.current;
    // Only allow dragging down
    setDragY(Math.max(0, deltaY));
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;

    setIsDragging(false);
    // If dragged more than 100px, close the sheet
    if (dragY > 100) {
      closeMobilePanel();
    }
    setDragY(0);
  }, [isDragging, dragY, closeMobilePanel]);

  // Close on escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeMobilePanel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeMobilePanel]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          opacity: isDragging ? 1 - dragY / 300 : 1,
        }}
        onClick={closeMobilePanel}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-50 flex flex-col rounded-t-2xl transition-transform duration-200"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          maxHeight: '85vh',
          transform: `translateY(${dragY}px)`,
          transitionDuration: isDragging ? '0ms' : '200ms',
          paddingBottom: 'calc(var(--bottom-nav-height) + env(safe-area-inset-bottom))',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        {/* Drag handle and header */}
        <div
          data-sheet-header
          className="flex flex-col items-center pt-2 pb-3 cursor-grab active:cursor-grabbing"
          style={{ touchAction: 'none' }}
        >
          {/* Drag indicator */}
          <div
            className="w-10 h-1 rounded-full mb-3"
            style={{ backgroundColor: 'var(--border-default)' }}
          />

          {/* Title row */}
          <div className="w-full flex items-center justify-between px-4">
            <h2
              className="text-base font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              {title}
            </h2>
            <button
              onClick={closeMobilePanel}
              className="btn btn-ghost btn-icon"
              aria-label="Close panel"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto px-4"
          style={{ overscrollBehavior: 'contain' }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

/**
 * Get the title for a mobile panel
 */
export function getPanelTitle(panel: MobilePanel): string {
  switch (panel) {
    case 'layers':
      return 'Layers & Bins';
    case 'inspector':
      return 'Bin Properties';
    case 'categories':
      return 'Categories';
    case 'print':
      return 'Print List';
    case 'settings':
      return 'Settings';
    default:
      return '';
  }
}
