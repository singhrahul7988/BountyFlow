import { ResearcherSubmissionDetailShell } from "@/components/dashboard/researcher-submission-detail-shell";
import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

export default function SubmissionDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <ResearcherSubmissionDetailShell id={params.id} />
      <SiteFooter />
    </main>
  );
}
