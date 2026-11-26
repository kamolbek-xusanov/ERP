import { useEffect, useState } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

export function applyTheme(choice: ThemeChoice) {
  localStorage.setItem('eduvia:theme', choice);
  const resolved = choice === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : choice;
  document.documentElement.dataset.theme = resolved;
  window.dispatchEvent(new Event('eduvia:theme'));
}

export function initTheme() {
  applyTheme((localStorage.getItem('eduvia:theme') as ThemeChoice) ?? 'dark');
}

/** Hozirgi (hal qilingan) tema: 'dark' yoki 'light'. Boshqa joyda o'zgarsa, yangilanadi. */
export function useResolvedTheme() {
  const read = () => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  const [theme, setTheme] = useState<'light' | 'dark'>(read);
  useEffect(() => {
    const on = () => setTheme(read());
    window.addEventListener('eduvia:theme', on);
    return () => window.removeEventListener('eduvia:theme', on);
  }, []);
  return theme;
}
