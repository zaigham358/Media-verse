import React, { useState, useEffect, useRef } from 'react';
import { GridCellData } from '../../types';
import { getMediaFileSrc } from '../../db';
import { PlayIcon, PauseIcon, XIcon, VolumeIcon } from '../icons';

interface GridCellProps {
    cell: GridCellData;
    onRemove: () => void;
    isSyncActive: boolean;
    isGlobalPlaying: boolean;
    videoRefs: Map<string, HTMLVideoElement | null>;
    isUnmuted: boolean;
    onToggleSoloAudio: () => void;
    onDragStart: React.DragEventHandler<HTMLDivElement>;
    onDragOver: React.DragEventHandler<HTMLDivElement>;
    onDragLeave: React.DragEventHandler<HTMLDivElement>;
    onDrop: React.DragEventHandler<HTMLDivElement>;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const GridCell: React.FC<GridCellProps> = ({ cell, onRemove, isSyncActive, isGlobalPlaying, videoRefs, isUnmuted, onToggleSoloAudio, onDragStart, onDragOver, onDragLeave, onDrop }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [src, setSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        let isCancelled = false;
        const loadSrc = async () => {
            const blob = await getMediaFileSrc(cell.file.id);
            if (blob && !isCancelled) {
                const url = URL.createObjectURL(blob);
                setSrc(url);
            }
        };
        loadSrc();
        return () => {
            isCancelled = true;
            if (src) URL.revokeObjectURL(src);
        };
    }, [cell.file.id]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;

        videoRefs.set(cell.id, video);

        const handleTimeUpdate = () => setCurrentTime(video.currentTime);
        const handleDurationChange = () => setDuration(video.duration);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);

        video.addEventListener('timeupdate', handleTimeUpdate);
        video.addEventListener('durationchange', handleDurationChange);
        video.addEventListener('play', handlePlay);
        video.addEventListener('pause', handlePause);
        
        video.muted = !isUnmuted;

        return () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
            video.removeEventListener('durationchange', handleDurationChange);
            video.removeEventListener('play', handlePlay);
            video.removeEventListener('pause', handlePause);
            videoRefs.delete(cell.id);
        };
    }, [src, cell.id, videoRefs, isUnmuted]);
    
    useEffect(() => {
        const video = videoRef.current;
        if (video && isSyncActive) {
            isGlobalPlaying ? video.play().catch(console.error) : video.pause();
        }
    }, [isGlobalPlaying, isSyncActive]);

    const handlePlayPause = (e: React.MouseEvent) => {
        e.stopPropagation();
        const video = videoRef.current;
        if (video) {
            video.paused ? video.play().catch(console.error) : video.pause();
        }
    };

    const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
        const video = videoRef.current;
        if (video) {
            const rect = e.currentTarget.getBoundingClientRect();
            const pos = (e.clientX - rect.left) / rect.width;
            video.currentTime = pos * duration;
        }
    };

    return (
        <div 
            className={`relative bg-black group overflow-hidden border-2 transition-colors ${isUnmuted ? 'border-primary' : 'border-transparent'}`}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
        >
            {src && <video ref={videoRef} src={src} loop className="w-full h-full object-contain" />}
            
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                <div className="p-2 flex items-start justify-between pointer-events-auto">
                    <p className="text-xs text-white bg-black/50 px-2 py-1 rounded">{cell.file.title}</p>
                    <button onClick={onRemove} className="p-1 rounded-full bg-black/50 hover:bg-red-500 text-white">
                        <XIcon className="w-3.5 h-3.5" />
                    </button>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent pointer-events-auto">
                     <div onClick={handleSeek} className="relative w-full h-1 bg-white/30 cursor-pointer mb-2">
                        <div className="absolute bg-white h-full" style={{ width: `${(currentTime / duration) * 100}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            {!isSyncActive && (
                                <button onClick={handlePlayPause} className="text-white">
                                    {isPlaying ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                                </button>
                            )}
                             <button onClick={onToggleSoloAudio} className="text-white" title={isUnmuted ? "Mute" : "Solo Audio"}>
                                <VolumeIcon level={0.8} muted={!isUnmuted} className={`w-5 h-5 ${isUnmuted ? 'text-primary' : ''}`} />
                            </button>
                        </div>
                        <span className="text-xs text-white font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GridCell;