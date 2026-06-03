import { NextResponse } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/db";

export async function GET() {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const store = getStore();
  const snapshot = await store.getSnapshot();
  return NextResponse.json({ snapshot, backend: store.backend });
}
