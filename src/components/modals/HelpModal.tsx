import { useEffect } from 'react';
import { SHORTCUTS } from '../../constants';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HelpModal({ isOpen, onClose }: HelpModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatKey = (key: string | readonly string[]): string => {
    if (Array.isArray(key)) {
      return key.join(' or ');
    }
    return key as string;
  };

  const getModifierKey = () => {
    const isMac = navigator.platform.toLowerCase().includes('mac');
    return isMac ? '⌘' : 'Ctrl';
  };

  return (
    <div
      className="fixed inset-0 flex items-center justify-center z-50 animate-fade-in"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto scrollbar-thin animate-scale-in"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-xl)',
          padding: 'var(--space-2xl)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
      >
        <div className="flex justify-between items-center mb-6">
          <h2
            id="help-title"
            style={{
              fontSize: 'var(--text-2xl)',
              fontWeight: 'var(--font-bold)',
              color: 'var(--text-primary)',
            }}
          >
            Keyboard Shortcuts & Help
          </h2>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-icon"
            style={{ minWidth: 'auto', minHeight: 'auto' }}
            aria-label="Close help"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Keyboard Shortcuts Section */}
          <section>
            <h3
              className="mb-4"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Keyboard Shortcuts
            </h3>
            <div
              className="space-y-2 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <ShortcutRow
                keys={[getModifierKey(), formatKey(SHORTCUTS.UNDO)]}
                description="Undo"
              />
              <ShortcutRow
                keys={[getModifierKey(), formatKey(SHORTCUTS.REDO)]}
                description="Redo"
              />
              <ShortcutRow
                keys={[getModifierKey(), 'D']}
                description="Duplicate selected bin"
              />
              <ShortcutRow
                keys={formatKey(SHORTCUTS.DELETE)}
                description="Delete selected bin"
              />
              <ShortcutRow
                keys={formatKey(SHORTCUTS.ESCAPE)}
                description="Cancel operation or deselect"
              />
              <ShortcutRow
                keys={formatKey(SHORTCUTS.ZOOM_IN)}
                description="Zoom in"
              />
              <ShortcutRow
                keys={formatKey(SHORTCUTS.ZOOM_OUT)}
                description="Zoom out"
              />
              <ShortcutRow
                keys={formatKey(SHORTCUTS.HELP)}
                description="Show this help"
              />
              <div className="divider" />
              <ShortcutRow
                keys="Arrow keys"
                description="Nudge selected bin"
              />
            </div>
          </section>

          {/* Mouse Interactions Section */}
          <section>
            <h3
              className="mb-4"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Mouse Interactions
            </h3>
            <div
              className="space-y-2 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <InteractionRow
                action="Click + drag on empty cell"
                description="Draw a new bin"
              />
              <InteractionRow
                action="Click on bin"
                description="Select bin"
              />
              <InteractionRow
                action="Drag selected bin"
                description="Move bin"
              />
              <InteractionRow
                action="Drag edge or corner handle"
                description="Resize bin"
              />
              <InteractionRow
                action="Click empty area"
                description="Deselect bin"
              />
            </div>
          </section>

          {/* Tips Section */}
          <section>
            <h3
              className="mb-4"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Tips
            </h3>
            <ul
              className="space-y-2 p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--color-primary)' }}>•</span>
                <span>Use the Bin Palette to select a size, then click or drag to paint bins</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--color-primary)' }}>•</span>
                <span>Bins that exceed the max print size will be automatically split</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--color-primary)' }}>•</span>
                <span>Drag layers in the sidebar to reorder them vertically</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--color-primary)' }}>•</span>
                <span>Double-click layer names to rename them, click the edit icon to edit categories</span>
              </li>
              <li className="flex items-start gap-2">
                <span style={{ color: 'var(--color-primary)' }}>•</span>
                <span>Your layout is automatically saved to your browser</span>
              </li>
            </ul>
          </section>

          {/* Blocked Zones Section */}
          <section>
            <h3
              className="mb-4"
              style={{
                fontSize: 'var(--text-lg)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-primary)',
              }}
            >
              Blocked Zones
            </h3>
            <div
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: 'var(--text-sm)',
                color: 'var(--text-secondary)',
              }}
            >
              <p className="mb-3">
                <strong style={{ color: 'var(--text-primary)' }}>What are blocked zones?</strong>
              </p>
              <p className="mb-3">
                When a bin is taller than its layer height, it extends into layers above.
                These areas appear as striped cells and cannot have new bins placed on them.
              </p>
              <p>
                <strong style={{ color: 'var(--text-primary)' }}>Example:</strong> A 5u tall bin on Layer 1 (3u) extends 2u into Layer 2.
                Those cells on Layer 2 are blocked because the physical bin occupies that space.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function ShortcutRow({
  keys,
  description,
}: {
  keys: string | readonly string[];
  description: string;
}) {
  const keyArray = Array.isArray(keys) ? keys : [keys];

  return (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        {description}
      </span>
      <div className="flex gap-1">
        {keyArray.map((key) => (
          <kbd
            key={key}
            className="px-2 py-1 rounded font-mono"
            style={{
              fontSize: 'var(--text-xs)',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-default)',
              color: 'var(--text-primary)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}

function InteractionRow({
  action,
  description,
}: {
  action: string;
  description: string;
}) {
  return (
    <div className="flex justify-between items-center">
      <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
        {description}
      </span>
      <span
        className="italic"
        style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}
      >
        {action}
      </span>
    </div>
  );
}
