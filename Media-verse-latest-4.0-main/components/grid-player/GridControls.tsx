import React from 'react';
import { GridPlayerLayout } from '../../types';
import { PlayIcon, PauseIcon, RefreshCwIcon, SquareIcon, GridIcon, XSquareIcon } from '../icons';

interface GridControlsProps {
    onGlobalPlayPause: () => void;
    isGlobalPlaying: boolean;
    isSyncActive: boolean;
    onSyncToggle: () => void;
    layout: GridPlayerLayout;
    onLayoutChange: (layout: GridPlayerLayout) => void;
    onClearGrid: () => void;
}

const GridControls: React.FC<GridControlsProps> = ({ onGlobalPlayPause, isGlobalPlaying, isSyncActive, onSyncToggle, layout, onLayoutChange, onClearGrid }) => {
    return (
        <div className="flex-shrink-0 h-14 bg-sidebar-bg flex items-center justify-between px-4 border-b border-border-color">
            <div className="flex items-center space-x-4">
                <button 
                    onClick={onGlobalPlayPause} 
                    className="p-2 rounded-full text-white bg-primary hover:bg-opacity-90"
                    title={isGlobalPlaying ? "Pause All (Synced)" : "Play All (Synced)"}
                >
                    {isGlobalPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                </button>
                 <button 
                    onClick={onSyncToggle} 
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm ${isSyncActive ? 'bg-primary/20 text-primary' : 'bg-input-bg text-text-secondary'}`}
                    title={isSyncActive ? "Disable Sync" : "Enable Sync"}
                >
                    <RefreshCwIcon className={`w-4 h-4 ${isSyncActive && isGlobalPlaying ? 'animate-spin' : ''}`} />
                    <span>Sync Active</span>
                </button>
            </div>
            <div className="flex items-center space-x-2">
                <div className="text-xs text-text-secondary mr-2">Layout</div>
                <div className="bg-input-bg p-0.5 rounded-lg flex items-center">
                    <button onClick={() => onLayoutChange('1x1')} className={`h-8 w-8 flex items-center justify-center rounded-md ${layout === '1x1' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/10'}`} title="1x1 Layout"><SquareIcon className="w-4 h-4" /></button>
                    <button onClick={() => onLayoutChange('2x2')} className={`h-8 w-8 flex items-center justify-center rounded-md ${layout === '2x2' ? 'bg-primary text-white' : 'text-text-secondary hover:bg-white/10'}`} title="2x2 Layout"><GridIcon className="w-4 h-4" /></button>
                </div>
                 <button 
                    onClick={onClearGrid} 
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm bg-input-bg text-text-secondary hover:text-red-400"
                    title="Clear Grid"
                >
                    <XSquareIcon className="w-4 h-4" />
                    <span>Clear</span>
                </button>
            </div>
        </div>
    );
};

export default GridControls;