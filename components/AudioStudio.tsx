import React, { useState } from 'react';
import { generateSpeech } from '../services/geminiService';
import { MediaType, GeneratedItem, VOICES } from '../types';

interface AudioStudioProps {
  onGenerate: (item: GeneratedItem) => void;
}

const AudioStudio: React.FC<AudioStudioProps> = ({ onGenerate }) => {
  const [text, setText] = useState('');
  const [voice, setVoice] = useState(VOICES[0].id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const arrayBuffer = await generateSpeech(text, voice);
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      
      const newItem: GeneratedItem = {
        id: Date.now().toString(),
        type: MediaType.AUDIO,
        url,
        prompt: text,
        timestamp: Date.now(),
        metadata: { voice }
      };
      onGenerate(newItem);
    } catch (e: any) {
      setError(e.message || "Failed to generate speech");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2">Audio Studio</h2>
        <p className="text-slate-400">Convert text to lifelike speech using Gemini TTS.</p>
      </div>

      <div className="bg-slate-800 rounded-2xl p-6 shadow-xl border border-slate-700">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to speak..."
          className="w-full bg-slate-900 text-white rounded-xl p-4 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none resize-none h-32 mb-4"
        />

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">Voice:</span>
            <div className="flex gap-2">
                {VOICES.map(v => (
                    <button
                        key={v.id}
                        onClick={() => setVoice(v.id)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            voice === v.id 
                            ? 'bg-purple-600 text-white' 
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                    >
                        {v.name}
                    </button>
                ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading || !text.trim()}
            className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              loading || !text.trim()
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-purple-900/20'
            }`}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Generating...
              </>
            ) : (
              <>
                <i className="fas fa-microphone-lines"></i> Speak
              </>
            )}
          </button>
        </div>
        {error && <p className="mt-4 text-red-400 bg-red-900/20 p-3 rounded-lg text-sm">{error}</p>}
      </div>
    </div>
  );
};

export default AudioStudio;
