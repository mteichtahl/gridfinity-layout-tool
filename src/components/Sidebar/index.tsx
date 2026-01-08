import { useShallow } from 'zustand/shallow';
import { useUIStore, useLayoutStore } from '../../store';
import { calcMaxGridUnits } from '../../constants';
import { ActiveLayerPanel } from './ActiveLayerPanel';
import { LayersPanel } from './LayersPanel';
import { CategoriesPanel } from './CategoriesPanel';

export function Sidebar() {
  const { collapsed, toggle } = useUIStore(
    useShallow((state) => ({
      collapsed: state.leftPanelCollapsed,
      toggle: state.toggleLeftPanel,
    }))
  );

  const {
    gridUnitMm,
    heightUnitMm,
    printBedSize,
    setGridUnitMm,
    setHeightUnitMm,
    setPrintBedSize,
  } = useLayoutStore(
    useShallow((state) => ({
      gridUnitMm: state.layout.gridUnitMm,
      heightUnitMm: state.layout.heightUnitMm,
      printBedSize: state.layout.printBedSize,
      setGridUnitMm: state.setGridUnitMm,
      setHeightUnitMm: state.setHeightUnitMm,
      setPrintBedSize: state.setPrintBedSize,
    }))
  );

  return (
    <aside
      className="flex-shrink-0 flex flex-col transition-all duration-200 ease-in-out"
      style={{
        width: collapsed ? '40px' : '256px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
      }}
    >
      {collapsed ? (
        // Collapsed state - just show expand button
        <div className="flex flex-col items-center pt-3">
          <button
            onClick={toggle}
            className="p-2 rounded-md transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
            title="Expand panel"
            aria-label="Expand left panel"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      ) : (
        // Expanded state
        <>
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '1px solid var(--border-subtle)' }}
          >
            <h2
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 'var(--font-semibold)',
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Layout
            </h2>
            <button
              onClick={toggle}
              className="p-1 rounded transition-colors"
              style={{ color: 'var(--text-tertiary)' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                e.currentTarget.style.color = 'var(--text-primary)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'var(--text-tertiary)';
              }}
              title="Collapse panel"
              aria-label="Collapse left panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div
            className="flex-1 overflow-y-auto scrollbar-thin"
            style={{
              padding: 'var(--space-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: 'var(--space-lg)',
            }}
          >
            <ActiveLayerPanel />
            <LayersPanel />
            <CategoriesPanel />

            {/* Grid Settings */}
            <div
              style={{
                marginTop: 'auto',
                paddingTop: 'var(--space-lg)',
                borderTop: '1px solid var(--border-subtle)',
              }}
            >
              <h3
                style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 'var(--font-medium)',
                  color: 'var(--text-tertiary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 'var(--space-sm)',
                }}
              >
                Grid Settings
              </h3>
              <div
                style={{
                  fontSize: 'var(--text-xs)',
                  color: 'var(--text-secondary)',
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="gridUnit"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Size of one grid unit in mm (standard Gridfinity = 42mm)"
                  >
                    1 grid unit
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="gridUnit"
                      type="number"
                      value={gridUnitMm}
                      onChange={(e) => setGridUnitMm(Number(e.target.value))}
                      min={1}
                      max={200}
                      className="input-field"
                      title="Size of one grid unit in mm (standard Gridfinity = 42mm)"
                      style={{
                        width: '48px',
                        padding: '2px 4px',
                        fontSize: 'var(--text-xs)',
                        textAlign: 'right',
                      }}
                    />
                    <span style={{ color: 'var(--text-tertiary)' }}>mm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="heightUnit"
                    style={{ color: 'var(--text-tertiary)' }}
                    title="Height of one vertical unit in mm (standard = 7mm)"
                  >
                    1u height
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="heightUnit"
                      type="number"
                      value={heightUnitMm}
                      onChange={(e) => setHeightUnitMm(Number(e.target.value))}
                      min={1}
                      max={50}
                      className="input-field"
                      title="Height of one vertical unit in mm (standard = 7mm)"
                      style={{
                        width: '48px',
                        padding: '2px 4px',
                        fontSize: 'var(--text-xs)',
                        textAlign: 'right',
                      }}
                    />
                    <span style={{ color: 'var(--text-tertiary)' }}>mm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2" style={{ borderTop: '1px solid var(--border-subtle)' }}>
                  <label
                    htmlFor="printBedSize"
                    style={{ color: 'var(--text-tertiary)' }}
                    title={`Bins larger than ${calcMaxGridUnits(printBedSize, gridUnitMm)}u will be split for printing`}
                  >
                    Print bed
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      id="printBedSize"
                      type="number"
                      value={printBedSize}
                      onChange={(e) => setPrintBedSize(Number(e.target.value))}
                      min={42}
                      max={500}
                      step={10}
                      className="input-field"
                      title={`Your 3D printer's bed size. Bins larger than ${calcMaxGridUnits(printBedSize, gridUnitMm)}×${calcMaxGridUnits(printBedSize, gridUnitMm)} will be split.`}
                      style={{
                        width: '56px',
                        padding: '2px 4px',
                        fontSize: 'var(--text-xs)',
                        textAlign: 'right',
                      }}
                    />
                    <span style={{ color: 'var(--text-tertiary)' }}>mm</span>
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '10px',
                    color: 'var(--text-disabled)',
                    marginTop: '4px',
                    textAlign: 'right',
                  }}
                >
                  Max bin size: {calcMaxGridUnits(printBedSize, gridUnitMm)}×{calcMaxGridUnits(printBedSize, gridUnitMm)}
                </div>
                <div
                  className="mt-2 pt-2"
                  style={{
                    borderTop: '1px solid var(--border-subtle)',
                    color: 'var(--text-disabled)',
                    fontSize: '10px',
                    lineHeight: '1.6',
                  }}
                >
                  <a
                    href="https://www.youtube.com/c/ZackFreedman"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-tertiary)' }}
                    className="hover:underline"
                  >
                    Gridfinity
                  </a>
                  {' '}by Zack Freedman ·{' '}
                  <a
                    href="https://www.extrabold.tools/gridfinity-baseplate"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-tertiary)' }}
                    className="hover:underline"
                  >
                    Baseplates
                  </a>
                  <br />
                  Tool by{' '}
                  <a
                    href="https://www.linkedin.com/in/andyhmai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--text-tertiary)' }}
                    className="hover:underline"
                  >
                    Andy Aragon
                  </a>
                  {' '}·{' '}
                  <a
                    href="https://ko-fi.com/andyaragon"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: 'var(--color-primary)' }}
                    className="hover:underline"
                  >
                    🧵 Tip
                  </a>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </aside>
  );
}
