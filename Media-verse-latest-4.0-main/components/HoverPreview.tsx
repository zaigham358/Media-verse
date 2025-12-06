
import React, { useState, useEffect } from 'react';
import { MediaFile } from '../types';
import AsyncImage from './AsyncImage';
import { getMediaFileSrc } from '../db';

interface HoverPreviewProps {
    file: MediaFile;
    parentRect: DOMRect | undefined;
}

const HoverPreview: React.FC<HoverPreviewProps> = ({ file, parentRect }) => {
    const [videoSrc, setVideoSrc] = useState<string | null>(null);

    useEffect(() => {
        let objectUrl: string | undefined;
        let isCancelled = false;
        
        if (file.type === 'video') {
            getMediaFileSrc(file.id).then(blob => {
                if (blob && !isCancelled) {
                    objectUrl = URL.createObjectURL(blob);
                    setVideoSrc(objectUrl);
                }
            });
        }
        return () => {
            isCancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [file.id, file.type]);

    if (!parentRect || file.type === 'audio') return null;

    const style: React.CSSProperties = {
        position: 'fixed',
        width: '320px',
        zIndex: 100,
        pointerEvents: 'none',
        transform: 'translateY(-50%)',
    };

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const previewHeight = 320 / (16 / 9); // Estimate height based on 16:9 aspect ratio

    style.top = parentRect.top + parentRect.height / 2;
    style.left = parentRect.right + 16;
    
    // If it overflows right, position to the left
    if (parentRect.right + 16 + 320 > viewportWidth) {
        style.left = parentRect.left - 320 - 16;
    }
    
    // Adjust vertical position to stay in viewport
    if (style.top - (previewHeight / 2) < 8) {
        style.top = 8 + (previewHeight / 2);
    }
    if (style.top + (previewHeight / 2) > viewportHeight - 8) {
        style.top = viewportHeight - 8 - (previewHeight / 2);
    }

    return (
        <div style={style} className="bg-card-bg rounded-lg shadow-2xl border border-border-color overflow-hidden animate-[fadeIn_0.2s_ease-out_0.5s] fill-mode-forwards opacity-0">
            <div className="w-full h-auto aspect-video bg-black">
                {file.type === 'video' ? (
                    videoSrc ? <video src={videoSrc} className="w-full h-full object-contain" autoPlay muted loop playsInline /> : <div className="w-full h-full flex items-center justify-center text-text-secondary">Loading...</div>
                ) : (
                    <AsyncImage fileId={file.id} alt={file.title} className="w-full h-full object-contain" />
                )}
            </div>
             <div className="p-2">
                <p className="font-semibold text-text-primary text-sm truncate">{file.title}</p>
            </div>
        </div>
    );
};

export default HoverPreview;
