import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';

// Shared dropdown shell behind every custom picker in the admin panels:
// styled trigger (border-slate-200 bg-white rounded-xl text-xs), an
// elevated panel with row hover/selected states, and full keyboard nav.
// `searchable` toggles the search input + "Clear Selection" row for
// short fixed option sets (e.g. the evaluation track picker) where
// search would just be friction.
export default function SearchableSelect({
  items = [],
  value,
  onChange,
  getKey,
  getLabel,
  placeholder = 'Select…',
  searchable = true,
  searchPlaceholder = 'Search…',
  filterItem,
  noResultsLabel = 'No results found',
  showClear = true,
  clearLabel = 'Clear Selection',
  renderRow,
  triggerLabelClassName,
  placeholderClassName = 'text-slate-400 font-semibold',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(-1); // -1 = "Clear Selection" row

  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);

  const selectedItem = items.find(item => getKey(item) === value) || null;
  const minIndex = showClear ? -1 : 0;

  const filteredItems = useMemo(() => {
    if (!searchable) return items;
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter(item => filterItem(item, normalizedQuery));
  }, [items, query, searchable, filterItem]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && searchable) searchInputRef.current?.focus();
  }, [isOpen, searchable]);

  const openPanel = () => {
    setQuery('');
    const selectedIndex = items.findIndex(item => getKey(item) === value);
    setHighlightedIndex(showClear ? selectedIndex : Math.max(selectedIndex, 0));
    setIsOpen(true);
  };

  const closePanel = ({ refocusTrigger = false } = {}) => {
    setIsOpen(false);
    if (refocusTrigger) triggerRef.current?.focus();
  };

  const handleSelect = (item) => {
    onChange(getKey(item));
    closePanel({ refocusTrigger: true });
  };

  const handleClear = () => {
    onChange('');
    closePanel({ refocusTrigger: true });
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        openPanel();
      }
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.min(prev + 1, filteredItems.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex(prev => Math.max(prev - 1, minIndex));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex === -1 && showClear) handleClear();
      else if (filteredItems[highlightedIndex]) handleSelect(filteredItems[highlightedIndex]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closePanel({ refocusTrigger: true });
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => (isOpen ? closePanel() : openPanel())}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className="w-full border border-slate-200 bg-white p-3 rounded-xl text-xs outline-none flex items-center justify-between gap-2 text-left hover:border-slate-300 transition"
      >
        <span className={selectedItem ? (triggerLabelClassName || 'font-bold text-slate-800 truncate') : placeholderClassName}>
          {selectedItem ? getLabel(selectedItem) : placeholder}
        </span>
        <ChevronDown size={14} className={`text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-20 mt-1.5 w-full bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden">
          {searchable && (
            <div className="p-2 border-b border-slate-100">
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={query}
                  onChange={e => { setQuery(e.target.value); setHighlightedIndex(showClear ? -1 : 0); }}
                  onKeyDown={handleKeyDown}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-slate-950"
                />
              </div>
            </div>
          )}

          {showClear && (
            <button
              type="button"
              onClick={handleClear}
              onMouseEnter={() => setHighlightedIndex(-1)}
              className={`w-full text-left px-3 py-2 text-xs font-black uppercase tracking-wide border-b border-slate-100 text-slate-400 ${highlightedIndex === -1 ? 'bg-slate-100' : 'hover:bg-slate-50'}`}
            >
              {clearLabel}
            </button>
          )}

          <ul role="listbox" className="max-h-64 overflow-y-auto">
            {searchable && filteredItems.length === 0 && (
              <li className="px-3 py-6 text-center text-xs font-semibold text-slate-400">{noResultsLabel}</li>
            )}
            {filteredItems.map((item, idx) => {
              const key = getKey(item);
              const isSelected = key === value;
              const isHighlighted = highlightedIndex === idx;
              return (
                <li
                  key={key}
                  role="option"
                  aria-selected={isSelected}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  onClick={() => handleSelect(item)}
                  className={`px-3 py-2 flex items-center justify-between gap-3 cursor-pointer text-xs ${isHighlighted ? 'bg-slate-100' : isSelected ? 'bg-blue-50/60' : ''}`}
                >
                  {renderRow ? renderRow(item, { isSelected, isHighlighted }) : (
                    <span className="font-bold text-slate-800 truncate">{getLabel(item)}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
