import { ResearcherDashboardShell } from "@/components/dashboard/researcher-dashboard-shell";

export default function DashboardSecurityPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ResearcherDashboardShell utilityPage="Security" />
    </main>
  );
}
