import { useState, useRef, useEffect } from 'react';
import { useLayoutStore, useHistoryStore } from '../store';
import { CONSTRAINTS } from '../constants';
import { ConfirmDialog } from './modals/ConfirmDialog';

interface HeaderProps {
  onHelpClick: () => void;
}

export function Header({ onHelpClick }: HeaderProps) {
  const layout = useLayoutStore(state => state.layout);
  const setName = useLayoutStore(state => state.setName);
  const reset = useLayoutStore(state => state.reset);

  // Undo/Redo state
  const canUndo = useHistoryStore(state => state.canUndo);
  const canRedo = useHistoryStore(state => state.canRedo);
  const undo = useHistoryStore(state => state.undo);
  const redo = useHistoryStore(state => state.redo);

  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(layout.name);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
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


  // Platform detection for keyboard shortcut hints
  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const modKey = isMac ? '⌘' : 'Ctrl';

  return (
    <header
      className="h-12 flex items-center justify-between px-4"
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderBottom: '1px solid var(--border-subtle)'
      }}
    >
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Gridfinity Layout Tool
        </h1>

        {/* Divider */}
        <div className="w-px h-6" style={{ backgroundColor: 'var(--border-subtle)' }} />

        {/* Layout name */}
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={handleNameKeyDown}
            maxLength={CONSTRAINTS.NAME_MAX_LENGTH}
            className="px-3 py-1.5 rounded-md text-sm transition-all"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              border: '1px solid var(--color-primary)',
              color: 'var(--text-primary)',
              boxShadow: '0 0 0 3px var(--color-primary-muted)'
            }}
          />
        ) : (
          <button
            onClick={handleNameClick}
            className="px-3 py-1.5 text-sm rounded-md transition-all hover:scale-[1.02]"
            style={{
              color: 'var(--text-secondary)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Click to edit layout name"
          >
            {layout.name}
          </button>
        )}
      </div>

      <div className="flex items-center gap-1">
        {/* Undo/Redo buttons */}
        <div className="flex items-center mr-2" style={{ borderRight: '1px solid var(--border-subtle)', paddingRight: '8px' }}>
          <button
            onClick={undo}
            disabled={!canUndo}
            className="btn btn-ghost btn-icon"
            title={`Undo last action (${modKey}+Z)`}
            aria-label={`Undo (${modKey}+Z)`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
            </svg>
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="btn btn-ghost btn-icon"
            title={`Redo last undone action (${modKey}+Y or ${modKey}+Shift+Z)`}
            aria-label={`Redo (${modKey}+Y)`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
            </svg>
          </button>
        </div>

        <button
          onClick={() => setShowResetConfirm(true)}
          className="btn btn-ghost btn-icon"
          title="Reset to defaults"
          aria-label="Reset layout to defaults"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>

        <button
          onClick={onHelpClick}
          className="btn btn-ghost btn-icon"
          title="Show keyboard shortcuts (press ?)"
          aria-label="Show help and keyboard shortcuts"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </div>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset to Defaults"
        message="This will clear your current layout and restore all default settings. This action cannot be undone."
        confirmText="Reset"
        destructive
        onConfirm={reset}
        onCancel={() => setShowResetConfirm(false)}
      />
    </header>
  );
}
