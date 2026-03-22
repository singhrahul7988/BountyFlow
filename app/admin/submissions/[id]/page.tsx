import { AdminSubmissionDetailResolver } from "@/components/admin/admin-submission-detail-resolver";

export default function AdminSubmissionDetailPage({
  params
}: {
  params: { id: string };
}) {
  return <AdminSubmissionDetailResolver id={params.id} />;
}
