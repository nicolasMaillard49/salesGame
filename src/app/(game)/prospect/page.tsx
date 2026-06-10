import ProspectGame from "./ProspectGame";
import { getActiveOffer } from "@/lib/offer-server";

export const dynamic = "force-dynamic";

export default async function ProspectPage() {
  const offer = await getActiveOffer();
  return <ProspectGame offer={offer} />;
}
