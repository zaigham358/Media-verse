import React, { useState } from 'react';
import { MediaFile, UseMediaStateReturn, Tab, Category, Collection } from '../types';
import { HeartIcon, PlusIcon, TrashIcon, EditIcon, CopyIcon, FolderIcon, ChevronsRightIcon, SparklesIcon, LayoutGridIcon, XIcon, CheckSquareIcon } from './icons';
import { getMediaFileSrc } from '../db';
import { analyzeMediaContent, generateSocialMediaPost } from '../services/geminiService';

interface MediaCardContextMenuProps {
  x: number;
  y: number;
  file: MediaFile;
  onClose: () => void;
  mediaState: UseMediaStateReturn;
  activeTab: Tab;
  updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
  openFileInNewTab: (file: MediaFile) => void;
  onAddToGridPlayer: (files: MediaFile[]) => void;
  onStartRename: (fileId: string) => void;
}

const COLOR_TAGS = ['red', 'yellow', 'green', 'blue', 'purple'];

const MediaCardContextMenu: React.FC<MediaCardContextMenuProps> = ({ x, y, file, onClose, mediaState, activeTab, updateActiveTab, openFileInNewTab, onAddToGridPlayer, onStartRename }) => {
  const { categories, collections, updateMediaFile, deleteMediaFile, addCategory, mediaFiles, updateMediaFiles, updateCollection } = mediaState;
  const { selectedFileIds } = activeTab;
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [copyStatus, setCopyStatus] = useState<'title' | null>(null);

  const isFileSelected = selectedFileIds.includes(file.id);
  const contextFiles = isFileSelected ? mediaFiles.filter(f => selectedFileIds.includes(f.id)) : [file];
  const contextFileIds = contextFiles.map(f => f.id);
  
  const handleBulkUpdate = (changes: Partial<MediaFile>) => {
    updateMediaFiles(contextFileIds.map(id => ({ id, changes })));
    onClose();
  };

  const handleDelete = () => {
      if (window.confirm(`Are you sure you want to delete ${contextFiles.length} item(s)?`)) {
          mediaState.deleteMediaFiles(contextFileIds);
      }
      onClose();
  }

  const handleRename = () => {
    onClose();
    if (contextFiles.length > 1) {
        alert("Renaming multiple files is not supported yet.");
        return;
    }
    onStartRename(file.id);
  }

  const handleCopy = (type: 'title') => {
      navigator.clipboard.writeText(file.title);
      setCopyStatus(type);
      setTimeout(() => {
          setCopyStatus(null);
          onClose();
      }, 1200);
  }
  
  const handleAiAction = async (action: 'analyze' | 'social') => {
    setIsAiLoading(true);
    setActiveSubmenu(null);
    try {
        if(contextFiles.length > 1) throw new Error("AI actions currently work on one file at a time.");
        const blob = await getMediaFileSrc(file.id);
        if (!blob) throw new Error("Could not load media file.");

        if (action === 'analyze') {
            const result = await analyzeMediaContent(blob, blob.type);
            let categoryId = mediaState.UNCATEGORIZED_ID;
            const existingCategory = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
            if (existingCategory) categoryId = existingCategory.id;
            else if (result.category) { const newCategory = await addCategory(result.category); categoryId = newCategory.id; }
            const newTags = [...new Set([...(file.metadata.tags || []), ...result.tags])];
            updateMediaFile({ ...file, category: categoryId, metadata: { ...file.metadata, description: result.description, tags: newTags } });
        } else if (action === 'social') {
            const post = await generateSocialMediaPost(blob, blob.type, file.title);
            alert(`AI Generated Social Media Post:\n\n${post}`);
        }
    } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "An unknown AI error occurred.");
    } finally {
        setIsAiLoading(false);
        onClose();
    }
  }

  const handleAddToCollection = (collection: Collection) => {
    if (collection.type === 'manual') {
        const newMediaIds = [...new Set([...(collection.mediaIds || []), ...contextFileIds])];
        updateCollection({ ...collection, mediaIds: newMediaIds });
    }
    onClose();
  };

  const manualCollections = collections.filter(c => c.type === 'manual');

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
        <div className="absolute bg-card-bg rounded-lg shadow-2xl border border-border-color p-2 w-56 text-sm" style={{ top: y, left: x }} onClick={(e) => e.stopPropagation()}>
            <div className="px-2 py-1 font-semibold text-text-primary truncate">{contextFiles.length > 1 ? `${contextFiles.length} items selected` : file.title}</div>
            <div className="h-px bg-border-color my-1" />

            {contextFiles.some(f => f.type === 'video') && renderMenuItem(<LayoutGridIcon className="w-4 h-4"/>, 'Add to Grid Player', () => onAddToGridPlayer(contextFiles))}

            <div className="relative" onMouseEnter={() => setActiveSubmenu('ai')} onMouseLeave={() => setActiveSubmenu(null)}>
                <button disabled={isAiLoading || contextFiles.length > 1} className="w-full flex items-center justify-between space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary disabled:opacity-50">
                    <div className="flex items-center space-x-2"><SparklesIcon className={`w-4 h-4 text-primary ${isAiLoading ? 'animate-pulse' : ''}`} /><span>AI Actions...</span></div>
                    <ChevronsRightIcon className="w-4 h-4" />
                </button>
                {activeSubmenu === 'ai' && !isAiLoading && (
                    <div className="absolute left-full -top-2 ml-1 bg-card-bg rounded-lg shadow-2xl border border-border-color p-1 w-56 z-10">
                        <button onClick={() => handleAiAction('analyze')} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">Generate Desc & Tags</button>
                        <button onClick={() => handleAiAction('social')} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">Create Social Post</button>
                    </div>
                )}
            </div>

            <div className="h-px bg-border-color my-1" />
            {renderMenuItem(<HeartIcon className={`w-4 h-4 ${file.isFavorite ? 'text-red-500 fill-current' : ''}`} />, 'Toggle Favorite', () => handleBulkUpdate({ isFavorite: !file.isFavorite }))}
            {contextFiles.length === 1 && renderMenuItem(<PlusIcon className="w-4 h-4" />, 'Open in New Tab', () => openFileInNewTab(file))}
            <div className="h-px bg-border-color my-1" />
            {renderMenuItem(<EditIcon className="w-4 h-4" />, 'Rename', handleRename, contextFiles.length > 1)}
            {contextFiles.length === 1 && <button onClick={() => handleCopy('title')} className={`w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded ${copyStatus === 'title' ? 'bg-green-500/80' : 'hover:bg-primary'}`}><CopyIcon className="w-4 h-4" /><span>{copyStatus === 'title' ? 'Copied!' : 'Copy Title'}</span></button>}
            
            {renderSubmenu('collection', <CheckSquareIcon className="w-4 h-4" />, 'Add to collection...', manualCollections.map(c => <button key={c.id} onClick={() => handleAddToCollection(c)} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">{c.name}</button>))}
            {renderSubmenu('category', <FolderIcon className="w-4 h-4" />, 'Move to...', categories.map(cat => <button key={cat.id} onClick={() => handleBulkUpdate({ category: cat.id })} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">{cat.name}</button>))}
            {renderSubmenu('colorTag', <div className={`w-4 h-4 flex items-center justify-center`}><div className="w-2.5 h-2.5 rounded-full border border-text-secondary"/></div>, 'Color Tag', 
                <div className="flex justify-around p-2">
                    {COLOR_TAGS.map(color => <button key={color} onClick={() => handleBulkUpdate({ colorTag: color as any })} className={`w-5 h-5 rounded-full ring-2 ring-offset-2 ring-offset-card-bg transition-all bg-${color}-500 ${file.colorTag === color ? 'ring-primary' : 'ring-transparent'}`} />)}
                    <button onClick={() => handleBulkUpdate({ colorTag: undefined })} className="w-5 h-5 rounded-full border-2 border-text-secondary flex items-center justify-center"><XIcon className="w-3 h-3 text-text-secondary" /></button>
                </div>
            )}
            
            <div className="h-px bg-border-color my-1" />
            {renderSubmenu('select', <FolderIcon className="w-4 h-4" />, 'Select...',
                <>
                    <button onClick={() => { updateActiveTab({ selectedFileIds: mediaFiles.filter(f => f.type === 'video').map(f => f.id) }); onClose(); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">All Videos</button>
                    <button onClick={() => { updateActiveTab({ selectedFileIds: mediaFiles.filter(f => f.type === 'image').map(f => f.id) }); onClose(); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">All Images</button>
                    <button onClick={() => { updateActiveTab({ selectedFileIds: mediaFiles.filter(f => f.type === 'audio').map(f => f.id) }); onClose(); }} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary">All Audio</button>
                </>
            )}
            <div className="h-px bg-border-color my-1" />
            {renderMenuItem(<TrashIcon className="w-4 h-4" />, 'Delete', handleDelete, false, 'text-red-400')}
        </div>
    </div>
  );

  function renderMenuItem(icon: React.ReactNode, label: string, action: () => void, disabled = false, customClass = '') {
      return (
          <button onClick={() => {!disabled && action(); onClose();}} disabled={disabled} className={`w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed ${customClass}`}>
              {icon}
              <span>{label}</span>
          </button>
      );
  }

  function renderSubmenu(name: string, icon: React.ReactNode, label: string, children: React.ReactNode, disabled = false) {
    return (
        <div className="relative" onMouseEnter={() => !disabled && setActiveSubmenu(name)} onMouseLeave={() => setActiveSubmenu(null)}>
            <div className={`w-full flex items-center justify-between space-x-2 text-left px-2 py-1.5 rounded  ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary cursor-default'}`}>
                <div className="flex items-center space-x-2">{icon}<span>{label}</span></div>
                <ChevronsRightIcon className="w-4 h-4" />
            </div>
            {activeSubmenu === name && !disabled && (
                <div className="absolute left-full -top-2 ml-1 bg-card-bg rounded-lg shadow-2xl border border-border-color p-1 w-48 z-10">
                    {children}
                </div>
            )}
        </div>
    );
  }
};
export default MediaCardContextMenu;