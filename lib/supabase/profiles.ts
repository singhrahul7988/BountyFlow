import type { SupabaseClient, User } from "@supabase/supabase-js";

import { mapSupabaseUser, type UserProfile } from "@/lib/auth";

type ProfileClient = SupabaseClient;

export async function getProfileByUserId(client: ProfileClient, userId: string) {
  const { data, error } = await client
    .from("profiles")
    .select("id, email, full_name, role, wallet_address")
    .eq("id", userId)
    .maybeSingle();

  return { profile: (data as UserProfile | null) ?? null, error };
}

export async function getAuthUserFromProfile(client: ProfileClient, user: User | null | undefined) {
  if (!user) {
    return null;
  }

  const { profile, error } = await getProfileByUserId(client, user.id);

  if (error) {
    return null;
  }

  return mapSupabaseUser(user, profile);
}
