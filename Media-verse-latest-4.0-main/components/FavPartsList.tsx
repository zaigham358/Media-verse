import React, { useState } from 'react';
import { UseMediaStateReturn, MediaFile, FavPart } from '../types';
import ClipCard from './ClipCard';
import ClipContextMenu from './ClipContextMenu';
import ExportDialog from './ExportDialog';

interface FavPartsListProps {
  mediaState: UseMediaStateReturn;
  setViewingState: (state: { file: MediaFile; clip?: FavPart }) => void;
}

const FavPartsList: React.FC<FavPartsListProps> = ({ mediaState, setViewingState }) => {
  const { favParts, mediaFiles, deleteFavPart, updateFavPart } = mediaState;
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, clip: FavPart, parent: MediaFile } | null>(null);
  const [clipToExport, setClipToExport] = useState<{ clip: FavPart, parent: MediaFile } | null>(null);

  // Create a map for quick lookup of parent files
  const mediaFileMap: Map<string, MediaFile> = new Map(mediaFiles.map(file => [file.id, file]));

  const handlePlayClip = (clip: FavPart) => {
    const parentFile = mediaFileMap.get(clip.mediaId);
    if (parentFile) {
      setViewingState({ file: parentFile, clip: clip });
    }
  };
  
  const handleContextMenu = (e: React.MouseEvent, clip: FavPart, parent: MediaFile) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY, clip, parent });
  }

  if (favParts.length === 0) {
    return (
      <div className="p-6 text-center text-text-secondary">
        <h1 className="text-2xl font-bold text-text-primary mb-2">Favorite Clips</h1>
        <p>You haven't saved any clips yet.</p>
        <p className="text-sm mt-1">Open a video and use the scissors icon to mark your favorite parts.</p>
      </div>
    );
  }
  
  const sortedClips = [...favParts].sort((a, b) => {
      const parentA = mediaFileMap.get(a.mediaId);
      const parentB = mediaFileMap.get(b.mediaId);
      if (parentA && parentB && parentA.createdAt !== parentB.createdAt) {
          return parentB.createdAt - parentA.createdAt;
      }
      return a.startTime - b.startTime;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
        <header className="p-6 border-b border-border-color flex-shrink-0">
            <h1 className="text-2xl font-bold font-display">Favorite Clips <span className="text-sm font-sans text-text-secondary ml-2">{favParts.length} clips</span></h1>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-6">
                {sortedClips.map(clip => {
                    const parent = mediaFileMap.get(clip.mediaId);
                    if (!parent) return null;

                    return (
                        <ClipCard 
                            key={clip.id}
                            clip={clip}
                            parent={parent}
                            onPlay={handlePlayClip}
                            onUpdate={updateFavPart}
                            onDelete={deleteFavPart}
                            onContextMenu={(e) => handleContextMenu(e, clip, parent)}
                        />
                    );
                })}
            </div>
        </div>

        {contextMenu && (
            <ClipContextMenu 
                x={contextMenu.x}
                y={contextMenu.y}
                clip={contextMenu.clip}
                parent={contextMenu.parent}
                onClose={() => setContextMenu(null)}
                onExport={() => setClipToExport({ clip: contextMenu.clip, parent: contextMenu.parent })}
            />
        )}

        {clipToExport && (
            <ExportDialog 
                isOpen={!!clipToExport}
                onClose={() => setClipToExport(null)}
                clip={clipToExport.clip}
                parentFile={clipToExport.parent}
            />
        )}
    </div>
  );
};

export default FavPartsList;