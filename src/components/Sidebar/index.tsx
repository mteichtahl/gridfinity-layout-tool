import { useShallow } from 'zustand/shallow';
import { useUIStore, useLayoutStore } from '../../store';
import { calcMaxGridUnits } from '../../constants';
import { useAdvancedLayerMode } from '../../hooks/useAdvancedLayerMode';
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

  const showAdvancedLayers = useAdvancedLayerMode();

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
      className="flex-shrink-0 flex flex-col transition-all duration-200 ease-in-out bg-surface-secondary border-r border-stroke-subtle"
      style={{ width: collapsed ? '40px' : '256px' }}
    >
      {collapsed ? (
        // Collapsed state - just show expand button
        <div className="flex flex-col items-center pt-3">
          <button
            onClick={toggle}
            className="p-2 rounded-md transition-colors text-content-secondary hover:bg-surface-hover hover:text-content"
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-stroke-subtle">
            <h2 className="text-sm font-semibold text-content-secondary uppercase tracking-wide">
              Layout
            </h2>
            <button
              onClick={toggle}
              className="p-1 rounded transition-colors text-content-tertiary hover:bg-surface-hover hover:text-content"
              title="Collapse panel"
              aria-label="Collapse left panel"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 flex flex-col gap-4">
            <ActiveLayerPanel />
            {showAdvancedLayers && <LayersPanel />}
            <CategoriesPanel />

            {/* Grid Settings */}
            <div className="mt-auto pt-4 border-t border-stroke-subtle">
              <h3 className="text-xs font-medium text-content-tertiary uppercase tracking-wide mb-2">
                Grid Settings
              </h3>
              <div className="text-xs text-content-secondary">
                <div className="flex items-center justify-between mb-2">
                  <label
                    htmlFor="gridUnit"
                    className="text-content-tertiary"
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
                      className="input-field w-12 py-0.5 px-1 text-xs text-right"
                      title="Size of one grid unit in mm (standard Gridfinity = 42mm)"
                    />
                    <span className="text-content-tertiary">mm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="heightUnit"
                    className="text-content-tertiary"
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
                      className="input-field w-12 py-0.5 px-1 text-xs text-right"
                      title="Height of one vertical unit in mm (standard = 7mm)"
                    />
                    <span className="text-content-tertiary">mm</span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-stroke-subtle">
                  <label
                    htmlFor="printBedSize"
                    className="text-content-tertiary"
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
                      className="input-field w-14 py-0.5 px-1 text-xs text-right"
                      title={`Your 3D printer's bed size. Bins larger than ${calcMaxGridUnits(printBedSize, gridUnitMm)}×${calcMaxGridUnits(printBedSize, gridUnitMm)} will be split.`}
                    />
                    <span className="text-content-tertiary">mm</span>
                  </div>
                </div>
                <div className="text-[10px] text-content-disabled mt-1 text-right">
                  Max bin size: {calcMaxGridUnits(printBedSize, gridUnitMm)}×{calcMaxGridUnits(printBedSize, gridUnitMm)}
                </div>
                <div className="mt-2 pt-2 border-t border-stroke-subtle text-content-disabled text-[10px] leading-relaxed">
                  <a
                    href="https://www.youtube.com/c/ZackFreedman"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-content-tertiary hover:underline"
                  >
                    Gridfinity
                  </a>
                  {' '}by Zack Freedman ·{' '}
                  <a
                    href="https://www.extrabold.tools/gridfinity-baseplate"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-content-tertiary hover:underline"
                  >
                    Baseplates
                  </a>
                  <br />
                  Tool by{' '}
                  <a
                    href="https://www.linkedin.com/in/andyhmai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-content-tertiary hover:underline"
                  >
                    Andy Aragon
                  </a>
                  {' '}·{' '}
                  <a
                    href="https://ko-fi.com/andyaragon"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
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
