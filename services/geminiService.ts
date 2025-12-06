import { GoogleGenAI, Modality, LiveServerMessage } from "@google/genai";
import { VOICES } from "../types";

// Helper to get client, ensuring we use the latest key if refreshed via UI
const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Image Generation ---
export const generateImage = async (prompt: string, aspectRatio: string = "1:1"): Promise<string> => {
  const ai = getClient();
  const model = "gemini-2.5-flash-image";

  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: aspectRatio as any,
      },
    },
  });

  // Extract image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("No image generated");
};

// --- Audio Generation (TTS) ---
export const generateSpeech = async (text: string, voiceName: string): Promise<ArrayBuffer> => {
  const ai = getClient();
  const model = "gemini-2.5-flash-preview-tts";

  const response = await ai.models.generateContent({
    model,
    contents: [{ parts: [{ text }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) throw new Error("No audio generated");
  
  // Simple decode to ArrayBuffer for the caller to process
  const binaryString = atob(base64Audio);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

// --- Video Generation (Veo) ---
export const generateVideo = async (prompt: string): Promise<string> => {
  // Check for Veo specific API key selection
  if ((window as any).aistudio && (window as any).aistudio.hasSelectedApiKey) {
     const hasKey = await (window as any).aistudio.hasSelectedApiKey();
     if (!hasKey) {
        throw new Error("API_KEY_REQUIRED");
     }
  }

  const ai = getClient();
  const model = "veo-3.1-fast-generate-preview";

  let operation = await ai.models.generateVideos({
    model,
    prompt,
    config: {
      numberOfVideos: 1,
      resolution: '720p',
      aspectRatio: '16:9'
    }
  });

  // Polling
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 5000)); // Poll every 5s
    operation = await ai.operations.getVideosOperation({ operation: operation });
  }

  const uri = operation.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) throw new Error("Video generation failed or no URI returned");

  // Fetch the actual video blob
  const videoRes = await fetch(`${uri}&key=${process.env.API_KEY}`);
  if (!videoRes.ok) throw new Error("Failed to download generated video");
  
  const blob = await videoRes.blob();
  return URL.createObjectURL(blob);
};

// --- Live API ---
// Exposes the connect method to be used by the component
export const connectLive = async (
  onOpen: () => void,
  onMessage: (msg: LiveServerMessage) => void,
  onClose: (e: CloseEvent) => void,
  onError: (e: ErrorEvent) => void
) => {
  const ai = getClient();
  return ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-preview-09-2025',
    callbacks: {
      onopen: onOpen,
      onmessage: onMessage,
      onclose: onClose,
      onerror: onError,
    },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
      },
      systemInstruction: "You are a creative assistant in a media studio. Be helpful, concise, and enthusiastic.",
    },
  });
};