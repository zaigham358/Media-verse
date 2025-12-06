import React, { useState } from 'react';
import { MediaFile, UseMediaStateReturn, PlayerState, VideoDisplayMode, PlayerTheme, VideoEffects, PlayerUISettings } from '../types';
import { PlayIcon, PauseIcon, RefreshCwIcon, VideoIcon, ChevronsRightIcon, MaximizeIcon, XIcon, CameraIcon, SpeedUpIcon, PictureInPictureIcon, PictureInPictureExitIcon, CopyIcon, StepForwardIcon, StepBackIcon, BracketLeftIcon, BracketRightIcon, SlidersHorizontalIcon, VolumeIcon } from './icons';
import Switch from './ui/Switch';

interface VideoPlayerContextMenuProps {
  x: number;
  y: number;
  file: MediaFile;
  onClose: () => void;
  onClosePlayer: () => void;
  mediaState: UseMediaStateReturn;
  playerState: PlayerState;
  updatePlayerState: (state: PlayerState) => void;
}

const PLAYER_THEMES: { name: string; id: PlayerTheme }[] = [
    { name: 'Default', id: 'default' }, { name: 'Minimal', id: 'minimal' },
    { name: 'Cinema', id: 'cinema' }, { name: 'Retro TV', id: 'retro-tv' },
    { name: 'Neon Glow', id: 'neon-glow' }, { name: 'Professional', id: 'professional' },
    { name: 'Vibrant Glass', id: 'vibrant-glass' }, { name: 'Classic Player', id: 'classic-player' },
    { name: 'Artistic', id: 'artistic' }, { name: 'Mobile', id: 'mobile' },
];

const VideoPlayerContextMenu: React.FC<VideoPlayerContextMenuProps> = ({ x, y, file, onClose, onClosePlayer, mediaState, playerState, updatePlayerState }) => {
    const { settings, updateSettings } = mediaState;
    const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

    if (!settings) return null;
    const menuSettings = settings.videoPlayerContextMenuSettings;
    
    const handleAction = (action: string, value?: any) => {
        const video = document.querySelector(`video`) as HTMLVideoElement;
        if (!video && !['setEffect', 'toggleUI', 'setZoom', 'setDisplayMode', 'resetLayout', 'close'].includes(action)) return;

        switch (action) {
            case 'togglePlay': video.paused ? video.play() : video.pause(); break;
            case 'toggleLoop': video.loop = !video.loop; break;
            case 'frameForward': video.currentTime += 1/30; break;
            case 'frameBackward': video.currentTime -= 1/30; break;
            case 'toggleMute': updatePlayerState({ ...playerState, isMuted: !playerState.isMuted }); break;
            case 'setPlaybackRate': updatePlayerState({ ...playerState, playbackRate: value }); break;
            case 'setDisplayMode': updatePlayerState({ ...playerState, displayMode: value }); break;
            case 'setZoom': updatePlayerState({ ...playerState, zoom: value }); break;
            case 'setPlayerTheme': updatePlayerState({ ...playerState, playerTheme: value }); break;
            case 'setABStart': updatePlayerState({ ...playerState, abLoop: {...playerState.abLoop, start: playerState.currentTime }}); break;
            case 'setABEnd': updatePlayerState({ ...playerState, abLoop: {...playerState.abLoop, end: playerState.currentTime }}); break;
            case 'toggleABActive': updatePlayerState({ ...playerState, abLoop: {...playerState.abLoop, active: !playerState.abLoop.active }}); break;
            case 'clearAB': updatePlayerState({ ...playerState, abLoop: { start: null, end: null, active: false }}); break;
            case 'setEffect': updatePlayerState({ ...playerState, effects: {...playerState.effects, ...value }}); break;
            case 'resetEffects': updatePlayerState({ ...playerState, effects: { brightness: 1, contrast: 1, saturate: 1, grayscale: false, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: false }}); break;
            case 'toggleUI': 
                const newUISettings = { ...settings.playerUISettings, [value]: !settings.playerUISettings[value as keyof PlayerUISettings]};
                updateSettings({ playerUISettings: newUISettings });
                break;
            case 'resetLayout':
                updatePlayerState({ ...playerState, headerHeight: undefined, footerHeight: undefined });
                break;
            case 'snapshot': 
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth; canvas.height = video.videoHeight;
                canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
                const link = document.createElement('a');
                link.download = `${file.title}_${(new Date(video.currentTime * 1000).toISOString().substr(14, 5))}.png`;
                link.href = canvas.toDataURL(); link.click();
                break;
            case 'togglePip': 
                document.pictureInPictureElement ? document.exitPictureInPicture() : video.requestPictureInPicture(); break;
            case 'toggleFullscreen':
                document.fullscreenElement ? document.exitFullscreen() : document.querySelector('[data-player-container="true"]')?.requestFullscreen(); break;
            case 'reload': video.load(); break;
            case 'copyTitle': navigator.clipboard.writeText(file.title); break;
            case 'close': onClosePlayer(); break;
        }
    };
    
    const renderMenuItem = (label: string, icon: React.ReactNode, action: () => void, shortcut?: string) => (
        <button onClick={() => { action(); onClose(); }} className="w-full flex items-center justify-between text-left px-2 py-1.5 rounded hover:bg-primary">
            <div className="flex items-center space-x-2">{icon}<span>{label}</span></div>
            {shortcut && <span className="text-xs text-text-secondary">{shortcut}</span>}
        </button>
    );
    
    const renderSubmenu = (name: string, label: string, icon: React.ReactNode, children: React.ReactNode) => (
        <div className="relative" onMouseEnter={() => setActiveSubmenu(name)} onMouseLeave={() => setActiveSubmenu(null)}>
            <div className="w-full flex items-center justify-between space-x-2 text-left px-2 py-1.5 rounded hover:bg-primary cursor-default">
                <div className="flex items-center space-x-2">{icon}<span>{label}</span></div>
                <ChevronsRightIcon className="w-4 h-4" />
            </div>
            {activeSubmenu === name && (
                <div className="absolute left-full -top-2 ml-1 bg-card-bg rounded-lg shadow-2xl border border-border-color p-1 w-56 z-10" onClick={e => e.stopPropagation()}>
                    {children}
                </div>
            )}
        </div>
    );

    const renderSubmenuItem = (label: string, action: () => void, isActive: boolean) => (
        <button onClick={() => { action(); onClose(); }} className={`w-full text-left px-2 py-1.5 rounded ${isActive ? 'bg-primary text-white' : 'hover:bg-primary'}`}>{label}</button>
    );

    return (
        <div className="fixed inset-0 z-50" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }}>
            <div className="absolute bg-card-bg rounded-lg shadow-2xl border border-border-color p-2 w-60 text-sm" 
                style={{ top: y, left: x }} 
                onClick={(e) => e.stopPropagation()}
            >
                {menuSettings.playback && renderSubmenu('playback', 'Playback', <PlayIcon className="w-4 h-4" />,
                    <>
                        {renderMenuItem('Play / Pause', playerState.isPlaying ? <PauseIcon className="w-4 h-4" /> : <PlayIcon className="w-4 h-4" />, () => handleAction('togglePlay'), 'Space')}
                        {renderMenuItem('Loop', <RefreshCwIcon className={`w-4 h-4 ${(document.querySelector('video') as HTMLVideoElement)?.loop ? 'text-primary' : '' }`} />, () => handleAction('toggleLoop'), 'L')}
                        {menuSettings.frameStep && <>
                            <div className="h-px bg-border-color my-1" />
                            {renderMenuItem('Step Forward', <StepForwardIcon className="w-4 h-4" />, () => handleAction('frameForward'), '.')}
                            {renderMenuItem('Step Backward', <StepBackIcon className="w-4 h-4" />, () => handleAction('frameBackward'), ',')}
                        </>}
                    </>
                )}
                {menuSettings.audio && renderMenuItem('Mute / Unmute', <VolumeIcon level={playerState.volume} muted={playerState.isMuted} className="w-4 h-4" />, () => handleAction('toggleMute'), 'M')}
                {menuSettings.speed && renderSubmenu('speed', 'Speed', <SpeedUpIcon className="w-4 h-4" />,
                    [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2.0, 4.0].map(rate => renderSubmenuItem(`${rate}x`, () => handleAction('setPlaybackRate', rate), playerState.playbackRate === rate))
                )}
                {(menuSettings.playback || menuSettings.audio || menuSettings.speed) && <div className="h-px bg-border-color my-1" />}
                
                {menuSettings.video && renderSubmenu('video', 'Video', <VideoIcon className="w-4 h-4" />,
                    <>
                        {menuSettings.aspectRatio && renderSubmenu('aspect', 'Aspect Ratio', <VideoIcon className="w-4 h-4" />,
                            <>
                                {renderSubmenuItem('Contain', () => handleAction('setDisplayMode', 'contain'), playerState.displayMode === 'contain')}
                                {renderSubmenuItem('Cover', () => handleAction('setDisplayMode', 'cover'), playerState.displayMode === 'cover')}
                                {renderSubmenuItem('Fill', () => handleAction('setDisplayMode', 'fill'), playerState.displayMode === 'fill')}
                                <div className="h-px bg-border-color my-1" />
                                {renderSubmenuItem('Force 16:9', () => handleAction('setDisplayMode', 'force-16-9'), playerState.displayMode === 'force-16-9')}
                                {renderSubmenuItem('Force 4:3', () => handleAction('setDisplayMode', 'force-4-3'), playerState.displayMode === 'force-4-3')}
                            </>
                        )}
                        {menuSettings.zoom && renderSubmenu('zoom', 'Zoom', <MaximizeIcon className="w-4 h-4" />,
                            <>
                            <input type="range" min="0.5" max="3" step="0.1" value={playerState.zoom} onChange={e => handleAction('setZoom', parseFloat(e.target.value))} className="w-full my-2" />
                            {renderSubmenuItem('Reset Zoom', () => handleAction('setZoom', 1), playerState.zoom === 1)}
                            </>
                        )}
                    </>
                )}
                {menuSettings.view && renderSubmenu('view', 'View', <VideoIcon className="w-4 h-4" />,
                    <>
                    {Object.entries(settings.playerUISettings).map(([key, value]) => renderSubmenuItem(`Show ${key.replace('show', '').replace(/([A-Z])/g, ' $1')}`, () => handleAction('toggleUI', key), value as boolean))}
                    <div className="h-px bg-border-color my-1" />
                    {renderMenuItem('Reset Layout', <RefreshCwIcon className="w-4 h-4" />, () => handleAction('resetLayout'))}
                    {renderSubmenu('skin', 'Player Skin', <VideoIcon className="w-4 h-4" />,
                        PLAYER_THEMES.map(theme => renderSubmenuItem(theme.name, () => handleAction('setPlayerTheme', theme.id), (playerState.playerTheme ?? settings.defaultPlayerTheme) === theme.id))
                    )}
                    </>
                )}
                {menuSettings.videoEffects && renderSubmenu('effects', 'Video Effects', <SlidersHorizontalIcon className="w-4 h-4" />,
                    <div className="p-2 space-y-2">
                        {(Object.keys(playerState.effects) as (keyof VideoEffects)[]).map(key => {
                            const value = playerState.effects[key];
                            if (typeof value === 'boolean') {
                                return <div key={key} className="flex items-center justify-between"><span className="capitalize">{key}</span> <Switch checked={value} onChange={() => handleAction('setEffect', {[key]: !value})} /></div>
                            }
                            const isHue = key === 'hue';
                            return <div key={key}><span className="capitalize text-xs">{key}</span><input type="range" min={isHue ? 0 : 0} max={isHue ? 360: 2} step={isHue ? 1 : 0.1} value={value} onChange={e => handleAction('setEffect', {[key]: parseFloat(e.target.value)})} className="w-full" /></div>
                        })}
                        <div className="h-px bg-border-color my-1" />
                        <button onClick={() => handleAction('resetEffects')} className="w-full text-center text-xs text-text-secondary hover:text-primary">Reset Effects</button>
                    </div>
                )}
                <div className="h-px bg-border-color my-1" />
                {menuSettings.snapshot && renderMenuItem('Take Snapshot', <CameraIcon className="w-4 h-4" />, () => handleAction('snapshot'))}
                {menuSettings.pip && renderMenuItem(playerState.isPip ? 'Exit PiP' : 'Picture-in-Picture', playerState.isPip ? <PictureInPictureExitIcon className="w-4 h-4" /> : <PictureInPictureIcon className="w-4 h-4" />, () => handleAction('togglePip'))}
                {menuSettings.fullscreen && renderMenuItem('Fullscreen', <MaximizeIcon className="w-4 h-4" />, () => handleAction('toggleFullscreen'), 'F')}
                {menuSettings.reload && renderMenuItem('Reload', <RefreshCwIcon className="w-4 h-4" />, () => handleAction('reload'))}
                {menuSettings.copySource && renderMenuItem('Copy Title', <CopyIcon className="w-4 h-4" />, () => handleAction('copyTitle'))}
                {menuSettings.close && <>
                    <div className="h-px bg-border-color my-1" />
                    {renderMenuItem('Close Player', <XIcon className="w-4 h-4" />, () => handleAction('close'))}
                </>}
            </div>
        </div>
    );
};

export default VideoPlayerContextMenu;