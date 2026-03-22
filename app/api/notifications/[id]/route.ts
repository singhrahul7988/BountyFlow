import { NextResponse } from "next/server";

import { getRoleFromProfile, isAllowedOwnerEmail } from "@/lib/auth";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProfileByUserId } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

async function assertOwner() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { supabase, user: null, error: NextResponse.json({ error: "Authentication required." }, { status: 401 }) };
  }

  const { profile } = await getProfileByUserId(supabase, user.id);

  if (getRoleFromProfile(profile) !== "owner" || !isAllowedOwnerEmail(user.email || "")) {
    return { supabase, user: null, error: NextResponse.json({ error: "Owner access required." }, { status: 403 }) };
  }

  return { supabase, user, error: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const { supabase, user, error } = await assertOwner();

  if (error || !user) {
    return error;
  }

  const body = (await request.json().catch(() => null)) as { unread?: boolean } | null;

  const { error: updateError } = await supabase
    .from("demo_notifications")
    .update({ unread: body?.unread ?? false })
    .eq("id", params.id)
    .eq("owner_id", user.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const { supabase, user, error } = await assertOwner();

  if (error || !user) {
    return error;
  }

  const { error: deleteError } = await supabase
    .from("demo_notifications")
    .delete()
    .eq("id", params.id)
    .eq("owner_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
