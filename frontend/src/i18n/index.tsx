import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { GREETINGS, MONTHS, MONTHS_UZ, WORDS } from './dict';

export type Lang = 'uz' | 'ru' | 'en';
export const LANGS: { code: Lang; label: string; name: string }[] = [
  { code: 'uz', label: 'UZ', name: "O'zbekcha" },
  { code: 'ru', label: 'RU', name: 'Русский' },
  { code: 'en', label: 'EN', name: 'English' },
];

const KEY = 'skillsup:lang';
const TABLE: Record<Lang, Map<string, string>> = { uz: new Map(), ru: new Map(), en: new Map() };
WORDS.forEach(([uz, ru, en]) => {
  TABLE.ru.set(uz, ru);
  TABLE.en.set(uz, en);
});

const MONTH_RE = new RegExp(`\\b(${MONTHS_UZ.join('|')})\\b`, 'g');
const GREET_RE = new RegExp(`^(${Object.keys(GREETINGS).join('|')}),`);

/** O'zbekcha matnni tanlangan tilga o'giradi (lug'atda bo'lmasa, o'zgarishsiz qaytaradi). */
export function translate(text: string, lang: Lang): string {
  if (lang === 'uz' || !text) return text;
  const lead = text.match(/^\s*/)?.[0] ?? '';
  const tail = text.match(/\s*$/)?.[0] ?? '';
  const core = text.trim();
  if (!core) return text;
  const hit = TABLE[lang].get(core);
  if (hit) return lead + hit + tail;
  let out = core;
  const idx = lang === 'ru' ? 0 : 1;
  out = out.replace(GREET_RE, (_m, g: string) => `${GREETINGS[g][idx]},`);
  out = out.replace(MONTH_RE, (m) => MONTHS[lang][MONTHS_UZ.indexOf(m)]);
  const units: [RegExp, string, string][] = [
    [/^(\d+) ta o'quvchi$/, '$1 учеников', '$1 students'],
    [/^(\d+) kun$/, '$1 дн.', '$1 days'],
    [/^(\d+) daqiqa$/, '$1 мин', '$1 min'],
    [/^(\d+)-sahifa$/, 'Страница $1', 'Page $1'],
    [/^(\d+) ta$/, '$1 шт.', '$1'],
    [/^(\d+) ta baho$/, '$1 оценок', '$1 ratings'],
    [/^([\d\s]+) so'm$/, '$1 сум', '$1 UZS'],
    [/^Keyingisigacha (\d+) XP$/, 'До следующего: $1 XP', '$1 XP to next'],
    [/^(\d+)-bosqich$/, 'Уровень $1', 'Level $1'],
    [/^(\d+) kun \(/, '$1 дн. (', '$1 days ('],
  ];
  for (const [re, ru, en] of units) if (re.test(out)) out = out.replace(re, lang === 'ru' ? ru : en);
  return out === core ? text : lead + out + tail;
}

let current: Lang = ((typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as Lang) || 'uz';
export const getLang = () => current;

const textState = new WeakMap<Text, { orig: string; applied: string }>();
const attrState = new WeakMap<Element, Record<string, { orig: string; applied: string }>>();
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'CODE', 'TEXTAREA', 'NOSCRIPT']);

function applyText(node: Text, lang: Lang) {
  const st = textState.get(node);
  const base = st && node.data === st.applied ? st.orig : node.data;
  const next = translate(base, lang);
  if (next !== node.data) node.data = next;
  textState.set(node, { orig: base, applied: next });
}

function applyAttrs(el: Element, lang: Lang) {
  const st = attrState.get(el) ?? {};
  for (const a of ATTRS) {
    const v = el.getAttribute(a);
    if (v === null) continue;
    const prev = st[a];
    const base = prev && v === prev.applied ? prev.orig : v;
    const next = translate(base, lang);
    if (next !== v) el.setAttribute(a, next);
    st[a] = { orig: base, applied: next };
  }
  attrState.set(el, st);
}

function walk(root: Node, lang: Lang) {
  if (root.nodeType === Node.TEXT_NODE) {
    if (!SKIP.has(root.parentElement?.tagName ?? '')) applyText(root as Text, lang);
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const el = root as Element;
  if (SKIP.has(el.tagName) || el.hasAttribute('data-no-i18n')) return;
  applyAttrs(el, lang);
  el.childNodes.forEach((c) => walk(c, lang));
}

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (uz: string) => string;
}
const LangContext = createContext<Ctx>({ lang: 'uz', setLang: () => undefined, t: (s) => s });
export const useLang = () => useContext(LangContext);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(current);
  const setLang = (l: Lang) => {
    current = l;
    localStorage.setItem(KEY, l);
    setLangState(l);
  };

  useEffect(() => {
    document.documentElement.lang = lang;
    walk(document.body, lang);
    const mo = new MutationObserver((records) => {
      mo.disconnect();
      for (const r of records) {
        if (r.type === 'characterData') walk(r.target, lang);
        else if (r.type === 'attributes') applyAttrs(r.target as Element, lang);
        else r.addedNodes.forEach((n) => walk(n, lang));
      }
      mo.observe(document.body, opts);
    });
    const opts: MutationObserverInit = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
    mo.observe(document.body, opts);
    return () => mo.disconnect();
  }, [lang]);

  return <LangContext.Provider value={{ lang, setLang, t: (s) => translate(s, lang) }}>{children}</LangContext.Provider>;
}
