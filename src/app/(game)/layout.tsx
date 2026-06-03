import Link from "next/link";
import { redirect } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";
import LogoutButton from "@/components/LogoutButton";
import Icon from "@/components/Icon";
import Orbs from "@/components/Orbs";

const NAV = [
  { href: "/", label: "Hub" },
  { href: "/quiz", label: "Quiz" },
  { href: "/drill", label: "Objections" },
  { href: "/sim", label: "Simulateur" },
];

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/login");

  return (
    <div className="flex-1 flex flex-col relative">
      <Orbs />
      <div className="relative z-[1] flex-1 flex flex-col">
        <header className="glass sticky top-4 z-20 mx-auto mt-4 w-[calc(100%-2rem)] max-w-[980px] flex items-center justify-between px-4 py-3 !rounded-full">
          <Link href="/" className="flex items-center gap-3" aria-label="SalesGame, accueil">
            <span className="brand-mark"><Icon name="logo" size={20} strokeWidth={2.2} /></span>
            <span className="brand-name">Sales<span>Game</span></span>
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="mono text-[13px] text-[var(--ink-faint)] hover:text-[var(--ink)] transition hidden sm:inline">
                {n.label}
              </Link>
            ))}
            <LogoutButton />
            <span className="ava">N</span>
          </nav>
        </header>
        <main className="flex-1 max-w-[980px] w-full mx-auto px-5 py-7">{children}</main>
      </div>
    </div>
  );
}
