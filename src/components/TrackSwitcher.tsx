"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { OFFER_LABELS, OFFERS, type Offer } from "@/lib/types";
import { setOfferCookie } from "@/lib/client";
import Icon from "@/components/Icon";

// Sélecteur de parcours (Sites Web / Google Ads). Écrit le cookie puis rafraîchit
// les composants serveur pour recharger le bon contenu.
export default function TrackSwitcher({ current }: { current: Offer }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function choose(o: Offer) {
    if (o === current || pending) return;
    setOfferCookie(o);
    startTransition(() => router.refresh());
  }

  return (
    <div className="seg" role="group" aria-label="Parcours de formation" style={{ opacity: pending ? 0.6 : 1 }}>
      {OFFERS.map((o) => {
        const active = o === current;
        const color = o === "ads" ? "#ea4335" : "#00c06a";
        return (
          <button
            key={o}
            type="button"
            onClick={() => choose(o)}
            aria-pressed={active}
            className="seg-btn"
            style={
              active
                ? { background: `${color}1f`, borderColor: `${color}66`, color: "var(--ink)" }
                : { color: "var(--ink-faint)" }
            }
          >
            <Icon name={o === "ads" ? "trendingUp" : "logo"} size={15} />
            {OFFER_LABELS[o]}
          </button>
        );
      })}
    </div>
  );
}
