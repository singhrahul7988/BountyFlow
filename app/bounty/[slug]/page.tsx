import { BountyDetailResolver } from "@/components/bounties/bounty-detail-resolver";
import { getBountyBySlug } from "@/lib/bounty-data";

export default function BountyDetailPage({ params }: { params: { slug: string } }) {
  const bounty = getBountyBySlug(params.slug) ?? null;

  return <BountyDetailResolver slug={params.slug} initialBounty={bounty} />;
}
