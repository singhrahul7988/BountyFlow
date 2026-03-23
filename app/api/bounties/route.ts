import { NextResponse } from "next/server";

import { normalizeStoredBounty } from "@/lib/demo-persistence";
import type { BountyDetail } from "@/lib/bounty-data";
import {
  createOwnerNotification,
  getOnchainMode,
  insertTreasuryTransaction,
  performTreasuryTransfer,
  provisionEscrowWallet
} from "@/lib/onchain/service";
import {
  rejectUnauthorizedResourceAccess,
  requireApiRole
} from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";
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

  const auth = await requireApiRole({
    route: "/api/bounties",
    roles: ["owner"],
    requireAllowedOwnerEmail: true
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  const { data: existingBounty, error: existingBountyError } = await supabase
    .from("demo_bounties")
    .select("owner_id")
    .eq("slug", bounty.slug)
    .maybeSingle();

  if (existingBountyError) {
    return NextResponse.json({ error: existingBountyError.message }, { status: 500 });
  }

  if (existingBounty?.owner_id && existingBounty.owner_id !== user.id) {
    return rejectUnauthorizedResourceAccess({
      route: "/api/bounties",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "bounty",
      resourceId: bounty.slug,
      message: "This bounty belongs to a different owner."
    });
  }

  const escrowWallet = await provisionEscrowWallet({
    ownerId: user.id,
    bountySlug: bounty.slug
  });
  const fundingTransfer = await performTreasuryTransfer({
    ownerId: user.id,
    bountySlug: bounty.slug,
    amount: bounty.rewardPool,
    type: "DEPOSIT",
    description: `Owner funded ${bounty.title} and armed the escrow wallet.`,
    recipient: escrowWallet.address
  });
  const nextBounty = {
    ...bounty,
    escrowAddress: escrowWallet.address,
    recentActivity: [
      {
        id: `${bounty.slug}-funded`,
        label: "WDK ESCROW WALLET CREATED AND FUNDED",
        timestamp: "JUST NOW",
        outcome: "ESCROW VERIFIED"
      },
      ...bounty.recentActivity.filter((item) => item.id !== `${bounty.slug}-funded`)
    ]
  };

  const { data, error } = await supabase
    .from("demo_bounties")
    .upsert(
      {
        owner_id: user.id,
        slug: nextBounty.slug,
        title: nextBounty.title,
        payload: nextBounty
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

  try {
    await insertTreasuryTransaction(supabase, {
      ownerId: user.id,
      bountySlug: nextBounty.slug,
      amount: nextBounty.rewardPool,
      type: "DEPOSIT",
      description: `Escrow funded for ${nextBounty.title}.`,
      txHash: fundingTransfer.txHash
    });

    await createOwnerNotification(supabase, {
      ownerId: user.id,
      type: "PAYOUT",
      title: `${nextBounty.title} escrow funded`,
      description:
        getOnchainMode() === "live"
          ? "The live on-chain funding flow completed and treasury tracking is now live."
          : "The mock on-chain funding flow completed and treasury tracking is now live.",
      actionLabel: "VIEW TREASURY ->",
      actionHref: "/admin/treasury"
    });
  } catch {
    // Core bounty creation should still succeed even if optional ledger tables are not ready yet.
  }

  return NextResponse.json({ item });
}
