import React, { useState, useEffect } from 'react';
import { MediaFile, UseMediaStateReturn, ColorTag } from '../types';
import { XIcon, HeartIcon, StarIcon, FolderIcon, TagIcon, CalendarIcon, MaximizeIcon, DatabaseIcon } from './icons';
import AsyncImage from './AsyncImage';
import BatchEditPanel from './BatchEditPanel';

const useDebounce = <T,>(value: T, delay: number): T => {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => { setDebouncedValue(value); }, delay);
        return () => { clearTimeout(handler); };
    }, [value, delay]);
    return debouncedValue;
};

const formatBytes = (bytes: number) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const COLOR_TAGS: ColorTag[] = ['red', 'yellow', 'green', 'blue', 'purple'];

interface DetailsPanelProps {
    selectedFiles: MediaFile[];
    onClose: () => void;
    mediaState: UseMediaStateReturn;
}

const SingleFilePanel: React.FC<{ file: MediaFile, mediaState: UseMediaStateReturn }> = ({ file, mediaState }) => {
    const { updateMediaFile, categories } = mediaState;

    const [title, setTitle] = useState(file.title);
    const [description, setDescription] = useState(file.metadata.description || '');
    const [tags, setTags] = useState(file.metadata.tags || []);
    const [tagInput, setTagInput] = useState('');

    const debouncedTitle = useDebounce(title, 500);
    const debouncedDescription = useDebounce(description, 500);

    useEffect(() => {
        setTitle(file.title);
        setDescription(file.metadata.description || '');
        setTags(file.metadata.tags || []);
    }, [file]);

    useEffect(() => {
        if (debouncedTitle !== file.title) {
            updateMediaFile({ ...file, title: debouncedTitle });
        }
    }, [debouncedTitle, file, updateMediaFile]);
    
    useEffect(() => {
        if (debouncedDescription !== (file.metadata.description || '')) {
            updateMediaFile({ ...file, metadata: { ...file.metadata, description: debouncedDescription } });
        }
    }, [debouncedDescription, file, updateMediaFile]);

    const handleRatingChange = (rating: number) => updateMediaFile({ ...file, rating: file.rating === rating ? 0 : rating });
    const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => updateMediaFile({ ...file, category: e.target.value });
    const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) {
                const newTags = [...tags, newTag];
                setTags(newTags);
                updateMediaFile({ ...file, metadata: { ...file.metadata, tags: newTags } });
            }
            setTagInput('');
        }
    };
    const removeTag = (tagToRemove: string) => {
        const newTags = tags.filter(t => t !== tagToRemove);
        setTags(newTags);
        updateMediaFile({ ...file, metadata: { ...file.metadata, tags: newTags } });
    };

    return (
         <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <AsyncImage fileId={file.id} alt={file.title} className="w-full h-full object-contain"/>
            </div>
            
            <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full bg-transparent text-xl font-bold font-display text-text-primary focus:outline-none focus:bg-input-bg rounded px-2 -mx-2 py-1"/>
            
            <div className="flex items-center justify-between">
                <button onClick={() => updateMediaFile({...file, isFavorite: !file.isFavorite})} className={`flex items-center space-x-2 px-3 py-1.5 rounded-md text-sm ${file.isFavorite ? 'bg-red-500/20 text-red-400' : 'bg-input-bg text-text-secondary'}`}>
                    <HeartIcon className="w-4 h-4"/><span>{file.isFavorite ? 'Favorited' : 'Favorite'}</span>
                </button>
                <div className="flex items-center space-x-1">
                     {[1,2,3,4,5].map(star => <button key={star} onClick={() => handleRatingChange(star)}><StarIcon className={`w-5 h-5 transition-colors ${star <= (file.rating || 0) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500'}`} /></button>)}
                </div>
            </div>

            <div className="space-y-3 pt-2 text-sm">
                <div className="flex items-center"><FolderIcon className="w-4 h-4 mr-3 text-text-secondary"/><select value={file.category} onChange={handleCategoryChange} className="w-full bg-input-bg text-text-primary px-2 py-1.5 rounded-md border border-border-color">{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)} <option value={mediaState.UNCATEGORIZED_ID}>Uncategorized</option></select></div>
                <div className="flex items-start"><TagIcon className="w-4 h-4 mr-3 mt-2 text-text-secondary"/><div className="flex-1 flex flex-wrap gap-1.5 p-2 rounded-md bg-input-bg border border-border-color min-h-[40px]">{tags.map(tag => (<div key={tag} className="flex items-center bg-primary/20 text-primary text-xs font-semibold pl-2 pr-1 py-0.5 rounded-full">{tag}<button onClick={() => removeTag(tag)} className="ml-1.5 p-0.5 hover:bg-white/20 rounded-full"><XIcon className="w-2.5 h-2.5"/></button></div>)))}<input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagKeyDown} placeholder="Add tag..." className="flex-1 bg-transparent focus:outline-none min-w-[60px] p-1"/></div></div>
                <div><h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Color Tag</h3><div className="flex space-x-2">{COLOR_TAGS.map(color => <button key={color} onClick={() => updateMediaFile({...file, colorTag: color})} className={`w-6 h-6 rounded-full ring-2 ring-offset-2 ring-offset-sidebar-bg bg-${color}-500 ${file.colorTag === color ? 'ring-primary' : 'ring-transparent'}`}/>)}<button onClick={() => updateMediaFile({...file, colorTag: undefined})} className="w-6 h-6 rounded-full border-2 border-text-secondary flex items-center justify-center"><XIcon className="w-4 h-4 text-text-secondary" /></button></div></div>
                <div><h3 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Description</h3><textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Add a description..." rows={4} className="w-full bg-input-bg text-text-primary p-2 rounded-md border border-border-color focus:border-primary focus:outline-none"/></div>
                
                <div className="border-t border-border-color pt-3 space-y-2">
                    <div className="flex items-center"><CalendarIcon className="w-4 h-4 mr-3 text-text-secondary"/><span>{new Date(file.createdAt).toLocaleString()}</span></div>
                    <div className="flex items-center"><DatabaseIcon className="w-4 h-4 mr-3 text-text-secondary"/><span>{formatBytes(file.metadata.size)}</span></div>
                    {file.metadata.resolution && <div className="flex items-center"><MaximizeIcon className="w-4 h-4 mr-3 text-text-secondary"/><span>{file.metadata.resolution}</span></div>}
                    {file.metadata.duration && <div className="flex items-center"><DatabaseIcon className="w-4 h-4 mr-3 text-text-secondary"/><span>{new Date(file.metadata.duration * 1000).toISOString().substr(11, 8)}</span></div>}
                </div>
            </div>
        </div>
    );
};


const DetailsPanel: React.FC<DetailsPanelProps> = ({ selectedFiles, onClose, mediaState }) => {
    
    if (selectedFiles.length === 0) {
        return null;
    }

    const isBatch = selectedFiles.length > 1;
    const title = isBatch ? `Batch Edit` : `Details`;

    return (
        <div className="w-96 flex-shrink-0 bg-sidebar-bg border-l border-border-color flex flex-col animate-[slideIn_0.3s_ease-out]">
            <header className="p-4 flex items-center justify-between border-b border-border-color flex-shrink-0">
                <h2 className="font-display font-semibold text-lg text-text-primary">{title}</h2>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10"><XIcon className="w-5 h-5"/></button>
            </header>
            
            {isBatch ? (
                <div className="flex-1 overflow-y-auto">
                    <BatchEditPanel files={selectedFiles} mediaState={mediaState} />
                </div>
            ) : (
                <SingleFilePanel file={selectedFiles[0]} mediaState={mediaState} />
            )}
        </div>
    );
};

export default DetailsPanel;
