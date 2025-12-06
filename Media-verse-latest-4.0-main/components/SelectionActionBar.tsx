import React, { useMemo, useState } from 'react';
import { TrashIcon, XIcon, FolderIcon, StarIcon, LayoutGridIcon } from './icons';
import { MediaFile, Category } from '../types';
import Popover from './ui/Popover';

interface SelectionActionBarProps {
  selectedFiles: MediaFile[];
  onClear: () => void;
  onDelete: () => void;
  onUpdateFiles: (updates: {id: string, changes: Partial<MediaFile>}[]) => Promise<void>;
  onAddToGridPlayer: (files: MediaFile[]) => void;
  categories: Category[];
}

const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

const SelectionActionBar: React.FC<SelectionActionBarProps> = ({ selectedFiles, onClear, onDelete, onUpdateFiles, onAddToGridPlayer, categories }) => {
  const [isCategoryPopoverOpen, setIsCategoryPopoverOpen] = useState(false);
  const [isRatingPopoverOpen, setIsRatingPopoverOpen] = useState(false);
  const selectedCount = selectedFiles.length;

  const totalSize = useMemo(() => {
    return selectedFiles.reduce((acc, file) => acc + file.metadata.size, 0);
  }, [selectedFiles]);

  const handleBulkUpdate = (changes: Partial<MediaFile>) => {
    const updates = selectedFiles.map(file => ({ id: file.id, changes }));
    onUpdateFiles(updates);
  };
  
  const handleMoveToCategory = (categoryId: string) => {
    handleBulkUpdate({ category: categoryId });
    setIsCategoryPopoverOpen(false);
  };
  
  const handleSetRating = (rating: number) => {
    handleBulkUpdate({ rating });
    setIsRatingPopoverOpen(false);
  };
  
  const handleAddToGrid = () => {
    onAddToGridPlayer(selectedFiles);
    onClear();
  };

  return (
    <div className={`absolute bottom-4 left-1/2 -translate-x-1/2 w-auto bg-sidebar-bg rounded-lg shadow-2xl flex items-center space-x-2 px-3 py-2 transition-all duration-300 ${selectedCount > 0 ? 'translate-y-0 opacity-100' : 'translate-y-16 opacity-0 pointer-events-none'}`}>
        <span className="text-sm font-semibold text-text-primary">{selectedCount} item{selectedCount > 1 ? 's' : ''} selected</span>
        <span className="text-xs text-text-secondary">({formatBytes(totalSize)})</span>

        <div className="w-px h-6 bg-border-color mx-2"></div>

        <Popover
            isOpen={isRatingPopoverOpen}
            onClose={() => setIsRatingPopoverOpen(false)}
            position="top-center"
            trigger={
                <button onClick={() => setIsRatingPopoverOpen(true)} className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary p-2 rounded-md hover:bg-white/5" title="Set Rating">
                    <StarIcon className="w-4 h-4" />
                </button>
            }
        >
            <div className="bg-card-bg p-2 rounded-lg border border-border-color flex space-x-1">
                {[1,2,3,4,5].map(star => <button key={star} onClick={() => handleSetRating(star)} className="p-1 rounded-full hover:bg-primary"><StarIcon className="w-5 h-5 text-yellow-400 fill-current" /></button>)}
            </div>
        </Popover>

        <Popover
            isOpen={isCategoryPopoverOpen}
            onClose={() => setIsCategoryPopoverOpen(false)}
            position="top-center"
            trigger={
                <button onClick={() => setIsCategoryPopoverOpen(true)} className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary p-2 rounded-md hover:bg-white/5" title="Move to Category">
                    <FolderIcon className="w-4 h-4" />
                </button>
            }
        >
            <div className="bg-card-bg p-1 rounded-lg border border-border-color w-48 max-h-60 overflow-y-auto">
                {categories.map(cat => <button key={cat.id} onClick={() => handleMoveToCategory(cat.id)} className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-primary">{cat.name}</button>)}
            </div>
        </Popover>
        
        {selectedFiles.some(f => f.type === 'video') && (
            <button onClick={handleAddToGrid} className="flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary p-2 rounded-md hover:bg-white/5" title="Add to Grid Player">
                <LayoutGridIcon className="w-4 h-4" />
            </button>
        )}

        <button onClick={onDelete} className="flex items-center space-x-2 text-sm text-red-400 hover:text-red-300 p-2 rounded-md hover:bg-red-500/10" title="Delete Selection">
            <TrashIcon className="w-4 h-4" />
        </button>

        <div className="w-px h-6 bg-border-color mx-2"></div>

        <button onClick={onClear} className="text-text-secondary hover:text-text-primary p-2 rounded-full hover:bg-white/5" title="Clear Selection">
            <XIcon className="w-5 h-5" />
        </button>
    </div>
  );
};

export default SelectionActionBar;