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
import { handleServerError } from "@/lib/server/api-errors";
import { validateBountyDetail } from "@/lib/server/demo-payload-validation";
import {
  parseJsonObjectBody,
  readObject
} from "@/lib/server/request-validation";
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
    return handleServerError(error, { route: "/api/bounties" }, "Unable to load bounties.");
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

  const parsedBody = await parseJsonObjectBody(request, ["bounty"]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const bountyObject = readObject(parsedBody.value, "bounty", [
    "id",
    "slug",
    "title",
    "platform",
    "platformType",
    "platformUrl",
    "shortDescription",
    "description",
    "severity",
    "rewardPool",
    "rewardTiers",
    "submissionCount",
    "resolvedCount",
    "activeCount",
    "escrowBalance",
    "escrowAddress",
    "status",
    "createdAt",
    "tags",
    "acceptedSeverities",
    "acceptedEvidenceTypes",
    "scopeIn",
    "scopeOut",
    "severityDefinitions",
    "rules",
    "recentActivity"
  ]);

  if (!bountyObject.ok) {
    return bountyObject.response;
  }

  const bounty = validateBountyDetail(bountyObject.value);

  if (!bounty.ok) {
    return bounty.response;
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
    .eq("slug", bounty.value.slug)
    .maybeSingle();

  if (existingBountyError) {
    return handleServerError(existingBountyError, { route: "/api/bounties" }, "Unable to create bounty.");
  }

  if (existingBounty?.owner_id && existingBounty.owner_id !== user.id) {
    return rejectUnauthorizedResourceAccess({
      route: "/api/bounties",
      userId: user.id,
      email: user.email ?? null,
      resourceType: "bounty",
      resourceId: bounty.value.slug,
      message: "This bounty belongs to a different owner."
    });
  }

  let escrowWallet;
  let fundingTransfer;

  try {
    escrowWallet = await provisionEscrowWallet({
      ownerId: user.id,
      bountySlug: bounty.value.slug
    });
    fundingTransfer = await performTreasuryTransfer({
      ownerId: user.id,
      bountySlug: bounty.value.slug,
      amount: bounty.value.rewardPool,
      type: "DEPOSIT",
      description: `Owner funded ${bounty.value.title} and armed the escrow wallet.`,
      recipient: escrowWallet.address
    });
  } catch (error) {
    return handleServerError(error, { route: "/api/bounties" }, "Unable to create bounty.");
  }

  const nextBounty: BountyDetail = {
    ...bounty.value,
    escrowAddress: escrowWallet.address,
    recentActivity: [
      {
        id: `${bounty.value.slug}-funded`,
        label: "WDK ESCROW WALLET CREATED AND FUNDED",
        timestamp: "JUST NOW",
        outcome: "ESCROW VERIFIED"
      },
      ...bounty.value.recentActivity.filter((item) => item.id !== `${bounty.value.slug}-funded`)
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
    return handleServerError(error, { route: "/api/bounties" }, "Unable to create bounty.");
  }

  const item = normalizeStoredBounty(data);

  if (!item) {
    return handleServerError(new Error("normalize_failed"), { route: "/api/bounties" }, "Unable to create bounty.");
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
