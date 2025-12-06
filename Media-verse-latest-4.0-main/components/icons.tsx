
import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {}

// A wrapper for Material Icons to ensure consistent styling
const MaterialIcon: React.FC<IconProps> = ({ children, ...props }) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24" fill="currentColor">
        {children}
    </svg>
);

export const PinIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 4a2 2 0 0 0-2-2H9c-1.1 0-2 .9-2 2v7l-2 2v2h6v5l1 1 1-1v-5h6v-2l-2-2V4z"/></MaterialIcon>
);

export const SearchIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></MaterialIcon>
);

export const FilterIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z"/></MaterialIcon>
);

export const EditIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a.9959.9959 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></MaterialIcon>
);

export const SortAscendingIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 18h6v-2H3v2zM3 6v2h18V6H3zm0 7h12v-2H3v2z"/></MaterialIcon>
);

export const GridIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-7v6h5V5h-5z"/></MaterialIcon>
);

export const ListIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 14h4v-4H3v4zm0 5h4v-4H3v4zM3 9h4V5H3v4zm5 5h13v-4H8v4zm0 5h13v-4H8v4zM8 5v4h13V5H8z"/></MaterialIcon>
);

export const CheckSquareIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="m10 17 5-5-1.41-1.41L10 14.17l-2.59-2.58L6 13l4 4zm9-12H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/></MaterialIcon>
);

export const CheckIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M9 16.17 4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></MaterialIcon>
);

export const UploadIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M9 16h6v-6h4l-7-7-7 7h4v6zm-4 2h14v2H5v-2z"/></MaterialIcon>
);

export const UndoIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z"/></MaterialIcon>
);

export const RedoIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M18.4 10.6C16.55 8.99 14.15 8 11.5 8c-4.65 0-8.58 3.03-9.96 7.22L3.9 16c1.05-3.19 4.05-5.5 7.6-5.5 1.95 0 3.73.72 5.12 1.88L13 16h9V7l-3.6 3.6z"/></MaterialIcon>
);

export const SlidersIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></MaterialIcon>
);

export const UploadCloudIcon: React.FC<IconProps> = (props) => (
  <MaterialIcon {...props}><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></MaterialIcon>
);

export const SparklesIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 2c-5.52 0-10 4.48-10 10s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM9.5 16.5 7 14l2.5-2.5L7 9l2.5-2.5L12 9l2.5-2.5L17 9l-2.5 2.5L17 14l-2.5 2.5L12 14l-2.5 2.5z"/></MaterialIcon>
);

export const PlayIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M8 5v14l11-7z"/></MaterialIcon>
);

export const PauseIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></MaterialIcon>
);

export const VideoIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/></MaterialIcon>
);

export const XIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></MaterialIcon>
);

export const TrashIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></MaterialIcon>
);

export const ImageIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/></MaterialIcon>
);

export const AudioIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 3v9.28c-.47-.17-.97-.28-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z"/></MaterialIcon>
);

export const FileIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z"/></MaterialIcon>
);

export const HeartIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></MaterialIcon>
);

export const SettingsIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49 1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/></MaterialIcon>
);

export const PlusIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></MaterialIcon>
);

export const FolderIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z"/></MaterialIcon>
);

export const ScissorsIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M9.64 7.64c.23-.5.36-1.05.36-1.64 0-2.21-1.79-4-4-4S2 3.79 2 6s1.79 4 4 4c.59 0 1.14-.13 1.64-.36L10 12l-2.36 2.36C7.14 14.13 6.59 14 6 14c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4c0-.59-.13-1.14-.36-1.64L12 14l7 7h3v-1l-6.36-6.36L14 12l2.36-2.36zM6 8c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm0 12c-1.1 0-2-.89-2-2s.9-2 2-2 2 .89 2 2-.9 2-2 2zm6-7.5c-.28 0-.5.22-.5.5s.22.5.5.5.5-.22.5-.5-.22-.5-.5-.5zM20.71 5.71l-1.41-1.41c-.39-.39-1.02-.39-1.41 0l-1.06 1.06 2.83 2.83 1.06-1.06c.39-.39.39-1.02 0-1.42z"/></MaterialIcon>
);

export const StarIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></MaterialIcon>
);

export const MoreVerticalIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></MaterialIcon>
);

export const DatabaseIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 3C7.03 3 3 5.34 3 8v1.45c0 .39.19.74.49.95L12 14l8.51-4.6c.3-.21.49-.56.49-.95V8c0-2.66-4.03-5-9-5zm0 15c-4.97 0-9-2.34-9-5v-1.45c0-.39.19-.74.49-.95L12 15l8.51-4.6c.3-.21.49-.56.49-.95V8h2v2.12c0 1.59-2.03 3.03-5 4.12V18c0 2.66-4.03 5-9 5z"/></MaterialIcon>
);

export const CalendarIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 12h-5v5h5v-5zM16 1v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2h-1V1h-2zm3 18H5V8h14v11z"/></MaterialIcon>
);

export const MaximizeIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 3h18v2H3z"/></MaterialIcon>
);

export const FullscreenEnterIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z"/></MaterialIcon>
);
  
export const FullscreenExitIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z"/></MaterialIcon>
);

export const FastForwardIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></MaterialIcon>
);

export const RewindIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M11 18V6l-8.5 6 8.5 6zm.5-6 8.5 6V6l-8.5 6z"/></MaterialIcon>
);

export const SpeedUpIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M4 4h16v16H4z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-1-8v6l5-3-5-3z"/></MaterialIcon>
);

export const SpeedDownIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M4 4h16v16H4z" fill="none"/><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm-1-8v6l5-3-5-3z"/></MaterialIcon>
);

export const GripVerticalIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/></MaterialIcon>
);

export const LinkIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z"/></MaterialIcon>
);

export const UnlinkIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h10c2.76 0 5-2.24 5-5s-2.24-5-5-5zm-7 8H7c-1.65 0-3-1.35-3-3s1.35-3 3-3h3v6zm5-6v6h-3V9h3c1.65 0 3 1.35 3 3s-1.35 3-3 3h-3v-2h3c.55 0 1-.45 1-1s-.45-1-1-1h-3v-2h3c.55 0 1-.45 1-1s-.45-1-1-1h-3V9h3z"/></MaterialIcon>
);

export const RefreshCwIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></MaterialIcon>
);

export const CopyIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></MaterialIcon>
);

export const ChevronsLeftIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M11 17.88V6.12c0-.89-1.08-1.34-1.71-.71L3.7 11.29c-.39.39-.39 1.02 0 1.41l5.59 5.88c.63.63 1.71.18 1.71-.7zM18 17.88V6.12c0-.89-1.08-1.34-1.71-.71l-5.59 5.88c-.39.39-.39 1.02 0 1.41l5.59 5.88c.63.63 1.71.18 1.71-.7z"/></MaterialIcon>
);

export const ChevronsRightIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M5.59 17.29c.39.39 1.02.39 1.41 0l5.59-5.88c.39-.39.39-1.02 0-1.41L7 4.12c-.63-.62-1.71-.17-1.71.71v11.76c0 .89 1.08 1.34 1.71.7zM12.59 17.29c.39.39 1.02.39 1.41 0l5.59-5.88c.39-.39.39-1.02 0-1.41L14 4.12c-.63-.62-1.71-.17-1.71.71v11.76c0 .89 1.08 1.34 1.71.7z"/></MaterialIcon>
);

export const ChevronLeftIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></MaterialIcon>
);

export const ChevronRightIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></MaterialIcon>
);


export const KeyboardIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M20 5H4c-1.1 0-1.99.9-1.99 2L2 17c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-9 3h2v2h-2V8zm0 3h2v2h-2v-2zM8 8h2v2H8V8zm0 3h2v2H8v-2zm-1 2H5v-2h2v2zm0-3H5V8h2v2zm9 7H8v-2h8v2zm0-4h-2v-2h2v2zm0-3h-2V8h2v2zm3 3h-2v-2h2v2zm0-3h-2V8h2v2z"/></MaterialIcon>
);

export const PictureInPictureIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M19 7h-8v6h8V7zm2-4H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H3V5h18v14z"/></MaterialIcon>
);

export const PictureInPictureExitIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M19 11h-8v6h8v-6zm4 8V4.98C23 3.88 22.1 3 21 3H3c-1.1 0-2 .88-2 1.98V19c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2zm-2 .02H3V4.97h18v14.05z"/></MaterialIcon>
);

export const CameraIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><circle cx="12" cy="12" r="3.2"/><path d="M9 2 7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></MaterialIcon>
);

export const StepForwardIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/></MaterialIcon>
);

export const StepBackIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="m18 18-8.5-6L18 6v12zM6 6v12H4V6h2z"/></MaterialIcon>
);

export const SlidersHorizontalIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 17v2h6v-2H3zM3 5v2h10V5H3zm10 16v-2h8v-2h-8v-2h-2v6h2zM7 9v2H3v2h4v2h2V9H7zm14 4v-2H11v2h10zm-6-4h2V7h4V5h-4V3h-2v6z"/></MaterialIcon>
);

export const LayoutGridIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-7v6h5V5h-5z"/></MaterialIcon>
);

export const SquareIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3 3v18h18V3H3zm16 16H5V5h14v14z"/></MaterialIcon>
);

export const XSquareIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4.29 12.29-1.41 1.42L12 15.41l-1.29 1.29-1.41-1.41L10.59 14l-1.3-1.29 1.42-1.41L12 12.59l1.29-1.3 1.41 1.42L13.41 14l1.3 1.29z"/></MaterialIcon>
);

export const BracketLeftIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15 4v2h3v12h-3v2h5V4zM4 4v16h5v-2H6V6h3V4z"/></MaterialIcon>
);
export const BracketRightIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M9 20v-2H6V6h3V4H4v16zm11-16v16h-5v-2h3V6h-3V4z"/></MaterialIcon>
);

export const AspectRatioIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M16 10h-2v2h2v-2zm0 4h-2v2h2v-2zm-4-4h-2v2h2v-2zm-4 0H6v2h2v-2zm12-4H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z"/></MaterialIcon>
);

export const VolumeIcon: React.FC<IconProps & { level: number, muted: boolean }> = ({ level, muted, ...props }) => {
    if (muted) return <MaterialIcon {...props}><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z"/></MaterialIcon>;
    if (level === 0) return <MaterialIcon {...props}><path d="M7 9v6h4l5 5V4l-5 5H7z"/></MaterialIcon>;
    if (level < 0.5) return <MaterialIcon {...props}><path d="M18.5 12c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM5 9v6h4l5 5V4L9 9H5z"/></MaterialIcon>;
    return <MaterialIcon {...props}><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></MaterialIcon>;
};

export const SunIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M20 8.69V4h-4.69L12 .69 8.69 4H4v4.69L.69 12 4 15.31V20h4.69L12 23.31 15.31 20H20v-4.69L23.31 12 20 8.69zM12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-1.79-4-4-4z"/></MaterialIcon>
);
export const ContrastIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zM13 4.07c3.94.49 7 3.85 7 7.93s-3.05 7.44-7 7.93V4.07z"/></MaterialIcon>
);
export const DropletIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/><path d="M12 18c-3.31 0-6-2.69-6-6 0-2.23 1.22-4.15 3-5.19V12h6v-5.19c1.78 1.04 3 2.96 3 5.19 0 3.31-2.69 6-6 6z"/></MaterialIcon>
);
export const EyeOffIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 6.5c2.76 0 5 2.24 5 5 0 .51-.1 1-.24 1.46l3.06 3.06c1.39-1.16 2.49-2.77 3.18-4.53C21.27 7.11 17 4 12 4c-1.27 0-2.49.2-3.64.57l2.18 2.18c.46-.14.95-.24 1.46-.24zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM12 17c-2.76 0-5-2.24-5-5 0-.77.18-1.5.49-2.14l1.57 1.57c-.03.18-.06.36-.06.57 0 1.66 1.34 3 3 3s3-1.34 3-3c0-.21-.03-.4-.06-.57l1.57-1.57C16.82 10.5 17 11.23 17 12c0 2.76-2.24 5-5 5zm-1-6.5c0-.55.45-1 1-1s1 .45 1 1-.45 1-1 1-1-.45-1-1z"/></MaterialIcon>
);
export const PaletteIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c2.03 0 3.9-.67 5.4-1.81l-1.4-1.4c-1 .82-2.21 1.31-3.5 1.31-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6c0 1.29-.49 2.49-1.31 3.5l1.4 1.4C19.33 15.9 20 14.03 20 12c0-4.97-4.03-9-8-9z"/></MaterialIcon>
);

export const SaveIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></MaterialIcon>
);

export const TagIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M20 10V8h-4V4h-2v4h-4V4H8v4H4v2h4v4H4v2h4v4h2v-4h4v4h2v-4h4v-2h-4v-4h4zm-6 4h-4v-4h4v4z"/></MaterialIcon>
);

export const ClockIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-13h2v6h-2zm4.25-4.25.71.71-3.54 3.54-.71-.71z"/></MaterialIcon>
);
export const BookmarkIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/></MaterialIcon>
);
export const ListPlusIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M14 10H3v2h11v-2zm0-4H3v2h11V6zM3 16h7v-2H3v2zm18-4v-3h-2v3h-3v2h3v3h2v-3h3v-2z"/></MaterialIcon>
);
export const EyeIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5C21.27 7.61 17 4.5 12 4.5zm0 12.5c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></MaterialIcon>
);
export const PaintBrushIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37L18 2H6c-1.1 0-2 .9-2 2v10.55c.59-.34 1.27-.55 2-.55 2.21 0 4 1.79 4 4 .73 0 1.41-.21 2-.55V4h5.29l2.71 2.71z"/></MaterialIcon>
);
export const PanelLeftCloseIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M18.41 16.59 13.82 12l4.59-4.59L17 6l-6 6 6 6 1.41-1.41zM6 6h2v12H6V6z"/></MaterialIcon>
);
export const PanelLeftOpenIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M5.59 7.41 10.17 12l-4.58 4.59L7 18l6-6-6-6-1.41 1.41zM16 6h2v12h-2V6z"/></MaterialIcon>
);
export const MousePointerClickIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="m9 15.7-2.3-5.3-5.3-2.3 21-8-8 21-2.4-5.4zM9.5 13.4l1.3 2.9 4.3 1.9-15-6.5 1.9 4.3 2.9 1.3z"/></MaterialIcon>
);
export const RotateCwIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15.55 5.55 11 1v3.07C7.06 4.56 4 7.92 4 12s3.05 7.44 7 7.93v-2.02c-2.84-.48-5-2.94-5-5.91s2.16-5.43 5-5.91V10l4.55-4.45zM19.93 11c-.17-1.39-.72-2.73-1.62-3.89l-1.42 1.42c.54.75.88 1.6 1.02 2.47h2.02zM13 17.9v2.02c1.39-.17 2.74-.71 3.9-1.61l-1.44-1.44c-.75.54-1.59.89-2.46 1.03zm3.89-2.42 1.42 1.41c.9-1.16 1.45-2.5 1.62-3.89h-2.02c-.14.87-.48 1.72-1.02 2.48z"/></MaterialIcon>
);
export const RotateCcwIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M7.11 8.53 5.7 7.11C4.8 8.27 4.24 9.61 4.07 11h2.02c.14-.87.49-1.72 1.02-2.47zM6.09 13H4.07c.17 1.39.72 2.73 1.62 3.89l1.41-1.42c-.52-.75-.87-1.59-1.01-2.47zm1.01 5.32c1.16.9 2.51 1.44 3.9 1.61v-2.02c-.87-.15-1.71-.49-2.46-1.03l-1.44 1.44zM13 4.07V1L8.45 5.55 13 10V6.09c2.84.48 5 2.94 5 5.91s-2.16 5.43-5 5.91v2.02c3.95-.49 7-3.85 7-7.93s-3.06-7.44-7-7.93z"/></MaterialIcon>
);
export const FlipHorizontalIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-8 20h2V1h-2v22zm8-6h2v-2h-2v2zM15 5h2V3h-2v2zm4 8h2v-2h-2v2zm0 8c1.1 0 2-.9 2-2h-2v2z"/></MaterialIcon>
);
export const FlipVerticalIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm4 16H5V5h14v14zM1 12h22v2H1z"/></MaterialIcon>
);
export const CropRotateIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M7.47 21.49C4.2 19.93 1.86 16.76 1.5 13H0c.51 6.16 5.66 11 11.95 11 .23 0 .44-.02.66-.03L8.8 20.15l-1.33 1.34zM12.05 0c-.23 0-.44.02-.66.04l3.81 3.81 1.33-1.33C19.8 4.07 22.14 7.24 22.5 11H24c-.51-6.16-5.66-11-11.95-11zM16 14h2V8c0-1.11-.9-2-2-2h-6v2h6v6zm-8 2V4H6v2H4v2h2v8c0 1.1.89 2 2 2h8v2h2v-2h2v-2H8z"/></MaterialIcon>
);
export const PauseCircleIcon: React.FC<IconProps> = (props) => (
  <MaterialIcon {...props}><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/></MaterialIcon>
);

// New Icons for Image Viewer
export const ZoomInIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM12 10h-2v2H9v-2H7V9h2V7h1v2h2v1z"/></MaterialIcon>
);
export const ZoomOutIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7z"/></MaterialIcon>
);
export const InfoIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></MaterialIcon>
);
export const SlideshowIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12zM10 12l6-4-6-4v8z"/></MaterialIcon>
);

// Newly added icons
export const RabbitIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z"/></MaterialIcon>
);
export const CropIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M17 15h2V7c0-1.1-.9-2-2-2H9v2h8v8zM7 17V1H5v4H1v2h4v10c0 1.1.9 2 2 2h10v4h2v-4h4v-2H7z"/></MaterialIcon>
);
export const TimerIcon: React.FC<IconProps> = (props) => (
    <MaterialIcon {...props}><path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z"/></MaterialIcon>
);
