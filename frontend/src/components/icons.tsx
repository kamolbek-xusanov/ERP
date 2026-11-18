import { SVGProps } from 'react';

/** Hamma ikonkalar 24x24, chiziqli (stroke) uslubda. Rang `currentColor` dan olinadi. */
const PATHS = {
  home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10v9.5a1 1 0 0 0 1 1H10v-6h4v6h3.5a1 1 0 0 0 1-1V10" /></>,
  groups: <><circle cx="9" cy="8" r="3.2" /><path d="M3 19.5c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" /><circle cx="17.5" cy="9" r="2.5" /><path d="M17 14.2c2.4.2 4 1.9 4 4.3" /></>,
  lessons: <><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="m10.2 9.2 4.6 2.8-4.6 2.8z" /></>,
  trophy: <><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11" /><path d="M12 13v3.5M8.5 20h7M9.5 20v-1.8a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V20" /></>,
  calendar: <><rect x="3.5" y="5" width="17" height="15.5" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4" /></>,
  chart: <><path d="M4 20V4" /><path d="M4 20h16" /><path d="M8.5 16v-4M13 16V8M17.5 16v-6" /></>,
  wallet: <><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5H18v3" /><rect x="3.5" y="7.5" width="17" height="12" rx="3" /><path d="M16 13.5h2.2" /></>,
  briefcase: <><rect x="3.5" y="7.5" width="17" height="12" rx="3" /><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 13h17" /></>,
  book: <><path d="M5 4.5h10.5A2.5 2.5 0 0 1 18 7v13H7.5A2.5 2.5 0 0 1 5 17.5z" /><path d="M5 17.5A2.5 2.5 0 0 1 7.5 15H18" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M18.4 5.6l-1.6 1.6M7.2 16.8l-1.6 1.6" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  journal: <><rect x="4" y="3.5" width="16" height="17" rx="3" /><path d="M8 8.5h8M8 12.5h8M8 16.5h5" /></>,
  review: <><circle cx="12" cy="12" r="8.5" /><path d="m8.5 12.3 2.4 2.4 4.7-5" /></>,
  student: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></>,
  teacher: <><circle cx="10" cy="8" r="3.5" /><path d="M3.5 20c0-3.6 2.9-6 6.5-6 1.3 0 2.5.3 3.5.9" /><circle cx="18" cy="17" r="2.2" /><path d="M18 13.5v1.3M18 19.2v1.3M21.1 15.2l-1.1.6M16 18.2l-1.1.6M21.1 18.8l-1.1-.6M16 15.8l-1.1-.6" /></>,
  door: <><path d="M6 20.5V5a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 18 5v15.5" /><path d="M4 20.5h16M14.5 12v.5" /></>,
  receipt: <><path d="M6 3.5h12v17l-2.5-1.6-1.8 1.6-1.7-1.6-1.7 1.6-1.8-1.6L6 20.5z" /><path d="M9 8.5h6M9 12h6" /></>,
  shield: <><path d="M12 3.5 5 6v5.5c0 4.2 2.9 7.4 7 9 4.1-1.6 7-4.8 7-9V6z" /><path d="m9.2 12 2 2 3.6-3.8" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4.5 4.5" /></>,
  bell: <><path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z" /><path d="M10 21h4" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M18.7 5.3l-1.4 1.4M6.7 17.3l-1.4 1.4" /></>,
  moon: <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z" />,
  logout: <><path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" /><path d="M15 8l4 4-4 4M19 12H9.5" /></>,
  user: <><circle cx="12" cy="8.5" r="3.6" /><path d="M4.8 20c.6-3.5 3.4-5.5 7.2-5.5s6.6 2 7.2 5.5" /></>,
  camera: <><path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H8l1.3-2h5.4L16 6h1.5A2.5 2.5 0 0 1 20 8.5v9A2.5 2.5 0 0 1 17.5 20h-11A2.5 2.5 0 0 1 4 17.5z" /><circle cx="12" cy="13" r="3.4" /></>,
  upload: <><path d="M12 16V4.5M7.5 9 12 4.5 16.5 9" /><path d="M4.5 15.5v2A2.5 2.5 0 0 0 7 20h10a2.5 2.5 0 0 0 2.5-2.5v-2" /></>,
  trash: <><path d="M4.5 7h15M10 7V4.8A.8.8 0 0 1 10.8 4h2.4a.8.8 0 0 1 .8.8V7" /><path d="M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7M10 11v6M14 11v6" /></>,
  chevronDown: <path d="m6 9.5 6 6 6-6" />,
  chevronRight: <path d="m9.5 6 6 6-6 6" />,
  arrowUp: <path d="M12 19V5M6 11l6-6 6 6" />,
  arrowDown: <path d="M12 5v14M6 13l6 6 6-6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  file: <><path d="M6.5 3.5h7L18.5 8.5v10A2 2 0 0 1 16.5 20.5h-10A2 2 0 0 1 4.5 18.5v-13a2 2 0 0 1 2-2z" /><path d="M13.5 3.5v5h5" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
  flame: <path d="M12 3.5c.6 3-1.5 4.2-3 6.2-1.2 1.6-1.5 3.1-1 4.8A5 5 0 0 0 12 19.5a5 5 0 0 0 5-5c0-2.4-1.3-3.6-2.1-5.2-.5 1-1.1 1.7-1.9 2 .4-2.4-.1-5-1-7.8z" />,
  star: <path d="m12 3.8 2.4 5 5.4.7-4 3.8 1 5.4-4.8-2.7-4.8 2.7 1-5.4-4-3.8 5.4-.7z" />,
  gem: <><path d="M7 4.5h10l3.5 5L12 20 3.5 9.5z" /><path d="M3.5 9.5h17M9.5 4.5 8 9.5 12 20l4-10.5-1.5-5" /></>,
  trendUp: <><path d="m3.5 16 5.5-5.5 3.5 3.5 7.5-7.5" /><path d="M15 6.5h5v5" /></>,
  trendDown: <><path d="m3.5 8 5.5 5.5 3.5-3.5 7.5 7.5" /><path d="M15 17.5h5v-5" /></>,
  folder: <path d="M3.5 7A2.5 2.5 0 0 1 6 4.5h3.2l2 2.5H18A2.5 2.5 0 0 1 20.5 9.5v8A2.5 2.5 0 0 1 18 20H6a2.5 2.5 0 0 1-2.5-2.5z" />,
  info: <><circle cx="12" cy="12" r="8.5" /><path d="M12 11v5M12 8v.2" /></>,
  help: <><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.6A2.6 2.6 0 0 1 12 8c1.5 0 2.6 1 2.6 2.3 0 1.9-2.6 2-2.6 3.7M12 16.8v.2" /></>,
  money: <><circle cx="12" cy="12" r="8.5" /><path d="M14.5 9.2c-.4-.9-1.4-1.4-2.5-1.4-1.4 0-2.5.8-2.5 1.9 0 2.6 5.2 1.3 5.2 4 0 1.1-1.1 1.9-2.7 1.9-1.2 0-2.3-.5-2.7-1.5M12 6.5v1.3M12 16.2v1.3" /></>,
  video: <><rect x="3.5" y="6" width="12" height="12" rx="3" /><path d="m15.5 10.5 5-2.5v8l-5-2.5" /></>,
  command: <path d="M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9zm0 0h6m-6 0v6m6-6V6.5A2.5 2.5 0 1 1 17.5 9H15zm0 0v6m0 0h2.5a2.5 2.5 0 1 1-2.5 2.5V15zm0 0H9m0 0v2.5A2.5 2.5 0 1 1 6.5 15H9z" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  alert: <><path d="M12 4 3.5 19h17z" /><path d="M12 10v4M12 16.8v.2" /></>,
  edit: <><path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z" /><path d="m14 7 3 3" /></>,
  inbox: <><path d="M4 13.5 6.2 6A2 2 0 0 1 8.1 4.5h7.8A2 2 0 0 1 17.8 6L20 13.5" /><path d="M4 13.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18v-4.5h-4.5a3.5 3.5 0 0 1-7 0z" /></>,
  eye: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  eyeOff: <><path d="M3 3l18 18M10.6 6.2A9.6 9.6 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-3.1 3.8M6.5 7.6C4 9.3 2.5 12 2.5 12S6 18 12 18c1.6 0 3-.4 4.2-1M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>,
  copy: <><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5" /></>,
  download: <><path d="M12 4v11.5M7.5 11 12 15.5 16.5 11" /><path d="M4.5 17v1.5A1.5 1.5 0 0 0 6 20h12a1.5 1.5 0 0 0 1.5-1.5V17" /></>,
  globe: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5S14.4 18.1 12 20.5C9.6 18.1 8.4 15.3 8.4 12S9.6 5.9 12 3.5z" /></>,
  link: <><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1" /><path d="M14 10a4 4 0 0 0-5.7 0l-3 3A4 4 0 0 0 11 18.7l1-1" /></>,
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({ name, size = 20, ...rest }: { name: IconName; size?: number } & Omit<SVGProps<SVGSVGElement>, 'name'>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...rest}
    >
      {PATHS[name]}
    </svg>
  );
}
