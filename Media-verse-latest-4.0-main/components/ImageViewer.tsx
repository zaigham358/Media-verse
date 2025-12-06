
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MediaFile, UseMediaStateReturn } from '../types';
import { 
    XIcon, ZoomInIcon, ZoomOutIcon, RotateCwIcon, FlipHorizontalIcon, 
    FlipVerticalIcon, InfoIcon, SlideshowIcon, ChevronLeftIcon, ChevronRightIcon,
    PlayIcon, PauseIcon, TrashIcon, HeartIcon, PaletteIcon, CropRotateIcon,
    MaximizeIcon
} from './icons';
import { getMediaFileThumbnail, updateMediaFileMeta } from '../db';
import AsyncImage from './AsyncImage';

interface ImageViewerProps {
  src: string;
  file: MediaFile;
  onClose: () => void;
  mediaState: UseMediaStateReturn; // Needed for navigation and updates
}

const ImageViewer: React.FC<ImageViewerProps> = ({ src, file, onClose, mediaState }) => {
    // --- State ---
    // Visual State
    const [scale, setScale] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const [flip, setFlip] = useState({ h: false, v: false });
    
    // UI State
    const [showControls, setShowControls] = useState(true);
    const [showInfoPanel, setShowInfoPanel] = useState(false);
    const [showThumbnailStrip, setShowThumbnailStrip] = useState(true);
    const [isSlideshow, setIsSlideshow] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    
    // Data State
    const [currentFile, setCurrentFile] = useState(file);
    const [currentSrc, setCurrentSrc] = useState(src);
    const [sortedFiles, setSortedFiles] = useState<MediaFile[]>([]);
    const [colorSample, setColorSample] = useState<string | null>(null);
    const [isPickingColor, setIsPickingColor] = useState(false);

    // Refs
    const containerRef = useRef<HTMLDivElement>(null);
    const imgRef = useRef<HTMLImageElement>(null);
    const dragStartRef = useRef<{ x: number, y: number } | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null); // For color picking/export
    const slideshowTimerRef = useRef<number | null>(null);
    const controlsTimerRef = useRef<number | null>(null);

    // --- Initialization ---
    
    useEffect(() => {
        // Filter only images from the global state
        const images = mediaState.mediaFiles.filter(f => f.type === 'image');
        setSortedFiles(images);
    }, [mediaState.mediaFiles]);

    useEffect(() => {
        setCurrentFile(file);
        setCurrentSrc(src);
        resetView();
    }, [file, src]);

    const resetView = () => {
        setScale(1);
        setPosition({ x: 0, y: 0 });
        setRotation(0);
        setFlip({ h: false, v: false });
    };

    // --- Navigation Logic ---

    const navigate = useCallback((direction: 'next' | 'prev') => {
        if (sortedFiles.length <= 1) return;
        const currentIndex = sortedFiles.findIndex(f => f.id === currentFile.id);
        if (currentIndex === -1) return;

        let nextIndex;
        if (direction === 'next') {
            nextIndex = (currentIndex + 1) % sortedFiles.length;
        } else {
            nextIndex = (currentIndex - 1 + sortedFiles.length) % sortedFiles.length;
        }

        const nextFile = sortedFiles[nextIndex];
        // We need to trigger the parent's update mechanism usually, but since we are in a modal
        // we can update local state and fetch the src. 
        // ideally, the parent should control the "viewingState", but for a rich viewer 
        // it's often better to handle navigation internally then sync back.
        
        // However, to keep it simple with existing App.tsx structure, 
        // let's assume we fetch the blob url here or request parent to change.
        // For a seamless experience without remounting the viewer, we update internal state
        // and fetch the blob.
        
        setCurrentFile(nextFile);
        resetView();
        
        getMediaFileThumbnail(nextFile.id).then(blob => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                setCurrentSrc(prev => {
                    URL.revokeObjectURL(prev); // Cleanup old
                    return url;
                });
            }
        });

    }, [sortedFiles, currentFile]);

    // --- Zoom & Pan Logic ---

    const handleWheel = (e: React.WheelEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        const delta = e.deltaY * -0.001;
        const newScale = Math.min(Math.max(0.1, scale + delta), 20);
        
        // Zoom towards mouse pointer logic could go here, for now center zoom
        setScale(newScale);
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        if (e.button !== 0) return; // Only left click
        if (isPickingColor) {
            pickColor(e.nativeEvent);
            setIsPickingColor(false);
            return;
        }
        dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
        containerRef.current!.style.cursor = 'grabbing';
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (showControls) resetControlsTimer();
        
        if (dragStartRef.current) {
            e.preventDefault();
            setPosition({
                x: e.clientX - dragStartRef.current.x,
                y: e.clientY - dragStartRef.current.y
            });
        }
    };

    const handleMouseUp = () => {
        dragStartRef.current = null;
        if (containerRef.current) containerRef.current.style.cursor = isPickingColor ? 'crosshair' : 'default';
    };

    // --- Slideshow Logic ---

    useEffect(() => {
        if (isSlideshow) {
            slideshowTimerRef.current = window.setInterval(() => navigate('next'), 3000);
        } else if (slideshowTimerRef.current) {
            clearInterval(slideshowTimerRef.current);
        }
        return () => { if (slideshowTimerRef.current) clearInterval(slideshowTimerRef.current); };
    }, [isSlideshow, navigate]);

    const toggleSlideshow = () => setIsSlideshow(!isSlideshow);

    // --- Controls Visibility ---

    const resetControlsTimer = () => {
        setShowControls(true);
        if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
        controlsTimerRef.current = window.setTimeout(() => {
            if (!showInfoPanel && !isPickingColor) setShowControls(false);
        }, 3000);
    };

    useEffect(() => {
        resetControlsTimer();
        return () => { if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current); };
    }, []);

    // --- Tools ---

    const rotateLeft = () => setRotation(r => r - 90);
    const rotateRight = () => setRotation(r => r + 90);
    const toggleFlipH = () => setFlip(f => ({ ...f, h: !f.h }));
    const toggleFlipV = () => setFlip(f => ({ ...f, v: !f.v }));
    
    const pickColor = (e: MouseEvent) => {
        if (!imgRef.current || !canvasRef.current) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw image to invisible canvas to read pixel
        canvas.width = imgRef.current.naturalWidth;
        canvas.height = imgRef.current.naturalHeight;
        ctx.drawImage(imgRef.current, 0, 0);

        // Calculate click position relative to image
        const rect = imgRef.current.getBoundingClientRect();
        
        // Simple approximation considering centered image
        // For precise pixel picking with CSS transforms involved, we need matrix math.
        // Simplified approach: rely on visual approximation or reset view for picking.
        // For this demo, we'll suggest resetting view for accurate picking or use a simpler method.
        
        // Let's just grab the center for demonstration if transforms are complex,
        // or disable transforms during picking mode.
        // ACTUALLY: Let's use the EyeDropper API if available, else fallback.
        
        if ('EyeDropper' in window) {
            // @ts-ignore
            new EyeDropper().open().then(result => setColorSample(result.sRGBHex)).catch(() => {});
        } else {
            alert("Your browser doesn't support the EyeDropper API.");
        }
    };

    const deleteFile = async () => {
        if (confirm("Delete this image?")) {
            await mediaState.deleteMediaFile(currentFile.id);
            navigate('next'); // Logic needs to handle if list becomes empty
        }
    };

    const toggleFavorite = async () => {
        await mediaState.updateMediaFile({ ...currentFile, isFavorite: !currentFile.isFavorite });
        setCurrentFile(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
    };

    // --- Keyboard Shortcuts ---

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            switch (e.key) {
                case 'ArrowRight': navigate('next'); break;
                case 'ArrowLeft': navigate('prev'); break;
                case 'ArrowUp': setScale(s => s + 0.1); break;
                case 'ArrowDown': setScale(s => s - 0.1); break;
                case 'Escape': onClose(); break;
                case 'f': setIsFullscreen(!isFullscreen); break;
                case ' ': toggleSlideshow(); break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [navigate, isFullscreen, isSlideshow]);

    // --- Styles ---

    const transformStyle = {
        transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg) scaleX(${flip.h ? -1 : 1}) scaleY(${flip.v ? -1 : 1})`,
        transition: dragStartRef.current ? 'none' : 'transform 0.1s ease-out',
        cursor: isPickingColor ? 'crosshair' : (scale > 1 ? 'grab' : 'default')
    };

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div 
            ref={containerRef}
            className="fixed inset-0 z-50 bg-[#1e1e1e] flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
        >
            {/* Hidden Canvas for operations */}
            <canvas ref={canvasRef} className="hidden" />

            {/* --- Main Image Area --- */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
                {/* Background Checkerboard for transparency */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" 
                     style={{ backgroundImage: 'linear-gradient(45deg, #333 25%, transparent 25%), linear-gradient(-45deg, #333 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #333 75%), linear-gradient(-45deg, transparent 75%, #333 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px' }} 
                />
                
                <img 
                    ref={imgRef}
                    src={currentSrc} 
                    alt={currentFile.title} 
                    className="max-w-none max-h-none origin-center shadow-2xl pointer-events-auto"
                    style={transformStyle}
                    draggable={false}
                />
            </div>

            {/* --- Top Header (Title & Meta) --- */}
            <div className={`absolute top-0 left-0 right-0 h-14 bg-black/60 backdrop-blur-md flex items-center justify-between px-4 transition-transform duration-300 ${showControls ? 'translate-y-0' : '-translate-y-full'}`}>
                <div className="flex items-center space-x-4 overflow-hidden">
                    <div className="text-white truncate">
                        <h1 className="font-bold text-sm md:text-base">{currentFile.title}</h1>
                        <div className="text-xs text-gray-300 flex space-x-3">
                            <span>{currentFile.metadata.resolution || 'Unknown Size'}</span>
                            <span>{formatFileSize(currentFile.metadata.size)}</span>
                            <span>{new Date(currentFile.createdAt).toLocaleDateString()}</span>
                            <span>{(scale * 100).toFixed(0)}%</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button onClick={toggleFavorite} className={`p-2 rounded-full hover:bg-white/10 ${currentFile.isFavorite ? 'text-red-500' : 'text-gray-300'}`} title="Favorite">
                        <HeartIcon className={`w-5 h-5 ${currentFile.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <button onClick={() => setShowInfoPanel(!showInfoPanel)} className={`p-2 rounded-full hover:bg-white/10 ${showInfoPanel ? 'bg-white/20 text-white' : 'text-gray-300'}`} title="Info">
                        <InfoIcon className="w-5 h-5" />
                    </button>
                    <div className="w-px h-6 bg-white/20 mx-2" />
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 text-gray-300 transition-colors" title="Close (Esc)">
                        <XIcon className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* --- Navigation Arrows --- */}
            <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronLeftIcon className="w-8 h-8" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-black/30 hover:bg-black/60 text-white backdrop-blur-sm transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <ChevronRightIcon className="w-8 h-8" />
            </button>

            {/* --- Bottom Toolbar (Floating) --- */}
            <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md rounded-full px-4 py-2 flex items-center space-x-4 shadow-2xl border border-white/10 transition-all duration-300 ${showControls ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}>
                <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="p-2 rounded-full hover:bg-white/20 text-white"><ChevronLeftIcon className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleSlideshow(); }} className={`p-2 rounded-full hover:bg-white/20 ${isSlideshow ? 'text-primary' : 'text-white'}`}>
                        {isSlideshow ? <PauseIcon className="w-5 h-5" /> : <PlayIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="p-2 rounded-full hover:bg-white/20 text-white"><ChevronRightIcon className="w-5 h-5" /></button>
                </div>
                
                <div className="w-px h-6 bg-white/20" />
                
                <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); setScale(s => s - 0.1); }} className="p-2 rounded-full hover:bg-white/20 text-white"><ZoomOutIcon className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setScale(1); setPosition({x:0,y:0}); }} className="px-2 text-sm font-mono text-white hover:text-primary w-12 text-center">{(scale * 100).toFixed(0)}%</button>
                    <button onClick={(e) => { e.stopPropagation(); setScale(s => s + 0.1); }} className="p-2 rounded-full hover:bg-white/20 text-white"><ZoomInIcon className="w-5 h-5" /></button>
                </div>

                <div className="w-px h-6 bg-white/20" />

                <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); rotateLeft(); }} className="p-2 rounded-full hover:bg-white/20 text-white" title="Rotate Left"><RotateCwIcon className="w-5 h-5 transform -scale-x-100" /></button>
                    <button onClick={(e) => { e.stopPropagation(); rotateRight(); }} className="p-2 rounded-full hover:bg-white/20 text-white" title="Rotate Right"><RotateCwIcon className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleFlipH(); }} className="p-2 rounded-full hover:bg-white/20 text-white" title="Flip Horizontal"><FlipHorizontalIcon className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); toggleFlipV(); }} className="p-2 rounded-full hover:bg-white/20 text-white" title="Flip Vertical"><FlipVerticalIcon className="w-5 h-5" /></button>
                </div>

                <div className="w-px h-6 bg-white/20" />

                <div className="flex space-x-1">
                    <button onClick={(e) => { e.stopPropagation(); setIsPickingColor(true); }} className={`p-2 rounded-full hover:bg-white/20 ${isPickingColor ? 'text-primary bg-white/20' : 'text-white'}`} title="Color Picker"><PaletteIcon className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); /* Mock Resize */ alert("Resize tool would open here"); }} className="p-2 rounded-full hover:bg-white/20 text-white" title="Resize / Crop"><CropRotateIcon className="w-5 h-5" /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteFile(); }} className="p-2 rounded-full hover:bg-red-500/20 hover:text-red-500 text-white" title="Delete"><TrashIcon className="w-5 h-5" /></button>
                </div>
            </div>

            {/* --- Info Panel (Right Sidebar) --- */}
            <div className={`absolute top-14 right-0 bottom-20 w-80 bg-card-bg/95 backdrop-blur-xl border-l border-white/10 shadow-2xl p-4 transition-transform duration-300 flex flex-col overflow-y-auto ${showInfoPanel ? 'translate-x-0' : 'translate-x-full'}`} onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold text-white mb-4">Metadata</h3>
                
                <div className="space-y-4">
                    {/* Mock Histogram */}
                    <div className="bg-black/40 rounded p-2 border border-white/5">
                        <div className="text-xs text-gray-400 mb-1">Histogram (RGB)</div>
                        <div className="h-24 flex items-end space-x-0.5 opacity-80">
                            {Array.from({ length: 40 }).map((_, i) => (
                                <div key={i} className="flex-1 bg-gradient-to-t from-gray-500 to-transparent" style={{ height: `${Math.random() * 100}%` }}></div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <InfoRow label="Filename" value={currentFile.title} />
                        <InfoRow label="Format" value={currentSrc?.split('.').pop()?.toUpperCase() || 'Unknown'} />
                        <InfoRow label="Resolution" value={currentFile.metadata.resolution} />
                        <InfoRow label="Size" value={formatFileSize(currentFile.metadata.size)} />
                        <InfoRow label="Date Modified" value={new Date(currentFile.createdAt).toLocaleString()} />
                        
                        <div className="h-px bg-white/10 my-2" />
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">EXIF Data (Mock)</h4>
                        <InfoRow label="Camera" value="Canon EOS R5" />
                        <InfoRow label="ISO" value="100" />
                        <InfoRow label="Aperture" value="f/2.8" />
                        <InfoRow label="Exposure" value="1/200s" />
                        <InfoRow label="Focal Length" value="50mm" />
                    </div>

                    {colorSample && (
                        <div className="mt-4 p-3 bg-black/40 rounded flex items-center justify-between">
                            <span className="text-sm text-gray-300">Picked Color</span>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs font-mono text-white select-all">{colorSample}</span>
                                <div className="w-6 h-6 rounded border border-white/20 shadow-inner" style={{ backgroundColor: colorSample }} />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* --- Thumbnail Strip (Bottom) --- */}
            {showThumbnailStrip && (
                <div className={`absolute bottom-0 left-0 right-0 h-20 bg-black/80 backdrop-blur-md border-t border-white/10 flex items-center px-4 space-x-2 overflow-x-auto transition-transform duration-300 ${showControls ? 'translate-y-0' : 'translate-y-full'}`} onClick={e => e.stopPropagation()}>
                    {sortedFiles.map((f, i) => (
                        <div 
                            key={f.id} 
                            onClick={() => { setCurrentFile(f); resetView(); getMediaFileThumbnail(f.id).then(b => b && setCurrentSrc(URL.createObjectURL(b))); }}
                            className={`flex-shrink-0 h-14 aspect-square rounded overflow-hidden cursor-pointer border-2 transition-all ${currentFile.id === f.id ? 'border-primary scale-105' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                            <AsyncImage fileId={f.id} alt={f.title} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ label: string, value: string | number | undefined }> = ({ label, value }) => (
    <div className="flex justify-between items-start">
        <span className="text-gray-400">{label}</span>
        <span className="text-white text-right select-all">{value || '-'}</span>
    </div>
);

export default ImageViewer;
