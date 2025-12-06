export enum MediaType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  LIVE = 'LIVE'
}

export interface GeneratedItem {
  id: string;
  type: MediaType;
  url: string; // Blob URL or Data URL
  prompt: string;
  timestamp: number;
  metadata?: any;
}

export interface VoiceOption {
  name: string;
  id: string;
}

export const VOICES: VoiceOption[] = [
  { name: 'Kore', id: 'Kore' },
  { name: 'Puck', id: 'Puck' },
  { name: 'Charon', id: 'Charon' },
  { name: 'Fenrir', id: 'Fenrir' },
  { name: 'Zephyr', id: 'Zephyr' },
];
