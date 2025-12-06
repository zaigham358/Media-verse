import React, { useState } from 'react';
import { MediaFile, UseMediaStateReturn, ColorTag } from '../types';
import { HeartIcon, StarIcon, FolderIcon, TagIcon, XIcon, EditIcon } from './icons';
import Button from './ui/Button';

interface BatchEditPanelProps {
    files: MediaFile[];
    mediaState: UseMediaStateReturn;
}

const COLOR_TAGS: ColorTag[] = ['red', 'yellow', 'green', 'blue', 'purple'];

const BatchEditPanel: React.FC<BatchEditPanelProps> = ({ files, mediaState }) => {
    const { updateMediaFiles, categories, UNCATEGORIZED_ID } = mediaState;
    const [tagInput, setTagInput] = useState('');
    const [findText, setFindText] = useState('');
    const [replaceText, setReplaceText] = useState('');
    
    const handleBulkUpdate = (changes: Partial<MediaFile>) => {
        updateMediaFiles(files.map(file => ({ id: file.id, changes })));
    };
    
    const handleAddTags = () => {
        if (!tagInput.trim()) return;
        const newTags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
        if (newTags.length === 0) return;
        
        updateMediaFiles(files.map(file => {
            const updatedTags = [...new Set([...(file.metadata.tags || []), ...newTags])];
            return { id: file.id, changes: { metadata: { ...file.metadata, tags: updatedTags } } };
        }));
        setTagInput('');
    };

    const handleRemoveTag = (tagToRemove: string) => {
        updateMediaFiles(files.map(file => {
            const updatedTags = (file.metadata.tags || []).filter(t => t !== tagToRemove);
            return { id: file.id, changes: { metadata: { ...file.metadata, tags: updatedTags } } };
        }));
    };
    
    const handleFindAndReplace = () => {
        if (!findText) return;
        const regex = new RegExp(findText, 'gi');
        updateMediaFiles(files.map(file => ({
            id: file.id,
            changes: { title: file.title.replace(regex, replaceText) }
        })));
    };

    // FIX: Changed reduce to type the accumulator in the callback to avoid TypeScript error.
    const commonTags = files.reduce((acc: string[], file) => {
        (file.metadata.tags || []).forEach(tag => {
            if (!acc.includes(tag)) acc.push(tag);
        });
        return acc;
    }, []);

    return (
        <div className="p-4 space-y-4">
            <h3 className="font-semibold">{files.length} items selected</h3>
            
            <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Actions</h4>
                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handleBulkUpdate({ isFavorite: true })} className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md text-sm bg-input-bg text-text-secondary hover:bg-red-500/20 hover:text-red-400"><HeartIcon className="w-4 h-4"/><span>Favorite</span></button>
                    <button onClick={() => handleBulkUpdate({ isFavorite: false })} className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded-md text-sm bg-input-bg text-text-secondary hover:bg-white/10"><XIcon className="w-4 h-4"/><span>Unfavorite</span></button>
                </div>
            </div>

            <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Set Rating</h4>
                <div className="flex items-center justify-between bg-input-bg p-1 rounded-md">
                     {[1,2,3,4,5].map(star => <button key={star} onClick={() => handleBulkUpdate({ rating: star })} className="flex-1 p-1 rounded hover:bg-primary/20"><StarIcon className="w-5 h-5 mx-auto text-yellow-400" /></button>)}
                     <button onClick={() => handleBulkUpdate({ rating: 0 })} className="p-1 rounded hover:bg-primary/20"><XIcon className="w-5 h-5 mx-auto text-text-secondary" /></button>
                </div>
            </div>

            <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Set Category</h4>
                <select onChange={e => handleBulkUpdate({ category: e.target.value })} className="w-full bg-input-bg text-text-primary px-2 py-1.5 rounded-md border border-border-color">
                    <option value="">-- No Change --</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    <option value={UNCATEGORIZED_ID}>Uncategorized</option>
                </select>
            </div>
            
            <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Color Tag</h4>
                <div className="flex justify-between">
                    {COLOR_TAGS.map(color => <button key={color} onClick={() => handleBulkUpdate({ colorTag: color as any })} className={`w-6 h-6 rounded-full ring-2 ring-offset-2 ring-offset-sidebar-bg bg-${color}-500 ring-transparent`}/>)}
                    <button onClick={() => handleBulkUpdate({ colorTag: undefined })} className="w-6 h-6 rounded-full border-2 border-text-secondary flex items-center justify-center"><XIcon className="w-4 h-4 text-text-secondary" /></button>
                </div>
            </div>

            <div>
                <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Manage Tags</h4>
                <div className="flex items-center space-x-2">
                    <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddTags()} placeholder="Add tags, comma-separated" className="flex-1 bg-input-bg p-2 rounded-md text-sm" />
                    <Button onClick={handleAddTags} className="!py-2">Add</Button>
                </div>
                {commonTags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {commonTags.map(tag => (
                            <div key={tag} className="flex items-center bg-primary/20 text-primary text-xs font-semibold pl-2 pr-1 py-0.5 rounded-full">
                                {tag}
                                <button onClick={() => handleRemoveTag(tag)} className="ml-1.5 p-0.5 hover:bg-white/20 rounded-full"><XIcon className="w-2.5 h-2.5"/></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <div>
                 <h4 className="text-xs font-semibold text-text-secondary mb-1 uppercase">Find & Replace in Title</h4>
                 <div className="space-y-2">
                    <input type="text" value={findText} onChange={e => setFindText(e.target.value)} placeholder="Find text..." className="w-full bg-input-bg p-2 rounded-md text-sm" />
                    <input type="text" value={replaceText} onChange={e => setReplaceText(e.target.value)} placeholder="Replace with..." className="w-full bg-input-bg p-2 rounded-md text-sm" />
                    <Button onClick={handleFindAndReplace} disabled={!findText} className="w-full !py-2">Replace All</Button>
                 </div>
            </div>
        </div>
    );
};

export default BatchEditPanel;
