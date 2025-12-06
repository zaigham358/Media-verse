import React from 'react';
import { UseMediaStateReturn, Tab } from '../types';
import { GridIcon, ListIcon, CheckSquareIcon, UploadCloudIcon, RefreshCwIcon, PlusIcon, XIcon, ChevronsLeftIcon, ChevronsRightIcon, UndoIcon } from './icons';

interface ContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  mediaState: UseMediaStateReturn;
  activeTab: Tab;
  updateActiveTab: (updates: Partial<Omit<Tab, 'id'>>) => void;
  onNewTab: () => void;
  onCloseTab?: () => void;
  onReopenTab: () => void;
  onToggleSidebarCollapse: () => void;
  isSidebarCollapsed: boolean;
  onToggleSidebarVisibility: () => void;
  isSidebarVisible: boolean;
}

const ACCENT_COLORS = [
    { name: 'Indigo', value: '98 102 241' },
    { name: 'Blue', value: '59 130 246' },
    { name: 'Rose', value: '244 63 94' },
    { name: 'Green', value: '34 197 94' },
    { name: 'Orange', value: '249 115 22' },
];


const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, onClose, mediaState, activeTab, updateActiveTab, onNewTab, onCloseTab, onReopenTab, onToggleSidebarCollapse, isSidebarCollapsed, onToggleSidebarVisibility, isSidebarVisible }) => {
  const { settings, updateSettings } = mediaState;

  const handleAction = (action: () => void) => {
      action();
      onClose();
  }

  const menuItems = settings.contextMenuSettings.items;

  return (
    <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
        <div
        className="absolute bg-card-bg rounded-lg shadow-2xl border border-border-color p-2 w-56 text-sm"
        style={{ top: y, left: x }}
        onClick={(e) => e.stopPropagation()}
        >
            {menuItems.newTab && (
                <button onClick={() => handleAction(onNewTab)} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <PlusIcon className="w-4 h-4" />
                    <span>New Tab</span>
                </button>
            )}
            {menuItems.closeTab && onCloseTab && (
                <button onClick={() => handleAction(onCloseTab)} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <XIcon className="w-4 h-4" />
                    <span>Close Tab</span>
                </button>
            )}
            {menuItems.reopenTab && (
                <button onClick={() => handleAction(onReopenTab)} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <UndoIcon className="w-4 h-4" />
                    <span>Reopen Closed Tab</span>
                </button>
            )}
            {(menuItems.newTab || (menuItems.closeTab && onCloseTab) || menuItems.reopenTab) && (menuItems.toggleSidebar || menuItems.accentColor || menuItems.viewMode || menuItems.toggleSelection || menuItems.goToUploads || menuItems.reload) ? (
                <div className="h-px bg-border-color my-1" />
            ) : null}

            {menuItems.toggleSidebar && (
                <>
                <button onClick={() => handleAction(onToggleSidebarVisibility)} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    {isSidebarVisible ? <ChevronsLeftIcon className="w-4 h-4" /> : <ChevronsRightIcon className="w-4 h-4" />}
                    <span>{isSidebarVisible ? 'Hide' : 'Show'} Sidebar</span>
                </button>
                <button onClick={() => handleAction(onToggleSidebarCollapse)} disabled={!isSidebarVisible} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary disabled:opacity-50">
                    {isSidebarCollapsed ? <ChevronsRightIcon className="w-4 h-4" /> : <ChevronsLeftIcon className="w-4 h-4" />}
                    <span>{isSidebarCollapsed ? 'Expand' : 'Collapse'} Sidebar</span>
                </button>
                </>
            )}
            {menuItems.toggleSidebar && (menuItems.accentColor || menuItems.viewMode || menuItems.toggleSelection || menuItems.goToUploads || menuItems.reload) ? (
                <div className="h-px bg-border-color my-1" />
            ): null}
        
            {menuItems.accentColor && (
                <>
                    <div className="px-2 py-1 text-xs text-text-secondary">Theme Accent</div>
                    <div className="flex items-center justify-around p-2">
                        {ACCENT_COLORS.map(color => (
                        <button 
                            key={color.value} 
                            onClick={() => handleAction(() => updateSettings({ accentColor: color.value }))}
                            className={`w-5 h-5 rounded-full ring-2 ring-offset-2 ring-offset-card-bg transition-all ${settings.accentColor === color.value ? 'ring-primary' : 'ring-transparent'}`}
                            style={{ backgroundColor: `rgb(${color.value})`}}
                        />
                        ))}
                    </div>
                    <div className="h-px bg-border-color my-1" />
                </>
            )}
        
            {activeTab.view === 'dashboard' && menuItems.viewMode && (
            <>
                <div className="px-2 py-1 text-xs text-text-secondary">Dashboard View</div>
                <button onClick={() => handleAction(() => updateActiveTab({ viewMode: 'grid' }))} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <GridIcon className="w-4 h-4" />
                    <span>Grid View</span>
                </button>
                <button onClick={() => handleAction(() => updateActiveTab({ viewMode: 'list' }))} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <ListIcon className="w-4 h-4" />
                    <span>List View</span>
                </button>
                <div className="h-px bg-border-color my-1" />
            </>
            )}
            
            {activeTab.view === 'dashboard' && menuItems.toggleSelection && (
                <button onClick={() => handleAction(() => updateActiveTab({ selectionMode: !activeTab.selectionMode, selectedFileIds: [] }))} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <CheckSquareIcon className="w-4 h-4" />
                    <span>{activeTab.selectionMode ? 'Disable' : 'Enable'} Selection</span>
                </button>
            )}

            {menuItems.goToUploads && (
                    <button onClick={() => handleAction(() => updateActiveTab({ view: 'uploads' }))} className="w-full flex items-center space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary">
                    <UploadCloudIcon className="w-4 h-4" />
                    <span>Go to Uploads</span>
                </button>
            )}

            {(menuItems.toggleSelection || menuItems.goToUploads) && (menuItems.reload) && (
                <div className="h-px bg-border-color my-1" />
            )}

            {menuItems.reload && (
                <button onClick={() => handleAction(() => window.location.reload())} className="w-full text-left px-2 py-1.5 rounded hover:bg-primary flex items-center space-x-2">
                    <RefreshCwIcon className="w-4 h-4" />
                    <span>Reload Page</span>
                </button>
            )}
        </div>
    </div>
  );
};

export default ContextMenu;
