
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { MediaFile, FavPart, UseMediaStateReturn, GestureAction, AppSettings, PlayerState, PlayerKeyboardShortcutAction, Shortcut, PlayerLayout } from '../types';
import * as db from '../db';
import { PlayIcon, PauseIcon, FullscreenEnterIcon, FullscreenExitIcon, SettingsIcon, FastForwardIcon, RewindIcon, XIcon, LinkIcon, UnlinkIcon, ScissorsIcon, RefreshCwIcon, BracketLeftIcon, BracketRightIcon, StepBackIcon, StepForwardIcon, RotateCwIcon, RotateCcwIcon, FlipHorizontalIcon, FlipVerticalIcon, CropRotateIcon, CameraIcon, RabbitIcon, BookmarkIcon, ListIcon, CropIcon, AspectRatioIcon } from './icons';
import Popover from './ui/Popover';
import ClipCutterPopover from './ClipCutterPopover';
import VideoFilterPopover from './VideoFilterPopover';
import GestureQuadrant from './GestureQuadrant';
import Scrubber from './Scrubber';
import PlayerSettingsDialog from './PlayerSettingsDialog';
import PlayerFeedbackIndicator, { Feedback } from './PlayerFeedbackIndicator';
import Button from './ui/Button';
import PlaylistOverlay from './PlaylistOverlay';
import { VolumeIcon } from './icons';

interface VideoPlayerProps {
  src: string;
  file: MediaFile;
  clip?: FavPart;
  onClose: () => void;
  mediaState: UseMediaStateReturn;
  playerState?: PlayerState;
  updatePlayerState: (state: PlayerState) => void;
  onContextMenu: (event: React.MouseEvent) => void;
  isTabMuted?: boolean;
  onToggleTabMute?: () => void;
  isModalOpen: boolean;
  onOpenSettings: (targetTab?: string) => void;
  playlist?: MediaFile[];
  onPlayFile?: (file: MediaFile) => void;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(h>0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
};

const ResumePopup: React.FC<{ time: number, onResume: () => void, onDismiss: () => void }> = ({ time, onResume, onDismiss }) => {
    useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);
    
    return (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-[rgb(var(--player-bg))] backdrop-blur-sm p-3 rounded-[var(--player-radius)] shadow-lg flex items-center space-x-4 animate-fade-in z-30 pointer-events-auto border border-[rgb(var(--player-text-primary),0.1)]">
            <p className="text-sm" style={{ color: 'rgb(var(--player-text-primary))' }}>Resume from <span className="font-bold" style={{ color: 'rgb(var(--player-accent))' }}>{formatTime(time)}</span>?</p>
            <button onClick={onResume} className="px-3 py-1 text-white text-sm rounded hover:bg-opacity-90 transition-colors" style={{ backgroundColor: 'rgb(var(--player-accent))' }}>Resume</button>
            <button onClick={onDismiss} className="px-3 py-1 bg-white/10 text-[rgb(var(--player-text-primary))] text-sm rounded hover:bg-white/20 transition-colors">Start Over</button>
        </div>
    );
};

const defaultPlayerState: Omit<PlayerState, 'currentTime'> = {
  isPlaying: false, volume: 1, isMuted: false, playbackRate: 1, isPip: false,
  displayMode: 'contain',
  zoom: 1.0,
  rotation: 0, flipH: false, flipV: false,
  playerTheme: 'default',
  playerLayout: 'standard',
  abLoop: { start: null, end: null, active: false },
  effects: { brightness: 1, contrast: 1, saturate: 1, grayscale: false, sepia: false, invert: false, hue: 0, blur: 0, dropShadow: false },
  bookmarks: [],
  skipSilence: false,
  keyframeSeeking: false,
  endAction: 'next',
};

const VideoPlayer: React.FC<VideoPlayerProps> = ({ src, file, clip, onClose, mediaState, playerState: globalPlayerState, updatePlayerState: setGlobalPlayerState, onContextMenu, isTabMuted, onToggleTabMute, isModalOpen, onOpenSettings, playlist = [], onPlayFile }) => {
  const { settings, addFavPart, updateSettings } = mediaState as UseMediaStateReturn & { settings: AppSettings };
  const videoRef = useRef<HTMLVideoElement>(null);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  
  // Audio Context for Volume Boosting & Silence Skipping
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserNodeRef = useRef<AnalyserNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const silenceCheckInterval = useRef<number | null>(null);
  
  const [localPlayerState, setLocalPlayerState] = useState<PlayerState>(() => ({
      currentTime: 0,
      ...defaultPlayerState,
      playbackRate: settings.defaultPlaybackRate,
      endAction: settings.defaultEndAction ?? 'next',
      playerLayout: settings.defaultPlayerLayout,
      ...globalPlayerState
  }));

  useEffect(() => {
    if (globalPlayerState) setLocalPlayerState(globalPlayerState);
  }, [globalPlayerState]);

  const updatePlayerState = useCallback((updates: Partial<PlayerState>) => {
      setLocalPlayerState(prevState => {
          const newState = { ...prevState, ...updates };
          setGlobalPlayerState(newState);
          return newState;
      });
  }, [setGlobalPlayerState]);
  
  const { isPlaying, isMuted, volume, playbackRate, currentTime, abLoop, effects, headerHeight, footerHeight, rotation, flipH, flipV, bookmarks, skipSilence, keyframeSeeking, endAction, playerLayout } = localPlayerState;

  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [areControlsVisible, setAreControlsVisible] = useState(true);
  const [isClipCutterOpen, setIsClipCutterOpen] = useState(false);
  const [isFilterPopoverOpen, setIsFilterPopoverOpen] = useState(false);
  const [isTransformPopoverOpen, setIsTransformPopoverOpen] = useState(false);
  const [isPlayerSettingsOpen, setIsPlayerSettingsOpen] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [isTimeJumpOpen, setIsTimeJumpOpen] = useState(false);
  const [timeJumpValue, setTimeJumpValue] = useState('');
  
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [resumeTime, setResumeTime] = useState<number | null>(() => globalPlayerState?.resumeFrom ?? null);
  const [isClipLinked, setIsClipLinked] = useState(clip?.isLinked ?? true);
  const [tempLoop, setTempLoop] = useState<{start: number, end: number} | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartPos = useRef({ x: 0, y: 0 });
  const [ghostPosition, setGhostPosition] = useState<number | null>(null);

  const controlsTimeout = useRef<number | null>(null);
  const saveInterval = useRef<number | null>(null);
  const lastActivityRef = useRef(0);
  const [isSeeking, setIsSeeking] = useState(false);
  const dragInfo = useRef<{ type: 'header' | 'footer', initialY: number, initialHeight: number } | null>(null);
  
  const uiSettings = settings.playerUISettings;
  const isAnyPopoverOpen = isClipCutterOpen || isFilterPopoverOpen || isTransformPopoverOpen || isPlayerSettingsOpen || isModalOpen || isTimeJumpOpen;

  const videoFavParts = useMemo(() => mediaState.favParts.filter(p => p.mediaId === file.id), [file.id, mediaState.favParts]);

  // Media Session API Integration
  useEffect(() => {
      if ('mediaSession' in navigator) {
          navigator.mediaSession.metadata = new MediaMetadata({
              title: file.title,
              artist: 'MediaVerse',
              artwork: [
                  { src: 'https://via.placeholder.com/512.png?text=MV', sizes: '512x512', type: 'image/png' }
              ]
          });

          navigator.mediaSession.setActionHandler('play', () => updatePlayerState({ isPlaying: true }));
          navigator.mediaSession.setActionHandler('pause', () => updatePlayerState({ isPlaying: false }));
          navigator.mediaSession.setActionHandler('seekbackward', () => handleAction('seekBackwardShort'));
          navigator.mediaSession.setActionHandler('seekforward', () => handleAction('seekForwardShort'));
          navigator.mediaSession.setActionHandler('previoustrack', () => handlePrevFile());
          navigator.mediaSession.setActionHandler('nexttrack', () => handleNextFile());
      }
      return () => {
          if ('mediaSession' in navigator) {
              navigator.mediaSession.setActionHandler('play', null);
              navigator.mediaSession.setActionHandler('pause', null);
          }
      };
  }, [file]);

  const handleNextFile = useCallback(() => {
      if (!playlist.length || !onPlayFile) return;
      const currentIndex = playlist.findIndex(f => f.id === file.id);
      if (currentIndex !== -1 && currentIndex < playlist.length - 1) {
          onPlayFile(playlist[currentIndex + 1]);
      }
  }, [playlist, file.id, onPlayFile]);

  const handlePrevFile = useCallback(() => {
      if (!playlist.length || !onPlayFile) return;
      const currentIndex = playlist.findIndex(f => f.id === file.id);
      if (currentIndex > 0) {
          onPlayFile(playlist[currentIndex - 1]);
      }
  }, [playlist, file.id, onPlayFile]);

  const handleEnded = useCallback(() => {
      switch (endAction) {
          case 'loop':
              if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
              }
              break;
          case 'next':
              handleNextFile();
              break;
          case 'rewind':
              if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  updatePlayerState({ isPlaying: false });
              }
              break;
          case 'exit-fullscreen':
              if (document.fullscreenElement) document.exitFullscreen();
              updatePlayerState({ isPlaying: false });
              break;
          case 'pause':
          default:
              updatePlayerState({ isPlaying: false });
              break;
      }
  }, [endAction, handleNextFile, updatePlayerState]);


  // Audio Analysis & Skip Silence
  useEffect(() => {
      if (!videoRef.current) return;

      if (!audioContextRef.current) {
          try {
              const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
              if (AudioContext) {
                  audioContextRef.current = new AudioContext();
                  gainNodeRef.current = audioContextRef.current.createGain();
                  analyserNodeRef.current = audioContextRef.current.createAnalyser();
                  analyserNodeRef.current.fftSize = 256;
                  
                  sourceNodeRef.current = audioContextRef.current.createMediaElementSource(videoRef.current);
                  sourceNodeRef.current.connect(gainNodeRef.current);
                  gainNodeRef.current.connect(analyserNodeRef.current);
                  analyserNodeRef.current.connect(audioContextRef.current.destination);
              }
          } catch (e) {
              console.warn("Web Audio API failed", e);
          }
      }

      // Apply Volume
      if (videoRef.current && gainNodeRef.current) {
          if (volume <= 1) {
              videoRef.current.volume = volume;
              gainNodeRef.current.gain.value = 1;
          } else {
              videoRef.current.volume = 1;
              gainNodeRef.current.gain.value = volume;
          }
      }

      // Skip Silence Logic
      if (silenceCheckInterval.current) clearInterval(silenceCheckInterval.current);
      
      if (skipSilence && analyserNodeRef.current && isPlaying) {
          const bufferLength = analyserNodeRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          
          silenceCheckInterval.current = window.setInterval(() => {
              if (!analyserNodeRef.current || !videoRef.current) return;
              analyserNodeRef.current.getByteFrequencyData(dataArray);
              
              let sum = 0;
              for(let i = 0; i < bufferLength; i++) sum += dataArray[i];
              const average = sum / bufferLength;
              
              // Threshold logic (heuristic: average volume < 5 out of 255)
              if (average < 5) {
                  if (videoRef.current.playbackRate !== 2.5) videoRef.current.playbackRate = 2.5;
              } else {
                  if (videoRef.current.playbackRate !== playbackRate) videoRef.current.playbackRate = playbackRate;
              }
          }, 200);
      } else if (videoRef.current && !skipSilence) {
          videoRef.current.playbackRate = playbackRate;
      }

      return () => {
          if (silenceCheckInterval.current) clearInterval(silenceCheckInterval.current);
      };

  }, [src, volume, skipSilence, isPlaying, playbackRate]);


  const prevDefaultTheme = useRef(settings.defaultPlayerTheme);
  const prevDefaultLayout = useRef(settings.defaultPlayerLayout);

  useEffect(() => {
    if (settings.defaultPlayerTheme !== prevDefaultTheme.current) {
        updatePlayerState({ playerTheme: settings.defaultPlayerTheme });
        prevDefaultTheme.current = settings.defaultPlayerTheme;
    }
    if (settings.defaultPlayerLayout !== prevDefaultLayout.current) {
        updatePlayerState({ playerLayout: settings.defaultPlayerLayout });
        prevDefaultLayout.current = settings.defaultPlayerLayout;
    }
  }, [settings.defaultPlayerTheme, settings.defaultPlayerLayout, updatePlayerState]);

  useEffect(() => {
    if (globalPlayerState?.resumeFrom) setGlobalPlayerState({ ...localPlayerState, resumeFrom: undefined });
  }, [globalPlayerState?.resumeFrom, setGlobalPlayerState]);

  const cancelHideTimer = useCallback(() => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
  }, []);

  const startHideTimer = useCallback(() => {
    cancelHideTimer();
    if (settings.controlsAutoHideDelay > 0 && isPlaying && !isAnyPopoverOpen) {
        controlsTimeout.current = window.setTimeout(() => setAreControlsVisible(false), settings.controlsAutoHideDelay * 1000);
    }
  }, [cancelHideTimer, settings.controlsAutoHideDelay, isPlaying, isAnyPopoverOpen]);

  const handleActivity = useCallback(() => {
    const now = Date.now();
    if (now - lastActivityRef.current > 200) { 
        setAreControlsVisible(true);
        startHideTimer();
        lastActivityRef.current = now;
    } else {
        cancelHideTimer();
        if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
        controlsTimeout.current = window.setTimeout(() => {
             setAreControlsVisible(true);
             startHideTimer();
        }, 250);
    }
  }, [startHideTimer, cancelHideTimer]);

  useEffect(() => {
    if (!isPlaying || isAnyPopoverOpen) {
        setAreControlsVisible(true);
        cancelHideTimer();
    } else {
        handleActivity();
    }
  }, [isPlaying, cancelHideTimer, handleActivity, isAnyPopoverOpen]);
  
  const showFeedback = useCallback((feedbackData: Omit<Feedback, 'id'>) => {
    setFeedback({ ...feedbackData, id: Date.now() });
  }, []);

  const handleMuteToggle = useCallback(() => {
    const newMuted = !localPlayerState.isMuted;
    updatePlayerState({ isMuted: newMuted });
    showFeedback({
        icon: <VolumeIcon level={localPlayerState.volume} muted={newMuted} className="w-8 h-8"/>,
        text: newMuted ? 'Muted' : 'Unmuted'
    });
  }, [localPlayerState.isMuted, localPlayerState.volume, updatePlayerState, showFeedback]);

  const handleAction = useCallback((action: GestureAction | PlayerKeyboardShortcutAction | 'setPlaybackRate', value?: number) => {
    const video = videoRef.current;
    if (!video || !isFinite(video.duration)) return;
    
    const seekTarget = (time: number) => clip && isClipLinked ? Math.max(clip.startTime, Math.min(clip.endTime, time)) : Math.max(0, Math.min(video.duration, time));

    const performSeek = (time: number) => {
        if (keyframeSeeking && 'fastSeek' in video) {
            // @ts-ignore
            video.fastSeek(time);
        } else {
            video.currentTime = time;
        }
    };

    const actionMap: Record<GestureAction | PlayerKeyboardShortcutAction | 'setPlaybackRate', (v?: number) => void> = {
        none: () => {},
        togglePlay: () => video.paused ? video.play() : video.pause(),
        toggleFullscreen: () => isFullscreen ? document.exitFullscreen() : playerContainerRef.current?.requestFullscreen(),
        toggleMute: handleMuteToggle,
        seekForward: () => { const newTime = seekTarget(video.currentTime + settings.seekForwardAmount); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekBackward: () => { const newTime = seekTarget(video.currentTime - settings.seekBackwardAmount); performSeek(newTime); showFeedback({ icon: <RewindIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        volumeUp: () => { 
            const newVol = Math.min(3, localPlayerState.volume + 0.1); 
            updatePlayerState({ volume: newVol }); 
            showFeedback({ icon: <VolumeIcon level={newVol > 1 ? 1 : newVol} muted={false} className="w-8 h-8"/>, text: `${Math.round(newVol * 100)}%`, value: newVol * 100, max: 300 }); 
        },
        volumeDown: () => { 
            const newVol = Math.max(0, localPlayerState.volume - 0.1); 
            updatePlayerState({ volume: newVol }); 
            showFeedback({ icon: <VolumeIcon level={newVol > 1 ? 1 : newVol} muted={newVol === 0} className="w-8 h-8"/>, text: `${Math.round(newVol * 100)}%`, value: newVol * 100, max: 300 }); 
        },
        speedUp: () => { const newRate = Math.min(4, localPlayerState.playbackRate + 0.25); updatePlayerState({ playbackRate: newRate }); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: `${newRate.toFixed(2)}x` }); },
        speedDown: () => { const newRate = Math.max(0.25, localPlayerState.playbackRate - 0.25); updatePlayerState({ playbackRate: newRate }); showFeedback({ icon: <RewindIcon className="w-8 h-8"/>, text: `${newRate.toFixed(2)}x` }); },
        setPlaybackRate: (v?: number) => { if (v !== undefined) { updatePlayerState({ playbackRate: v }); } },
        toggleLoop: () => { video.loop = !video.loop; showFeedback({ icon: <RefreshCwIcon className="w-8 h-8"/>, text: video.loop ? 'Loop On' : 'Loop Off' }) },
        seekForwardShort: () => { const newTime = seekTarget(video.currentTime + settings.seekForwardAmount); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekBackwardShort: () => { const newTime = seekTarget(video.currentTime - settings.seekBackwardAmount); performSeek(newTime); showFeedback({ icon: <RewindIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekForwardMedium: () => { const newTime = seekTarget(video.currentTime + settings.seekForwardMediumAmount); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekBackwardMedium: () => { const newTime = seekTarget(video.currentTime - settings.seekBackwardMediumAmount); performSeek(newTime); showFeedback({ icon: <RewindIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekForwardLong: () => { const newTime = seekTarget(video.currentTime + settings.seekForwardLongAmount); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekBackwardLong: () => { const newTime = seekTarget(video.currentTime - settings.seekBackwardLongAmount); performSeek(newTime); showFeedback({ icon: <RewindIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        speedReset: () => { updatePlayerState({ playbackRate: 1 }); showFeedback({ icon: <PlayIcon className="w-8 h-8"/>, text: `1.00x` }); },
        frameForward: () => { video.pause(); const newTime = seekTarget(video.currentTime + 1/30); video.currentTime = newTime; },
        frameBackward: () => { video.pause(); const newTime = seekTarget(video.currentTime - 1/30); video.currentTime = newTime; },
        rotateRight: () => { const newRot = (localPlayerState.rotation + 90) % 360; updatePlayerState({ rotation: newRot }); showFeedback({ icon: <RotateCwIcon className="w-8 h-8"/>, text: `${newRot}°` }); },
        rotateLeft: () => { const newRot = (localPlayerState.rotation - 90 + 360) % 360; updatePlayerState({ rotation: newRot }); showFeedback({ icon: <RotateCcwIcon className="w-8 h-8"/>, text: `${newRot}°` }); },
        flipHorizontal: () => { const newFlip = !localPlayerState.flipH; updatePlayerState({ flipH: newFlip }); showFeedback({ icon: <FlipHorizontalIcon className="w-8 h-8"/>, text: newFlip ? 'Flipped H' : 'Normal H' }); },
        flipVertical: () => { const newFlip = !localPlayerState.flipV; updatePlayerState({ flipV: newFlip }); showFeedback({ icon: <FlipVerticalIcon className="w-8 h-8"/>, text: newFlip ? 'Flipped V' : 'Normal V' }); },
        seekTo0: () => { const newTime = seekTarget(video.duration * 0); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo10: () => { const newTime = seekTarget(video.duration * 0.1); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo20: () => { const newTime = seekTarget(video.duration * 0.2); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo30: () => { const newTime = seekTarget(video.duration * 0.3); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo40: () => { const newTime = seekTarget(video.duration * 0.4); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo50: () => { const newTime = seekTarget(video.duration * 0.5); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo60: () => { const newTime = seekTarget(video.duration * 0.6); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo70: () => { const newTime = seekTarget(video.duration * 0.7); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo80: () => { const newTime = seekTarget(video.duration * 0.8); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        seekTo90: () => { const newTime = seekTarget(video.duration * 0.9); performSeek(newTime); showFeedback({ icon: <FastForwardIcon className="w-8 h-8"/>, text: formatTime(newTime) }); },
        addBookmark: () => { 
            const newBookmarks = [...bookmarks, video.currentTime].sort((a,b) => a-b);
            updatePlayerState({ bookmarks: newBookmarks });
            showFeedback({ icon: <BookmarkIcon className="w-8 h-8" />, text: "Bookmark Added" });
        },
        nextBookmark: () => {
            const next = bookmarks.find(b => b > video.currentTime + 0.1);
            if (next !== undefined) performSeek(next);
        },
        prevBookmark: () => {
            const prev = [...bookmarks].reverse().find(b => b < video.currentTime - 0.1);
            if (prev !== undefined) performSeek(prev);
        },
        openTimeJump: () => { setIsTimeJumpOpen(true); setTimeout(() => document.getElementById('time-jump-input')?.focus(), 50); }
    };
    
    actionMap[action]?.(value);
  }, [duration, isFullscreen, settings, handleMuteToggle, localPlayerState, updatePlayerState, clip, isClipLinked, showFeedback, keyframeSeeking]);

  const handleWheel = (e: React.WheelEvent) => {
    if (isAnyPopoverOpen) return;
    if ((e.target as HTMLElement).closest('[data-popover-content="true"]')) return;
    
    if (e.ctrlKey) { 
        e.preventDefault();
        const newZoom = Math.max(1, Math.min(5, localPlayerState.zoom + e.deltaY * -0.01));
        updatePlayerState({ zoom: newZoom });
        showFeedback({icon: <AspectRatioIcon className="w-8 h-8"/>, text: `${Math.round(newZoom*100)}%`});
        return;
    }
    
    e.preventDefault();
    handleAction(e.deltaY < 0 ? settings.scrollUpAction : settings.scrollDownAction);
  };

  const handlePlay = useCallback(() => updatePlayerState({ isPlaying: true }), [updatePlayerState]);
  const handlePause = useCallback(() => updatePlayerState({ isPlaying: false }), [updatePlayerState]);
  const handleSeek = useCallback((time: number) => { 
      if (videoRef.current && isFinite(time)) {
          if (keyframeSeeking && 'fastSeek' in videoRef.current) {
              // @ts-ignore
              videoRef.current.fastSeek(time);
          } else {
              videoRef.current.currentTime = time; 
          }
      }
  }, [keyframeSeeking]);

  const handleSeekStart = useCallback(() => {
      setIsSeeking(true);
      if (videoRef.current) setGhostPosition(videoRef.current.currentTime);
  }, []);
  
  const handleSeekEnd = useCallback(() => {
      setIsSeeking(false);
      setGhostPosition(null);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError(null);
    const checkStalled = setTimeout(() => {
        if (video.readyState < video.HAVE_METADATA) {
            setError('The media could not be loaded. The file may be corrupt or in an unsupported format.');
        }
    }, 10000); 
    return () => clearTimeout(checkStalled);
  }, [src]);

  useEffect(() => {
      const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => {
          document.removeEventListener('fullscreenchange', handleFullscreenChange);
          if (document.fullscreenElement) document.exitFullscreen().catch(console.warn);
          if (document.pictureInPictureElement) document.exitPictureInPicture().catch(console.warn);
      };
  }, []);

  useEffect(() => {
    const video = videoRef.current; if (!video) return;
    video.loop = settings.loopVideo || endAction === 'loop'; 
    video.playbackRate = playbackRate;
    video.muted = isMuted || !!isTabMuted;
    
    const handleEnterPip = () => updatePlayerState({ isPip: true });
    const handleLeavePip = () => updatePlayerState({ isPip: false });
    const handleLoadedMetadata = async () => {
        if (!video || !isFinite(video.duration)) return;
        setDuration(video.duration);
        if (clip) video.currentTime = clip.startTime;
        else if (resumeTime && settings.resumeBehavior === 'auto') { video.currentTime = resumeTime; setResumeTime(null); }
        else video.currentTime = localPlayerState.currentTime;
        if (localPlayerState.isPlaying) { try { await video.play(); } catch (error) { console.warn("Autoplay was prevented.", error); handlePause(); } }
    };
    
    const handleTimeUpdate = () => {
        if (!isSeeking && video && isFinite(video.duration)) {
          if (tempLoop && video.currentTime >= tempLoop.end) { video.currentTime = tempLoop.start; return; }
          if (clip && isClipLinked && video.currentTime >= clip.endTime) { video.pause(); video.currentTime = clip.endTime; }
          if (abLoop.active && abLoop.start !== null && abLoop.end !== null && video.currentTime >= abLoop.end) { video.currentTime = abLoop.start; }
          updatePlayerState({ currentTime: video.currentTime });
        }
    };
    const handleProgress = () => { if (video && video.buffered.length > 0) setBufferedTime(video.buffered.end(video.buffered.length - 1)); };
    const handleDurationChange = () => { if (video && isFinite(video.duration)) setDuration(video.duration); };
    
    video.addEventListener('enterpictureinpicture', handleEnterPip); video.addEventListener('leavepictureinpicture', handleLeavePip);
    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
    video.addEventListener('timeupdate', handleTimeUpdate); video.addEventListener('progress', handleProgress);
    video.addEventListener('durationchange', handleDurationChange); video.addEventListener('play', handlePlay); video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      if(video) {
        video.removeEventListener('enterpictureinpicture', handleEnterPip); video.removeEventListener('leavepictureinpicture', handleLeavePip);
        video.removeEventListener('loadedmetadata', handleLoadedMetadata); video.removeEventListener('durationchange', handleDurationChange);
        video.removeEventListener('timeupdate', handleTimeUpdate); video.removeEventListener('progress', handleProgress);
        video.removeEventListener('play', handlePlay); video.removeEventListener('pause', handlePause);
        video.removeEventListener('ended', handleEnded);
      }
    };
  }, [src, handlePlay, handlePause, clip, resumeTime, settings.resumeBehavior, abLoop, updatePlayerState, isSeeking, isClipLinked, settings.loopVideo, playbackRate, isMuted, isTabMuted, localPlayerState.isPlaying, localPlayerState.currentTime, tempLoop, endAction, handleEnded]);
  
  useEffect(() => { if (videoRef.current) videoRef.current.muted = isMuted || !!isTabMuted; }, [isMuted, isTabMuted]);

  useEffect(() => {
    const video = videoRef.current; if (!video || !settings.rememberPlaybackPosition || clip) return;
    const savePosition = () => { if (video && isFinite(video.currentTime) && video.currentTime > 0 && !video.ended) db.setPlaybackPosition(file.id, video.currentTime); };
    saveInterval.current = window.setInterval(savePosition, 5000);
    return () => { if (saveInterval.current) clearInterval(saveInterval.current); savePosition(); };
  }, [file.id, settings.rememberPlaybackPosition, clip]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (isModalOpen) return;
        if (isClipCutterOpen || isPlayerSettingsOpen) return;

        const shortcuts = settings.playerKeyboardShortcuts;
        const key = e.key === ' ' ? ' ' : (e.ctrlKey || e.metaKey ? `Control+${e.key.toUpperCase()}` : (e.shiftKey ? `Shift+${e.key.toUpperCase()}` : e.key.toUpperCase()));
        const actionEntry = (Object.entries(shortcuts) as [PlayerKeyboardShortcutAction, Shortcut][]).find(([, shortcut]) => shortcut.enabled && shortcut.key.toUpperCase() === key);
        if (actionEntry) { e.preventDefault(); handleAction(actionEntry[0]); }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [settings.playerKeyboardShortcuts, handleAction, isModalOpen, isClipCutterOpen, isPlayerSettingsOpen]);
  
  useEffect(() => {
      if (!videoRef.current) return;
      const { brightness, contrast, saturate, grayscale, sepia, invert, hue, blur, dropShadow } = effects;
      const filterProperties = [
        `brightness(${brightness})`, `contrast(${contrast})`, `saturate(${saturate})`, 
        `hue-rotate(${hue}deg)`, `blur(${blur}px)`,
        grayscale ? 'grayscale(1)' : '', sepia ? 'sepia(1)' : '', invert ? 'invert(1)' : '',
        dropShadow ? 'drop-shadow(0 0 10px rgba(0,0,0,0.5))' : ''
    ].filter(Boolean).join(' ');
      videoRef.current.style.filter = filterProperties;
  }, [effects]);

  const handleResume = () => { if (videoRef.current && resumeTime) videoRef.current.currentTime = resumeTime; setResumeTime(null); };
  
  const handlePanMouseDown = (e: React.MouseEvent) => {
    if ((localPlayerState.zoom ?? 1) <= 1) return;
    e.preventDefault(); setIsPanning(true);
    panStartPos.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
  };
  const handlePanMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || (localPlayerState.zoom ?? 1) <= 1) return;
    const newX = e.clientX - panStartPos.current.x;
    const newY = e.clientY - panStartPos.current.y;
    setPan({ x: newX, y: newY });
  };
  const handlePanMouseUp = () => setIsPanning(false);

  useEffect(() => { if ((localPlayerState.zoom ?? 1) <= 1) setPan({x:0, y:0}); }, [localPlayerState.zoom]);

  const videoContainerStyle: React.CSSProperties = { cursor: (localPlayerState.zoom ?? 1) > 1 ? (isPanning ? 'grabbing' : 'grab') : 'default' };
  let videoWrapperStyle: React.CSSProperties = {};
  const currentZoom = localPlayerState?.zoom ?? 1.0;
  const currentDisplayMode = localPlayerState?.displayMode ?? settings.defaultVideoDisplayMode;
  const transformString = [`scale(${currentZoom})`, `translate(${pan.x}px, ${pan.y}px)`, `rotate(${rotation}deg)`, `scaleX(${flipH ? -1 : 1})`, `scaleY(${flipV ? -1 : 1})`].join(' ');
  let finalObjectFit = (currentDisplayMode.startsWith('force') || currentDisplayMode === 'ultrawide-crop') ? 'contain' : currentDisplayMode;
  if (currentDisplayMode === 'ultrawide-crop') finalObjectFit = 'cover';
  const videoStyle: React.CSSProperties = { transform: transformString, width: '100%', height: '100%', objectFit: finalObjectFit as React.CSSProperties['objectFit'], transition: isPanning ? 'none' : 'transform 0.2s ease-out', crossOrigin: "anonymous" };
  if (currentDisplayMode === 'force-16-9') videoWrapperStyle.aspectRatio = '16 / 9';
  if (currentDisplayMode === 'force-4-3') videoWrapperStyle.aspectRatio = '4 / 3';
  
  const isPlayerMuted = isMuted || !!isTabMuted;
  const currentTheme = localPlayerState?.playerTheme ?? settings.defaultPlayerTheme;
  const currentLayout = localPlayerState?.playerLayout ?? settings.defaultPlayerLayout;
  
  const layoutStyles: Record<PlayerLayout, string> = {
    // Standard - Edge to edge, sticky
    standard: 'bottom-0 left-0 right-0 w-full rounded-none bg-[rgb(var(--player-bg))] backdrop-blur-md border-t border-[rgba(var(--player-text-primary),0.1)] px-6 py-3',

    // Compact - Floating pill (CENTERED)
    compact: 'bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[400px] rounded-full bg-[rgb(var(--player-bg))] backdrop-blur-xl border border-[rgba(var(--player-accent),0.3)] shadow-2xl px-6 py-2',

    // Minimal - Transparent floating
    minimal: 'bottom-6 left-[10%] right-[10%] w-[80%] rounded-full bg-[rgba(var(--player-bg),0.4)] backdrop-blur-md border border-[rgba(var(--player-text-primary),0.05)] px-8 py-2 hover:bg-[rgba(var(--player-bg),0.7)]',

    // Floating - Classic Box
    floating: 'bottom-4 left-4 right-4 w-auto rounded-2xl bg-[rgb(var(--player-bg))] backdrop-blur-md border border-[rgba(var(--player-text-primary),0.1)] px-6 py-3 shadow-lg',

    // Glass Panel
    'glass-panel': 'bottom-6 left-6 right-6 w-auto rounded-3xl bg-[rgba(255,255,255,0.05)] backdrop-blur-3xl border border-[rgba(255,255,255,0.1)] px-6 py-4 shadow-xl',

    // Neon Frame
    'neon-frame': 'bottom-6 left-[5%] right-[5%] w-[90%] rounded-full bg-black/90 ring-1 ring-[rgb(var(--player-accent))] shadow-[0_0_20px_rgba(var(--player-accent),0.5)] px-6 py-3',

    // Gradient Border
    'gradient-border': 'bottom-4 left-4 right-4 w-auto rounded-xl bg-[rgb(var(--player-bg))] border-2 border-transparent [background-clip:padding-box,border-box] [background-origin:padding-box,border-box] [background-image:linear-gradient(rgb(var(--player-bg)),rgb(var(--player-bg))),linear-gradient(to_right,rgb(var(--player-accent)),#fff)] px-6 py-3',

    // Floating Pill (CENTERED ish)
    'floating-pill': 'bottom-8 left-[15%] right-[15%] w-[70%] rounded-full bg-[rgb(var(--player-bg))] shadow-2xl px-8 py-3 border border-[rgba(var(--player-text-primary),0.1)]',

    // Brutalist
    'brutalist': 'bottom-0 left-0 right-0 w-full bg-[rgb(var(--player-bg))] border-t-4 border-[rgb(var(--player-accent))] px-4 py-4 font-mono rounded-none',

    // Neumorphic
    'neumorphic': 'bottom-6 left-6 right-6 w-auto rounded-2xl bg-[rgb(var(--player-bg))] shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(255,255,255,0.05)] px-6 py-4 border-none',

    // Cyber Glitch
    'cyber-glitch': 'bottom-4 left-2 right-2 w-auto bg-black/90 border border-[rgb(var(--player-accent))] rounded-none px-8 py-2 shadow-[2px_2px_0px_rgb(var(--player-accent))] [clip-path:polygon(20px_0,100%_0,100%_100%,0_100%,0_20px)]',

    // Transparent Pro
    'transparent-pro': 'bottom-0 left-0 right-0 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12 pb-4 px-8 border-none',

    // Material Float (CENTERED)
    'material-float': 'bottom-6 left-1/2 -translate-x-1/2 w-auto min-w-[500px] rounded-lg bg-[rgb(var(--player-bg))] shadow-[0_8px_30px_rgba(0,0,0,0.5)] px-6 py-3',

    // Island Float
    'island-float': 'bottom-8 left-[20%] right-[20%] w-[60%] rounded-3xl bg-[rgb(var(--player-bg))] backdrop-blur-lg shadow-2xl border border-[rgba(var(--player-text-primary),0.1)] px-8 py-4',

    // Detached Bar
    'detached-bar': 'bottom-4 left-4 right-4 w-auto rounded-xl bg-[rgb(var(--player-bg))] shadow-lg px-6 py-3 border border-white/5',

    // Bottom Line
    'bottom-line': 'bottom-0 left-0 right-0 w-full bg-gradient-to-t from-black via-black/80 to-transparent pt-14 pb-2 px-4',

    // Vertical Stack
    'vertical-stack': 'bottom-0 left-0 right-0 w-full bg-[rgb(var(--player-bg))] pt-4 pb-8 px-10 border-t border-white/5 rounded-t-3xl',

    // Cinematic
    'cinematic': 'bottom-0 left-0 right-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-16 pb-6 px-10',

    // Retro
    'retro': 'bottom-4 left-4 right-4 w-auto rounded-md bg-[rgb(var(--player-bg))] border-4 double border-[rgb(var(--player-text-primary))] px-6 py-3 shadow-md font-mono',

    // Modern Dark
    'modern-dark': 'bottom-6 left-[10%] right-[10%] w-[80%] rounded-2xl bg-[#121212]/95 backdrop-blur-xl border border-white/10 px-6 py-4 shadow-2xl ring-1 ring-black/50',

    // Modern Light
    'modern-light': 'bottom-6 left-[10%] right-[10%] w-[80%] rounded-2xl bg-white/90 backdrop-blur-xl border border-black/5 px-6 py-4 shadow-lg text-black',

    // Gradient Flow
    'gradient-flow': 'bottom-4 left-4 right-4 w-auto rounded-full bg-gradient-to-r from-[rgba(var(--player-bg),0.9)] via-[rgba(var(--player-bg),0.7)] to-[rgba(var(--player-bg),0.9)] border-x-4 border-[rgb(var(--player-accent))] px-6 py-3 backdrop-blur-md',

    // Soft Glow
    'soft-glow': 'bottom-6 left-8 right-8 w-auto rounded-2xl bg-[rgb(var(--player-bg))] shadow-[0_0_40px_rgba(var(--player-accent),0.3)] px-6 py-4 border border-white/5',

    // Pill Blur
    'pill-blur': 'bottom-6 left-12 right-12 w-auto rounded-full bg-[rgba(var(--player-bg),0.4)] backdrop-blur-2xl px-8 py-3 border border-white/10 ring-1 ring-white/5',

    // Box Overlay (CENTERED)
    'box-overlay': 'bottom-4 left-1/2 -translate-x-1/2 w-[600px] rounded-lg bg-[rgb(var(--player-bg))] border border-[rgb(var(--player-accent))] px-4 py-3 shadow-xl',

    // Split Deck
    'split-deck': 'bottom-4 left-4 right-4 w-auto bg-black/80 backdrop-blur-md rounded-xl border border-white/10 px-6 py-3 flex-row shadow-lg',

    // Material Elevated
    'material-elevated': 'bottom-6 left-[5%] right-[5%] w-[90%] bg-[rgb(var(--player-bg))] rounded-lg shadow-[0_10px_40px_rgba(0,0,0,0.6)] px-6 py-4 border-t border-white/5',

    // Chroma Bar
    'chroma-bar': 'bottom-0 left-0 right-0 w-full bg-[rgb(var(--player-bg))] border-t-2 border-[rgb(var(--player-accent))] px-6 py-3 shadow-[0_-5px_20px_rgba(var(--player-accent),0.2)]',

    // Aurora
    'aurora': 'bottom-6 left-6 right-6 w-auto rounded-2xl bg-[rgba(var(--player-bg),0.7)] backdrop-blur-xl border border-white/10 px-6 py-4 shadow-[0_0_30px_rgba(var(--player-accent),0.15)] ring-1 ring-white/5',

    // Outline Sharp
    'outline-sharp': 'bottom-4 left-4 right-4 w-auto rounded-none border-2 border-[rgb(var(--player-text-primary))] bg-black/60 backdrop-blur-sm px-6 py-3',

    // Hyper
    'hyper': 'bottom-6 left-[5%] right-[5%] w-[90%] rounded-xl bg-black border-2 border-transparent [background-clip:padding-box,border-box] [background-origin:padding-box,border-box] [background-image:linear-gradient(#000,#000),linear-gradient(45deg,rgb(var(--player-accent)),#fff)] px-6 py-4 shadow-[0_0_15px_rgba(var(--player-accent),0.5)]',

    // Vibrant Flow
    'vibrant-flow': 'bottom-4 left-4 right-4 w-auto rounded-2xl bg-gradient-to-r from-[rgb(var(--player-accent))] via-purple-500/50 to-blue-500/50 backdrop-blur-xl px-6 py-3 border border-white/20 shadow-2xl',

    // Neon Punk
    'neon-punk': 'bottom-0 left-0 right-0 w-full bg-black/90 border-t-2 border-[rgb(var(--player-accent))] shadow-[0_-4px_20px_rgba(var(--player-accent),0.3)] px-6 py-4 font-mono text-[rgb(var(--player-accent))]',

    // Glass Pro
    'glass-pro': 'bottom-8 left-[10%] right-[10%] w-[80%] rounded-full bg-white/5 backdrop-blur-[20px] border border-white/20 shadow-[0_8px_32px_0_rgba(var(--player-accent),0.37)] px-8 py-3',

    // Sunset Gradient
    'sunset-gradient': 'bottom-4 left-4 right-4 w-auto rounded-xl bg-gradient-to-br from-[rgb(var(--player-accent))] to-pink-500/90 backdrop-blur-md px-6 py-3 border border-white/10',

    // Oceanic
    'oceanic': 'bottom-6 left-6 right-6 w-auto rounded-2xl bg-gradient-to-r from-[rgb(var(--player-accent))] to-cyan-500/50 backdrop-blur-lg px-6 py-4 shadow-lg border border-white/20',

    // Forest Glass
    'forest-glass': 'bottom-4 left-[15%] right-[15%] w-[70%] rounded-full bg-[rgba(var(--player-bg),0.8)] backdrop-blur-md border border-[rgba(var(--player-accent),0.3)] shadow-xl px-8 py-3',

    // Royal Gold
    'royal-gold': 'bottom-6 left-[5%] right-[5%] w-[90%] rounded-lg bg-[#141E30]/95 border border-[rgb(var(--player-accent))] shadow-[0_0_20px_rgba(var(--player-accent),0.2)] px-6 py-4',

    // Cherry Blossom
    'cherry-blossom': 'bottom-4 left-4 right-4 w-auto rounded-3xl bg-gradient-to-r from-[rgb(var(--player-accent))] to-pink-300/80 backdrop-blur-md px-6 py-3 shadow-lg border border-white/30',

    // Dark Matter
    'dark-matter': 'bottom-8 left-[20%] right-[20%] w-[60%] rounded-full bg-black/80 backdrop-blur-2xl border border-white/5 px-8 py-2 shadow-2xl ring-1 ring-[rgb(var(--player-accent))]',
  };

  const handleDragStart = (e: React.MouseEvent, type: 'header' | 'footer') => { e.preventDefault(); dragInfo.current = { type, initialY: e.clientY, initialHeight: type === 'header' ? (headerHeight ?? 48) : (footerHeight ?? 64) }; };
  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragInfo.current) return;
    const deltaY = e.clientY - dragInfo.current.initialY;
    const { type, initialHeight } = dragInfo.current;
    let newHeight = Math.max(32, Math.min(200, type === 'header' ? initialHeight + deltaY : initialHeight - deltaY));
    updatePlayerState(type === 'header' ? { headerHeight: newHeight } : { footerHeight: newHeight });
  }, [updatePlayerState]);
  const handleDragEnd = useCallback(() => { dragInfo.current = null; }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleDragMove); window.addEventListener('mouseup', handleDragEnd);
    return () => { window.removeEventListener('mousemove', handleDragMove); window.removeEventListener('mouseup', handleDragEnd); }
  }, [handleDragMove, handleDragEnd]);

  const handleTimeJump = () => {
      const parts = timeJumpValue.split(':').map(Number);
      let seconds = 0;
      if (parts.length === 1) seconds = parts[0];
      else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      else if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      
      if (!isNaN(seconds)) {
          handleSeek(Math.min(duration, Math.max(0, seconds)));
      }
      setIsTimeJumpOpen(false);
      setTimeJumpValue('');
  };

  const renderHeader = () => {
      if (!uiSettings.showTopBar) return null;
      // Sticky top bar logic
      const baseClasses = `absolute top-0 left-0 right-0 w-full p-2 flex items-center justify-between pointer-events-auto transition-transform duration-300 z-30 ${areControlsVisible || !isPlaying ? 'translate-y-0' : '-translate-y-full'}`;
      let style: React.CSSProperties = { background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', minHeight: '50px' };
      
      return (
        <header onMouseEnter={cancelHideTimer} onMouseLeave={startHideTimer} className={baseClasses} style={style}>
            <h2 className="text-lg font-semibold text-white truncate max-w-[60%] drop-shadow-md pl-4" style={{ fontFamily: 'var(--player-font-main)', textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>{file.title}{clip ? <span className="font-bold" style={{ color: 'rgb(var(--player-accent))' }}> - {clip.title}</span> : ''}</h2>
            <div className="flex items-center space-x-2 pr-4">
                {onToggleTabMute && <button onClick={onToggleTabMute} title={isTabMuted ? "Unmute Tab" : "Mute Tab"}>{isTabMuted && <VolumeIcon level={0} muted={true} className="w-5 h-5 text-text-secondary" />}</button>}
                <button onClick={() => setIsPlaylistOpen(!isPlaylistOpen)} className={`p-2 rounded-full hover:bg-white/20 ${isPlaylistOpen ? 'bg-[rgb(var(--player-accent))] text-white' : 'text-white'}`} title="Playlist"><ListIcon className="w-5 h-5"/></button>
                <button onClick={onClose} className="p-2 rounded-full hover:bg-white/20 text-white" title="Close Player"><XIcon/></button>
            </div>
        </header>
      )
  }

  return (
    <div 
        ref={playerContainerRef} 
        className={`relative w-full h-full bg-black overflow-hidden group select-none ${currentTheme}`} 
        data-player-container="true"
        onContextMenu={onContextMenu}
        onWheel={handleWheel}
        style={{
            '--player-accent': settings.useCustomPlayerAccent ? settings.customPlayerAccentColor : 'var(--color-primary)', 
            '--player-bg': '0, 0, 0', 
            '--player-text-primary': '255, 255, 255',
            '--player-text-secondary': '156, 163, 175',
            '--player-scrubber-bg': '255, 255, 255, 0.3',
            '--player-radius': '8px',
            '--player-scrubber-radius': settings.scrubberShape === 'rounded' ? '99px' : '2px',
            '--player-scrubber-thickness': settings.scrubberThickness === 'lg' ? '8px' : settings.scrubberThickness === 'md' ? '6px' : '4px',
            '--player-font-main': settings.playerFont === 'serif' ? 'serif' : settings.playerFont === 'mono' ? 'monospace' : 'sans-serif',
            '--player-font-mono': 'monospace',
        } as React.CSSProperties}
    >
        <div 
            className="absolute inset-0 flex items-center justify-center" 
            style={videoContainerStyle}
            onMouseDown={handlePanMouseDown}
            onMouseMove={handlePanMouseMove}
            onMouseUp={handlePanMouseUp}
            onMouseLeave={handlePanMouseUp}
        >
            <div style={{ ...videoWrapperStyle, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video 
                    ref={videoRef} 
                    src={src} 
                    style={videoStyle}
                    onClick={() => settings.mediaInteraction === 'singleClickOpen' ? handleAction('togglePlay') : undefined}
                    onDoubleClick={() => handleAction('toggleFullscreen')}
                    crossOrigin="anonymous"
                />
            </div>
        </div>

        {settings.videoPlayerGestures.enabled && (
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 z-10 pointer-events-none">
                <div className="pointer-events-auto"><GestureQuadrant settings={settings.videoPlayerGestures.quadrants.topLeft} onAction={handleAction} sensitivity={settings.videoPlayerGestures.sensitivity} /></div>
                <div className="pointer-events-auto"><GestureQuadrant settings={settings.videoPlayerGestures.quadrants.topRight} onAction={handleAction} sensitivity={settings.videoPlayerGestures.sensitivity} /></div>
                <div className="pointer-events-auto"><GestureQuadrant settings={settings.videoPlayerGestures.quadrants.bottomLeft} onAction={handleAction} sensitivity={settings.videoPlayerGestures.sensitivity} /></div>
                <div className="pointer-events-auto"><GestureQuadrant settings={settings.videoPlayerGestures.quadrants.bottomRight} onAction={handleAction} sensitivity={settings.videoPlayerGestures.sensitivity} /></div>
            </div>
        )}

        <PlayerFeedbackIndicator feedback={feedback} />
        {error && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/80 text-white px-4 py-3 rounded-lg z-20 flex items-center space-x-2 pointer-events-none">
                <XIcon className="w-5 h-5" />
                <span>{error}</span>
            </div>
        )}
        {resumeTime && settings.resumeBehavior === 'ask' && (
            <ResumePopup time={resumeTime} onResume={handleResume} onDismiss={() => setResumeTime(null)} />
        )}

        {renderHeader()}

        {/* Sleek Progress Bar (Always Visible when controls hidden) */}
        {!areControlsVisible && !isAnyPopoverOpen && duration > 0 && (
            <div className="absolute bottom-0 left-0 w-full h-[3px] bg-transparent z-20 pointer-events-none">
               <div className="h-full bg-[rgb(var(--player-accent))] transition-all duration-200 ease-linear shadow-[0_0_10px_rgb(var(--player-accent))]" style={{ width: `${(currentTime/duration)*100}%` }} />
            </div>
        )}

        {uiSettings.showControlsBar && (
            <div 
                onMouseEnter={cancelHideTimer} 
                onMouseLeave={startHideTimer}
                className={`absolute z-30 transition-all duration-300 flex flex-col justify-end ${layoutStyles[currentLayout]} ${areControlsVisible || !isPlaying || isAnyPopoverOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0 pointer-events-none'}`}
                style={{
                    height: footerHeight ? `${footerHeight}px` : undefined
                }}
            >
                {uiSettings.showScrubber && (
                    <div className="mb-2 w-full">
                        <Scrubber 
                            currentTime={currentTime} 
                            duration={duration} 
                            clip={clip} 
                            isClipLinked={isClipLinked}
                            abLoop={abLoop}
                            onSeek={handleSeek} 
                            onSeekStart={handleSeekStart}
                            onSeekEnd={handleSeekEnd}
                            bufferedTime={bufferedTime}
                            favParts={videoFavParts}
                            videoSrc={src}
                            bookmarks={bookmarks}
                            ghostPosition={ghostPosition}
                        />
                    </div>
                )}
                
                <div className="flex items-center justify-between gap-4 w-full">
                    {/* Left Controls */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {uiSettings.showPlayPause && <> <button onClick={() => handleAction('seekBackwardShort')} title="Rewind 5s (←)"><RewindIcon className="w-6 h-6"/></button> <button onClick={() => handleAction('frameBackward')} title="Previous Frame (,)"><StepBackIcon className="w-5 h-5" /></button> <button onClick={() => handleAction('togglePlay')} className="w-8 h-8" title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}>{isPlaying ? <PauseIcon className="w-8 h-8"/> : <PlayIcon className="w-8 h-8"/>}</button> <button onClick={() => handleAction('frameForward')} title="Next Frame (.)"><StepForwardIcon className="w-5 h-5" /></button> <button onClick={() => handleAction('seekForwardShort')} title="Forward 5s (→)"><FastForwardIcon className="w-6 h-6"/></button> </>}
                        {uiSettings.showVolume && (
                                <div className="relative flex items-center group/volume">
                                <button onClick={handleMuteToggle} title={isMuted ? "Unmute (M)" : "Mute (M)"}>
                                    <VolumeIcon level={volume > 1 ? 1 : volume} muted={isPlayerMuted} className={`w-6 h-6 ${volume > 1 ? 'text-[rgb(var(--player-accent))]' : ''}`}/>
                                </button>
                                    <div data-popover-content="true" className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover/volume:opacity-100 group-hover/volume:translate-y-0 translate-y-2 transition-all duration-300 pointer-events-none group-hover/volume:pointer-events-auto">
                                        <div className="bg-black/50 py-4 px-2 rounded-[var(--player-radius)] flex items-center justify-center w-12 h-[160px] backdrop-blur-md relative border border-[rgba(var(--player-text-primary),0.1)]">
                                            <input type="range" min="0" max="3" step="0.01" value={isPlayerMuted ? 0 : volume} onChange={e => { const newVol = parseFloat(e.target.value); updatePlayerState({ volume: newVol, isMuted: newVol > 0 ? false : isMuted }); }} className="slider-vertical z-10"/>
                                            <div className="absolute top-[66%] right-0 w-2 h-0.5 bg-white/50 z-0 pointer-events-none" title="100%"></div>
                                        </div>
                                </div>
                            </div>
                        )}
                        {uiSettings.showTime && <button onClick={() => handleAction('openTimeJump')} title="Jump to Time (Ctrl+G)" className="text-sm text-[rgb(var(--player-text-primary))] hover:text-[rgb(var(--player-accent))]" style={{ fontFamily: 'var(--player-font-mono)' }}>{formatTime(currentTime)} / {formatTime(duration)}</button>}
                    </div>

                    {/* Right Controls */}
                    <div className="flex items-center space-x-2 md:space-x-4">
                        {uiSettings.showLoop && <button onClick={() => handleAction('toggleLoop')} title="Toggle Loop (L)"><RefreshCwIcon className={`w-5 h-5 transition-colors ${(videoRef.current && videoRef.current.loop) ? 'text-[rgb(var(--player-accent))]' : ''}`} /></button>}
                        {uiSettings.showABLoopControls && <div className="flex items-center space-x-1 bg-[rgba(var(--player-scrubber-bg),0.5)] p-0.5 rounded-md">
                            <button onClick={() => updatePlayerState({ abLoop: { ...abLoop, start: currentTime } })} style={abLoop.start !== null ? { color: `rgb(var(--player-accent))` } : {}} title="Set A/B loop start" className="p-1 rounded-sm hover:bg-[rgba(var(--player-accent),0.5)]"><BracketLeftIcon className="w-5 h-5" /></button>
                            <button onClick={() => updatePlayerState({ abLoop: { ...abLoop, end: currentTime, active: abLoop.start !== null && currentTime > (abLoop.start ?? -1) } })} style={abLoop.end !== null ? { color: `rgb(var(--player-accent))` } : {}} title="Set A/B loop end" className="p-1 rounded-sm hover:bg-[rgba(var(--player-accent),0.5)]"><BracketRightIcon className="w-5 h-5" /></button>
                            <button onClick={() => updatePlayerState({ abLoop: { ...abLoop, active: !abLoop.active } })} style={abLoop.active ? { color: `rgb(var(--player-accent))` } : {}} title="Toggle A/B loop" className="p-1 rounded-sm hover:bg-[rgba(var(--player-accent),0.5)]" disabled={abLoop.start === null || abLoop.end === null}><RefreshCwIcon className="w-5 h-5" /></button>
                            <button onClick={() => updatePlayerState({ abLoop: { start: null, end: null, active: false }})} title="Clear A/B loop" className="p-1 rounded-sm hover:bg-[rgba(var(--player-accent),0.5)]"><XIcon className="w-5 h-5" /></button>
                        </div>}
                        
                        <button onClick={() => updatePlayerState({ skipSilence: !skipSilence })} title={`Skip Silence: ${skipSilence ? 'ON' : 'OFF'}`} className={skipSilence ? 'text-[rgb(var(--player-accent))]' : ''}><RabbitIcon className="w-5 h-5"/></button>
                        <button onClick={() => handleAction('addBookmark')} title="Add Bookmark (B)"><BookmarkIcon className="w-5 h-5" /></button>

                        {uiSettings.showTransformControls && (<Popover isOpen={isTransformPopoverOpen} onClose={() => setIsTransformPopoverOpen(false)} position="top-right" trigger={<button onClick={() => setIsTransformPopoverOpen(true)} title="Transform Video"><CropRotateIcon className="w-5 h-5"/></button>}>
                            <div className="bg-[rgb(var(--player-bg))] border border-[rgba(var(--player-text-primary),0.2)] p-2 w-48 flex flex-col gap-2 rounded-lg shadow-xl" data-popover-content="true" onClick={e => e.stopPropagation()}>
                                <div className="flex justify-around">
                                    <button onClick={() => handleAction('rotateLeft')} title="Rotate Left (Shift+R)" className="p-1.5 rounded hover:bg-[rgba(var(--player-accent),0.2)]"><RotateCcwIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleAction('rotateRight')} title="Rotate Right (R)" className="p-1.5 rounded hover:bg-[rgba(var(--player-accent),0.2)]"><RotateCwIcon className="w-5 h-5"/></button>
                                </div>
                                <div className="flex justify-around">
                                    <button onClick={() => handleAction('flipHorizontal')} title="Flip Horizontal (H)" className={`p-1.5 rounded hover:bg-[rgba(var(--player-accent),0.2)] ${flipH ? 'text-[rgb(var(--player-accent))]' : ''}`}><FlipHorizontalIcon className="w-5 h-5"/></button>
                                    <button onClick={() => handleAction('flipVertical')} title="Flip Vertical (V)" className={`p-1.5 rounded hover:bg-[rgba(var(--player-accent),0.2)] ${flipV ? 'text-[rgb(var(--player-accent))]' : ''}`}><FlipVerticalIcon className="w-5 h-5"/></button>
                                </div>
                                <div className="h-px bg-white/10" />
                                <button onClick={() => updatePlayerState({ displayMode: localPlayerState.displayMode === 'ultrawide-crop' ? 'contain' : 'ultrawide-crop' })} className={`w-full text-left px-2 py-1.5 text-sm rounded hover:bg-[rgba(var(--player-accent),0.2)] ${localPlayerState.displayMode === 'ultrawide-crop' ? 'text-[rgb(var(--player-accent))]' : ''}`}>
                                    <CropIcon className="w-4 h-4 inline mr-2" /> Ultra-Wide Crop
                                </button>
                            </div>
                        </Popover>)}
                        
                        {uiSettings.showExtraControls && (
                            <>
                                <button onClick={() => setIsClipCutterOpen(true)} title="Cut Clip"><ScissorsIcon className="w-5 h-5"/></button>
                                <button onClick={() => setIsPlayerSettingsOpen(true)} title="Player Settings"><SettingsIcon className="w-5 h-5"/></button>
                                <button onClick={() => handleAction('toggleFullscreen')} title="Fullscreen (F)">{isFullscreen ? <FullscreenExitIcon className="w-5 h-5"/> : <FullscreenEnterIcon className="w-5 h-5"/>}</button>
                            </>
                        )}
                    </div>
                </div>
            </div>
        )}

        {isClipCutterOpen && <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl"><ClipCutterPopover mediaId={file.id} mediaTitle={file.title} startTime={clip?.startTime ?? 0} endTime={clip?.endTime ?? duration} currentTime={currentTime} duration={duration} addFavPart={addFavPart} onClose={() => setIsClipCutterOpen(false)} onSeek={handleSeek} setTempLoop={setTempLoop} /></div>}
        
        {isFilterPopoverOpen && (
            <div className="absolute right-4 bottom-20 z-40 bg-black/90 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl">
                <VideoFilterPopover effects={effects} updatePlayerState={updatePlayerState} settings={settings} updateSettings={updateSettings} />
            </div>
        )}

        {isPlayerSettingsOpen && (
            <PlayerSettingsDialog isOpen={isPlayerSettingsOpen} onClose={() => setIsPlayerSettingsOpen(false)} settings={settings} updateSettings={updateSettings} />
        )}

        {isPlaylistOpen && (
            <PlaylistOverlay isOpen={isPlaylistOpen} onClose={() => setIsPlaylistOpen(false)} playlist={playlist} currentFileId={file.id} onPlayFile={onPlayFile || (() => {})} />
        )}

        {isTimeJumpOpen && (
            <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center" onClick={() => setIsTimeJumpOpen(false)}>
                <div className="bg-[#1e1e1e] p-6 rounded-lg shadow-xl border border-white/10 w-64" onClick={e => e.stopPropagation()}>
                    <h3 className="text-white font-bold mb-4 text-lg">Jump to Time</h3>
                    <input 
                        id="time-jump-input"
                        type="text" 
                        value={timeJumpValue} 
                        onChange={e => setTimeJumpValue(e.target.value)} 
                        placeholder="mm:ss" 
                        className="bg-black/40 text-white p-2 rounded mb-4 w-full font-mono text-center focus:outline-none focus:ring-2 focus:ring-[rgb(var(--player-accent))]"
                        onKeyDown={e => { if (e.key === 'Enter') handleTimeJump(); if (e.key === 'Escape') setIsTimeJumpOpen(false); }}
                        autoFocus
                    />
                    <div className="flex justify-between">
                        <Button onClick={() => setIsTimeJumpOpen(false)} className="!bg-white/10 text-sm hover:!bg-white/20">Cancel</Button>
                        <Button onClick={handleTimeJump} className="text-sm" style={{ backgroundColor: 'rgb(var(--player-accent))' }}>Jump</Button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default VideoPlayer;
