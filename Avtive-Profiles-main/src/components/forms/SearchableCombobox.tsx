'use client';

import React, { useState, useRef, useEffect, useId } from 'react';
import { Search, X, Check, Plus, ChevronDown } from 'lucide-react';

export interface ComboboxOption {
  label: string;
  value: string;
  sublabel?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export interface SearchableComboboxProps {
  options: (string | ComboboxOption | any)[];
  value?: string | string[];
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  isMulti?: boolean;
  allowCustom?: boolean;
  maxSelections?: number;
  disabled?: boolean;
  className?: string;
  dropdownClassName?: string;
  id?: string;
  hasError?: boolean;
}

export function SearchableCombobox({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  searchPlaceholder = 'Search...',
  isMulti = false,
  allowCustom = false,
  maxSelections,
  disabled = false,
  className = '',
  dropdownClassName = '',
  id,
  hasError = false
}: SearchableComboboxProps) {
  const generatedId = useId();
  const comboboxId = id || generatedId;
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  // Normalize options to ComboboxOption shape
  const normalizedOptions: ComboboxOption[] = options.map((opt: any) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt };
    }
    if (opt.label && opt.value) {
      return opt as ComboboxOption;
    }
    // Handle CountryOption ({ name, code, flag })
    if (opt.name && opt.code && opt.flag) {
      return {
        label: opt.name,
        value: opt.name,
        sublabel: opt.code,
        icon: <span className="mr-1">{opt.flag}</span>
      };
    }
    // Handle LanguageOption ({ name, nativeName, code })
    if (opt.name && (opt.nativeName || opt.code)) {
      return {
        label: opt.name,
        value: opt.name,
        sublabel: opt.nativeName && opt.nativeName !== opt.name ? opt.nativeName : opt.code
      };
    }
    // Handle SkillSuggestion ({ name, category })
    if (opt.name) {
      return {
        label: opt.name,
        value: opt.name,
        badge: opt.category
      };
    }
    return {
      label: String(opt.label || opt.name || opt.value || ''),
      value: String(opt.value || opt.name || '')
    };
  });

  // Selected values as array
  const selectedValues: string[] = isMulti
    ? Array.isArray(value) ? value : value ? [value] : []
    : typeof value === 'string' && value ? [value] : [];

  // Filter options based on search query
  const query = searchQuery.trim().toLowerCase();
  const filteredOptions = normalizedOptions.filter((opt) => {
    if (!query) return true;
    return (
      opt.label.toLowerCase().includes(query) ||
      (opt.sublabel && opt.sublabel.toLowerCase().includes(query)) ||
      (opt.badge && opt.badge.toLowerCase().includes(query))
    );
  });

  const exactMatchExists = normalizedOptions.some(
    (opt) => opt.label.toLowerCase() === query || opt.value.toLowerCase() === query
  );

  const canAddCustom =
    allowCustom &&
    Boolean(query) &&
    !exactMatchExists &&
    !selectedValues.some((v) => v.toLowerCase() === query);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Reset highlighted index on query change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [searchQuery]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const items = listRef.current.querySelectorAll('[role="option"]');
      if (items[highlightedIndex]) {
        items[highlightedIndex].scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isOpen]);

  const handleSelect = (optionValue: string) => {
    if (isMulti) {
      const normalizedNew = optionValue.trim();
      if (!normalizedNew) return;
      const exists = selectedValues.some(
        (v) => v.toLowerCase() === normalizedNew.toLowerCase()
      );
      if (exists) {
        // Toggle remove if already selected
        onChange(selectedValues.filter((v) => v.toLowerCase() !== normalizedNew.toLowerCase()));
      } else {
        if (maxSelections && selectedValues.length >= maxSelections) return;
        onChange([...selectedValues, normalizedNew]);
      }
      setSearchQuery('');
      inputRef.current?.focus();
    } else {
      onChange(optionValue);
      setIsOpen(false);
      setSearchQuery('');
    }
  };

  const handleRemoveChip = (valToRemove: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    onChange(selectedValues.filter((v) => v !== valToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const totalItems = filteredOptions.length + (canAddCustom ? 1 : 0);
        if (totalItems > 0) {
          setHighlightedIndex((prev) => (prev + 1) % totalItems);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
      } else {
        const totalItems = filteredOptions.length + (canAddCustom ? 1 : 0);
        if (totalItems > 0) {
          setHighlightedIndex((prev) => (prev - 1 + totalItems) % totalItems);
        }
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        return;
      }
      if (canAddCustom && highlightedIndex === 0) {
        handleSelect(searchQuery.trim());
      } else {
        const optIndex = canAddCustom ? highlightedIndex - 1 : highlightedIndex;
        if (filteredOptions[optIndex]) {
          handleSelect(filteredOptions[optIndex].value);
        } else if (canAddCustom) {
          handleSelect(searchQuery.trim());
        }
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchQuery('');
    } else if (e.key === 'Backspace' && !searchQuery && isMulti && selectedValues.length > 0) {
      handleRemoveChip(selectedValues[selectedValues.length - 1]);
    }
  };

  // Find active label for single select
  const activeSingleOption = !isMulti
    ? normalizedOptions.find((opt) => opt.value === value)
    : null;

  return (
    <div ref={containerRef} className={`relative w-full text-left ${className}`}>
      {/* Combobox Trigger / Box */}
      <div
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
            inputRef.current?.focus();
          }
        }}
        className={`w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border ${
          hasError
            ? 'border-rose-400 dark:border-rose-500 ring-1 ring-rose-500/20'
            : isOpen
            ? 'border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/20'
            : 'border-slate-200 dark:border-zinc-700/80 hover:border-slate-300 dark:hover:border-zinc-600'
        } bg-white dark:bg-zinc-800/90 text-slate-900 dark:text-zinc-100 flex flex-wrap items-center gap-1.5 transition-all cursor-text ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
      >
        {/* Multi-Select Tag Chips */}
        {isMulti &&
          selectedValues.map((val) => {
            const opt = normalizedOptions.find((o) => o.value === val);
            const displayLabel = opt ? opt.label : val;
            return (
              <span
                key={val}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/50 shadow-2xs animate-in fade-in zoom-in-95"
              >
                <span>{displayLabel}</span>
                <button
                  type="button"
                  onClick={(e) => handleRemoveChip(val, e)}
                  disabled={disabled}
                  className="p-0.5 hover:bg-cyan-200/50 dark:hover:bg-cyan-800/50 rounded-full transition-colors cursor-pointer text-cyan-600 dark:text-cyan-400"
                  title={`Remove ${displayLabel}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}

        {/* Input for typing / search */}
        <div className="flex-1 min-w-[120px] flex items-center">
          <input
            ref={inputRef}
            id={comboboxId}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isOpen) setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              isMulti
                ? selectedValues.length === 0
                  ? placeholder
                  : 'Add more...'
                : activeSingleOption
                ? activeSingleOption.label
                : placeholder
            }
            className="w-full bg-transparent text-xs sm:text-sm text-slate-900 dark:text-zinc-100 placeholder:text-slate-400 dark:placeholder:text-zinc-500 focus:outline-none"
          />
        </div>

        {/* Right Action: Clear or Chevron */}
        <div className="flex items-center gap-1 text-slate-400 dark:text-zinc-500 shrink-0 ml-auto pl-1">
          {!isMulti && value && !disabled ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onChange('');
                setSearchQuery('');
              }}
              className="p-0.5 hover:text-slate-600 dark:hover:text-zinc-300 cursor-pointer"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
      </div>

      {/* Dropdown Suggestions Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 top-full mt-1.5 z-50 rounded-xl border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-1 ${dropdownClassName}`}
        >
          <ul
            ref={listRef}
            role="listbox"
            className="max-h-56 overflow-y-auto py-1 text-xs sm:text-sm divide-y divide-slate-100 dark:divide-zinc-700/50"
          >
            {/* Custom Option Entry if allowed */}
            {canAddCustom && (
              <li
                role="option"
                aria-selected={highlightedIndex === 0}
                onClick={() => handleSelect(searchQuery.trim())}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                  highlightedIndex === 0
                    ? 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-700 dark:text-cyan-300'
                    : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/40'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <Plus className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>
                    Add custom: <strong className="font-semibold text-cyan-600 dark:text-cyan-400">&ldquo;{searchQuery.trim()}&rdquo;</strong>
                  </span>
                </div>
                <span className="text-[10px] font-mono uppercase text-cyan-600/70 dark:text-cyan-400/70">
                  Enter ↵
                </span>
              </li>
            )}

            {/* Filtered Dataset Suggestions */}
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, idx) => {
                const itemIndex = canAddCustom ? idx + 1 : idx;
                const isSelected = selectedValues.some(
                  (v) => v.toLowerCase() === opt.value.toLowerCase()
                );
                const isHighlighted = highlightedIndex === itemIndex;

                return (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(itemIndex)}
                    className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isHighlighted
                        ? 'bg-slate-100 dark:bg-zinc-700/70 text-slate-900 dark:text-zinc-100'
                        : isSelected
                        ? 'bg-cyan-50/50 dark:bg-cyan-950/20 text-slate-900 dark:text-zinc-100'
                        : 'text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-700/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="truncate">
                        <span className={`font-medium ${isSelected ? 'text-cyan-600 dark:text-cyan-400 font-semibold' : ''}`}>
                          {opt.label}
                        </span>
                        {opt.sublabel && (
                          <span className="text-[11px] text-slate-400 dark:text-zinc-500 ml-1.5 font-normal">
                            ({opt.sublabel})
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400">
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />}
                    </div>
                  </li>
                );
              })
            ) : !canAddCustom ? (
              <li className="px-3 py-4 text-center text-xs text-slate-400 dark:text-zinc-500">
                No matching results for &ldquo;{searchQuery}&rdquo;
              </li>
            ) : null}
          </ul>
        </div>
      )}
    </div>
  );
}
