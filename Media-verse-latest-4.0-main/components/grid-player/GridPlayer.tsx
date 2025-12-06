import React, { useState, useRef, useCallback } from 'react';
import { UseMediaStateReturn, Tab, GridCellData, MediaFile, GridPlayerLayout } from '../../types';
import GridControls from './GridControls';
import GridCell from './GridCell';
import { LayoutGridIcon } from '../icons';

interface GridPlayerProps {
    mediaState: UseMediaStateReturn;
    activeTab: Tab;
    updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
}

const GridPlayer: React.FC<GridPlayerProps> = ({ mediaState, activeTab, updateActiveTab }) => {
    const { settings } = mediaState;
    const gridState = activeTab.gridPlayerState;

    const [globalPlay, setGlobalPlay] = useState(false);
    const videoRefs = useRef<Map<string, HTMLVideoElement | null>>(new Map());
    const [draggedItemId, setDraggedItemId] = useState<string | null>(null);

    const handleGlobalPlayPause = () => {
        const newPlayState = !globalPlay;
        setGlobalPlay(newPlayState);

        if (gridState?.isSyncActive) {
            videoRefs.current.forEach(videoEl => {
                if (videoEl) {
                    newPlayState ? videoEl.play().catch(console.error) : videoEl.pause();
                }
            });
        }
    };
    
    const updateGridState = (updates: Partial<Tab['gridPlayerState']>) => {
        updateActiveTab({ gridPlayerState: { ...activeTab.gridPlayerState!, ...updates } });
    };

    const removeCell = (cellId: string) => {
        if (!gridState) return;
        const newCells = gridState.cells.filter(c => c.id !== cellId);
        let newSoloId = gridState.soloAudioCellId;
        if (gridState.soloAudioCellId === cellId) {
            newSoloId = newCells.length > 0 ? newCells[0].id : null;
        }
        updateGridState({ cells: newCells, soloAudioCellId: newSoloId });
    };

    const clearGrid = () => updateGridState({ cells: [], soloAudioCellId: null });
    
    // Drag and Drop Handlers
    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, cellId: string) => {
        setDraggedItemId(cellId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.currentTarget.classList.add('bg-primary/20');
    };
    
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.currentTarget.classList.remove('bg-primary/20');
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetCell: GridCellData) => {
        e.preventDefault();
        e.currentTarget.classList.remove('bg-primary/20');
        if (!draggedItemId || draggedItemId === targetCell.id || !gridState) return;

        const reordered = [...gridState.cells];
        const draggedIndex = reordered.findIndex(c => c.id === draggedItemId);
        const targetIndex = reordered.findIndex(c => c.id === targetCell.id);

        const [draggedItem] = reordered.splice(draggedIndex, 1);
        reordered.splice(targetIndex, 0, draggedItem);
        
        updateGridState({ cells: reordered });
        setDraggedItemId(null);
    };

    const getLayoutClasses = (layout: GridPlayerLayout, count: number) => {
        if (count === 0) return '';
        if (count === 1 || layout === '1x1') return 'grid grid-cols-1 grid-rows-1';
        return 'grid grid-cols-2 grid-rows-2';
    };
    
    const gridLayoutClasses = getLayoutClasses(gridState?.layout ?? '2x2', gridState?.cells.length ?? 0) + ' gap-1 w-full h-full';
    
    return (
        <div className="h-full flex flex-col bg-black">
            <GridControls 
                onGlobalPlayPause={handleGlobalPlayPause}
                isGlobalPlaying={globalPlay}
                isSyncActive={gridState?.isSyncActive ?? true}
                onSyncToggle={() => updateGridState({ isSyncActive: !gridState?.isSyncActive })}
                layout={gridState?.layout ?? '2x2'}
                onLayoutChange={(l) => updateGridState({ layout: l })}
                onClearGrid={clearGrid}
            />
            <div className="flex-1 p-1">
                {(!gridState || gridState.cells.length === 0) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center text-text-secondary border-2 border-dashed border-border-color rounded-lg">
                        <LayoutGridIcon className="w-16 h-16 mb-4" />
                        <h2 className="text-lg font-semibold text-text-primary">Grid Player is Empty</h2>
                        <p>Right-click a video in your library and select "Add to Grid Player" to begin.</p>
                    </div>
                ) : (
                    <div className={gridLayoutClasses}>
                        {gridState.cells.map(cell => (
                            <GridCell
                                key={cell.id}
                                cell={cell}
                                onRemove={() => removeCell(cell.id)}
                                isSyncActive={gridState.isSyncActive}
                                isGlobalPlaying={globalPlay}
                                videoRefs={videoRefs.current}
                                isUnmuted={gridState.soloAudioCellId === cell.id}
                                onToggleSoloAudio={() => updateGridState({ soloAudioCellId: gridState.soloAudioCellId === cell.id ? null : cell.id })}
                                onDragStart={(e) => handleDragStart(e, cell.id)}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={(e) => handleDrop(e, cell)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default GridPlayer;