import { NextResponse } from "next/server";

import { getRoleFromProfile, isAllowedOwnerEmail } from "@/lib/auth";
import { normalizeStoredBounty } from "@/lib/demo-persistence";
import type { BountyDetail } from "@/lib/bounty-data";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getProfileByUserId } from "@/lib/supabase/profiles";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!hasSupabaseEnv()) {
    return NextResponse.json({ items: [] satisfies BountyDetail[] });
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from("demo_bounties")
    .select("slug, payload")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ items: [], error: error.message }, { status: 500 });
  }

  const items = (data ?? [])
    .map((row) => normalizeStoredBounty(row))
    .filter((item): item is BountyDetail => Boolean(item));

  return NextResponse.json({ items });
}

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as { bounty?: BountyDetail } | null;
  const bounty = body?.bounty;

  if (!bounty) {
    return NextResponse.json({ error: "Bounty payload is required." }, { status: 400 });
  }

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const { profile } = await getProfileByUserId(supabase, user.id);
  const role = getRoleFromProfile(profile);

  if (role !== "owner" || !isAllowedOwnerEmail(user.email || "")) {
    return NextResponse.json({ error: "Owner access required." }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("demo_bounties")
    .upsert(
      {
        owner_id: user.id,
        slug: bounty.slug,
        title: bounty.title,
        payload: bounty
      },
      { onConflict: "slug" }
    )
    .select("slug, payload")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const item = normalizeStoredBounty(data);

  if (!item) {
    return NextResponse.json({ error: "Failed to normalize stored bounty." }, { status: 500 });
  }

  return NextResponse.json({ item });
}
