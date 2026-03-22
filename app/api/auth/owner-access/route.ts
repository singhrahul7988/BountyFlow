import { NextResponse } from "next/server";

import { isAllowedOwnerEmail } from "@/lib/auth";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: string } | null;
  const email = body?.email?.trim();

  if (!email) {
    return NextResponse.json({ allowed: false, error: "Email is required." }, { status: 400 });
  }

  return NextResponse.json({ allowed: isAllowedOwnerEmail(email) });
}
