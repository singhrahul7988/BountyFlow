import type { Chain } from "viem";
import {
  arbitrum,
  base,
  mainnet,
  optimism,
  polygon,
  polygonAmoy,
  sepolia
} from "wagmi/chains";

const supportedChains: Record<number, Chain> = {
  [mainnet.id]: mainnet,
  [sepolia.id]: sepolia,
  [polygon.id]: polygon,
  [polygonAmoy.id]: polygonAmoy,
  [arbitrum.id]: arbitrum,
  [optimism.id]: optimism,
  [base.id]: base
};

export function getConfiguredChainId() {
  const raw = process.env.NEXT_PUBLIC_CHAIN_ID || process.env.WDK_CHAIN_ID || "";
  const value = Number(raw);
  return Number.isInteger(value) ? value : polygonAmoy.id;
}

export function getConfiguredChain() {
  return supportedChains[getConfiguredChainId()] ?? polygonAmoy;
}

export function getConfiguredRpcUrl() {
  return process.env.NEXT_PUBLIC_RPC_URL || process.env.WDK_RPC_URL || "";
}

export function getConfiguredTransportUrl() {
  const chain = getConfiguredChain();
  return getConfiguredRpcUrl() || chain.rpcUrls.default.http[0] || "";
}

export function getConfiguredDomain(origin?: string) {
  if (origin) {
    return new URL(origin).host;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";

  if (appUrl) {
    return new URL(appUrl).host;
  }

  return "localhost:3000";
}
