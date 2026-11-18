import { useEffect, useState } from 'react';
import { fetchBlob } from '../api/client';

export function useBlobUrl(fileId?: string | null) {
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!fileId) {
      setUrl(null);
      setError(false);
      return;
    }
    let revoked = false;
    let objectUrl: string | null = null;
    setError(false);
    fetchBlob(fileId)
      .then((blob) => {
        if (revoked) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      .catch(() => {
        if (!revoked) setError(true);
      });
    return () => {
      revoked = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [fileId]);

  return { url, error };
}
