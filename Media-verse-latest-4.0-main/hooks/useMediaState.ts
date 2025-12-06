import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MediaFile,
  Category,
  FavPart,
  UploadTask,
  AppSettings,
  UseMediaStateReturn,
  MediaType,
  Collection,
  Workspace,
  HistoryEntry,
  MediaFileHistoryUpdate,
  StorageQuota,
} from '../types';
import * as db from '../db';

const UNCATEGORIZED_ID = 'uncategorized';

export const defaultSettings: AppSettings = {
    accentColor: '98 102 241',
    theme: 'vibrant',
    defaultPlayerTheme: 'minimal',
    defaultPlayerLayout: 'floating',
    cardSize: 'medium',
    thumbnailFit: 'contain',
    hoverEffect: 'glow',
    enableAnimations: true,
    animationSpeed: 'normal',
    mediaInteraction: 'singleClickOpen',
    showHoverSelect: true,
    hoverSelectDelay: 0,
    showCardTitle: true,
    showCardRating: true,
    showCardDate: true,
    showCardSize: true,
    showCardResolution: true,
    showCardDuration: true,
    showDetailsPanel: false,
    seekForwardAmount: 5,
    seekBackwardAmount: 5,
    seekForwardMediumAmount: 15,
    seekBackwardMediumAmount: 15,
    seekForwardLongAmount: 60,
    seekBackwardLongAmount: 60,
    defaultPlaybackRate: 1,
    controlsAutoHideDelay: 1,
    videoPlayerGestures: {
        enabled: true,
        sensitivity: 250,
        quadrants: {
            topLeft: { singleClick: 'togglePlay', doubleClick: 'toggleFullscreen', tripleClick: 'speedDown' },
            topRight: { singleClick: 'togglePlay', doubleClick: 'toggleFullscreen', tripleClick: 'speedDown' },
            bottomLeft: { singleClick: 'seekBackwardShort', doubleClick: 'seekBackwardMedium', tripleClick: 'speedDown' },
            bottomRight: { singleClick: 'seekForwardShort', doubleClick: 'seekForwardMedium', tripleClick: 'speedUp' },
        },
    },
    scrollUpAction: 'volumeUp',
    scrollDownAction: 'volumeDown',
    swipeAction: 'seek',
    swipeSensitivity: 1,
    rememberPlaybackPosition: true,
    resumeBehavior: 'ask',
    loopVideo: false,
    autoplayNext: true,
    defaultVideoDisplayMode: 'contain',
    defaultEndAction: 'next',
    playerIconSize: 'md',
    playerUISettings: {
        showTopBar: true,
        showControlsBar: true,
        showScrubber: true,
        alwaysShowScrubber: false,
        showPlayPause: true,
        showVolume: true,
        showTime: true,
        showPlaybackRate: true,
        showABLoopControls: true,
        showFilterControls: true,
        showExtraControls: true,
        showTransformControls: true,
        showLoop: true,
        showClipButton: true,
        showPipButton: true,
        showAspectRatioButton: true,
        showFrameStepButtons: true,
        showFullscreenButton: true,
        showSettingsButton: true,
    },
    videoPlayerContextMenuSettings: {
        view: true, abLoop: true, videoEffects: true, playback: true, video: true, transform: true,
        audio: true, speed: true, fullscreen: true, snapshot: true, pip: true, reload: true,
        copySource: true, close: true, frameStep: true, aspectRatio: true, zoom: true,
    },
    customFilterPresets: [],
    scrubberThickness: 'sm',
    scrubberShape: 'rounded',
    useCustomPlayerAccent: false,
    customPlayerAccentColor: '139 92 246',
    playerFont: 'system',
    playerControlOpacity: 0.8,
    enablePlayerGlassmorphism: true,
    showPlayerControlGradient: true,
    pauseOnSeek: false,
    autoPipOnTabSwitch: false,
    showPlayerTooltips: true,
    centralPlayButtonStyle: 'play',
    timeDisplayFormat: 'standard',
    showUnlinkedClipRange: true,
    feedbackIndicatorStyle: 'both',
    volumeStep: 0.1,
    invertVolumeScroll: false,
    tabSettings: { openLocation: 'nextToActive', defaultTitle: 'Dashboard', warnOnCloseMultiple: true },
    contextMenuSettings: {
      items: { newTab: true, closeTab: true, reopenTab: true, toggleSidebar: true, accentColor: true, viewMode: true, toggleSelection: true, goToUploads: true, reload: true }
    },
    isSidebarCollapsed: false,
    isSidebarVisible: true,
    keyboardShortcuts: {
        newTab: { enabled: true, name: 'New Tab', key: 'Control+T' },
        closeTab: { enabled: true, name: 'Close Tab', key: 'Control+W' },
        reopenTab: { enabled: true, name: 'Reopen Closed Tab', key: 'Ctrl+Shift+T'},
        nextTab: { enabled: true, name: 'Next Tab', key: 'Control+Tab' },
        prevTab: { enabled: true, name: 'Previous Tab', key: 'Ctrl+Shift+Tab' },
        switchToTab1: { enabled: true, name: 'Switch to Tab 1', key: 'Control+1' },
        switchToTab2: { enabled: true, name: 'Switch to Tab 2', key: 'Control+2' },
        switchToTab3: { enabled: true, name: 'Switch to Tab 3', key: 'Control+3' },
        switchToTab4: { enabled: true, name: 'Switch to Tab 4', key: 'Control+4' },
        switchToTab5: { enabled: true, name: 'Switch to Tab 5', key: 'Control+5' },
        switchToTab6: { enabled: true, name: 'Switch to Tab 6', key: 'Control+6' },
        switchToTab7: { enabled: true, name: 'Switch to Tab 7', key: 'Control+7' },
        switchToTab8: { enabled: true, name: 'Switch to Tab 8', key: 'Control+8' },
        switchToTab9: { enabled: true, name: 'Switch to Tab 9', key: 'Control+9' },
        deleteSelection: { enabled: true, name: 'Delete Selection', key: 'Delete' },
        selectAll: { enabled: true, name: 'Select All', key: 'Control+A' },
        clearSelection: { enabled: true, name: 'Clear Selection', key: 'Escape' },
        toggleSidebar: { enabled: true, name: 'Toggle Sidebar Visibility', key: 'Control+B' },
        undo: { enabled: true, name: 'Undo', key: 'Control+Z' },
        redo: { enabled: true, name: 'Redo', key: 'Control+Y' },
    },
    playerKeyboardShortcuts: {
        togglePlay: { key: ' ', name: 'Play / Pause', enabled: true },
        toggleMute: { key: 'm', name: 'Mute / Unmute', enabled: true },
        toggleFullscreen: { key: 'f', name: 'Toggle Fullscreen', enabled: true },
        toggleLoop: { key: 'l', name: 'Toggle Loop', enabled: true },
        volumeUp: { key: 'ArrowUp', name: 'Volume Up', enabled: true },
        volumeDown: { key: 'ArrowDown', name: 'Volume Down', enabled: true },
        seekForwardShort: { key: 'ArrowRight', name: 'Seek Forward (Short)', enabled: true },
        seekBackwardShort: { key: 'ArrowLeft', name: 'Seek Backward (Short)', enabled: true },
        seekForwardMedium: { key: 'Control+ArrowRight', name: 'Seek Forward (Medium)', enabled: true },
        seekBackwardMedium: { key: 'Control+ArrowLeft', name: 'Seek Backward (Medium)', enabled: true },
        seekForwardLong: { key: 'Shift+ArrowRight', name: 'Seek Forward (Long)', enabled: true },
        seekBackwardLong: { key: 'Shift+ArrowLeft', name: 'Seek Backward (Long)', enabled: true },
        speedUp: { key: '>', name: 'Speed Up', enabled: true },
        speedDown: { key: '<', name: 'Speed Down', enabled: true },
        speedReset: { key: '=', name: 'Reset Speed', enabled: true },
        frameForward: { key: '.', name: 'Next Frame', enabled: true },
        frameBackward: { key: ',', name: 'Previous Frame', enabled: true },
        rotateRight: { key: 'r', name: 'Rotate Right', enabled: true },
        rotateLeft: { key: 'Shift+R', name: 'Rotate Left', enabled: true },
        flipHorizontal: { key: 'h', name: 'Flip Horizontal', enabled: true },
        flipVertical: { key: 'v', name: 'Flip Vertical', enabled: true },
        seekTo0: { key: '0', name: 'Seek to 0%', enabled: true },
        seekTo10: { key: '1', name: 'Seek to 10%', enabled: true },
        seekTo20: { key: '2', name: 'Seek to 20%', enabled: true },
        seekTo30: { key: '3', name: 'Seek to 30%', enabled: true },
        seekTo40: { key: '4', name: 'Seek to 40%', enabled: true },
        seekTo50: { key: '5', name: 'Seek to 50%', enabled: true },
        seekTo60: { key: '6', name: 'Seek to 60%', enabled: true },
        seekTo70: { key: '7', name: 'Seek to 70%', enabled: true },
        seekTo80: { key: '8', name: 'Seek to 80%', enabled: true },
        seekTo90: { key: '9', name: 'Seek to 90%', enabled: true },
        addBookmark: { key: 'b', name: 'Add Bookmark', enabled: true },
        nextBookmark: { key: ']', name: 'Next Bookmark', enabled: true },
        prevBookmark: { key: '[', name: 'Previous Bookmark', enabled: true },
        openTimeJump: { key: 'Control+g', name: 'Jump to Time', enabled: true },
    }
};

async function generateContentHash(blob: Blob): Promise<string> {
    const buffer = await blob.slice(0, 1024 * 1024).arrayBuffer(); // Hash first 1MB
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const useMediaState = (): UseMediaStateReturn => {
    const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [collections, setCollections] = useState<Collection[]>([]);
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [favParts, setFavParts] = useState<FavPart[]>([]);
    const [settings, setSettings] = useState<AppSettings | null>(null);
    const [uploadTasks, setUploadTasks] = useState<UploadTask[]>([]);
    const [history, setHistory] = useState<{ past: HistoryEntry[]; future: HistoryEntry[] }>({ past: [], future: [] });
    const [storageQuota, setStorageQuota] = useState<StorageQuota | null>(null);
    
    // Refs for safe access in closures
    const processingQueueRef = useRef<string[]>([]);
    const isProcessingRef = useRef(false);
    const uploadTasksRef = useRef<UploadTask[]>([]);

    useEffect(() => {
        uploadTasksRef.current = uploadTasks;
    }, [uploadTasks]);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            try {
                const [f, c, p, s, col, w] = await Promise.all([
                    db.getAllMediaFiles(),
                    db.getAllCategories(),
                    db.getAllFavParts(),
                    db.getSettings(),
                    db.getAllCollections(),
                    db.getAllWorkspaces()
                ]);
                setMediaFiles(f);
                setCategories(c);
                setFavParts(p);
                setCollections(col);
                setWorkspaces(w);
                setSettings({ ...defaultSettings, ...s });
                updateStorageQuota();
            } catch (e) {
                console.error("Failed to load library:", e);
                setSettings(defaultSettings);
            }
        };
        load();
    }, []);

    const updateStorageQuota = async () => {
        if (navigator.storage && navigator.storage.estimate) {
            const { usage, quota } = await navigator.storage.estimate();
            if (usage && quota) setStorageQuota({ used: usage, quota, percent: (usage / quota) * 100 });
        }
    };

    const updateTask = useCallback((id: string, updates: Partial<UploadTask>) => {
        setUploadTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    }, []);

    // --- Core Logic: Processing Queue ---
    const processQueue = useCallback(async () => {
        if (isProcessingRef.current || processingQueueRef.current.length === 0) return;
        
        isProcessingRef.current = true;
        const taskId = processingQueueRef.current[0];
        
        try {
            // Get current task state from ref to ensure freshness
            const task = uploadTasksRef.current.find(t => t.id === taskId);
            
            // If task was removed or cancelled while in queue
            if (!task || task.status === 'cancelled') {
                processingQueueRef.current.shift();
                isProcessingRef.current = false;
                processQueue();
                return;
            }

            updateTask(taskId, { status: 'processing', progress: 10, stage: 'hashing' });

            const file = task.file;
            let fileType: MediaType | null = null;
            
            // Robust Type Detection
            if (file.type.startsWith('video/')) fileType = 'video';
            else if (file.type.startsWith('image/')) fileType = 'image';
            else if (file.type.startsWith('audio/')) fileType = 'audio';
            
            if (!fileType) {
                const ext = file.name.split('.').pop()?.toLowerCase();
                if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ts', 'flv', 'wmv'].includes(ext || '')) fileType = 'video';
                else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff'].includes(ext || '')) fileType = 'image';
                else if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(ext || '')) fileType = 'audio';
            }

            if (!fileType) throw new Error("Unsupported file type");

            // Generate Hash
            const contentHash = await generateContentHash(file);
            updateTask(taskId, { progress: 30, stage: 'generating_thumb' });
            
            // Generate Metadata & Thumbnail
            let duration: number | undefined;
            let resolution: string | undefined;
            let thumbnail: Blob | undefined;
            let tempUrl = URL.createObjectURL(file);

            try {
                if (fileType === 'video') {
                    const video = document.createElement('video');
                    video.preload = 'metadata';
                    video.muted = true;
                    video.src = tempUrl;
                    
                    await new Promise<void>((resolve) => {
                        const timeout = setTimeout(() => resolve(), 5000); // 5s timeout
                        
                        video.onloadedmetadata = () => {
                            clearTimeout(timeout);
                            duration = video.duration;
                            resolution = `${video.videoWidth}x${video.videoHeight}`;
                            
                            // Seek to capture thumbnail
                            video.currentTime = Math.min(Math.max(1, video.duration * 0.1), 5);
                        };
                        
                        video.onseeked = () => {
                            try {
                                const canvas = document.createElement('canvas');
                                const scale = Math.min(1, 480 / video.videoWidth);
                                canvas.width = video.videoWidth * scale;
                                canvas.height = video.videoHeight * scale;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob(blob => {
                                    if (blob) thumbnail = blob;
                                    resolve();
                                }, 'image/jpeg', 0.7);
                            } catch (e) { resolve(); }
                        };
                        
                        video.onerror = () => { clearTimeout(timeout); resolve(); };
                    });
                } else if (fileType === 'image') {
                    const img = new Image();
                    img.src = tempUrl;
                    await new Promise<void>(resolve => {
                        img.onload = () => {
                            resolution = `${img.width}x${img.height}`;
                            if (file.size > 1024 * 1024) {
                                const canvas = document.createElement('canvas');
                                const scale = Math.min(1, 480 / img.width);
                                canvas.width = img.width * scale;
                                canvas.height = img.height * scale;
                                const ctx = canvas.getContext('2d');
                                ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
                                canvas.toBlob(blob => { if(blob) thumbnail = blob; resolve(); }, 'image/jpeg', 0.7);
                            } else {
                                thumbnail = file;
                                resolve();
                            }
                        };
                        img.onerror = () => resolve();
                    });
                } else if (fileType === 'audio') {
                    const audio = document.createElement('audio');
                    audio.src = tempUrl;
                    await new Promise<void>(resolve => {
                        audio.onloadedmetadata = () => { duration = audio.duration; resolve(); };
                        audio.onerror = () => resolve();
                    });
                }
            } catch (e) {
                console.warn("Metadata extraction failed, proceeding without it", e);
            } finally {
                URL.revokeObjectURL(tempUrl);
            }

            updateTask(taskId, { progress: 80, stage: 'saving' });

            // Construct MediaFile
            const newFile: MediaFile = {
                id: crypto.randomUUID(),
                type: fileType as MediaType,
                title: file.name.replace(/\.[^/.]+$/, ""),
                category: UNCATEGORIZED_ID,
                isFavorite: false,
                rating: 0,
                createdAt: Date.now(),
                contentHash,
                metadata: {
                    size: file.size,
                    duration: (typeof duration === 'number' && isFinite(duration)) ? duration : undefined,
                    resolution
                }
            };

            // Save to DB (Full Persistence)
            await db.addMediaFile(newFile, file, thumbnail);
            
            // Update Global State
            setMediaFiles(prev => [newFile, ...prev]);
            updateTask(taskId, { status: 'complete', progress: 100, stage: 'done' });
            updateStorageQuota();

        } catch (error) {
            console.error("Processing failed:", error);
            updateTask(taskId, { status: 'error', progress: 0, error: "Failed to process file" });
        } finally {
            // Move queue
            processingQueueRef.current.shift();
            isProcessingRef.current = false;
            processQueue(); // Process next
        }
    }, [UNCATEGORIZED_ID, updateTask]);

    // Trigger queue processing when new tasks are added
    useEffect(() => {
        const pending = uploadTasks.filter(t => t.status === 'queued');
        if (pending.length > 0) {
            // Add pending tasks to queue if not present
            let added = false;
            pending.forEach(t => {
                if (!processingQueueRef.current.includes(t.id)) {
                    processingQueueRef.current.push(t.id);
                    added = true;
                }
            });
            if (added && !isProcessingRef.current) processQueue();
        }
    }, [uploadTasks, processQueue]);


    const addUploadTasks = useCallback((files: FileList | File[]) => {
        const fileArray = Array.isArray(files) ? files : Array.from(files);
        const newTasks: UploadTask[] = fileArray.map(file => ({
            id: crypto.randomUUID(),
            file,
            status: 'queued',
            progress: 0,
            speed: 0
        }));
        setUploadTasks(prev => [...prev, ...newTasks]);
    }, []);

    // --- CRUD Operations Wrappers ---
    
    const addMediaFile = async (meta: MediaFile, src: Blob, thumb?: Blob) => {
        await db.addMediaFile(meta, src, thumb);
        setMediaFiles(prev => [meta, ...prev]);
    };

    const updateMediaFile = async (updated: MediaFile) => {
        await db.updateMediaFileMeta(updated);
        setMediaFiles(prev => prev.map(f => f.id === updated.id ? updated : f));
    };

    const updateMediaFiles = async (updates: {id: string, changes: Partial<MediaFile>}[]) => {
        await db.updateMediaFilesMeta(updates);
        setMediaFiles(prev => prev.map(f => {
            const update = updates.find(u => u.id === f.id);
            return update ? { ...f, ...update.changes } : f;
        }));
    };

    const deleteMediaFile = async (id: string) => {
        await db.deleteMediaFile(id);
        setMediaFiles(prev => prev.filter(f => f.id !== id));
        updateStorageQuota();
    };

    const deleteMediaFiles = async (ids: string[]) => {
        await Promise.all(ids.map(id => db.deleteMediaFile(id)));
        setMediaFiles(prev => prev.filter(f => !ids.includes(f.id)));
        updateStorageQuota();
    };

    // ... Other simple wrappers for Categories, Collections, Workspaces ...
    const addCategory = async (name: string) => {
        const cat = { id: crypto.randomUUID(), name, order: categories.length };
        await db.addCategory(cat);
        setCategories(prev => [...prev, cat]);
        return cat;
    };
    const updateCategory = async (id: string, up: Partial<Category>) => {
        const cat = categories.find(c => c.id === id);
        if (cat) {
            const newCat = { ...cat, ...up };
            await db.updateCategory(newCat);
            setCategories(prev => prev.map(c => c.id === id ? newCat : c));
        }
    };
    const deleteCategory = async (id: string) => {
        await db.deleteCategory(id);
        setCategories(prev => prev.filter(c => c.id !== id));
    };
    const updateCategoryOrder = async (cats: Category[]) => {
        const ordered = cats.map((c, i) => ({ ...c, order: i }));
        await db.updateAllCategories(ordered);
        setCategories(ordered);
    };
    const mergeCategories = async (src: string, tgt: string) => {
        const toMove = mediaFiles.filter(f => f.category === src);
        if (toMove.length) await updateMediaFiles(toMove.map(f => ({ id: f.id, changes: { category: tgt } })));
        await deleteCategory(src);
    };

    const addCollection = async (c: Omit<Collection, 'id'>) => {
        const col = { ...c, id: crypto.randomUUID() };
        await db.putCollection(col);
        setCollections(prev => [...prev, col]);
    };
    const updateCollection = async (c: Collection) => {
        await db.putCollection(c);
        setCollections(prev => prev.map(x => x.id === c.id ? c : x));
    };
    const deleteCollection = async (id: string) => {
        await db.deleteCollection(id);
        setCollections(prev => prev.filter(c => c.id !== id));
    };

    const addWorkspace = async (w: Omit<Workspace, 'id'>) => {
        const work = { ...w, id: crypto.randomUUID() };
        await db.putWorkspace(work);
        setWorkspaces(prev => [...prev, work]);
    };
    const updateWorkspace = async (w: Workspace) => {
        await db.putWorkspace(w);
        setWorkspaces(prev => prev.map(x => x.id === w.id ? w : x));
    };
    const deleteWorkspace = async (id: string) => {
        await db.deleteWorkspace(id);
        setWorkspaces(prev => prev.filter(x => x.id !== id));
    };

    const addFavPart = async (p: Omit<FavPart, 'id'>) => {
        const part = { ...p, id: crypto.randomUUID() };
        await db.addFavPart(part);
        setFavParts(prev => [part, ...prev]);
    };
    const updateFavPart = async (p: FavPart) => {
        await db.addFavPart(p);
        setFavParts(prev => prev.map(x => x.id === p.id ? p : x));
    };
    const deleteFavPart = async (id: string) => {
        await db.deleteFavPart(id);
        setFavParts(prev => prev.filter(x => x.id !== id));
    };

    const clearCompletedUploads = () => setUploadTasks(prev => prev.filter(t => t.status === 'processing' || t.status === 'queued' || t.status === 'paused'));

    const updateSettings = async (s: Partial<AppSettings>) => {
        setSettings(prev => {
            const next = { ...(prev || defaultSettings), ...s };
            db.saveSettings(next);
            return next;
        });
    };

    const clearAllData = async () => {
        await db.clearAllData();
        setMediaFiles([]);
        setCategories([]);
        setCollections([]);
        setFavParts([]);
        setWorkspaces([]);
        setSettings(defaultSettings);
    };
    const clearMediaAndClips = async () => {
        await db.clearMediaAndClips();
        setMediaFiles([]); setFavParts([]);
    };
    const clearCategories = async () => {
        await db.clearCategories();
        setCategories([]);
    };
    const resetSettings = async () => {
        await db.saveSettings(defaultSettings);
        setSettings(defaultSettings);
    };

    // Task management stubs or implementations
    const pauseUploadTask = (id: string) => updateTask(id, { status: 'paused' });
    const resumeUploadTask = (id: string) => updateTask(id, { status: 'queued' });
    const retryUploadTask = (id: string) => updateTask(id, { status: 'queued', error: undefined });
    const cancelUploadTask = (id: string) => setUploadTasks(prev => prev.filter(t => t.id !== id));
    const removeUploadTask = (id: string) => setUploadTasks(prev => prev.filter(t => t.id !== id));
    const pauseAllUploads = () => setUploadTasks(prev => prev.map(t => t.status === 'processing' || t.status === 'queued' ? { ...t, status: 'paused' } : t));
    const resumeAllUploads = () => setUploadTasks(prev => prev.map(t => t.status === 'paused' ? { ...t, status: 'queued' } : t));

    const undo = async () => {}; 
    const redo = async () => {};

    return {
        mediaFiles, categories, collections, workspaces, favParts, uploadTasks, settings, UNCATEGORIZED_ID, storageQuota,
        addMediaFile, updateMediaFile, deleteMediaFile, deleteMediaFiles, updateMediaFiles,
        addCategory, updateCategory, deleteCategory, updateCategoryOrder, mergeCategories,
        addCollection, updateCollection, deleteCollection,
        addWorkspace, updateWorkspace, deleteWorkspace,
        addFavPart, updateFavPart, deleteFavPart,
        addUploadTasks, pauseUploadTask, resumeUploadTask, cancelUploadTask, retryUploadTask, removeUploadTask, clearCompletedUploads, pauseAllUploads, resumeAllUploads,
        updateSettings, clearAllData, clearMediaAndClips, clearCategories, resetSettings,
        undo, redo, canUndo: false, canRedo: false
    };
};

export default useMediaState;