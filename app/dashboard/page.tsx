import { ResearcherDashboard } from "@/components/dashboard/researcher-dashboard";
import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <ResearcherDashboard />
      <SiteFooter />
    </main>
  );
}
