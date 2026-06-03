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
      className="text-sm text-[var(--color-muted)] hover:text-[var(--color-fg)] transition"
    >
      Déconnexion
    </button>
  );
}
