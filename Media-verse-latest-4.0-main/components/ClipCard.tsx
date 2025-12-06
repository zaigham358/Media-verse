import React from 'react';
import { MediaFile, FavPart } from '../types';
import { PlayIcon, TrashIcon } from './icons';
import AsyncImage from './AsyncImage';

interface ClipCardProps {
  clip: FavPart;
  parent: MediaFile;
  onPlay: (clip: FavPart) => void;
  onUpdate: (clip: FavPart) => void;
  onDelete: (id: string) => void;
  onContextMenu?: (event: React.MouseEvent) => void;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const getQualityInfo = (resolution: string | undefined): { label: string, color: string } | null => {
    if (!resolution) return null;
    const parts = resolution.split('x');
    if (parts.length !== 2) return null;
    const height = parseInt(parts[1], 10);
    if (isNaN(height)) return null;

    if (height >= 2160) return { label: '4K', color: 'bg-red-500' };
    if (height >= 1440) return { label: '2K', color: 'bg-orange-500' };
    if (height >= 1080) return { label: '1080p', color: 'bg-yellow-500' };
    if (height >= 720) return { label: '720p', color: 'bg-green-500' };
    if (height > 0) return { label: 'SD', color: 'bg-blue-500' };
    return null;
}

const ClipCard: React.FC<ClipCardProps> = ({ clip, parent, onPlay, onDelete, onContextMenu }) => {
    const duration = clip.endTime - clip.startTime;
    const qualityInfo = getQualityInfo(parent.metadata.resolution);
  
    return (
        <div 
            className="bg-card-bg rounded-lg overflow-hidden group transition-transform transform hover:-translate-y-1 relative"
            onContextMenu={onContextMenu}
        >
            <div className="relative aspect-video bg-black cursor-pointer" onClick={() => onPlay(clip)}>
                <AsyncImage 
                    fileId={parent.id} 
                    alt={clip.title} 
                    className="w-full h-full object-cover" 
                    fallback={<div className="w-full h-full flex items-center justify-center bg-gray-800" />}
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <PlayIcon className="w-12 h-12 text-white" />
                </div>
                <span className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{formatTime(duration)}</span>
                {qualityInfo && <span className={`absolute top-2 right-2 text-white text-xs font-bold px-2 py-0.5 rounded ${qualityInfo.color}`}>{qualityInfo.label}</span>}
            </div>
            <div className="p-3">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-semibold text-text-primary truncate">{clip.title}</p>
                        <p className="text-xs text-text-secondary truncate">From: {parent.title}</p>
                    </div>
                    <button 
                        onClick={() => onDelete(clip.id)} 
                        className="p-2 -mr-2 -mt-1 rounded-full text-text-secondary hover:bg-red-500/20 hover:text-red-500 flex-shrink-0"
                        title="Delete clip"
                    >
                        <TrashIcon className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default React.memo(ClipCard);