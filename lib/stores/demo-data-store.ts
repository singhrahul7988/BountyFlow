import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  adminNotifications,
  type AdminNotification,
  type AdminNotificationTone
} from "@/lib/admin-notifications-data";
import {
  adminSubmissions as seededAdminSubmissions,
  type AdminSubmission,
  type AdminSubmissionStatus
} from "@/lib/admin-submissions-data";
import type { BountyDetail } from "@/lib/bounty-data";
import type { ResearcherSubmission } from "@/lib/dashboard-data";
import type { SubmissionDecision } from "@/lib/demo-types";

type DemoDataState = {
  createdBounties: BountyDetail[];
  demoResearcherSubmissions: ResearcherSubmission[];
  demoAdminSubmissions: AdminSubmission[];
  notifications: AdminNotification[];
  submissionDecisions: Record<string, SubmissionDecision>;
  ownerSettings: {
    ownerDisplayName: string;
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
  addDemoSubmission: (payload: {
    researcherSubmission: ResearcherSubmission;
    adminSubmission: AdminSubmission;
  }) => void;
  syncRemoteBounties: (bounties: BountyDetail[]) => void;
  syncRemoteSubmissions: (payload: {
    researcherSubmissions?: ResearcherSubmission[];
    adminSubmissions?: AdminSubmission[];
    decisions?: Record<string, SubmissionDecision>;
  }) => void;
  syncRemoteNotifications: (notifications: AdminNotification[]) => void;
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
  seededAdminSubmissions.map((submission) => [
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
      demoResearcherSubmissions: [],
      demoAdminSubmissions: [],
      notifications: adminNotifications,
      submissionDecisions: defaultSubmissionDecisions,
      ownerSettings: {
        ownerDisplayName: "",
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
      addDemoSubmission: ({ researcherSubmission, adminSubmission }) =>
        set((state) => ({
          demoResearcherSubmissions: [
            researcherSubmission,
            ...state.demoResearcherSubmissions.filter(
              (item) => item.id !== researcherSubmission.id
            )
          ],
          demoAdminSubmissions: [
            adminSubmission,
            ...state.demoAdminSubmissions.filter((item) => item.id !== adminSubmission.id)
          ],
          submissionDecisions: {
            ...state.submissionDecisions,
            [adminSubmission.id]: {
              status: adminSubmission.status,
              payoutPct: adminSubmission.recommendedPct
            }
          },
          notifications: prependNotification(state.notifications, {
            group: "TODAY",
            type: "SUBMISSION",
            title: `${adminSubmission.title} entered the owner queue`,
            description:
              "A new researcher submission passed the demo intake flow and now requires owner review.",
            timestamp: "JUST NOW",
            unread: true,
            actionLabel: "REVIEW NOW ->",
            actionHref: `/admin/submissions/${adminSubmission.id}`
          })
        })),
      syncRemoteBounties: (bounties) =>
        set((state) => {
          const merged = [...bounties, ...state.createdBounties];
          const seen = new Set<string>();

          return {
            createdBounties: merged.filter((item) => {
              if (seen.has(item.slug)) {
                return false;
              }

              seen.add(item.slug);
              return true;
            })
          };
        }),
      syncRemoteSubmissions: ({ researcherSubmissions = [], adminSubmissions = [], decisions = {} }) =>
        set((state) => {
          const nextResearcher = [...researcherSubmissions, ...state.demoResearcherSubmissions];
          const nextAdmin = [...adminSubmissions, ...state.demoAdminSubmissions];

          const seenResearcher = new Set<string>();
          const seenAdmin = new Set<string>();

          return {
            demoResearcherSubmissions: nextResearcher.filter((item) => {
              if (seenResearcher.has(item.id)) {
                return false;
              }

              seenResearcher.add(item.id);
              return true;
            }),
            demoAdminSubmissions: nextAdmin.filter((item) => {
              if (seenAdmin.has(item.id)) {
                return false;
              }

              seenAdmin.add(item.id);
              return true;
            }),
            submissionDecisions: {
              ...state.submissionDecisions,
              ...decisions
            }
          };
        }),
      syncRemoteNotifications: (notifications) =>
        set((state) => {
          const next = [...notifications, ...state.notifications];
          const seen = new Set<string>();

          return {
            notifications: next.filter((item) => {
              if (seen.has(item.id)) {
                return false;
              }

              seen.add(item.id);
              return true;
            })
          };
        }),
      setSubmissionPayoutPct: (id, payoutPct) =>
        set((state) => ({
          submissionDecisions: {
            ...state.submissionDecisions,
            [id]: {
              ...(state.submissionDecisions[id] ?? {
                status:
                  seededAdminSubmissions.find((item) => item.id === id)?.status ?? "AI SCORED"
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
