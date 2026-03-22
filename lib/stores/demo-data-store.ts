import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  adminNotifications,
  type AdminNotification,
  type AdminNotificationTone
} from "@/lib/admin-notifications-data";
import {
  adminSubmissions,
  type AdminSubmissionStatus
} from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";

type SubmissionDecision = {
  status: AdminSubmissionStatus;
  payoutPct: number;
  rejectionReason?: string;
};

type DemoDataState = {
  createdBounties: BountyDetail[];
  notifications: AdminNotification[];
  submissionDecisions: Record<string, SubmissionDecision>;
  ownerSettings: {
    programStatus: "ACTIVE" | "PAUSED";
    notifyThreshold: number;
    autoRejectBelow: number;
    disputeWindowHours: number;
    autoReleasePayouts: boolean;
    treasuryYieldEnabled: boolean;
    ownerEmailAlerts: boolean;
    duplicateCheckEnabled: boolean;
    securityContact: string;
    responseSlaHours: number;
  };
  addCreatedBounty: (bounty: BountyDetail) => void;
  setSubmissionPayoutPct: (id: string, payoutPct: number) => void;
  applySubmissionDecision: (id: string, next: SubmissionDecision) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  updateOwnerSettings: (
    patch: Partial<DemoDataState["ownerSettings"]>
  ) => void;
};

function buildNotificationPayload(id: string, status: AdminSubmissionStatus): Omit<AdminNotification, "id"> | null {
  if (status === "DISPUTE WINDOW") {
    return {
      group: "TODAY",
      type: "PAYOUT",
      title: `Submission ${id} entered dispute window`,
      description: "Owner approval has been recorded and the 48-hour dispute countdown is now active.",
      timestamp: "JUST NOW",
      unread: true,
      actionLabel: "OPEN REVIEW ->",
      actionHref: `/admin/submissions/${id}`
    };
  }

  if (status === "UNDER REVIEW") {
    return {
      group: "TODAY",
      type: "SUBMISSION",
      title: `Submission ${id} marked for manual review`,
      description: "The report remains active in the owner queue pending final payout or rejection.",
      timestamp: "JUST NOW",
      unread: true,
      actionLabel: "OPEN REVIEW ->",
      actionHref: `/admin/submissions/${id}`
    };
  }

  if (status === "DISPUTE OPEN") {
    return {
      group: "TODAY",
      type: "DISPUTE",
      title: `Submission ${id} dispute escalated`,
      description: "A payout decision is now contested and requires owner resolution.",
      timestamp: "JUST NOW",
      unread: true,
      actionLabel: "OPEN REVIEW ->",
      actionHref: `/admin/submissions/${id}`
    };
  }

  if (status === "REJECTED") {
    return {
      group: "TODAY",
      type: "CRITICAL",
      title: `Submission ${id} was rejected`,
      description: "The report was closed with a rejection outcome and removed from the payout path.",
      timestamp: "JUST NOW",
      unread: true,
      actionLabel: "OPEN REVIEW ->",
      actionHref: `/admin/submissions/${id}`
    };
  }

  return null;
}

function prependNotification(
  existing: AdminNotification[],
  notification: Omit<AdminNotification, "id">
) {
  return [
    {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    },
    ...existing
  ];
}

const defaultSubmissionDecisions = Object.fromEntries(
  adminSubmissions.map((submission) => [
    submission.id,
    {
      status: submission.status,
      payoutPct: submission.recommendedPct
    }
  ])
) as Record<string, SubmissionDecision>;

export const useDemoDataStore = create<DemoDataState>()(
  persist(
    (set) => ({
      createdBounties: [],
      notifications: adminNotifications,
      submissionDecisions: defaultSubmissionDecisions,
      ownerSettings: {
        programStatus: "ACTIVE",
        notifyThreshold: 5,
        autoRejectBelow: 3,
        disputeWindowHours: 48,
        autoReleasePayouts: true,
        treasuryYieldEnabled: true,
        ownerEmailAlerts: true,
        duplicateCheckEnabled: true,
        securityContact: "security@bountyflow.xyz",
        responseSlaHours: 24
      },
      addCreatedBounty: (bounty) =>
        set((state) => ({
          createdBounties: [
            bounty,
            ...state.createdBounties.filter((item) => item.slug !== bounty.slug)
          ],
          notifications: prependNotification(state.notifications, {
            group: "TODAY",
            type: "SUBMISSION",
            title: `${bounty.title} launched by owner`,
            description:
              "A new bounty was funded and moved into the active public listings surface for demo mode.",
            timestamp: "JUST NOW",
            unread: true,
            actionLabel: "VIEW PROGRAM ->",
            actionHref: `/bounty/${bounty.slug}`
          })
        })),
      setSubmissionPayoutPct: (id, payoutPct) =>
        set((state) => ({
          submissionDecisions: {
            ...state.submissionDecisions,
            [id]: {
              ...(state.submissionDecisions[id] ?? {
                status: adminSubmissions.find((item) => item.id === id)?.status ?? "AI SCORED"
              }),
              payoutPct
            }
          }
        })),
      applySubmissionDecision: (id, next) =>
        set((state) => {
          const existing = state.submissionDecisions[id];
          const shouldNotify = !existing || existing.status !== next.status;
          const payload = shouldNotify ? buildNotificationPayload(id, next.status) : null;

          return {
            submissionDecisions: {
              ...state.submissionDecisions,
              [id]: next
            },
            notifications: payload
              ? prependNotification(state.notifications, payload)
              : state.notifications
          };
        }),
      markNotificationRead: (id) =>
        set((state) => ({
          notifications: state.notifications.map((item) =>
            item.id === id ? { ...item, unread: false } : item
          )
        })),
      markAllNotificationsRead: () =>
        set((state) => ({
          notifications: state.notifications.map((item) => ({ ...item, unread: false }))
        })),
      dismissNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((item) => item.id !== id)
        })),
      updateOwnerSettings: (patch) =>
        set((state) => ({
          ownerSettings: {
            ...state.ownerSettings,
            ...patch
          }
        }))
    }),
    {
      name: "bountyflow-demo-data"
    }
  )
);
