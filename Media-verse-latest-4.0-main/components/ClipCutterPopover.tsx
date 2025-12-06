
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { suggestTitleFromContext, suggestTagsFromText } from '../services/geminiService';
import { SparklesIcon, BracketLeftIcon, BracketRightIcon, CheckIcon, XIcon, TagIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';

interface ClipCutterPopoverProps {
  mediaId: string;
  mediaTitle: string;
  startTime: number;
  endTime: number;
  currentTime: number;
  duration: number;
  addFavPart: (part: { mediaId: string; title: string; startTime: number; endTime: number; tags?: string[] }) => Promise<void>;
  onClose: () => void;
  onSeek: (time: number) => void;
  setTempLoop: (loop: {start: number, end: number} | null) => void;
}

const formatTime = (seconds: number, showMs = true) => {
    if (isNaN(seconds) || seconds < 0) return showMs ? '0:00.000' : '0:00';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const ms = Math.floor((seconds * 1000) % 1000);
    const time = `${h > 0 ? h + ':' : ''}${m.toString().padStart(h > 0 ? 2 : 1, '0')}:${s.toString().padStart(2, '0')}`;
    return showMs ? `${time}.${ms.toString().padStart(3, '0')}` : time;
};

const parseTime = (timeStr: string): number => {
    const parts = timeStr.split(':').reverse();
    let seconds = 0;
    if (parts[0]) seconds += parseFloat(parts[0]); // seconds and ms
    if (parts[1]) seconds += parseInt(parts[1], 10) * 60; // minutes
    if (parts[2]) seconds += parseInt(parts[2], 10) * 3600; // hours
    return isNaN(seconds) ? 0 : seconds;
}


const ClipCutterPopover: React.FC<ClipCutterPopoverProps> = ({ mediaId, mediaTitle, startTime, endTime, currentTime, duration, addFavPart, onClose, onSeek, setTempLoop }) => {
    const [title, setTitle] = useState(mediaTitle);
    const [start, setStart] = useState(startTime);
    const [end, setEnd] = useState(endTime);
    const [tags, setTags] = useState<string[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [isAiLoading, setIsAiLoading] = useState(false);
    const scrubberRef = useRef<HTMLDivElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const activeDragHandle = useRef<'start' | 'end' | null>(null);

    useEffect(() => {
        setStart(startTime);
        setEnd(endTime > startTime ? endTime : Math.min(duration, startTime + 10));
    }, [startTime, endTime, duration]);
    
    useEffect(() => {
        setTempLoop({ start, end });
        return () => setTempLoop(null);
    }, [start, end, setTempLoop]);

    // Keyboard shortcuts for the popover
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const isTextInput = (e.target as HTMLElement).tagName === 'INPUT';
            if (isTextInput) return;
            
            // Number keys 0-9 for seeking
            if (e.key >= '0' && e.key <= '9') {
                e.preventDefault();
                onSeek(duration * (parseInt(e.key) / 10));
            }
            // '[' to set start time
            if (e.key === '[') {
                e.preventDefault();
                setStart(currentTime);
            }
            // ']' to set end time
            if (e.key === ']') {
                e.preventDefault();
                setEnd(currentTime);
            }
        };

        const popoverElement = popoverRef.current;
        if (popoverElement) {
             // Use capture phase to catch key presses before they bubble up to the player
            popoverElement.addEventListener('keydown', handleKeyDown, true);
        }
        return () => {
             if (popoverElement) {
                popoverElement.removeEventListener('keydown', handleKeyDown, true);
            }
        };
    }, [currentTime, duration, onSeek]);


    const handleSuggestTitle = async () => {
        setIsAiLoading(true);
        try {
            const suggestedTitle = await suggestTitleFromContext(mediaTitle, start, end);
            setTitle(suggestedTitle);
        } catch (error) { console.error("Failed to suggest title", error); } 
        finally { setIsAiLoading(false); }
    };

    const handleSuggestTags = async () => {
        if (!title.trim()) { alert("Please enter a title before suggesting tags."); return; }
        setIsAiLoading(true);
        try {
            const suggestedTags = await suggestTagsFromText(mediaTitle, title);
            setTags(prev => [...new Set([...prev, ...suggestedTags])]);
        } catch (error) { console.error("Failed to suggest tags", error); } 
        finally { setIsAiLoading(false); }
    }

    const handleSave = () => {
        if (title.trim() && end > start) {
            addFavPart({ mediaId, title: title.trim(), startTime: start, endTime: end, tags: tags.length > 0 ? tags : undefined });
            onClose();
        }
    };
    
    // Interactive Scrubber Logic
    const handleScrub = useCallback((e: MouseEvent) => {
        if (!scrubberRef.current || !activeDragHandle.current || duration <= 0) return;
        const rect = scrubberRef.current.getBoundingClientRect();
        const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = pos * duration;
        
        if (activeDragHandle.current === 'start') {
            setStart(Math.min(time, end - 0.1));
        } else {
            setEnd(Math.max(time, start + 0.1));
        }
    }, [duration, start, end]);

    useEffect(() => {
        const handleMouseUp = () => { activeDragHandle.current = null; };
        const handleMouseMove = (e: MouseEvent) => { if (activeDragHandle.current) handleScrub(e); };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleScrub]);

    const handleNudge = (type: 'start' | 'end', amount: number) => {
        if (type === 'start') setStart(s => Math.max(0, Math.min(s + amount, end - 0.1)));
        if (type === 'end') setEnd(e => Math.min(duration, Math.max(e + amount, start + 0.1)));
    }
    
    const TimeInput: React.FC<{ value: number, setValue: (n: number) => void }> = ({ value, setValue }) => {
        const [textValue, setTextValue] = useState(formatTime(value));
        useEffect(() => setTextValue(formatTime(value)), [value]);

        const handleBlur = () => { const parsed = parseTime(textValue); setValue(parsed); setTextValue(formatTime(parsed)); };
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') handleBlur();
            let increment = 0;
            if (e.key === 'ArrowUp') increment = 0.1;
            if (e.key === 'ArrowDown') increment = -0.1;
            if (e.shiftKey) increment *= 10;
            if (increment !== 0) { 
                e.preventDefault(); 
                setValue(Math.max(0, Math.min(duration, value + increment)));
            }
        }
        
        return <input value={textValue} onChange={e => setTextValue(e.target.value)} onBlur={handleBlur} onKeyDown={handleKeyDown} className="w-full bg-[rgba(var(--player-text-primary),0.1)] font-mono text-center text-sm px-2 py-1.5 rounded-md border border-[rgb(var(--player-scrubber-bg))] focus:border-[rgb(var(--player-accent))] focus:outline-none" />;
    };

    const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const newTag = tagInput.trim();
            if (newTag && !tags.includes(newTag)) setTags([...tags, newTag]);
            setTagInput('');
        }
    };
    const removeTag = (tagToRemove: string) => setTags(tags.filter(t => t !== tagToRemove));

    const presets = [
        { name: 'Last 5s', action: () => { setStart(Math.max(0, currentTime - 5)); setEnd(currentTime); } },
        { name: 'Next 10s', action: () => { setStart(currentTime); setEnd(Math.min(duration, currentTime + 10)); } },
        { name: 'From Start to Here', action: () => { setStart(0); setEnd(currentTime); } },
        { name: 'From Here to End', action: () => { setStart(currentTime); setEnd(duration); } },
        { name: 'Full Video', action: () => { setStart(0); setEnd(duration); } },
    ]

    return (
        <div ref={popoverRef} className="w-[520px] p-4 text-[rgb(var(--player-text-primary))]" onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-xl" style={{ fontFamily: 'var(--player-font-main)' }}>Mark Favorite Clip</h3>
                 <button onClick={onClose} className="p-1.5 rounded-full hover:bg-[rgba(var(--player-text-primary),0.1)]"><XIcon className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
                {/* Interactive Scrubber */}
                <div ref={scrubberRef} className="w-full h-8 flex items-center cursor-pointer">
                    <div className="w-full h-2 bg-[rgb(var(--player-scrubber-bg))] rounded-full relative">
                        <div className="absolute h-full bg-[rgb(var(--player-accent))] opacity-70 rounded-full clip-range-scrubber" style={{ left: `${(start/duration)*100}%`, right: `${100 - (end/duration)*100}%` }}>
                            <div className="handle start" onMouseDown={() => activeDragHandle.current = 'start'} />
                            <div className="handle end" onMouseDown={() => activeDragHandle.current = 'end'} />
                        </div>
                        <div className="absolute h-full w-0.5 bg-white top-0" style={{ left: `${(currentTime/duration)*100}%` }} title={`Current Time: ${formatTime(currentTime)}`} />
                    </div>
                </div>

                {/* Time Inputs & Duration */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1">
                         <button onClick={() => handleNudge('start', -1/30)} className="p-1.5 hover:bg-[rgba(var(--player-text-primary),0.1)] rounded-md"><ChevronLeftIcon className="w-4 h-4"/></button>
                         <div className="w-28"><TimeInput value={start} setValue={setStart} /></div>
                         <button onClick={() => handleNudge('start', 1/30)} className="p-1.5 hover:bg-[rgba(var(--player-text-primary),0.1)] rounded-md"><ChevronRightIcon className="w-4 h-4"/></button>
                         <button onClick={() => setStart(currentTime)} className="p-2 ml-1 bg-[rgba(var(--player-text-primary),0.1)] rounded-md border border-[rgb(var(--player-scrubber-bg))] hover:border-[rgb(var(--player-accent))]" title="Set start to current time ([)"><BracketLeftIcon className="w-5 h-5" /></button>
                    </div>
                    <div className="font-mono text-lg font-semibold px-2" style={{ color: 'rgb(var(--player-accent))' }}>{formatTime(end - start, false)}</div>
                    <div className="flex items-center space-x-1">
                        <button onClick={() => setEnd(currentTime)} className="p-2 mr-1 bg-[rgba(var(--player-text-primary),0.1)] rounded-md border border-[rgb(var(--player-scrubber-bg))] hover:border-[rgb(var(--player-accent))]" title="Set end to current time (])"><BracketRightIcon className="w-5 h-5" /></button>
                         <button onClick={() => handleNudge('end', -1/30)} className="p-1.5 hover:bg-[rgba(var(--player-text-primary),0.1)] rounded-md"><ChevronLeftIcon className="w-4 h-4"/></button>
                         <div className="w-28"><TimeInput value={end} setValue={setEnd} /></div>
                         <button onClick={() => handleNudge('end', 1/30)} className="p-1.5 hover:bg-[rgba(var(--player-text-primary),0.1)] rounded-md"><ChevronRightIcon className="w-4 h-4"/></button>
                    </div>
                </div>
                
                {/* Presets */}
                <div className="flex justify-center flex-wrap gap-2">
                    {presets.map(p => <button key={p.name} onClick={p.action} className="px-3 py-1 bg-[rgba(var(--player-text-primary),0.1)] text-xs rounded-full border border-transparent hover:border-[rgb(var(--player-accent))] hover:text-[rgb(var(--player-accent))]">{p.name}</button>)}
                </div>

                {/* Title Input */}
                <div>
                    <label className="text-xs font-semibold text-[rgb(var(--player-text-secondary))]">CLIP TITLE</label>
                    <div className="flex items-center space-x-2 mt-1">
                        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Cool moment" className="flex-1 bg-[rgba(var(--player-text-primary),0.1)] text-sm px-3 py-2 rounded-md border border-[rgb(var(--player-scrubber-bg))] focus:border-[rgb(var(--player-accent))] focus:outline-none" />
                        <button onClick={handleSuggestTitle} disabled={isAiLoading} className="p-2 rounded-md hover:bg-[rgba(var(--player-accent),0.2)]" title="Suggest Title with AI"><SparklesIcon className={`w-5 h-5 text-[rgb(var(--player-accent))] ${isAiLoading ? 'animate-pulse' : ''}`} /></button>
                    </div>
                </div>

                {/* Tags Input */}
                 <div>
                    <label className="text-xs font-semibold text-[rgb(var(--player-text-secondary))]">TAGS (OPTIONAL)</label>
                    <div className="flex items-start space-x-2 mt-1">
                        <div className="flex-1 flex flex-wrap items-center gap-2 p-2 rounded-md border border-[rgb(var(--player-scrubber-bg))] bg-[rgba(var(--player-text-primary),0.1)] min-h-[40px]">
                             {tags.map(tag => (
                                <div key={tag} className="flex items-center bg-[rgb(var(--player-accent))] text-white text-xs font-semibold pl-2 pr-1 py-0.5 rounded-full">
                                    {tag}
                                    <button onClick={() => removeTag(tag)} className="ml-1.5 p-0.5 hover:bg-white/20 rounded-full"><XIcon className="w-2.5 h-2.5" /></button>
                                </div>
                             ))}
                            <input type="text" value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={handleTagInput} placeholder="Add a tag..." className="flex-1 bg-transparent text-sm focus:outline-none min-w-[80px] p-1" />
                        </div>
                         <button onClick={handleSuggestTags} disabled={isAiLoading || !title.trim()} className="p-2 rounded-md hover:bg-[rgba(var(--player-accent),0.2)] disabled:opacity-50" title="Suggest Tags with AI"><TagIcon className={`w-5 h-5 text-[rgb(var(--player-accent))] ${isAiLoading ? 'animate-pulse' : ''}`} /></button>
                    </div>
                </div>
            </div>
            <div className="mt-6 flex justify-end">
                <button onClick={handleSave} disabled={!title.trim() || end <= start} className="px-5 py-2.5 text-white font-semibold rounded-md transition-colors disabled:bg-[rgba(var(--player-text-secondary),0.5)] disabled:cursor-not-allowed flex items-center space-x-2" style={{ backgroundColor: 'rgb(var(--player-accent))' }}>
                     <CheckIcon className="w-5 h-5" /> <span>Save Clip</span>
                </button>
            </div>
        </div>
    );
};

export default ClipCutterPopover;
