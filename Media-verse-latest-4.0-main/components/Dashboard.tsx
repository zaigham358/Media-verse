
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UseMediaStateReturn, MediaFile, View, MediaType, SortOption, ViewMode, AppSettings, Tab, Category, Collection, CollectionRule } from '../types';
import MediaGrid from './MediaGrid';
import Popover from './ui/Popover';
import SelectionActionBar from './SelectionActionBar';
import DetailsPanel from './DetailsPanel';
// FIX: Import ChevronsRightIcon
import { SearchIcon, FilterIcon, SortAscendingIcon, GridIcon, ListIcon, UploadIcon, SlidersIcon, FolderIcon, MoreVerticalIcon, PinIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronsRightIcon, SparklesIcon, XIcon, EyeIcon, MousePointerClickIcon, UndoIcon, RedoIcon } from './icons';
import { interpretNaturalLanguageSearch } from '../services/geminiService';
import Switch from './ui/Switch';

const CATEGORY_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

// In-component Category Card for the new folder view
const CategoryCard: React.FC<{ category: Category, count: number, onClick: () => void, onContextMenu: (e: React.MouseEvent) => void, onDragStart: React.DragEventHandler, onDragOver: React.DragEventHandler, onDragLeave: React.DragEventHandler, onDrop: React.DragEventHandler, isRenaming: boolean, onEndRename: (newName: string | null) => void }> = ({ category, count, onClick, onContextMenu, isRenaming, onEndRename, ...dragProps }) => {
    const [renameValue, setRenameValue] = useState(category.name);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isRenaming) {
            setRenameValue(category.name);
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming, category.name]);

    const handleRenameSubmit = () => {
        if(renameValue.trim()) {
            onEndRename(renameValue.trim());
        } else {
            onEndRename(null);
        }
    };
    
    return (
        <div 
            className="group relative flex flex-col items-center justify-center text-center p-6 bg-card-bg rounded-xl border border-border-color/50 cursor-pointer transition-all duration-200 hover:bg-card-bg hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
            onClick={onClick}
            onContextMenu={onContextMenu}
            draggable={category.id !== 'uncategorized' && !isRenaming}
            {...dragProps}
        >
            <div className="relative mb-3">
                <FolderIcon className="w-20 h-20 text-text-secondary/30 transition-colors group-hover:text-primary/80" style={{ color: category.color || undefined }} />
                {count > 0 && (
                    <div className="absolute -top-1 -right-1 bg-primary text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {count}
                    </div>
                )}
            </div>
            
            {isRenaming ? (
                 <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSubmit();
                        if (e.key === 'Escape') onEndRename(null);
                    }}
                    onClick={e => e.stopPropagation()}
                    className="font-display font-bold text-lg text-center text-text-primary bg-input-bg border border-primary rounded outline-none w-full px-2 py-1"
                />
            ) : (
                <h3 className="font-display font-bold text-lg text-text-primary truncate w-full px-2">{category.name}</h3>
            )}
            <p className="text-xs text-text-secondary mt-1">{count} {count === 1 ? 'file' : 'files'}</p>
            
            <button 
                className="absolute top-3 right-3 p-1.5 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-black/20 hover:text-text-primary transition-all" 
                onClick={e => { e.stopPropagation(); onContextMenu(e); }}
            >
                <MoreVerticalIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// In-component Category Context Menu
const CategoryContextMenu: React.FC<{ x: number, y: number, category: Category, onClose: () => void, mediaState: UseMediaStateReturn, onRename: () => void }> = ({ x, y, category, onClose, mediaState, onRename }) => {
    const { updateCategory, deleteCategory } = mediaState;
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
            <div className="absolute bg-card-bg rounded-lg shadow-2xl border border-border-color p-2 w-56 text-sm" style={{ top: y, left: x }} onMouseLeave={() => setShowColorPicker(false)}>
                {category.id !== 'uncategorized' && (
                    <>
                        <button onClick={() => handleAction(() => updateCategory(category.id, { isPinned: !category.isPinned }))} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                            <PinIcon className="w-4 h-4" />
                            <span>{category.isPinned ? 'Unpin from Sidebar' : 'Pin to Sidebar'}</span>
                        </button>
                        <button onClick={() => handleAction(onRename)} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                            <EditIcon className="w-4 h-4" />
                            <span>Rename</span>
                        </button>
                         <div className="relative" onMouseEnter={() => setShowColorPicker(true)}>
                            <div className="w-full flex items-center justify-between space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary cursor-default">
                                <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full border border-border-color" style={{backgroundColor: category.color || 'transparent'}}/><span>Color</span></div>
                                <ChevronsRightIcon className="w-4 h-4" />
                            </div>
                            {showColorPicker && (
                                <div className="absolute left-full -top-2 ml-1 bg-card-bg rounded-lg shadow-2xl border border-border-color p-2 z-10">
                                    <div className="flex gap-2">
                                        {CATEGORY_COLORS.map(color => <button key={color} onClick={() => handleAction(() => updateCategory(category.id, {color}))} className="w-5 h-5 rounded-full ring-2 ring-offset-2 ring-offset-card-bg" style={{backgroundColor: color}}/>)}
                                        <button onClick={() => handleAction(() => updateCategory(category.id, {color: undefined}))} className="w-5 h-5 rounded-full bg-transparent border-2 border-border-color"/>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="h-px bg-border-color my-1" />
                        <button onClick={() => handleAction(() => { if(confirm(`Delete "${category.name}"? Files will be moved to Uncategorized.`)) deleteCategory(category.id)})} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary text-red-400">
                            <TrashIcon className="w-4 h-4" />
                            <span>Delete Category</span>
                        </button>
                    </>
                )}
                 {category.id === 'uncategorized' && (
                     <p className="px-2 py-1.5 text-text-secondary">This is the default category and cannot be modified.</p>
                 )}
            </div>
        </div>
    )
};

const SettingRow: React.FC<{ label: string, children: React.ReactNode }> = ({ label, children }) => (
    <div className="flex items-center justify-between text-sm">
        <label className="text-text-primary">{label}</label>
        {children}
    </div>
)


interface DashboardProps {
  mediaState: UseMediaStateReturn;
  activeTab: Tab;
  updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
  onContextMenu: (event: React.MouseEvent, file: MediaFile) => void;
  onAddToGridPlayer: (files: MediaFile[]) => void;
  closingFileId: string | null;
}

const SORT_OPTIONS: { label: string; value: SortOption }[] = [
    { label: 'Date Added (Newest)', value: 'createdAt-desc' },
    { label: 'Date Added (Oldest)', value: 'createdAt-asc' },
    { label: 'Title (A-Z)', value: 'title-asc' },
    { label: 'Title (Z-A)', value: 'title-desc' },
    { label: 'Size (Largest)', value: 'size-desc' },
    { label: 'Size (Smallest)', value: 'size-asc' },
    { label: 'Rating (Highest)', value: 'rating-desc' },
    { label: 'Rating (Lowest)', value: 'rating-asc' },
    { label: 'Duration (Longest)', value: 'duration-desc' },
    { label: 'Duration (Shortest)', value: 'duration-asc' },
];

const FILTER_TYPES: { label: string; value: Tab['filterType'] }[] = [
    { label: 'All Types', value: 'all' },
    { label: 'Videos', value: 'video' },
    { label: 'Shorts (9:16)', value: 'shorts' },
    { label: 'Images', value: 'image' },
    { label: 'Audio', value: 'audio' },
];

const RULE_FIELDS: { id: CollectionRule['field']; label: string; type: 'string' | 'number' | 'date' | 'boolean' }[] = [
    { id: 'title', label: 'Title', type: 'string' },
    { id: 'rating', label: 'Rating', type: 'number' },
    { id: 'createdAt', label: 'Date Added', type: 'date' },
    { id: 'isFavorite', label: 'Is Favorite', type: 'boolean' },
    { id: 'metadata.duration', label: 'Duration (sec)', type: 'number' },
    { id: 'metadata.size', label: 'File Size (bytes)', type: 'number' },
];


const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

const applyRule = (file: MediaFile, rule: CollectionRule): boolean => {
    const { field, operator, value } = rule;
    const fieldDef = RULE_FIELDS.find(f => f.id === field);
    
    let fileValue: any = field.startsWith('metadata.')
        ? file.metadata[field.substring(9) as keyof MediaFile['metadata']]
        : file[field as keyof MediaFile];

    if (fileValue === undefined) return false;

    let ruleValue: any = value;

    if (fieldDef?.type === 'date') {
        fileValue = new Date(fileValue).setHours(0, 0, 0, 0);
        ruleValue = new Date(value as string).getTime();
    } else if (fieldDef?.type === 'number') {
        ruleValue = Number(value);
    }

    switch(operator) {
        case 'gte': return fileValue >= ruleValue;
        case 'gt': return fileValue > ruleValue;
        case 'lte': return fileValue <= ruleValue;
        case 'lt': return fileValue < ruleValue;
        case 'eq': return fileValue === ruleValue;
        case 'neq': return fileValue !== ruleValue;
        case 'contains':
            return typeof fileValue === 'string' && typeof ruleValue === 'string' && fileValue.toLowerCase().includes(String(ruleValue).toLowerCase());
        default: return false;
    }
};


const Dashboard: React.FC<DashboardProps> = ({ mediaState, activeTab, updateActiveTab, onContextMenu, onAddToGridPlayer, closingFileId }) => {
  const { mediaFiles, categories, collections, UNCATEGORIZED_ID, settings, updateMediaFile, deleteMediaFiles, updateSettings, updateMediaFiles: batchUpdateMediaFiles, mergeCategories, updateCategory, canUndo, canRedo, undo, redo } = mediaState;
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{x: number, y: number} | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  
  // Initialize local search with the active tab's query
  const [localSearch, setLocalSearch] = useState(activeTab.searchQuery);
  
  const [categoryContextMenu, setCategoryContextMenu] = useState<{ x: number, y: number, category: Category } | null>(null);
  const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);
  const [isMagicSearch, setIsMagicSearch] = useState(false);
  const [isAiSearching, setIsAiSearching] = useState(false);
  
  const debouncedSearch = useDebounce(localSearch, isMagicSearch ? 800 : 300);

  // Sync local search ONLY when switching tabs (tab ID changes)
  // This prevents the cursor jumping issue by not syncing on every prop update while typing
  useEffect(() => {
    setLocalSearch(activeTab.searchQuery);
  }, [activeTab.id]);

  // Effect to trigger the actual search/filter update in the global state
  useEffect(() => {
    // Only update if the debounced value differs from what's in the store
    if (debouncedSearch !== activeTab.searchQuery) {
         const performSearch = async () => {
            if (isMagicSearch) {
                if (!debouncedSearch.trim()) {
                    updateActiveTab({ aiSearchFilters: null });
                    return;
                }
                setIsAiSearching(true);
                try {
                    const filters = await interpretNaturalLanguageSearch(debouncedSearch);
                    // Note: For AI search, we might keep the query text visible but apply filters
                    updateActiveTab({ aiSearchFilters: filters, searchQuery: debouncedSearch });
                } catch (error) {
                    console.error(error);
                    updateActiveTab({ aiSearchFilters: null, searchQuery: debouncedSearch });
                } finally {
                    setIsAiSearching(false);
                }
            } else {
                updateActiveTab({ searchQuery: debouncedSearch, aiSearchFilters: null });
            }
        };
        performSearch();
    }
}, [debouncedSearch, isMagicSearch, updateActiveTab, activeTab.searchQuery]);


  const {
      activeCategoryId,
      activeCollectionId,
      searchQuery,
      aiSearchFilters,
      filterType,
      sortOption,
      viewMode,
      selectedFileIds,
      focusedFileId,
      dashboardView,
      renamingFileId,
  } = activeTab;
  
  const handleFocusFile = (fileId: string | null) => updateActiveTab({ focusedFileId: fileId });

  const filteredAndSortedFiles = useMemo(() => {
    let files: MediaFile[] = [];

    const activeCollection = collections.find(c => c.id === activeCollectionId);

    if (activeCollection) {
        if (activeCollection.type === 'smart' && activeCollection.rules) {
            files = mediaFiles.filter(file => activeCollection.rules!.every(rule => applyRule(file, rule)));
        } else if (activeCollection.type === 'manual' && activeCollection.mediaIds) {
            const mediaIdSet = new Set(activeCollection.mediaIds);
            files = mediaFiles.filter(file => mediaIdSet.has(file.id));
        }
    } else {
        files = mediaFiles.filter(file => {
            if (activeCategoryId !== 'all' && (file.category || UNCATEGORIZED_ID) !== activeCategoryId) return false;
            return true;
        });
    }
    
    // Apply global filters
    files = files.filter(file => {
      if (filterType === 'shorts') {
          if (file.type !== 'video') return false;
          if (!file.metadata.resolution) return false;
          const [w, h] = file.metadata.resolution.split('x').map(Number);
          // Check for vertical video (height > width). 9:16 is typical for shorts.
          if (isNaN(w) || isNaN(h) || w >= h) return false;
      } else if (filterType !== 'all' && file.type !== filterType) {
          return false;
      }

      if (!isMagicSearch && searchQuery && !file.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Apply AI Search Filters
      if (isMagicSearch && aiSearchFilters) {
          for (const [key, value] of Object.entries(aiSearchFilters)) {
              if (value === undefined || value === null) continue;
              if (key === 'title_contains' && !file.title.toLowerCase().includes(String(value).toLowerCase())) return false;
              if (key === 'type_is' && file.type !== value) return false;
              if (key === 'rating_greater_than' && file.rating <= Number(value)) return false;
              if (key === 'rating_less_than' && file.rating >= Number(value)) return false;
              if (key === 'is_favorite' && file.isFavorite !== value) return false;
              if (key === 'has_description' && !!file.metadata.description !== value) return false;
              if (key === 'created_after' && file.createdAt < new Date(value as string).getTime()) return false;
              if (key === 'created_before' && file.createdAt > new Date(value as string).getTime()) return false;
              if (key === 'tags_include' && !((value as string[]).every(tag => file.metadata.tags?.includes(tag)))) return false;
          }
      }
      return true;
    });

    const [key, direction] = sortOption.split('-') as [keyof MediaFile | 'size' | 'rating' | 'duration', 'asc' | 'desc'];
    files.sort((a, b) => {
      let valA, valB;
      if (key === 'size') { valA = a.metadata.size; valB = b.metadata.size; } 
      else if (key === 'rating') { valA = a.rating; valB = b.rating; }
      else if (key === 'duration') { valA = a.metadata.duration ?? 0; valB = b.metadata.duration ?? 0; }
      else { valA = a[key]; valB = b[key]; }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return files;
  }, [mediaFiles, activeCategoryId, activeCollectionId, collections, filterType, searchQuery, sortOption, UNCATEGORIZED_ID, aiSearchFilters, isMagicSearch]);
  
  useEffect(() => {
      if (filteredAndSortedFiles.length > 0 && !focusedFileId) {
          handleFocusFile(filteredAndSortedFiles[0].id);
      }
      if (focusedFileId && !filteredAndSortedFiles.some(f => f.id === focusedFileId)) {
          handleFocusFile(filteredAndSortedFiles.length > 0 ? filteredAndSortedFiles[0].id : null);
      }
  }, [filteredAndSortedFiles, focusedFileId]);

  const handleSelectFile = useCallback((fileId: string, ctrlKey = false, shiftKey = false) => {
    let newSelectedIds = [...selectedFileIds];
    const isSelected = newSelectedIds.includes(fileId);

    if (shiftKey && focusedFileId) {
        const lastSelectedIndex = filteredAndSortedFiles.findIndex(f => f.id === focusedFileId);
        const currentFileIndex = filteredAndSortedFiles.findIndex(f => f.id === fileId);
        if (lastSelectedIndex !== -1) {
            const start = Math.min(lastSelectedIndex, currentFileIndex);
            const end = Math.max(lastSelectedIndex, currentFileIndex);
            const rangeIds = filteredAndSortedFiles.slice(start, end + 1).map(f => f.id);
            newSelectedIds = [...new Set([...(ctrlKey ? newSelectedIds : []), ...rangeIds])];
        }
    } else if (ctrlKey) {
        newSelectedIds = isSelected ? newSelectedIds.filter(id => id !== fileId) : [...newSelectedIds, fileId];
    } else {
        newSelectedIds = isSelected && newSelectedIds.length === 1 ? [] : [fileId];
    }
    
    updateActiveTab({ selectedFileIds: newSelectedIds });
    handleFocusFile(fileId);
  }, [selectedFileIds, focusedFileId, filteredAndSortedFiles, updateActiveTab]);
  
    // Dashboard specific shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!settings?.keyboardShortcuts) return;

        const isCtrlCmd = e.ctrlKey || e.metaKey;

        if (settings.keyboardShortcuts.selectAll.enabled && isCtrlCmd && e.key.toUpperCase() === 'A') {
            e.preventDefault();
            updateActiveTab({ selectedFileIds: filteredAndSortedFiles.map(f => f.id) });
        } else if (settings.keyboardShortcuts.clearSelection.enabled && e.key === 'Escape') {
            e.preventDefault();
            updateActiveTab({ selectedFileIds: [] });
        } else if (settings.keyboardShortcuts.deleteSelection.enabled && e.key === 'Delete' && selectedFileIds.length > 0) {
            e.preventDefault();
            if (confirm(`Are you sure you want to delete ${selectedFileIds.length} item(s)?`)) {
                deleteMediaFiles(selectedFileIds);
                updateActiveTab({ selectedFileIds: [] });
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
}, [settings, filteredAndSortedFiles, selectedFileIds, deleteMediaFiles, updateActiveTab]);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
  };
  
  // Marquee Selection Logic
  const handleMouseDown = (e: React.MouseEvent) => {
      if (e.target !== e.currentTarget) return; // Only start on the grid background
      dragStartPos.current = { x: e.clientX, y: e.clientY };
      if (marqueeRef.current) {
          marqueeRef.current.style.display = 'block';
      }
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp, { once: true });
  }
  
  const handleMouseMove = (e: MouseEvent) => {
      if (!dragStartPos.current || !marqueeRef.current || !gridContainerRef.current) return;
      const { x: startX, y: startY } = dragStartPos.current;
      const { clientX: endX, clientY: endY } = e;

      const rectX = Math.min(startX, endX);
      const rectY = Math.min(startY, endY);
      const rectWidth = Math.abs(startX - endX);
      const rectHeight = Math.abs(startY - endY);

      // Calculate position relative to container
      const containerRect = gridContainerRef.current.getBoundingClientRect();
      const relativeLeft = rectX - containerRect.left + gridContainerRef.current.scrollLeft;
      const relativeTop = rectY - containerRect.top + gridContainerRef.current.scrollTop;

      marqueeRef.current.style.left = `${relativeLeft}px`;
      marqueeRef.current.style.top = `${relativeTop}px`;
      marqueeRef.current.style.width = `${rectWidth}px`;
      marqueeRef.current.style.height = `${rectHeight}px`;

      // Intersection logic works with viewport coordinates, which we already have in rectX/rectY
      const gridRect = gridContainerRef.current.getBoundingClientRect();
      const newSelectedIds: string[] = [];
      const cardElements = gridContainerRef.current.querySelectorAll('.media-card');
      
      cardElements.forEach(card => {
          const cardRect = card.getBoundingClientRect();
          const cardId = (card as HTMLElement).dataset.fileId;
          if (!cardId) return;

          // Check for intersection using viewport coordinates
          if (rectX < cardRect.right && rectX + rectWidth > cardRect.left &&
              rectY < cardRect.bottom && rectY + rectHeight > cardRect.top) {
              newSelectedIds.push(cardId);
          }
      });
      updateActiveTab({ selectedFileIds: newSelectedIds });
  }

  const handleMouseUp = () => {
      dragStartPos.current = null;
      if (marqueeRef.current) {
          marqueeRef.current.style.display = 'none';
          marqueeRef.current.style.width = '0';
          marqueeRef.current.style.height = '0';
      }
      window.removeEventListener('mousemove', handleMouseMove);
  };

  // Category Merging Logic
  const handleCategoryDragStart = (e: React.DragEvent, categoryId: string) => {
      e.dataTransfer.setData('application/x-mediaverse-category-id', categoryId);
      e.dataTransfer.effectAllowed = 'move';
  };
  const handleCategoryDrop = (e: React.DragEvent, targetCategory: Category) => {
      e.preventDefault();
      const sourceId = e.dataTransfer.getData('application/x-mediaverse-category-id');
      const targetId = targetCategory.id;
      if (sourceId && sourceId !== targetId) {
          const sourceCategory = categories.find(c => c.id === sourceId);
          if (confirm(`Merge "${sourceCategory?.name}" into "${targetCategory.name}"? This cannot be undone.`)) {
              mergeCategories(sourceId, targetId);
          }
      }
  };

  
  const currentSortLabel = SORT_OPTIONS.find(o => o.value === sortOption)?.label || 'Sort';
  const currentFilterLabel = FILTER_TYPES.find(o => o.value === filterType)?.label || 'Filter';
  
  const category = categories.find(c => c.id === activeCategoryId);
  const collection = collections.find(c => c.id === activeCollectionId);
  
  const title = dashboardView === 'categories' 
    ? 'Categories' 
    : collection
        ? collection.name
        : activeCategoryId === 'all' 
            ? 'All Media' 
            : category?.name || 'Uncategorized';
  
  const handleDeleteSelection = () => {
    if (confirm(`Are you sure you want to delete ${selectedFileIds.length} items?`)) {
        deleteMediaFiles(selectedFileIds);
        updateActiveTab({ selectedFileIds: [] });
    }
  }

  const selectedFiles = useMemo(() => mediaFiles.filter(f => selectedFileIds.includes(f.id)), [mediaFiles, selectedFileIds]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    mediaFiles.forEach(file => {
        const catId = file.category || UNCATEGORIZED_ID;
        counts.set(catId, (counts.get(catId) || 0) + 1);
    });
    return counts;
  }, [mediaFiles, UNCATEGORIZED_ID]);
  
  const renderContent = () => {
    if (dashboardView === 'categories') {
      const allCats = [{ id: UNCATEGORIZED_ID, name: 'Uncategorized', order: -1, color: '#888' }, ...categories].sort((a,b) => (a.order ?? 0) - (b.order ?? 0));
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 p-8">
            {allCats.map(cat => (
                <CategoryCard 
                    key={cat.id} 
                    category={cat}
                    count={categoryCounts.get(cat.id) || 0}
                    onClick={() => updateActiveTab({ dashboardView: 'files', activeCategoryId: cat.id })}
                    onContextMenu={e => setCategoryContextMenu({ x: e.clientX, y: e.clientY, category: cat })}
                    onDragStart={e => handleCategoryDragStart(e, cat.id)}
                    onDragOver={e => e.preventDefault()}
                    onDragLeave={() => {}}
                    onDrop={e => handleCategoryDrop(e, cat)}
                    isRenaming={renamingCategoryId === cat.id}
                    onEndRename={(newName) => {
                        if (newName && newName !== cat.name) {
                            updateCategory(cat.id, { name: newName });
                        }
                        setRenamingCategoryId(null);
                    }}
                />
            ))}
        </div>
      );
    }
    
    return (
        <div className="flex h-full">
            <div className="flex-1 overflow-y-auto relative" onMouseDown={handleMouseDown} ref={gridContainerRef}>
                 <div ref={marqueeRef} className="marquee-selection-box" style={{ display: 'none' }}></div>
                <MediaGrid 
                    files={filteredAndSortedFiles} 
                    onFileClick={(file) => updateActiveTab({ viewingState: { file } })} 
                    settings={settings} 
                    onUpdateFile={updateMediaFile}
                    selectedFileIds={selectedFileIds}
                    onSelectFile={handleSelectFile}
                    focusedFileId={focusedFileId}
                    setFocusedFileId={handleFocusFile}
                    viewMode={viewMode}
                    onContextMenu={onContextMenu}
                    renamingFileId={renamingFileId}
                    onStartRename={(fileId) => updateActiveTab({ renamingFileId: fileId })}
                    onEndRename={() => updateActiveTab({ renamingFileId: null })}
                    closingFileId={closingFileId}
                    onNavigateToUploads={() => updateActiveTab({ view: 'uploads' })}
                />
                <SelectionActionBar 
                    selectedFiles={selectedFiles}
                    onClear={() => updateActiveTab({ selectedFileIds: [] })}
                    onDelete={handleDeleteSelection}
                    onUpdateFiles={batchUpdateMediaFiles}
                    onAddToGridPlayer={onAddToGridPlayer}
                    categories={categories}
                />
            </div>
            {selectedFileIds.length > 0 && settings.showDetailsPanel && (
                <DetailsPanel 
                    selectedFiles={selectedFiles}
                    onClose={() => updateActiveTab({ selectedFileIds: [] })}
                    mediaState={mediaState}
                />
            )}
        </div>
    )
  }
  
  const getFilterDisplayName = (key: string, value: any): string => {
        if (key === 'created_after') return `After: ${value}`;
        if (key === 'created_before') return `Before: ${value}`;
        if (key === 'rating_greater_than') return `Rating > ${value}`;
        if (key === 'is_favorite') return `Favorite`;
        return `${String(key).replace('_', ' ')}: ${value}`;
    }

  return (
    <div className="h-full flex flex-col">
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-color">
        <div className="flex items-center justify-between">
             <div className="flex items-center space-x-2">
                {dashboardView === 'files' && (activeCategoryId !== 'all' || activeCollectionId) && (
                     <button onClick={() => updateActiveTab({ dashboardView: 'categories', activeCategoryId: 'all', activeCollectionId: null })} className="p-2 rounded-full hover:bg-white/10" title="Back to Categories">
                         <ChevronLeftIcon className="w-5 h-5"/>
                     </button>
                )}
                <h1 className="text-xl font-bold font-display text-text-primary">
                    {title}
                </h1>
             </div>
            <div className="flex items-center space-x-3">
                
                {/* Enhanced Search Bar */}
                <div className="relative flex items-center w-72 group">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary transition-colors group-focus-within:text-primary">
                        {isAiSearching ? <SparklesIcon className="animate-pulse text-primary" /> : <SearchIcon />}
                    </div>
                    <input 
                        type="text" 
                        placeholder={isMagicSearch ? "Describe media (e.g. 'funny cats')" : "Search titles..."}
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        onKeyDown={e => {
                             if (e.key === 'Enter' && isMagicSearch) {
                                 // Force trigger AI search immediately on Enter
                                 setLocalSearch(localSearch); 
                             }
                        }}
                        className={`bg-input-bg text-text-primary h-10 pl-10 pr-16 rounded-full text-sm w-full focus:outline-none transition-all border border-transparent ${isMagicSearch ? 'focus:ring-2 focus:ring-primary/50 border-primary/30' : 'focus:ring-2 focus:ring-primary'}`} 
                    />
                    
                    {/* Controls Container (Absolute Right) */}
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                        {localSearch && (
                            <button 
                                onClick={() => { setLocalSearch(''); updateActiveTab({searchQuery: '', aiSearchFilters: null}); }} 
                                className="p-1.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-white/10 transition-colors"
                                title="Clear Search"
                            >
                                <XIcon className="w-3 h-3" />
                            </button>
                        )}
                        <button 
                            onClick={() => setIsMagicSearch(!isMagicSearch)} 
                            title={isMagicSearch ? "Switch to Standard Search" : "Switch to AI Semantic Search"}
                            className={`p-1.5 rounded-full transition-all mr-1 ${isMagicSearch ? 'bg-primary text-white shadow-md' : 'text-text-secondary hover:text-primary hover:bg-primary/10'}`}
                        >
                            <SparklesIcon className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="h-9 w-px bg-border-color mx-2"></div>

                <button onClick={undo} disabled={!canUndo} className="p-2 rounded-lg text-text-secondary hover:bg-white/10 hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent" title="Undo (Ctrl+Z)">
                    <UndoIcon className="w-4 h-4" />
                </button>
                 <button onClick={redo} disabled={!canRedo} className="p-2 rounded-lg text-text-secondary hover:bg-white/10 hover:text-text-primary disabled:opacity-50 disabled:hover:bg-transparent" title="Redo (Ctrl+Y)">
                    <RedoIcon className="w-4 h-4" />
                </button>

                <div className="h-9 w-px bg-border-color mx-2"></div>

                <Popover isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} trigger={<button onClick={() => setIsFilterOpen(true)} className="h-9 px-3 bg-input-bg text-text-secondary hover:text-text-primary rounded-lg text-sm flex items-center space-x-2 transition-colors"><FilterIcon className="w-4 h-4" /><span>{currentFilterLabel}</span></button>}>
                    <div className="w-40 bg-card-bg rounded-lg shadow-lg border border-border-color p-1">
                        {FILTER_TYPES.map(opt => <button key={opt.value} onClick={() => {updateActiveTab({ filterType: opt.value as any }); setIsFilterOpen(false);}} className="w-full text-left text-sm px-3 py-1.5 rounded text-text-primary hover:bg-primary">{opt.label}</button>)}
                    </div>
                </Popover>

                <Popover isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} trigger={<button onClick={() => setIsSortOpen(true)} className="h-9 px-3 bg-input-bg text-text-secondary hover:text-text-primary rounded-lg text-sm flex items-center space-x-2"><SortAscendingIcon className="w-4 h-4" /><span>{currentSortLabel}</span></button>}>
                    <div className="w-48 bg-card-bg rounded-lg shadow-lg border border-border-color p-1">
                        {SORT_OPTIONS.map(opt => <button key={opt.value} onClick={() => {updateActiveTab({ sortOption: opt.value }); setIsSortOpen(false);}} className="w-full text-left text-sm px-3 py-1.5 rounded text-text-primary hover:bg-primary">{opt.label}</button>)}
                    </div>
                </Popover>

                <div className="bg-input-bg p-0.5 rounded-lg flex items-center">
                    <button onClick={() => updateActiveTab({ viewMode: 'grid' })} className={`h-8 w-8 flex items-center justify-center rounded-md text-text-secondary transition-colors ${viewMode === 'grid' ? 'bg-sidebar-bg text-text-primary shadow-sm' : 'hover:text-text-primary'}`}><GridIcon className="w-4 h-4" /></button>
                    <button onClick={() => updateActiveTab({ viewMode: 'list' })} className={`h-8 w-8 flex items-center justify-center rounded-md text-text-secondary transition-colors ${viewMode === 'list' ? 'bg-sidebar-bg text-text-primary shadow-sm' : 'hover:text-text-primary'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
                <button onClick={() => updateActiveTab({ view: 'uploads' })} className="h-9 px-4 bg-primary text-white font-semibold rounded-lg text-sm flex items-center space-x-2 hover:bg-opacity-90 transition-all shadow-sm"><UploadIcon className="w-4 h-4" /><span>Upload</span></button>
                
                <Popover isOpen={isDisplayOpen} onClose={() => setIsDisplayOpen(false)} trigger={<button onClick={() => setIsDisplayOpen(true)} className="h-9 w-9 bg-input-bg text-text-secondary hover:text-text-primary rounded-lg flex items-center justify-center transition-colors"><SlidersIcon className="w-4 h-4" /></button>}>
                    <div className="w-80 bg-card-bg rounded-lg shadow-lg border border-border-color p-4 space-y-4">
                        <div>
                            <h3 className="text-sm font-semibold text-text-secondary flex items-center space-x-2 mb-3"><GridIcon className="w-4 h-4" /><span>Layout</span></h3>
                            <div className="space-y-2">
                                <SettingRow label="Card Size">
                                    <div className="flex items-center bg-input-bg p-0.5 rounded-md">
                                        <button onClick={() => handleSettingChange('cardSize', 'small')} className={`text-xs px-3 py-1 rounded ${settings.cardSize === 'small' ? 'bg-primary text-white' : 'text-text-secondary'}`}>S</button>
                                        <button onClick={() => handleSettingChange('cardSize', 'medium')} className={`text-xs px-3 py-1 rounded ${settings.cardSize === 'medium' ? 'bg-primary text-white' : 'text-text-secondary'}`}>M</button>
                                        <button onClick={() => handleSettingChange('cardSize', 'large')} className={`text-xs px-3 py-1 rounded ${settings.cardSize === 'large' ? 'bg-primary text-white' : 'text-text-secondary'}`}>L</button>
                                    </div>
                                </SettingRow>
                                <SettingRow label="Thumbnail Fit">
                                    <div className="flex items-center bg-input-bg p-0.5 rounded-md">
                                        <button onClick={() => handleSettingChange('thumbnailFit', 'cover')} className={`text-xs px-3 py-1 rounded ${settings.thumbnailFit === 'cover' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Cover</button>
                                        <button onClick={() => handleSettingChange('thumbnailFit', 'contain')} className={`text-xs px-3 py-1 rounded ${settings.thumbnailFit === 'contain' ? 'bg-primary text-white' : 'text-text-secondary'}`}>Contain</button>
                                    </div>
                                </SettingRow>
                                 <SettingRow label="Show Details Panel">
                                    <Switch checked={settings.showDetailsPanel} onChange={e => handleSettingChange('showDetailsPanel', e.target.checked)} />
                                </SettingRow>
                            </div>
                        </div>
                        <div className="border-t border-border-color"></div>
                        <div>
                            <h3 className="text-sm font-semibold text-text-secondary flex items-center space-x-2 mb-3"><MousePointerClickIcon className="w-4 h-4" /><span>Interaction</span></h3>
                            <div className="space-y-2">
                                <SettingRow label="Open Media On">
                                    <select value={settings.mediaInteraction} onChange={e => handleSettingChange('mediaInteraction', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-md border border-border-color">
                                        <option value="doubleClickOpen">Double Click</option>
                                        <option value="singleClickOpen">Single Click</option>
                                    </select>
                                </SettingRow>
                                 <SettingRow label="Card Hover Effect">
                                    <select value={settings.hoverEffect} onChange={e => handleSettingChange('hoverEffect', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-md border border-border-color">
                                        <option value="none">None</option>
                                        <option value="scale">Scale</option>
                                        <option value="glow">Glow</option>
                                    </select>
                                </SettingRow>
                                <SettingRow label="Show Hover Select Checkbox">
                                    <Switch checked={settings.showHoverSelect} onChange={e => handleSettingChange('showHoverSelect', e.target.checked)} disabled={settings.mediaInteraction !== 'singleClickOpen'}/>
                                </SettingRow>
                            </div>
                        </div>
                         <div className="border-t border-border-color"></div>
                        <div>
                            <h3 className="text-sm font-semibold text-text-secondary flex items-center space-x-2 mb-3"><EyeIcon className="w-4 h-4" /><span>Visible Card Details</span></h3>
                             <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                                <SettingRow label="Title"><Switch checked={settings.showCardTitle} onChange={e => handleSettingChange('showCardTitle', e.target.checked)} /></SettingRow>
                                <SettingRow label="Rating"><Switch checked={settings.showCardRating} onChange={e => handleSettingChange('showCardRating', e.target.checked)} /></SettingRow>
                                <SettingRow label="Date"><Switch checked={settings.showCardDate} onChange={e => handleSettingChange('showCardDate', e.target.checked)} /></SettingRow>
                                <SettingRow label="File Size"><Switch checked={settings.showCardSize} onChange={e => handleSettingChange('showCardSize', e.target.checked)} /></SettingRow>
                                <SettingRow label="Resolution"><Switch checked={settings.showCardResolution} onChange={e => handleSettingChange('showCardResolution', e.target.checked)} /></SettingRow>
                                <SettingRow label="Duration"><Switch checked={settings.showCardDuration} onChange={e => handleSettingChange('showCardDuration', e.target.checked)} /></SettingRow>
                            </div>
                        </div>
                        <div className="border-t border-border-color"></div>
                         <SettingRow label="Enable Animations"><Switch checked={settings.enableAnimations} onChange={e => handleSettingChange('enableAnimations', e.target.checked)} /></SettingRow>
                         <SettingRow label="Animation Speed">
                            <select value={settings.animationSpeed} onChange={e => handleSettingChange('animationSpeed', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-md border border-border-color">
                                <option value="fast">Fast</option>
                                <option value="normal">Normal</option>
                                <option value="slow">Slow</option>
                            </select>
                        </SettingRow>
                    </div>
                </Popover>
            </div>
        </div>
        {isMagicSearch && aiSearchFilters && (
            <div className="px-6 pb-2 flex items-center flex-wrap gap-2">
                <span className="text-xs font-semibold text-text-secondary">AI Filters:</span>
                {Object.entries(aiSearchFilters).map(([key, value]) => value && (
                    <div key={key} className="flex items-center bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                        {getFilterDisplayName(key, value)}
                        <button onClick={() => updateActiveTab({ aiSearchFilters: { ...aiSearchFilters, [key]: undefined }})} className="ml-1.5 p-0.5 rounded-full hover:bg-primary/50"><XIcon className="w-2.5 h-2.5" /></button>
                    </div>
                ))}
            </div>
        )}
      </div>

      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
       {categoryContextMenu && (
            <CategoryContextMenu 
                x={categoryContextMenu.x} 
                y={categoryContextMenu.y} 
                category={categoryContextMenu.category} 
                onClose={() => setCategoryContextMenu(null)} 
                mediaState={mediaState} 
                onRename={() => setRenamingCategoryId(categoryContextMenu.category.id)}
            />
        )}
    </div>
  );
};

export default Dashboard;
