import { useState, useCallback } from 'react';
import { useShallow } from 'zustand/shallow';
import { useLayoutStore, useUIStore, useUndoableAction } from '../../store';
import { CONSTRAINTS } from '../../constants';
import { getDisplayLayers } from '../../utils/collision';
import { ConfirmDialog } from '../modals/ConfirmDialog';

/**
 * Mobile-optimized layers panel with larger touch targets.
 */
export function MobileLayersPanel() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteLayerId, setDeleteLayerId] = useState<string | null>(null);

  const { layout, addLayer, updateLayer, deleteLayer, updateDrawer } = useLayoutStore(
    useShallow((state) => ({
      layout: state.layout,
      addLayer: state.addLayer,
      updateLayer: state.updateLayer,
      deleteLayer: state.deleteLayer,
      updateDrawer: state.updateDrawer,
    }))
  );
  const layers = layout.layers;
  const bins = layout.bins;
  const drawer = layout.drawer;

  const { activeLayerId, setActiveLayer, closeMobilePanel } = useUIStore(
    useShallow((state) => ({
      activeLayerId: state.activeLayerId,
      setActiveLayer: state.setActiveLayer,
      closeMobilePanel: state.closeMobilePanel,
    }))
  );

  const { execute } = useUndoableAction();

  const totalLayerHeight = layers.reduce((sum, l) => sum + l.height, 0);
  const displayLayers = getDisplayLayers(layers);

  const handleAddLayer = () => {
    execute(() => {
      const id = addLayer();
      if (id) {
        setActiveLayer(id);
      }
    });
  };

  const handleSelectLayer = (layerId: string) => {
    setActiveLayer(layerId);
    closeMobilePanel();
  };

  const handleDeleteLayer = (id: string) => {
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

  const handleHeightChange = (id: string, delta: number) => {
    const layer = layers.find(l => l.id === id);
    if (!layer) return;
    const newHeight = Math.max(1, layer.height + delta);
    execute(() => {
      updateLayer(id, { height: newHeight });
    });
  };

  const layerToDelete = deleteLayerId ? layers.find(l => l.id === deleteLayerId) : null;
  const binsInLayer = deleteLayerId ? bins.filter(b => b.layerId === deleteLayerId).length : 0;
  const canAddLayer = totalLayerHeight < drawer.height;

  const cancelDeleteLayer = useCallback(() => {
    setDeleteLayerId(null);
  }, []);

  return (
    <div className="pb-4">
      {/* Drawer height control */}
      <div
        className="flex items-center justify-between mb-4 p-3 rounded-lg bg-surface-elevated"
      >
        <span className="text-content-secondary text-sm">
          Drawer Height
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => execute(() => updateDrawer({ height: Math.max(1, drawer.height - 1) }))}
            className="btn btn-secondary w-10 h-10 p-0"
            aria-label="Decrease drawer height"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          <span
            className="w-12 text-center font-semibold text-content text-lg"
          >
            {drawer.height}u
          </span>
          <button
            onClick={() => execute(() => updateDrawer({ height: drawer.height + 1 }))}
            className="btn btn-secondary w-10 h-10 p-0"
            aria-label="Increase drawer height"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Layer usage indicator */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <div className="flex-1 h-2 rounded-full overflow-hidden bg-surface-elevated">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${Math.min(100, (totalLayerHeight / drawer.height) * 100)}%`,
              backgroundColor: totalLayerHeight > drawer.height ? 'var(--color-error)' : 'var(--color-primary)',
            }}
          />
        </div>
        <span
          className={`text-xs ${totalLayerHeight > drawer.height ? 'text-error' : 'text-content-tertiary'}`}
        >
          {totalLayerHeight}/{drawer.height}u
        </span>
      </div>

      {/* Layer list */}
      <div className="space-y-2">
        {displayLayers.map((layer) => {
          const isActive = layer.id === activeLayerId;
          const isEditing = editingId === layer.id;
          const layerBins = bins.filter(b => b.layerId === layer.id);
          const binCount = layerBins.length;

          return (
            <div
              key={layer.id}
              className={`rounded-lg overflow-hidden ${isActive ? 'bg-surface-hover border-2 border-accent' : 'bg-surface-elevated border-2 border-transparent'}`}
            >
              <button
                className="w-full p-4 text-left"
                onClick={() => !isEditing && handleSelectLayer(layer.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={layer.name}
                        onChange={(e) => execute(() => updateLayer(layer.id, { name: e.target.value.slice(0, CONSTRAINTS.LABEL_MAX_LENGTH) }))}
                        onBlur={() => setEditingId(null)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                        className="input w-full"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span
                        className="font-medium truncate block text-content text-base"
                      >
                        {layer.name}
                      </span>
                    )}
                    <span
                      className="text-sm mt-1 block text-content-tertiary"
                    >
                      {binCount} bin{binCount !== 1 ? 's' : ''} · {layer.height}u tall
                    </span>
                  </div>
                  {isActive && (
                    <span
                      className="px-2 py-1 rounded text-xs font-medium bg-accent text-black"
                    >
                      Active
                    </span>
                  )}
                </div>
              </button>

              {/* Layer controls */}
              <div
                className="flex items-center gap-2 px-4 py-2 border-t border-stroke-subtle"
              >
                {/* Height control */}
                <div className="flex items-center">
                  <button
                    onClick={() => handleHeightChange(layer.id, -1)}
                    disabled={layer.height <= 1}
                    className="btn btn-ghost w-11 h-11 p-0"
                    aria-label="Decrease height"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span
                    className="w-10 text-center text-sm font-medium text-content-secondary"
                  >
                    {layer.height}u
                  </span>
                  <button
                    onClick={() => handleHeightChange(layer.id, 1)}
                    className="btn btn-ghost w-11 h-11 p-0"
                    aria-label="Increase height"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                <div className="flex-1" />

                {/* Edit name */}
                <button
                  onClick={() => setEditingId(layer.id)}
                  className="btn btn-ghost w-11 h-11 p-0"
                  aria-label="Edit name"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </button>

                {/* Delete */}
                {layers.length > 1 && (
                  <button
                    onClick={() => handleDeleteLayer(layer.id)}
                    className="btn btn-ghost w-11 h-11 p-0 text-error"
                    aria-label="Delete layer"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add layer button */}
      <button
        onClick={handleAddLayer}
        disabled={!canAddLayer}
        className="btn btn-primary w-full mt-4"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
