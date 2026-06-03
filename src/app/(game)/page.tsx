import Link from "next/link";
import { getStore } from "@/lib/db";
import { getObjections, getQuiz, getScenarios } from "@/lib/content";
import { progressToNextRank, rankForXp, weakSkills } from "@/lib/progression";
import { SKILL_LABELS, type SkillId } from "@/lib/types";

export const dynamic = "force-dynamic";

function Arrow() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
      <path d="M13 6l6 6-6 6" />
    </svg>
  );
}

function meterClass(score: number): string {
  return score >= 0.7 ? "m-good" : score >= 0.5 ? "m-mid" : "m-low";
}
function pctColor(score: number): string {
  return score >= 0.7 ? "var(--green-deep)" : score >= 0.5 ? "var(--ok)" : "var(--bad)";
}

export default async function HubPage() {
  const store = getStore();
  const { progress, mastery } = await store.getSnapshot();
  const rank = rankForXp(progress.xpTotal);
  const next = progressToNextRank(progress.xpTotal);
  const weak = new Set(weakSkills(mastery as Record<string, { score: number; attempts: number }>));
  const attempted = (Object.entries(mastery) as [SkillId, { score: number; attempts: number }][])
    .filter(([, m]) => m.attempts > 0)
    .sort((a, b) => a[1].score - b[1].score);

  const games = [
    { href: "/quiz", title: "Quiz", desc: "Mémorise scripts & prix", count: `${getQuiz().length} questions`, emoji: "🧠" },
    { href: "/drill", title: "Drill objections", desc: "Réponds vite et juste", count: `${getObjections().length} objections`, emoji: "🛡️" },
    { href: "/sim", title: "Simulateur d'appel", desc: "Mène un appel complet", count: `${getScenarios().length} scénarios`, emoji: "📞" },
  ];

  return (
    <div className="flex flex-col gap-10">
      {/* Progression */}
      <section className="progress-card">
        <div className="flex items-start justify-between gap-5 flex-wrap relative z-[1]">
          <div className="flex items-center gap-4">
            <span className="rank-hex" aria-hidden="true">
              {rank.name.charAt(0)}
            </span>
            <div>
              <p className="eyebrow">Rang actuel</p>
              <h1 className="display text-3xl sm:text-4xl mt-0.5">{rank.name}</h1>
            </div>
          </div>
          <div className="text-right">
            <div className="rank-xp-big">{progress.xpTotal}</div>
            <div className="eyebrow">XP total</div>
          </div>
        </div>

        <div className="mt-8 relative z-[1]">
          {next.next && (
            <div className="flex justify-between mono text-[13px] mb-2 text-[var(--ink-soft)]">
              <span>{rank.name}</span>
              <span className="font-bold text-[var(--ink)]">{next.next} · {next.remaining + progress.xpTotal} XP</span>
            </div>
          )}
          <div className="xp-bar" role="progressbar" aria-valuenow={progress.xpTotal} aria-valuemin={0}>
            <div className="xp-fill" style={{ width: `${Math.round(next.ratio * 100)}%` }} />
          </div>
          <p className="mt-3 mono text-[13px] text-[var(--ink-soft)]">
            {next.next ? (
              <>Plus que <b className="text-[var(--green-deep)]">{next.remaining} XP</b> pour débloquer le rang <b className="text-[var(--green-deep)]">{next.next}</b>.</>
            ) : (
              <>Rang maximum atteint 🏆</>
            )}
          </p>
        </div>

        {store.backend === "memory" && (
          <p className="mt-4 relative z-[1] text-xs text-[#92590a] bg-[var(--ok-wash)] border border-[#f1d493] rounded-lg px-3 py-2 inline-block">
            ⚠️ Suivi local (Supabase non connecté) — repart à zéro au redémarrage du serveur.
          </p>
        )}
      </section>

      {/* Modes */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="display text-xl">Modes d&apos;entraînement</h2>
          <span className="eyebrow">{games.length} disponibles</span>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {games.map((g) => (
            <Link key={g.href} href={g.href} className="game-card">
              <span className="game-icon" aria-hidden="true">{g.emoji}</span>
              <h3 className="display text-lg mt-5">{g.title}</h3>
              <p className="text-sm text-[var(--ink-soft)] mt-1">{g.desc}</p>
              <span className="mt-auto pt-5 flex items-center justify-between">
                <span className="count-pill">{g.count}</span>
                <span className="w-[34px] h-[34px] rounded-full grid place-items-center bg-[var(--ink)] text-[var(--green)]">
                  <Arrow />
                </span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Maîtrise */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="display text-xl">Maîtrise par compétence</h2>
          <span className="eyebrow">Cycle de vente</span>
        </div>
        <div className="card p-6">
          {attempted.length === 0 ? (
            <p className="text-sm text-[var(--ink-soft)]">
              Joue une partie pour voir ta maîtrise apparaître ici.
            </p>
          ) : (
            <div className="flex flex-col">
              {attempted.map(([skill, m], idx) => {
                const pct = Math.round(m.score * 100);
                return (
                  <div
                    key={skill}
                    className={`flex flex-col gap-2 py-4 ${idx === 0 ? "pt-0" : ""} ${
                      idx < attempted.length - 1 ? "border-b border-[var(--line)]" : "pb-0"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-bold text-[15px] flex items-center gap-3">
                        {SKILL_LABELS[skill]}
                        {weak.has(skill) && <span className="tag-todo">à bosser</span>}
                      </span>
                      <span className="mono font-bold text-[15px]" style={{ color: pctColor(m.score) }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="meter">
                      <i className={meterClass(m.score)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
