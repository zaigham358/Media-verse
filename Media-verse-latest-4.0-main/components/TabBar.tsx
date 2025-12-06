import React, { useState, useRef } from 'react';
import { Tab as TabType } from '../types';
import { PlusIcon } from './icons';
import Tab from './Tab';

interface TabBarProps {
  tabs: TabType[];
  activeTabId: string | null;
  onSwitchTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
  onNewTab: () => void;
  onDuplicateTab: (tabId: string) => void;
  onCloseOthers: (tabId: string) => void;
  onCloseRight: (tabId: string) => void;
  onReorderTabs: (draggedId: string, targetId: string) => void;
  onPinTab: (tabId: string) => void;
  onRenameTab: (tabId: string, newTitle: string) => void;
  onMuteTab: (tabId: string) => void;
  onMoveTabToStart: (tabId: string) => void;
  onMoveTabToEnd: (tabId: string) => void;
  onCloseTabsToLeft: (tabId: string) => void;
}

const TabBar: React.FC<TabBarProps> = (props) => {
  const { tabs, onReorderTabs } = props;
  const [draggedTabId, setDraggedTabId] = useState<string | null>(null);
  const tabBarRef = useRef<HTMLDivElement>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, tabId: string) => {
    setDraggedTabId(tabId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const targetElement = e.currentTarget;
    if (targetElement && draggedTabId) {
      const targetId = targetElement.dataset.tabId;
      if (targetId && draggedTabId !== targetId) {
          onReorderTabs(draggedTabId, targetId);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedTabId(null);
  };
  
  const pinnedTabs = tabs.filter(t => t.isPinned);
  const unpinnedTabs = tabs.filter(t => !t.isPinned);

  return (
    <div className="flex items-end h-10 bg-sidebar-bg flex-shrink-0 pl-2">
      <div ref={tabBarRef} className="flex items-end flex-grow h-full overflow-x-auto">
        {/* Pinned Tabs */}
        {pinnedTabs.map(tab => (
          <Tab
            key={tab.id}
            tab={tab}
            {...props}
            isActive={props.activeTabId === tab.id}
            onSelect={() => props.onSwitchTab(tab.id)}
            onClose={() => props.onCloseTab(tab.id)}
            onDuplicate={() => props.onDuplicateTab(tab.id)}
            onCloseOthers={() => props.onCloseOthers(tab.id)}
            onCloseRight={() => props.onCloseRight(tab.id)}
            onPin={() => props.onPinTab(tab.id)}
            onRename={newTitle => props.onRenameTab(tab.id, newTitle)}
            onMute={() => props.onMuteTab(tab.id)}
            onMoveToStart={() => props.onMoveTabToStart(tab.id)}
            onMoveToEnd={() => props.onMoveTabToEnd(tab.id)}
            onCloseToLeft={() => props.onCloseTabsToLeft(tab.id)}
            onDragStart={e => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            isDragging={draggedTabId === tab.id}
          />
        ))}
        
        {/* Separator if both pinned and unpinned tabs exist */}
        {pinnedTabs.length > 0 && unpinnedTabs.length > 0 && (
            <div className="h-6 w-px bg-border-color self-center mx-1" />
        )}

        {/* Unpinned Tabs */}
        {unpinnedTabs.map(tab => (
           <Tab
            key={tab.id}
            tab={tab}
            {...props}
            isActive={props.activeTabId === tab.id}
            onSelect={() => props.onSwitchTab(tab.id)}
            onClose={() => props.onCloseTab(tab.id)}
            onDuplicate={() => props.onDuplicateTab(tab.id)}
            onCloseOthers={() => props.onCloseOthers(tab.id)}
            onCloseRight={() => props.onCloseRight(tab.id)}
            onPin={() => props.onPinTab(tab.id)}
            onRename={newTitle => props.onRenameTab(tab.id, newTitle)}
            onMute={() => props.onMuteTab(tab.id)}
            onMoveToStart={() => props.onMoveTabToStart(tab.id)}
            onMoveToEnd={() => props.onMoveTabToEnd(tab.id)}
            onCloseToLeft={() => props.onCloseTabsToLeft(tab.id)}
            onDragStart={e => handleDragStart(e, tab.id)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            isDragging={draggedTabId === tab.id}
          />
        ))}
      </div>
      <button 
        onClick={props.onNewTab}
        className="h-8 w-8 mb-0.5 mr-2 flex items-center justify-center text-text-secondary hover:bg-white/10 hover:text-text-primary rounded-md"
        title="New Tab"
      >
        <PlusIcon className="w-4 h-4" />
      </button>
    </div>
  );
};

export default TabBar;
