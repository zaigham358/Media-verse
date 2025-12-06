
import React, { useState } from 'react';
import { UseMediaStateReturn } from '../types';
import Popover from './ui/Popover';
import UploadProgressTracker from './UploadProgressTracker';
import { UploadCloudIcon } from './icons';

interface HeaderProps {
    mediaState: UseMediaStateReturn;
}

const Header: React.FC<HeaderProps> = ({ mediaState }) => {
    const { uploadTasks } = mediaState;
    const [isUploadPopoverOpen, setIsUploadPopoverOpen] = useState(false);

    const activeUploads = uploadTasks.filter(t => t.status === 'processing' || t.status === 'queued');

    return (
        <header className="flex-shrink-0 h-16 flex items-center justify-between px-6 border-b border-border-color">
            <div>
                {/* Search bar can be added here in the future */}
            </div>
            <div className="flex items-center space-x-4">
                 <Popover
                    isOpen={isUploadPopoverOpen}
                    onClose={() => setIsUploadPopoverOpen(false)}
                    trigger={
                        <button 
                            onClick={() => setIsUploadPopoverOpen(true)}
                            className="relative text-text-secondary hover:text-text-primary"
                        >
                            <UploadCloudIcon className="w-6 h-6" />
                            {activeUploads.length > 0 && (
                                <span className="absolute -top-1 -right-2 w-4 h-4 bg-primary text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {activeUploads.length}
                                </span>
                            )}
                        </button>
                    }
                 >
                    <UploadProgressTracker mediaState={mediaState} />
                 </Popover>
            </div>
        </header>
    );
};

export default Header;
