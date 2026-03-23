"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  type AdminNotification,
  type AdminNotificationGroup
} from "@/lib/admin-notifications-data";
import {
  dismissRemoteNotification,
  markAllRemoteNotificationsRead,
  markRemoteNotificationRead
} from "@/lib/demo-api";
import { useDemoDataStore } from "@/lib/stores/demo-data-store";

const groupOrder: AdminNotificationGroup[] = ["TODAY", "YESTERDAY", "EARLIER"];

const toneStyles: Record<AdminNotification["type"], string> = {
  CRITICAL: "border-danger bg-surface-high",
  SUBMISSION: "border-indigo bg-surface-high",
  PAYOUT: "border-primary bg-surface-high",
  DISPUTE: "border-amber bg-surface-high"
};

export function AdminNotificationsView() {
  const items = useDemoDataStore((state) => state.notifications);
  const markAllRead = useDemoDataStore((state) => state.markAllNotificationsRead);
  const dismissNotification = useDemoDataStore((state) => state.dismissNotification);
  const markRead = useDemoDataStore((state) => state.markNotificationRead);

  const grouped = useMemo(() => {
    return groupOrder.map((group) => ({
      group,
      items: items.filter((item) => item.group === group)
    }));
  }, [items]);

  const unreadCount = items.filter((item) => item.unread).length;

  async function handleMarkAllRead() {
    markAllRead();
    try {
      await markAllRemoteNotificationsRead();
    } catch {
      // Local state remains the fallback if remote persistence is unavailable.
    }
  }

  async function handleDismiss(id: string) {
    dismissNotification(id);
    try {
      await dismissRemoteNotification(id);
    } catch {
      // Local state remains the fallback if remote persistence is unavailable.
    }
  }

  async function handleMarkRead(id: string) {
    markRead(id);
    try {
      await markRemoteNotificationRead(id);
    } catch {
      // Local state remains the fallback if remote persistence is unavailable.
    }
  }

  return (
    <section className="p-4 md:p-5 xl:p-6">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-2.5">
            <p className="bf-label text-primary">OWNER INBOX</p>
            <h1 className="bf-display text-[1.65rem] leading-none tracking-tightHeading sm:text-[2.2rem]">
              NOTIFICATIONS
            </h1>
            <p className="max-w-3xl text-[0.76rem] leading-6 text-muted">
              Critical scoring alerts, dispute escalations, and treasury events are grouped here
              for fast owner action.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleMarkAllRead()}
            className="bf-button-tertiary self-start text-primary md:self-auto"
          >
            MARK ALL READ
          </button>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <article className="bg-surface-high p-3">
            <p className="bf-label">UNREAD</p>
            <p className="bf-data mt-2 text-[1.12rem] text-primary">{unreadCount}</p>
          </article>
          <article className="bg-surface-high p-3">
            <p className="bf-label">TODAY</p>
            <p className="bf-data mt-2 text-[1.12rem] text-foreground">
              {grouped.find((entry) => entry.group === "TODAY")?.items.length ?? 0}
            </p>
          </article>
          <article className="bg-surface-high p-3">
            <p className="bf-label">OPEN ACTIONS</p>
            <p className="bf-data mt-2 text-[1.12rem] text-amber">
              {items.filter((item) => item.actionHref).length}
            </p>
          </article>
        </div>

        <div className="space-y-6">
          {grouped.map(({ group, items: groupItems }) =>
            groupItems.length ? (
              <section key={group} className="space-y-3">
                <p className="bf-label text-muted">{group}</p>

                <div className="space-y-3">
                  {groupItems.map((item) => (
                    <article
                      key={item.id}
                      className={`relative border-l-[3px] p-3.5 md:p-4 ${
                        item.unread
                          ? toneStyles[item.type]
                          : "border-transparent bg-surface-low"
                      }`}
                    >
                        <button
                          type="button"
                          aria-label={`Dismiss ${item.title}`}
                          onClick={() => void handleDismiss(item.id)}
                          className="absolute right-4 top-4 font-mono text-[0.8rem] text-muted transition-colors duration-100 ease-linear hover:text-foreground"
                        >
                        X
                      </button>

                      <div className="flex flex-col gap-4 pr-10 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <p
                            className={`font-mono text-[0.74rem] uppercase tracking-label ${
                              item.unread ? "text-foreground" : "text-muted"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="max-w-3xl text-[0.72rem] leading-5 text-muted">
                            {item.description}
                          </p>
                          <p className="bf-data text-[0.66rem] text-muted">{item.timestamp}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          {item.actionHref && item.actionLabel ? (
                            <Link
                              href={item.actionHref}
                              onClick={() => void handleMarkRead(item.id)}
                              className="bf-button-tertiary text-primary"
                            >
                              {item.actionLabel}
                            </Link>
                          ) : null}
                          {item.unread ? (
                            <button
                              type="button"
                              onClick={() => void handleMarkRead(item.id)}
                              className="bf-button-secondary text-foreground"
                            >
                              MARK READ
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ) : null
          )}
        </div>
      </div>
    </section>
  );
}
