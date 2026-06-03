import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticated } from "@/lib/auth";
import { getStore } from "@/lib/db";

const ISO = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  if (!(await isAuthenticated()))
    return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const today = String(body?.today ?? "");
  const yesterday = String(body?.yesterday ?? "");
  if (!ISO.test(today) || !ISO.test(yesterday))
    return NextResponse.json({ error: "dates invalides" }, { status: 400 });
  const result = await getStore().recordDaily(today, yesterday);
  return NextResponse.json(result);
}
