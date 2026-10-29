'use client';

import React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, Eye, EyeOff, Layers } from 'lucide-react';
import { ThemeConfig, getThemeConfig } from '../themeStyles';

export interface SectionRepeaterProps<T extends { id?: string; visible?: boolean }> {
  title: string;
  badge?: string;
  items: T[];
  isEditing: boolean;
  canEdit: boolean;
  theme?: ThemeConfig;
  addButtonLabel: string;
  emptyPromptText?: string;
  onItemsChange: (items: T[]) => void;
  createNewItem: () => T;
  renderItemView: (item: T, index: number) => React.ReactNode;
  renderItemEdit: (
    item: T,
    index: number,
    updateItem: (updates: Partial<T>) => void,
    removeItem: () => void
  ) => React.ReactNode;
  onSelectSection?: (sectionKey: string, fieldKey?: string) => void;
  sectionKey?: string;
  actionSlot?: React.ReactNode;
}

export function SectionRepeater<T extends { id?: string; visible?: boolean }>({
  title,
  badge,
  items,
  isEditing,
  canEdit,
  theme = getThemeConfig('editorial'),
  addButtonLabel,
  emptyPromptText,
  onItemsChange,
  createNewItem,
  renderItemView,
  renderItemEdit,
  onSelectSection,
  sectionKey,
  actionSlot
}: SectionRepeaterProps<T>) {
  const hasItems = Array.isArray(items) && items.length > 0;

  // Filter visible items for public/non-owner view
  const visibleItems = React.useMemo(() => {
    if (isEditing || canEdit) return items;
    return items.filter((item) => item.visible !== false);
  }, [items, isEditing, canEdit]);

  // Empty sections are hidden from non-owners
  if (!hasItems && !canEdit && !isEditing) {
    return null;
  }
  if (!isEditing && !canEdit && visibleItems.length === 0) {
    return null;
  }

  const handleAddItem = () => {
    const newItem = createNewItem();
    onItemsChange([...items, newItem]);
  };

  const handleUpdateItem = (index: number, updates: Partial<T>) => {
    const next = items.map((item, i) => (i === index ? { ...item, ...updates } : item));
    onItemsChange(next);
  };

  const handleRemoveItem = (index: number) => {
    const next = items.filter((_, i) => i !== index);
    onItemsChange(next);
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(targetIndex, 0, moved);
    onItemsChange(next);
  };

  const handleToggleVisible = (index: number) => {
    const current = items[index];
    const nextVal = current.visible === false ? true : false;
    handleUpdateItem(index, { visible: nextVal } as unknown as Partial<T>);
  };

  return (
    <section
      id={sectionKey ? `section-${sectionKey}` : undefined}
      data-section={sectionKey}
      onClick={() => canEdit && !isEditing && sectionKey && onSelectSection?.(sectionKey)}
      className={`px-4 sm:px-6 md:px-8 py-5 space-y-3.5 text-left ${theme.cardBg} border-b ${theme.divider} transition-colors ${
        canEdit && !isEditing ? 'cursor-pointer hover:bg-accent/5 transition-all' : ''
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className={`text-sm font-bold tracking-tight ${theme.textPrimary}`}>
            {title}
          </h2>
          {badge && (
            <span className={`text-[10px] font-mono font-medium px-2 py-0.5 rounded-full ${theme.badgeBg} ${theme.badgeText} border ${theme.cardBorder}`}>
              {badge}
            </span>
          )}
          {hasItems && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-neutral-200/60 dark:bg-neutral-800/60 ${theme.textSecondary}`}>
              {items.length}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actionSlot}
          {isEditing ? (
            <button
              type="button"
              onClick={handleAddItem}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors cursor-pointer`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addButtonLabel}</span>
            </button>
          ) : (
            canEdit && (
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 opacity-80 hover:opacity-100">
                Click to edit ↗
              </span>
            )
          )}
        </div>
      </div>

      {/* Items List or Empty State */}
      {hasItems ? (
        <div className="space-y-3">
          {items.map((item, index) => {
            if (!isEditing && !canEdit && item.visible === false) {
              return null;
            }

            if (isEditing) {
              return (
                <div
                  key={item.id || `item-${index}`}
                  className={`p-3.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-2.5 shadow-2xs relative`}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Top Bar for Reordering, Visibility, Deletion */}
                  <div className="flex items-center justify-between border-b pb-2 mb-2 text-xs border-neutral-200/50 dark:border-neutral-800/50">
                    <span className="text-[11px] font-mono text-neutral-400 font-semibold">
                      #{index + 1}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveItem(index, 'up')}
                        title="Move Up"
                        className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === items.length - 1}
                        onClick={() => handleMoveItem(index, 'down')}
                        title="Move Down"
                        className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleVisible(index)}
                        title={item.visible === false ? 'Hidden from public (click to show)' : 'Visible to public (click to hide)'}
                        className={`p-1 rounded-lg transition-colors cursor-pointer ${
                          item.visible === false
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {item.visible === false ? (
                          <EyeOff className="w-3.5 h-3.5" />
                        ) : (
                          <Eye className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        title="Remove item"
                        className="p-1 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-500/10 transition-colors cursor-pointer ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {renderItemEdit(
                    item,
                    index,
                    (updates) => handleUpdateItem(index, updates),
                    () => handleRemoveItem(index)
                  )}
                </div>
              );
            }

            return (
              <div
                key={item.id || `view-${index}`}
                className={`p-3.5 rounded-2xl ${theme.cardBg} border ${theme.cardBorder} space-y-2 shadow-2xs relative`}
              >
                {renderItemView(item, index)}
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty prompt for owner */
        (canEdit || isEditing) && (
          <div
            onClick={isEditing ? handleAddItem : () => sectionKey && onSelectSection?.(sectionKey)}
            className={`p-5 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary/50 text-center cursor-pointer transition-colors space-y-2 bg-neutral-50/40 dark:bg-neutral-900/30`}
          >
            <Layers className="w-5 h-5 mx-auto text-neutral-400" />
            <p className={`text-xs font-semibold ${theme.textPrimary}`}>
              {emptyPromptText || `No ${title.toLowerCase()} added yet.`}
            </p>
            <p className="text-[11px] text-neutral-400">
              {isEditing ? `Click to add ${title.toLowerCase()}` : `Click to enter edit mode and add ${title.toLowerCase()}`}
            </p>
          </div>
        )
      )}
    </section>
  );
}
