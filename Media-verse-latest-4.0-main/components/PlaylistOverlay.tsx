
import React from 'react';
import { MediaFile } from '../types';
import AsyncImage from './AsyncImage';
import { PlayIcon, XIcon } from './icons';

interface PlaylistOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    playlist: MediaFile[];
    currentFileId: string;
    onPlayFile: (file: MediaFile) => void;
}

const PlaylistOverlay: React.FC<PlaylistOverlayProps> = ({ isOpen, onClose, playlist, currentFileId, onPlayFile }) => {
    return (
        <div 
            className={`absolute top-0 right-0 bottom-0 w-80 bg-black/90 backdrop-blur-md shadow-2xl border-l border-white/10 z-30 transition-transform duration-300 flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="flex items-center justify-between p-4 border-b border-white/10">
                <h3 className="text-white font-semibold">Next Up</h3>
                <button onClick={onClose} className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white">
                    <XIcon className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {playlist.map((file, index) => {
                    const isActive = file.id === currentFileId;
                    return (
                        <div 
                            key={file.id}
                            onClick={() => onPlayFile(file)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer group transition-colors ${isActive ? 'bg-primary/20 border border-primary/50' : 'hover:bg-white/5 border border-transparent'}`}
                        >
                            <div className="relative w-24 aspect-video bg-black rounded overflow-hidden flex-shrink-0">
                                <AsyncImage fileId={file.id} alt={file.title} className="w-full h-full object-cover" />
                                {isActive && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                        <PlayIcon className="w-6 h-6 text-white" />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isActive ? 'text-primary' : 'text-white'}`}>
                                    {file.title}
                                </p>
                                <p className="text-xs text-white/50 truncate">
                                    {new Date(file.metadata.duration ? file.metadata.duration * 1000 : 0).toISOString().substr(14, 5)}
                                </p>
                            </div>
                        </div>
                    );
                })}
                {playlist.length === 0 && (
                    <div className="text-center text-white/50 text-sm mt-10">
                        No videos in playlist
                    </div>
                )}
            </div>
        </div>
    );
};

export default PlaylistOverlay;
