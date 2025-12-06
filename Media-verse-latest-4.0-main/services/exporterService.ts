import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';
import { FavPart } from '../types';

let ffmpeg: FFmpeg | null = null;

const loadFFmpeg = async (logCallback: (message: string) => void): Promise<FFmpeg> => {
    if (ffmpeg) return ffmpeg;

    ffmpeg = new FFmpeg();
    ffmpeg.on('log', ({ message }) => logCallback(message));

    logCallback('Loading ffmpeg-core.js');
    await ffmpeg.load({
        coreURL: 'https://esm.sh/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
        wasmURL: 'https://esm.sh/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
    });
    logCallback('FFmpeg core loaded.');
    return ffmpeg;
};

export type ExportFormat = 'mp4' | 'gif' | 'webm';

export const exportClip = async (
    fileBlob: Blob,
    clip: FavPart,
    format: ExportFormat,
    logCallback: (message: string) => void,
    progressCallback: (progress: number) => void
): Promise<Blob> => {
    const ffmpegInstance = await loadFFmpeg(logCallback);

    ffmpegInstance.on('progress', ({ progress }) => {
        progressCallback(progress * 100);
    });

    const inFilename = `input.${fileBlob.type.split('/')[1]}`;
    const outFilename = `output.${format}`;
    
    logCallback(`Writing input file (${inFilename}) to memory...`);
    await ffmpegInstance.writeFile(inFilename, await fetchFile(fileBlob));
    logCallback('File written.');

    const command = [
        '-i', inFilename,
        '-ss', (clip.startTime).toString(),
        '-to', (clip.endTime).toString(),
        '-c', 'copy', // Default to copy codecs to be fast
    ];

    switch (format) {
        case 'mp4':
            command.push('-c:v', 'libx264', '-preset', 'fast', '-crf', '22', '-c:a', 'aac', outFilename);
            break;
        case 'webm':
            command.push('-c:v', 'libvpx', '-crf', '10', '-b:v', '1M', '-c:a', 'libvorbis', outFilename);
            break;
        case 'gif':
            // GIF creation is a two-pass process for quality
            const paletteFile = 'palette.png';
            const gifCommand1 = [
                '-i', inFilename, '-ss', (clip.startTime).toString(), '-to', (clip.endTime).toString(),
                '-vf', 'fps=15,scale=480:-1:flags=lanczos,palettegen', '-y', paletteFile
            ];
            logCallback(`Executing GIF palette generation: ffmpeg ${gifCommand1.join(' ')}`);
            await ffmpegInstance.exec(gifCommand1);

            const gifCommand2 = [
                '-i', inFilename, '-i', paletteFile, '-ss', (clip.startTime).toString(), '-to', (clip.endTime).toString(),
                '-filter_complex', 'fps=15,scale=480:-1:flags=lanczos[x];[x][1:v]paletteuse', '-y', outFilename
            ];
             logCallback(`Executing GIF creation: ffmpeg ${gifCommand2.join(' ')}`);
            await ffmpegInstance.exec(gifCommand2);
            break;
        default:
            command.push(outFilename);
            break;
    }
    
    if (format !== 'gif') {
        command.splice(command.indexOf('-c'), 2); // Remove copy command if we're re-encoding
        logCallback(`Executing: ffmpeg ${command.join(' ')}`);
        await ffmpegInstance.exec(command);
    }
    
    logCallback('Export complete. Reading output file...');
    const data = await ffmpegInstance.readFile(outFilename);
    const outputBlob = new Blob([data], { type: format === 'mp4' ? 'video/mp4' : format === 'webm' ? 'video/webm' : 'image/gif' });
    
    logCallback('Cleaning up virtual file system...');
    await ffmpegInstance.deleteFile(inFilename);
    await ffmpegInstance.deleteFile(outFilename);
    if(format === 'gif') await ffmpegInstance.deleteFile('palette.png');

    logCallback('Done.');

    return outputBlob;
};
