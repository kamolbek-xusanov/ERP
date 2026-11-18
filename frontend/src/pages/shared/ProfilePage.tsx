import { DragEvent, useRef, useState } from 'react';
import { api, uploadFile } from '../../api/client';
import { User } from '../../api/types';
import { useAuth } from '../../auth/AuthContext';
import { Avatar, Badge, Button, Card, PageHeader } from '../../components/ui';
import { IconButton } from '../../components/ui';
import { Icon } from '../../components/icons';
import { ROLE_LABEL } from '../../layouts/nav';

const MAX_RAW = 12 * 1024 * 1024;
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

/** Rasmni kvadrat qilib kesadi va 512x512 JPEG ga siqadi (serverga yengil yuboriladi). */
async function squareJpeg(file: File, size = 512): Promise<File> {
  const bitmap = await new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Rasmni o'qib bo'lmadi. Boshqa rasm tanlang."));
    };
    img.src = url;
  });
  const side = Math.min(bitmap.naturalWidth, bitmap.naturalHeight);
  const sx = (bitmap.naturalWidth - side) / 2;
  const sy = (bitmap.naturalHeight - side) / 2;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Brauzer rasmni qayta ishlay olmadi.');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);
  ctx.drawImage(bitmap, sx, sy, side, side, 0, 0, size, size);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9));
  if (!blob) throw new Error('Rasmni siqib bo\'lmadi.');
  return new File([blob], 'avatar.jpg', { type: 'image/jpeg' });
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState('');
  const [over, setOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  if (!user) return null;

  const upload = async (file?: File | null) => {
    if (!file) return;
    setError('');
    setDone('');
    if (!ACCEPT.includes(file.type)) {
      setError('Faqat JPG, PNG yoki WEBP rasm yuklash mumkin.');
      return;
    }
    if (file.size > MAX_RAW) {
      setError('Rasm hajmi 12 MB dan oshmasin.');
      return;
    }
    setBusy(true);
    try {
      const small = await squareJpeg(file);
      setPreview(URL.createObjectURL(small));
      const uploaded = await uploadFile(small, 'avatar');
      const me = await api.put<User>('/me/avatar', { fileId: uploaded.id });
      updateUser({ avatarFileId: me.avatarFileId });
      setDone('Profil surati yangilandi.');
    } catch (e) {
      setError((e as Error).message || 'Rasmni yuklab bo\'lmadi.');
    } finally {
      setBusy(false);
      setPreview(null);
      if (input.current) input.current.value = '';
    }
  };

  const remove = async () => {
    setError('');
    setDone('');
    setBusy(true);
    try {
      await api.del('/me/avatar');
      updateUser({ avatarFileId: null });
      setDone('Profil surati olib tashlandi.');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setOver(false);
    void upload(e.dataTransfer.files?.[0]);
  };

  return (
    <>
      <PageHeader title="Profil" subtitle="Surat va shaxsiy ma'lumotlaringiz" />
      <input ref={input} type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={(e) => void upload(e.target.files?.[0])} />
      <div className="grid-wide">
        <Card>
          <div className="profile-hero">
            <div className="avatar-xl">
              {preview ? (
                <span className="avatar" style={{ width: 148, height: 148 }}>
                  <img src={preview} alt="" />
                </span>
              ) : (
                <Avatar name={user.fullName} fileId={user.avatarFileId} size={148} />
              )}
              <IconButton icon="camera" label="Suratni almashtirish" className="avatar-edit" disabled={busy} onClick={() => input.current?.click()} />
            </div>
            <div className="profile-info">
              <h2>{user.fullName}</h2>
              <Badge tone="info">{ROLE_LABEL[user.role]}</Badge>
              <dl className="dl" style={{ marginTop: 18 }}>
                <dt>Login</dt>
                <dd>{user.login ?? '-'}</dd>
                <dt>Telefon</dt>
                <dd>{user.phone ?? '-'}</dd>
                <dt>Email</dt>
                <dd>{user.email ?? '-'}</dd>
              </dl>
            </div>
          </div>
        </Card>
        <Card title="Profil surati" subtitle="JPG, PNG yoki WEBP. Rasm avtomatik kvadrat qilib kesiladi.">
          <div
            className={`dropzone ${over ? 'over' : ''}`}
            role="button"
            tabIndex={0}
            onClick={() => input.current?.click()}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), input.current?.click())}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(true);
            }}
            onDragLeave={() => setOver(false)}
            onDrop={onDrop}
          >
            <Icon name="upload" size={30} />
            <strong>{busy ? 'Yuklanmoqda...' : 'Rasmni shu yerga tashlang yoki bosing'}</strong>
            <span className="muted">Eng ko'pi bilan 12 MB</span>
          </div>
          {error && (
            <div className="error-box" role="alert" style={{ marginTop: 14 }}>
              {error}
            </div>
          )}
          {done && (
            <div className="success-box" role="status" style={{ marginTop: 14 }}>
              {done}
            </div>
          )}
          <div className="profile-actions">
            <Button loading={busy} onClick={() => input.current?.click()}>
              <Icon name="camera" size={18} /> Surat tanlash
            </Button>
            {user.avatarFileId && (
              <Button variant="danger" disabled={busy} onClick={remove}>
                <Icon name="trash" size={18} /> Olib tashlash
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
