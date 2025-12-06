import React from 'react';
import { MediaType } from '../types';

interface SidebarProps {
  activeTab: MediaType;
  setActiveTab: (tab: MediaType) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const items = [
    { type: MediaType.IMAGE, icon: 'fa-image', label: 'Image Studio' },
    { type: MediaType.VIDEO, icon: 'fa-video', label: 'Video Studio' },
    { type: MediaType.AUDIO, icon: 'fa-music', label: 'Audio Studio' },
    { type: MediaType.LIVE, icon: 'fa-bolt', label: 'Live Verse' },
  ];

  return (
    <div className="w-20 md:w-64 bg-slate-900 border-r border-slate-700 flex flex-col items-center md:items-stretch py-6 flex-shrink-0">
      <div className="px-4 mb-8 flex items-center justify-center md:justify-start gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shadow-lg shadow-purple-500/30">
          MV
        </div>
        <span className="hidden md:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          MediaVerse
        </span>
      </div>

      <nav className="flex-1 space-y-2 px-2">
        {items.map((item) => (
          <button
            key={item.type}
            onClick={() => setActiveTab(item.type)}
            className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 ${
              activeTab === item.type
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/50'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <i className={`fas ${item.icon} w-6 text-center text-lg`}></i>
            <span className="hidden md:block font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      
      <div className="px-4 pb-4">
        <div className="hidden md:flex items-center gap-2 p-3 rounded-lg bg-slate-800/50 text-xs text-slate-500 border border-slate-700/50">
          <i className="fas fa-info-circle"></i>
          <span>Powered by Gemini 2.5</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
