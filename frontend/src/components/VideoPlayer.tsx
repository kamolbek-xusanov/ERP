import { useEffect, useRef } from 'react';
import { useBlobUrl } from '../hooks/useBlobUrl';
import { Loader } from './ui';

interface Props {
  url?: string;
  fileId?: string;
  startPercent?: number;
  onProgress?: (percent: number) => void;
}

const DIRECT = /\.(mp4|webm|mov|m4v)(\?.*)?$/i;

export function VideoPlayer({ url, fileId, startPercent = 0, onProgress }: Props) {
  const blob = useBlobUrl(fileId);
  const ref = useRef<HTMLVideoElement>(null);
  const best = useRef(startPercent);
  const sent = useRef(startPercent);
  const lastTime = useRef(0);

  useEffect(() => {
    best.current = Math.max(best.current, startPercent);
    sent.current = Math.max(sent.current, startPercent);
  }, [startPercent]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (best.current > sent.current) {
        sent.current = best.current;
        onProgress?.(best.current);
      }
    }, 8000);
    return () => {
      clearInterval(timer);
      if (best.current > sent.current) onProgress?.(best.current);
    };
  }, [onProgress]);

  const onTime = () => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const jump = v.currentTime - lastTime.current;
    lastTime.current = v.currentTime;
    if (jump < 0 || jump > 3) return;
    const percent = Math.min(100, Math.floor((v.currentTime / v.duration) * 100));
    if (percent > best.current) best.current = percent;
  };

  const onEnd = () => {
    best.current = 100;
    sent.current = 100;
    onProgress?.(100);
  };

  if (fileId) {
    if (blob.error) return <div className="error-box">Videoni yuklab bo'lmadi.</div>;
    if (!blob.url) return <Loader />;
    return <video ref={ref} className="video" src={blob.url} controls onTimeUpdate={onTime} onEnded={onEnd} />;
  }
  if (url && DIRECT.test(url)) {
    return <video ref={ref} className="video" src={url} controls onTimeUpdate={onTime} onEnded={onEnd} />;
  }
  if (url) {
    return (
      <p>
        Video havolasi:{' '}
        <a href={url} target="_blank" rel="noreferrer">
          {url}
        </a>
      </p>
    );
  }
  return <p className="muted">Video hali qo'shilmagan.</p>;
}
