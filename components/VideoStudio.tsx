import React, { useState } from 'react';
import { generateVideo } from '../services/geminiService';
import { MediaType, GeneratedItem } from '../types';

interface VideoStudioProps {
  onGenerate: (item: GeneratedItem) => void;
}

const VideoStudio: React.FC<VideoStudioProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    setStatus('Checking API Key permissions...');
    
    try {
      const videoUrl = await generateVideo(prompt);
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        type: MediaType.VIDEO,
        url: videoUrl,
        prompt,
        timestamp: Date.now(),
      };
      onGenerate(newItem);
      setStatus('Complete!');
    } catch (e: any) {
      if (e.message === 'API_KEY_REQUIRED' && (window as any).aistudio) {
        setStatus('Waiting for API Key selection...');
        try {
            await (window as any).aistudio.openSelectKey();
            // Retry once immediately after selection (optimistic)
            setStatus('Retrying generation...');
            const videoUrl = await generateVideo(prompt);
             const newItem: GeneratedItem = {
                id: Date.now().toString(),
                type: MediaType.VIDEO,
                url: videoUrl,
                prompt,
                timestamp: Date.now(),
            };
            onGenerate(newItem);
        } catch (retryError: any) {
            setError("Failed after key selection: " + retryError.message);
        }
      } else {
        setError(e.message || "Failed to generate video");
      }
    } finally {
      setLoading(false);
      if (!error) setStatus('');
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Video Studio</h2>
        <p className="text-slate-400">
            Create cinematic videos with Veo. 
            <span className="ml-2 text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded border border-purple-700">Paid GCP Project Required</span>
        </p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your scene... e.g., A cinematic drone shot of a futuristic city at sunset, 4k, highly detailed"
          className="w-full bg-slate-900 text-white rounded-xl p-4 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-32 mb-4"
        />

        <div className="flex items-center justify-between">
           <div className="text-sm text-slate-500 italic">
               Note: Video generation takes 1-2 minutes.
           </div>
          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              loading || !prompt.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-purple-900/20'
            }`}
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-video"></i> Create Video
              </>
            )}
          </button>
        </div>

        {loading && (
            <div className="mt-6 p-4 bg-slate-900 rounded-lg flex items-center justify-center flex-col gap-2">
                <div className="w-full max-w-xs bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 animate-pulse w-2/3 rounded-full"></div>
                </div>
                <span className="text-sm text-purple-300 animate-pulse">{status || "Processing with Veo..."}</span>
            </div>
        )}

        {error && (
            <div className="mt-4 text-red-400 bg-red-900/20 p-4 rounded-lg text-sm flex flex-col gap-2">
                <div className="font-bold"><i className="fas fa-exclamation-triangle"></i> Error</div>
                <div>{error}</div>
                {error.includes("entity was not found") && (
                     <button 
                        onClick={() => (window as any).aistudio?.openSelectKey()}
                        className="mt-2 text-xs bg-red-800 hover:bg-red-700 text-white px-3 py-1 rounded w-fit"
                     >
                        Reselect API Key
                     </button>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default VideoStudio;