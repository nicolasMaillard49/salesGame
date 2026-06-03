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
