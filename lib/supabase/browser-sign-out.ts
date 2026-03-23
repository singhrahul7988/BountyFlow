function clearStorage(store: Storage) {
  const keysToRemove: string[] = [];

  for (let index = 0; index < store.length; index += 1) {
    const key = store.key(index);

    if (!key) {
      continue;
    }

    if (key === "supabase.auth.token" || (key.startsWith("sb-") && key.includes("auth-token"))) {
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

export async function signOutBrowserSession() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
      cache: "no-store"
    });
  } catch {
    // Keep local cleanup and redirect behavior even if the network request fails.
  }

  clearSupabaseBrowserState();

  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("bf-auth-refresh"));
    window.location.replace("/auth?logged_out=1");
  }
}
