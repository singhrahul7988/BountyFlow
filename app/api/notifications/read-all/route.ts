import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";

export async function POST() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const auth = await requireApiRole({
    route: "/api/notifications/read-all",
    roles: ["owner"],
    requireAllowedOwnerEmail: true
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  const { error } = await supabase
    .from("demo_notifications")
    .update({ unread: false })
    .eq("owner_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
