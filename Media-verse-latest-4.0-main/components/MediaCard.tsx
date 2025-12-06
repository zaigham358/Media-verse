
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MediaFile, AppSettings, ViewMode } from '../types';
import { VideoIcon, ImageIcon, AudioIcon, StarIcon, CalendarIcon, DatabaseIcon, MaximizeIcon, HeartIcon, CheckIcon, FastForwardIcon } from './icons';
import AsyncImage from './AsyncImage';
import { useClick } from '../hooks/useClick';
import HoverPreview from './HoverPreview';

interface MediaCardProps {
  file: MediaFile;
  onClick: (e: React.MouseEvent) => void;
  onDoubleClick: (e: React.MouseEvent) => void;
  settings: AppSettings;
  onUpdateFile: (file: MediaFile) => void;
  isSelected: boolean;
  isFocused: boolean;
  onSelectFile: (e: React.MouseEvent) => void;
  onHoverSelect?: () => void;
  viewMode: ViewMode;
  onContextMenu: (event: React.MouseEvent) => void;
  isRenaming: boolean;
  onStartRename: (id: string) => void;
  onEndRename: () => void;
  justClosed?: boolean;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric'
    });
};

const getQualityInfo = (resolution: string | undefined): { label: string, color: string } | null => {
    if (!resolution) return null;
    const parts = resolution.split('x');
    if (parts.length !== 2) return null;
    const height = parseInt(parts[1], 10);
    if (isNaN(height)) return null;

    if (height >= 2160) return { label: '4K', color: 'bg-red-500/80 backdrop-blur-md' };
    if (height >= 1440) return { label: '2K', color: 'bg-orange-500/80 backdrop-blur-md' };
    if (height >= 1080) return { label: '1080p', color: 'bg-yellow-500/80 backdrop-blur-md' };
    if (height >= 720) return { label: '720p', color: 'bg-green-500/80 backdrop-blur-md' };
    if (height > 0) return { label: 'SD', color: 'bg-blue-500/80 backdrop-blur-md' };
    return null;
}

const colorTagClasses: Record<string, string> = {
    red: 'bg-red-500',
    yellow: 'bg-yellow-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
};

const MediaCard: React.FC<MediaCardProps> = ({ file, onClick, onDoubleClick, settings, onUpdateFile, isSelected, isFocused, onSelectFile, onHoverSelect, viewMode, onContextMenu, isRenaming, onStartRename, onEndRename, justClosed }) => {
  const [hoveredStar, setHoveredStar] = useState(0);
  const [renameValue, setRenameValue] = useState(file.title);
  const renameInputRef = useRef<HTMLInputElement>(null);
  const [showPreview, setShowPreview] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const hoverTimer = useRef<number | null>(null);

  const clickHandler = useClick({ onClick, onDoubleClick, delay: 250 });

  useEffect(() => {
    if (isRenaming) {
      setRenameValue(file.title);
      setTimeout(() => renameInputRef.current?.select(), 0);
    }
  }, [isRenaming, file.title]);
  
  // Scroll to view when just closed
  useEffect(() => {
      if (justClosed && cardRef.current) {
          cardRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
  }, [justClosed]);

  const handleMouseEnter = () => {
      setShowPreview(true);
      if (settings.hoverSelectDelay > 0 && !isSelected && onHoverSelect) {
          hoverTimer.current = window.setTimeout(() => {
              onHoverSelect();
          }, settings.hoverSelectDelay);
      }
  };

  const handleMouseLeave = () => {
      setShowPreview(false);
      if (hoverTimer.current) {
          clearTimeout(hoverTimer.current);
          hoverTimer.current = null;
      }
  };

  const handleRatingChange = (rating: number) => {
    onUpdateFile({ ...file, rating: file.rating === rating ? 0 : rating });
  };
  
  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue.trim() !== file.title) {
        onUpdateFile({ ...file, title: renameValue.trim() });
    }
    onEndRename();
  };
  
  const handleRenameKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
        handleRenameSubmit();
    } else if (e.key === 'Escape') {
        onEndRename();
    }
  };

  const getIcon = () => {
    switch (file.type) {
      case 'video': return <VideoIcon className="w-12 h-12 text-white/50" />;
      case 'image': return <ImageIcon className="w-12 h-12 text-white/50" />;
      case 'audio': return <AudioIcon className="w-12 h-12 text-white/50" />;
      default: return null;
    }
  };
  
  const qualityInfo = file.type === 'video' ? getQualityInfo(file.metadata?.resolution) : null;
  const objectFitClass = settings.thumbnailFit === 'contain' ? 'object-contain' : 'object-cover';

  const handleDragStart = (e: React.DragEvent) => {
    const dragData = {
        selectedIds: isSelected ? [...(document.querySelector(`[data-file-id="${file.id}"]`)?.parentElement?.querySelectorAll("[data-is-selected='true']") || [])].map(el => (el as HTMLElement).dataset.fileId) : [file.id]
    };
    e.dataTransfer.setData('application/json', JSON.stringify(dragData));
    e.dataTransfer.effectAllowed = 'move';
  }

  // Enhanced animation class for feedback pop
  const animationClass = justClosed ? 'animate-feedback-pop z-20 ring-4 ring-primary border-primary shadow-2xl scale-105' : '';
  const selectionClass = isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-card-bg' : 'ring-1 ring-transparent hover:ring-border-color';

  if (viewMode === 'list') {
      return (
          <div ref={cardRef} data-file-id={file.id} onClick={clickHandler} onContextMenu={onContextMenu} draggable onDragStart={handleDragStart} className={`media-card flex items-center space-x-4 p-2 rounded-lg cursor-pointer relative ${isSelected ? 'bg-primary/20' : 'hover:bg-card-bg'} ${animationClass} transition-all duration-200`} data-is-selected={isSelected} data-is-focused={isFocused}>
              <div className="card-focus-ring absolute inset-0 rounded-lg pointer-events-none" />
              <div className={`w-5 h-5 flex-shrink-0 flex items-center justify-center rounded border ${isSelected ? 'bg-primary border-primary' : 'border-border-color bg-input-bg'} text-white transition-colors`} onClick={e => { e.stopPropagation(); onSelectFile(e); }}>
                  {isSelected && <CheckIcon className="w-3 h-3" />}
              </div>
              <div className="w-16 h-10 flex-shrink-0 bg-black rounded overflow-hidden relative border border-border-color/50">
                <AsyncImage 
                    fileId={file.id} 
                    alt={file.title} 
                    className={`w-full h-full ${objectFitClass}`} 
                    fallback={<div className="w-full h-full flex items-center justify-center bg-gray-800">{file.type === 'audio' ? <AudioIcon className="w-5 h-5 text-white/50"/> : <VideoIcon className="w-5 h-5 text-white/50"/>}</div>}
                />
                {file.isFavorite && <HeartIcon className="absolute top-0.5 left-0.5 w-3 h-3 text-red-500 fill-current drop-shadow-sm" />}
              </div>
              <div className="flex items-center space-x-2 flex-1 truncate">
                {file.colorTag && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colorTagClasses[file.colorTag]}`}></div>}
                {isRenaming ? (
                    <input
                        ref={renameInputRef}
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={handleRenameSubmit}
                        onKeyDown={handleRenameKeyDown}
                        onClick={e => e.stopPropagation()}
                        className="font-semibold text-sm truncate text-text-primary bg-input-bg border border-primary -m-1 p-0.5 rounded outline-none w-full"
                    />
                ) : (
                    <p onDoubleClick={(e) => {e.stopPropagation(); onStartRename(file.id);}} className="font-medium text-sm truncate text-text-primary">{file.title}</p>
                )}
              </div>
              <p className="text-xs text-text-secondary w-20 text-right tabular-nums">{formatBytes(file.metadata.size)}</p>
              <p className="text-xs text-text-secondary w-24 text-right tabular-nums">{formatDate(file.createdAt)}</p>
          </div>
      )
  }

  return (
    <div 
        ref={cardRef} 
        data-file-id={file.id} 
        draggable 
        onDragStart={handleDragStart} 
        onMouseEnter={handleMouseEnter} 
        onMouseLeave={handleMouseLeave} 
        className={`media-card bg-card-bg rounded-card group relative transition-all duration-300 ${animationClass} ${selectionClass}`} 
        onClick={clickHandler} 
        onContextMenu={onContextMenu} 
        data-is-selected={isSelected} 
        data-is-focused={isFocused} 
        data-hover-effect={settings.enableAnimations ? settings.hoverEffect : 'none'}
    >
      {showPreview && createPortal(<HoverPreview file={file} parentRect={cardRef.current?.getBoundingClientRect()} />, document.body)}
      
      {/* Focus Outline (Keyboard Nav) */}
      {isFocused && <div className="absolute -inset-1 border-2 border-primary/50 rounded-[calc(var(--border-radius-card)+4px)] pointer-events-none z-10" />}

      <div className="relative aspect-video bg-black cursor-pointer rounded-t-card overflow-hidden">
        <AsyncImage 
            fileId={file.id} 
            alt={file.title} 
            className={`w-full h-full ${objectFitClass} rounded-t-card transition-transform duration-500 group-hover:scale-105`} 
            fallback={<div className="w-full h-full flex items-center justify-center bg-gray-900">{getIcon()}</div>}
        />
        
        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        {/* Selection Checkbox (Hover or Selected) */}
        {(settings.showHoverSelect || isSelected) && (
            <div 
                onClick={e => { e.stopPropagation(); onSelectFile(e); }} 
                className={`absolute top-2 left-2 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all z-10 shadow-sm ${isSelected ? 'bg-primary border-primary scale-100 opacity-100' : 'bg-black/40 border-white/60 opacity-0 group-hover:opacity-100 hover:bg-black/60'}`}
            >
                {isSelected && <CheckIcon className="w-4 h-4 text-white" />}
            </div>
        )}

        {/* Quick Actions (Hover) */}
         <div className="quick-actions absolute top-2 right-2 flex items-center space-x-1 z-10">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdateFile({ ...file, isFavorite: !file.isFavorite });
                }}
                className={`p-1.5 rounded-full backdrop-blur-md transition-all ${file.isFavorite ? 'bg-red-500 text-white shadow-md' : 'bg-black/40 text-white/80 hover:bg-black/60 hover:text-white opacity-0 group-hover:opacity-100'}`}
                title={file.isFavorite ? 'Unfavorite' : 'Favorite'}
            >
                <HeartIcon className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
            </button>
        </div>

        {/* Metadata Badges */}
        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end pointer-events-none">
             <div className="flex items-center space-x-1">
                {settings.showCardDuration && file.metadata.duration && (
                    <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-medium px-1.5 py-0.5 rounded shadow-sm">
                        {new Date(file.metadata.duration * 1000).toISOString().substr(14, 5)}
                    </span>
                )}
             </div>
             {qualityInfo && (
                 <span className={`text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm ${qualityInfo.color}`}>
                     {qualityInfo.label}
                 </span>
             )}
        </div>
      </div>

      {/* Card Body */}
      <div className="p-3">
        <div className="flex items-center space-x-2">
            {file.colorTag && <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colorTagClasses[file.colorTag]}`}></div>}
            {settings.showCardTitle && (isRenaming ? (
                <input
                    ref={renameInputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={handleRenameKeyDown}
                    onClick={e => e.stopPropagation()}
                    className="font-medium text-sm text-text-primary bg-input-bg border border-primary -m-1 p-0.5 rounded outline-none w-full"
                />
            ) : (
                <p onDoubleClick={(e) => {e.stopPropagation(); onStartRename(file.id);}} className="font-medium text-sm text-text-primary truncate flex-1" title={file.title}>{file.title}</p>
            ))}
        </div>
        
        {settings.showCardRating && (
            <div className="flex items-center space-x-0.5 mt-1.5 h-4" onClick={e => e.stopPropagation()}>
                {[1, 2, 3, 4, 5].map(star => (
                    <button key={star}
                        className="focus:outline-none"
                        onMouseEnter={() => setHoveredStar(star)}
                        onMouseLeave={() => setHoveredStar(0)}
                        onClick={() => handleRatingChange(star)}
                    >
                        <StarIcon className={`w-3.5 h-3.5 transition-colors ${(hoveredStar > 0 ? star <= hoveredStar : star <= (file.rating || 0)) ? 'fill-yellow-400 text-yellow-400' : 'text-border-color group-hover:text-gray-600'}`} />
                    </button>
                ))}
            </div>
        )}

        <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-2 text-[10px] text-text-secondary">
           {settings.showCardDate && <div className="flex items-center truncate"><CalendarIcon className="w-3 h-3 mr-1.5 opacity-70" /> {formatDate(file.createdAt)}</div>}
           {settings.showCardSize && file.metadata?.size && <div className="flex items-center truncate justify-end"><DatabaseIcon className="w-3 h-3 mr-1.5 opacity-70" /> {formatBytes(file.metadata.size)}</div>}
        </div>
      </div>
    </div>
  );
};

export default React.memo(MediaCard);
