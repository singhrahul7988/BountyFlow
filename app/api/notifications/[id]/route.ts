import { NextResponse } from "next/server";

import { handleServerError } from "@/lib/server/api-errors";
import {
  rejectMissingOwnedResource,
  requireApiRole
} from "@/lib/server/authorization";
import {
  parseJsonObjectBody,
  readBoolean,
  validateIdentifier
} from "@/lib/server/request-validation";
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
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;

  const notificationId = validateIdentifier(id, "id", {
    maxLength: 80,
    pattern: /^[A-Za-z0-9._:-]+$/
  });

  if (!notificationId.ok) {
    return notificationId.response;
  }

  const { supabase, user, error } = await assertOwner();

  if (error || !user) {
    return error;
  }

  const parsedBody = await parseJsonObjectBody(request, ["unread"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const unread = readBoolean(parsedBody.value, "unread");

  if (!unread.ok) {
    return unread.response;
  }

  const { data: existingNotification, error: loadError } = await supabase
    .from("demo_notifications")
    .select("id")
    .eq("id", notificationId.value)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (loadError) {
    return handleServerError(loadError, { route: "/api/notifications/[id]" }, "Unable to update notification.");
  }

  if (!existingNotification) {
    return rejectMissingOwnedResource({
      route: "/api/notifications/[id]",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "notification",
      resourceId: notificationId.value,
      message: "Notification not found."
    });
  }

  const { error: updateError } = await supabase
    .from("demo_notifications")
    .update({ unread: unread.value })
    .eq("id", notificationId.value)
    .eq("owner_id", user.id);

  if (updateError) {
    return handleServerError(updateError, { route: "/api/notifications/[id]" }, "Unable to update notification.");
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const { id } = await params;

  const notificationId = validateIdentifier(id, "id", {
    maxLength: 80,
    pattern: /^[A-Za-z0-9._:-]+$/
  });

  if (!notificationId.ok) {
    return notificationId.response;
  }

  const { supabase, user, error } = await assertOwner();

  if (error || !user) {
    return error;
  }

  const { data: existingNotification, error: loadError } = await supabase
    .from("demo_notifications")
    .select("id")
    .eq("id", notificationId.value)
    .eq("owner_id", user.id)
    .maybeSingle();

  if (loadError) {
    return handleServerError(loadError, { route: "/api/notifications/[id]" }, "Unable to delete notification.");
  }

  if (!existingNotification) {
    return rejectMissingOwnedResource({
      route: "/api/notifications/[id]",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "notification",
      resourceId: notificationId.value,
      message: "Notification not found."
    });
  }

  const { error: deleteError } = await supabase
    .from("demo_notifications")
    .delete()
    .eq("id", notificationId.value)
    .eq("owner_id", user.id);

  if (deleteError) {
    return handleServerError(deleteError, { route: "/api/notifications/[id]" }, "Unable to delete notification.");
  }

  return NextResponse.json({ ok: true });
}
