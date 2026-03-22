"use client";

import { useEffect, useState } from "react";

import { fetchPublicDemoBounties, fetchRemoteDemoState } from "@/lib/demo-api";
import { hasSupabaseEnv } from "@/lib/supabase/config";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";

export function usePublicBountiesSync() {
  const syncRemoteBounties = useDemoDataStore((state) => state.syncRemoteBounties);
  const [hasLoaded, setHasLoaded] = useState(!hasSupabaseEnv());

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      setHasLoaded(true);
      return;
    }

    let cancelled = false;

    fetchPublicDemoBounties()
      .then((items) => {
        if (!cancelled) {
          syncRemoteBounties(items);
          setHasLoaded(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setHasLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [syncRemoteBounties]);

  return hasLoaded;
}

export function useAuthenticatedDemoStateSync(enabled: boolean) {
  const syncRemoteBounties = useDemoDataStore((state) => state.syncRemoteBounties);
  const syncRemoteSubmissions = useDemoDataStore((state) => state.syncRemoteSubmissions);
  const syncRemoteNotifications = useDemoDataStore((state) => state.syncRemoteNotifications);
  const [hasLoaded, setHasLoaded] = useState(!hasSupabaseEnv());

  useEffect(() => {
    if (!enabled || !hasSupabaseEnv()) {
      if (!hasSupabaseEnv()) {
        setHasLoaded(true);
      }
      return;
    }

    let cancelled = false;

    fetchRemoteDemoState()
      .then((payload) => {
        if (cancelled) {
          return;
        }

        syncRemoteBounties(payload.bounties);
        syncRemoteSubmissions({
          adminSubmissions: payload.adminSubmissions,
          researcherSubmissions: payload.researcherSubmissions,
          decisions: payload.decisions
        });
        syncRemoteNotifications(payload.notifications);
        setHasLoaded(true);
      })
      .catch(() => {
        if (!cancelled) {
          setHasLoaded(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, syncRemoteBounties, syncRemoteNotifications, syncRemoteSubmissions]);

  return hasLoaded;
}
