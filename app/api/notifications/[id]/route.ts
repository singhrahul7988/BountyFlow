import { NextResponse } from "next/server";

import {
  rejectMissingOwnedResource,
  requireApiRole
} from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";

async function assertOwner() {
  return requireApiRole({
    route: "/api/notifications/[id]",
    roles: ["owner"],
    requireAllowedOwnerEmail: true
  });
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
  const { data: existingNotification, error: loadError } = await supabase
    .from("demo_notifications")
    .select("id")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  if (!existingNotification) {
    return rejectMissingOwnedResource({
      route: "/api/notifications/[id]",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "notification",
      resourceId: params.id,
      message: "Notification not found."
    });
  }

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

  const { data: existingNotification, error: loadError } = await supabase
    .from("demo_notifications")
    .select("id")
    .eq("id", params.id)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json({ error: loadError.message }, { status: 500 });
  }

  if (!existingNotification) {
    return rejectMissingOwnedResource({
      route: "/api/notifications/[id]",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "notification",
      resourceId: params.id,
      message: "Notification not found."
    });
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
