import React, { useState, useRef, useEffect, useCallback } from 'react';
import { UseMediaStateReturn, MediaFile, Category } from '../types';
import { askQuestionAboutMedia, generateScriptFromClips, summarizeText, analyzeMediaContent } from '../services/geminiService';
import { getMediaFileSrc, getMediaFileMimeType } from '../db';
import { SparklesIcon, XIcon, TrashIcon } from './icons';
import Button from './ui/Button';
import Dialog from './ui/Dialog';
import ProgressBar from './ui/ProgressBar';
import AsyncImage from './AsyncImage';

// A simple component to render basic markdown for AI responses
const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
    const html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- (.*$)/gm, '<li>$1</li>')
        .replace(/(<li>.*<\/li>)/gs, (match) => `<ul>${match.replace(/<\/li><li>/g, '</li>\n<li>')}</ul>`)
        .replace(/\n/g, '<br />');

    return <div className="prose prose-sm prose-invert" dangerouslySetInnerHTML={{ __html: html }} />;
};

const SmartCategorizer: React.FC<{mediaState: UseMediaStateReturn}> = ({ mediaState }) => {
    const { mediaFiles, categories, addCategory, updateMediaFiles, UNCATEGORIZED_ID } = mediaState;
    const [keywords, setKeywords] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentStatus, setCurrentStatus] = useState('');
    const [summary, setSummary] = useState<string[]>([]);
    
    const handleStartCategorizationByName = async () => {
        const keywordList = keywords.split(',').map(k => k.trim()).filter(Boolean);
        if(keywordList.length === 0) return;

        setIsProcessing(true);
        setProgress(0);
        setCurrentStatus('Starting process...');
        setSummary([]);

        const totalKeywords = keywordList.length;
        let processedKeywords = 0;
        const newSummary: string[] = [];

        for(const keyword of keywordList) {
            setCurrentStatus(`Processing keyword: "${keyword}"`);
            
            // Find or create category
            let category = categories.find(c => c.name.toLowerCase() === keyword.toLowerCase());
            if (!category) {
                category = await addCategory(keyword);
                newSummary.push(`Created new category: "${keyword}"`);
            }
            
            // Find matching files
            const filesToMove = mediaFiles.filter(f => f.title.toLowerCase().includes(keyword.toLowerCase()));
            if (filesToMove.length > 0) {
                 const updates = filesToMove.map(f => ({ id: f.id, changes: { category: category!.id } }));
                 await updateMediaFiles(updates);
                 newSummary.push(`Moved ${filesToMove.length} file(s) to "${keyword}".`);
            } else {
                 newSummary.push(`No files found matching "${keyword}".`);
            }

            processedKeywords++;
            setProgress((processedKeywords / totalKeywords) * 100);
        }

        setCurrentStatus('Process complete!');
        setSummary(newSummary);
        // Don't set isProcessing to false immediately to show summary
    };
    
    const handleAutoCategorize = async () => {
        const filesToProcess = mediaFiles.filter(f => f.category === UNCATEGORIZED_ID);
        if (filesToProcess.length === 0) {
            alert("No uncategorized files to process.");
            return;
        }

        setIsProcessing(true);
        setProgress(0);
        setCurrentStatus('Starting analysis...');
        setSummary([]);
        const newSummary: string[] = [];
        const totalFiles = filesToProcess.length;
        let processedFiles = 0;

        for (const file of filesToProcess) {
             setCurrentStatus(`Analyzing: "${file.title}"`);
             try {
                const blob = await getMediaFileSrc(file.id);
                if (!blob) continue;
                
                const result = await analyzeMediaContent(blob, blob.type);
                let categoryId = UNCATEGORIZED_ID;

                const existingCategory = categories.find(c => c.name.toLowerCase() === result.category.toLowerCase());
                if (existingCategory) {
                    categoryId = existingCategory.id;
                } else if (result.category) {
                    const newCategory = await addCategory(result.category);
                    categoryId = newCategory.id;
                    newSummary.push(`Created new category: "${result.category}"`);
                }
                
                const newTags = [...new Set([...(file.metadata.tags || []), ...result.tags])];
                await updateMediaFiles([{ id: file.id, changes: { category: categoryId, metadata: { ...file.metadata, description: result.description, tags: newTags } } }]);
                newSummary.push(`Moved "${file.title}" to "${result.category}".`);

             } catch(e) {
                console.error(`Failed to process ${file.title}`, e);
                newSummary.push(`Error processing "${file.title}".`);
             }
             processedFiles++;
             setProgress((processedFiles / totalFiles) * 100);
        }
        
        setCurrentStatus('Auto-categorization complete!');
        setSummary(newSummary);
    }
    
    const handleCloseDialog = () => {
        if (!isProcessing || summary.length > 0) {
            setIsProcessing(false);
            setKeywords('');
            setSummary([]);
        }
    }

    return (
        <div className="bg-card-bg/50 p-4 rounded-lg border border-border-color">
            <h3 className="text-lg font-semibold font-display mb-3">AI Library Tools</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {/* Categorize by Name */}
                <div className="space-y-2">
                    <h4 className="font-semibold">Smart Categorize by Name</h4>
                    <p className="text-xs text-text-secondary">Enter a comma-separated list of names or keywords. The AI will create categories and move files with matching titles.</p>
                    <textarea 
                        value={keywords}
                        onChange={e => setKeywords(e.target.value)}
                        placeholder="e.g., Vacation 2024, Project X, Cat Videos"
                        className="w-full bg-input-bg p-2 rounded-md text-sm min-h-[80px]"
                        disabled={isProcessing}
                    />
                    <Button onClick={handleStartCategorizationByName} disabled={isProcessing || !keywords.trim()}>
                        {isProcessing ? 'Working...' : 'Start Categorizing'}
                    </Button>
                </div>
                 {/* Auto-Categorize by Content */}
                 <div className="space-y-2">
                    <h4 className="font-semibold">Auto-Categorize by Content</h4>
                    <p className="text-xs text-text-secondary">Let the AI analyze the content of your uncategorized media to automatically sort them into relevant new or existing categories.</p>
                     <Button onClick={handleAutoCategorize} disabled={isProcessing}>
                        {isProcessing ? 'Working...' : 'Analyze Uncategorized Files'}
                    </Button>
                </div>
            </div>
            
             <Dialog isOpen={isProcessing} onClose={handleCloseDialog} title="AI Task in Progress">
                <div className="text-center">
                    <h3 className="text-lg font-semibold">{currentStatus}</h3>
                    <ProgressBar value={progress} className="my-4" />
                    {summary.length > 0 && (
                        <div className="mt-4 text-left bg-input-bg p-3 rounded-md max-h-64 overflow-y-auto">
                            <h4 className="font-semibold mb-2">Summary:</h4>
                            <ul className="list-disc list-inside text-sm space-y-1">
                                {summary.map((item, i) => <li key={i}>{item}</li>)}
                            </ul>
                        </div>
                    )}
                </div>
            </Dialog>
        </div>
    );
};

const DuplicateSet: React.FC<{ files: MediaFile[], onResolve: (idsToDelete: string[]) => void }> = ({ files, onResolve }) => {
    const [idToKeep, setIdToKeep] = useState(files[0].id);

    const handleResolve = () => {
        const idsToDelete = files.map(f => f.id).filter(id => id !== idToKeep);
        onResolve(idsToDelete);
    };
    
    return (
        <div className="bg-input-bg/50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">{files.length} Duplicate Files Found</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map(file => (
                    <div key={file.id} className={`p-2 rounded-md border-2 ${idToKeep === file.id ? 'border-primary bg-primary/10' : 'border-transparent'}`}>
                        <label className="flex flex-col space-y-2 cursor-pointer">
                            <input type="radio" name={`dupe-set-${files[0].id}`} checked={idToKeep === file.id} onChange={() => setIdToKeep(file.id)} className="sr-only" />
                            <div className="aspect-video bg-black rounded overflow-hidden">
                                <AsyncImage fileId={file.id} alt={file.title} className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xs text-text-primary truncate font-semibold">{file.title}</span>
                            <span className="text-xs text-text-secondary">{new Date(file.createdAt).toLocaleDateString()}</span>
                        </label>
                    </div>
                ))}
            </div>
            <div className="flex justify-end space-x-2 mt-4">
                <Button onClick={() => onResolve([])} className="!bg-input-bg !text-text-primary">Ignore</Button>
                <Button onClick={handleResolve} className="!bg-red-500/80">Keep 1, Delete {files.length - 1}</Button>
            </div>
        </div>
    )
};


const DuplicateFileFinder: React.FC<{ mediaState: UseMediaStateReturn }> = ({ mediaState }) => {
    const { mediaFiles, deleteMediaFiles } = mediaState;
    const [isScanning, setIsScanning] = useState(false);
    const [duplicateSets, setDuplicateSets] = useState<MediaFile[][]>([]);

    const handleScan = () => {
        setIsScanning(true);
        const hashes = new Map<string, MediaFile[]>();
        mediaFiles.forEach(file => {
            if (file.contentHash) {
                if (!hashes.has(file.contentHash)) {
                    hashes.set(file.contentHash, []);
                }
                hashes.get(file.contentHash)!.push(file);
            }
        });

        const sets = Array.from(hashes.values()).filter(group => group.length > 1);
        setDuplicateSets(sets);
        setIsScanning(false);
    };

    const handleResolveSet = (idsToDelete: string[]) => {
        if (idsToDelete.length > 0) {
            deleteMediaFiles(idsToDelete);
        }
        // This is a bit inefficient as it will re-filter all sets, but it's simple
        const remainingSets = duplicateSets.filter(set => !set.some(file => idsToDelete.includes(file.id)));
        setDuplicateSets(remainingSets);
    };

    return (
        <div className="bg-card-bg/50 p-4 rounded-lg border border-border-color">
            <h3 className="text-lg font-semibold font-display mb-3">Duplicate File Finder</h3>
            <p className="text-sm text-text-secondary mb-3">Scan your library to find identical files, helping you save space and reduce clutter.</p>
            <Button onClick={handleScan} disabled={isScanning}>
                {isScanning ? 'Scanning...' : `Scan Library for Duplicates`}
            </Button>
            
            {duplicateSets.length > 0 && (
                <div className="mt-4 space-y-4">
                    <h4 className="font-semibold">{duplicateSets.length} duplicate set(s) found.</h4>
                    {duplicateSets.map((set, index) => (
                        <DuplicateSet key={index} files={set} onResolve={handleResolveSet} />
                    ))}
                </div>
            )}
            {!isScanning && duplicateSets.length === 0 && (
                 <p className="text-sm text-text-secondary mt-3">No duplicates found.</p>
            )}
        </div>
    )
}


const AIAssistant: React.FC<{ mediaState: UseMediaStateReturn }> = ({ mediaState }) => {
    const { mediaFiles, favParts } = mediaState;
    const [messages, setMessages] = useState<{ role: 'user' | 'model', content: string }[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMessage = input;
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setInput('');
        setIsLoading(true);

        try {
            let modelResponse = '';
            if (userMessage.toLowerCase().startsWith('/script')) {
                const clipsForScript = favParts.map(clip => {
                    const parent = mediaFiles.find(f => f.id === clip.mediaId);
                    return { ...clip, parentTitle: parent?.title };
                });
                if (clipsForScript.length === 0) {
                    modelResponse = "You don't have any favorite clips to generate a script from. Go to a video and use the scissors icon to mark some clips first!";
                } else {
                    modelResponse = await generateScriptFromClips(clipsForScript);
                }
            } else if (selectedFile) {
                const fileBlob = await getMediaFileSrc(selectedFile.id);
                const mimeType = await getMediaFileMimeType(selectedFile.id);
                if (fileBlob && mimeType) {
                    modelResponse = await askQuestionAboutMedia(fileBlob, mimeType, userMessage);
                } else {
                    modelResponse = "Sorry, I couldn't load the media file to ask questions about it.";
                }
            } else {
                const prompt = `You are a helpful media library assistant. The user said: "${userMessage}". Respond helpfully. You can also tell the user they can ask questions about specific media files by selecting one, or generate a script from their favorite clips by typing "/script".`;
                modelResponse = await summarizeText(prompt);
            }
            setMessages(prev => [...prev, { role: 'model', content: modelResponse }]);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
            setMessages(prev => [...prev, { role: 'model', content: `Sorry, I ran into an error: ${errorMessage}` }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    return (
        <div className="flex flex-col h-full bg-app-bg text-text-primary">
            <header className="p-4 border-b border-border-color flex-shrink-0">
                <h1 className="text-xl font-bold font-display flex items-center">
                    <SparklesIcon className="w-6 h-6 mr-2 text-primary" />
                    AI Assistant
                </h1>
                <p className="text-sm text-text-secondary mt-1">Ask questions, generate content, or use AI tools to manage your library.</p>
            </header>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                 <SmartCategorizer mediaState={mediaState} />
                 <DuplicateFileFinder mediaState={mediaState} />
                <div className="h-px bg-border-color my-4" />
                
                {messages.length === 0 && (
                    <div className="text-center text-text-secondary mt-8">
                        <p className="font-semibold">Start a conversation</p>
                        <p className="text-sm">Select a file to start asking questions about it, or just type in the box.</p>
                    </div>
                )}
                {messages.map((msg, index) => (
                    <div key={index} className={`flex items-start space-x-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                         {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-primary"/></div>}
                        <div className={`max-w-2xl px-4 py-2 rounded-lg ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-card-bg'}`}>
                            <SimpleMarkdown content={msg.content} />
                        </div>
                    </div>
                ))}
                {isLoading && (
                     <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-1"><SparklesIcon className="w-5 h-5 text-primary"/></div>
                        <div className="max-w-2xl px-4 py-2 rounded-lg bg-card-bg">
                            <div className="flex items-center space-x-2">
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 bg-primary rounded-full animate-pulse [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <footer className="p-4 border-t border-border-color bg-sidebar-bg">
                {selectedFile && (
                    <div className="bg-primary/20 text-primary text-sm px-3 py-2 rounded-lg mb-3 flex items-center justify-between">
                        <span>Talking about: <strong>{selectedFile.title}</strong></span>
                        <button onClick={() => setSelectedFile(null)} className="p-1 rounded-full hover:bg-primary/50">
                            <XIcon className="w-4 h-4" />
                        </button>
                    </div>
                )}
                 <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                    <input
                        type="text"
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        placeholder={selectedFile ? `Ask about ${selectedFile.title}...` : "Ask me anything or type /script..."}
                        className="flex-1 bg-input-bg h-11 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-transparent focus:border-transparent focus:ring-primary"
                        disabled={isLoading}
                    />
                    <Button type="submit" disabled={isLoading || !input.trim()}>
                        {isLoading ? 'Thinking...' : 'Send'}
                    </Button>
                 </form>
                 <div className="text-xs text-text-secondary mt-3">
                    <span className="font-semibold">Context:</span> Select a file to ask questions about it:
                     <div className="flex flex-wrap gap-2 mt-2">
                        {mediaFiles.filter(f => f.type === 'image' || f.type === 'video').slice(0, 10).map(file => (
                            <button key={file.id} onClick={() => setSelectedFile(file)} className={`bg-input-bg px-2 py-1 text-xs rounded hover:bg-primary/50 transition-colors ${selectedFile?.id === file.id ? 'ring-2 ring-primary' : ''}`}>
                                {file.title}
                            </button>
                        ))}
                    </div>
                 </div>
            </footer>
        </div>
    );
};

export default AIAssistant;