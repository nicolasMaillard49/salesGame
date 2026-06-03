import { getObjections } from "@/lib/content";
import { BOSSES } from "@/lib/bosses";
import BossGame from "./BossGame";

export const dynamic = "force-dynamic";

export default function BossPage() {
  return <BossGame bosses={BOSSES} objections={getObjections()} />;
}
