
import React, { useState, useEffect } from 'react';
import Dialog from './ui/Dialog';
import Switch from './ui/Switch';
import Tabs from './ui/Tabs';
import { AppSettings, GestureAction, ClickActions, VideoDisplayMode, PlayerTheme, PlayerUISettings, VideoPlayerContextMenuSettings, PlayerLayout } from '../types';
import ShortcutList from './ShortcutList';

interface PlayerSettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const PLAYER_THEMES: { name: string; id: PlayerTheme; colors: [string, string, string] }[] = [
    { name: 'Default', id: 'default', colors: ['#8B5CF6', '#000000', '#FFFFFF'] },
    { name: 'Minimal', id: 'minimal', colors: ['#FFFFFF', '#000000', '#E5E5E5'] },
    { name: 'Cinema', id: 'cinema', colors: ['#FCD34D', '#000000', '#E5E7EB'] },
    { name: 'Retro TV', id: 'retro-tv', colors: ['#FF6400', '#8B4513', '#FFEBCA'] },
    { name: 'Neon Glow', id: 'neon-glow', colors: ['#EC4899', '#1A0B2E', '#F0ABFC'] },
    { name: 'Professional', id: 'professional', colors: ['#FFFFFF', '#0A0A0A', '#B0B0B0'] },
    { name: 'Vibrant Glass', id: 'vibrant-glass', colors: ['#8B5CF6', '#FFFFFF1A', '#FFFFFF'] },
    { name: 'Classic Player', id: 'classic-player', colors: ['#3B82F6', '#C8C8D2', '#0A0A0A'] },
    { name: 'Artistic', id: 'artistic', colors: ['#DC2626', '#FAF5F0', '#32281E'] },
    { name: 'Mobile', id: 'mobile', colors: ['#22D3EE', '#000000', '#FFFFFF'] },
    { name: 'Arctic Glass', id: 'arctic-glass', colors: ['#22D3EE', '#FFFFFF1A', '#FFFFFF'] },
    { name: 'Midnight Minimal', id: 'midnight-minimal', colors: ['#FFFFFF', '#00000099', '#E5E5E5'] },
    { name: 'Aqua Marine', id: 'aqua-marine', colors: ['#40E0D0', '#2080801A', '#E6FFFA'] },
    { name: 'Ruby Red', id: 'ruby-red', colors: ['#F43F5E', '#9F12391A', '#FFF0F5'] },
    { name: 'Zen Garden', id: 'zen-garden', colors: ['#86EFAC', '#28322866', '#E6F0E6'] },
];

const PlayerSettingsDialog: React.FC<PlayerSettingsDialogProps> = ({ isOpen, onClose, settings, updateSettings }) => {
  const [activeTab, setActiveTab] = useState('Playback');
  
  useEffect(() => {
      if(isOpen) setActiveTab('Playback');
  }, [isOpen]);

  const handleSettingChange = (key: keyof AppSettings, value: any) => {
    updateSettings({ [key]: value });
  };
  
  const handleShortcutSettingsChange = (key: 'keyboardShortcuts' | 'playerKeyboardShortcuts', value: any) => {
    updateSettings({ [key]: value });
  };

  const renderCurrentTab = () => {
    switch (activeTab) {
      case 'Playback':
        return <PlayerSettings settings={settings} onChange={handleSettingChange} />;
      case 'Appearance':
        return <AppearanceSettings settings={settings} onChange={handleSettingChange} />;
      case 'UI Visibility':
        return <UILayoutSettings settings={settings} onChange={handleSettingChange} />;
      case 'Controls':
        return <ControlsSettings settings={settings} onChange={handleSettingChange} />;
      case 'Gestures':
        return <GesturesSettings settings={settings} onChange={handleSettingChange} />;
      case 'Player Shortcuts':
        return <ShortcutList settings={settings} onChange={(k,v) => handleShortcutSettingsChange(k as 'playerKeyboardShortcuts', v)} type="player" />;
      case 'Context Menu':
        return <ContextMenuSettings settings={settings} onChange={handleSettingChange} />;
      default:
        return null;
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Player Settings">
      <Tabs
        tabs={['Playback', 'Appearance', 'UI Visibility', 'Controls', 'Gestures', 'Player Shortcuts', 'Context Menu']}
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

const PlayerSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => (
    <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase text-text-secondary">Playback</h3>
        <SettingRow label="Remember Playback Position"><Switch checked={settings.rememberPlaybackPosition} onChange={e => onChange('rememberPlaybackPosition', e.target.checked)} /></SettingRow>
        <SettingRow label="Resume Behavior">
             <select value={settings.resumeBehavior} onChange={e => onChange('resumeBehavior', e.target.value)} className="bg-input-bg text-sm p-1 rounded border border-border-color">
                <option value="ask">Show Prompt</option>
                <option value="auto">Auto Resume</option>
            </select>
        </SettingRow>
        <SettingRow label="Loop Video By Default"><Switch checked={settings.loopVideo} onChange={e => onChange('loopVideo', e.target.checked)} /></SettingRow>
        <SettingRow label="Autoplay Next File"><Switch checked={settings.autoplayNext} onChange={e => onChange('autoplayNext', e.target.checked)} /></SettingRow>
         <SettingRow label="Default Video Display Mode">
             <select value={settings.defaultVideoDisplayMode} onChange={e => onChange('defaultVideoDisplayMode', e.target.value as VideoDisplayMode)} className="bg-input-bg text-sm p-1 rounded border border-border-color">
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
                <option value="force-16-9">Force 16:9</option>
                <option value="force-4-3">Force 4:3</option>
            </select>
        </SettingRow>
    </div>
);

const LayoutPreviewCard: React.FC<{ name: string; id: PlayerLayout; isSelected: boolean; onClick: () => void }> = ({ name, id, isSelected, onClick }) => {
    // Visual representation of layouts
    const getLayoutVisual = () => {
        const base = "absolute bg-primary/80 h-2";
        switch(id) {
            case 'standard': return <div className={`${base} bottom-0 left-0 right-0 w-full rounded-none`}></div>;
            case 'floating': return <div className={`${base} bottom-1 left-2 right-2 w-auto rounded-md`}></div>;
            case 'minimal': return <div className={`${base} bottom-2 left-[20%] right-[20%] rounded-full`}></div>;
            case 'compact': return <div className={`${base} bottom-1 w-20 left-1/2 -translate-x-1/2 rounded-full`}></div>;
            case 'cinematic': return <div className={`${base} bottom-0 w-full h-4 bg-gradient-to-t from-primary/50 to-transparent`}></div>;
            case 'modern-dark': return <div className={`${base} bottom-1 left-[10%] right-[10%] bg-black/80 border border-white/10 rounded-xl`}></div>;
            case 'modern-light': return <div className={`${base} bottom-1 left-[10%] right-[10%] bg-white/80 border border-white/20 rounded-xl`}></div>;
            case 'gradient-flow': return <div className={`${base} bottom-1 left-2 right-2 bg-gradient-to-r from-primary to-purple-500 rounded-full`}></div>;
            case 'island-float': return <div className={`${base} bottom-3 left-[15%] right-[15%] rounded-xl shadow-lg`}></div>;
            case 'detached-bar': return <div className={`${base} bottom-2 left-4 right-4 rounded-lg`}></div>;
            case 'soft-glow': return <div className={`${base} bottom-2 left-3 right-3 rounded-lg shadow-[0_0_10px_var(--color-primary)]`}></div>;
            case 'vertical-stack': return <div className={`${base} bottom-0 w-full h-3 rounded-t-lg`}></div>;
            case 'pill-blur': return <div className={`${base} bottom-2 left-2 right-2 rounded-full opacity-60`}></div>;
            case 'bottom-line': return <div className={`${base} bottom-0 w-full h-1`}></div>;
            case 'box-overlay': return <div className={`${base} bottom-2 left-2 w-24 rounded-md`}></div>;
            case 'split-deck': return <div className={`${base} bottom-1 left-1 right-1 flex gap-1 bg-transparent`}><div className="flex-1 bg-primary/80 rounded-l-md"></div><div className="flex-1 bg-primary/80 rounded-r-md"></div></div>;
            case 'material-elevated': return <div className={`${base} bottom-2 left-[5%] right-[5%] h-3 shadow-md rounded-md`}></div>;
            case 'glass-panel': return <div className={`${base} bottom-2 left-2 right-2 rounded-lg bg-white/10 backdrop-blur`}></div>;
            case 'neon-frame': return <div className={`${base} bottom-2 left-[5%] right-[5%] rounded-full border border-primary`}></div>;
            case 'gradient-border': return <div className={`${base} bottom-1 left-2 right-2 rounded-lg border-2 border-transparent bg-clip-border`}></div>;
            case 'floating-pill': return <div className={`${base} bottom-3 left-[20%] right-[20%] rounded-full shadow-lg`}></div>;
            case 'brutalist': return <div className={`${base} bottom-0 w-full rounded-none border-t-2 border-primary`}></div>;
            case 'neumorphic': return <div className={`${base} bottom-2 left-2 right-2 rounded-xl shadow-inner`}></div>;
            case 'cyber-glitch': return <div className={`${base} bottom-1 left-1 right-1 rounded-none clip-path-polygon`}></div>;
            case 'transparent-pro': return <div className={`${base} bottom-0 w-full h-4 bg-transparent`}></div>;
            case 'material-float': return <div className={`${base} bottom-2 left-2 w-32 rounded-lg shadow-md`}></div>;
            case 'chroma-bar': return <div className={`${base} bottom-0 w-full border-t-2 border-primary`}></div>;
            case 'aurora': return <div className={`${base} bottom-2 left-2 right-2 rounded-xl backdrop-blur bg-white/5`}></div>;
            case 'outline-sharp': return <div className={`${base} bottom-1 left-2 right-2 border-2 border-white bg-black/50`}></div>;
            case 'hyper': return <div className={`${base} bottom-2 left-[5%] right-[5%] rounded-xl bg-black border border-fuchsia-500`}></div>;
            case 'vibrant-flow': return <div className={`${base} bottom-1 left-4 right-4 rounded-2xl bg-gradient-to-r from-pink-500 to-indigo-500`}></div>;
            case 'neon-punk': return <div className={`${base} bottom-0 w-full bg-black border-t-2 border-cyan-400`}></div>;
            case 'glass-pro': return <div className={`${base} bottom-3 left-[10%] right-[10%] rounded-full bg-white/10 backdrop-blur`}></div>;
            case 'sunset-gradient': return <div className={`${base} bottom-1 left-4 right-4 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500`}></div>;
            case 'oceanic': return <div className={`${base} bottom-2 left-6 right-6 rounded-2xl bg-gradient-to-r from-cyan-600 to-blue-600`}></div>;
            case 'forest-glass': return <div className={`${base} bottom-1 left-[15%] right-[15%] rounded-full bg-emerald-900/80`}></div>;
            case 'royal-gold': return <div className={`${base} bottom-2 left-[5%] right-[5%] rounded-lg bg-slate-900 border border-yellow-500`}></div>;
            case 'cherry-blossom': return <div className={`${base} bottom-1 left-4 right-4 rounded-3xl bg-gradient-to-r from-rose-300 to-pink-300`}></div>;
            case 'dark-matter': return <div className={`${base} bottom-3 left-[20%] right-[20%] rounded-full bg-black border border-white/10`}></div>;
            case 'retro': return <div className={`${base} bottom-2 left-2 right-2 border-2 border-primary bg-black rounded-sm`}></div>;
            default: return <div className={`${base} bottom-0 w-full`}></div>;
        }
    }

    return (
        <button 
            onClick={onClick}
            className={`flex flex-col items-center gap-2 p-2 rounded-lg border-2 transition-all ${isSelected ? 'border-primary bg-primary/10' : 'border-border-color hover:border-primary/50'}`}
        >
            <div className="w-full aspect-video bg-black/20 rounded relative overflow-hidden border border-border-color/30">
                {/* Background "Video" */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <div className="w-8 h-8 rounded-full border-2 border-white/20"></div>
                </div>
                {getLayoutVisual()}
            </div>
            <span className="text-xs font-medium text-text-primary capitalize truncate w-full text-center" title={name.replace(/-/g, ' ')}>{name.replace(/-/g, ' ')}</span>
        </button>
    )
}

const AppearanceSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => {
    const layouts: PlayerLayout[] = [
        'standard', 'floating', 'minimal', 'compact', 'cinematic', 
        'retro', 'modern-dark', 'modern-light',
        'gradient-flow', 'island-float', 'detached-bar',
        'soft-glow', 'vertical-stack', 'pill-blur', 'bottom-line', 'box-overlay',
        'split-deck', 'material-elevated', 'glass-panel', 'neon-frame', 'gradient-border',
        'floating-pill', 'brutalist', 'neumorphic', 'cyber-glitch', 'transparent-pro',
        'material-float', 'chroma-bar', 'aurora', 'outline-sharp',
        'hyper', 'vibrant-flow', 'neon-punk', 'glass-pro', 'sunset-gradient', 
        'oceanic', 'forest-glass', 'royal-gold', 'cherry-blossom', 'dark-matter'
    ];

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-semibold uppercase text-text-secondary mb-2">Color Scheme (Skin)</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mt-2">
                    {PLAYER_THEMES.map(theme => (
                        <button 
                            key={theme.id} 
                            onClick={() => onChange('defaultPlayerTheme', theme.id)}
                            className={`p-3 rounded-card border-2 text-left transition-colors ${settings.defaultPlayerTheme === theme.id ? 'border-primary' : 'border-border-color hover:border-border-color/70'}`}
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

            <div className="h-px bg-border-color" />

            <div>
                <h3 className="text-xs font-semibold uppercase text-text-secondary mb-3">Player Layout Mode</h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
                    {layouts.map(layout => (
                        <LayoutPreviewCard 
                            key={layout} 
                            name={layout} 
                            id={layout} 
                            isSelected={settings.defaultPlayerLayout === layout}
                            onClick={() => onChange('defaultPlayerLayout', layout)}
                        />
                    ))}
                </div>
            </div>
            
            <div className="h-px bg-border-color" />
            
            <div className="grid grid-cols-2 gap-4">
                <SettingRow label="Scrubber Thickness">
                    <select value={settings.scrubberThickness} onChange={e => onChange('scrubberThickness', e.target.value)} className="bg-input-bg text-sm p-1 rounded border border-border-color">
                        <option value="sm">Small</option>
                        <option value="md">Medium</option>
                        <option value="lg">Large</option>
                    </select>
                </SettingRow>
                <SettingRow label="Scrubber Shape">
                    <select value={settings.scrubberShape} onChange={e => onChange('scrubberShape', e.target.value)} className="bg-input-bg text-sm p-1 rounded border border-border-color">
                        <option value="rounded">Rounded</option>
                        <option value="square">Square</option>
                    </select>
                </SettingRow>
            </div>
            
            <div className="space-y-4">
                <h3 className="text-xs font-semibold uppercase text-text-secondary">Custom Styling</h3>
                <SettingRow label="Use Custom Accent Color"><Switch checked={settings.useCustomPlayerAccent} onChange={e => onChange('useCustomPlayerAccent', e.target.checked)} /></SettingRow>
                {settings.useCustomPlayerAccent && (
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-text-primary ml-4">Accent Color</span>
                        <input type="color" value={settings.customPlayerAccentColor.startsWith('#') ? settings.customPlayerAccentColor : '#ffffff'} onChange={e => onChange('customPlayerAccentColor', e.target.value)} className="bg-transparent" />
                    </div>
                )}
                <SettingRow label="Control Opacity">
                    <input type="range" min="0.2" max="1" step="0.1" value={settings.playerControlOpacity} onChange={e => onChange('playerControlOpacity', parseFloat(e.target.value))} />
                </SettingRow>
                <SettingRow label="Glassmorphism"><Switch checked={settings.enablePlayerGlassmorphism} onChange={e => onChange('enablePlayerGlassmorphism', e.target.checked)} /></SettingRow>
            </div>
        </div>
    );
};

const UILayoutSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => {
    const handleUIChange = (key: keyof PlayerUISettings, value: boolean) => {
        onChange('playerUISettings', { ...settings.playerUISettings, [key]: value });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-text-secondary">Visible Elements</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <SettingRow label="Top Bar"><Switch checked={settings.playerUISettings.showTopBar} onChange={e => handleUIChange('showTopBar', e.target.checked)} /></SettingRow>
                <SettingRow label="Controls Bar"><Switch checked={settings.playerUISettings.showControlsBar} onChange={e => handleUIChange('showControlsBar', e.target.checked)} /></SettingRow>
                <SettingRow label="Scrubber"><Switch checked={settings.playerUISettings.showScrubber} onChange={e => handleUIChange('showScrubber', e.target.checked)} /></SettingRow>
                <SettingRow label="Play/Pause"><Switch checked={settings.playerUISettings.showPlayPause} onChange={e => handleUIChange('showPlayPause', e.target.checked)} /></SettingRow>
                <SettingRow label="Volume"><Switch checked={settings.playerUISettings.showVolume} onChange={e => handleUIChange('showVolume', e.target.checked)} /></SettingRow>
                <SettingRow label="Time Display"><Switch checked={settings.playerUISettings.showTime} onChange={e => handleUIChange('showTime', e.target.checked)} /></SettingRow>
                <SettingRow label="Playback Rate"><Switch checked={settings.playerUISettings.showPlaybackRate} onChange={e => handleUIChange('showPlaybackRate', e.target.checked)} /></SettingRow>
                <SettingRow label="Loop Toggle"><Switch checked={settings.playerUISettings.showLoop} onChange={e => handleUIChange('showLoop', e.target.checked)} /></SettingRow>
                <SettingRow label="A/B Loop"><Switch checked={settings.playerUISettings.showABLoopControls} onChange={e => handleUIChange('showABLoopControls', e.target.checked)} /></SettingRow>
                <SettingRow label="Clip Button"><Switch checked={settings.playerUISettings.showClipButton} onChange={e => handleUIChange('showClipButton', e.target.checked)} /></SettingRow>
                <SettingRow label="Transform Controls"><Switch checked={settings.playerUISettings.showTransformControls} onChange={e => handleUIChange('showTransformControls', e.target.checked)} /></SettingRow>
                <SettingRow label="Extra Controls"><Switch checked={settings.playerUISettings.showExtraControls} onChange={e => handleUIChange('showExtraControls', e.target.checked)} /></SettingRow>
            </div>
            <div className="h-px bg-border-color" />
            <SettingRow label="Auto-Hide Controls Delay (s)">
                <input type="number" min="0" max="10" value={settings.controlsAutoHideDelay} onChange={e => onChange('controlsAutoHideDelay', parseInt(e.target.value))} className="w-16 bg-input-bg p-1 rounded text-center border border-border-color" />
            </SettingRow>
            <SettingRow label="Always Show Scrubber">
                <Switch checked={settings.playerUISettings.alwaysShowScrubber} onChange={e => handleUIChange('alwaysShowScrubber', e.target.checked)} />
            </SettingRow>
        </div>
    );
};

const ControlsSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => (
    <div className="space-y-4">
        <h3 className="text-xs font-semibold uppercase text-text-secondary">Seek Behavior</h3>
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm text-text-primary">Short Seek (s)</label>
                <input type="number" value={settings.seekForwardAmount} onChange={e => {onChange('seekForwardAmount', parseFloat(e.target.value)); onChange('seekBackwardAmount', parseFloat(e.target.value));}} className="w-full bg-input-bg p-2 rounded border border-border-color" />
            </div>
            <div className="space-y-2">
                <label className="text-sm text-text-primary">Medium Seek (s)</label>
                <input type="number" value={settings.seekForwardMediumAmount} onChange={e => {onChange('seekForwardMediumAmount', parseFloat(e.target.value)); onChange('seekBackwardMediumAmount', parseFloat(e.target.value));}} className="w-full bg-input-bg p-2 rounded border border-border-color" />
            </div>
            <div className="space-y-2">
                <label className="text-sm text-text-primary">Long Seek (s)</label>
                <input type="number" value={settings.seekForwardLongAmount} onChange={e => {onChange('seekForwardLongAmount', parseFloat(e.target.value)); onChange('seekBackwardLongAmount', parseFloat(e.target.value));}} className="w-full bg-input-bg p-2 rounded border border-border-color" />
            </div>
        </div>
        <SettingRow label="Pause on Seek"><Switch checked={settings.pauseOnSeek} onChange={e => onChange('pauseOnSeek', e.target.checked)} /></SettingRow>
        
        <h3 className="text-xs font-semibold uppercase text-text-secondary mt-4">Volume</h3>
        <SettingRow label="Invert Volume Scroll Direction"><Switch checked={settings.invertVolumeScroll} onChange={e => onChange('invertVolumeScroll', e.target.checked)} /></SettingRow>
        <SettingRow label="Volume Step (0.01 - 0.2)">
            <input type="number" step="0.01" min="0.01" max="0.2" value={settings.volumeStep} onChange={e => onChange('volumeStep', parseFloat(e.target.value))} className="w-20 bg-input-bg p-1 rounded text-center border border-border-color" />
        </SettingRow>
        
        <h3 className="text-xs font-semibold uppercase text-text-secondary mt-4">Scroll Wheel Actions</h3>
        <SettingRow label="Scroll Up Action">
            <select value={settings.scrollUpAction} onChange={e => onChange('scrollUpAction', e.target.value as GestureAction)} className="bg-input-bg text-sm p-1 rounded border border-border-color">
                <option value="volumeUp">Volume Up</option>
                <option value="volumeDown">Volume Down</option>
                <option value="seekForward">Seek Forward</option>
                <option value="seekBackward">Seek Backward</option>
                <option value="none">None</option>
            </select>
        </SettingRow>
        <SettingRow label="Scroll Down Action">
            <select value={settings.scrollDownAction} onChange={e => onChange('scrollDownAction', e.target.value as GestureAction)} className="bg-input-bg text-sm p-1 rounded border border-border-color">
                <option value="volumeUp">Volume Up</option>
                <option value="volumeDown">Volume Down</option>
                <option value="seekForward">Seek Forward</option>
                <option value="seekBackward">Seek Backward</option>
                <option value="none">None</option>
            </select>
        </SettingRow>
    </div>
);

const GesturesSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => {
    const handleGestureChange = (quadrant: keyof ClickActions | string, actionType: keyof ClickActions, action: GestureAction) => {
        // This logic handles nested state updates for quadrants
        const quadrants = settings.videoPlayerGestures.quadrants;
        // @ts-ignore
        const newQuadrant = { ...quadrants[quadrant], [actionType]: action };
        onChange('videoPlayerGestures', { 
            ...settings.videoPlayerGestures, 
            quadrants: { ...quadrants, [quadrant]: newQuadrant } 
        });
    };

    const actionOptions: { label: string; value: GestureAction }[] = [
        { label: 'None', value: 'none' },
        { label: 'Play/Pause', value: 'togglePlay' },
        { label: 'Fullscreen', value: 'toggleFullscreen' },
        { label: 'Mute', value: 'toggleMute' },
        { label: 'Seek + (Short)', value: 'seekForwardShort' },
        { label: 'Seek - (Short)', value: 'seekBackwardShort' },
        { label: 'Seek + (Medium)', value: 'seekForwardMedium' },
        { label: 'Seek - (Medium)', value: 'seekBackwardMedium' },
        { label: 'Speed Up', value: 'speedUp' },
        { label: 'Speed Down', value: 'speedDown' },
    ];

    const renderQuadrantSettings = (label: string, quadrantKey: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => (
        <div className="border border-border-color p-3 rounded-lg mb-3">
            <h4 className="font-semibold mb-2 text-text-primary text-sm">{label}</h4>
            <div className="space-y-2">
                <div className="flex justify-between items-center text-sm">
                    <span>Single Click</span>
                    <select value={settings.videoPlayerGestures.quadrants[quadrantKey].singleClick} onChange={e => handleGestureChange(quadrantKey, 'singleClick', e.target.value as GestureAction)} className="bg-input-bg p-1 rounded border border-border-color w-32">
                        {actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                <div className="flex justify-between items-center text-sm">
                    <span>Double Click</span>
                    <select value={settings.videoPlayerGestures.quadrants[quadrantKey].doubleClick} onChange={e => handleGestureChange(quadrantKey, 'doubleClick', e.target.value as GestureAction)} className="bg-input-bg p-1 rounded border border-border-color w-32">
                        {actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
                 <div className="flex justify-between items-center text-sm">
                    <span>Triple Click</span>
                    <select value={settings.videoPlayerGestures.quadrants[quadrantKey].tripleClick} onChange={e => handleGestureChange(quadrantKey, 'tripleClick', e.target.value as GestureAction)} className="bg-input-bg p-1 rounded border border-border-color w-32">
                        {actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <SettingRow label="Enable Gestures">
                <Switch checked={settings.videoPlayerGestures.enabled} onChange={e => onChange('videoPlayerGestures', { ...settings.videoPlayerGestures, enabled: e.target.checked })} />
            </SettingRow>
            <SettingRow label="Double Click Sensitivity (ms)">
                <input type="number" step="50" min="100" max="500" value={settings.videoPlayerGestures.sensitivity} onChange={e => onChange('videoPlayerGestures', { ...settings.videoPlayerGestures, sensitivity: parseInt(e.target.value) })} className="w-20 bg-input-bg p-1 rounded text-center border border-border-color" />
            </SettingRow>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
                {renderQuadrantSettings('Top Left', 'topLeft')}
                {renderQuadrantSettings('Top Right', 'topRight')}
                {renderQuadrantSettings('Bottom Left', 'bottomLeft')}
                {renderQuadrantSettings('Bottom Right', 'bottomRight')}
            </div>
        </div>
    );
};

const ContextMenuSettings: React.FC<{ settings: AppSettings, onChange: (k: keyof AppSettings, v: any) => void }> = ({ settings, onChange }) => {
    const handleCMChange = (key: keyof VideoPlayerContextMenuSettings, value: boolean) => {
        onChange('videoPlayerContextMenuSettings', { ...settings.videoPlayerContextMenuSettings, [key]: value });
    };

    return (
        <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase text-text-secondary">Right-Click Menu Items</h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                <SettingRow label="Play/Pause & Loop"><Switch checked={settings.videoPlayerContextMenuSettings.playback} onChange={e => handleCMChange('playback', e.target.checked)} /></SettingRow>
                <SettingRow label="Mute"><Switch checked={settings.videoPlayerContextMenuSettings.audio} onChange={e => handleCMChange('audio', e.target.checked)} /></SettingRow>
                <SettingRow label="Speed Control"><Switch checked={settings.videoPlayerContextMenuSettings.speed} onChange={e => handleCMChange('speed', e.target.checked)} /></SettingRow>
                <SettingRow label="Video Aspect & Zoom"><Switch checked={settings.videoPlayerContextMenuSettings.video} onChange={e => handleCMChange('video', e.target.checked)} /></SettingRow>
                <SettingRow label="View / Layout"><Switch checked={settings.videoPlayerContextMenuSettings.view} onChange={e => handleCMChange('view', e.target.checked)} /></SettingRow>
                <SettingRow label="Video Effects"><Switch checked={settings.videoPlayerContextMenuSettings.videoEffects} onChange={e => handleCMChange('videoEffects', e.target.checked)} /></SettingRow>
                <SettingRow label="Snapshot"><Switch checked={settings.videoPlayerContextMenuSettings.snapshot} onChange={e => handleCMChange('snapshot', e.target.checked)} /></SettingRow>
                <SettingRow label="Picture-in-Picture"><Switch checked={settings.videoPlayerContextMenuSettings.pip} onChange={e => handleCMChange('pip', e.target.checked)} /></SettingRow>
                <SettingRow label="Fullscreen"><Switch checked={settings.videoPlayerContextMenuSettings.fullscreen} onChange={e => handleCMChange('fullscreen', e.target.checked)} /></SettingRow>
                <SettingRow label="Frame Step"><Switch checked={settings.videoPlayerContextMenuSettings.frameStep} onChange={e => handleCMChange('frameStep', e.target.checked)} /></SettingRow>
                <SettingRow label="Reload"><Switch checked={settings.videoPlayerContextMenuSettings.reload} onChange={e => handleCMChange('reload', e.target.checked)} /></SettingRow>
                <SettingRow label="Copy Title"><Switch checked={settings.videoPlayerContextMenuSettings.copySource} onChange={e => handleCMChange('copySource', e.target.checked)} /></SettingRow>
                <SettingRow label="Close Player"><Switch checked={settings.videoPlayerContextMenuSettings.close} onChange={e => handleCMChange('close', e.target.checked)} /></SettingRow>
            </div>
        </div>
    );
};

export default PlayerSettingsDialog;
