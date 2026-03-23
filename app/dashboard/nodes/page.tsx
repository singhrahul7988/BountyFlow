import { ResearcherDashboardShell } from "@/components/dashboard/researcher-dashboard-shell";

export default function DashboardNodesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ResearcherDashboardShell utilityPage="Nodes" />
    </main>
  );
}
