import Link from "next/link";
import { getStore } from "@/lib/db";
import { getObjections, getQuiz, getScenarios } from "@/lib/content";
import { progressToNextRank, rankForXp, weakSkills } from "@/lib/progression";
import { SKILL_LABELS, type SkillId } from "@/lib/types";

export const dynamic = "force-dynamic";

function MasteryBar({ skill, score, attempts }: { skill: SkillId; score: number; attempts: number }) {
  const pct = Math.round(score * 100);
  const color = score >= 0.7 ? "var(--color-good)" : score >= 0.5 ? "var(--color-ok)" : "var(--color-bad)";
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm w-56 shrink-0 truncate text-[var(--color-muted)]">
        {SKILL_LABELS[skill]}
      </span>
      <div className="flex-1 h-2 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-xs w-14 text-right tabular-nums text-[var(--color-muted)]">
        {pct}% · {attempts}
      </span>
    </div>
  );
}

export default async function HubPage() {
  const store = getStore();
  const { progress, mastery } = await store.getSnapshot();
  const rank = rankForXp(progress.xpTotal);
  const next = progressToNextRank(progress.xpTotal);
  const weak = weakSkills(mastery as Record<string, { score: number; attempts: number }>);
  const attempted = (Object.entries(mastery) as [SkillId, { score: number; attempts: number }][])
    .filter(([, m]) => m.attempts > 0)
    .sort((a, b) => a[1].score - b[1].score);

  const games = [
    { href: "/quiz", title: "Quiz", desc: "Mémorise scripts, ouvertures, étapes & prix.", count: `${getQuiz().length} questions`, emoji: "🧠" },
    { href: "/drill", title: "Drill objections", desc: "Réponds vite et juste aux objections.", count: `${getObjections().length} objections`, emoji: "🛡️" },
    { href: "/sim", title: "Simulateur d'appel", desc: "Mène un appel complet, l'artisan réagit.", count: `${getScenarios().length} scénarios`, emoji: "📞" },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Bandeau progression */}
      <section className="card p-6">
        <div className="flex items-end justify-between flex-wrap gap-4">
          <div>
            <p className="text-[var(--color-muted)] text-sm">Rang actuel</p>
            <h1 className="text-3xl font-bold tracking-tight">{rank.name}</h1>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold tabular-nums text-[var(--color-violet-bright)]">
              {progress.xpTotal} <span className="text-base text-[var(--color-muted)]">XP</span>
            </p>
            {next.next && (
              <p className="text-xs text-[var(--color-muted)]">
                {next.remaining} XP → {next.next}
              </p>
            )}
          </div>
        </div>
        <div className="mt-4 h-2.5 rounded-full bg-[var(--color-surface-2)] overflow-hidden">
          <div
            className="h-full btn-primary rounded-full"
            style={{ width: `${Math.round(next.ratio * 100)}%` }}
          />
        </div>
        {store.backend === "memory" && (
          <p className="mt-3 text-xs text-[var(--color-ok)]">
            ⚠️ Suivi local (Supabase non connecté) — la progression repart à zéro au redémarrage du serveur.
          </p>
        )}
      </section>

      {/* Jeux */}
      <section className="grid sm:grid-cols-3 gap-4">
        {games.map((g) => (
          <Link key={g.href} href={g.href} className="card p-5 hover:border-[var(--color-violet)] transition group">
            <div className="text-2xl">{g.emoji}</div>
            <h2 className="mt-3 font-semibold group-hover:text-[var(--color-violet-bright)] transition">
              {g.title}
            </h2>
            <p className="text-sm text-[var(--color-muted)] mt-1">{g.desc}</p>
            <p className="text-xs text-[var(--color-muted)] mt-3">{g.count}</p>
          </Link>
        ))}
      </section>

      {/* Maîtrise */}
      <section className="card p-6">
        <h2 className="font-semibold mb-1">Maîtrise par compétence</h2>
        {weak.length > 0 && (
          <p className="text-sm text-[var(--color-bad)] mb-4">
            À bosser en priorité : {weak.slice(0, 3).map((s) => SKILL_LABELS[s]).join(" · ")}
          </p>
        )}
        {attempted.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            Joue une partie pour voir ta maîtrise apparaître ici.
          </p>
        ) : (
          <div className="flex flex-col gap-2.5">
            {attempted.map(([skill, m]) => (
              <MasteryBar key={skill} skill={skill} score={m.score} attempts={m.attempts} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
