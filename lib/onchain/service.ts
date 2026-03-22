import type { SupabaseClient } from "@supabase/supabase-js";

import { getConfiguredTransportUrl } from "@/lib/web3/chains";

type TreasuryTransactionType = "DEPOSIT" | "PAYOUT" | "YIELD";

type TreasuryTransferInput = {
  ownerId: string;
  bountySlug: string;
  amount: number;
  type: TreasuryTransactionType;
  description: string;
  recipient?: string;
};

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

function toBaseUnits(amount: number, decimals: number) {
  const factor = 10 ** decimals;
  return BigInt(Math.round(amount * factor));
}

function getEscrowAccountIndex(ownerId: string, bountySlug: string) {
  const value = Number.parseInt(hashToHex(`${ownerId}-${bountySlug}`, 8), 16);
  return (value % 5000) + 1;
}

type LiveOnchainConfig = {
  seedPhrase: string;
  rpcUrl: string;
  usdtTokenAddress: string;
  usdtDecimals: number;
  transferMaxFee?: bigint;
  treasuryRootAccountIndex: number;
  aaveEnabled: boolean;
};

function getLiveOnchainConfig(): LiveOnchainConfig {
  const seedPhrase = process.env.WDK_TREASURY_SEED_PHRASE || "";
  const rpcUrl = process.env.WDK_RPC_URL || getConfiguredTransportUrl();
  const usdtTokenAddress = process.env.WDK_USDT_TOKEN_ADDRESS || "";
  const usdtDecimals = Number(process.env.WDK_USDT_DECIMALS || "6");
  const treasuryRootAccountIndex = Number(process.env.WDK_TREASURY_ACCOUNT_INDEX || "0");
  const maxFeeRaw = process.env.WDK_TRANSFER_MAX_FEE_WEI || "";

  if (!seedPhrase) {
    throw new Error("WDK_TREASURY_SEED_PHRASE is required for live on-chain mode.");
  }

  if (!rpcUrl) {
    throw new Error("WDK_RPC_URL or NEXT_PUBLIC_RPC_URL is required for live on-chain mode.");
  }

  if (!usdtTokenAddress) {
    throw new Error("WDK_USDT_TOKEN_ADDRESS is required for live treasury transfers.");
  }

  return {
    seedPhrase,
    rpcUrl,
    usdtTokenAddress,
    usdtDecimals,
    transferMaxFee: maxFeeRaw ? BigInt(maxFeeRaw) : undefined,
    treasuryRootAccountIndex,
    aaveEnabled: process.env.WDK_AAVE_ENABLED === "true"
  };
}

async function getWalletManager() {
  const config = getLiveOnchainConfig();
  const walletModule = await import("@tetherto/wdk-wallet-evm");
  const WalletManagerEvm = walletModule.default;

  return new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
    transferMaxFee: config.transferMaxFee
  });
}

async function getEscrowAccount(ownerId: string, bountySlug: string) {
  const wallet = await getWalletManager();
  const index = getEscrowAccountIndex(ownerId, bountySlug);
  return wallet.getAccount(index);
}

async function getTreasuryRootAccount() {
  const wallet = await getWalletManager();
  const config = getLiveOnchainConfig();
  return wallet.getAccount(config.treasuryRootAccountIndex);
}

async function runLiveTreasuryTransfer(input: TreasuryTransferInput) {
  const config = getLiveOnchainConfig();
  const amount = toBaseUnits(input.amount, config.usdtDecimals);

  if (input.type === "DEPOSIT") {
    const treasuryAccount = await getTreasuryRootAccount();
    const escrowAccount = await getEscrowAccount(input.ownerId, input.bountySlug);
    const escrowAddress = input.recipient || (await escrowAccount.getAddress());
    const result = await treasuryAccount.transfer({
      token: config.usdtTokenAddress,
      recipient: escrowAddress,
      amount
    });

    return {
      txHash: result.hash
    };
  }

  if (input.type === "PAYOUT") {
    if (!input.recipient) {
      throw new Error("A payout recipient wallet address is required in live mode.");
    }

    const escrowAccount = await getEscrowAccount(input.ownerId, input.bountySlug);

    if (config.aaveEnabled) {
      try {
        const { default: AaveProtocolEvm } = await import(
          "@tetherto/wdk-protocol-lending-aave-evm"
        );
        const aave = new AaveProtocolEvm(escrowAccount);
        await aave.withdraw({
          token: config.usdtTokenAddress,
          amount
        });
      } catch {
        // If the treasury is not supplied into Aave, continue with direct token transfer.
      }
    }

    const result = await escrowAccount.transfer({
      token: config.usdtTokenAddress,
      recipient: input.recipient,
      amount
    });

    return {
      txHash: result.hash
    };
  }

  if (input.type === "YIELD") {
    if (!config.aaveEnabled) {
      throw new Error("Set WDK_AAVE_ENABLED=true before executing live treasury yield actions.");
    }

    const escrowAccount = await getEscrowAccount(input.ownerId, input.bountySlug);
    const { default: AaveProtocolEvm } = await import("@tetherto/wdk-protocol-lending-aave-evm");
    const aave = new AaveProtocolEvm(escrowAccount);

    if (input.amount >= 0) {
      const result = await aave.supply({
        token: config.usdtTokenAddress,
        amount
      });

      return {
        txHash: result.hash
      };
    }

    const result = await aave.withdraw({
      token: config.usdtTokenAddress,
      amount: toBaseUnits(Math.abs(input.amount), config.usdtDecimals)
    });

    return {
      txHash: result.hash
    };
  }

  throw new Error(`Unsupported treasury transfer type: ${input.type}`);
}

export function getOnchainMode() {
  return process.env.BOUNTYFLOW_ONCHAIN_MODE || "mock";
}

export async function provisionEscrowWallet(input: {
  ownerId: string;
  bountySlug: string;
}) {
  if (getOnchainMode() === "mock") {
    return {
      address: buildMockWallet(`${input.ownerId}-${input.bountySlug}`)
    };
  }

  const escrowAccount = await getEscrowAccount(input.ownerId, input.bountySlug);

  return {
    address: await escrowAccount.getAddress()
  };
}

export async function performTreasuryTransfer(input: TreasuryTransferInput) {
  if (getOnchainMode() === "mock") {
    return {
      txHash: buildMockTxHash(
        `${input.ownerId}-${input.bountySlug}-${input.type}-${input.amount}-${Date.now()}`
      )
    };
  }

  return runLiveTreasuryTransfer(input);
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
