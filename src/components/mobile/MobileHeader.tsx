import { useState, useRef, useEffect } from 'react';
import { useLayoutStore, useHistoryStore } from '../../store';
import { CONSTRAINTS } from '../../constants';

interface MobileHeaderProps {
  onMenuClick: () => void;
}

/**
 * Compact header for mobile layout.
 * Shows layout name (editable) and essential actions.
 */
export function MobileHeader({ onMenuClick }: MobileHeaderProps) {
  const layout = useLayoutStore(state => state.layout);
  const setName = useLayoutStore(state => state.setName);

  const canUndo = useHistoryStore(state => state.canUndo);
  const canRedo = useHistoryStore(state => state.canRedo);
  const undo = useHistoryStore(state => state.undo);
  const redo = useHistoryStore(state => state.redo);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(layout.name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleNameClick = () => {
    setEditValue(layout.name);
    setIsEditing(true);
  };

  const handleNameSubmit = () => {
    setName(editValue.trim() || 'Untitled Layout');
    setIsEditing(false);
  };

  const handleNameKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleNameSubmit();
    } else if (e.key === 'Escape') {
      setEditValue(layout.name);
      setIsEditing(false);
    }
  };

  return (
    <header
      className="h-12 flex items-center justify-between px-3 flex-shrink-0"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      {/* Left: Menu button */}
      <button
        onClick={onMenuClick}
        className="btn btn-ghost btn-icon"
        aria-label="Open settings menu"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Center: Layout name */}
      <div className="flex-1 mx-3 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            maxLength={CONSTRAINTS.NAME_MAX_LENGTH}
            className="w-full px-2 py-1 rounded text-sm text-center"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--color-primary)',
              color: 'var(--text-primary)',
            }}
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="w-full text-sm truncate py-1 rounded transition-colors"
            style={{ color: 'var(--text-primary)' }}
          >
            {layout.name}
          </button>
        )}
      </div>

      {/* Right: Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo}
          className="btn btn-ghost btn-icon"
          aria-label="Undo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="btn btn-ghost btn-icon"
          aria-label="Redo"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
          </svg>
        </button>
      </div>
    </header>
  );
}
