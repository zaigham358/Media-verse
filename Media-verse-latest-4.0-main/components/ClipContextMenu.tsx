import React from 'react';
import { FavPart, MediaFile } from '../types';
import { UploadIcon, PlayIcon, TrashIcon } from './icons';

interface ClipContextMenuProps {
  x: number;
  y: number;
  clip: FavPart;
  parent: MediaFile;
  onClose: () => void;
  onExport: () => void;
}

const ClipContextMenu: React.FC<ClipContextMenuProps> = ({ x, y, clip, parent, onClose, onExport }) => {
    
    const handleAction = (action: () => void) => {
        action();
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
            <div className="absolute bg-card-bg rounded-lg shadow-2xl border border-border-color p-2 w-56 text-sm" style={{ top: y, left: x }}>
                <div className="px-2 py-1 font-semibold text-text-primary truncate">{clip.title}</div>
                <div className="h-px bg-border-color my-1" />

                <button onClick={() => handleAction(onExport)} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <UploadIcon className="w-4 h-4" />
                    <span>Export Clip...</span>
                </button>

                {/* Add other actions like Play, Delete, etc. if needed */}
            </div>
        </div>
    );
};

export default ClipContextMenu;
