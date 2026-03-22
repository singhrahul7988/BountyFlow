import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";
import { SubmissionExperienceResolver } from "@/components/submission/submission-experience-resolver";
import { getBountyBySlug } from "@/lib/bounty-data";

export default function BountySubmitPage({ params }: { params: { slug: string } }) {
  const bounty = getBountyBySlug(params.slug) ?? null;

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <SubmissionExperienceResolver slug={params.slug} initialBounty={bounty} />
      <SiteFooter />
    </main>
  );
}
