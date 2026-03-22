import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { verifySiweMessage } from "viem/siwe";

import { hasSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (!body.message.includes(user.id)) {
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
