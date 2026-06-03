import Link from "next/link";
import { getStore } from "@/lib/db";
import { getDailyObjection, getObjections, getQuiz, getScenarios } from "@/lib/content";
import { RANKS, progressToNextRank, rankForXp, weakSkills } from "@/lib/progression";
import { SKILL_LABELS, type SkillId } from "@/lib/types";
import Icon, { type IconName } from "@/components/Icon";
import MasterySection, { type MasteryRow } from "@/components/MasterySection";

export const dynamic = "force-dynamic";

const ROMAN = ["I", "II", "III", "IV", "V"];

function Ring({ ratio }: { ratio: number }) {
  const r = 58;
  const c = 2 * Math.PI * r;
  return (
    <svg width="132" height="132" viewBox="0 0 132 132" style={{ transform: "rotate(-90deg)" }}>
      <circle cx="66" cy="66" r={r} fill="none" stroke="rgba(7,20,14,.08)" strokeWidth="11" />
      <circle cx="66" cy="66" r={r} fill="none" stroke="url(#ringG)" strokeWidth="11" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - Math.max(0.04, ratio))} />
      <defs>
        <linearGradient id="ringG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#19e487" />
          <stop offset="1" stopColor="#028a55" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export default async function HubPage() {
  const store = getStore();
  const { progress, mastery } = await store.getSnapshot();
  const rank = rankForXp(progress.xpTotal);
  const rankIdx = RANKS.findIndex((r) => r.name === rank.name);
  const next = progressToNextRank(progress.xpTotal);
  const weak = new Set(weakSkills(mastery as Record<string, { score: number; attempts: number }>));

  const rows: MasteryRow[] = (Object.entries(mastery) as [SkillId, { score: number; attempts: number }][])
    .map(([skill, m]) => ({ skill, label: SKILL_LABELS[skill], score: m.score, attempts: m.attempts, weak: weak.has(skill) }))
    .sort((a, b) => a.score - b.score);

  // Teaser conversation (carte "reprends ton appel")
  const objs = getObjections();
  const teaser = objs.find((o) => o.id === "obj_bouche_a_oreille") ?? objs[0];
  const teaserGood = teaser?.options.find((o) => o.quality === "good");

  const today = new Date().toISOString().slice(0, 10);
  const daily = getDailyObjection(today);
  const dailyDone = progress.lastDay === today;

  const modes: { href: string; title: string; desc: string; count: string; icon: IconName }[] = [
    { href: "/quiz", title: "Quiz", desc: "Mémorise scripts & prix", count: `${getQuiz().length} questions`, icon: "brain" },
    { href: "/drill", title: "Drill objections", desc: "Réponds vite et juste", count: `${objs.length} objections`, icon: "shield" },
    { href: "/sim", title: "Simulateur d'appel", desc: "Mène un appel complet", count: `${getScenarios().length} scénarios`, icon: "phone" },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* Suivi mémoire */}
      {store.backend === "memory" && (
        <p className="mono text-[11px] text-[#9a6a00] bg-[var(--ok-wash)] border border-[rgba(232,163,23,.3)] rounded-xl px-3 py-2">
          Suivi local (Supabase non connecté) — la progression repart à zéro au redémarrage.
        </p>
      )}

      {/* HERO + CONVERSATION (2 colonnes sur desktop) */}
      <div className="grid lg:grid-cols-2 gap-[18px] items-stretch">
      {/* HERO */}
      <section className="glass hero reveal" style={{ animationDelay: "0.05s" }}>
        <div className="ring-wrap">
          <Ring ratio={next.ratio} />
          <div className="ring-center">
            <div>
              <div className="display text-3xl">{ROMAN[rankIdx] ?? "I"}</div>
              <div className="eyebrow mt-1">Niveau</div>
            </div>
          </div>
        </div>
        <div className="flex-1 min-w-[200px] relative z-[1]">
          <p className="eyebrow">Rang actuel</p>
          <h1 className="display text-[clamp(30px,5vw,42px)]">{rank.name}</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-2">
            {next.next ? (
              <>Plus que <b className="text-[var(--green-deep)]">{next.remaining} XP</b> pour atteindre <b>{next.next}</b>.</>
            ) : (
              <>Rang maximum atteint.</>
            )}
          </p>
          <p className="flex items-baseline gap-2 mt-3.5">
            <b className="mono text-[26px] text-[var(--green-deep)]">{progress.xpTotal}</b>
            {next.next && <small className="mono text-[12px] text-[var(--ink-faint)]">/ {progress.xpTotal + next.remaining} XP</small>}
          </p>
        </div>
      </section>

      {/* CONVERSATION FEATURE */}
      {teaser && teaserGood && (
        <section className="glass reveal !p-0 overflow-hidden flex flex-col" style={{ animationDelay: "0.12s" }}>
          <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-[var(--glass-edge)]">
            <span className="flex items-center gap-2.5 display text-base">
              <Icon name="chat" size={18} className="text-[var(--green-deep)]" />
              Entraîne-toi sur un appel
            </span>
            <span className="phase-dots"><i className="on" /><i className="on" /><i /><i /><i /></span>
          </div>
          <div className="px-[22px] py-5 flex flex-col justify-center gap-3 flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,.25),transparent)]">
            <div className="convo-msg convo-them">
              <span className="convo-who"><Icon name="worker" size={16} /></span>
              <div className="convo-body"><span className="block mono text-[9px] tracking-[.14em] uppercase opacity-60 mb-0.5">Artisan</span>{teaser.artisanLine}</div>
            </div>
            <div className="convo-msg convo-me">
              <span className="convo-who" />
              <div className="convo-body"><span className="block mono text-[9px] tracking-[.14em] uppercase opacity-70 mb-0.5">Bonne réponse</span>{teaserGood.text}</div>
            </div>
          </div>
          <div className="flex items-center justify-between px-[22px] py-4 gap-3 flex-wrap">
            <span className="mono text-[12px] text-[var(--ink-faint)]">7 phases · l&apos;artisan réagit en live</span>
            <Link href="/sim" className="btn btn-primary">Lancer un appel <Icon name="arrowRight" size={16} strokeWidth={2.5} /></Link>
          </div>
        </section>
      )}
      </div>

      {/* DÉFI DU JOUR */}
      {daily && (
        <Link href="/quotidien" className="glass mode reveal !flex flex-row items-center gap-4" style={{ animationDelay: "0.16s" }}>
          <span className="mode-ic" style={{ color: "var(--bad)", background: "linear-gradient(135deg, rgba(255,93,108,.16), rgba(255,157,46,.1))", borderColor: "rgba(255,93,108,.25)" }}>
            <Icon name="flame" size={24} />
          </span>
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="display text-lg">Défi du jour</h3>
              {progress.streak > 0 && (
                <span className="combo-badge" style={{ fontSize: "12px", padding: "4px 10px" }}>
                  <Icon name="flame" size={12} /> {progress.streak} j
                </span>
              )}
            </div>
            <p className="text-[var(--ink-soft)] text-[13.5px] mt-0.5">
              {dailyDone ? "Relevé aujourd'hui — reviens demain pour entretenir ta série." : `Relève l'objection du jour : ${SKILL_LABELS[daily.id]}.`}
            </p>
          </div>
          <span className="mono text-[12px] shrink-0" style={{ color: dailyDone ? "var(--green-deep)" : "var(--ink-faint)" }}>
            {dailyDone ? "✓ Fait" : "Relever →"}
          </span>
        </Link>
      )}

      {/* MODES */}
      <section className="grid sm:grid-cols-3 gap-3.5 reveal" style={{ animationDelay: "0.18s" }}>
        {modes.map((m) => (
          <Link key={m.href} href={m.href} className="glass mode">
            <span className="mode-ic"><Icon name={m.icon} size={24} /></span>
            <h3 className="display text-lg mt-4">{m.title}</h3>
            <p className="text-[var(--ink-soft)] text-[13.5px] mt-1">{m.desc}</p>
            <span className="mt-[18px] flex items-center justify-between">
              <span className="mono text-[12px] text-[var(--green-deep)] font-semibold">{m.count}</span>
              <span className="mode-arr"><Icon name="arrowRight" size={16} strokeWidth={2.5} /></span>
            </span>
          </Link>
        ))}
      </section>

      {/* MAÎTRISE */}
      <MasterySection rows={rows} />

      {/* BIBLIOTHÈQUE */}
      <Link href="/fiches" className="glass mode reveal flex-row items-center gap-4 !flex" style={{ animationDelay: "0.3s" }}>
        <span className="mode-ic"><Icon name="book" size={24} /></span>
        <div className="flex-1">
          <h3 className="display text-lg">Bibliothèque de fiches</h3>
          <p className="text-[var(--ink-soft)] text-[13.5px] mt-0.5">Tous les scripts, techniques et réponses aux objections — à réviser entre deux parties.</p>
        </div>
        <span className="mode-arr"><Icon name="arrowRight" size={18} strokeWidth={2.5} /></span>
      </Link>
    </div>
  );
}
