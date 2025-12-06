
import React from 'react';
import { UseMediaStateReturn } from '../types';
import UploadManager from './UploadManager';
import UploadProgressTracker from './UploadProgressTracker';

interface UploadsPageProps {
    mediaState: UseMediaStateReturn;
}

const UploadsPage: React.FC<UploadsPageProps> = ({ mediaState }) => {
    return (
        <div className="h-full overflow-y-auto p-6 scrollbar-thin">
            <h1 className="text-2xl font-bold font-display text-text-primary mb-4">Manage Uploads</h1>
            <div className="mb-6">
                <UploadManager mediaState={mediaState} />
            </div>
            <div>
                <UploadProgressTracker mediaState={mediaState} isStandalonePage={true} />
            </div>
        </div>
    );
};

export default UploadsPage;
