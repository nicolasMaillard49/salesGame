import Link from "next/link";
import { getObjections } from "@/lib/content";
import DrillGame from "./DrillGame";

export const dynamic = "force-dynamic";

export default function DrillPage() {
  const items = getObjections();
  if (items.length === 0) {
    return (
      <div className="card p-6">
        <p>Aucune objection pour l’instant.</p>
        <Link href="/" className="text-[var(--color-violet-bright)] text-sm">← Hub</Link>
      </div>
    );
  }
  return <DrillGame items={items} />;
}
