export type AdminNotificationGroup = "TODAY" | "YESTERDAY" | "EARLIER";
export type AdminNotificationTone = "CRITICAL" | "SUBMISSION" | "PAYOUT" | "DISPUTE";

export type AdminNotification = {
  id: string;
  group: AdminNotificationGroup;
  type: AdminNotificationTone;
  title: string;
  description: string;
  timestamp: string;
  unread: boolean;
  actionLabel?: string;
  actionHref?: string;
};

export const adminNotifications: AdminNotification[] = [
  {
    id: "notif-1",
    group: "TODAY",
    type: "CRITICAL",
    title: "Critical bridge replay finding scored 9.2",
    description:
      "The highest-priority report crossed the critical threshold and should be reviewed before new queue intake grows.",
    timestamp: "09:14 UTC",
    unread: true,
    actionLabel: "REVIEW NOW ->",
    actionHref: "/admin/submissions/BF-9920"
  },
  {
    id: "notif-2",
    group: "TODAY",
    type: "DISPUTE",
    title: "Dispute opened on BF-9755 payout decision",
    description:
      "The researcher requested 80% after a prior 60% approval, citing stronger completeness and exploit realism evidence.",
    timestamp: "08:32 UTC",
    unread: true,
    actionLabel: "OPEN QUEUE ->",
    actionHref: "/admin/submissions/BF-9755"
  },
  {
    id: "notif-3",
    group: "TODAY",
    type: "PAYOUT",
    title: "Treasury payout window entered release phase",
    description:
      "A previously approved report passed dispute review and is ready for final treasury settlement handling.",
    timestamp: "07:48 UTC",
    unread: false,
    actionLabel: "VIEW TX ->",
    actionHref: "/admin/treasury"
  },
  {
    id: "notif-4",
    group: "YESTERDAY",
    type: "SUBMISSION",
    title: "Two new submissions crossed the admin notify threshold",
    description:
      "The AI pipeline routed both reports into the owner queue after passing the minimum triage threshold.",
    timestamp: "MAR 21 | 18:42 UTC",
    unread: false,
    actionLabel: "OPEN QUEUE ->",
    actionHref: "/admin/submissions/BF-9881"
  },
  {
    id: "notif-5",
    group: "YESTERDAY",
    type: "PAYOUT",
    title: "Aave yield credit posted to idle treasury",
    description:
      "Treasury idle balance earned another daily credit while funds remained unreserved by active bounty payouts.",
    timestamp: "MAR 21 | 12:10 UTC",
    unread: false,
    actionLabel: "VIEW TX ->",
    actionHref: "/admin/treasury"
  },
  {
    id: "notif-6",
    group: "EARLIER",
    type: "SUBMISSION",
    title: "Owner queue item marked for manual review",
    description:
      "A stale signer cache report was retained in queue after AI scoring so the owner can compare it against existing fixes.",
    timestamp: "MAR 20 | 13:05 UTC",
    unread: false,
    actionLabel: "OPEN QUEUE ->",
    actionHref: "/admin/submissions/BF-9802"
  }
];
