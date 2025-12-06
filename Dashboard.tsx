import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { UseMediaStateReturn, MediaFile, View, MediaType, SortOption, ViewMode, AppSettings, Tab, Category, Collection, CollectionRule } from '../types';
import MediaGrid from './MediaGrid';
import Popover from './ui/Popover';
import SelectionActionBar from './SelectionActionBar';
import DetailsPanel from './DetailsPanel';
// FIX: Import ChevronsRightIcon
import { SearchIcon, FilterIcon, SortAscendingIcon, GridIcon, ListIcon, UploadIcon, SlidersIcon, FolderIcon, MoreVerticalIcon, PinIcon, EditIcon, TrashIcon, ChevronLeftIcon, ChevronsRightIcon } from './icons';

const CATEGORY_COLORS = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899'];

// In-component Category Card for the new folder view
const CategoryCard: React.FC<{ category: Category, count: number, onClick: () => void, onContextMenu: (e: React.MouseEvent) => void, onDragStart: React.DragEventHandler, onDragOver: React.DragEventHandler, onDragLeave: React.DragEventHandler, onDrop: React.DragEventHandler }> = ({ category, count, onClick, onContextMenu, ...dragProps }) => {
    return (
        <div 
            className="group relative flex flex-col items-center justify-center text-center p-4 bg-card-bg rounded-card cursor-pointer transition-all hover:bg-primary/10 hover:-translate-y-1"
            onClick={onClick}
            onContextMenu={onContextMenu}
            draggable={category.id !== 'uncategorized'}
            {...dragProps}
        >
            <FolderIcon className="w-24 h-24 text-primary/30 transition-colors group-hover:text-primary/50" style={{ color: category.color || undefined }} />
            <h3 className="font-display font-bold text-lg text-text-primary mt-2">{category.name}</h3>
            <p className="text-sm text-text-secondary">{count} item{count !== 1 ? 's' : ''}</p>
            <button className="absolute top-2 right-2 p-2 rounded-full text-text-secondary opacity-0 group-hover:opacity-100 hover:bg-white/10" onClick={e => { e.stopPropagation(); onContextMenu(e); }}>
                <MoreVerticalIcon className="w-5 h-5" />
            </button>
        </div>
    );
};

// In-component Category Context Menu
const CategoryContextMenu: React.FC<{ x: number, y: number, category: Category, onClose: () => void, mediaState: UseMediaStateReturn }> = ({ x, y, category, onClose, mediaState }) => {
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
                        <button className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary disabled:opacity-50" disabled>
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


interface DashboardProps {
  mediaState: UseMediaStateReturn;
  activeTab: Tab;
  updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
  onContextMenu: (event: React.MouseEvent, file: MediaFile) => void;
  onAddToGridPlayer: (files: MediaFile[]) => void;
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

const FILTER_TYPES: { label: string; value: MediaType | 'all' }[] = [
    { label: 'All Types', value: 'all' },
    { label: 'Videos', value: 'video' },
    { label: 'Images', value: 'image' },
    { label: 'Audio', value: 'audio' },
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
    let fileValue: any = field.startsWith('metadata.') 
        ? file.metadata[field.substring(9) as keyof MediaFile['metadata']] 
        : file[field as keyof MediaFile];

    if (fileValue === undefined) return false;

    // Ensure types are consistent for comparison
    const ruleValue = typeof fileValue === 'number' ? Number(value) : value;

    switch(operator) {
        case 'gte': return fileValue >= ruleValue;
        case 'gt': return fileValue > ruleValue;
        case 'lte': return fileValue <= ruleValue;
        case 'lt': return fileValue < ruleValue;
        case 'eq': return fileValue === ruleValue;
        case 'neq': return fileValue !== ruleValue;
        case 'contains': 
            return typeof fileValue === 'string' && typeof ruleValue === 'string' && fileValue.toLowerCase().includes(ruleValue.toLowerCase());
        default: return false;
    }
}


const Dashboard: React.FC<DashboardProps> = ({ mediaState, activeTab, updateActiveTab, onContextMenu, onAddToGridPlayer }) => {
  const { mediaFiles, categories, collections, UNCATEGORIZED_ID, settings, updateMediaFile, deleteMediaFiles, updateSettings, updateMediaFiles, mergeCategories } = mediaState;
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const marqueeRef = useRef<HTMLDivElement>(null);
  const dragStartPos = useRef<{x: number, y: number} | null>(null);

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState(activeTab.searchQuery);
  const [categoryContextMenu, setCategoryContextMenu] = useState<{ x: number, y: number, category: Category } | null>(null);
  const [renamingFileId, setRenamingFileId] = useState<string | null>(null);
  
  const debouncedSearch = useDebounce(localSearch, 300);

  useEffect(() => {
    updateActiveTab({ searchQuery: debouncedSearch });
  }, [debouncedSearch]);


  const {
      activeCategoryId,
      activeCollectionId,
      searchQuery,
      filterType,
      sortOption,
      viewMode,
      selectedFileIds,
      focusedFileId,
      dashboardView,
      detailsPanelFileId,
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
      if (filterType !== 'all' && file.type !== filterType) return false;
      if (searchQuery && !file.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
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
  }, [mediaFiles, activeCategoryId, activeCollectionId, collections, filterType, searchQuery, sortOption, UNCATEGORIZED_ID]);
  
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
    
    updateActiveTab({ 
        selectedFileIds: newSelectedIds,
        detailsPanelFileId: newSelectedIds.length === 1 ? newSelectedIds[0] : null,
    });
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

      marqueeRef.current.style.left = `${rectX}px`;
      marqueeRef.current.style.top = `${rectY}px`;
      marqueeRef.current.style.width = `${rectWidth}px`;
      marqueeRef.current.style.height = `${rectHeight}px`;

      const gridRect = gridContainerRef.current.getBoundingClientRect();
      const newSelectedIds: string[] = [];
      const cardElements = gridContainerRef.current.querySelectorAll('.media-card');
      
      cardElements.forEach(card => {
          const cardRect = card.getBoundingClientRect();
          const cardId = (card as HTMLElement).dataset.fileId;
          if (!cardId) return;

          // Check for intersection
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
                    onStartRename={setRenamingFileId}
                    onEndRename={() => setRenamingFileId(null)}
                />
                <SelectionActionBar 
                    selectedFiles={selectedFiles}
                    onClear={() => updateActiveTab({ selectedFileIds: [] })}
                    onDelete={handleDeleteSelection}
                    onUpdateFiles={updateMediaFiles}
                    onAddToGridPlayer={onAddToGridPlayer}
                    categories={categories}
                />
            </div>
            {detailsPanelFileId && (
                <DetailsPanel 
                    file={mediaFiles.find(f => f.id === detailsPanelFileId)}
                    onClose={() => updateActiveTab({ detailsPanelFileId: null, selectedFileIds: [] })}
                    mediaState={mediaState}
                />
            )}
        </div>
    )
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
                <div className="relative">
                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                    <input type="text" placeholder="Search files..." 
                        value={localSearch}
                        onChange={e => setLocalSearch(e.target.value)}
                        className="bg-input-bg text-text-primary h-9 pl-9 pr-3 rounded-lg text-sm w-48 focus:outline-none focus:ring-2 ring-inset focus:ring-primary" 
                    />
                </div>
                
                <Popover isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} trigger={<button onClick={() => setIsFilterOpen(true)} className="h-9 px-3 bg-input-bg text-text-secondary hover:text-text-primary rounded-lg text-sm flex items-center space-x-2"><FilterIcon className="w-4 h-4" /><span>{currentFilterLabel}</span></button>}>
                    <div className="w-40 bg-card-bg rounded-lg shadow-lg border border-border-color p-1">
                        {FILTER_TYPES.map(opt => <button key={opt.value} onClick={() => {updateActiveTab({ filterType: opt.value }); setIsFilterOpen(false);}} className="w-full text-left text-sm px-3 py-1.5 rounded text-text-primary hover:bg-primary">{opt.label}</button>)}
                    </div>
                </Popover>

                <Popover isOpen={isSortOpen} onClose={() => setIsSortOpen(false)} trigger={<button onClick={() => setIsSortOpen(true)} className="h-9 px-3 bg-input-bg text-text-secondary hover:text-text-primary rounded-lg text-sm flex items-center space-x-2"><SortAscendingIcon className="w-4 h-4" /><span>{currentSortLabel}</span></button>}>
                    <div className="w-48 bg-card-bg rounded-lg shadow-lg border border-border-color p-1">
                        {SORT_OPTIONS.map(opt => <button key={opt.value} onClick={() => {updateActiveTab({ sortOption: opt.value }); setIsSortOpen(false);}} className="w-full text-left text-sm px-3 py-1.5 rounded text-text-primary hover:bg-primary">{opt.label}</button>)}
                    </div>
                </Popover>

                <div className="bg-input-bg p-0.5 rounded-lg flex items-center">
                    <button onClick={() => updateActiveTab({ viewMode: 'grid' })} className={`h-8 w-8 flex items-center justify-center rounded-md text-text-secondary ${viewMode === 'grid' ? 'bg-sidebar-bg text-text-primary' : 'hover:text-text-primary'}`}><GridIcon className="w-4 h-4" /></button>
                    <button onClick={() => updateActiveTab({ viewMode: 'list' })} className={`h-8 w-8 flex items-center justify-center rounded-md text-text-secondary ${viewMode === 'list' ? 'bg-sidebar-bg text-text-primary' : 'hover:text-text-primary'}`}><ListIcon className="w-4 h-4" /></button>
                </div>
                <button onClick={() => updateActiveTab({ view: 'uploads' })} className="h-9 px-4 bg-primary text-white font-semibold rounded-lg text-sm flex items-center space-x-2"><UploadIcon className="w-4 h-4" /><span>Upload</span></button>
                
                <Popover isOpen={isDisplayOpen} onClose={() => setIsDisplayOpen(false)} trigger={<button onClick={() => setIsDisplayOpen(true)} className="h-9 w-9 bg-input-bg text-text-secondary hover:text-text-primary rounded-lg flex items-center justify-center"><SlidersIcon className="w-4 h-4" /></button>}>
                    <div className="w-56 bg-card-bg rounded-lg shadow-lg border border-border-color p-3 space-y-3">
                        <p className="text-xs font-semibold text-text-secondary">GRID DISPLAY OPTIONS</p>
                        <div>
                            <label className="text-sm text-text-primary">Card Size</label>
                            <div className="flex items-center justify-between mt-1 text-text-primary">
                                <button onClick={() => handleSettingChange('cardSize', 'small')} className={`text-xs px-3 py-1 rounded ${settings.cardSize === 'small' ? 'bg-primary' : 'bg-input-bg'}`}>S</button>
                                <button onClick={() => handleSettingChange('cardSize', 'medium')} className={`text-xs px-3 py-1 rounded ${settings.cardSize === 'medium' ? 'bg-primary' : 'bg-input-bg'}`}>M</button>
                                <button onClick={() => handleSettingChange('cardSize', 'large')} className={`text-xs px-3 py-1 rounded ${settings.cardSize === 'large' ? 'bg-primary' : 'bg-input-bg'}`}>L</button>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm text-text-primary">Thumbnail Fit</label>
                            <div className="flex items-center justify-between mt-1 text-text-primary">
                                <button onClick={() => handleSettingChange('thumbnailFit', 'cover')} className={`text-xs px-3 py-1 rounded w-1/2 ${settings.thumbnailFit === 'cover' ? 'bg-primary' : 'bg-input-bg'}`}>Cover</button>
                                <button onClick={() => handleSettingChange('thumbnailFit', 'contain')} className={`text-xs px-3 py-1 rounded w-1/2 ${settings.thumbnailFit === 'contain' ? 'bg-primary' : 'bg-input-bg'}`}>Contain</button>
                            </div>
                        </div>
                    </div>
                </Popover>
            </div>
        </div>
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
            />
        )}
    </div>
  );
};

export default Dashboard;