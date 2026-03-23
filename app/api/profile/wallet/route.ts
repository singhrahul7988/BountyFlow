import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { verifySiweMessage } from "viem/siwe";

import { logUnauthorizedAccessAttempt, requireApiRole } from "@/lib/server/authorization";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getConfiguredChain, getConfiguredDomain, getConfiguredTransportUrl } from "@/lib/web3/chains";

type WalletLinkBody = {
  address?: string;
  chainId?: number;
  message?: string;
  signature?: string;
};

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => null)) as WalletLinkBody | null;

  if (!body?.address || !body.message || !body.signature || !body.chainId) {
    return NextResponse.json({ error: "Wallet link payload is incomplete." }, { status: 400 });
  }

  if (!isAddress(body.address)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const address = body.address as `0x${string}`;
  const signature = body.signature as `0x${string}`;

  const auth = await requireApiRole({
    route: "/api/profile/wallet",
    roles: ["owner", "researcher"]
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  if (!body.message.includes(user.id)) {
    logUnauthorizedAccessAttempt({
      route: "/api/profile/wallet",
      reason: "wallet_message_user_scope_mismatch",
      status: 400,
      userId: user.id,
      email: user.email ?? null,
      resourceType: "profile",
      resourceId: user.id
    });

    return NextResponse.json(
      { error: "Wallet signature is not scoped to the current user." },
      { status: 400 }
    );
  }

  const chain = getConfiguredChain();
  const publicClient = createPublicClient({
    chain,
    transport: http(getConfiguredTransportUrl())
  });
  const domain = getConfiguredDomain(request.url);

  const valid = await verifySiweMessage(publicClient, {
    address,
    domain,
    message: body.message,
    signature
  });

  if (!valid) {
    logUnauthorizedAccessAttempt({
      route: "/api/profile/wallet",
      reason: "wallet_signature_verification_failed",
      status: 400,
      userId: user.id,
      email: user.email ?? null,
      resourceType: "profile",
      resourceId: user.id
    });

    return NextResponse.json({ error: "Wallet signature verification failed." }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      wallet_address: body.address
    })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    walletAddress: body.address,
    chainId: body.chainId
  });
}
