"use client";

import { useRouter } from "next/navigation";

export default function LogoutButton() {
  const router = useRouter();
  async function logout() {
    await fetch("/api/auth", { method: "DELETE" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <button
      onClick={logout}
      className="mono text-xs text-[var(--ink-faint)] hover:text-[var(--ink)] transition"
    >
      Déconnexion
    </button>
  );
}
