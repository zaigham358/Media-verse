
import React, { useState, useEffect } from 'react';
import { getMediaFileThumbnail } from '../db';

interface AsyncImageProps {
  fileId: string;
  alt: string;
  className?: string;
  fallback?: React.ReactNode;
}

const AsyncImage: React.FC<AsyncImageProps> = ({ fileId, alt, className, fallback }) => {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    let objectUrl: string | undefined;

    const loadImage = async () => {
      // Reset state for new fileId to avoid showing stale image
      setError(false);
      setSrc(null); 
      
      try {
        const blob = await getMediaFileThumbnail(fileId);
        if (isCancelled) return;

        if (blob) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        } else {
          setError(true);
        }
      } catch (e) {
        if (!isCancelled) {
          // Silent fail for thumbnail loading errors (e.g. DB transaction aborted)
          // This prevents console spam and crashing the grid
          setError(true);
        }
      }
    };

    loadImage();

    return () => {
      isCancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  if (error || !src) {
    return <>{fallback}</> || null;
  }

  return <img src={src} alt={alt} className={className} />;
};

export default AsyncImage;
