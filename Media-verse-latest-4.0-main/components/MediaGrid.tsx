
import React, { useEffect, useRef } from 'react';
import { MediaFile, AppSettings, ViewMode } from '../types';
import MediaCard from './MediaCard';
import { FolderIcon, SearchIcon, UploadIcon } from './icons';

interface MediaGridProps {
  files: MediaFile[];
  onFileClick: (file: MediaFile) => void;
  settings: AppSettings;
  onUpdateFile: (file: MediaFile) => void;
  selectedFileIds: string[];
  onSelectFile: (fileId: string, ctrlKey?: boolean, shiftKey?: boolean) => void;
  focusedFileId: string | null;
  setFocusedFileId: (id: string | null) => void;
  viewMode: ViewMode;
  onContextMenu: (event: React.MouseEvent, file: MediaFile) => void;
  renamingFileId: string | null | undefined;
  onStartRename: (id: string) => void;
  onEndRename: () => void;
  closingFileId: string | null;
  onNavigateToUploads?: () => void;
}

const EmptyState: React.FC<{ onUpload?: () => void }> = ({ onUpload }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center px-4 animate-[fadeIn_0.5s_ease-out]">
        <div className="w-24 h-24 bg-input-bg rounded-full flex items-center justify-center mb-6 shadow-inner">
             <SearchIcon className="w-10 h-10 text-text-secondary" />
        </div>
        <h2 className="text-2xl font-bold text-text-primary font-display mb-2">No media found</h2>
        <p className="text-text-secondary max-w-md mb-8">
            We couldn't find any files matching your current filters. Try adjusting your search or add some new content.
        </p>
        {onUpload && (
            <button 
                onClick={onUpload} 
                className="flex items-center space-x-2 bg-primary text-white px-6 py-3 rounded-full font-semibold shadow-lg hover:shadow-primary/30 hover:scale-105 transition-all duration-200"
            >
                <UploadIcon className="w-5 h-5" />
                <span>Upload Media</span>
            </button>
        )}
    </div>
);

const MediaGrid: React.FC<MediaGridProps> = ({ files, onFileClick, settings, onUpdateFile, selectedFileIds, onSelectFile, focusedFileId, setFocusedFileId, viewMode, onContextMenu, renamingFileId, onStartRename, onEndRename, closingFileId, onNavigateToUploads }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const getColumns = () => {
        if (!gridRef.current || viewMode === 'list') return 1;
        const gridStyle = window.getComputedStyle(gridRef.current);
        return gridStyle.getPropertyValue('grid-template-columns').split(' ').length;
    };

    const handleKeyDown = (e: KeyboardEvent) => {
        if (renamingFileId) return; // Don't handle navigation when renaming
        if (!focusedFileId || files.length === 0) return;
        
        const isTextInput = (e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA';
        if (isTextInput) return;

        const currentIndex = files.findIndex(f => f.id === focusedFileId);
        if (currentIndex === -1) return;

        let nextIndex = -1;
        const columns = getColumns();

        switch (e.key) {
            case 'ArrowRight':
                nextIndex = Math.min(files.length - 1, currentIndex + 1);
                break;
            case 'ArrowLeft':
                nextIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
                nextIndex = Math.min(files.length - 1, currentIndex + columns);
                break;
            case 'ArrowUp':
                nextIndex = Math.max(0, currentIndex - columns);
                break;
            case 'Enter':
                onFileClick(files[currentIndex]);
                break;
            case 'F2':
                e.preventDefault();
                onStartRename(focusedFileId);
                return; // Return to prevent further action
            case ' ': // Spacebar to select
                e.preventDefault();
                onSelectFile(focusedFileId, e.ctrlKey || e.metaKey, e.shiftKey);
                return;
            default:
                return;
        }
        
        e.preventDefault();
        if (nextIndex !== -1) {
            const nextFileId = files[nextIndex].id;
            
            if (e.shiftKey) {
                // To make shift + arrow selection intuitive, we treat the focused file as the "active" end of the selection.
                // The "anchor" is the last file that was selected *without* the shift key.
                // For simplicity here, we'll just use the existing onSelectFile logic which anchors on the previously focused file.
                onSelectFile(nextFileId, e.ctrlKey || e.metaKey, true);
            } else {
                setFocusedFileId(nextFileId);
            }
        }
    };

    const container = gridRef.current;
    container?.addEventListener('keydown', handleKeyDown);
    return () => container?.removeEventListener('keydown', handleKeyDown);
  }, [focusedFileId, files, onFileClick, onSelectFile, setFocusedFileId, viewMode, onStartRename, renamingFileId]);

  useEffect(() => {
    if (focusedFileId) {
        const focusedElement = gridRef.current?.querySelector(`[data-file-id="${focusedFileId}"]`);
        focusedElement?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [focusedFileId]);


  if (files.length === 0) {
    return <EmptyState onUpload={onNavigateToUploads} />;
  }
  
  const sizeClasses = {
      small: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9',
      medium: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6',
      large: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5',
  }

  const gridClasses = viewMode === 'grid' 
    ? `grid ${sizeClasses[settings.cardSize]} gap-6 p-8`
    : "flex flex-col gap-2 p-4";

  return (
    <div ref={gridRef} className={gridClasses} tabIndex={-1} style={{outline: 'none'}}>
      {files.map(file => (
        <MediaCard 
          key={file.id} 
          file={file} 
          onClick={(e) => {
            if (renamingFileId) return;
            if (settings.mediaInteraction === 'singleClickOpen') {
              onFileClick(file);
            } else { // doubleClickOpen
              onSelectFile(file.id, e.ctrlKey || e.metaKey, e.shiftKey);
            }
          }}
          onDoubleClick={() => {
            if (renamingFileId) return;
            if (settings.mediaInteraction === 'doubleClickOpen') {
              onFileClick(file);
            }
          }}
          settings={settings}
          onUpdateFile={onUpdateFile}
          isSelected={selectedFileIds.includes(file.id)}
          isFocused={focusedFileId === file.id}
          onSelectFile={(e) => onSelectFile(file.id, true)}
          onHoverSelect={() => onSelectFile(file.id, false, false)}
          viewMode={viewMode}
          onContextMenu={(e) => onContextMenu(e, file)}
          isRenaming={renamingFileId === file.id}
          onStartRename={onStartRename}
          onEndRename={onEndRename}
          justClosed={closingFileId === file.id}
        />
      ))}
    </div>
  );
};

export default MediaGrid;
