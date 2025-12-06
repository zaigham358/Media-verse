
import React, { useState, useEffect } from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import Switch from './ui/Switch';
import Tabs from './ui/Tabs';
import { UseMediaStateReturn, AppSettings, KeyboardShortcutAction, Shortcut, Theme } from '../types';
import ShortcutList from './ShortcutList';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mediaState: UseMediaStateReturn;
  initialTab?: string;
}

const THEME_PRESETS: { name: string; id: Theme; colors: [string, string, string] }[] = [
    { name: 'Vibrant', id: 'vibrant', colors: ['#8B5CF6', '#242431', '#F9F871'] },
    { name: 'Classic', id: 'classic', colors: ['#3B82F6', '#292B3A', '#E5E7EB'] },
    { name: 'Light', id: 'light', colors: ['#0EA5E9', '#FFFFFF', '#4B5563'] },
    { name: 'Nordic', id: 'nordic', colors: ['#22D3EE', '#323C47', '#D4DDE8'] },
    { name: 'Solarized', id: 'solarized', colors: ['#26A69A', '#002B36', '#93A1A1'] },
    { name: 'Crimson Noir', id: 'crimson-noir', colors: ['#DC2626', '#121212', '#EFEFEF'] },
    { name: 'Evergreen', id: 'evergreen', colors: ['#16A34A', '#1C241C', '#D4E9E2'] },
    { name: 'Cyberpunk', id: 'cyberpunk', colors: ['#EC4899', '#281544', '#F0ABFC'] },
    { name: 'Sunset', id: 'sunset', colors: ['#F97316', '#4338CA', '#FDBA74'] },
    { name: 'Matrix', id: 'matrix', colors: ['#34D399', '#000000', '#34D399'] },
];

const SettingsDialog: React.FC<SettingsDialogProps> = ({ isOpen, onClose, mediaState, initialTab = 'General' }) => {
  const { settings, updateSettings, clearAllData, clearMediaAndClips, clearCategories, resetSettings } = mediaState;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (isOpen) {
        setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!settings) return null;

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'General':
        return <GeneralSettings settings={settings} onChange={handleSettingChange} />;
      case 'Library':
        return <LibrarySettings settings={settings} onChange={handleSettingChange} />;
      case 'Application Shortcuts':
        return <ShortcutList settings={settings} onChange={handleSettingChange} type="app" />;
      case 'Tabs & Menus':
        return <TabsAndMenusSettings settings={settings} onChange={handleSettingChange} />;
      case 'Data':
        return <DataSettings 
            onClearAll={clearAllData}
            onClearMedia={clearMediaAndClips}
            onClearCategories={clearCategories}
            onResetSettings={resetSettings}
        />;
      default:
        return null;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Settings">
      <Tabs
        tabs={['General', 'Library', 'Application Shortcuts', 'Tabs & Menus', 'Data']}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="mb-6 -mt-2"
      />
      <div>{renderCurrentTab()}</div>
    </Dialog>
  );
};

const SettingRow: React.FC<{ label: React.ReactNode; children: React.ReactNode; }> = ({ label, children }) => (
    <div className="flex items-center justify-between">
        <span className="text-text-primary text-sm">{label}</span>
        {children}
    </div>
);

const GeneralSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => (
    <div className="space-y-4">
        <div>
            <span className="text-text-primary text-sm">Theme</span>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
                {THEME_PRESETS.map(theme => (
                    <button 
                        key={theme.id} 
                        onClick={() => onChange('theme', theme.id)}
                        className={`p-3 rounded-card border-2 text-left transition-colors ${settings.theme === theme.id ? 'border-primary' : 'border-border-color hover:border-border-color/70'}`}
                    >
                        <div className="flex space-x-2">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[0] }} />
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[1] }} />
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: theme.colors[2] }} />
                        </div>
                        <p className="mt-2 text-sm font-semibold text-text-primary">{theme.name}</p>
                    </button>
                ))}
            </div>
        </div>
        <div className="h-px bg-border-color !my-6" />
        <SettingRow label="Collapse Sidebar by Default">
            <Switch checked={settings.isSidebarCollapsed} onChange={e => onChange('isSidebarCollapsed', e.target.checked)} />
        </SettingRow>
        <SettingRow label="Enable Animations">
            <Switch checked={settings.enableAnimations} onChange={e => onChange('enableAnimations', e.target.checked)} />
        </SettingRow>
        <SettingRow label="Animation Speed">
            <select value={settings.animationSpeed} onChange={e => onChange('animationSpeed', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-input border border-border-color">
                <option value="fast">Fast</option>
                <option value="normal">Normal</option>
                <option value="slow">Slow</option>
            </select>
        </SettingRow>
    </div>
);


const LibrarySettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => (
    <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase text-text-secondary">Grid Interaction</h3>
        <SettingRow label="Open Media On">
            <select value={settings.mediaInteraction} onChange={e => onChange('mediaInteraction', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-input border border-border-color">
                <option value="doubleClickOpen">Double Click</option>
                <option value="singleClickOpen">Single Click</option>
            </select>
        </SettingRow>
        <SettingRow label="Show Selection Checkbox on Hover">
            <Switch checked={settings.showHoverSelect} onChange={e => onChange('showHoverSelect', e.target.checked)} disabled={settings.mediaInteraction !== 'singleClickOpen'}/>
        </SettingRow>
        <SettingRow label="Hover Select Delay (ms)">
            <div className="flex items-center space-x-2">
                <input 
                    type="range" 
                    min="0" 
                    max="2000" 
                    step="100"
                    value={settings.hoverSelectDelay} 
                    onChange={e => onChange('hoverSelectDelay', parseInt(e.target.value))} 
                    className="w-32"
                />
                <span className="text-sm text-text-secondary w-16 text-right">{settings.hoverSelectDelay === 0 ? 'Off' : `${settings.hoverSelectDelay}ms`}</span>
            </div>
        </SettingRow>

        <h3 className="text-xs font-semibold uppercase text-text-secondary pt-2">Card Display</h3>
        <SettingRow label="Card Hover Effect">
            <select value={settings.hoverEffect} onChange={e => onChange('hoverEffect', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-input border border-border-color">
                <option value="none">None</option>
                <option value="scale">Scale</option>
                <option value="glow">Glow</option>
            </select>
        </SettingRow>
        <h3 className="text-xs font-semibold uppercase text-text-secondary pt-2">Card Details</h3>
        <SettingRow label="Show Title"> <Switch checked={settings.showCardTitle} onChange={e => onChange('showCardTitle', e.target.checked)} /> </SettingRow>
        <SettingRow label="Show Rating"> <Switch checked={settings.showCardRating} onChange={e => onChange('showCardRating', e.target.checked)} /> </SettingRow>
        <SettingRow label="Show Date"> <Switch checked={settings.showCardDate} onChange={e => onChange('showCardDate', e.target.checked)} /> </SettingRow>
        <SettingRow label="Show File Size"> <Switch checked={settings.showCardSize} onChange={e => onChange('showCardSize', e.target.checked)} /> </SettingRow>
        <SettingRow label="Show Resolution"> <Switch checked={settings.showCardResolution} onChange={e => onChange('showCardResolution', e.target.checked)} /> </SettingRow>
        <SettingRow label="Show Duration"> <Switch checked={settings.showCardDuration} onChange={e => onChange('showCardDuration', e.target.checked)} /> </SettingRow>
    </div>
);

const TabsAndMenusSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => {
    const handleTabSettingChange = (key: keyof AppSettings['tabSettings'], value: any) => {
        onChange('tabSettings', { ...settings.tabSettings, [key]: value });
    };
     const handleContextMenuSettingChange = (key: keyof AppSettings['contextMenuSettings']['items'], value: any) => {
        const newItems = { ...settings.contextMenuSettings.items, [key]: value };
        onChange('contextMenuSettings', { ...settings.contextMenuSettings, items: newItems });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-text-secondary">Tabs</h3>
            <SettingRow label="Open New Tab Location">
                <select value={settings.tabSettings.openLocation} onChange={e => handleTabSettingChange('openLocation', e.target.value)} className="bg-input-bg text-sm text-text-primary p-1 rounded-input border border-border-color">
                    <option value="nextToActive">Next to active tab</option>
                    <option value="atEnd">At the end</option>
                </select>
            </SettingRow>
            <SettingRow label="Warn on Closing Multiple Tabs"><Switch checked={settings.tabSettings.warnOnCloseMultiple} onChange={e => handleTabSettingChange('warnOnCloseMultiple', e.target.checked)} /></SettingRow>
            
            <h3 className="text-xs font-semibold uppercase text-text-secondary pt-4">Main Context Menu Items</h3>
            <p className="text-sm text-text-secondary -mt-3 pb-2">
                Customize the menu that appears when you right-click in an empty area.
            </p>
            <SettingRow label="Show 'New Tab'"><Switch checked={settings.contextMenuSettings.items.newTab} onChange={e => handleContextMenuSettingChange('newTab', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'Close Tab'"><Switch checked={settings.contextMenuSettings.items.closeTab} onChange={e => handleContextMenuSettingChange('closeTab', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'Reopen Closed Tab'"><Switch checked={settings.contextMenuSettings.items.reopenTab} onChange={e => handleContextMenuSettingChange('reopenTab', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'Toggle Sidebar'"><Switch checked={settings.contextMenuSettings.items.toggleSidebar} onChange={e => handleContextMenuSettingChange('toggleSidebar', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'View Mode' Switch"><Switch checked={settings.contextMenuSettings.items.viewMode} onChange={e => handleContextMenuSettingChange('viewMode', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'Toggle Selection'"><Switch checked={settings.contextMenuSettings.items.toggleSelection} onChange={e => handleContextMenuSettingChange('toggleSelection', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'Go To Uploads'"><Switch checked={settings.contextMenuSettings.items.goToUploads} onChange={e => handleContextMenuSettingChange('goToUploads', e.target.checked)} /></SettingRow>
            <SettingRow label="Show 'Reload Page'"><Switch checked={settings.contextMenuSettings.items.reload} onChange={e => handleContextMenuSettingChange('reload', e.target.checked)} /></SettingRow>
        </div>
    );
};

const DataSettings: React.FC<{ 
    onClearAll: () => void,
    onClearMedia: () => void,
    onClearCategories: () => void,
    onResetSettings: () => void,
}> = ({ onClearAll, onClearMedia, onClearCategories, onResetSettings }) => {
    
    const createHandler = (action: () => void, message: string) => () => {
        if (confirm(message)) {
            action();
        }
    };
    
    return (
        <div>
            <h3 className="text-lg font-semibold text-red-500">Danger Zone</h3>
            <p className="text-sm text-text-secondary mt-1 mb-4">These actions are irreversible. Please be certain.</p>
            <div className="space-y-2">
                <Button className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400" onClick={createHandler(onClearMedia, 'Are you sure you want to delete all media files and favorite clips?')}>Clear Media & Clips</Button>
                <Button className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400" onClick={createHandler(onClearCategories, 'Are you sure you want to delete all custom categories?')}>Clear Categories</Button>
                <Button className="w-full bg-red-600/20 hover:bg-red-600/40 text-red-400" onClick={createHandler(onResetSettings, 'Are you sure you want to reset all settings to their defaults?')}>Reset All Settings</Button>
                <Button className="w-full bg-red-600 hover:bg-red-700 mt-4" onClick={createHandler(onClearAll, 'ARE YOU ABSOLUTELY SURE?\nThis will delete everything, including all files, categories, and settings.')}>Clear All Library Data</Button>
            </div>
        </div>
    );
};

export default SettingsDialog;
