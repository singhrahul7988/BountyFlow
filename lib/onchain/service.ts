import type { SupabaseClient } from "@supabase/supabase-js";

type TreasuryTransactionType = "DEPOSIT" | "PAYOUT" | "YIELD";

function hashToHex(value: string, length = 16) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash).toString(16).padStart(length, "0").slice(0, length);
}

function buildMockTxHash(seed: string) {
  return `0x${hashToHex(`${seed}-tx`, 16)}${hashToHex(`${seed}-tx-2`, 16)}${hashToHex(
    `${seed}-tx-3`,
    16
  )}${hashToHex(`${seed}-tx-4`, 16)}`;
}

function buildMockWallet(seed: string) {
  return `0x${hashToHex(`${seed}-wallet`, 16).toUpperCase()}`;
}

export function getOnchainMode() {
  return process.env.BOUNTYFLOW_ONCHAIN_MODE || "mock";
}

export async function provisionEscrowWallet(input: {
  ownerId: string;
  bountySlug: string;
}) {
  if (getOnchainMode() !== "mock") {
    throw new Error("Real WDK integration is not configured yet. Use mock mode for the demo.");
  }

  return {
    address: buildMockWallet(`${input.ownerId}-${input.bountySlug}`)
  };
}

export async function performTreasuryTransfer(input: {
  ownerId: string;
  bountySlug: string;
  amount: number;
  type: TreasuryTransactionType;
  description: string;
}) {
  if (getOnchainMode() !== "mock") {
    throw new Error("Real treasury transfer integration is not configured yet.");
  }

  return {
    txHash: buildMockTxHash(
      `${input.ownerId}-${input.bountySlug}-${input.type}-${input.amount}-${Date.now()}`
    )
  };
}

export async function insertTreasuryTransaction(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    bountySlug: string;
    amount: number;
    type: TreasuryTransactionType;
    description: string;
    txHash: string;
  }
) {
  const { error } = await supabase.from("demo_treasury_transactions").insert({
    owner_id: input.ownerId,
    bounty_slug: input.bountySlug,
    amount: input.amount,
    type: input.type,
    description: input.description,
    tx_hash: input.txHash
  });

  if (error) {
    throw error;
  }
}

export async function createOwnerNotification(
  supabase: SupabaseClient,
  input: {
    ownerId: string;
    type: "CRITICAL" | "SUBMISSION" | "PAYOUT" | "DISPUTE";
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
  }
) {
  const { error } = await supabase.from("demo_notifications").insert({
    owner_id: input.ownerId,
    type: input.type,
    title: input.title,
    description: input.description,
    unread: true,
    action_label: input.actionLabel ?? null,
    action_href: input.actionHref ?? null
  });

  if (error) {
    throw error;
  }
}
