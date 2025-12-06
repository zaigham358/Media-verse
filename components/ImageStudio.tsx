import React, { useState } from 'react';
import { generateImage } from '../services/geminiService';
import { MediaType, GeneratedItem } from '../types';

interface ImageStudioProps {
  onGenerate: (item: GeneratedItem) => void;
}

const ImageStudio: React.FC<ImageStudioProps> = ({ onGenerate }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const imageUrl = await generateImage(prompt, aspectRatio);
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        type: MediaType.IMAGE,
        url: imageUrl,
        prompt,
        timestamp: Date.now(),
      };
      onGenerate(newItem);
    } catch (e: any) {
      setError(e.message || "Failed to generate image");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Image Studio</h2>
        <p className="text-slate-400">Generate stunning visuals with Gemini 2.5 Flash Image.</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your imagination... e.g., A cyberpunk city floating in neon clouds"
          className="w-full bg-slate-900 text-white rounded-xl p-4 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-32 mb-4"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Aspect Ratio:</span>
            <select
              value={aspectRatio}
              onChange={(e) => setAspectRatio(e.target.value)}
              className="bg-slate-700 text-white text-sm rounded-lg px-3 py-2 border-none outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="1:1">Square (1:1)</option>
              <option value="16:9">Landscape (16:9)</option>
              <option value="9:16">Portrait (9:16)</option>
              <option value="4:3">Standard (4:3)</option>
              <option value="3:4">Portrait (3:4)</option>
            </select>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              loading || !prompt.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white shadow-lg shadow-purple-900/20'
            }`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-magic"></i> Generate
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default ImageStudio;
