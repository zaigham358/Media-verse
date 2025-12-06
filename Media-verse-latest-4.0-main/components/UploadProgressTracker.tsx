
import React, { useMemo } from 'react';
import { UseMediaStateReturn, UploadTask } from '../types';
import ProgressBar from './ui/ProgressBar';
import { TrashIcon, XIcon, PauseCircleIcon, PlayIcon, CheckIcon, RefreshCwIcon, VideoIcon, ImageIcon, AudioIcon, FileIcon, UploadCloudIcon } from './icons';

interface UploadProgressTrackerProps {
    mediaState: UseMediaStateReturn;
    isStandalonePage?: boolean;
}

const formatSpeed = (bytesPerSec: number | undefined) => {
    if (!bytesPerSec) return '0 KB/s';
    const mb = bytesPerSec / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB/s`;
    return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatTimeRemaining = (bytesTotal: number, progress: number, speed: number) => {
    if (!speed || speed === 0 || progress >= 100) return '';
    const bytesRemaining = bytesTotal - (bytesTotal * (progress / 100));
    const seconds = bytesRemaining / speed;
    
    if (seconds < 60) return `${Math.ceil(seconds)}s remaining`;
    const minutes = Math.ceil(seconds / 60);
    return `${minutes}m remaining`;
};

const FileIconPreview: React.FC<{ file: File, className?: string }> = ({ file, className="w-full h-full" }) => {
    const type = file.type.split('/')[0];
    const [preview, setPreview] = React.useState<string | null>(null);
    
    React.useEffect(() => {
        if (type === 'image' || type === 'video') {
            const url = URL.createObjectURL(file);
            setPreview(url);
            return () => URL.revokeObjectURL(url);
        }
    }, [file, type]);

    if (preview) {
        if (type === 'video') {
            return <video src={preview} className={`${className} object-cover`} muted playsInline />;
        }
        return <img src={preview} alt="" className={`${className} object-cover`} />;
    }

    switch(type) {
        case 'video': return <VideoIcon className={className} />;
        case 'image': return <ImageIcon className={className} />;
        case 'audio': return <AudioIcon className={className} />;
        default: return <FileIcon className={className} />;
    }
};

const UploadProgressTracker: React.FC<UploadProgressTrackerProps> = ({ mediaState, isStandalonePage = false }) => {
    const { uploadTasks, cancelUploadTask, pauseUploadTask, resumeUploadTask, retryUploadTask, removeUploadTask, clearCompletedUploads, pauseAllUploads, resumeAllUploads } = mediaState;

    const activeTasks = useMemo(() => uploadTasks.filter(t => ['processing', 'queued', 'paused'].includes(t.status)), [uploadTasks]);
    const completedTasks = useMemo(() => uploadTasks.filter(t => t.status === 'complete' || t.status === 'error'), [uploadTasks]);
    
    const totalSpeed = useMemo(() => activeTasks.reduce((acc, t) => acc + (t.speed || 0), 0), [activeTasks]);

    if (uploadTasks.length === 0) {
        return (
            <div className={`flex flex-col items-center justify-center h-64 text-text-secondary ${isStandalonePage ? 'mt-8 border-2 border-dashed border-border-color rounded-lg bg-card-bg/30' : 'p-8 text-sm'}`}>
                <UploadCloudIcon className="w-12 h-12 mb-3 opacity-50" />
                <p>No active or recent uploads.</p>
            </div>
        );
    }
    
    const renderTaskCard = (task: UploadTask) => (
        <div key={task.id} className={`group relative bg-card-bg rounded-lg border border-border-color overflow-hidden shadow-sm hover:shadow-md transition-all p-4 flex flex-col`}>
            <div className="flex space-x-4">
                <div className="w-20 h-20 flex-shrink-0 bg-black/20 rounded-md overflow-hidden flex items-center justify-center border border-white/5">
                    <FileIconPreview file={task.file} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="text-text-primary font-semibold truncate mb-1" title={task.file.name}>{task.file.name}</h4>
                    <div className="flex items-center space-x-2 text-xs text-text-secondary mb-2">
                        <span className={`px-2 py-0.5 rounded-full font-medium ${
                            task.status === 'processing' ? 'bg-primary/20 text-primary' :
                            task.status === 'complete' ? 'bg-green-500/20 text-green-400' :
                            task.status === 'error' ? 'bg-red-500/20 text-red-400' :
                            task.status === 'paused' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-gray-500/20 text-gray-400'
                        }`}>
                            {task.status.charAt(0).toUpperCase() + task.status.slice(1)}
                        </span>
                        <span>{formatSize(task.file.size)}</span>
                    </div>
                    {task.status === 'error' && <p className="text-xs text-red-400 truncate">{task.error}</p>}
                </div>
            </div>

            <div className="mt-4">
                 {task.status !== 'complete' && task.status !== 'error' && (
                    <div className="mb-2">
                         <div className="flex justify-between text-xs text-text-secondary mb-1">
                            <span>{task.progress}%</span>
                            <span>{task.status === 'processing' ? formatTimeRemaining(task.file.size, task.progress, task.speed || 0) : '--'}</span>
                        </div>
                        <ProgressBar value={task.progress} className={`h-2 ${task.status === 'paused' ? 'opacity-50' : ''}`} />
                         <div className="flex justify-between text-[10px] text-text-secondary mt-1 uppercase font-medium tracking-wider">
                            <span>{formatSize((task.file.size * task.progress) / 100)} / {formatSize(task.file.size)}</span>
                            <span>{task.status === 'processing' ? formatSpeed(task.speed) : '0 KB/s'}</span>
                        </div>
                    </div>
                )}
                 {task.status === 'complete' && (
                     <div className="flex items-center text-green-400 text-sm font-medium"><CheckIcon className="w-4 h-4 mr-2" /> Upload Complete</div>
                 )}
            </div>

            <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card-bg/80 backdrop-blur-sm rounded-lg p-1">
                 {task.status === 'processing' && (
                    <button onClick={() => pauseUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary" title="Pause">
                        <PauseCircleIcon className="w-5 h-5" />
                    </button>
                )}
                {task.status === 'paused' && (
                    <button onClick={() => resumeUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-primary" title="Resume">
                        <PlayIcon className="w-5 h-5" />
                    </button>
                )}
                {task.status === 'error' && (
                    <button onClick={() => retryUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-primary" title="Retry">
                        <RefreshCwIcon className="w-5 h-5" />
                    </button>
                )}
                 {['processing', 'queued', 'paused', 'error'].includes(task.status) && (
                    <button onClick={() => cancelUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-red-500" title="Cancel">
                        <XIcon className="w-5 h-5" />
                    </button>
                )}
                 {task.status === 'complete' && (
                    <button onClick={() => removeUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary" title="Remove from list">
                        <XIcon className="w-4 h-4" />
                    </button>
                )}
            </div>
        </div>
    );

    if (isStandalonePage) {
        return (
            <div className="flex flex-col h-full space-y-6">
                 {/* Stats Header */}
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <div className="bg-card-bg p-4 rounded-lg border border-border-color flex items-center justify-between">
                         <div>
                             <p className="text-text-secondary text-xs uppercase font-bold">Active Uploads</p>
                             <h3 className="text-2xl font-display font-bold text-text-primary">{activeTasks.length}</h3>
                         </div>
                         <div className="p-3 rounded-full bg-primary/10 text-primary"><UploadCloudIcon className="w-6 h-6"/></div>
                     </div>
                      <div className="bg-card-bg p-4 rounded-lg border border-border-color flex items-center justify-between">
                         <div>
                             <p className="text-text-secondary text-xs uppercase font-bold">Total Speed</p>
                             <h3 className="text-2xl font-display font-bold text-text-primary">{formatSpeed(totalSpeed)}</h3>
                         </div>
                         <div className="p-3 rounded-full bg-green-500/10 text-green-400"><RefreshCwIcon className="w-6 h-6"/></div>
                     </div>
                      <div className="bg-card-bg p-4 rounded-lg border border-border-color flex items-center justify-between">
                         <div>
                             <p className="text-text-secondary text-xs uppercase font-bold">Completed</p>
                             <h3 className="text-2xl font-display font-bold text-text-primary">{completedTasks.length}</h3>
                         </div>
                         <div className="p-3 rounded-full bg-blue-500/10 text-blue-400"><CheckIcon className="w-6 h-6"/></div>
                     </div>
                 </div>
                 
                 {/* Controls */}
                 <div className="flex items-center justify-between bg-sidebar-bg p-3 rounded-lg border border-border-color">
                     <h3 className="font-semibold text-text-primary px-2">Upload Queue</h3>
                     <div className="flex space-x-3">
                         {activeTasks.length > 0 && (
                            <>
                                <button onClick={pauseAllUploads} className="flex items-center space-x-2 px-3 py-1.5 rounded bg-input-bg text-text-secondary hover:text-text-primary hover:bg-white/5 text-sm font-medium transition-colors border border-border-color">
                                    <PauseCircleIcon className="w-4 h-4" /> <span>Pause All</span>
                                </button>
                                <button onClick={resumeAllUploads} className="flex items-center space-x-2 px-3 py-1.5 rounded bg-primary text-white hover:bg-primary/90 text-sm font-medium transition-colors shadow-sm">
                                    <PlayIcon className="w-4 h-4" /> <span>Resume All</span>
                                </button>
                            </>
                        )}
                        {completedTasks.length > 0 && (
                            <button onClick={clearCompletedUploads} className="flex items-center space-x-2 px-3 py-1.5 rounded bg-input-bg text-text-secondary hover:text-red-400 hover:bg-white/5 text-sm font-medium transition-colors border border-border-color">
                                <TrashIcon className="w-4 h-4" /> <span>Clear Completed</span>
                            </button>
                        )}
                     </div>
                 </div>

                 {/* Grid */}
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-10">
                     {uploadTasks.map(renderTaskCard)}
                 </div>
            </div>
        )
    }

    // Original Popover Layout
    return (
        <div className="w-[480px] bg-card-bg rounded-lg shadow-2xl border border-border-color max-h-[600px] flex flex-col">
            <header className="p-4 border-b border-border-color bg-sidebar-bg flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                     <div>
                        <h3 className="font-semibold text-text-primary text-lg">Uploads</h3>
                        <p className="text-xs text-text-secondary">{activeTasks.length} active, {completedTasks.length} completed</p>
                    </div>
                     <div className="flex space-x-2">
                        {activeTasks.length > 0 && (
                            <>
                                <button onClick={pauseAllUploads} className="p-2 rounded-full bg-input-bg hover:bg-white/10 text-text-secondary hover:text-text-primary" title="Pause All">
                                    <PauseCircleIcon className="w-5 h-5" />
                                </button>
                                <button onClick={resumeAllUploads} className="p-2 rounded-full bg-input-bg hover:bg-white/10 text-text-secondary hover:text-text-primary" title="Resume All">
                                    <PlayIcon className="w-5 h-5" />
                                </button>
                            </>
                        )}
                         {completedTasks.length > 0 && (
                            <button onClick={clearCompletedUploads} className="text-xs px-3 py-1.5 rounded bg-input-bg text-text-secondary hover:text-primary hover:bg-white/5 flex items-center transition-colors border border-border-color">
                                <TrashIcon className="w-3 h-3 mr-2" />
                                Clear All
                            </button>
                        )}
                    </div>
                </div>
            </header>
            
            <div className="overflow-y-auto flex-1 p-4 space-y-3">
                {uploadTasks.map(task => (
                    <div key={task.id} className={`group flex items-center p-3 rounded-lg border transition-all ${
                        task.status === 'error' ? 'border-red-500/30 bg-red-500/5' : 
                        task.status === 'complete' ? 'border-green-500/20 bg-green-500/5' :
                        'border-border-color bg-input-bg/30'
                    }`}>
                        {/* Thumbnail */}
                        <div className="w-12 h-12 flex-shrink-0 rounded overflow-hidden bg-black/20 flex items-center justify-center mr-4 border border-white/10">
                            <FileIconPreview file={task.file} />
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 mr-4">
                            <div className="flex justify-between items-center mb-1">
                                <p className="text-sm font-medium text-text-primary truncate" title={task.file.name}>{task.file.name}</p>
                                <span className="text-xs text-text-secondary whitespace-nowrap ml-2">
                                    {task.status === 'processing' ? formatTimeRemaining(task.file.size, task.progress, task.speed || 0) : 
                                     task.status === 'complete' ? 'Done' : 
                                     task.status === 'error' ? 'Failed' : 
                                     task.status}
                                </span>
                            </div>
                            
                            {task.status === 'processing' || task.status === 'paused' || task.status === 'queued' ? (
                                <div className="space-y-1">
                                    <ProgressBar value={task.progress} className={`h-1.5 ${task.status === 'paused' ? 'opacity-50' : ''}`} />
                                    <div className="flex justify-between text-[10px] text-text-secondary uppercase tracking-wider font-medium">
                                        <span>{formatSize(task.file.size)}</span>
                                        <span>{task.status === 'processing' ? formatSpeed(task.speed) : ''}</span>
                                    </div>
                                </div>
                            ) : task.status === 'error' ? (
                                <p className="text-xs text-red-400 truncate">{task.error}</p>
                            ) : (
                                <p className="text-xs text-green-400 flex items-center"><CheckIcon className="w-3 h-3 mr-1"/> Upload Complete</p>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center space-x-1">
                             {task.status === 'processing' && (
                                <button onClick={() => pauseUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary" title="Pause">
                                    <PauseCircleIcon className="w-5 h-5" />
                                </button>
                            )}
                            {task.status === 'paused' && (
                                <button onClick={() => resumeUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-primary" title="Resume">
                                    <PlayIcon className="w-5 h-5" />
                                </button>
                            )}
                            {task.status === 'error' && (
                                <button onClick={() => retryUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-primary" title="Retry">
                                    <RefreshCwIcon className="w-5 h-5" />
                                </button>
                            )}
                             {['processing', 'queued', 'paused', 'error'].includes(task.status) && (
                                <button onClick={() => cancelUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-red-500" title="Cancel">
                                    <XIcon className="w-5 h-5" />
                                </button>
                            )}
                             {task.status === 'complete' && (
                                <button onClick={() => removeUploadTask(task.id)} className="p-1.5 rounded hover:bg-white/10 text-text-secondary hover:text-text-primary" title="Remove from list">
                                    <XIcon className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UploadProgressTracker;
