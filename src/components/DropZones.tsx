import { useEffect, useRef, useMemo } from 'react';
import { useUIStore, useLayoutStore } from '../store';
import { STAGING_ID } from '../constants';

/**
 * Drop zones that appear when dragging bins.
 * Shows trash zone for deletion and staging zone for temporary storage.
 */
export function DropZones() {
  // Only select the interaction type to avoid re-renders on coordinate changes
  const interactionType = useUIStore((state) => state.interaction?.type ?? null);
  const interaction = useUIStore((state) => state.interaction);
  const dropTarget = useUIStore((state) => state.dropTarget);
  const setDropTarget = useUIStore((state) => state.setDropTarget);
  const bins = useLayoutStore((state) => state.layout.bins);

  // Compute staging bins count with useMemo to avoid selector returning new array
  const stagingBinCount = useMemo(
    () => bins.filter(b => b.layerId === STAGING_ID).length,
    [bins]
  );

  const trashRef = useRef<HTMLDivElement>(null);
  const stagingRef = useRef<HTMLDivElement>(null);

  // Use ref to track current dropTarget without causing effect re-runs
  const dropTargetRef = useRef(dropTarget);
  dropTargetRef.current = dropTarget;

  // Determine if we're in a dragging state
  const isDragging = interactionType === 'drag' || interactionType === 'stagingDrag';

  // Track mouse position to detect hover over drop zones
  useEffect(() => {
    if (!isDragging) {
      // Clear drop target when not dragging
      if (dropTargetRef.current) setDropTarget(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      const trashRect = trashRef.current?.getBoundingClientRect();
      const stagingRect = stagingRef.current?.getBoundingClientRect();

      const isOverTrash = trashRect &&
        e.clientX >= trashRect.left &&
        e.clientX <= trashRect.right &&
        e.clientY >= trashRect.top &&
        e.clientY <= trashRect.bottom;

      const isOverStaging = stagingRect &&
        e.clientX >= stagingRect.left &&
        e.clientX <= stagingRect.right &&
        e.clientY >= stagingRect.top &&
        e.clientY <= stagingRect.bottom;

      if (isOverTrash) {
        if (dropTargetRef.current !== 'trash') setDropTarget('trash');
      } else if (isOverStaging) {
        if (dropTargetRef.current !== 'staging') setDropTarget('staging');
      } else if (dropTargetRef.current) {
        setDropTarget(null);
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    return () => document.removeEventListener('pointermove', handlePointerMove);
  }, [isDragging, setDropTarget]);

  if (!isDragging || !interaction) {
    return null;
  }

  const binCount = interaction.type === 'drag' ? interaction.binIds.length : 1;
  const binLabel = binCount === 1 ? '1 bin' : `${binCount} bins`;

  // Don't show staging zone when already dragging from staging
  const showStagingZone = interactionType === 'drag';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex justify-center gap-4 p-4 pointer-events-none z-50"
      style={{
        background: 'linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 100%)',
      }}
    >
      {/* Trash drop zone */}
      <div
        ref={trashRef}
        className="pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-200"
        style={{
          backgroundColor: dropTarget === 'trash'
            ? 'var(--color-error)'
            : 'var(--bg-elevated)',
          border: `2px dashed ${dropTarget === 'trash' ? 'var(--color-error)' : 'var(--border-default)'}`,
          boxShadow: dropTarget === 'trash'
            ? '0 0 20px rgba(239, 68, 68, 0.4)'
            : 'var(--shadow-lg)',
          transform: dropTarget === 'trash' ? 'scale(1.05)' : 'scale(1)',
          minWidth: 160,
        }}
      >
        <svg
          className="w-6 h-6 transition-colors"
          style={{
            color: dropTarget === 'trash' ? 'white' : 'var(--text-tertiary)'
          }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        <div>
          <div
            className="font-medium transition-colors"
            style={{
              fontSize: 'var(--text-sm)',
              color: dropTarget === 'trash' ? 'white' : 'var(--text-primary)'
            }}
          >
            Delete {binLabel}
          </div>
          <div
            className="transition-colors"
            style={{
              fontSize: 'var(--text-xs)',
              color: dropTarget === 'trash' ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'
            }}
          >
            Drop here to remove
          </div>
        </div>
      </div>

      {/* Staging drop zone - only show when dragging from grid, not from staging */}
      {showStagingZone && (
        <div
          ref={stagingRef}
          className="pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-xl transition-all duration-200"
          style={{
            backgroundColor: dropTarget === 'staging'
              ? 'var(--color-primary)'
              : 'var(--bg-elevated)',
            border: `2px dashed ${dropTarget === 'staging' ? 'var(--color-primary)' : 'var(--border-default)'}`,
            boxShadow: dropTarget === 'staging'
              ? '0 0 20px rgba(59, 130, 246, 0.4)'
              : 'var(--shadow-lg)',
            transform: dropTarget === 'staging' ? 'scale(1.05)' : 'scale(1)',
            minWidth: 160,
          }}
        >
          <svg
            className="w-6 h-6 transition-colors"
            style={{
              color: dropTarget === 'staging' ? 'white' : 'var(--text-tertiary)'
            }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <div>
            <div
              className="font-medium transition-colors"
              style={{
                fontSize: 'var(--text-sm)',
                color: dropTarget === 'staging' ? 'white' : 'var(--text-primary)'
              }}
            >
              Stage {binLabel}
            </div>
            <div
              className="transition-colors"
              style={{
                fontSize: 'var(--text-xs)',
                color: dropTarget === 'staging' ? 'rgba(255,255,255,0.8)' : 'var(--text-tertiary)'
              }}
            >
              {stagingBinCount > 0 ? `${stagingBinCount} bins staged` : 'Temporary storage'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
