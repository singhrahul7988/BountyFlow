"use client";

import { createConfig, http, injected } from "wagmi";

import { getConfiguredChain, getConfiguredTransportUrl } from "./chains";

const chain = getConfiguredChain();
const transportUrl = getConfiguredTransportUrl();

export const wagmiConfig = createConfig({
  chains: [chain],
  connectors: [
    injected({
      target: "metaMask"
    })
  ],
  transports: {
    [chain.id]: http(transportUrl)
  }
});
