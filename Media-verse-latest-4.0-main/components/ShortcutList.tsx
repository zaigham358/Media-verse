
import React from 'react';
import { AppSettings, KeyboardShortcutAction, PlayerKeyboardShortcutAction, Shortcut } from '../types';
import Switch from './ui/Switch';
import ShortcutInput from './ShortcutInput';

interface ShortcutListProps {
  settings: AppSettings;
  onChange: (k: keyof AppSettings, v: any) => void;
  type: 'app' | 'player';
}

const SettingRow: React.FC<{ label: React.ReactNode; children: React.ReactNode; }> = ({ label, children }) => (
    <div className="flex items-center justify-between py-1">
        <span className="text-text-primary text-sm">{label}</span>
        {children}
    </div>
);

const ShortcutList: React.FC<ShortcutListProps> = ({ settings, onChange, type }) => {

    const handleShortcutChange = (action: string, newKey: string) => {
        const keyToUpdate = type === 'app' ? 'keyboardShortcuts' : 'playerKeyboardShortcuts';
        const currentShortcuts = settings[keyToUpdate] as Record<string, Shortcut>;
        const newShortcuts = { 
            ...currentShortcuts, 
            [action]: { ...currentShortcuts[action], key: newKey }
        };
        onChange(keyToUpdate, newShortcuts);
    };

    const handleShortcutToggle = (action: string, enabled: boolean) => {
        const keyToUpdate = type === 'app' ? 'keyboardShortcuts' : 'playerKeyboardShortcuts';
        const currentShortcuts = settings[keyToUpdate] as Record<string, Shortcut>;
        const newShortcuts = { 
            ...currentShortcuts, 
            [action]: { ...currentShortcuts[action], enabled }
        };
        onChange(keyToUpdate, newShortcuts);
    };

    const shortcuts = type === 'app' ? settings.keyboardShortcuts : settings.playerKeyboardShortcuts;
    const actions = Object.keys(shortcuts) as (KeyboardShortcutAction | PlayerKeyboardShortcutAction)[];
    
    return (
        <div className="space-y-2">
            {actions.map(action => (
                <SettingRow 
                    key={action}
                    label={shortcuts[action].name}
                >
                    <div className="flex items-center space-x-3">
                        <ShortcutInput 
                            value={shortcuts[action].key}
                            onChange={(newKey) => handleShortcutChange(action, newKey)}
                        />
                        <Switch 
                            checked={shortcuts[action].enabled} 
                            onChange={e => handleShortcutToggle(action, e.target.checked)} 
                        />
                    </div>
                </SettingRow>
            ))}
        </div>
    );
};

export default ShortcutList;
