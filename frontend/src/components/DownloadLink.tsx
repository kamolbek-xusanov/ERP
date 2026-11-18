import { useState } from 'react';
import { fetchBlob } from '../api/client';
import { FileMeta } from '../api/types';
import { fmtSize } from '../utils/format';

export function DownloadLink({ file }: { file: FileMeta }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      const blob = await fetchBlob(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  };
  return (
    <button type="button" className="link" onClick={download} disabled={busy}>
      {file.name} <span className="muted">({fmtSize(file.size)})</span>
    </button>
  );
}
