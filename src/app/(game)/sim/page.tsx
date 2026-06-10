import Link from "next/link";
import { getScenarios } from "@/lib/content";
import { firstClosingIndex, simPhases } from "@/lib/anthropic";
import { getActiveOffer } from "@/lib/offer-server";
import { getStore } from "@/lib/db";
import { unlockedDifficulty } from "@/lib/progression";
import SimGame from "./SimGame";

export const dynamic = "force-dynamic";

export default async function SimPage({ searchParams }: { searchParams: Promise<{ closing?: string }> }) {
  const { closing } = await searchParams;
  const closingOnly = closing != null;
  const offer = await getActiveOffer();
  const scenarios = getScenarios(offer);
  if (scenarios.length === 0) {
    return (
      <div className="card p-6">
        <p>Aucun scénario pour l’instant.</p>
        <Link href="/" className="text-[var(--color-violet-bright)] text-sm">← Hub</Link>
      </div>
    );
  }
  const { progress } = await getStore().getSnapshot();
  const maxDiff = unlockedDifficulty(progress.xpTotal);
  // on n'envoie pas les rubrics/options au client (Haiku les utilise côté serveur)
  const cards = scenarios.map((s) => ({
    id: s.id,
    persona: s.persona,
    difficulty: s.difficulty,
    phases: simPhases(s).length,
    closingStart: firstClosingIndex(s),
    locked: s.difficulty > maxDiff,
  }));
  return <SimGame scenarios={cards} closingOnly={closingOnly} offer={offer} />;
}
