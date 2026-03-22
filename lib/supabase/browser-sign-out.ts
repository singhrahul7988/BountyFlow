import type { SupabaseClient } from "@supabase/supabase-js";

function clearStorage(store: Storage) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);

    if (!key) {
      continue;
    }

    if (
      key === "supabase.auth.token" ||
      (key.startsWith("sb-") && key.includes("auth-token"))
    ) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => store.removeItem(key));
}

function clearSupabaseBrowserState() {
  if (typeof window === "undefined") {
    return;
  }

  clearStorage(window.localStorage);
  clearStorage(window.sessionStorage);
}

export async function signOutBrowserSession(supabase: SupabaseClient | null) {
  try {
    await supabase?.auth.signOut({ scope: "global" });
  } catch {
    await supabase?.auth.signOut();
  }

  clearSupabaseBrowserState();

  if (typeof window !== "undefined") {
    window.location.replace("/auth?logged_out=1");
  }
}
