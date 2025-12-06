
import React, { useState, useRef, useEffect } from 'react';
import { FavPart, ABLoop } from '../types';

interface ScrubberProps {
    currentTime: number;
    duration: number;
    clip?: FavPart;
    isClipLinked: boolean;
    abLoop: ABLoop;
    onSeek: (time: number) => void;
    onSeekStart?: () => void;
    onSeekEnd?: () => void;
    bufferedTime: number;
    favParts: FavPart[];
    videoSrc?: string;
    bookmarks?: number[];
    ghostPosition?: number | null;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h>0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
};

const Scrubber: React.FC<ScrubberProps> = ({ currentTime, duration, clip, isClipLinked, abLoop, onSeek, onSeekStart, onSeekEnd, bufferedTime, favParts, videoSrc, bookmarks, ghostPosition }) => {
    const progressRef = useRef<HTMLDivElement>(null);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [hoverTime, setHoverTime] = useState<number | null>(null);
    const [hoverPosition, setHoverPosition] = useState(0);
    
    // Preview logic
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const previewCanvasRef = useRef<HTMLCanvasElement>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const seekTimeout = useRef<number | null>(null);

    // Determine the effective timeline being displayed
    const timelineStart = clip && isClipLinked ? clip.startTime : 0;
    const timelineEnd = clip && isClipLinked ? clip.endTime : duration;
    const timelineDuration = timelineEnd - timelineStart;

    const getPercent = (time: number) => {
        if (timelineDuration <= 0) return 0;
        const relativeTime = time - timelineStart;
        return (relativeTime / timelineDuration) * 100;
    };

    const progressPercent = getPercent(currentTime);
    const bufferedPercent = getPercent(bufferedTime);
    
    const handleScrub = (e: MouseEvent) => {
        if (progressRef.current && timelineDuration > 0) {
            const rect = progressRef.current.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const seekTime = timelineStart + pos * timelineDuration;
            onSeek(seekTime);
        }
    };
    
    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsScrubbing(true);
        onSeekStart?.();
        handleScrub(e.nativeEvent);
    };

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (progressRef.current) {
            const rect = progressRef.current.getBoundingClientRect();
            const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            setHoverPosition(pos * 100);
            const time = timelineStart + pos * timelineDuration;
            setHoverTime(time);
            
            // Visual Preview Generation
            if (videoSrc && previewVideoRef.current) {
                const video = previewVideoRef.current;
                
                // Debounce seek to prevent lag
                if (seekTimeout.current) clearTimeout(seekTimeout.current);
                
                seekTimeout.current = window.setTimeout(() => {
                    if(isFinite(time)) video.currentTime = time;
                }, 50); // 50ms delay
            }
        }
    };

    const handleMouseLeave = () => {
        setHoverTime(null);
        setPreviewImage(null);
    };

    // Capture frame when hidden video seeks
    const handlePreviewSeeked = () => {
        const video = previewVideoRef.current;
        const canvas = previewCanvasRef.current;
        if (video && canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                // Resize canvas to maintain aspect ratio, max width 160px
                const scale = 160 / video.videoWidth;
                canvas.width = 160;
                canvas.height = video.videoHeight * scale;
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                setPreviewImage(canvas.toDataURL());
            }
        }
    };


    useEffect(() => {
        const handleMouseUp = (e: MouseEvent) => {
            if (isScrubbing) {
                setIsScrubbing(false);
                onSeekEnd?.();
            }
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (isScrubbing) {
                handleScrub(e);
            }
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isScrubbing, onSeek, onSeekEnd, handleScrub]);


    return (
        <div 
            ref={progressRef} 
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className="relative w-full h-4 group cursor-pointer flex items-center"
        >
             {/* Hidden elements for preview generation */}
             <video 
                ref={previewVideoRef} 
                src={videoSrc} 
                className="hidden" 
                muted 
                crossOrigin="anonymous" 
                onSeeked={handlePreviewSeeked} 
                preload="auto"
            />
             <canvas ref={previewCanvasRef} className="hidden" />

             {hoverTime !== null && (
                <div 
                    className="absolute bottom-full mb-3 bg-black/90 text-white text-xs rounded border border-white/20 pointer-events-none transition-opacity z-10 flex flex-col items-center shadow-lg"
                    style={{ left: `${hoverPosition}%`, transform: 'translateX(-50%)' }}
                >
                    {previewImage && (
                        <div className="p-1 pb-0">
                            <img src={previewImage} alt="Preview" className="rounded-sm block" />
                        </div>
                    )}
                    <div className="px-2 py-1 font-mono">{formatTime(hoverTime)}</div>
                </div>
            )}
            <div className="relative w-full bg-[rgb(var(--player-scrubber-bg))] group-hover:scale-y-150 transition-transform" style={{ height: 'var(--player-scrubber-thickness)', borderRadius: 'var(--player-scrubber-radius)' }}>
                {/* Layer 1: Unlinked Clip Range */}
                {clip && !isClipLinked && (
                    <div 
                        className="absolute top-0 h-full bg-white/20"
                        style={{ left: `${(clip.startTime / duration) * 100}%`, width: `${((clip.endTime - clip.startTime) / duration) * 100}%`, borderRadius: 'var(--player-scrubber-radius)' }}
                    />
                )}

                {/* Layer 2: Buffered Progress */}
                <div 
                    className="absolute top-0 left-0 h-full bg-white/30"
                    style={{ width: `${bufferedPercent}%`, borderRadius: 'var(--player-scrubber-radius)' }}
                />
                
                {/* Layer 3: A/B Loop Range */}
                {abLoop.active && abLoop.start !== null && abLoop.end !== null && (
                     <div 
                        className="absolute top-0 h-full bg-[rgb(var(--player-accent))] opacity-40 ring-1 ring-[rgb(var(--player-accent))]"
                        style={{ left: `${getPercent(abLoop.start)}%`, width: `${getPercent(abLoop.end) - getPercent(abLoop.start)}%`, borderRadius: 'var(--player-scrubber-radius)'}}
                    />
                )}
                
                {/* Layer 4: Playback Progress */}
                <div 
                    className="absolute top-0 left-0 h-full bg-[rgb(var(--player-accent))]"
                    style={{ width: `${progressPercent}%`, borderRadius: 'var(--player-scrubber-radius)'}}
                >
                    {/* Seek Handle */}
                    <div 
                        className="absolute right-0 top-1/2 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        style={{ transform: 'translateX(50%) translateY(-50%)' }}
                    />
                </div>

                {/* Layer 4.5: Ghost Handle (Previous Position) */}
                {ghostPosition !== undefined && ghostPosition !== null && isScrubbing && (
                    <div 
                        className="absolute top-1/2 w-3 h-3 bg-white/50 rounded-full shadow-md border border-white/20 pointer-events-none"
                        style={{ left: `${getPercent(ghostPosition)}%`, transform: 'translateX(-50%) translateY(-50%)' }}
                    />
                )}

                {/* Layer 5: Favorite Clip Markers */}
                {favParts.map(part => {
                    const partPercent = getPercent(part.startTime);
                    if (partPercent < 0 || partPercent > 100) return null;
                    
                    return (
                        <div
                            key={part.id}
                            className="absolute -top-0.5 h-3 w-1 bg-yellow-400 opacity-80 rounded-full transition-transform group-hover:scale-y-150"
                            style={{ left: `${partPercent}%`, transform: 'translateX(-50%)' }}
                            title={`${part.title} (${formatTime(part.startTime)})`}
                        />
                    );
                })}

                {/* Layer 6: Bookmarks */}
                {bookmarks?.map((time, i) => {
                    const percent = getPercent(time);
                    if (percent < 0 || percent > 100) return null;
                    return (
                        <div 
                            key={i}
                            className="absolute -top-1 h-4 w-1 bg-blue-400 opacity-90 rounded-full z-10 hover:scale-125 transition-transform"
                            style={{ left: `${percent}%`, transform: 'translateX(-50%)' }}
                            title={`Bookmark ${i + 1}: ${formatTime(time)}`}
                        />
                    )
                })}
            </div>
        </div>
    );
};

export default Scrubber;
