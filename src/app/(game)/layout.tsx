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

export default async function GameLayout({ children }: { children: React.ReactNode }) {
  if (!(await isAuthenticated())) redirect("/login");

  return (
    <div className="flex-1 flex flex-col">
      <header className="border-b border-[var(--color-border)] sticky top-0 z-10 bg-[color-mix(in_srgb,var(--color-bg)_85%,transparent)] backdrop-blur">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold tracking-tight">
            Sales<span className="text-[var(--color-violet-bright)]">Game</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-[var(--color-muted)] hover:text-[var(--color-fg)] transition"
              >
                {n.label}
              </Link>
            ))}
            <LogoutButton />
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-5xl w-full mx-auto px-5 py-8">{children}</main>
    </div>
  );
}
