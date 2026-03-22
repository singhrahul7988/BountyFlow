import { ResearcherDashboardShell } from "@/components/dashboard/researcher-dashboard-shell";
import { Navbar } from "@/components/home/navbar";
import { SiteFooter } from "@/components/home/site-footer";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navbar />
      <ResearcherDashboardShell />
      <SiteFooter />
    </main>
  );
}
