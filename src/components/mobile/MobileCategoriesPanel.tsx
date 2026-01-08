import { useState } from 'react';
import { useShallow } from 'zustand/shallow';
import { useLayoutStore, useUIStore, useUndoableAction } from '../../store';
import { CONSTRAINTS } from '../../constants';
import { ConfirmDialog } from '../modals/ConfirmDialog';

const COLOR_PALETTE = [
  { color: '#f87171', name: 'Coral' },
  { color: '#fb923c', name: 'Orange' },
  { color: '#fbbf24', name: 'Amber' },
  { color: '#a3e635', name: 'Lime' },
  { color: '#4ade80', name: 'Green' },
  { color: '#2dd4bf', name: 'Teal' },
  { color: '#38bdf8', name: 'Sky' },
  { color: '#818cf8', name: 'Indigo' },
  { color: '#c084fc', name: 'Purple' },
  { color: '#f472b6', name: 'Pink' },
  { color: '#e2e8f0', name: 'Cloud' },
  { color: '#334155', name: 'Charcoal' },
];

/**
 * Mobile-optimized categories panel with large touch targets.
 */
export function MobileCategoriesPanel() {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  const { categories, bins, addCategory, updateCategory, deleteCategory } = useLayoutStore(
    useShallow((state) => ({
      categories: state.layout.categories,
      bins: state.layout.bins,
      addCategory: state.addCategory,
      updateCategory: state.updateCategory,
      deleteCategory: state.deleteCategory,
    }))
  );

  const { activeCategoryId, setActiveCategory, closeMobilePanel } = useUIStore(
    useShallow((state) => ({
      activeCategoryId: state.activeCategoryId,
      setActiveCategory: state.setActiveCategory,
      closeMobilePanel: state.closeMobilePanel,
    }))
  );

  const { execute } = useUndoableAction();

  const handleSelectCategory = (id: string) => {
    setActiveCategory(id);
    closeMobilePanel();
  };

  const handleAddCategory = () => {
    execute(() => {
      const id = addCategory({ name: 'New Category', color: '#6b7280' });
      setActiveCategory(id);
      setEditingId(id);
    });
  };

  const handleUpdateColor = (id: string, color: string) => {
    execute(() => {
      updateCategory(id, { color });
    });
  };

  const handleUpdateName = (id: string, name: string) => {
    execute(() => {
      updateCategory(id, { name: name.slice(0, CONSTRAINTS.LABEL_MAX_LENGTH) });
    });
  };

  const handleDelete = (id: string, name: string) => {
    const inUse = bins.some(b => b.category === id);
    if (inUse || categories.length <= CONSTRAINTS.CATEGORIES_MIN) return;
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = () => {
    if (!deleteConfirm) return;
    const { id } = deleteConfirm;
    execute(() => {
      deleteCategory(id);
      if (activeCategoryId === id && categories.length > 1) {
        const remaining = categories.filter(c => c.id !== id);
        setActiveCategory(remaining[0].id);
      }
    });
    setEditingId(null);
    setDeleteConfirm(null);
  };

  const canAddCategory = categories.length < CONSTRAINTS.CATEGORIES_MAX;

  return (
    <div className="pb-4">
      <p
        className="text-sm mb-4"
        style={{ color: 'var(--text-tertiary)' }}
      >
        Select a category to use when drawing bins.
      </p>

      <div className="space-y-2">
        {categories.map((category) => {
          const isActive = category.id === activeCategoryId;
          const isEditing = editingId === category.id;
          const inUse = bins.some(b => b.category === category.id);
          const canDelete = !inUse && categories.length > CONSTRAINTS.CATEGORIES_MIN;

          return (
            <div
              key={category.id}
              className="rounded-lg overflow-hidden"
              style={{
                backgroundColor: isActive ? 'var(--bg-active)' : 'var(--bg-elevated)',
                border: isActive ? '2px solid var(--color-primary)' : '2px solid transparent',
              }}
            >
              {isEditing ? (
                <div className="p-4 space-y-3">
                  {/* Name input */}
                  <input
                    type="text"
                    value={category.name}
                    onChange={(e) => handleUpdateName(category.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && setEditingId(null)}
                    className="input w-full"
                    placeholder="Category name"
                    autoFocus
                  />

                  {/* Color grid */}
                  <div className="grid grid-cols-6 gap-2">
                    {COLOR_PALETTE.map(({ color, name }) => (
                      <button
                        key={color}
                        onClick={() => handleUpdateColor(category.id, color)}
                        className="w-10 h-10 rounded-lg transition-transform active:scale-95"
                        style={{
                          backgroundColor: color,
                          boxShadow: category.color === color
                            ? '0 0 0 3px var(--color-primary)'
                            : 'var(--shadow-sm)',
                        }}
                        aria-label={name}
                      />
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {canDelete && (
                      <button
                        onClick={() => handleDelete(category.id, category.name)}
                        className="btn btn-danger flex-1"
                      >
                        Delete
                      </button>
                    )}
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn btn-secondary flex-1"
                    >
                      Done
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full p-4 flex items-center gap-3"
                  onClick={() => handleSelectCategory(category.id)}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0"
                    style={{ backgroundColor: category.color, boxShadow: 'var(--shadow-sm)' }}
                  />
                  <span
                    className="flex-1 text-left font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {category.name}
                  </span>
                  {isActive && (
                    <span
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-primary)', color: '#000' }}
                    >
                      Active
                    </span>
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); setEditingId(category.id); }}
                    className="btn btn-ghost w-10 h-10 p-0"
                    aria-label="Edit category"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add category button */}
      <button
        onClick={handleAddCategory}
        disabled={!canAddCategory}
        className="btn btn-primary w-full mt-4"
      >
        <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Add Category
      </button>

      <ConfirmDialog
        isOpen={deleteConfirm !== null}
        title="Delete Category"
        message={`Delete "${deleteConfirm?.name}"? This cannot be undone.`}
        confirmText="Delete"
        destructive
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm(null)}
      />
    </div>
  );
}
