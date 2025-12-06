import { MouseEvent } from "react";

export type MediaType = 'video' | 'image' | 'audio' | 'document' | 'archive';
export type View = 'dashboard' | 'ai_assistant' | 'fav_parts' | 'uploads' | 'favorites' | 'grid_player';

export type SortOption =
  | 'createdAt-desc'
  | 'createdAt-asc'
  | 'title-asc'
  | 'title-desc'
  | 'size-asc'
  | 'size-desc'
  | 'rating-desc'
  | 'rating-asc'
  | 'duration-desc'
  | 'duration-asc';

export type ViewMode = 'grid' | 'list';
export type VideoDisplayMode = 'contain' | 'cover' | 'fill' | 'force-16-9' | 'force-4-3' | 'ultrawide-crop';

export type Theme = 'vibrant' | 'classic' | 'light' | 'nordic' | 'solarized' | 'crimson-noir' | 'evergreen' | 'cyberpunk' | 'sunset' | 'matrix';

export type PlayerTheme = 'default' | 'minimal' | 'cinema' | 'retro-tv' | 'neon-glow' | 'professional' | 'vibrant-glass' | 'classic-player' | 'artistic' | 'mobile' | 'arctic-glass' | 'midnight-minimal' | 'aqua-marine' | 'ruby-red' | 'zen-garden';

export type PlayerLayout = 
  | 'standard' 
  | 'compact'
  | 'minimal' 
  | 'floating' 
  | 'glass-panel'
  | 'neon-frame'
  | 'gradient-border'
  | 'floating-pill'
  | 'brutalist'
  | 'neumorphic'
  | 'cyber-glitch'
  | 'transparent-pro'
  | 'material-float'
  | 'island-float'
  | 'detached-bar'
  | 'bottom-line'
  | 'vertical-stack'
  | 'cinematic'
  | 'retro'
  | 'modern-dark'
  | 'modern-light'
  | 'gradient-flow'
  | 'soft-glow'
  | 'pill-blur'
  | 'box-overlay'
  | 'split-deck'
  | 'material-elevated'
  | 'chroma-bar'
  | 'aurora'
  | 'outline-sharp'
  | 'hyper'
  | 'vibrant-flow'
  | 'neon-punk'
  | 'glass-pro'
  | 'sunset-gradient'
  | 'oceanic'
  | 'forest-glass'
  | 'royal-gold'
  | 'cherry-blossom'
  | 'dark-matter';

export interface VideoEffects {
  brightness: number; // 0-2
  contrast: number;   // 0-2
  saturate: number;   // 0-2
  grayscale: boolean;
  sepia: boolean;
  invert: boolean;
  hue: number; // 0-360 degrees
  blur: number; // 0-10 pixels
  dropShadow: boolean;
}

export interface CustomPlayerFilterPreset {
  id: string;
  name: string;
  effects: VideoEffects;
}

export interface ABLoop {
  start: number | null;
  end: number | null;
  active: boolean;
}

export type EndOfVideoAction = 'next' | 'loop' | 'pause' | 'rewind' | 'exit-fullscreen';

export interface PlayerState {
  currentTime: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isPip: boolean;
  resumeFrom?: number; // Time to show the resume prompt for
  displayMode: VideoDisplayMode;
  zoom: number;
  rotation: number; // 0, 90, 180, 270
  flipH: boolean;
  flipV: boolean;
  playerTheme: PlayerTheme;
  playerLayout: PlayerLayout;
  abLoop: ABLoop;
  effects: VideoEffects;
  headerHeight?: number;
  footerHeight?: number;
  
  // New Features
  bookmarks: number[];
  skipSilence: boolean;
  keyframeSeeking: boolean;
  endAction: EndOfVideoAction;
}

export interface AiSearchFilter {
    title_contains?: string;
    type_is?: MediaType;
    rating_greater_than?: number;
    rating_less_than?: number;
    created_after?: string; // ISO 8601 date string
    created_before?: string; // ISO 8601 date string
    is_favorite?: boolean;
    has_description?: boolean;
    tags_include?: string[];
}


export interface Tab {
  id: string;
  title: string;
  view: View;
  activeCategoryId: string;
  activeCollectionId: string | null;
  dashboardView?: 'files' | 'categories';
  viewingState: { file: MediaFile; clip?: FavPart; contextPlaylist?: MediaFile[] } | null;
  searchQuery: string;
  aiSearchFilters?: AiSearchFilter | null;
  filterType: MediaType | 'all' | 'shorts';
  sortOption: SortOption;
  viewMode: ViewMode;
  selectedFileIds: string[];
  focusedFileId: string | null;
  playerState: PlayerState;
  gridPlayerState?: GridPlayerState;
  isPinned: boolean;
  isMuted?: boolean;
  selectionMode?: boolean;
  renamingFileId?: string | null;
  detailsPanelFileId?: string | null;
}

export type ColorTag = 'red' | 'yellow' | 'green' | 'blue' | 'purple';

export interface MediaFile {
  id: string;
  type: MediaType;
  title: string;
  category: string; // categoryId
  isFavorite: boolean;
  rating: number; // 0-5 stars
  createdAt: number; // timestamp
  colorTag?: ColorTag;
  metadata: {
    size: number;
    duration?: number; // in seconds
    resolution?: string; // e.g., "1920x1080"
    artist?: string;
    album?: string;
    description?: string; // AI Generated
    tags?: string[]; // AI Generated
  };
  contentHash?: string;
}

// Stored in DB
export interface MediaFileRecord extends MediaFile {
  src: Blob; // The actual file
  thumbnail?: Blob;
}

export interface Category {
  id: string;
  name: string;
  order: number;
  isPinned?: boolean;
  color?: string;
}

export interface CollectionRule {
  field: keyof MediaFile | `metadata.${keyof MediaFile['metadata']}`;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains' | 'neq';
  value: string | number | boolean;
}

export type IconName = 'Clock' | 'Star' | 'Bookmark' | 'Folder' | 'Heart' | 'Sparkles' | 'Video' | 'Image' | 'Audio';

export interface Collection {
  id: string;
  name: string;
  type: 'smart' | 'manual';
  rules?: CollectionRule[]; // For smart collections
  mediaIds?: string[]; // For manual collections
  icon?: IconName;
}

export interface Workspace {
  id: string;
  name: string;
  state: {
    tabs: Tab[];
    activeTabId: string | null;
    isSidebarCollapsed: boolean;
    isSidebarVisible: boolean;
  };
}

export interface FavPart {
  id: string;
  mediaId: string;
  title: string;
  startTime: number;
  endTime: number;
  tags?: string[];
  isLinked?: boolean;
}

export type UploadTaskStatus = 'queued' | 'processing' | 'paused' | 'complete' | 'error' | 'cancelled';

export interface UploadTask {
    id: string;
    file: File;
    status: UploadTaskStatus;
    progress: number; // 0-100
    error?: string;
    speed?: number; // bytes per second (simulated)
    stage?: 'hashing' | 'generating_thumb' | 'saving' | 'done'; // Detailed status
}

// History & Undo/Redo Types
export interface MediaFileHistoryUpdate {
    id: string;
    previous: Partial<MediaFile>;
    current: Partial<MediaFile>;
}

export interface HistoryEntry {
    description: string;
    timestamp: number;
    updates: MediaFileHistoryUpdate[];
}

// Settings
export type GestureAction =
  | 'none'
  | 'togglePlay'
  | 'toggleFullscreen'
  | 'toggleMute'
  | 'seekForward'
  | 'seekBackward'
  | 'volumeUp'
  | 'volumeDown'
  | 'speedUp'
  | 'speedDown'
  | 'seekForwardShort'
  | 'seekBackwardShort'
  | 'seekForwardMedium'
  | 'seekBackwardMedium'
  | 'seekForwardLong'
  | 'seekBackwardLong';

export interface ClickActions {
  singleClick: GestureAction;
  doubleClick: GestureAction;
  tripleClick: GestureAction;
}

export interface GestureSettings {
  enabled: boolean;
  sensitivity: number; // ms for double/triple click
  quadrants: {
    topLeft: ClickActions;
    topRight: ClickActions;
    bottomLeft: ClickActions;
    bottomRight: ClickActions;
  };
}

export interface TabSettings {
  openLocation: 'nextToActive' | 'atEnd';
  defaultTitle: string;
  warnOnCloseMultiple: boolean;
}

export interface ContextMenuSettings {
  items: {
    newTab: boolean;
    closeTab: boolean;
    reopenTab: boolean;
    toggleSidebar: boolean;
    accentColor: boolean; 
    viewMode: boolean;
    toggleSelection: boolean;
    goToUploads: boolean;
    reload: boolean;
  };
}

export interface PlayerUISettings {
    showTopBar: boolean;
    showControlsBar: boolean;
    showScrubber: boolean;
    alwaysShowScrubber: boolean;
    showPlayPause: boolean;
    showVolume: boolean;
    showTime: boolean;
    showPlaybackRate: boolean;
    showABLoopControls: boolean;
    showFilterControls: boolean;
    showExtraControls: boolean;
    showTransformControls: boolean;
    showLoop: boolean;
    showClipButton: boolean;
    showPipButton: boolean;
    showAspectRatioButton: boolean;
    showFrameStepButtons: boolean;
    showFullscreenButton: boolean;
    showSettingsButton: boolean;
}

export interface VideoPlayerContextMenuSettings {
  view: boolean;
  abLoop: boolean;
  videoEffects: boolean;
  playback: boolean;
  video: boolean;
  transform: boolean;
  audio: boolean;
  speed: boolean;
  fullscreen: boolean;
  snapshot: boolean;
  pip: boolean;
  reload: boolean;
  copySource: boolean;
  close: boolean;
  frameStep: boolean;
  aspectRatio: boolean;
  zoom: boolean;
}

export type KeyboardShortcutAction =
  | 'newTab'
  | 'closeTab'
  | 'reopenTab'
  | 'nextTab'
  | 'prevTab'
  | 'switchToTab1'
  | 'switchToTab2'
  | 'switchToTab3'
  | 'switchToTab4'
  | 'switchToTab5'
  | 'switchToTab6'
  | 'switchToTab7'
  | 'switchToTab8'
  | 'switchToTab9'
  | 'deleteSelection'
  | 'selectAll'
  | 'clearSelection'
  | 'toggleSidebar'
  | 'undo'
  | 'redo';

export type PlayerKeyboardShortcutAction =
  | 'togglePlay'
  | 'toggleMute'
  | 'toggleFullscreen'
  | 'toggleLoop'
  | 'volumeUp'
  | 'volumeDown'
  | 'seekForwardShort'
  | 'seekBackwardShort'
  | 'seekForwardMedium'
  | 'seekBackwardMedium'
  | 'seekForwardLong'
  | 'seekBackwardLong'
  | 'speedUp'
  | 'speedDown'
  | 'speedReset'
  | 'frameForward'
  | 'frameBackward'
  | 'rotateRight'
  | 'rotateLeft'
  | 'flipHorizontal'
  | 'flipVertical'
  | 'seekTo0'
  | 'seekTo10'
  | 'seekTo20'
  | 'seekTo30'
  | 'seekTo40'
  | 'seekTo50'
  | 'seekTo60'
  | 'seekTo70'
  | 'seekTo80'
  | 'seekTo90'
  | 'addBookmark'
  | 'nextBookmark'
  | 'prevBookmark'
  | 'openTimeJump';

export interface Shortcut {
  key: string;
  enabled: boolean;
  name: string;
}


export interface AppSettings {
  accentColor?: string;
  theme: Theme;
  defaultPlayerTheme: PlayerTheme;
  defaultPlayerLayout: PlayerLayout;
  cardSize: 'small' | 'medium' | 'large';
  thumbnailFit: 'cover' | 'contain';
  hoverEffect: 'glow' | 'scale' | 'none';
  enableAnimations: boolean;
  animationSpeed: 'fast' | 'normal' | 'slow';
  
  // New Grid Interaction Settings
  mediaInteraction: 'singleClickOpen' | 'doubleClickOpen';
  showHoverSelect: boolean;
  hoverSelectDelay: number; // ms, 0 to disable
  
  showCardTitle: boolean;
  showCardRating: boolean;
  showCardDate: boolean;
  showCardSize: boolean;
  showCardResolution: boolean;
  showCardDuration: boolean;
  showDetailsPanel: boolean;

  seekForwardAmount: number; // seconds
  seekBackwardAmount: number; // seconds
  seekForwardMediumAmount: number;
  seekBackwardMediumAmount: number;
  seekForwardLongAmount: number;
  seekBackwardLongAmount: number;
  defaultPlaybackRate: number;
  controlsAutoHideDelay: number; // seconds, 0 for never
  
  videoPlayerGestures: GestureSettings;
  
  scrollUpAction: GestureAction;
  scrollDownAction: GestureAction;
  swipeAction: 'seek' | 'none';
  swipeSensitivity: number; // multiplier

  rememberPlaybackPosition: boolean;
  resumeBehavior: 'ask' | 'auto';
  loopVideo: boolean;
  autoplayNext: boolean;
  defaultVideoDisplayMode: VideoDisplayMode;
  defaultEndAction: EndOfVideoAction;
  
  // New Video Player Settings
  playerIconSize: 'sm' | 'md' | 'lg';
  playerUISettings: PlayerUISettings;
  videoPlayerContextMenuSettings: VideoPlayerContextMenuSettings;
  customFilterPresets: CustomPlayerFilterPreset[];
  scrubberThickness: 'sm' | 'md' | 'lg';
  scrubberShape: 'rounded' | 'square';
  useCustomPlayerAccent: boolean;
  customPlayerAccentColor: string;
  playerFont: 'system' | 'sans' | 'serif' | 'mono';
  playerControlOpacity: number;
  enablePlayerGlassmorphism: boolean;
  showPlayerControlGradient: boolean;
  pauseOnSeek: boolean;
  autoPipOnTabSwitch: boolean;
  showPlayerTooltips: boolean;
  centralPlayButtonStyle: 'play' | 'big-play' | 'none';
  timeDisplayFormat: 'standard' | 'remaining' | 'both';
  showUnlinkedClipRange: boolean;
  feedbackIndicatorStyle: 'icon-only' | 'text-only' | 'both';
  volumeStep: number;
  invertVolumeScroll: boolean;


  tabSettings: TabSettings;
  contextMenuSettings: ContextMenuSettings;

  isSidebarCollapsed: boolean;
  isSidebarVisible: boolean;
  keyboardShortcuts: Record<KeyboardShortcutAction, Shortcut>;
  playerKeyboardShortcuts: Record<PlayerKeyboardShortcutAction, Shortcut>;
}

export interface StorageQuota {
    used: number;
    quota: number;
    percent: number;
}

export interface UseMediaStateReturn {
  mediaFiles: MediaFile[];
  categories: Category[];
  collections: Collection[];
  workspaces: Workspace[];
  favParts: FavPart[];
  uploadTasks: UploadTask[];
  settings: AppSettings | null;
  UNCATEGORIZED_ID: string;
  storageQuota: StorageQuota | null;

  addMediaFile: (fileData: MediaFile, src: Blob, thumbnail?: Blob) => Promise<void>;
  updateMediaFile: (updatedFile: MediaFile) => Promise<void>;
  updateMediaFiles: (updates: {id: string, changes: Partial<MediaFile>}[]) => Promise<void>;
  deleteMediaFile: (id: string) => Promise<void>;
  deleteMediaFiles: (ids: string[]) => Promise<void>;
  
  addCategory: (name: string) => Promise<Category>;
  updateCategory: (id: string, updates: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  updateCategoryOrder: (reorderedCategories: Category[]) => Promise<void>;
  mergeCategories: (sourceId: string, targetId: string) => Promise<void>;
  
  addCollection: (collection: Omit<Collection, 'id'>) => Promise<void>;
  updateCollection: (collection: Collection) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;

  addWorkspace: (workspace: Omit<Workspace, 'id'>) => Promise<void>;
  updateWorkspace: (workspace: Workspace) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;

  addFavPart: (part: Omit<FavPart, 'id'>) => Promise<void>;
  updateFavPart: (part: FavPart) => Promise<void>;
  deleteFavPart: (id: string) => Promise<void>;

  addUploadTasks: (files: File[] | FileList) => void;
  pauseUploadTask: (id: string) => void;
  resumeUploadTask: (id: string) => void;
  cancelUploadTask: (id: string) => void;
  retryUploadTask: (id: string) => void;
  removeUploadTask: (id: string) => void;
  clearCompletedUploads: () => void;
  pauseAllUploads: () => void;
  resumeAllUploads: () => void;
  
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  clearAllData: () => Promise<void>;
  clearMediaAndClips: () => Promise<void>;
  clearCategories: () => Promise<void>;
  resetSettings: () => Promise<void>;

  undo: () => Promise<void>;
  redo: () => Promise<void>;
  canUndo: boolean;
  canRedo: boolean;
}

export interface GridCellData {
  id: string; 
  file: MediaFile;
}

export type GridPlayerLayout = '1x1' | '2x2';

export interface GridPlayerState {
  cells: GridCellData[];
  layout: GridPlayerLayout;
  isSyncActive: boolean;
  soloAudioCellId: string | null;
}