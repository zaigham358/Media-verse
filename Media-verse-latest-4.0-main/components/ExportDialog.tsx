import React, { useState, useRef, useEffect } from 'react';
import Dialog from './ui/Dialog';
import Button from './ui/Button';
import ProgressBar from './ui/ProgressBar';
import { FavPart, MediaFile } from '../types';
import { getMediaFileSrc } from '../db';
import { exportClip, ExportFormat } from '../services/exporterService';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  clip: FavPart;
  parentFile: MediaFile;
}

const ExportDialog: React.FC<ExportDialogProps> = ({ isOpen, onClose, clip, parentFile }) => {
    const [format, setFormat] = useState<ExportFormat>('mp4');
    const [isExporting, setIsExporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [outputUrl, setOutputUrl] = useState<string | null>(null);
    const logContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset state when dialog opens
            setIsExporting(false);
            setProgress(0);
            setLogs([]);
            setOutputUrl(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (logContainerRef.current) {
            logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
        }
    }, [logs]);

    const handleExport = async () => {
        setIsExporting(true);
        setProgress(0);
        setLogs([]);
        setOutputUrl(null);
        
        try {
            const logCallback = (message: string) => setLogs(prev => [...prev, message]);
            const progressCallback = (p: number) => setProgress(p);

            const fileBlob = await getMediaFileSrc(parentFile.id);
            if (!fileBlob) throw new Error("Could not load parent file data.");

            const outputBlob = await exportClip(fileBlob, clip, format, logCallback, progressCallback);

            const url = URL.createObjectURL(outputBlob);
            setOutputUrl(url);

        } catch (error) {
            console.error("Export failed:", error);
            setLogs(prev => [...prev, `ERROR: ${error instanceof Error ? error.message : 'Unknown error'}`]);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDownload = () => {
        if (!outputUrl) return;
        const a = document.createElement('a');
        a.href = outputUrl;
        a.download = `${clip.title}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <Dialog isOpen={isOpen} onClose={onClose} title="Export Clip">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h3 className="font-semibold text-text-primary">{clip.title}</h3>
                    <p className="text-sm text-text-secondary">From: {parentFile.title}</p>
                    <p className="text-sm text-text-secondary">Duration: {(clip.endTime - clip.startTime).toFixed(2)}s</p>

                    <div className="mt-4">
                        <label className="text-sm font-semibold text-text-secondary">EXPORT FORMAT</label>
                        <div className="flex space-x-2 mt-2">
                            {(['mp4', 'gif', 'webm'] as ExportFormat[]).map(f => (
                                <button key={f} onClick={() => setFormat(f)} className={`px-4 py-2 text-sm rounded-md border-2 ${format === f ? 'border-primary bg-primary/20' : 'border-border-color'}`}>
                                    {f.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-6">
                        {outputUrl ? (
                            <Button onClick={handleDownload} className="w-full">Download File</Button>
                        ) : (
                            <Button onClick={handleExport} disabled={isExporting} className="w-full">
                                {isExporting ? `Exporting... (${Math.round(progress)}%)` : 'Start Export'}
                            </Button>
                        )}
                    </div>
                </div>
                <div>
                    <h4 className="text-sm font-semibold text-text-secondary mb-2">Progress</h4>
                    <ProgressBar value={progress} />
                    <div ref={logContainerRef} className="mt-2 h-48 bg-input-bg rounded-md p-2 text-xs font-mono overflow-y-auto text-text-secondary">
                        {logs.map((log, i) => <div key={i}>{log}</div>)}
                    </div>
                </div>
            </div>
        </Dialog>
    );
};

export default ExportDialog;
