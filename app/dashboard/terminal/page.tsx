import { ResearcherDashboardShell } from "@/components/dashboard/researcher-dashboard-shell";

export default function DashboardTerminalPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <ResearcherDashboardShell utilityPage="Terminal" />
    </main>
  );
}
