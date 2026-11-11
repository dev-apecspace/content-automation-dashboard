import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Content Automation",
  description: "Analytics and overview of content performance",
};

export default function DashboardPage() {
  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <DashboardOverview />
    </div>
  );
}
