import React, { useState, useEffect } from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import { UseMediaStateReturn, Collection, CollectionRule, IconName, MediaFile } from '../types';
import { PlusIcon, TrashIcon, EditIcon, FolderIcon, ClockIcon, StarIcon, BookmarkIcon, HeartIcon, SparklesIcon, VideoIcon, ImageIcon, AudioIcon, ListPlusIcon, XIcon } from './icons';

const ICONS: IconName[] = ['Folder', 'Clock', 'Star', 'Bookmark', 'Heart', 'Sparkles', 'Video', 'Image', 'Audio'];

const RULE_FIELDS: { id: CollectionRule['field']; label: string; type: 'string' | 'number' | 'date' | 'boolean' }[] = [
    { id: 'title', label: 'Title', type: 'string' },
    { id: 'rating', label: 'Rating', type: 'number' },
    { id: 'createdAt', label: 'Date Added', type: 'date' },
    { id: 'isFavorite', label: 'Is Favorite', type: 'boolean' },
    { id: 'metadata.duration', label: 'Duration (sec)', type: 'number' },
    { id: 'metadata.size', label: 'File Size (bytes)', type: 'number' },
];

const OPERATORS: Record<string, { id: CollectionRule['operator']; label: string }[]> = {
    string: [ { id: 'contains', label: 'contains' }, { id: 'eq', label: 'is' }, { id: 'neq', label: 'is not' } ],
    number: [ { id: 'eq', label: '=' }, { id: 'neq', label: '≠' }, { id: 'gt', label: '>' }, { id: 'gte', label: '≥' }, { id: 'lt', label: '<' }, { id: 'lte', label: '≤' } ],
    date: [ { id: 'gt', label: 'is after' }, { id: 'lt', label: 'is before' } ],
    boolean: [ { id: 'eq', label: 'is' }, { id: 'neq', label: 'is not' } ],
};

const CollectionIcon: React.FC<{ icon?: IconName, className?: string }> = ({ icon, className="w-5 h-5" }) => {
  switch (icon) {
    case 'Clock': return <ClockIcon className={className} />;
    case 'Star': return <StarIcon className={className} />;
    case 'Bookmark': return <BookmarkIcon className={className} />;
    case 'Heart': return <HeartIcon className={className} />;
    case 'Sparkles': return <SparklesIcon className={className} />;
    case 'Video': return <VideoIcon className={className} />;
    case 'Image': return <ImageIcon className={className} />;
    case 'Audio': return <AudioIcon className={className} />;
    case 'Folder':
    default: return <FolderIcon className={className} />;
  }
};

const CollectionEditor: React.FC<{
    collection: Omit<Collection, 'id'> | Collection;
    onSave: (collection: Omit<Collection, 'id'> | Collection) => void;
    onCancel: () => void;
    onDelete?: () => void;
}> = ({ collection, onSave, onCancel, onDelete }) => {
    const [localCollection, setLocalCollection] = useState(collection);

    const updateField = (field: keyof Collection, value: any) => {
        setLocalCollection(c => ({ ...c, [field]: value }));
    };

    const updateRule = (index: number, newRule: CollectionRule) => {
        const newRules = [...(localCollection.rules || [])];
        newRules[index] = newRule;
        updateField('rules', newRules);
    };

    const addRule = () => {
        const newRule: CollectionRule = { field: 'title', operator: 'contains', value: '' };
        updateField('rules', [...(localCollection.rules || []), newRule]);
    };
    
    const removeRule = (index: number) => {
        const newRules = [...(localCollection.rules || [])];
        newRules.splice(index, 1);
        updateField('rules', newRules);
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-lg font-bold font-display mb-4">{'id' in localCollection ? 'Edit' : 'New'} Smart Collection</h3>
            <div className="space-y-4 flex-1">
                <div>
                    <label className="text-xs font-semibold text-text-secondary">NAME</label>
                    <input type="text" value={localCollection.name} onChange={e => updateField('name', e.target.value)} className="w-full bg-input-bg p-2 rounded-md text-sm mt-1" />
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary">ICON</label>
                    <div className="flex space-x-2 p-2 bg-input-bg rounded-md mt-1">
                        {ICONS.map(icon => (
                            <button key={icon} onClick={() => updateField('icon', icon)} className={`p-2 rounded ${localCollection.icon === icon ? 'bg-primary' : 'hover:bg-primary/50'}`}>
                                <CollectionIcon icon={icon} />
                            </button>
                        ))}
                    </div>
                </div>
                <div>
                    <label className="text-xs font-semibold text-text-secondary">RULES</label>
                    <p className="text-xs text-text-secondary">Match all of the following rules:</p>
                    <div className="space-y-2 mt-2 max-h-64 overflow-y-auto pr-2">
                        {localCollection.rules?.map((rule, index) => {
                            const fieldDef = RULE_FIELDS.find(f => f.id === rule.field);
                            return (
                                <div key={index} className="flex items-center space-x-2 bg-input-bg/50 p-2 rounded-md">
                                    <select value={rule.field} onChange={e => updateRule(index, { ...rule, field: e.target.value as CollectionRule['field'], operator: OPERATORS[RULE_FIELDS.find(f=>f.id === e.target.value)?.type || 'string'][0].id })} className="bg-input-bg p-1 rounded border border-border-color text-xs">
                                        {RULE_FIELDS.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                                    </select>
                                    <select value={rule.operator} onChange={e => updateRule(index, { ...rule, operator: e.target.value as CollectionRule['operator']})} className="bg-input-bg p-1 rounded border border-border-color text-xs">
                                        {OPERATORS[fieldDef?.type || 'string'].map(op => <option key={op.id} value={op.id}>{op.label}</option>)}
                                    </select>
                                    {fieldDef?.type === 'boolean' ? (
                                        <select value={String(rule.value)} onChange={e => updateRule(index, { ...rule, value: e.target.value === 'true' })} className="bg-input-bg p-1 rounded border border-border-color text-xs w-full">
                                            <option value="true">True</option>
                                            <option value="false">False</option>
                                        </select>
                                    ) : (
                                        <input 
                                            type={fieldDef?.type === 'date' ? 'date' : fieldDef?.type === 'number' ? 'number' : 'text'}
                                            value={fieldDef?.type === 'date' && typeof rule.value === 'number' ? new Date(rule.value).toISOString().split('T')[0] : String(rule.value)} 
                                            onChange={e => {
                                                const value = fieldDef?.type === 'date' ? new Date(e.target.value).getTime() : e.target.value;
                                                updateRule(index, { ...rule, value });
                                            }}
                                            className="bg-input-bg p-1 rounded border border-border-color text-xs w-full"
                                        />
                                    )}
                                    <button onClick={() => removeRule(index)} className="p-1 text-text-secondary hover:text-red-500"><XIcon className="w-4 h-4"/></button>
                                </div>
                            );
                        })}
                    </div>
                    <Button onClick={addRule} className="text-sm mt-2 !py-1 !px-2"><ListPlusIcon className="w-4 h-4 inline mr-1"/>Add Rule</Button>
                </div>
            </div>
            <div className="flex justify-between items-center mt-6">
                <div>
                    {onDelete && <Button onClick={onDelete} className="!bg-red-500/20 hover:!bg-red-500/40 !text-red-400">Delete</Button>}
                </div>
                <div className="flex space-x-2">
                    <Button onClick={onCancel} className="!bg-input-bg hover:!bg-border-color !text-text-primary">Cancel</Button>
                    <Button onClick={() => onSave(localCollection)} disabled={!localCollection.name}>Save</Button>
                </div>
            </div>
        </div>
    );
};

interface ManageCollectionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaState: UseMediaStateReturn;
  initialSelectedId?: string | null;
}

const ManageCollectionsDialog: React.FC<ManageCollectionsDialogProps> = ({ isOpen, onClose, mediaState, initialSelectedId }) => {
    const { collections, addCollection, updateCollection, deleteCollection } = mediaState;
    const [selectedId, setSelectedId] = useState<string | 'new' | null>(initialSelectedId || null);

    useEffect(() => {
        if(isOpen) setSelectedId(initialSelectedId || null);
    }, [isOpen, initialSelectedId]);

    const handleSave = (collection: Collection | Omit<Collection, 'id'>) => {
        if ('id' in collection) {
            updateCollection(collection);
        } else {
            addCollection(collection);
        }
        setSelectedId(null);
    };

    const handleDelete = (id: string) => {
        if(confirm("Are you sure you want to delete this collection?")) {
            deleteCollection(id);
            setSelectedId(null);
        }
    }

    const selectedCollection = selectedId === 'new'
        ? { name: '', type: 'smart' as 'smart', rules: [], icon: 'Folder' as IconName }
        : collections.find(c => c.id === selectedId);

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Manage Collections">
            <div className="flex -m-6 min-h-[500px]">
                <div className="w-1/3 border-r border-border-color p-4 flex flex-col">
                    <Button onClick={() => setSelectedId('new')} className="w-full mb-4">New Smart Collection</Button>
                    <div className="flex-1 overflow-y-auto space-y-1 pr-2">
                        {collections.map(c => (
                            <button key={c.id} onClick={() => setSelectedId(c.id)} className={`w-full flex items-center space-x-3 text-left p-2 rounded-md ${selectedId === c.id ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}>
                                <CollectionIcon icon={c.icon} />
                                <span className="flex-1 truncate">{c.name}</span>
                                {c.type === 'smart' && 'id' in c && <button onClick={e => { e.stopPropagation(); setSelectedId(c.id); }} className="p-1 hover:text-primary"><EditIcon className="w-3.5 h-3.5"/></button>}
                                {c.id.length > 10 && <button onClick={e => {e.stopPropagation(); handleDelete(c.id)}} className="p-1 hover:text-red-500"><TrashIcon className="w-3.5 h-3.5"/></button>}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="w-2/3 p-6">
                    {selectedCollection ? (
                        <CollectionEditor 
                            collection={selectedCollection}
                            onSave={handleSave}
                            onCancel={() => setSelectedId(null)}
                            onDelete={selectedCollection.type === 'smart' && 'id' in selectedCollection ? () => handleDelete(selectedCollection.id) : undefined}
                        />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center text-text-secondary">
                            <EditIcon className="w-12 h-12 mb-4" />
                            <p>Select a collection to edit, or create a new one.</p>
                        </div>
                    )}
                </div>
            </div>
        </Dialog>
    );
};

export default ManageCollectionsDialog;