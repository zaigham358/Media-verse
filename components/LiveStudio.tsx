import React, { useEffect, useRef, useState, useCallback } from 'react';
import { connectLive } from '../services/geminiService';
import { decodeAudioData, arrayBufferToBase64, blobToBase64 } from '../services/audioUtils';
import { LiveServerMessage } from '@google/genai';

const LiveStudio: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for managing audio/video state
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const frameIntervalRef = useRef<number | null>(null);
  
  // Cleanup function
  const stopSession = useCallback(() => {
    if (frameIntervalRef.current) window.clearInterval(frameIntervalRef.current);
    
    sessionPromiseRef.current?.then(session => session.close()).catch(() => {});
    sessionPromiseRef.current = null;
    
    sourcesRef.current.forEach(source => source.stop());
    sourcesRef.current.clear();
    
    inputAudioContextRef.current?.close();
    outputAudioContextRef.current?.close();
    
    setConnected(false);
  }, []);

  useEffect(() => {
    return () => stopSession();
  }, [stopSession]);

  const startSession = async () => {
    setError(null);
    try {
      // 1. Setup Audio Contexts
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      
      inputAudioContextRef.current = inputCtx;
      outputAudioContextRef.current = outputCtx;
      
      // 2. Get Media Stream (Video + Audio)
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // 3. Connect to Gemini Live
      const sessionPromise = connectLive(
        () => { // OnOpen
            setConnected(true);
            
            // --- Audio Input Streaming ---
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
                const inputData = e.inputBuffer.getChannelData(0);
                
                // Convert Float32 to Int16 PCM
                const l = inputData.length;
                const int16 = new Int16Array(l);
                for (let i = 0; i < l; i++) {
                   int16[i] = inputData[i] * 32768;
                }
                const base64Data = arrayBufferToBase64(int16.buffer);

                sessionPromise.then(session => {
                    session.sendRealtimeInput({
                        media: {
                            mimeType: 'audio/pcm;rate=16000',
                            data: base64Data
                        }
                    });
                });
            };
            
            source.connect(processor);
            processor.connect(inputCtx.destination);
            
            // --- Video Frame Streaming ---
            if (canvasRef.current && videoRef.current) {
                const ctx = canvasRef.current.getContext('2d');
                frameIntervalRef.current = window.setInterval(() => {
                    const video = videoRef.current;
                    const canvas = canvasRef.current;
                    if (video && canvas && ctx) {
                         canvas.width = video.videoWidth * 0.2; // Downscale for bandwidth
                         canvas.height = video.videoHeight * 0.2;
                         ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                         canvas.toBlob(async (blob) => {
                             if (blob) {
                                 const b64 = await blobToBase64(blob);
                                 sessionPromise.then(session => {
                                     session.sendRealtimeInput({
                                         media: {
                                             mimeType: 'image/jpeg',
                                             data: b64
                                         }
                                     });
                                 });
                             }
                         }, 'image/jpeg', 0.5);
                    }
                }, 1000); // 1 FPS is sufficient for context usually
            }
        },
        async (msg: LiveServerMessage) => { // OnMessage
            // Handle Audio Output
            const base64Audio = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (base64Audio && outputAudioContextRef.current) {
                const ctx = outputAudioContextRef.current;
                const binary = atob(base64Audio);
                const len = binary.length;
                const bytes = new Uint8Array(len);
                for (let i = 0; i < len; i++) { bytes[i] = binary.charCodeAt(i); }
                
                const audioBuffer = await decodeAudioData(bytes, ctx, 24000, 1);
                
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
                
                const source = ctx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(ctx.destination);
                source.start(nextStartTimeRef.current);
                
                nextStartTimeRef.current += audioBuffer.duration;
                
                sourcesRef.current.add(source);
                source.onended = () => sourcesRef.current.delete(source);
            }
            
            // Handle Interruption
            if (msg.serverContent?.interrupted) {
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
            }
        },
        () => { // OnClose
             setConnected(false);
             stopSession();
        },
        (e) => { // OnError
             console.error(e);
             setError("Connection error occurred.");
             stopSession();
        }
      );
      
      sessionPromiseRef.current = sessionPromise;

    } catch (e: any) {
      setError(e.message || "Failed to start live session");
      stopSession();
    }
  };

  return (
    <div className="flex flex-col h-full p-6 relative overflow-hidden">
      <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">Live Verse</h2>
            <p className="text-slate-400">Real-time voice & video interaction.</p>
          </div>
          <div className="flex gap-4">
             {!connected ? (
                 <button onClick={startSession} className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-full font-bold shadow-lg shadow-red-900/40 flex items-center gap-2 animate-pulse">
                     <i className="fas fa-microphone"></i> Start Live Session
                 </button>
             ) : (
                 <button onClick={stopSession} className="px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-full font-bold flex items-center gap-2">
                     <i className="fas fa-stop"></i> End Session
                 </button>
             )}
          </div>
      </div>
      
      {error && <div className="bg-red-900/50 text-red-200 p-4 rounded-xl mb-4 border border-red-700">{error}</div>}

      <div className="flex-1 bg-black rounded-3xl overflow-hidden relative shadow-2xl border border-slate-800">
          {/* Main Video Feed */}
          <video 
             ref={videoRef} 
             className="w-full h-full object-cover transform scale-x-[-1]" 
             muted 
             playsInline 
             autoPlay
          />
          
          {/* Hidden Canvas for Frame Processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Status Overlay */}
          <div className="absolute top-6 left-6 flex gap-3">
             <div className={`px-4 py-2 rounded-full backdrop-blur-md border ${connected ? 'bg-green-500/20 border-green-500/50 text-green-400' : 'bg-slate-800/50 border-slate-700 text-slate-400'} flex items-center gap-2 font-mono text-sm`}>
                <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`}></div>
                {connected ? 'LIVE' : 'OFFLINE'}
             </div>
          </div>
          
          {!connected && !error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="text-center">
                      <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl text-slate-500">
                          <i className="fas fa-video-slash"></i>
                      </div>
                      <h3 className="text-xl font-bold text-slate-300">Camera Offline</h3>
                      <p className="text-slate-500">Click "Start Live Session" to begin</p>
                  </div>
              </div>
          )}
      </div>
    </div>
  );
};

export default LiveStudio;
