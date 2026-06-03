import Link from "next/link";
import { getScenarios } from "@/lib/content";
import { getStore } from "@/lib/db";
import { unlockedDifficulty } from "@/lib/progression";
import SimGame from "./SimGame";

export const dynamic = "force-dynamic";

export default async function SimPage() {
  const scenarios = getScenarios();
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
    phases: s.phases.length,
    locked: s.difficulty > maxDiff,
  }));
  return <SimGame scenarios={cards} />;
}
