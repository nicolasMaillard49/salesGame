"use client";

import { useEffect } from "react";

/** Ajoute la classe `is-scrolled` au header dès qu'on quitte le haut de page
 *  → la navbar passe d'un fond translucide à un fond opaque. */
export default function NavScroll({ targetId }: { targetId: string }) {
  useEffect(() => {
    const el = document.getElementById(targetId);
    if (!el) return;
    const onScroll = () => el.classList.toggle("is-scrolled", window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [targetId]);
  return null;
}
