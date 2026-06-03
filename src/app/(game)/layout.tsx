import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";

const NAV = [
  { href: "/", label: "Hub" },
  { href: "/quiz", label: "Quiz" },
  { href: "/drill", label: "Objections" },
  { href: "/sim", label: "Simulateur" },
];

function LogoMark() {
  return (
    <span className="logo-mark" aria-hidden="true">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 14l4-4 4 3 6-7" />
        <path d="M14 6h4v4" />
      </svg>
    </span>
  );
}

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-[var(--line)] sticky top-0 z-10 bg-[color-mix(in_srgb,var(--paper)_88%,transparent)] backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3" aria-label="SalesGame, accueil">
            <LogoMark />
            <span className="logo-name">Sales<b>Game</b></span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="mono text-[var(--ink-faint)] hover:text-[var(--ink)] transition hidden sm:inline"
              >
                {n.label}
              </Link>
            ))}
            <LogoutButton />
            <span className="avatar" aria-label="Profil">N</span>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
