import type { SVGProps } from "react";

const PATHS: Record<string, React.ReactNode> = {
  logo: (<><path d="M3 14l4-4 4 3 6-7" /><path d="M14 6h4v4" /></>),
  flame: (<><path d="M12 2s4 4 4 8a4 4 0 0 1-8 0c0-1 .5-2 1-3" /><path d="M12 22a6 6 0 0 0 6-6c0-3-2-5-3-7" /></>),
  brain: (<><path d="M12 5a3 3 0 0 0-6 .2A3 3 0 0 0 4 11a3 3 0 0 0 2 5 3 3 0 0 0 6 .5z" /><path d="M12 5a3 3 0 0 1 6 .2A3 3 0 0 1 20 11a3 3 0 0 1-2 5 3 3 0 0 1-6 .5z" /></>),
  shield: <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" />,
  phone: <path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />,
  worker: (<><path d="M4 18a8 8 0 0 1 16 0" /><path d="M2 18h20" /><circle cx="12" cy="7" r="3" /></>),
  chat: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  arrowRight: (<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  lock: (<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>),
  trophy: (<><path d="M7 4h10v4a5 5 0 0 1-10 0z" /><path d="M7 6H4v1a3 3 0 0 0 3 3" /><path d="M17 6h3v1a3 3 0 0 1-3 3" /><path d="M9 20h6" /><path d="M12 14v6" /></>),
  target: (<><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /></>),
  book: (<><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M19 17H6a2 2 0 0 0-2 2" /></>),
  dumbbell: (<><path d="M6 7v10M3 9v6M18 7v10M21 9v6M6 12h12" /></>),
  sun: (<><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>),
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  // — Icônes descriptives des situations (fiches / closing) —
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  euro: (<><path d="M17 6a6 6 0 1 0 0 12" /><path d="M5 10h8M5 14h8" /></>),
  users: (<><circle cx="9" cy="8" r="3" /><path d="M3 19a6 6 0 0 1 12 0" /><path d="M16 6a3 3 0 0 1 0 6M21 19a6 6 0 0 0-5-5.9" /></>),
  calendar: (<><rect x="3" y="4" width="18" height="17" rx="2" /><path d="M3 9h18M8 2v4M16 2v4" /></>),
  alert: (<><path d="M12 3l9 16H3z" /><path d="M12 10v4M12 17h.01" /></>),
  star: <path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z" />,
  search: (<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>),
  checkCircle: (<><circle cx="12" cy="12" r="9" /><path d="M8 12l3 3 5-6" /></>),
  repeat: (<><path d="M3 12a6 6 0 0 1 6-6h9" /><path d="M15 3l3 3-3 3" /><path d="M21 12a6 6 0 0 1-6 6H6" /><path d="M9 21l-3-3 3-3" /></>),
  mapPin: (<><path d="M12 21s7-6.3 7-11a7 7 0 0 0-14 0c0 4.7 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" /></>),
  trendingUp: (<><path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" /></>),
  key: (<><circle cx="8" cy="8" r="4" /><path d="M11 11l9 9M17 17l2-2M14 14l2-2" /></>),
  zap: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M4 7l8 6 8-6" /></>),
  heart: <path d="M12 20s-7-4.5-9.5-9A4.5 4.5 0 0 1 12 6a4.5 4.5 0 0 1 9.5 5c-2.5 4.5-9.5 9-9.5 9z" />,
  handshake: (<><path d="M8 13l3 3 2-2 3 3" /><path d="M3 9l4-3 5 2 5-2 4 3-5 5-2-2" /></>),
  eye: (<><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" /><circle cx="12" cy="12" r="3" /></>),
  bridge: (<><path d="M3 8c4 4 14 4 18 0" /><path d="M3 8v9M21 8v9M9 13v4M15 13v4M3 13h18" /></>),
  // — Mode vocal —
  mic: (<><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3M8 21h8" /></>),
  volume: (<><path d="M4 9v6h4l5 4V5L8 9z" /><path d="M16 9a3 3 0 0 1 0 6M18.5 7a6 6 0 0 1 0 10" /></>),
};

export type IconName = keyof typeof PATHS;

export default function Icon({
  name,
  size = 20,
  ...props
}: { name: IconName; size?: number } & SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
