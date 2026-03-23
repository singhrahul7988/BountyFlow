"use client";

import { useEffect, useMemo, useState } from "react";
import { createSiweMessage, generateSiweNonce } from "viem/siwe";
import {
  useConnect,
  useConnection,
  useDisconnect,
  useSignMessage,
  useSwitchChain
} from "wagmi";

import { createClient } from "@/lib/supabase/client";
import { getAuthUserFromProfile } from "@/lib/supabase/profiles";
import { useAppStore } from "@/lib/stores/app-store";
import { getConfiguredChainId, getConfiguredDomain } from "@/lib/web3/chains";
import { cn, truncateAddress } from "@/lib/utils";

export function WalletLinkButton({
  className,
  variant = "secondary",
  showHelperText = true,
  showInlineFeedback = true
}: {
  className?: string;
  variant?: "primary" | "secondary";
  showHelperText?: boolean;
  showInlineFeedback?: boolean;
}) {
  const currentUser = useAppStore((state) => state.currentUser);
  const signIn = useAppStore((state) => state.signIn);
  const updateWalletAddress = useAppStore((state) => state.updateWalletAddress);
  const configuredChainId = getConfiguredChainId();
  const [supabase] = useState(() => createClient());
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const { connectors, connectAsync, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, chainId, isConnected } = useConnection();
  const { signMessageAsync, isPending: isSigning } = useSignMessage();
  const { switchChainAsync, isPending: isSwitching } = useSwitchChain();

  const connector = connectors[0];
  const walletIsLinked =
    Boolean(currentUser?.walletLinked) &&
    Boolean(currentUser?.walletAddress) &&
    currentUser?.walletAddress === address;
  const buttonTone =
    variant === "primary" ? "bf-button-primary" : "bf-button-secondary";

  const buttonLabel = useMemo(() => {
    if (!currentUser) {
      return "SIGN IN";
    }

    if (!isConnected || !address) {
      return currentUser.walletLinked ? "UPDATE WALLET" : "CONNECT WALLET";
    }

    if (chainId !== configuredChainId) {
      return "SWITCH NETWORK";
    }

    if (walletIsLinked) {
      return truncateAddress(address);
    }

    return `LINK ${truncateAddress(address)}`;
  }, [address, chainId, configuredChainId, currentUser, isConnected, walletIsLinked]);

  useEffect(() => {
    if (showInlineFeedback || !error || typeof window === "undefined") {
      return;
    }

    window.alert(error);
  }, [error, showInlineFeedback]);

  useEffect(() => {
    if (showInlineFeedback || !notice || typeof window === "undefined") {
      return;
    }

    window.alert(notice);
  }, [notice, showInlineFeedback]);

  async function refreshAuthUser() {
    const {
      data: { user }
    } = await supabase.auth.getUser();
    const mapped = await getAuthUserFromProfile(supabase, user);

    if (mapped) {
      signIn(mapped);
    }
  }

  async function handleClick() {
    setError("");
    setNotice("");

    if (!currentUser) {
      setError("Sign in before linking a wallet.");
      return;
    }

    try {
      let activeAddress = address;
      let activeChainId = chainId;

      if (!isConnected || !activeAddress) {
        if (!connector) {
          setError("No injected wallet connector is available.");
          return;
        }

        const connection = await connectAsync({ connector });
        activeAddress = connection.accounts[0];
        activeChainId = connection.chainId;
      }

      if (!activeAddress) {
        setError("Wallet connection did not return an address.");
        return;
      }

      if (activeChainId !== configuredChainId) {
        const switched = await switchChainAsync({ chainId: configuredChainId });
        activeChainId = switched.id;
      }

      const siweMessage = createSiweMessage({
        address: activeAddress,
        chainId: activeChainId,
        domain: getConfiguredDomain(window.location.origin),
        nonce: generateSiweNonce(),
        statement: `Link this wallet to BountyFlow account ${currentUser.id}.`,
        uri: window.location.origin,
        version: "1"
      });

      setMessage(siweMessage);

      const signature = await signMessageAsync({
        message: siweMessage
      });

      const response = await fetch("/api/profile/wallet", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          address: activeAddress,
          chainId: activeChainId,
          message: siweMessage,
          signature
        })
      });

      const body = (await response.json().catch(() => null)) as
        | { ok?: boolean; error?: string; walletAddress?: string }
        | null;

      if (!response.ok) {
        throw new Error(body?.error || "Wallet link failed.");
      }

      if (body?.walletAddress) {
        updateWalletAddress(body.walletAddress);
      }

      await refreshAuthUser();
      setNotice("Wallet linked successfully.");
    } catch (linkError) {
      setError(linkError instanceof Error ? linkError.message : "Wallet link failed.");
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={
          walletIsLinked
            ? () => {
                disconnect();
                setNotice("Wallet is linked. Connect a different wallet to update it.");
                setError("");
              }
            : handleClick
        }
        disabled={isConnecting || isSigning || isSwitching}
        className={cn(buttonTone, className)}
      >
        {isConnecting || isSigning || isSwitching
          ? "PROCESSING..."
          : walletIsLinked
            ? buttonLabel
            : buttonLabel}
      </button>

      {showInlineFeedback && message && !notice ? (
        <p className="bf-label text-muted">SIWE SIGNATURE REQUEST READY</p>
      ) : null}
      {showInlineFeedback && notice ? <p className="bf-label text-primary">{notice}</p> : null}
      {showInlineFeedback && error ? <p className="bf-label text-error">{error}</p> : null}
      {showInlineFeedback && showHelperText && currentUser && !currentUser.walletLinked ? (
        <p className="bf-label text-muted">LINK A REAL PAYOUT WALLET TO ENABLE LIVE SETTLEMENT</p>
      ) : null}
    </div>
  );
}
