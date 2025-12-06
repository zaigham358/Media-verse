
import React, { useMemo, useState } from 'react';
import { UseMediaStateReturn, Tab, MediaFile } from '../types';
import MediaGrid from './MediaGrid';

interface FavoritesProps {
    mediaState: UseMediaStateReturn;
    activeTab: Tab;
    updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
    onContextMenu: (event: React.MouseEvent, file: MediaFile) => void;
    closingFileId: string | null;
}

const Favorites: React.FC<FavoritesProps> = ({ mediaState, activeTab, updateActiveTab, onContextMenu, closingFileId }) => {
    const { mediaFiles, settings, updateMediaFile } = mediaState;
    const [focusedFileId, setFocusedFileId] = useState<string | null>(null);

    const favoriteFiles = useMemo(() => {
        return mediaFiles.filter(file => file.isFavorite);
    }, [mediaFiles]);
    
    if (!settings) return null;

    return (
        <div className="h-full flex flex-col">
            <div className="flex-shrink-0 px-6 py-4 border-b border-border-color">
                <h1 className="text-xl font-bold font-display text-text-primary">
                    Favorites <span className="text-sm font-sans text-text-secondary ml-2">{favoriteFiles.length} items</span>
                </h1>
            </div>
            <div className="flex-1 overflow-y-auto relative">
                <MediaGrid 
                    files={favoriteFiles} 
                    onFileClick={(file) => updateActiveTab({ viewingState: { file } })} 
                    settings={settings} 
                    onUpdateFile={updateMediaFile}
                    selectedFileIds={[]}
                    onSelectFile={() => {}}
                    focusedFileId={focusedFileId}
                    setFocusedFileId={setFocusedFileId}
                    viewMode="grid"
                    onContextMenu={onContextMenu}
                    renamingFileId={activeTab.renamingFileId}
                    onStartRename={(id) => updateActiveTab({ renamingFileId: id })}
                    onEndRename={() => updateActiveTab({ renamingFileId: null })}
                    closingFileId={closingFileId}
                />
            </div>
        </div>
    );
}

export default Favorites;
