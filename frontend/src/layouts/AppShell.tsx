import { createContext, MouseEvent, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { NotificationItem } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { GlobalSearch } from '../components/GlobalSearch';
import { Icon, IconName } from '../components/icons';
import { Avatar, IconButton, Modal } from '../components/ui';
import { useAction, useGet } from '../hooks/useApi';
import { prefersReducedMotion, useDismiss } from '../hooks/useUi';
import { fmtDateTime } from '../utils/format';
import { applyTheme, useResolvedTheme } from '../utils/theme';
import { LANGS, useLang } from '../i18n';
import { activeItem, adminNav, NAV, NavItem, PROFILE_PATH, ROLE_LABEL, SETTINGS_PATH, studentNav, teacherNav } from './nav';

export type { NavItem };
export { adminNav, studentNav, teacherNav };

/* ---------------------------------------------------------------- "Suzib" o'tish */

const GlideContext = createContext<(to: string) => void>(() => undefined);
export const useGlide = () => useContext(GlideContext);

function GlideLink({ to, className, onGo, children, ...rest }: { to: string; className?: string; onGo?: () => void; children: ReactNode; 'aria-current'?: 'page' }) {
  const glide = useGlide();
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    onGo?.();
    glide(to);
  };
  return (
    <Link to={to} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}

/* ---------------------------------------------------------------- Yuqori tablar */

function Tabs({ items, path }: { items: NavItem[]; path: string }) {
  const glide = useGlide();
  const tabs = items.filter((i) => i.tab);
  const current = activeItem(items, path);
  const box = useRef<HTMLDivElement>(null);
  const refs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [pill, setPill] = useState<{ x: number; w: number } | null>(null);
  const [ready, setReady] = useState(false);

  const measure = useCallback(() => {
    const el = current?.tab ? refs.current[current.to] : null;
    setPill(el ? { x: el.offsetLeft, w: el.offsetWidth } : null);
  }, [current]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);
  useEffect(() => {
    const t = window.setTimeout(() => setReady(true), 60);
    const el = box.current;
    if (!el || typeof ResizeObserver === 'undefined') return () => window.clearTimeout(t);
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => {
      window.clearTimeout(t);
      ro.disconnect();
    };
  }, [measure]);

  return (
    <nav className="tabs" ref={box} aria-label="Asosiy bo'limlar">
      <span className={`tab-pill ${ready ? '' : 'no-anim'}`} style={{ transform: `translateX(${pill?.x ?? 0}px)`, width: pill?.w ?? 0, opacity: pill ? 1 : 0 }} aria-hidden="true" />
      {tabs.map((t) => (
        <Link
          key={t.to}
          to={t.to}
          className={`tab ${current?.to === t.to ? 'active' : ''}`}
          aria-current={current?.to === t.to ? 'page' : undefined}
          ref={(el) => {
            refs.current[t.to] = el;
          }}
          onClick={(e) => {
            if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
            e.preventDefault();
            glide(t.to);
          }}
        >
          <Icon name={t.icon} size={18} />
          {t.label}
        </Link>
      ))}
    </nav>
  );
}

/* ---------------------------------------------------------------- Mavzu va til */

function ThemeToggle() {
  const theme = useResolvedTheme();
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    api.put('/me/settings', { theme: next }).catch(() => undefined);
  };
  return <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? "Yorug' rejim" : "Qorong'i rejim"} onClick={toggle} />;
}

function LangSwitch() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);
  return (
    <div className="lang-switch" ref={box} style={{ position: 'relative' }} data-no-i18n>
      <button type="button" className="icon-btn lang-btn" aria-label="Til" title="Til" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Icon name="globe" size={18} />
        <span>{LANGS.find((l) => l.code === lang)?.label}</span>
      </button>
      {open && (
        <div className="popover narrow" role="menu">
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              role="menuitemradio"
              aria-checked={l.code === lang}
              className={`menu-item ${l.code === lang ? 'selected' : ''}`}
              onClick={() => {
                setLang(l.code);
                setOpen(false);
              }}
            >
              <strong style={{ width: 28 }}>{l.label}</strong> {l.name}
              {l.code === lang && <Icon name="check" size={16} style={{ marginLeft: 'auto' }} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Bildirishnomalar */

function Notifications({ onNavigate }: { onNavigate: (to: string) => void }) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);
  const list = useGet<NotificationItem[]>('/notifications?limit=20', { refetchInterval: 20_000 });
  const unread = list.data?.filter((n) => !n.readAt).length ?? 0;
  const readAll = useAction(() => api.post('/notifications/read-all'), ['/notifications']);
  const readOne = useAction((id: string) => api.post(`/notifications/${id}/read`), ['/notifications']);
  const go = (n: NotificationItem) => {
    if (!n.readAt) readOne.mutate(n.id);
    setOpen(false);
    if (n.link) onNavigate(n.link);
  };
  return (
    <div className="notifications" ref={box} style={{ position: 'relative' }}>
      <IconButton icon="bell" label={unread ? `Bildirishnomalar (${unread} ta o'qilmagan)` : 'Bildirishnomalar'} className="notification-btn" aria-expanded={open} onClick={() => setOpen(!open)} />
      {unread > 0 && <b className="count" aria-hidden="true">{unread > 9 ? '9+' : unread}</b>}
      {open && (
        <div className="popover" role="dialog" aria-label="Bildirishnomalar">
          <div className="popover-head">
            <div>
              <strong>Bildirishnomalar</strong>
              <div className="muted">So'nggi xabarlar</div>
            </div>
            <button type="button" className="link" disabled={!unread} onClick={() => readAll.mutate(undefined)}>
              Hammasini o'qildi
            </button>
          </div>
          {list.isLoading && <div className="search-empty">Yuklanmoqda...</div>}
          {!list.isLoading && !list.data?.length && <div className="search-empty">Bildirishnoma yo'q.</div>}
          {list.data?.map((n) => (
            <button type="button" key={n.id} className={`notice ${n.readAt ? '' : 'notice-unread'}`} onClick={() => go(n)}>
              <span>{n.title}</span>
              <span className="muted">{fmtDateTime(n.createdAt)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Yordam oynasi */

function HelpDialog({ onClose, role }: { onClose: () => void; role: 'STUDENT' | 'TEACHER' | 'ADMIN' }) {
  const glide = useGlide();
  const tips: Record<typeof role, string[]> = {
    STUDENT: ["Darslar bo'limida videoni ko'ring, vazifani shu sahifadan topshiring.", "Reyting va Tahlil bo'limlarida o'z natijangizni kuzating.", "Savollar uchun Qo'llanma bo'limidagi javoblarni ko'ring."],
    TEACHER: ["Dars boshlash orqali yangi dars va vazifa yarating.", "Jurnalda davomat va imtihon natijalari ko'rinadi.", "Tekshirish bo'limida baholanishi kutilayotgan ishlar turadi."],
    ADMIN: ["O'quvchi va ustozlarni tegishli bo'limda qo'shing va boshqaring.", "Xonalar bo'limida bo'sh kataklarni tekshirib, yangi guruh oching.", "To'lovlar bo'limida eslatma yuboring va to'lovni yozib qo'ying."],
  };
  return (
    <Modal title="Tezkor yordam" onClose={onClose}>
      <ul className="list">
        {tips[role].map((t) => (
          <li key={t}>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 14 }}>
        <div className="shortcut">
          <span>Qidirishni ochish</span>
          <span>
            <kbd>Ctrl</kbd> + <kbd>K</kbd> yoki <kbd>/</kbd>
          </span>
        </div>
        <div className="shortcut">
          <span>Qidiruv natijasini tanlash</span>
          <span>
            <kbd>↑</kbd> <kbd>↓</kbd> <kbd>Enter</kbd>
          </span>
        </div>
        <div className="shortcut">
          <span>Oynani yopish</span>
          <kbd>Esc</kbd>
        </div>
      </div>
      {role === 'STUDENT' && (
        <p style={{ marginTop: 16, marginBottom: 0 }}>
          <button
            type="button"
            className="link"
            onClick={() => {
              onClose();
              glide('/guides');
            }}
          >
            To'liq qo'llanmani ochish →
          </button>
        </p>
      )}
    </Modal>
  );
}

/* ---------------------------------------------------------------- Foydalanuvchi menyusi */

function UserMenu({ onNavigate, onLogout }: { onNavigate: (to: string) => void; onLogout: () => void }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const theme = useResolvedTheme();
  const box = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(box, open, close);
  if (!user) return null;
  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    api.put('/me/settings', { theme: next }).catch(() => undefined);
  };
  const go = (to: string) => {
    setOpen(false);
    onNavigate(to);
  };
  return (
    <div className="user-menu" ref={box} style={{ position: 'relative' }}>
      <button type="button" className="user-btn" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen(!open)}>
        <Avatar name={user.fullName} fileId={user.avatarFileId} size={40} />
        <span className="user-meta">
          <strong>{user.fullName}</strong>
          <span className="role">{ROLE_LABEL[user.role]}</span>
        </span>
        <Icon name="chevronDown" size={16} />
      </button>
      {open && (
        <div className="popover narrow" role="menu">
          <div className="menu-head">
            <Avatar name={user.fullName} fileId={user.avatarFileId} size={44} />
            <div>
              <strong>{user.fullName}</strong>
              <span>{ROLE_LABEL[user.role]}</span>
            </div>
          </div>
          <button type="button" role="menuitem" className="menu-item" onClick={() => go(PROFILE_PATH[user.role])}>
            <Icon name="user" size={18} /> Profil va surat
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={() => go(SETTINGS_PATH[user.role])}>
            <Icon name="settings" size={18} /> Sozlamalar
          </button>
          <button type="button" role="menuitem" className="menu-item" onClick={toggleTheme}>
            <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} /> {theme === 'dark' ? 'Yorug\' rejim' : 'Qorong\'i rejim'}
          </button>
          <button type="button" role="menuitem" className="menu-item danger" onClick={onLogout}>
            <Icon name="logout" size={18} /> Chiqish
          </button>
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- Menyu ro'yxati */

function NavList({ items, path, onGo, extra }: { items: NavItem[]; path: string; onGo?: () => void; extra?: ReactNode }) {
  const current = activeItem(items, path);
  return (
    <>
      <div className="rail-label">ASOSIY MENYU</div>
      <nav aria-label="Asosiy menyu">
        {items.map((i) => (
          <GlideLink key={i.to} to={i.to} onGo={onGo} className={`nav-link ${current?.to === i.to ? 'active' : ''}`} aria-current={current?.to === i.to ? 'page' : undefined}>
            <span className="nav-icon">
              <Icon name={i.icon as IconName} size={21} />
            </span>
            <span className="nav-text">{i.label}</span>
            <Icon name="chevronRight" size={16} className="nav-arrow" />
          </GlideLink>
        ))}
      </nav>
      {extra}
    </>
  );
}

/* ---------------------------------------------------------------- AppShell */

export function AppShell({ items }: { items?: NavItem[] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const nav = items ?? (user ? NAV[user.role] : []);
  const [pending, setPending] = useState<string | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [help, setHelp] = useState(false);
  const timer = useRef<number>();

  const glide = useCallback(
    (to: string) => {
      const [target] = to.split('?');
      setDrawer(false);
      if (to === location.pathname + location.search) return;
      window.clearTimeout(timer.current);
      if (target === location.pathname || prefersReducedMotion() || /^https?:/.test(to)) {
        if (/^https?:/.test(to)) window.location.href = to;
        else navigate(to);
        return;
      }
      setPending(target);
      setLeaving(true);
      timer.current = window.setTimeout(() => {
        navigate(to);
        setLeaving(false);
        setPending(null);
      }, 210);
    },
    [location.pathname, location.search, navigate],
  );
  useEffect(() => () => window.clearTimeout(timer.current), []);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
  }, [location.pathname]);

  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setDrawer(false);
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [drawer]);

  const goBack = useCallback(() => {
    if (window.history.length > 1) navigate(-1);
    else glide(nav[0]?.to ?? '/');
  }, [navigate, glide, nav]);

  const shownPath = pending ?? location.pathname;
  const home = nav[0]?.to ?? '/';

  const doLogout = useCallback(async () => {
    await logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const bottom = useMemo(
    () => (
      <>
        <div className="rail-sep" />
        <button type="button" className="nav-btn" onClick={() => { setDrawer(false); setHelp(true); }}>
          <span className="nav-icon">
            <Icon name="help" size={21} />
          </span>
          <span className="nav-text">Yordam</span>
        </button>
        <button type="button" className="nav-btn" onClick={doLogout}>
          <span className="nav-icon">
            <Icon name="logout" size={21} />
          </span>
          <span className="nav-text">Chiqish</span>
        </button>
      </>
    ),
    [doLogout],
  );

  return (
    <GlideContext.Provider value={glide}>
      <div className="shell">
        <header className="topbar">
          <div className="topbar-brand">
            <IconButton icon="menu" label="Menyuni ochish" className="mobile-menu" aria-expanded={drawer} onClick={() => setDrawer(true)} />
            <GlideLink to={home} className="brand">
              <span className="brand-mark">E</span>
              <span>
                <span className="brand-name">
                  Edu<span>via</span>
                </span>
                <span className="brand-sub">EDUCATION PLATFORM</span>
              </span>
            </GlideLink>
          </div>
          <div className="topbar-center">
            <Tabs items={nav} path={shownPath} />
          </div>
          <div className="topbar-actions">
            <GlobalSearch onNavigate={glide} />
            <LangSwitch />
            <ThemeToggle />
            <Notifications onNavigate={glide} />
            <UserMenu onNavigate={glide} onLogout={doLogout} />
          </div>
        </header>

        <aside className="rail" aria-label="Yon panel">
          <NavList items={nav} path={shownPath} extra={bottom} />
        </aside>

        {drawer && (
          <>
            <button type="button" className="drawer-overlay" aria-label="Menyuni yopish" onClick={() => setDrawer(false)} />
            <aside className="drawer" aria-label="Menyu">
              <div className="drawer-top">
                <span className="brand">
                  <span className="brand-mark">E</span>
                  <span className="brand-name">
                    Edu<span>via</span>
                  </span>
                </span>
                <IconButton icon="close" label="Yopish" onClick={() => setDrawer(false)} />
              </div>
              <NavList items={nav} path={shownPath} onGo={() => setDrawer(false)} extra={bottom} />
            </aside>
          </>
        )}

        <div className="main">
          <main className="content">
            {!nav.some((i) => i.to === location.pathname) && (
              <button type="button" className="back-btn" onClick={goBack}>
                <Icon name="arrowLeft" size={18} /> Orqaga
              </button>
            )}
            <div key={location.pathname} className={`page ${leaving ? 'is-leaving' : ''}`}>
              <Outlet />
            </div>
          </main>
        </div>
        {help && user && <HelpDialog role={user.role} onClose={() => setHelp(false)} />}
      </div>
    </GlideContext.Provider>
  );
}
