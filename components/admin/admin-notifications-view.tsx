"use client";

import Link from "next/link";
import { useMemo } from "react";

import {
  type AdminNotification,
  type AdminNotificationGroup
} from "@/lib/admin-notifications-data";
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

  return (
    <section className="p-6 md:p-8 xl:p-10">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-4">
            <p className="bf-label text-primary">OWNER INBOX</p>
            <h1 className="bf-display text-[2.7rem] leading-none tracking-tightHeading sm:text-[3.9rem]">
              NOTIFICATIONS
            </h1>
            <p className="max-w-3xl text-[0.95rem] leading-8 text-muted">
              Critical scoring alerts, dispute escalations, and treasury events are grouped here
              for fast owner action.
            </p>
          </div>

          <button
            type="button"
            onClick={markAllRead}
            className="bf-button-tertiary self-start text-primary md:self-auto"
          >
            MARK ALL READ
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <article className="bg-surface-high p-5">
            <p className="bf-label">UNREAD</p>
            <p className="bf-data mt-3 text-[1.75rem] text-primary">{unreadCount}</p>
          </article>
          <article className="bg-surface-high p-5">
            <p className="bf-label">TODAY</p>
            <p className="bf-data mt-3 text-[1.75rem] text-foreground">
              {grouped.find((entry) => entry.group === "TODAY")?.items.length ?? 0}
            </p>
          </article>
          <article className="bg-surface-high p-5">
            <p className="bf-label">OPEN ACTIONS</p>
            <p className="bf-data mt-3 text-[1.75rem] text-amber">
              {items.filter((item) => item.actionHref).length}
            </p>
          </article>
        </div>

        <div className="space-y-10">
          {grouped.map(({ group, items: groupItems }) =>
            groupItems.length ? (
              <section key={group} className="space-y-4">
                <p className="bf-label text-muted">{group}</p>

                <div className="space-y-4">
                  {groupItems.map((item) => (
                    <article
                      key={item.id}
                      className={`relative border-l-[3px] p-5 md:p-6 ${
                        item.unread
                          ? toneStyles[item.type]
                          : "border-transparent bg-surface-low"
                      }`}
                    >
                      <button
                        type="button"
                        aria-label={`Dismiss ${item.title}`}
                        onClick={() => dismissNotification(item.id)}
                        className="absolute right-5 top-5 font-mono text-sm text-muted transition-colors duration-100 ease-linear hover:text-foreground"
                      >
                        X
                      </button>

                      <div className="flex flex-col gap-4 pr-10 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <p
                            className={`font-mono text-[0.86rem] uppercase tracking-label ${
                              item.unread ? "text-foreground" : "text-muted"
                            }`}
                          >
                            {item.title}
                          </p>
                          <p className="max-w-3xl text-[0.86rem] leading-7 text-muted">
                            {item.description}
                          </p>
                          <p className="bf-data text-[0.72rem] text-muted">{item.timestamp}</p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">
                          {item.actionHref && item.actionLabel ? (
                            <Link
                              href={item.actionHref}
                              onClick={() => markRead(item.id)}
                              className="bf-button-tertiary text-primary"
                            >
                              {item.actionLabel}
                            </Link>
                          ) : null}
                          {item.unread ? (
                            <button
                              type="button"
                              onClick={() => markRead(item.id)}
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
