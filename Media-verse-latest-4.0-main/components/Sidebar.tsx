import React, { useState, useRef, useEffect } from 'react';
import { UseMediaStateReturn, View, Category, Tab, Collection, IconName, Workspace } from '../types';
import { FileIcon, SparklesIcon, HeartIcon, SettingsIcon, PlusIcon, FolderIcon, TrashIcon, UploadCloudIcon, GripVerticalIcon, ChevronsLeftIcon, ChevronsRightIcon, ScissorsIcon, CheckSquareIcon, ClockIcon, StarIcon, BookmarkIcon, VideoIcon, ImageIcon, AudioIcon, EditIcon, SaveIcon, PanelLeftCloseIcon, PanelLeftOpenIcon } from './icons';

const CollectionIcon: React.FC<{ icon?: IconName, className?: string }> = ({ icon, className="w-5 h-5" }) => {
  switch (icon) {
    case 'Clock': return <ClockIcon className={className} />;
    case 'Star': return <StarIcon className={className} />;
    case 'Bookmark': return <BookmarkIcon className={className} />;
    case 'Heart': return <HeartIcon className={className} />;
    case 'Sparkles': return <SparklesIcon className={className} />;
    case 'Video': return <VideoIcon className={className} />;
    case 'Image': return <ImageIcon className={className} />;
    case 'Audio': return <AudioIcon className={className} />;
    case 'Folder':
    default: return <FolderIcon className={className} />;
  }
};

interface SidebarProps {
  mediaState: UseMediaStateReturn;
  activeTab: Tab;
  setActiveView: (view: View) => void;
  setActiveCategoryId: (id: string) => void;
  setActiveCollectionId: (id: string) => void;
  onSettingsClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNewGridPlayerTab?: () => void;
  updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
  onManageCollectionsClick: (id?: string) => void;
  onSaveWorkspace: () => void;
  onLoadWorkspace: (workspace: Workspace) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ mediaState, activeTab, setActiveView, setActiveCategoryId, setActiveCollectionId, onSettingsClick, isCollapsed, onToggleCollapse, updateActiveTab, onManageCollectionsClick, onSaveWorkspace, onLoadWorkspace }) => {
    const { categories, collections, workspaces, addCategory, deleteCategory, updateCategoryOrder, mediaFiles, UNCATEGORIZED_ID, updateMediaFiles, deleteWorkspace, updateCategory } = mediaState;
    const { activeCategoryId, activeCollectionId, view } = activeTab;
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);
    const [collectionContextMenu, setCollectionContextMenu] = useState<{ x: number, y: number, collection: Collection } | null>(null);
    const [renamingCategoryId, setRenamingCategoryId] = useState<string | null>(null);

    const handleAddCategory = () => {
        if (newCategoryName.trim()) {
            addCategory(newCategoryName.trim());
            setNewCategoryName('');
            setIsAddingCategory(false);
        }
    };
    
    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, catId: string) => {
        setDraggedItemId(catId);
        e.dataTransfer.effectAllowed = 'move';
        setTimeout(() => e.currentTarget.classList.add('dragging'), 0);
    };

    const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('dragging');
        document.querySelectorAll('.drop-indicator').forEach(el => el.classList.remove('drop-indicator'));
        setDraggedItemId(null);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const target = e.currentTarget as HTMLElement;
        if (e.dataTransfer.types.includes('application/json')) {
             target.classList.add('bg-primary/20');
        } else if (target.dataset.id !== draggedItemId) {
            target.classList.add('drop-indicator');
        }
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('drop-indicator');
        e.currentTarget.classList.remove('bg-primary/20');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCat: Category | {id: string}) => {
        e.preventDefault();
        e.currentTarget.classList.remove('drop-indicator');
        e.currentTarget.classList.remove('bg-primary/20');
        
        const mediaDragData = e.dataTransfer.getData('application/json');
        if (mediaDragData) {
            const { selectedIds } = JSON.parse(mediaDragData);
            if (selectedIds && selectedIds.length > 0) {
                updateMediaFiles(selectedIds.map((id: string) => ({ id, changes: { category: targetCat.id } })));
            }
            return;
        }

        if (!draggedItemId || draggedItemId === targetCat.id) {
            return;
        }

        const reordered = [...categories.filter(c => c.isPinned)];
        const draggedIndex = reordered.findIndex(c => c.id === draggedItemId);
        const targetIndex = reordered.findIndex(c => c.id === targetCat.id);

        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, draggedItem);
        
        updateCategoryOrder(reordered);
    };
    
    const categoryCounts = React.useMemo(() => {
        const counts: Record<string, number> = {};
        for (const file of mediaFiles) {
            const catId = file.category || UNCATEGORIZED_ID;
            counts[catId] = (counts[catId] || 0) + 1;
        }
        return counts;
    }, [mediaFiles, UNCATEGORIZED_ID]);

    return (
        <>
        <aside className={`flex-shrink-0 flex flex-col bg-sidebar-bg/80 backdrop-blur-sm border-r border-border-color transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`}>
            <header className={`h-16 flex items-center justify-between flex-shrink-0 px-4`}>
                {!isCollapsed && <h1 className="text-xl font-bold font-display text-text-primary">MediaVerse</h1>}
                <button onClick={onToggleCollapse} className="p-2 rounded-lg text-text-secondary hover:bg-white/10 hover:text-text-primary">
                    {isCollapsed ? <PanelLeftOpenIcon /> : <PanelLeftCloseIcon />}
                </button>
            </header>
            <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto">
                <NavItem icon={<FileIcon/>} label="All Media" isActive={view === 'dashboard' && activeCategoryId === 'all' && !activeCollectionId} onClick={() => { setActiveView('dashboard'); setActiveCategoryId('all'); }} isCollapsed={isCollapsed} count={mediaFiles.length}/>
                <NavItem icon={<HeartIcon/>} label="Favorites" isActive={view === 'favorites'} onClick={() => setActiveView('favorites')} isCollapsed={isCollapsed} />
                <NavItem icon={<ScissorsIcon/>} label="Favorite Clips" isActive={view === 'fav_parts'} onClick={() => setActiveView('fav_parts')} isCollapsed={isCollapsed} />
                <NavItem icon={<SparklesIcon/>} label="AI Assistant" isActive={view === 'ai_assistant'} onClick={() => setActiveView('ai_assistant')} isCollapsed={isCollapsed} />

                <div className="h-px bg-border-color/50 !my-4" />
                
                {/* Workspaces Section */}
                <div>
                    <div className="flex items-center justify-between mb-2 h-5 px-2">
                        {!isCollapsed && <h2 className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Workspaces</h2>}
                        {!isCollapsed && (
                            <button onClick={onSaveWorkspace} className="text-text-secondary hover:text-text-primary">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {workspaces.map(workspace => (
                        <WorkspaceItem 
                            key={workspace.id}
                            workspace={workspace}
                            onClick={() => onLoadWorkspace(workspace)}
                            onDelete={() => deleteWorkspace(workspace.id)}
                            isCollapsed={isCollapsed}
                        />
                    ))}
                </div>

                <div className="h-px bg-border-color/50 !my-4" />

                <NavItem icon={<UploadCloudIcon/>} label="Manage Uploads" isActive={view === 'uploads'} onClick={() => setActiveView('uploads')} isCollapsed={isCollapsed} />
                
                <div className="h-px bg-border-color/50 !my-4" />

                {/* Collections Section */}
                <div>
                    <div className="flex items-center justify-between mb-2 h-5 px-2">
                        {!isCollapsed && <h2 className="text-xs font-semibold uppercase text-text-secondary tracking-wider">Collections</h2>}
                        {!isCollapsed && (
                            <button onClick={() => onManageCollectionsClick()} className="text-text-secondary hover:text-text-primary">
                                <PlusIcon className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {collections.map(collection => (
                        <CollectionItem 
                            key={collection.id} 
                            collection={collection} 
                            isActive={view === 'dashboard' && activeCollectionId === collection.id} 
                            onClick={() => { setActiveView('dashboard'); setActiveCollectionId(collection.id); }} 
                            isCollapsed={isCollapsed}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                setCollectionContextMenu({ x: e.clientX, y: e.clientY, collection });
                            }}
                        />
                    ))}
                </div>

                <div className="h-px bg-border-color/50 !my-4" />

                {/* Categories Section */}
                 <div className="flex items-center justify-between mb-2 h-5 px-2">
                    <button 
                        onClick={() => updateActiveTab({ view: 'dashboard', dashboardView: 'categories', activeCategoryId: 'all', activeCollectionId: null })} 
                        className="text-xs font-semibold uppercase text-text-secondary tracking-wider hover:text-text-primary disabled:hover:text-text-secondary"
                        disabled={isCollapsed}
                        title={isCollapsed ? "Categories" : "Browse all categories"}
                    >
                        {!isCollapsed ? 'Categories' : ''}
                    </button>
                    {!isCollapsed && (
                        <button onClick={() => setIsAddingCategory(true)} className="text-text-secondary hover:text-text-primary">
                            <PlusIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
                <div className="space-y-1">
                    <CategoryItem label="Uncategorized" count={categoryCounts[mediaState.UNCATEGORIZED_ID] || 0} isActive={view === 'dashboard' && activeCategoryId === mediaState.UNCATEGORIZED_ID} onClick={() => setActiveCategoryId(mediaState.UNCATEGORIZED_ID)} isCollapsed={isCollapsed} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, {id: UNCATEGORIZED_ID})} />
                    {categories.filter(c => c.isPinned).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)).map(cat => (
                        <CategoryItem 
                            key={cat.id} 
                            catId={cat.id}
                            label={cat.name} 
                            color={cat.color}
                            count={categoryCounts[cat.id] || 0}
                            isActive={view === 'dashboard' && activeCategoryId === cat.id} 
                            onClick={() => setActiveCategoryId(cat.id)}
                            onDelete={() => deleteCategory(cat.id)}
                            isDraggable={!isCollapsed}
                            onDragStart={(e) => handleDragStart(e, cat.id)}
                            onDragEnd={handleDragEnd}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, cat)}
                            isCollapsed={isCollapsed}
                            isRenaming={renamingCategoryId === cat.id}
                            onStartRename={() => setRenamingCategoryId(cat.id)}
                            onEndRename={(newName) => {
                                if(newName && newName !== cat.name) {
                                    updateCategory(cat.id, { name: newName });
                                }
                                setRenamingCategoryId(null);
                            }}
                        />
                    ))}
                    {isAddingCategory && !isCollapsed && (
                        <div className="p-2">
                            <input
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                onBlur={handleAddCategory}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                                placeholder="New category..."
                                className="w-full bg-input-bg text-sm text-text-primary px-2 py-1 rounded-lg border border-transparent focus:border-primary focus:outline-none"
                                autoFocus
                            />
                        </div>
                    )}
                </div>
            </nav>

            <footer className="mt-auto p-4 border-t border-border-color flex-shrink-0">
                <NavItem icon={<SettingsIcon/>} label="Settings" onClick={onSettingsClick} isCollapsed={isCollapsed} />
            </footer>
        </aside>
        {collectionContextMenu && (
            <div className="fixed inset-0 z-50" onClick={() => setCollectionContextMenu(null)}>
                <div className="absolute bg-card-bg rounded-lg shadow-lg border border-border-color p-1 w-48 text-sm" style={{ top: collectionContextMenu.y, left: collectionContextMenu.x }}>
                    <button onClick={() => { onManageCollectionsClick(collectionContextMenu.collection.id); setCollectionContextMenu(null); }} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary flex items-center space-x-2"><EditIcon className="w-4 h-4" /><span>Edit...</span></button>
                    {collectionContextMenu.collection.type === 'manual' && collectionContextMenu.collection.id.length > 10 && ( // Don't delete default collections
                         <button onClick={() => { if(confirm("Delete this collection?")) mediaState.deleteCollection(collectionContextMenu.collection.id); setCollectionContextMenu(null); }} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary text-red-400 flex items-center space-x-2"><TrashIcon className="w-4 h-4" /><span>Delete</span></button>
                    )}
                </div>
            </div>
        )}
        </>
    );
};

interface NavItemProps {
    icon: React.ReactNode;
    label: string;
    isActive?: boolean;
    onClick: () => void;
    isCollapsed: boolean;
    count?: number;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick, isCollapsed, count }) => (
    <button 
        onClick={onClick} 
        title={isCollapsed ? label : ''}
        className={`w-full flex items-center space-x-4 px-4 h-12 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'} ${isCollapsed ? 'justify-center' : ''}`}
    >
        <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">{icon}</div>
        {!isCollapsed && <span className="flex-1 text-left">{label}</span>}
        {!isCollapsed && typeof count === 'number' && <span className="text-xs bg-input-bg px-1.5 py-0.5 rounded-full">{count}</span>}
    </button>
);

const CollectionItem: React.FC<{collection: Collection, isActive: boolean, onClick: () => void, isCollapsed: boolean, onContextMenu: (e: React.MouseEvent) => void}> = ({ collection, isActive, onClick, isCollapsed, onContextMenu }) => {
    return (
         <button 
            onClick={onClick} 
            onContextMenu={onContextMenu}
            title={isCollapsed ? collection.name : ''}
            className={`w-full flex items-center space-x-4 px-4 h-11 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'} ${isCollapsed ? 'justify-center' : ''}`}
        >
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                <CollectionIcon icon={collection.icon} />
            </div>
            {!isCollapsed && <span className="flex-1 text-left truncate">{collection.name}</span>}
        </button>
    )
}

const WorkspaceItem: React.FC<{ workspace: Workspace; onClick: () => void; onDelete: () => void; isCollapsed: boolean; }> = ({ workspace, onClick, onDelete, isCollapsed }) => (
    <div className="group w-full flex items-center justify-between text-text-secondary hover:bg-white/5 hover:text-text-primary rounded-lg">
        <button onClick={onClick} title={isCollapsed ? workspace.name : ''} className={`flex items-center space-x-4 px-4 h-11 text-sm font-medium transition-colors w-full ${isCollapsed ? 'justify-center' : ''}`}>
            <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center"><SaveIcon className="w-5 h-5" /></div>
            {!isCollapsed && <span className="flex-1 text-left truncate">{workspace.name}</span>}
        </button>
        {!isCollapsed && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-500 transition-opacity mr-2">
                <TrashIcon className="w-4 h-4" />
            </button>
        )}
    </div>
);


interface CategoryItemProps {
    label: string;
    count?: number;
    isActive?: boolean;
    onClick: () => void;
    onDelete?: () => void;
    isDraggable?: boolean;
    catId?: string;
    color?: string;
    onDragStart?: React.DragEventHandler<HTMLDivElement>;
    onDragEnd?: React.DragEventHandler<HTMLDivElement>;
    onDragOver?: React.DragEventHandler<HTMLDivElement>;
    onDragLeave?: React.DragEventHandler<HTMLDivElement>;
    onDrop?: React.DragEventHandler<HTMLDivElement>;
    isCollapsed: boolean;
    isRenaming?: boolean;
    onStartRename?: () => void;
    onEndRename?: (newName: string | null) => void;
}
const CategoryItem: React.FC<CategoryItemProps> = ({ label, count, isActive, onClick, onDelete, isDraggable, catId, color, isCollapsed, isRenaming, onStartRename, onEndRename, ...dragProps }) => {
    const [renameValue, setRenameValue] = useState(label);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if(isRenaming) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isRenaming]);

    const handleRenameSubmit = () => {
        onEndRename?.(renameValue.trim());
    };

    return (
        <div 
            data-id={catId}
            draggable={isDraggable && !isRenaming}
            {...dragProps}
            title={isCollapsed ? `${label} (${count})` : ''}
            className={`group w-full flex items-center justify-between px-4 h-11 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'} ${isDraggable ? 'cursor-move' : ''} ${isCollapsed ? 'justify-center' : ''}`} 
            onClick={onClick}
            onDoubleClick={onStartRename}
        >
            <div className={`flex items-center space-x-3 truncate ${isCollapsed ? 'justify-center' : ''}`}>
                {isDraggable && !isCollapsed && <GripVerticalIcon className="w-4 h-4 text-text-secondary/50 cursor-grab" />}
                
                <div className="w-6 h-6 flex-shrink-0 flex items-center justify-center">
                    {color ? <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }}/> : <FolderIcon className="w-5 h-5" />}
                </div>

                {!isCollapsed && (isRenaming ? (
                    <input
                        ref={inputRef}
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleRenameSubmit();
                            if (e.key === 'Escape') onEndRename?.(null);
                        }}
                        onClick={e => e.stopPropagation()}
                        className="bg-input-bg border border-primary -m-1 p-0.5 rounded outline-none w-full"
                    />
                ) : (
                    <span className="truncate flex-1">{label}</span>
                ))}
            </div>
            {!isCollapsed && (
                <div className="flex items-center space-x-2">
                    {typeof count === 'number' && <span className="text-xs bg-input-bg px-1.5 py-0.5 rounded-full">{count}</span>}
                    {onDelete && (
                        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="opacity-0 group-hover:opacity-100 text-text-secondary hover:text-red-500 transition-opacity">
                            <TrashIcon className="w-4 h-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};


export default Sidebar;