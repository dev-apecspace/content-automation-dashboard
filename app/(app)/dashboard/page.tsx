import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { getCurrentUser } from "@/lib/auth/permissions";
import { getSelectedCompanyInfo } from "@/actions/business-action";
import { resolveCustomerForUser } from "@/lib/api/business";
import { getDataScopeProjectIds } from "@/lib/api/scope";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | Content Automation",
  description: "Analytics and overview of content performance",
};

export default async function DashboardPage() {
  const me = await getCurrentUser();

  // Chế độ dashboard:
  // - user khách → luôn là dashboard công ty của họ
  // - admin/nhân viên đã chọn công ty (cookie) → dashboard công ty đó
  // - còn lại → dashboard TỔNG toàn hệ thống (số liệu mọi công ty)
  let company: { slug: string; name: string } | null = null;
  if (me?.role === "customer") {
    const mine = await resolveCustomerForUser(me.userId).catch(() => null);
    const mineSlug = mine?.slug || null;
    if (mineSlug) company = { slug: mineSlug, name: mine?.name || "" };
  } else if (me) {
    const sel = await getSelectedCompanyInfo().catch(() => null);
    if (sel?.slug) company = { slug: sel.slug, name: sel.name };
  }

  let scopeIds: string[] | null = null;
  if (company) {
    const scope = await getDataScopeProjectIds();
    scopeIds = scope ? Array.from(scope) : [];
  }

  return (
    <div className="container mx-auto p-4 md:p-8 max-w-7xl">
      <DashboardOverview company={company} scopeIds={scopeIds} />
    </div>
  );
}
