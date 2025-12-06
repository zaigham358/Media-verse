import React, { useState, useEffect, useCallback, useMemo } from 'react';
import useMediaState from './hooks/useMediaState';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import AIAssistant from './components/AIAssistant';
import FavPartsList from './components/FavPartsList';
import Favorites from './components/Favorites';
import UploadsPage from './components/UploadsPage';
import VideoPlayer from './components/VideoPlayer';
import ImageViewer from './components/ImageViewer';
import SettingsDialog from './components/SettingsDialog';
import TabBar from './components/TabBar';
import ContextMenu from './components/ContextMenu';
import MediaCardContextMenu from './components/MediaCardContextMenu';
import VideoPlayerContextMenu from './components/VideoPlayerContextMenu';
import GridPlayer from './components/grid-player/GridPlayer';
import ManageCollectionsDialog from './components/ManageCollectionsDialog';
import SaveWorkspaceDialog from './components/SaveWorkspaceDialog';
import GlobalDropZone from './components/GlobalDropZone';
import { MediaFile, FavPart, View, Tab, AppSettings, PlayerState, Workspace, CollectionRule, Collection } from './types';
import { getMediaFileSrc, getPlaybackPosition } from './db';

const getDefaultPlayerState = (settings: AppSettings): PlayerState => ({
  currentTime: 0,
  isPlaying: false,
  volume: 1,
  isMuted: false,
  playbackRate: settings.defaultPlaybackRate,
  isPip: false,
  displayMode: settings.defaultVideoDisplayMode,
  zoom: 1.0,
  rotation: 0, flipH: false, flipV: false,
  playerTheme: settings.defaultPlayerTheme,
  playerLayout: settings.defaultPlayerLayout,
  abLoop: { start: null, end: null, active: false },
  effects: { brightness: 1, contrast: 1, saturate: 1, grayscale: false, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: false },
  bookmarks: [],
  skipSilence: false,
  keyframeSeeking: false,
  endAction: settings.defaultEndAction ?? 'next',
});

// Helper for filtering files (Reused logic from Dashboard)
const applyRule = (file: MediaFile, rule: CollectionRule): boolean => {
    const { field, operator, value } = rule;
    let fileValue: any = field.startsWith('metadata.') 
        ? file.metadata[field.substring(9) as keyof MediaFile['metadata']] 
        : file[field as keyof MediaFile];

    if (fileValue === undefined) return false;
    const ruleValue = typeof fileValue === 'number' ? Number(value) : value;

    switch(operator) {
        case 'gte': return fileValue >= ruleValue;
        case 'gt': return fileValue > ruleValue;
        case 'lte': return fileValue <= ruleValue;
        case 'lt': return fileValue < ruleValue;
        case 'eq': return fileValue === ruleValue;
        case 'neq': return fileValue !== ruleValue;
        case 'contains': 
            return typeof fileValue === 'string' && typeof ruleValue === 'string' && fileValue.toLowerCase().includes(ruleValue.toLowerCase());
        default: return false;
    }
}

const getFilteredFiles = (mediaFiles: MediaFile[], activeTab: Tab, collections: Collection[], UNCATEGORIZED_ID: string): MediaFile[] => {
    const { activeCategoryId, activeCollectionId, searchQuery, filterType, sortOption } = activeTab;
    let files: MediaFile[] = [];

    const activeCollection = collections.find(c => c.id === activeCollectionId);

    if (activeCollection) {
        if (activeCollection.type === 'smart' && activeCollection.rules) {
            files = mediaFiles.filter(file => activeCollection.rules!.every(rule => applyRule(file, rule)));
        } else if (activeCollection.type === 'manual' && activeCollection.mediaIds) {
            const mediaIdSet = new Set(activeCollection.mediaIds);
            files = mediaFiles.filter(file => mediaIdSet.has(file.id));
        }
    } else {
        files = mediaFiles.filter(file => {
            if (activeCategoryId !== 'all' && (file.category || UNCATEGORIZED_ID) !== activeCategoryId) return false;
            return true;
        });
    }
    
    // Apply global filters
    files = files.filter(file => {
      if (filterType === 'shorts') {
          if (file.type !== 'video') return false;
          if (!file.metadata.resolution) return false;
          const [w, h] = file.metadata.resolution.split('x').map(Number);
          if (isNaN(w) || isNaN(h) || w >= h) return false;
      } else if (filterType !== 'all' && file.type !== filterType) {
          return false;
      }
      if (searchQuery && !file.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    });

    const [key, direction] = sortOption.split('-') as [keyof MediaFile | 'size' | 'rating' | 'duration', 'asc' | 'desc'];
    files.sort((a, b) => {
      let valA, valB;
      if (key === 'size') { valA = a.metadata.size; valB = b.metadata.size; } 
      else if (key === 'rating') { valA = a.rating; valB = b.rating; }
      else if (key === 'duration') { valA = a.metadata.duration ?? 0; valB = b.metadata.duration ?? 0; }
      else { valA = a[key]; valB = b[key]; }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });

    return files;
  };


const createNewTab = (settings: AppSettings, view: View = 'dashboard'): Tab => ({
  id: crypto.randomUUID(),
  title: settings.tabSettings.defaultTitle,
  view,
  activeCategoryId: 'all',
  activeCollectionId: null,
  dashboardView: 'files',
  viewingState: null,
  searchQuery: '',
  aiSearchFilters: null,
  filterType: 'all',
  sortOption: 'createdAt-desc',
  viewMode: 'grid',
  selectedFileIds: [],
  focusedFileId: null,
  isPinned: false,
  isMuted: false,
  playerState: getDefaultPlayerState(settings),
  renamingFileId: null,
});

function App() {
  const mediaState = useMediaState();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManageCollectionsOpen, setIsManageCollectionsOpen] = useState(false);
  const [isSaveWorkspaceOpen, setIsSaveWorkspaceOpen] = useState(false);
  const [editingCollectionId, setEditingCollectionId] = useState<string | null>(null);
  const [settingsTargetTab, setSettingsTargetTab] = useState('General');
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId?: string } | null>(null);
  const [mediaCardContextMenu, setMediaCardContextMenu] = useState<{ x: number, y: number, file: MediaFile } | null>(null);
  const [videoPlayerContextMenu, setVideoPlayerContextMenu] = useState<{ x: number, y: number, file: MediaFile } | null>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [recentlyClosedTabs, setRecentlyClosedTabs] = useState<Tab[]>([]);
  const [closingFileId, setClosingFileId] = useState<string | null>(null);
  
  const activeTab = tabs.find(t => t.id === activeTabId);

  // Calculate current playlist based on active tab view
  const currentPlaylist = useMemo(() => {
      if (!activeTab || !mediaState.mediaFiles) return [];
      if (activeTab.view === 'favorites') {
          return mediaState.mediaFiles.filter(f => f.isFavorite);
      }
      if (activeTab.view === 'dashboard') {
          return getFilteredFiles(mediaState.mediaFiles, activeTab, mediaState.collections, mediaState.UNCATEGORIZED_ID);
      }
      return [];
  }, [activeTab, mediaState.mediaFiles, mediaState.collections, mediaState.UNCATEGORIZED_ID]);


  const handleOpenManageCollections = (id?: string) => {
    setEditingCollectionId(id || null);
    setIsManageCollectionsOpen(true);
  };

  // Initialize first tab and sidebar state
  useEffect(() => {
    if (mediaState.settings) {
      if (tabs.length === 0) {
        const firstTab = createNewTab(mediaState.settings);
        setTabs([firstTab]);
        setActiveTabId(firstTab.id);
      }
      setIsSidebarCollapsed(mediaState.settings.isSidebarCollapsed);
    }
  }, [tabs.length, mediaState.settings]);

  // Update tab title when viewing state changes
  useEffect(() => {
    if (activeTab?.viewingState && activeTab.title !== activeTab.viewingState.file.title) {
        updateActiveTab({ title: activeTab.viewingState.file.title });
    } else if (activeTab && !activeTab.viewingState && (activeTab.view === 'dashboard' || activeTab.view === 'favorites') && (activeTab.title.startsWith('file:'))) {
        let defaultTitle = 'Dashboard';
        if (activeTab.view === 'favorites') defaultTitle = 'Favorites';
        updateActiveTab({ title: defaultTitle });
    }
  }, [activeTab?.viewingState, activeTab?.id, activeTab?.view, mediaState.settings]);

  // Apply dynamic theme
  useEffect(() => {
    if (mediaState.settings?.theme) {
      document.documentElement.setAttribute('data-theme', mediaState.settings.theme);
    }
    if (mediaState.settings?.accentColor) {
      document.documentElement.style.setProperty('--color-primary', mediaState.settings.accentColor);
    } else {
      document.documentElement.style.removeProperty('--color-primary');
    }
  }, [mediaState.settings?.theme, mediaState.settings?.accentColor]);


  // Handle loading the media source for the player/viewer
  useEffect(() => {
    const viewingState = activeTab?.viewingState;
    let isCancelled = false;

    const loadMediaSource = async () => {
      if (viewingState) {
        let resumeFrom: number | undefined = undefined;
        if (mediaState.settings?.rememberPlaybackPosition && (viewingState.file.type === 'video' || viewingState.file.type === 'audio') && !viewingState.clip) {
            const savedPosition = await getPlaybackPosition(viewingState.file.id);
            if (savedPosition && savedPosition > 5) {
                resumeFrom = savedPosition;
            }
        }
        
        updateActiveTab({
            playerState: {
                ...activeTab.playerState,
                isPlaying: true,
                currentTime: 0,
                resumeFrom: resumeFrom,
                // Reset clip-specific state when file changes, but keep user prefs
                bookmarks: [], 
            }
        });
        
        try {
            const srcData = await getMediaFileSrc(viewingState.file.id);
            if (srcData && !isCancelled) {
              const newSrc = URL.createObjectURL(srcData);
              setViewerSrc(prevSrc => {
                if (prevSrc) URL.revokeObjectURL(prevSrc);
                return newSrc;
              });
            } else if (!srcData) {
                // Handle case where blob is missing
                console.error("Media source not found for ID:", viewingState.file.id);
            }
        } catch(e) {
            console.error("Failed to load media source", e);
        }
      } else {
        setViewerSrc(prevSrc => {
            if (prevSrc) URL.revokeObjectURL(prevSrc);
            return null;
        });
      }
    };

    loadMediaSource();

    return () => {
      isCancelled = true;
    };
  }, [activeTab?.viewingState?.file.id]); // Re-run only when file ID changes
  
  // Clean up viewerSrc on final unmount
  useEffect(() => {
    return () => {
        if(viewerSrc) {
            URL.revokeObjectURL(viewerSrc);
        }
    }
  }, [viewerSrc]);


  const updateActiveTab = useCallback((updates: Partial<Omit<Tab, 'id'>>) => {
    setTabs(currentTabs => currentTabs.map(t =>
      t.id === activeTabId ? { ...t, ...updates } : t
    ));
  }, [activeTabId]);
  
  const handleNewTab = useCallback((view: View = 'dashboard') => {
    if (!mediaState.settings) return;
    const newTab = createNewTab(mediaState.settings, view);
    
    if (mediaState.settings.tabSettings.openLocation === 'nextToActive' && activeTabId) {
        const activeIndex = tabs.findIndex(t => t.id === activeTabId);
        const newTabs = [...tabs];
        newTabs.splice(activeIndex + 1, 0, newTab);
        setTabs(newTabs);
    } else {
        setTabs([...tabs, newTab]);
    }

    setActiveTabId(newTab.id);
  }, [tabs, activeTabId, mediaState.settings]);
  
  const handleCloseTab = useCallback((tabIdToClose: string) => {
    const tabToClose = tabs.find(t => t.id === tabIdToClose);
    if(tabToClose) {
        setRecentlyClosedTabs(prev => [tabToClose, ...prev].slice(0, 10)); // Keep last 10
    }

    const tabIndex = tabs.findIndex(t => t.id === tabIdToClose);
    const newTabs = tabs.filter(t => t.id !== tabIdToClose);
    
    if (newTabs.length === 0 && mediaState.settings) {
        const newTab = createNewTab(mediaState.settings);
        setTabs([newTab]);
        setActiveTabId(newTab.id);
        return;
    }

    if (activeTabId === tabIdToClose) {
        const newActiveIndex = Math.max(0, tabIndex - 1);
        setActiveTabId(newTabs[newActiveIndex].id);
    }
    setTabs(newTabs);
  }, [tabs, activeTabId, mediaState.settings]);

  const handleReopenTab = useCallback(() => {
    if (recentlyClosedTabs.length > 0) {
        const [tabToReopen, ...remaining] = recentlyClosedTabs;
        setTabs(prev => [...prev, tabToReopen]);
        setActiveTabId(tabToReopen.id);
        setRecentlyClosedTabs(remaining);
    }
  }, [recentlyClosedTabs]);

  const handleNextTab = useCallback(() => {
      if (tabs.length < 2) return;
      const activeIndex = tabs.findIndex(t => t.id === activeTabId);
      const nextIndex = (activeIndex + 1) % tabs.length;
      setActiveTabId(tabs[nextIndex].id);
  }, [tabs, activeTabId]);

  const handlePrevTab = useCallback(() => {
      if (tabs.length < 2) return;
      const activeIndex = tabs.findIndex(t => t.id === activeTabId);
      const prevIndex = (activeIndex - 1 + tabs.length) % tabs.length;
      setActiveTabId(tabs[prevIndex].id);
  }, [tabs, activeTabId]);

  const handleSwitchToTabIndex = useCallback((index: number) => {
      if (index >= 0 && index < tabs.length) {
          setActiveTabId(tabs[index].id);
      }
  }, [tabs]);
  
  const toggleSidebarVisibility = useCallback(() => {
    if(mediaState.settings) {
        mediaState.updateSettings({ isSidebarVisible: !mediaState.settings.isSidebarVisible });
    }
  }, [mediaState.settings, mediaState.updateSettings]);

  // Keyboard Shortcuts
  useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
          const shortcuts = mediaState.settings?.keyboardShortcuts;
          if (!shortcuts || isSettingsOpen) return;

          const key = e.key === ' ' ? ' ' : (e.ctrlKey || e.metaKey ? `Control+${e.key.toUpperCase()}` : (e.shiftKey ? `Shift+${e.key.toUpperCase()}` : e.key.toUpperCase()));

          const actionEntry = (Object.entries(shortcuts) as [keyof typeof shortcuts, { key: string, enabled: boolean }][]).find(
            ([_action, shortcut]) => shortcut.enabled && shortcut.key.toUpperCase() === key.replace('CONTROL', 'CTRL/CMD')
          );
          
          if(!actionEntry) return;
          const action = actionEntry[0];

          if(action === 'newTab') { e.preventDefault(); handleNewTab(); }
          else if(action === 'closeTab') { e.preventDefault(); if (activeTabId) handleCloseTab(activeTabId); }
          else if(action === 'reopenTab') { e.preventDefault(); handleReopenTab(); }
          else if(action === 'nextTab') { e.preventDefault(); handleNextTab(); }
          else if(action === 'prevTab') { e.preventDefault(); handlePrevTab(); }
          else if(action === 'toggleSidebar') { e.preventDefault(); toggleSidebarVisibility(); }
          else if(action === 'undo') { e.preventDefault(); mediaState.undo(); }
          else if(action === 'redo') { e.preventDefault(); mediaState.redo(); }
          else if(action.startsWith('switchToTab')) {
              e.preventDefault();
              const num = parseInt(action.replace('switchToTab', ''), 10);
              const tabIndex = num === 9 ? tabs.length - 1 : num - 1;
              handleSwitchToTabIndex(tabIndex);
          }
      };

      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mediaState.settings, handleNewTab, handleCloseTab, activeTabId, handleNextTab, handlePrevTab, handleSwitchToTabIndex, tabs.length, isSettingsOpen, handleReopenTab, toggleSidebarVisibility, mediaState.undo, mediaState.redo]);

  const handleDuplicateTab = (tabId: string) => {
    const tabToDuplicate = tabs.find(t => t.id === tabId);
    if (tabToDuplicate) {
        const newTab = { ...tabToDuplicate, id: crypto.randomUUID() };
        handleNewTab(); // Creates a tab respecting settings, then we just overwrite it
        setTabs(currentTabs => currentTabs.map(t => t.id === newTab.id ? newTab : t));
    }
  }

  const openFileInNewTab = (file: MediaFile) => {
    if (!mediaState.settings) return;
    const newTab = {
        ...createNewTab(mediaState.settings),
        viewingState: { file },
        title: file.title,
    };
    
    const newTabs = [...tabs];
    if (mediaState.settings.tabSettings.openLocation === 'nextToActive' && activeTabId) {
        const activeIndex = tabs.findIndex(t => t.id === activeTabId);
        newTabs.splice(activeIndex + 1, 0, newTab);
    } else {
        newTabs.push(newTab);
    }
    setTabs(newTabs);
    setActiveTabId(newTab.id);
}

  const handleCloseOthers = (tabIdToKeep: string) => {
      const tabToKeep = tabs.find(t => t.id === tabIdToKeep);
      if (tabToKeep) {
          setTabs([tabToKeep]);
          setActiveTabId(tabIdToKeep);
      }
  };

  const handleCloseRight = (tabId: string) => {
      const tabIndex = tabs.findIndex(t => t.id === tabId);
      if (tabIndex > -1) {
          const newTabs = tabs.slice(0, tabIndex + 1);
          setTabs(newTabs);
          if (!newTabs.find(t => t.id === activeTabId)) {
              setActiveTabId(tabId);
          }
      }
  };
    
    // New Advanced Tab Handlers
  const handleReorderTabs = useCallback((draggedId: string, targetId: string) => {
      setTabs(currentTabs => {
          const draggedIndex = currentTabs.findIndex(t => t.id === draggedId);
          const targetIndex = currentTabs.findIndex(t => t.id === targetId);
          if (draggedIndex === -1 || targetIndex === -1) return currentTabs;

          const newTabs = [...currentTabs];
          const [draggedItem] = newTabs.splice(draggedIndex, 1);
          newTabs.splice(targetIndex, 0, draggedItem);
          return newTabs;
      });
  }, []);

  const handlePinTab = useCallback((tabId: string) => {
      setTabs(currentTabs => {
          const tab = currentTabs.find(t => t.id === tabId);
          if (!tab) return currentTabs;
          const updatedTab = { ...tab, isPinned: !tab.isPinned };
          const otherTabs = currentTabs.filter(t => t.id !== tabId);
          const newTabs = [...otherTabs, updatedTab];
          // Sort to bring pinned tabs to the front
          newTabs.sort((a, b) => (a.isPinned === b.isPinned) ? 0 : a.isPinned ? -1 : 1);
          return newTabs;
      });
  }, []);

  const handleRenameTab = useCallback((tabId: string, newTitle: string) => {
      setTabs(currentTabs => currentTabs.map(t => t.id === tabId ? { ...t, title: newTitle } : t));
  }, []);

  const handleMuteTab = useCallback((tabId: string) => {
      setTabs(currentTabs => currentTabs.map(t => t.id === tabId ? { ...t, isMuted: !t.isMuted } : t));
  }, []);
  
  const handleMoveTabToStart = useCallback((tabId: string) => {
      setTabs(currentTabs => {
          const tabToMove = currentTabs.find(t => t.id === tabId);
          if (!tabToMove) return currentTabs;
          const otherTabs = currentTabs.filter(t => t.id !== tabId);
          return [tabToMove, ...otherTabs];
      });
  }, []);
  
  const handleMoveTabToEnd = useCallback((tabId: string) => {
      setTabs(currentTabs => {
          const tabToMove = currentTabs.find(t => t.id === tabId);
          if (!tabToMove) return currentTabs;
          const otherTabs = currentTabs.filter(t => t.id !== tabId);
          return [...otherTabs, tabToMove];
      });
  }, []);
  
  const handleCloseTabsToLeft = useCallback((tabId: string) => {
      setTabs(currentTabs => {
          const tabIndex = currentTabs.findIndex(t => t.id === tabId);
          if (tabIndex === -1) return currentTabs;
          return currentTabs.slice(tabIndex);
      });
  }, []);

  const handleAddToGridPlayer = useCallback((filesToAdd: MediaFile[]) => {
    if (!mediaState.settings) return;
    
    const videoFiles = filesToAdd.filter(f => f.type === 'video');
    if (videoFiles.length === 0) return;

    const newCells = videoFiles.map(file => ({ id: crypto.randomUUID(), file }));

    let gridPlayerTab = tabs.find(t => t.view === 'grid_player');
    let gridPlayerTabId: string;

    if (gridPlayerTab) {
        gridPlayerTabId = gridPlayerTab.id;
        setTabs(currentTabs => currentTabs.map(t => {
            if (t.id === gridPlayerTabId) {
                const existingCells = t.gridPlayerState?.cells || [];
                // Avoid adding duplicates
                const cellsToAdd = newCells.filter(nc => !existingCells.some(ec => ec.file.id === nc.file.id));
                const updatedCells = [...existingCells, ...cellsToAdd];
                return {
                    ...t,
                    gridPlayerState: {
                        ...t.gridPlayerState,
                        cells: updatedCells,
                        layout: updatedCells.length > 1 ? '2x2' : '1x1',
                        soloAudioCellId: t.gridPlayerState?.soloAudioCellId ?? updatedCells[0]?.id ?? null,
                    }
                };
            }
            return t;
        }));
    } else {
        const newTab = createNewTab(mediaState.settings, 'grid_player');
        gridPlayerTabId = newTab.id;
        newTab.title = "Grid Player";
        newTab.gridPlayerState = {
            layout: newCells.length > 1 ? '2x2' : '1x1',
            cells: newCells,
            isSyncActive: true,
            soloAudioCellId: newCells[0]?.id ?? null,
        };

        if (mediaState.settings.tabSettings.openLocation === 'nextToActive' && activeTabId) {
            const activeIndex = tabs.findIndex(t => t.id === activeTabId);
            const newTabs = [...tabs];
            newTabs.splice(activeIndex + 1, 0, newTab);
            setTabs(newTabs);
        } else {
            setTabs(currentTabs => [...currentTabs, newTab]);
        }
    }

    setActiveTabId(gridPlayerTabId);

  }, [mediaState.settings, tabs, activeTabId]);

  const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      setContextMenu({ x: e.clientX, y: e.clientY });
  }

  const handleMediaCardContextMenu = useCallback((event: React.MouseEvent, file: MediaFile) => {
    event.preventDefault();
    event.stopPropagation();
    setMediaCardContextMenu({ x: event.clientX, y: event.clientY, file });
  }, []);
  
  const handleVideoPlayerContextMenu = useCallback((event: React.MouseEvent, file: MediaFile) => {
    event.preventDefault();
    event.stopPropagation();
    // Close other menus when opening a new one
    setContextMenu(null);
    setMediaCardContextMenu(null);
    setVideoPlayerContextMenu({ x: event.clientX, y: event.clientY, file });
  }, []);

  const toggleSidebarCollapse = () => {
      const newState = !isSidebarCollapsed;
      setIsSidebarCollapsed(newState);
      mediaState.updateSettings({ isSidebarCollapsed: newState });
  };

  const openSettings = (targetTab = 'General') => {
      setSettingsTargetTab(targetTab);
      setIsSettingsOpen(true);
  }

  const handleSaveWorkspace = (name: string) => {
    if (mediaState.settings) {
        const workspaceState = {
            tabs: tabs,
            activeTabId: activeTabId,
            isSidebarCollapsed: isSidebarCollapsed,
            isSidebarVisible: mediaState.settings.isSidebarVisible,
        };
        mediaState.addWorkspace({ name, state: workspaceState });
    }
  };

  const handleLoadWorkspace = (workspace: Workspace) => {
    setTabs(workspace.state.tabs);
    setActiveTabId(workspace.state.activeTabId);
    setIsSidebarCollapsed(workspace.state.isSidebarCollapsed);
    mediaState.updateSettings({
        isSidebarCollapsed: workspace.state.isSidebarCollapsed,
        isSidebarVisible: workspace.state.isSidebarVisible,
    });
  };

  if (!mediaState.settings || !activeTab) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-app-bg text-text-primary">
        Loading library...
      </div>
    );
  }

  const closeViewer = () => {
      if (activeTab.viewingState?.file.id) {
          const fileId = activeTab.viewingState.file.id;
          setClosingFileId(fileId);
          updateActiveTab({
              viewingState: null,
              selectedFileIds: [fileId],
              focusedFileId: fileId
          });
          setTimeout(() => setClosingFileId(null), 2000); // Clear after animation
      } else {
          updateActiveTab({ viewingState: null });
      }
  }

  const updatePlayerState = (state: PlayerState) => {
    updateActiveTab({ playerState: state });
  };
  
  const renderViewContent = () => {
    switch (activeTab.view) {
      case 'dashboard':
        return <Dashboard mediaState={mediaState} activeTab={activeTab} updateActiveTab={updateActiveTab} onContextMenu={handleMediaCardContextMenu} onAddToGridPlayer={handleAddToGridPlayer} />;
      case 'ai_assistant':
        return <AIAssistant mediaState={mediaState} />;
      case 'fav_parts':
        return <FavPartsList mediaState={mediaState} setViewingState={(s) => updateActiveTab({ viewingState: s })} />;
      case 'favorites':
        return <Favorites mediaState={mediaState} activeTab={activeTab} updateActiveTab={updateActiveTab} onContextMenu={handleMediaCardContextMenu} closingFileId={closingFileId} />;
      case 'uploads':
        return <UploadsPage mediaState={mediaState} />;
      case 'grid_player':
        return <GridPlayer mediaState={mediaState} activeTab={activeTab} updateActiveTab={updateActiveTab} />;
      default:
        return <Dashboard mediaState={mediaState} activeTab={activeTab} updateActiveTab={updateActiveTab} onContextMenu={handleMediaCardContextMenu} onAddToGridPlayer={handleAddToGridPlayer} />;
    }
  };
  
  const { isSidebarVisible } = mediaState.settings;

  return (
    <div className="flex flex-col h-screen bg-app-bg text-text-primary font-sans relative">
      <GlobalDropZone mediaState={mediaState} />
      <TabBar 
        tabs={tabs}
        activeTabId={activeTabId}
        onSwitchTab={setActiveTabId}
        onCloseTab={handleCloseTab}
        onNewTab={() => handleNewTab('dashboard')}
        onDuplicateTab={handleDuplicateTab}
        onCloseOthers={handleCloseOthers}
        onCloseRight={handleCloseRight}
        onReorderTabs={handleReorderTabs}
        onPinTab={handlePinTab}
        onRenameTab={handleRenameTab}
        onMuteTab={handleMuteTab}
        onMoveTabToStart={handleMoveTabToStart}
        onMoveTabToEnd={handleMoveTabToEnd}
        onCloseTabsToLeft={handleCloseTabsToLeft}
      />
      <div className="flex flex-1 overflow-hidden">
        {!activeTab.viewingState && isSidebarVisible && (
          <Sidebar 
            mediaState={mediaState}
            activeTab={activeTab}
            setActiveView={(view) => updateActiveTab({ view, viewingState: null, title: view === 'dashboard' ? 'Dashboard' : activeTab.title })}
            setActiveCategoryId={(id) => updateActiveTab({ activeCategoryId: id, activeCollectionId: null, dashboardView: 'files' })}
            setActiveCollectionId={(id) => updateActiveTab({ activeCollectionId: id, activeCategoryId: 'all', dashboardView: 'files' })}
            onSettingsClick={() => openSettings('General')}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={toggleSidebarCollapse}
            onNewGridPlayerTab={() => handleNewTab('grid_player')}
            updateActiveTab={updateActiveTab}
            onManageCollectionsClick={handleOpenManageCollections}
            onSaveWorkspace={() => setIsSaveWorkspaceOpen(true)}
            onLoadWorkspace={handleLoadWorkspace}
          />
        )}
        <main className="flex-1 flex flex-col overflow-hidden bg-black animate-[fadeIn_0.5s_ease-out] relative" onContextMenu={handleContextMenu}>
          {renderViewContent()}
          
          {/* Player Overlay */}
          {activeTab.viewingState && viewerSrc && (
             <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                {activeTab.viewingState.file.type === 'image' ? (
                    <ImageViewer 
                      src={viewerSrc} 
                      file={activeTab.viewingState.file} 
                      onClose={closeViewer} 
                      mediaState={mediaState}
                    />
                ) : (
                    <VideoPlayer 
                        key={activeTab.viewingState.file.id} 
                        src={viewerSrc}
                        file={activeTab.viewingState.file}
                        clip={activeTab.viewingState.clip}
                        onClose={closeViewer} 
                        mediaState={mediaState}
                        playerState={activeTab.playerState}
                        updatePlayerState={updatePlayerState}
                        onContextMenu={(e) => handleVideoPlayerContextMenu(e, activeTab.viewingState!.file)}
                        isTabMuted={activeTab.isMuted}
                        onToggleTabMute={() => handleMuteTab(activeTab.id)}
                        isModalOpen={isSettingsOpen || !!videoPlayerContextMenu}
                        onOpenSettings={openSettings}
                        playlist={currentPlaylist}
                        onPlayFile={(file) => updateActiveTab({ viewingState: { file } })}
                    />
                )}
             </div>
          )}
          {activeTab.viewingState && !viewerSrc && (
              <div className="absolute inset-0 z-50 bg-black flex items-center justify-center">
                  Loading media...
              </div>
          )}
        </main>
      </div>

      <SettingsDialog 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        mediaState={mediaState}
        initialTab={settingsTargetTab}
      />

      <ManageCollectionsDialog
        isOpen={isManageCollectionsOpen}
        onClose={() => setIsManageCollectionsOpen(false)}
        mediaState={mediaState}
        initialSelectedId={editingCollectionId}
      />
      
      <SaveWorkspaceDialog
        isOpen={isSaveWorkspaceOpen}
        onClose={() => setIsSaveWorkspaceOpen(false)}
        onSave={handleSaveWorkspace}
      />

      {contextMenu && <ContextMenu 
        x={contextMenu.x} 
        y={contextMenu.y} 
        onClose={() => setContextMenu(null)} 
        mediaState={mediaState} 
        activeTab={activeTab} 
        updateActiveTab={updateActiveTab}
        onNewTab={handleNewTab}
        onCloseTab={activeTabId ? () => handleCloseTab(activeTabId) : undefined}
        onReopenTab={handleReopenTab}
        onToggleSidebarCollapse={toggleSidebarCollapse}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebarVisibility={toggleSidebarVisibility}
        isSidebarVisible={isSidebarVisible}
      />}
      {mediaCardContextMenu && <MediaCardContextMenu x={mediaCardContextMenu.x} y={mediaCardContextMenu.y} file={mediaCardContextMenu.file} 
        onClose={() => setMediaCardContextMenu(null)} 
        mediaState={mediaState} 
        activeTab={activeTab} 
        updateActiveTab={updateActiveTab}
        openFileInNewTab={openFileInNewTab}
        onAddToGridPlayer={handleAddToGridPlayer}
        onStartRename={(fileId) => updateActiveTab({ renamingFileId: fileId })}
        />}

      {videoPlayerContextMenu && activeTab?.playerState && <VideoPlayerContextMenu
        x={videoPlayerContextMenu.x}
        y={videoPlayerContextMenu.y}
        file={videoPlayerContextMenu.file}
        onClose={() => setVideoPlayerContextMenu(null)}
        onClosePlayer={closeViewer}
        mediaState={mediaState}
        playerState={activeTab.playerState}
        updatePlayerState={updatePlayerState}
      />}

    </div>
  );
}

export default App;