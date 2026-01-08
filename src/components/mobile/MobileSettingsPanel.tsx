import { useState, type CSSProperties } from 'react';
import { useLayoutStore } from '../../store';
import { calcMaxGridUnits } from '../../constants';
import { ConfirmDialog } from '../modals/ConfirmDialog';

const STYLES = {
  sectionHeading: { color: 'var(--text-tertiary)' } as CSSProperties,
  label: { color: 'var(--text-secondary)' } as CSSProperties,
  unitSuffix: { color: 'var(--text-tertiary)' } as CSSProperties,
  hintText: { color: 'var(--text-disabled)' } as CSSProperties,
  divider: { borderTop: '1px solid var(--border-subtle)' } as CSSProperties,
  footerText: { color: 'var(--text-disabled)', lineHeight: '1.6' } as CSSProperties,
  link: { color: 'var(--text-tertiary)' } as CSSProperties,
} as const;

/**
 * Mobile settings panel with grid configuration and app actions.
 */
export function MobileSettingsPanel() {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const layout = useLayoutStore(state => state.layout);
  const setGridUnitMm = useLayoutStore(state => state.setGridUnitMm);
  const setHeightUnitMm = useLayoutStore(state => state.setHeightUnitMm);
  const setPrintBedSize = useLayoutStore(state => state.setPrintBedSize);
  const updateDrawer = useLayoutStore(state => state.updateDrawer);
  const reset = useLayoutStore(state => state.reset);

  const maxGridUnits = calcMaxGridUnits(layout.printBedSize, layout.gridUnitMm);

  return (
    <div className="pb-4 space-y-6">
      {/* Drawer Dimensions */}
      <section>
        <h3
          className="text-xs font-medium uppercase tracking-wide mb-3"
          style={STYLES.sectionHeading}
        >
          Drawer Dimensions
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1" style={STYLES.label}>
              Width (units)
            </label>
            <input
              type="number"
              value={layout.drawer.width}
              onChange={(e) => updateDrawer({ width: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="input w-full h-12"
              min={1}
              max={50}
            />
          </div>
          <div>
            <label className="block text-sm mb-1" style={STYLES.label}>
              Depth (units)
            </label>
            <input
              type="number"
              value={layout.drawer.depth}
              onChange={(e) => updateDrawer({ depth: Math.max(1, parseInt(e.target.value, 10) || 1) })}
              className="input w-full h-12"
              min={1}
              max={50}
            />
          </div>
        </div>
      </section>

      {/* Grid Settings */}
      <section>
        <h3
          className="text-xs font-medium uppercase tracking-wide mb-3"
          style={STYLES.sectionHeading}
        >
          Grid Settings
        </h3>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm" style={STYLES.label}>
              1 grid unit
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={layout.gridUnitMm}
                onChange={(e) => setGridUnitMm(Number(e.target.value))}
                className="input w-20 h-10 text-center"
                min={1}
                max={200}
              />
              <span style={STYLES.unitSuffix}>mm</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm" style={STYLES.label}>
              1u height
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={layout.heightUnitMm}
                onChange={(e) => setHeightUnitMm(Number(e.target.value))}
                className="input w-20 h-10 text-center"
                min={1}
                max={50}
              />
              <span style={STYLES.unitSuffix}>mm</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm" style={STYLES.label}>
              Print bed size
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={layout.printBedSize}
                onChange={(e) => setPrintBedSize(Number(e.target.value))}
                className="input w-20 h-10 text-center"
                min={42}
                max={500}
                step={10}
              />
              <span style={STYLES.unitSuffix}>mm</span>
            </div>
          </div>

          <div
            className="text-sm text-right"
            style={STYLES.hintText}
          >
            Max bin size: {maxGridUnits}×{maxGridUnits}
          </div>
        </div>
      </section>

      {/* Actions */}
      <section>
        <h3
          className="text-xs font-medium uppercase tracking-wide mb-3"
          style={STYLES.sectionHeading}
        >
          Actions
        </h3>

        <div className="space-y-2">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="btn btn-danger w-full"
          >
            <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Reset to Defaults
          </button>
        </div>
      </section>

      {/* Info */}
      <section
        className="pt-4 text-center"
        style={STYLES.divider}
      >
        <div className="text-xs" style={STYLES.footerText}>
          <a
            href="https://www.youtube.com/c/ZackFreedman"
            target="_blank"
            rel="noopener noreferrer"
            style={STYLES.link}
            className="hover:underline"
          >
            Gridfinity
          </a>
          {' '}by Zack Freedman
          <br />
          Tool by{' '}
          <a
            href="https://www.linkedin.com/in/andyhmai/"
            target="_blank"
            rel="noopener noreferrer"
            style={STYLES.link}
            className="hover:underline"
          >
            Andy Aragon
          </a>
        </div>
      </section>

      <ConfirmDialog
        isOpen={showResetConfirm}
        title="Reset to Defaults"
        message="This will clear your layout and restore all default settings. This cannot be undone."
        confirmText="Reset"
        destructive
        onConfirm={() => { reset(); setShowResetConfirm(false); }}
        onCancel={() => setShowResetConfirm(false)}
      />
    </div>
  );
}
