
import React, { useState, useEffect, useRef } from 'react';
import { UploadCloudIcon } from './icons';
import { UseMediaStateReturn } from '../types';

interface GlobalDropZoneProps {
    mediaState: UseMediaStateReturn;
}

// Reuse recursive directory logic from UploadManager (could be utility, but keeping simple here)
async function getFilesFromDirectory(entry: any): Promise<File[]> {
    const files: File[] = [];
    try {
        if (entry.isFile) {
            return new Promise((resolve) => entry.file((file: File) => resolve([file]), () => resolve([])));
        } else if (entry.isDirectory) {
            const dirReader = entry.createReader();
            const readEntries = (): Promise<any[]> => new Promise((resolve) => dirReader.readEntries((entries: any[]) => resolve(entries), () => resolve([])));
            let allEntries: any[] = [];
            let newEntries: any[];
            do {
                try {
                    newEntries = await readEntries();
                    allEntries = allEntries.concat(newEntries);
                } catch { newEntries = []; }
            } while (newEntries.length > 0);
            await Promise.all(allEntries.map(async (child) => files.push(...(await getFilesFromDirectory(child)))));
        }
    } catch {}
    return files;
}

const GlobalDropZone: React.FC<GlobalDropZoneProps> = ({ mediaState }) => {
    const [isDragging, setIsDragging] = useState(false);
    const dragCounter = useRef(0);

    useEffect(() => {
        const handleDragEnter = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current += 1;
            // Only show if dragging files
            if (e.dataTransfer?.types.includes('Files') && dragCounter.current === 1) {
                setIsDragging(true);
            }
        };

        const handleDragLeave = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            dragCounter.current -= 1;
            if (dragCounter.current === 0) {
                setIsDragging(false);
            }
        };

        const handleDragOver = (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
        };

        const handleDrop = async (e: DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
            dragCounter.current = 0;

            const items = e.dataTransfer?.items;
            if (!items) return;

            const allFiles: File[] = [];
            const promises = Array.from(items).map(async item => {
                const entry = (item as any).webkitGetAsEntry();
                if (entry) {
                    const files = await getFilesFromDirectory(entry);
                    allFiles.push(...files);
                }
            });

            await Promise.all(promises);
            
            const acceptedFiles = allFiles.filter(f => f.type.startsWith('video/') || f.type.startsWith('image/') || f.type.startsWith('audio/'));
            if (acceptedFiles.length > 0) {
                mediaState.addUploadTasks(acceptedFiles);
                // Switch to uploads view if not already there? 
                // Optional: For now just show the toast/tracker via existing mechanisms
            }
        };

        window.addEventListener('dragenter', handleDragEnter);
        window.addEventListener('dragleave', handleDragLeave);
        window.addEventListener('dragover', handleDragOver);
        window.addEventListener('drop', handleDrop);

        return () => {
            window.removeEventListener('dragenter', handleDragEnter);
            window.removeEventListener('dragleave', handleDragLeave);
            window.removeEventListener('dragover', handleDragOver);
            window.removeEventListener('drop', handleDrop);
        };
    }, [mediaState]);

    if (!isDragging) return null;

    return (
        <div className="fixed inset-0 z-[100] bg-primary/90 flex flex-col items-center justify-center text-white animate-in fade-in duration-200">
            <div className="bg-white/10 p-8 rounded-full mb-6 backdrop-blur-sm animate-bounce">
                <UploadCloudIcon className="w-24 h-24" />
            </div>
            <h2 className="text-4xl font-display font-bold">Drop files to Add</h2>
            <p className="mt-4 text-white/80 text-lg">Videos, Images, and Audio folders supported</p>
        </div>
    );
};

export default GlobalDropZone;
