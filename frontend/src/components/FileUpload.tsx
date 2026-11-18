import { useRef, useState } from 'react';
import { uploadFile, UploadedFile } from '../api/client';
import { fmtSize } from '../utils/format';
import { Button } from './ui';

interface Props {
  purpose: 'answer' | 'material' | 'video';
  max: number;
  value: UploadedFile[];
  onChange: (files: UploadedFile[]) => void;
  accept?: string;
}

export function FileUpload({ purpose, max, value, onChange, accept }: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const pick = async (list: FileList | null) => {
    if (!list?.length) return;
    setError('');
    setBusy(true);
    try {
      const next = [...value];
      for (const file of Array.from(list)) {
        if (next.length >= max) {
          setError(`Eng ko'pi bilan ${max} ta fayl.`);
          break;
        }
        next.push(await uploadFile(file, purpose));
      }
      onChange(next);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };

  return (
    <div className="upload">
      <input ref={input} type="file" hidden multiple={max > 1} accept={accept} onChange={(e) => pick(e.target.files)} />
      <Button type="button" variant="secondary" loading={busy} disabled={value.length >= max} onClick={() => input.current?.click()}>
        Fayl tanlash
      </Button>
      <ul className="file-list">
        {value.map((f) => (
          <li key={f.id}>
            {f.name} <span className="muted">({fmtSize(f.size)})</span>{' '}
            <button type="button" className="link" onClick={() => onChange(value.filter((x) => x.id !== f.id))}>
              olib tashlash
            </button>
          </li>
        ))}
      </ul>
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}
