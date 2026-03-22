import { notFound } from "next/navigation";

import { AdminSubmissionDetailView } from "@/components/admin/admin-submission-detail-view";
import { getAdminSubmissionById } from "@/lib/admin-submissions-data";

export default function AdminSubmissionDetailPage({
  params
}: {
  params: { id: string };
}) {
  const submission = getAdminSubmissionById(params.id);

  if (!submission) {
    notFound();
  }

  return <AdminSubmissionDetailView submission={submission} />;
}
