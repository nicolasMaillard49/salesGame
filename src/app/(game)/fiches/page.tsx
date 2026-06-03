import Link from "next/link";
import { getFiches } from "@/lib/content";
import FichesBrowser from "./FichesBrowser";

export const revalidate = 3600; // contenu statique : mis en cache 1 h

export default function FichesPage() {
  const fiches = getFiches();
  if (fiches.length === 0) {
    return (
      <div className="glass p-6">
        <p className="text-[var(--ink-soft)]">La bibliothèque est vide pour l’instant.</p>
        <Link href="/" className="mono text-sm text-[var(--green-deep)] mt-2 inline-block">← Hub</Link>
      </div>
    );
  }
  return <FichesBrowser fiches={fiches} />;
}
