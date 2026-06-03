import Link from "next/link";
import { getObjections } from "@/lib/content";
import { isSkillId } from "@/lib/types";
import DrillGame from "./DrillGame";

export const dynamic = "force-dynamic";

export default async function DrillPage({ searchParams }: { searchParams: Promise<{ skill?: string }> }) {
  const { skill } = await searchParams;
  let items = getObjections();
  if (skill && isSkillId(skill)) {
    const filtered = items.filter((o) => o.id === skill);
    if (filtered.length > 0) items = filtered;
  }
  if (items.length === 0) {
    return (
      <div className="glass p-6">
        <p>Aucune objection pour l’instant.</p>
        <Link href="/" className="mono text-sm text-[var(--green-deep)]">← Hub</Link>
      </div>
    );
  }
  return <DrillGame items={items} />;
}
