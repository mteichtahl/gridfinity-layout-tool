import { useState, useCallback, type CSSProperties } from 'react';
import { useShallow } from 'zustand/shallow';
import { useLayoutStore, useUIStore, useUndoableAction } from '../../store';
import { CONSTRAINTS } from '../../constants';
import { getDisplayLayers } from '../../utils/collision';
import { ConfirmDialog } from '../modals/ConfirmDialog';

const STYLES = {
  panel: { padding: 'var(--space-lg)' } as CSSProperties,
  sectionHeaderNoMargin: { margin: 0 } as CSSProperties,
  separatorText: { color: 'var(--text-disabled)', fontSize: 'var(--text-xs)' } as CSSProperties,
  inputFontXs: { fontSize: 'var(--text-xs)' } as CSSProperties,
  unitSuffix: { color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' } as CSSProperties,
  errorBox: {
    backgroundColor: 'var(--color-error-muted)',
    border: '1px solid var(--color-error)',
    color: 'var(--color-error)',
    fontSize: 'var(--text-xs)',
  } as CSSProperties,
  dragHandle: { color: 'var(--text-disabled)' } as CSSProperties,
  layerName: { color: 'var(--text-primary)' } as CSSProperties,
  heightBadge: {
    backgroundColor: 'var(--bg-elevated)',
    color: 'var(--text-secondary)',
  } as CSSProperties,
  deleteButton: { color: 'var(--text-tertiary)' } as CSSProperties,
  statsRow: { fontSize: '11px', color: 'var(--text-disabled)' } as CSSProperties,
  progressBarBg: { backgroundColor: 'var(--bg-elevated)', maxWidth: '60px' } as CSSProperties,
} as const;

export function LayersPanel() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteLayerId, setDeleteLayerId] = useState<string | null>(null);
  const [dragSourceIndex, setDragSourceIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [reorderError, setReorderError] = useState<string | null>(null);

  const { layout, addLayer, updateLayer, deleteLayer, reorderLayers, updateDrawer } = useLayoutStore(
    useShallow((state) => ({
      layout: state.layout,
      addLayer: state.addLayer,
      updateLayer: state.updateLayer,
      deleteLayer: state.deleteLayer,
      reorderLayers: state.reorderLayers,
      updateDrawer: state.updateDrawer,
    }))
  );
  const layers = layout.layers;
  const bins = layout.bins;
  const drawer = layout.drawer;

  const { activeLayerId, setActiveLayer } = useUIStore(
    useShallow((state) => ({
      activeLayerId: state.activeLayerId,
      setActiveLayer: state.setActiveLayer,
    }))
  );

  const { execute } = useUndoableAction();

  const totalLayerHeight = layers.reduce((sum, l) => sum + l.height, 0);

  // Display is reversed: index 0 in display = last in array (top layer)
  const displayToArrayIndex = (displayIndex: number) => layers.length - 1 - displayIndex;

  const handleAddLayer = () => {
    execute(() => {
      const id = addLayer();
      if (id) {
        setActiveLayer(id);
      }
    });
  };

  const handleDrawerHeightChange = (value: string) => {
    const newHeight = Math.max(1, parseInt(value, 10) || 1);
    execute(() => {
      updateDrawer({ height: newHeight });
    });
  };

  const handleDeleteLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (layers.length <= CONSTRAINTS.LAYERS_MIN) return;
    setDeleteLayerId(id);
  };

  const confirmDeleteLayer = () => {
    if (!deleteLayerId) return;
    execute(() => {
      const deleted = deleteLayer(deleteLayerId);
      if (deleted && activeLayerId === deleteLayerId && layers.length > 0) {
        const remaining = layers.filter(l => l.id !== deleteLayerId);
        if (remaining.length > 0) {
          setActiveLayer(remaining[0].id);
        }
      }
    });
    setDeleteLayerId(null);
  };

  const handleHeightChange = (id: string, value: string) => {
    execute(() => {
      updateLayer(id, { height: parseInt(value, 10) || 1 });
    });
  };

  const handleNameChange = (id: string, name: string) => {
    execute(() => {
      updateLayer(id, { name: name.slice(0, CONSTRAINTS.LABEL_MAX_LENGTH) });
    });
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, displayIndex: number) => {
    setDragSourceIndex(displayIndex);
    setReorderError(null);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(displayIndex));
  };

  const handleDragOver = (e: React.DragEvent, displayIndex: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragSourceIndex !== null && displayIndex !== dragSourceIndex) {
      setDragOverIndex(displayIndex);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, targetDisplayIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (dragSourceIndex === null || dragSourceIndex === targetDisplayIndex) {
      setDragSourceIndex(null);
      return;
    }

    // Convert display indices to array indices
    const fromArrayIndex = displayToArrayIndex(dragSourceIndex);
    const toArrayIndex = displayToArrayIndex(targetDisplayIndex);

    execute(() => {
      const result = reorderLayers(fromArrayIndex, toArrayIndex);
      if (!result.success && result.error) {
        setReorderError(result.error);
        // Clear error after 3 seconds
        setTimeout(() => setReorderError(null), 3000);
      }
    });

    setDragSourceIndex(null);
  };

  const handleDragEnd = () => {
    setDragSourceIndex(null);
    setDragOverIndex(null);
  };

  const layerToDelete = deleteLayerId ? layers.find(l => l.id === deleteLayerId) : null;
  const binsInLayer = deleteLayerId ? bins.filter(b => b.layerId === deleteLayerId).length : 0;

  const cancelDeleteLayer = useCallback(() => {
    setDeleteLayerId(null);
  }, []);

  // Reversed for display (topmost layer first)
  const displayLayers = getDisplayLayers(layers);

  const canAddLayer = totalLayerHeight < layout.drawer.height;

  return (
    <div
      className="panel"
      style={STYLES.panel}
    >
      <div className="flex justify-between items-center mb-3">
        <h2 className="section-header" style={STYLES.sectionHeaderNoMargin}>Layers</h2>
        <div className="flex items-center gap-1">
          <span
            className="text-xs font-medium"
            style={{
              color: totalLayerHeight > drawer.height ? 'var(--color-error)' : 'var(--text-tertiary)',
            }}
            title="Total layer height"
          >
            {totalLayerHeight}
          </span>
          <span style={STYLES.separatorText}>/</span>
          <input
            type="number"
            value={drawer.height}
            onChange={(e) => handleDrawerHeightChange(e.target.value)}
            className="input w-10 py-0.5 px-1 text-center"
            style={STYLES.inputFontXs}
            min={1}
            title="Drawer height"
            aria-label="Drawer height"
          />
          <span style={STYLES.unitSuffix}>u</span>
        </div>
      </div>

      {/* Reorder error message */}
      {reorderError && (
        <div
          className="mb-3 p-2 rounded-md flex items-center gap-2 animate-shake"
          style={STYLES.errorBox}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {reorderError}
        </div>
      )}

      <div className="space-y-1">
        {displayLayers.map((layer, displayIndex) => {
          const isActive = layer.id === activeLayerId;
          const isEditingName = editingId === layer.id;
          const isEditingHeight = editingId === `${layer.id}-height`;
          const isDragging = dragSourceIndex === displayIndex;
          const isDragOver = dragOverIndex === displayIndex;
          const layerBins = bins.filter(b => b.layerId === layer.id);
          const binCount = layerBins.length;
          const totalCells = layout.drawer.width * layout.drawer.depth;
          const coveredCells = layerBins.reduce((sum, b) => sum + b.width * b.depth, 0);
          const coverage = totalCells > 0 ? Math.round((coveredCells / totalCells) * 100) : 0;

          return (
            <div
              key={layer.id}
              draggable={!isEditingName && !isEditingHeight && layers.length > 1}
              onDragStart={(e) => handleDragStart(e, displayIndex)}
              onDragOver={(e) => handleDragOver(e, displayIndex)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, displayIndex)}
              onDragEnd={handleDragEnd}
              className="group relative rounded-lg transition-all"
              style={{
                backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
                opacity: isDragging ? 0.5 : 1,
                border: isDragOver ? '2px solid var(--color-primary)' : '2px solid transparent',
                padding: '10px 12px',
              }}
              onClick={() => setActiveLayer(layer.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveLayer(layer.id);
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`${layer.name}, ${layer.height} units tall, ${binCount} bins placed, ${coverage}% coverage. ${isActive ? 'Currently active.' : 'Click to select.'}`}
            >
              {/* Main row */}
              <div className="flex items-center gap-2">
                {/* Drag handle - only when multiple layers */}
                {layers.length > 1 && (
                  <div
                    className="flex-shrink-0 cursor-grab active:cursor-grabbing"
                    style={STYLES.dragHandle}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                    </svg>
                  </div>
                )}

                {/* Layer name - double-click to edit */}
                {isEditingName ? (
                  <input
                    type="text"
                    value={layer.name}
                    onChange={(e) => handleNameChange(layer.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    className="input flex-1 min-w-0 py-1 px-2 text-sm"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span
                    className="flex-1 min-w-0 text-sm truncate"
                    style={STYLES.layerName}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingId(layer.id); }}
                    title="Double-click to rename"
                  >
                    {layer.name}
                  </span>
                )}

                {/* Height badge - double-click to edit */}
                {isEditingHeight ? (
                  <input
                    type="number"
                    value={layer.height}
                    onChange={(e) => handleHeightChange(layer.id, e.target.value)}
                    onBlur={() => setEditingId(null)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    className="input w-12 py-0.5 px-1.5 text-xs text-center"
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                    min={1}
                  />
                ) : (
                  <span
                    className="flex-shrink-0 px-2 py-0.5 rounded text-xs"
                    style={STYLES.heightBadge}
                    onDoubleClick={(e) => { e.stopPropagation(); setEditingId(`${layer.id}-height`); }}
                    title="Double-click to edit height"
                  >
                    {layer.height}u
                  </span>
                )}

                {/* Delete button - visible on hover */}
                {layers.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteLayer(layer.id, e)}
                    className="flex-shrink-0 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    style={STYLES.deleteButton}
                    onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--color-error)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--text-tertiary)'; }}
                    aria-label={`Delete ${layer.name}`}
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Stats row */}
              <div
                className="flex items-center gap-3 mt-1.5"
                style={{ ...STYLES.statsRow, marginLeft: layers.length > 1 ? '22px' : '0' }}
              >
                <span>{binCount} bin{binCount !== 1 ? 's' : ''}</span>
                <div className="flex items-center gap-1.5 flex-1">
                  <div
                    className="flex-1 h-1 rounded-full overflow-hidden"
                    style={STYLES.progressBarBg}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${coverage}%`,
                        backgroundColor: coverage === 100 ? 'var(--color-success)' : 'var(--color-primary)',
                        opacity: 0.6,
                      }}
                    />
                  </div>
                  <span>{coverage}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleAddLayer}
        disabled={!canAddLayer}
        className="btn btn-secondary w-full mt-3 justify-center"
        aria-label="Add new layer"
      >
        <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Layer
      </button>

      <ConfirmDialog
        isOpen={deleteLayerId !== null}
        title="Delete Layer"
        message={`Delete "${layerToDelete?.name}"${binsInLayer > 0 ? ` and its ${binsInLayer} bin${binsInLayer > 1 ? 's' : ''}` : ''}?`}
        confirmText="Delete"
        destructive
        onConfirm={confirmDeleteLayer}
        onCancel={cancelDeleteLayer}
      />
    </div>
  );
}
