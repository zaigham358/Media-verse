import React, { useState } from 'react';
import { HashRouter } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import ImageStudio from './components/ImageStudio';
import VideoStudio from './components/VideoStudio';
import AudioStudio from './components/AudioStudio';
import LiveStudio from './components/LiveStudio';
import { MediaType, GeneratedItem } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MediaType>(MediaType.IMAGE);
  const [gallery, setGallery] = useState<GeneratedItem[]>([]);

  const addToGallery = (item: GeneratedItem) => {
    setGallery(prev => [item, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case MediaType.IMAGE:
        return <ImageStudio onGenerate={addToGallery} />;
      case MediaType.VIDEO:
        return <VideoStudio onGenerate={addToGallery} />;
      case MediaType.AUDIO:
        return <AudioStudio onGenerate={addToGallery} />;
      case MediaType.LIVE:
        return <LiveStudio />;
      default:
        return <ImageStudio onGenerate={addToGallery} />;
    }
  };

  return (
    <HashRouter>
      <div className="flex h-screen w-full bg-slate-950 text-slate-200 overflow-hidden font-sans">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-1 flex flex-col h-full overflow-hidden relative">
          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
             {renderContent()}
          </div>

          {/* Recent Creations Gallery (Bottom Panel) - Only show if not Live */}
          {activeTab !== MediaType.LIVE && gallery.length > 0 && (
            <div className="h-48 bg-slate-900 border-t border-slate-800 p-4 flex-shrink-0">
               <h3 className="text-sm font-bold text-slate-400 mb-3 uppercase tracking-wider">Recent Creations</h3>
               <div className="flex gap-4 overflow-x-auto pb-2">
                 {gallery.map(item => (
                   <div key={item.id} className="flex-shrink-0 w-48 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden relative group">
                      {item.type === MediaType.IMAGE && (
                          <img src={item.url} alt="Gen" className="w-full h-32 object-cover" />
                      )}
                      {item.type === MediaType.VIDEO && (
                          <video src={item.url} className="w-full h-32 object-cover" controls />
                      )}
                      {item.type === MediaType.AUDIO && (
                          <div className="w-full h-32 flex items-center justify-center bg-slate-800 text-emerald-500">
                             <i className="fas fa-wave-square text-3xl"></i>
                          </div>
                      )}
                      
                      <div className="p-2 text-xs truncate text-slate-400">
                        {item.type === MediaType.AUDIO ? (
                             <audio src={item.url} controls className="w-full h-6" />
                        ) : (
                            <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                        )}
                      </div>
                      
                      {/* Hover Info */}
                      <div className="absolute inset-0 bg-black/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity p-2">
                          <p className="text-xs text-center text-white line-clamp-3">{item.prompt}</p>
                      </div>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
