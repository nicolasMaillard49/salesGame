import Link from "next/link";
import { getStore } from "@/lib/db";
import { ALL_SKILLS, SKILL_LABELS, isSkillId, type SkillId } from "@/lib/types";
import PrintButton from "./PrintButton";

export const dynamic = "force-dynamic";

export default async function MaFichePage() {
  const store = getStore();
  const replies = await store.getBestReplies();

  const bySkill = new Map<SkillId, { text: string; count: number }[]>();
  for (const r of replies) {
    if (!isSkillId(r.skill)) continue;
    const arr = bySkill.get(r.skill) ?? [];
    arr.push({ text: r.text, count: r.count });
    bySkill.set(r.skill, arr);
  }
  const orderedSkills = ALL_SKILLS.filter((s) => bySkill.has(s));

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="display text-2xl">Ma fiche perso</h1>
          <p className="text-[var(--ink-soft)] text-sm mt-1">Tes meilleures répliques — celles que tu as validées en jeu. À garder près du téléphone.</p>
        </div>
        <div className="flex gap-2 no-print">
          <Link href="/" className="btn btn-glass">← Hub</Link>
          {orderedSkills.length > 0 && <PrintButton />}
        </div>
      </div>

      {orderedSkills.length === 0 ? (
        <div className="glass p-6">
          <p className="text-[var(--ink-soft)]">Ta fiche est vide pour l’instant. Joue au drill, au simulateur ou au quiz : tes bonnes réponses viennent se ranger ici automatiquement.</p>
          <Link href="/drill" className="btn btn-primary mt-4 inline-flex">S’entraîner</Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {orderedSkills.map((skill) => (
            <section key={skill} className="glass p-5 flex flex-col gap-3">
              <h2 className="display text-base">{SKILL_LABELS[skill]}</h2>
              <ul className="flex flex-col gap-2">
                {bySkill.get(skill)!.slice(0, 4).map((r, i) => (
                  <li key={i} className="text-sm flex gap-2.5 items-start">
                    <span className="mono text-[10px] shrink-0 mt-1 px-1.5 py-0.5 rounded-full bg-[var(--good-wash)] text-[var(--green-deep)]" title="fois validée">×{r.count}</span>
                    <span>« {r.text} »</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
