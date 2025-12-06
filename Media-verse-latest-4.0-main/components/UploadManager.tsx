import React, { useState } from 'react';
import { UseMediaStateReturn } from '../types';
import { UploadCloudIcon, DatabaseIcon } from './icons';
import ProgressBar from './ui/ProgressBar';

interface UploadManagerProps {
  mediaState: UseMediaStateReturn;
}

const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

// Recursive file getter
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

const UploadManager: React.FC<UploadManagerProps> = ({ mediaState }) => {
  const [isDragging, setIsDragging] = useState(false);
  const { addUploadTasks, storageQuota } = mediaState;

  const processFiles = (fileList: File[]) => {
      const validFiles = fileList.filter(f => f.type.startsWith('video/') || f.type.startsWith('image/') || f.type.startsWith('audio/'));
      if (validFiles.length) addUploadTasks(validFiles);
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const items = e.dataTransfer.items;
    const allFiles: File[] = [];
    const promises = Array.from(items).map(async item => {
        const entry = (item as any).webkitGetAsEntry();
        if (entry) allFiles.push(...(await getFilesFromDirectory(entry)));
    });
    await Promise.all(promises);
    
    if (allFiles.length > 0) processFiles(allFiles);
    else if (e.dataTransfer.files.length > 0) processFiles(Array.from(e.dataTransfer.files));
  };

  return (
    <div className="space-y-6">
        <div 
            onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className={`border-2 border-dashed rounded-lg p-10 text-center transition-all duration-200
                ${isDragging ? 'border-primary bg-primary/10 scale-[1.02]' : 'border-border-color hover:border-primary/50'}`}
        >
        <input type="file" id="file-upload" multiple className="hidden" onChange={(e) => { if(e.target.files) processFiles(Array.from(e.target.files)); }} />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
            <div className={`p-4 rounded-full mb-4 ${isDragging ? 'bg-primary text-white' : 'bg-input-bg text-text-secondary'}`}>
                <UploadCloudIcon className="w-12 h-12" />
            </div>
            <p className="font-semibold text-lg text-text-primary">Click to upload or drag & drop</p>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">
                Videos, Images, and Audio. Folders supported.
            </p>
        </label>
        </div>

        {storageQuota && (
            <div className="bg-card-bg border border-border-color rounded-lg p-4 flex items-center space-x-4">
                <div className="p-3 bg-input-bg rounded-full text-text-secondary">
                    <DatabaseIcon className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-text-primary">Storage Usage</span>
                        <span className="text-text-secondary">{formatBytes(storageQuota.used)} / {formatBytes(storageQuota.quota)}</span>
                    </div>
                    <ProgressBar value={storageQuota.percent} className="h-2" />
                    <p className="text-xs text-text-secondary mt-1">Data is stored locally in your browser's IndexedDB.</p>
                </div>
            </div>
        )}
    </div>
  );
};

export default UploadManager;