import { notFound } from "next/navigation";

import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";
import { SubmissionExperience } from "@/components/submission/submission-experience";
import { getBountyBySlug } from "@/lib/bounty-data";

export default function BountySubmitPage({ params }: { params: { slug: string } }) {
  const bounty = getBountyBySlug(params.slug);

  if (!bounty) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <SubmissionExperience bounty={bounty} />
      <SiteFooter />
    </main>
  );
}
