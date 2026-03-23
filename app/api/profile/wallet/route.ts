import { NextResponse } from "next/server";
import { createPublicClient, http, isAddress } from "viem";
import { verifySiweMessage } from "viem/siwe";

import { handleServerError } from "@/lib/server/api-errors";
import { logUnauthorizedAccessAttempt, requireApiRole } from "@/lib/server/authorization";
import {
  parseJsonObjectBody,
  readRequiredNumber,
  readRequiredString
} from "@/lib/server/request-validation";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { getConfiguredChain, getConfiguredDomain, getConfiguredTransportUrl } from "@/lib/web3/chains";

export async function POST(request: Request) {
  if (!hasSupabaseEnv()) {
    return NextResponse.json(
      { error: "Supabase environment variables are not configured." },
      { status: 503 }
    );
  }

  const parsedBody = await parseJsonObjectBody(request, [
    "address",
    "chainId",
    "message",
    "signature"
  ]);

  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  const addressField = readRequiredString(parsedBody.value, "address", { maxLength: 80 });
  const chainIdField = readRequiredNumber(parsedBody.value, "chainId", {
    integer: true,
    min: 1,
    max: 10_000_000
  });
  const messageField = readRequiredString(parsedBody.value, "message", { maxLength: 4000 });
  const signatureField = readRequiredString(parsedBody.value, "signature", { maxLength: 300 });

  if (!addressField.ok) {
    return addressField.response;
  }

  if (!chainIdField.ok) {
    return chainIdField.response;
  }

  if (!messageField.ok) {
    return messageField.response;
  }

  if (!signatureField.ok) {
    return signatureField.response;
  }

  if (!isAddress(addressField.value)) {
    return NextResponse.json({ error: "Invalid wallet address." }, { status: 400 });
  }

  const configuredChainId = getConfiguredChain().id;

  if (chainIdField.value !== configuredChainId) {
    return NextResponse.json({ error: "Unsupported wallet network." }, { status: 400 });
  }

  const address = addressField.value as `0x${string}`;
  const signature = signatureField.value as `0x${string}`;

  const auth = await requireApiRole({
    route: "/api/profile/wallet",
    roles: ["owner", "researcher"]
  });

  if (auth.error) {
    return auth.error;
  }

  const { supabase, user } = auth;

  if (!messageField.value.includes(user.id) || !messageField.value.includes(address)) {
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
    message: messageField.value,
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
      wallet_address: addressField.value
    })
    .eq("id", user.id);

  if (error) {
    return handleServerError(error, { route: "/api/profile/wallet" }, "Unable to link wallet.");
  }

  return NextResponse.json({
    ok: true,
    walletAddress: addressField.value,
    chainId: chainIdField.value
  });
}
