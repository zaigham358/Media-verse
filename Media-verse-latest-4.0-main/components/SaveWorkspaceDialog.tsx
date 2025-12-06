import React, { useState } from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';

interface SaveWorkspaceDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string) => void;
}

const SaveWorkspaceDialog: React.FC<SaveWorkspaceDialogProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');

    const handleSave = () => {
        if (name.trim()) {
            onSave(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Save Workspace">
            <div>
                <label htmlFor="workspace-name" className="text-sm font-medium text-text-secondary">
                    Workspace Name
                </label>
                <input
                    id="workspace-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Photo Culling, Project X"
                    className="mt-1 w-full bg-input-bg p-2 rounded-md"
                    autoFocus
                />
                <div className="mt-6 flex justify-end space-x-2">
                    <Button onClick={onClose} className="!bg-input-bg !text-text-primary">Cancel</Button>
                    <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
                </div>
            </div>
        </Dialog>
    );
};

export default SaveWorkspaceDialog;
