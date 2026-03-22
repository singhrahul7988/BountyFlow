import { notFound } from "next/navigation";

import { SubmissionDetailView } from "@/components/dashboard/submission-detail-view";
import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";
import { getResearcherSubmissionById } from "@/lib/dashboard-data";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  const submission = getResearcherSubmissionById(params.id);

  if (!submission) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <SubmissionDetailView submission={submission} />
      <SiteFooter />
    </main>
  );
}
