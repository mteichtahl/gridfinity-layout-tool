import { useState, useRef, useEffect, type ReactNode } from 'react';

interface CollapsiblePanelProps {
  title: string;
  badge?: ReactNode;
  defaultExpanded?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * Collapsible panel with smooth animation and consistent styling.
 * Used for sidebar sections and right panel sections.
 */
export function CollapsiblePanel({
  title,
  badge,
  defaultExpanded = true,
  children,
  className = ''
}: CollapsiblePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | 'auto'>('auto');

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, []);

  return (
    <div
      className={`panel overflow-hidden ${className}`}
      style={{
        background: 'linear-gradient(180deg, var(--bg-elevated) 0%, var(--bg-secondary) 100%)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
      }}
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 transition-colors bg-transparent text-content hover:bg-surface-hover"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="section-header m-0">
          {title}
        </span>
        <div className="flex items-center gap-2">
          {badge && <span className="text-xs text-content-tertiary">{badge}</span>}
          <svg
            className={`w-4 h-4 transition-transform duration-200 text-content-tertiary ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Content with animation */}
      <div
        className="transition-all duration-200 ease-out overflow-hidden"
        style={{
          maxHeight: isExpanded ? (contentHeight === 'auto' ? '1000px' : `${contentHeight}px`) : 0,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4">
          {children}
        </div>
      </div>
    </div>
  );
}
