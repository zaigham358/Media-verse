import React, { useState, useRef, useEffect } from 'react';
import { Tab as TabType } from '../types';
import { XIcon, CopyIcon, SparklesIcon, HeartIcon, UploadCloudIcon, VideoIcon, ImageIcon, AudioIcon, FileIcon, ScissorsIcon, EditIcon, ChevronsLeftIcon, ChevronsRightIcon, VolumeIcon } from './icons';

interface TabProps {
  tab: TabType;
  isActive: boolean;
  onSelect: () => void;
  onClose: () => void;
  onDuplicate: () => void;
  onCloseOthers: () => void;
  onCloseRight: () => void;
  onPin: () => void;
  onRename: (newTitle: string) => void;
  onMute: () => void;
  onMoveToStart: () => void;
  onMoveToEnd: () => void;
  onCloseToLeft: () => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  isDragging: boolean;
}

const Tab: React.FC<TabProps> = (props) => {
  const { tab, isActive, onSelect, onClose, onDuplicate, onCloseOthers, onCloseRight, onPin, onRename, onMute, onMoveToStart, onMoveToEnd, onCloseToLeft, isDragging, onDragStart, onDragOver, onDragEnd } = props;
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(tab.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const handleClose = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClose();
  }
  
  const handleAction = (action: () => void) => {
    action();
    setContextMenu(null);
  }
  
  const handleRenameSubmit = () => {
    if (renameValue.trim()) {
        onRename(renameValue.trim());
    }
    setIsRenaming(false);
  }

  const getTabIcon = () => {
      const iconClass = `w-4 h-4 ${!tab.isPinned ? 'mr-2' : ''} flex-shrink-0`;
      if (tab.viewingState) {
          switch(tab.viewingState.file.type) {
              case 'video': return <VideoIcon className={iconClass} />;
              case 'image': return <ImageIcon className={iconClass} />;
              case 'audio': return <AudioIcon className={iconClass} />;
              default: return <FileIcon className={iconClass} />;
          }
      }
      switch(tab.view) {
          case 'dashboard': return <FileIcon className={iconClass} />;
          case 'ai_assistant': return <SparklesIcon className={iconClass} />;
          case 'fav_parts': return <ScissorsIcon className={iconClass} />;
          case 'favorites': return <HeartIcon className={iconClass} />;
          case 'uploads': return <UploadCloudIcon className={iconClass} />;
          default: return <FileIcon className={iconClass} />;
      }
  }

  const baseClasses = "relative flex items-center h-full cursor-pointer group transition-all duration-200";
  const activeClasses = "bg-app-bg text-text-primary";
  const inactiveClasses = "bg-sidebar-bg text-text-secondary hover:bg-card-bg/50";
  const pinnedClasses = "w-10 justify-center px-0";
  const unpinnedClasses = "px-4 max-w-[200px] min-w-[120px]";
  
  const beforeElement = `before:content-[''] before:absolute before:bottom-0 before:left-[-10px] before:w-2.5 before:h-2.5 before:bg-sidebar-bg before:z-10 before:[clip-path:polygon(100%_0,100%_100%,0_100%)] before:[background-image:radial-gradient(circle_at_0_0,transparent_10px,rgb(var(--color-app-bg))_10.5px)]`;
  const afterElement = `after:content-[''] after:absolute after:bottom-0 after:right-[-10px] after:w-2.5 after:h-2.5 after:bg-sidebar-bg after:z-10 after:[clip-path:polygon(0_0,100%_100%,0_100%)] after:[background-image:radial-gradient(circle_at_100%_0,transparent_10px,rgb(var(--color-app-bg))_10.5px)]`;

  const isMediaTab = tab.viewingState && (tab.viewingState.file.type === 'video' || tab.viewingState.file.type === 'audio');

  return (
    <>
      <div
        data-tab-id={tab.id}
        draggable={!isRenaming}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={onDragEnd}
        className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses} ${tab.isPinned ? pinnedClasses : unpinnedClasses} ${isActive ? `${beforeElement} ${afterElement}` : ''} ${isDragging ? 'opacity-50' : ''}`}
        style={{borderTopLeftRadius: '8px', borderTopRightRadius: '8px'}}
        onClick={onSelect}
        onContextMenu={handleContextMenu}
      >
        {getTabIcon()}
        {!tab.isPinned && (
            isRenaming ? (
                 <input
                    ref={inputRef}
                    type="text"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={handleRenameSubmit}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameSubmit(); if (e.key === 'Escape') setIsRenaming(false); }}
                    className="bg-transparent border border-primary -m-1 p-0.5 rounded text-sm w-full outline-none"
                    onClick={e => e.stopPropagation()}
                />
            ) : (
                <span className="text-sm truncate flex-grow pt-px">{tab.title}</span>
            )
        )}
        
        {!tab.isPinned && (
            <button
            onClick={handleClose}
            className={`ml-2 p-1 rounded-full flex-shrink-0 transition-opacity ${isActive ? 'hover:bg-white/10' : 'opacity-0 group-hover:opacity-100 hover:bg-white/10'}`}
            title="Close Tab"
            >
            <XIcon className="w-3.5 h-3.5" />
            </button>
        )}
      </div>

      {contextMenu && (
        <div 
            className="fixed inset-0 z-50" 
            onClick={() => setContextMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setContextMenu(null); }}
        >
            <div className="absolute bg-card-bg rounded-lg shadow-lg border border-border-color p-1 w-52 text-sm text-text-primary" style={{ top: contextMenu.y, left: contextMenu.x }}>
                <button onClick={() => handleAction(onPin)} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary">{tab.isPinned ? 'Unpin Tab' : 'Pin Tab'}</button>
                <button onClick={() => handleAction(() => { setIsRenaming(true); setRenameValue(tab.title); })} className="w-full flex items-center space-x-2 text-left px-3 py-1.5 rounded hover:bg-primary">
                    <EditIcon className="w-4 h-4" /> <span>Rename Tab</span>
                </button>
                {isMediaTab && (
                     <button onClick={() => handleAction(onMute)} className="w-full flex items-center space-x-2 text-left px-3 py-1.5 rounded hover:bg-primary">
                        <VolumeIcon level={0.5} muted={!!tab.isMuted} className="w-4 h-4" />
                        <span>{tab.isMuted ? 'Unmute Tab' : 'Mute Tab'}</span>
                    </button>
                )}
                <button onClick={() => handleAction(onDuplicate)} className="w-full flex items-center space-x-2 text-left px-3 py-1.5 rounded hover:bg-primary">
                    <CopyIcon className="w-4 h-4" /> <span>Duplicate Tab</span>
                </button>
                <div className="h-px bg-border-color my-1" />
                <button onClick={() => handleAction(onMoveToStart)} className="w-full flex items-center space-x-2 text-left px-3 py-1.5 rounded hover:bg-primary">
                    <ChevronsLeftIcon className="w-4 h-4" /> <span>Move to Start</span>
                </button>
                 <button onClick={() => handleAction(onMoveToEnd)} className="w-full flex items-center space-x-2 text-left px-3 py-1.5 rounded hover:bg-primary">
                    <ChevronsRightIcon className="w-4 h-4" /> <span>Move to End</span>
                </button>
                <div className="h-px bg-border-color my-1" />
                <button onClick={() => handleAction(onClose)} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary">Close Tab</button>
                <button onClick={() => handleAction(onCloseOthers)} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary">Close Other Tabs</button>
                <button onClick={() => handleAction(onCloseToLeft)} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary">Close Tabs to the Left</button>
                <button onClick={() => handleAction(onCloseRight)} className="w-full text-left px-3 py-1.5 rounded hover:bg-primary">Close Tabs to the Right</button>
            </div>
        </div>
      )}
    </>
  );
};

export default React.memo(Tab);