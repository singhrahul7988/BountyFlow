import { NextResponse } from "next/server";

import { isAllowedOwnerEmail } from "@/lib/auth";
import { parseJsonObjectBody, readRequiredString } from "@/lib/server/request-validation";

export async function POST(request: Request) {
  const parsedBody = await parseJsonObjectBody(request, ["email"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const email = readRequiredString(parsedBody.value, "email", {
    maxLength: 320,
    lowercase: true,
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  });

  if (!email.ok) {
    return NextResponse.json({ allowed: false, error: "Email is required." }, { status: 400 });
  }

  return NextResponse.json({ allowed: isAllowedOwnerEmail(email.value) });
}
