'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
export interface ImageInfo {
  name: string; type: string; size: number; width: number; height: number; dataUri: string; base64: string;
}
export function useBase64Image(onError: () => void) {
  const [imageInfo, setImageInfo] = useState<ImageInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const generation = useRef(0);
  const readerRef = useRef<FileReader | null>(null);
  useEffect(() => () => { generation.current++; readerRef.current?.abort(); }, []);
  const clear = useCallback(() => {
    generation.current++; readerRef.current?.abort(); setImageInfo(null); setLoading(false);
  }, []);
  const processFile = useCallback((file: File) => {
    clear();
    const ticket = generation.current;
    if (!file.type.startsWith('image/')) { onError(); return; }
    setLoading(true);
    const fail = () => { if (ticket === generation.current) { setLoading(false); onError(); } };
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onerror = fail;
    reader.onload = () => {
      if (ticket !== generation.current) return;
      const dataUri = String(reader.result);
      const img = new Image();
      img.onerror = fail;
      img.onload = () => {
        if (ticket !== generation.current) return;
        setImageInfo({ name: file.name, type: file.type, size: file.size,
          width: img.naturalWidth, height: img.naturalHeight, dataUri, base64: dataUri.split(',')[1] ?? '' });
        setLoading(false);
      };
      img.src = dataUri;
    };
    reader.readAsDataURL(file);
  }, [clear, onError]);
  return { imageInfo, loading, clear, processFile };
}
