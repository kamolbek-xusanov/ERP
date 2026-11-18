import { ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../auth/AuthContext';
import { norm, runSearch, SearchGroup, SearchItem, useSearchIndex } from '../hooks/useSearchIndex';
import { Icon } from './icons';
import { IconButton } from './ui';

function highlight(text: string, query: string): ReactNode {
  const words = query
    .trim()
    .split(/\s+/)
    .filter((w) => w.length > 0)
    .map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  if (!words.length) return text;
  try {
    const re = new RegExp(`(${words.join('|')})`, 'ig');
    return text.split(re).map((part, i) => (i % 2 === 1 ? <mark key={i}>{part}</mark> : part));
  } catch {
    return text;
  }
}

function Panel({
  groups,
  query,
  loading,
  active,
  onPick,
  onHover,
}: {
  groups: SearchGroup[];
  query: string;
  loading: boolean;
  active: number;
  onPick: (item: SearchItem) => void;
  onHover: (index: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.querySelector<HTMLElement>('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [active]);
  let index = -1;
  const empty = groups.length === 0;
  return (
    <div className="search-panel" role="listbox" ref={ref}>
      {empty && (
        <div className="search-empty">
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" /> <span>Qidiruv bazasi yuklanmoqda...</span>
            </>
          ) : (
            <>“{query}” bo'yicha hech narsa topilmadi. Boshqacha yozib ko'ring (ism, login, telefon, dars yoki guruh nomi).</>
          )}
        </div>
      )}
      {groups.map((g) => (
        <div key={g.kind}>
          <div className="search-group">{g.label}</div>
          {g.items.map((item) => {
            index += 1;
            const i = index;
            return (
              <button
                key={item.id}
                type="button"
                role="option"
                aria-selected={i === active}
                data-active={i === active}
                className={`search-item ${i === active ? 'active' : ''}`}
                onMouseEnter={() => onHover(i)}
                onClick={() => onPick(item)}
              >
                <span className="si-icon">
                  <Icon name={item.icon} size={17} />
                </span>
                <span className="si-text">
                  <span className="si-title">{highlight(item.title, query)}</span>
                  {item.subtitle && <span className="si-sub">{highlight(item.subtitle, query)}</span>}
                </span>
                <Icon name="arrowRight" size={16} className="si-go" />
              </button>
            );
          })}
        </div>
      ))}
      {!empty && loading && (
        <div className="search-empty" style={{ padding: 12 }}>
          <span className="spinner spinner-sm" aria-hidden="true" /> Yana natijalar yuklanmoqda...
        </div>
      )}
      <div className="search-foot" aria-hidden="true">
        <span>
          <kbd>↑</kbd> <kbd>↓</kbd> tanlash
        </span>
        <span>
          <kbd>Enter</kbd> ochish
        </span>
        <span>
          <kbd>Esc</kbd> yopish
        </span>
      </div>
    </div>
  );
}

export function GlobalSearch({ onNavigate }: { onNavigate: (to: string) => void }) {
  const { user } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [active, setActive] = useState(0);
  const wrap = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);

  const { items, loading } = useSearchIndex(user?.role, open || sheet);
  const groups = useMemo(() => runSearch(items, query), [items, query]);
  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  useEffect(() => setActive(0), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setSheet(false);
  }, []);

  const pick = useCallback(
    (item: SearchItem) => {
      close();
      setQuery('');
      input.current?.blur();
      onNavigate(item.to);
    },
    [close, onNavigate],
  );

  // Ctrl/⌘ + K yoki "/" bilan qidiruvni ochish
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const typing = !!target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable);
      if ((e.key.toLowerCase() === 'k' && (e.ctrlKey || e.metaKey)) || (e.key === '/' && !typing)) {
        e.preventDefault();
        if (window.matchMedia('(max-width: 900px)').matches) setSheet(true);
        else {
          input.current?.focus();
          setOpen(true);
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  // Tashqariga bosilganda yopish (desktop)
  useEffect(() => {
    if (!open) return;
    const onDown = (e: Event) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  useEffect(() => {
    if (!sheet) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, [sheet]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a + 1) % flat.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => (flat.length ? (a - 1 + flat.length) % flat.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flat[active]) pick(flat[active]);
    } else if (e.key === 'Escape') {
      close();
      input.current?.blur();
    }
  };

  const field = (autoFocus: boolean) => (
    <div className="search-field">
      <Icon name="search" size={19} />
      <input
        ref={autoFocus ? undefined : input}
        autoFocus={autoFocus}
        type="search"
        inputMode="search"
        enterKeyHint="search"
        autoComplete="off"
        spellCheck={false}
        placeholder="Qidirish..."
        aria-label="Qidirish"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />
      {query ? (
        <button type="button" className="search-clear" aria-label="Tozalash" onClick={() => { setQuery(''); (autoFocus ? undefined : input.current)?.focus(); }}>
          <Icon name="close" size={14} />
        </button>
      ) : (
        !autoFocus && <kbd aria-hidden="true">Ctrl K</kbd>
      )}
    </div>
  );

  return (
    <>
      <div className="search" ref={wrap}>
        {field(false)}
        {open && <Panel groups={groups} query={query} loading={loading} active={active} onPick={pick} onHover={setActive} />}
      </div>
      <IconButton className="search-btn" icon="search" label="Qidirish" onClick={() => setSheet(true)} />
      {sheet &&
        createPortal(
          <div className="search-sheet" role="dialog" aria-label="Qidirish">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 0 }}>{field(true)}</div>
              <IconButton icon="close" label="Yopish" onClick={close} />
            </div>
            <Panel groups={groups} query={query} loading={loading} active={active} onPick={pick} onHover={setActive} />
          </div>,
          document.body,
        )}
    </>
  );
}

export { norm };
