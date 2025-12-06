import React, { useState } from 'react';
import { VideoEffects, PlayerState, AppSettings, CustomPlayerFilterPreset } from '../types';
import Switch from './ui/Switch';
import { SunIcon, ContrastIcon, DropletIcon, PaletteIcon, EyeOffIcon, RefreshCwIcon, SaveIcon, TrashIcon, XIcon } from './icons';

interface VideoFilterPopoverProps {
  effects: VideoEffects;
  updatePlayerState: (updates: Partial<PlayerState>) => void;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
}

const PRESETS: Record<string, VideoEffects> = {
    'Default': { brightness: 1, contrast: 1, saturate: 1, grayscale: false, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: false },
    'Cinematic': { brightness: 1.1, contrast: 1.2, saturate: 1.3, grayscale: false, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: true },
    'Vintage': { brightness: 1, contrast: 0.9, saturate: 0.8, grayscale: false, sepia: true, invert: false, hue: 0, blur: 0, dropShadow: false },
    'B&W': { brightness: 1, contrast: 1.1, saturate: 1, grayscale: true, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: false },
    'Vivid': { brightness: 1.1, contrast: 1.1, saturate: 1.5, grayscale: false, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: false },
}

const FilterSlider: React.FC<{ icon: React.ReactNode; label: string; value: number; min?: number; max?: number; step?: number; onChange: (v: number) => void; onReset: () => void }> = ({ icon, label, value, min = 0, max = 2, step = 0.05, onChange, onReset }) => (
    <div className="flex items-center space-x-3" onDoubleClick={onReset} title={`Double-click to reset ${label}`}>
        <div className="w-5 text-center text-[rgb(var(--player-text-secondary))]" title={label}>{icon}</div>
        <input type="range" min={min} max={max} step={step} value={value} onChange={e => onChange(parseFloat(e.target.value))} className="w-full h-1.5 bg-[rgb(var(--player-scrubber-bg))] rounded-lg appearance-none cursor-pointer accent-[rgb(var(--player-accent))]" />
        <span className="text-xs font-mono w-10 text-right text-[rgb(var(--player-text-secondary))]">{label === 'Hue' ? Math.round(value) : value.toFixed(2)}</span>
    </div>
);

const FilterToggle: React.FC<{ label: string, checked: boolean, onChange: (c: boolean) => void }> = ({ label, checked, onChange }) => (
    <div className="flex justify-between items-center py-1">
        <label className="text-sm">{label}</label>
        <Switch checked={checked} onChange={e => onChange(e.target.checked)} />
    </div>
);


const VideoFilterPopover: React.FC<VideoFilterPopoverProps> = ({ effects, updatePlayerState, settings, updateSettings }) => {
    const [presetName, setPresetName] = useState('');

    const handleEffectChange = (key: keyof VideoEffects, value: number | boolean) => {
        updatePlayerState({ effects: { ...effects, [key]: value } });
    };
    
    const handleSavePreset = () => {
        if (!presetName.trim()) return;
        const newPreset: CustomPlayerFilterPreset = {
            id: crypto.randomUUID(),
            name: presetName.trim(),
            effects: { ...effects }
        };
        const newPresets = [...settings.customFilterPresets, newPreset];
        updateSettings({ customFilterPresets: newPresets });
        setPresetName('');
    }

    const handleDeletePreset = (id: string) => {
        const newPresets = settings.customFilterPresets.filter(p => p.id !== id);
        updateSettings({ customFilterPresets: newPresets });
    }

    return (
        <div className="w-96 p-4 text-[rgb(var(--player-text-primary))]" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                 <h3 className="font-semibold text-xl" style={{ fontFamily: 'var(--player-font-main)' }}>Video Filters</h3>
                 <button onClick={() => updatePlayerState({ effects: PRESETS['Default']})} className="flex items-center space-x-1.5 text-xs text-[rgb(var(--player-text-secondary))] hover:text-[rgb(var(--player-accent))]" title="Reset all filters">
                    <RefreshCwIcon className="w-3.5 h-3.5" /><span>Reset All</span>
                 </button>
            </div>

            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="space-y-4 col-span-2">
                    <FilterSlider icon={<SunIcon className="w-5 h-5"/>} label="Brightness" value={effects.brightness} onChange={v => handleEffectChange('brightness', v)} onReset={() => handleEffectChange('brightness', 1)} />
                    <FilterSlider icon={<ContrastIcon className="w-5 h-5"/>} label="Contrast" value={effects.contrast} onChange={v => handleEffectChange('contrast', v)} onReset={() => handleEffectChange('contrast', 1)} />
                    <FilterSlider icon={<DropletIcon className="w-5 h-5"/>} label="Saturation" value={effects.saturate} onChange={v => handleEffectChange('saturate', v)} onReset={() => handleEffectChange('saturate', 1)} />
                    <FilterSlider icon={<PaletteIcon className="w-5 h-5"/>} label="Hue" value={effects.hue} min={0} max={360} step={1} onChange={v => handleEffectChange('hue', v)} onReset={() => handleEffectChange('hue', 0)} />
                    <FilterSlider icon={<EyeOffIcon className="w-5 h-5"/>} label="Blur" value={effects.blur} min={0} max={10} step={0.1} onChange={v => handleEffectChange('blur', v)} onReset={() => handleEffectChange('blur', 0)} />
                </div>
                <div className="space-y-2">
                     <FilterToggle label="Grayscale" checked={effects.grayscale} onChange={c => handleEffectChange('grayscale', c)} />
                    <FilterToggle label="Sepia" checked={effects.sepia} onChange={c => handleEffectChange('sepia', c)} />
                </div>
                 <div className="space-y-2">
                    <FilterToggle label="Invert" checked={effects.invert} onChange={c => handleEffectChange('invert', c)} />
                    <FilterToggle label="Cinematic Shadow" checked={effects.dropShadow} onChange={c => handleEffectChange('dropShadow', c)} />
                </div>
            </div>
            
            <div className="border-t border-[rgb(var(--player-scrubber-bg))] pt-3 mt-4">
                 <h4 className="text-sm font-semibold text-[rgb(var(--player-text-secondary))] mb-2">Presets</h4>
                 <div className="flex flex-wrap gap-2">
                    {Object.keys(PRESETS).map(name => (
                        <button key={name} onClick={() => updatePlayerState({ effects: PRESETS[name] })} className="px-3 py-1 bg-[rgba(var(--player-text-primary),0.1)] text-xs rounded-full border border-transparent hover:border-[rgb(var(--player-accent))] hover:text-[rgb(var(--player-accent))]">
                            {name}
                        </button>
                    ))}
                 </div>
                 {settings.customFilterPresets.length > 0 && (
                     <div className="flex flex-wrap gap-2 mt-2">
                        {settings.customFilterPresets.map(preset => (
                            <div key={preset.id} className="group relative">
                                <button onClick={() => updatePlayerState({ effects: preset.effects })} className="px-3 py-1 bg-[rgba(var(--player-accent),0.1)] text-xs text-[rgb(var(--player-accent))] rounded-full border border-transparent hover:border-[rgb(var(--player-accent))]">
                                    {preset.name}
                                </button>
                                <button onClick={() => handleDeletePreset(preset.id)} className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <XIcon className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        ))}
                     </div>
                 )}
                 <div className="flex items-center space-x-2 mt-3">
                    <input type="text" value={presetName} onChange={e => setPresetName(e.target.value)} placeholder="New preset name..." className="flex-1 bg-[rgba(var(--player-text-primary),0.1)] text-xs px-3 py-2 rounded-md border border-[rgb(var(--player-scrubber-bg))] focus:border-[rgb(var(--player-accent))] focus:outline-none" />
                    <button onClick={handleSavePreset} disabled={!presetName.trim()} className="p-2 rounded-md hover:bg-[rgba(var(--player-accent),0.2)] disabled:opacity-50" title="Save Current Settings as Preset">
                        <SaveIcon className="w-5 h-5 text-[rgb(var(--player-accent))]" />
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default VideoFilterPopover;