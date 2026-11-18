const BASE: string = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

const ACCESS = 'skillsup:token';
const REFRESH = 'skillsup:refresh';

export const tokens = {
  get access() {
    return localStorage.getItem(ACCESS);
  },
  get refresh() {
    return localStorage.getItem(REFRESH);
  },
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};

export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

let refreshing: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokens.refresh;
  if (!refreshToken) return false;
  try {
    const res = await fetch(`${BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    tokens.set(data.token, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function expire() {
  tokens.clear();
  window.dispatchEvent(new Event('auth:expired'));
}

async function request(path: string, init: RequestInit = {}, retry = true): Promise<Response> {
  const headers = new Headers(init.headers);
  if (tokens.access) headers.set('Authorization', `Bearer ${tokens.access}`);
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const isAuthCall = path.startsWith('/auth/');
  if (res.status === 401 && !isAuthCall) {
    if (retry) {
      refreshing = refreshing ?? refreshTokens().finally(() => (refreshing = null));
      if (await refreshing) return request(path, init, false);
    }
    expire();
  }
  return res;
}

async function parse<T>(res: Response): Promise<T> {
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const e = data?.error;
    throw new ApiError(res.status, e?.code ?? 'ERROR', e?.message ?? "So'rov bajarilmadi.", e?.fields);
  }
  return data as T;
}

const send = <T>(method: string, path: string, body?: unknown) =>
  request(path, { method, body: body === undefined ? undefined : JSON.stringify(body) }).then((r) => parse<T>(r));

export const api = {
  get: <T>(path: string) => send<T>('GET', path),
  post: <T>(path: string, body?: unknown) => send<T>('POST', path, body ?? {}),
  put: <T>(path: string, body?: unknown) => send<T>('PUT', path, body ?? {}),
  del: <T>(path: string) => send<T>('DELETE', path),
  async list<T>(path: string): Promise<{ items: T[]; total: number }> {
    const res = await request(path);
    const items = await parse<T[]>(res);
    return { items, total: Number(res.headers.get('X-Total-Count') ?? items.length) };
  },
  async login(login: string, password: string) {
    const res = await request('/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) });
    return parse<{ token: string; refreshToken: string; user: { id: string; role: string; fullName: string } }>(res);
  },
  async logout() {
    await request('/auth/logout', { method: 'POST', body: '{}' }).catch(() => undefined);
  },
};

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  mime: string;
}

export async function uploadFile(file: File, purpose: 'answer' | 'material' | 'video' | 'avatar'): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', file);
  const res = await request(`/files?purpose=${purpose}`, { method: 'POST', body: form });
  return parse<UploadedFile>(res);
}

export async function fetchBlob(fileId: string): Promise<Blob> {
  const res = await request(`/files/${fileId}`);
  if (!res.ok) throw new ApiError(res.status, 'ERROR', 'Faylni olib bo\'lmadi.');
  return res.blob();
}
