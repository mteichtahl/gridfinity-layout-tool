import { useEffect, useRef } from 'react';
import { useLayoutStore, useUIStore, useUndoableAction } from '../../store';
import { STAGING_ID } from '../../constants';
import type { Bin } from '../../types';

interface BinContextMenuProps {
  bin: Bin;
  position: { x: number; y: number };
  onClose: () => void;
}

/**
 * Context menu for bin actions on mobile (triggered by long-press).
 */
export function BinContextMenu({ bin, position, onClose }: BinContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  const deleteBin = useLayoutStore(state => state.deleteBin);
  const moveBinToStaging = useLayoutStore(state => state.moveBinToStaging);
  const duplicateBin = useLayoutStore(state => state.duplicateBin);
  const setSelectedBins = useUIStore(state => state.setSelectedBins);
  const toggleMobilePanel = useUIStore(state => state.toggleMobilePanel);

  const { execute } = useUndoableAction();

  // Close on outside click - use pointerdown for unified mouse/touch handling
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Use timeout to avoid immediate close from the triggering event
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handlePointerDown);
    }, 100);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handlePointerDown);
    };
  }, [onClose]);

  // Close on escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Position adjustment to stay within viewport
  const adjustedPosition = {
    x: Math.min(position.x, window.innerWidth - 200),
    y: Math.min(position.y, window.innerHeight - 250),
  };

  const handleDelete = () => {
    execute(() => deleteBin(bin.id));
    setSelectedBins([]);
    onClose();
  };

  const handleToStaging = () => {
    execute(() => moveBinToStaging(bin.id));
    onClose();
  };

  const handleDuplicate = () => {
    execute(() => duplicateBin(bin.id));
    onClose();
  };

  const handleEdit = () => {
    setSelectedBins([bin.id]);
    toggleMobilePanel('inspector');
    onClose();
  };

  const isOnGrid = bin.layerId !== STAGING_ID;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
        onClick={onClose}
      />

      {/* Menu */}
      <div
        ref={menuRef}
        className="fixed z-50 rounded-xl overflow-hidden shadow-xl"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          backgroundColor: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          minWidth: '180px',
        }}
      >
        {/* Header */}
        <div
          className="px-4 py-3"
          style={{ borderBottom: '1px solid var(--border-subtle)' }}
        >
          <div className="font-medium" style={{ color: 'var(--text-primary)' }}>
            {bin.width}×{bin.depth} Bin
          </div>
          {bin.label && (
            <div className="text-sm truncate" style={{ color: 'var(--text-tertiary)' }}>
              {bin.label}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="py-1">
          <button
            onClick={handleEdit}
            className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            Edit Properties
          </button>

          <button
            onClick={handleDuplicate}
            className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
            style={{ color: 'var(--text-primary)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Duplicate
          </button>

          {isOnGrid && (
            <button
              onClick={handleToStaging}
              className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
              style={{ color: 'var(--text-primary)' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <svg className="w-5 h-5" style={{ color: 'var(--text-tertiary)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Move to Staging
            </button>
          )}

          <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0' }} />

          <button
            onClick={handleDelete}
            className="w-full px-4 py-3 flex items-center gap-3 transition-colors"
            style={{ color: 'var(--color-error)' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--color-error-muted)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </>
  );
}
