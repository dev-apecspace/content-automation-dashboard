import { redirect, notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/permissions";
import {
  getCustomerBySlug,
  resolveCustomerForUser,
  checkUserCompanyAccess,
} from "@/lib/api/business";
import { CompanyWorkspace } from "./workspace-client";

/**
 * Workspace công ty theo slug: /{slug} (VD: /apec-global).
 * - Admin: vào được công ty bất kỳ (cổng /companies → chọn → redirect)
 * - User khách (role=customer): chỉ vào đúng công ty của mình
 * - Nhân viên nội bộ (editor/viewer): giữ quyền xem như cũ
 */
export default async function CompanySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const customer = await getCustomerBySlug(slug);
  if (!customer) notFound();

  let isCustomerUser = false;

  if (me.role === "customer") {
    isCustomerUser = true;
    const mine = await resolveCustomerForUser(me.userId);
    // User khách chỉ được vào công ty của chính mình
    if (mine.slug && mine.slug !== slug) redirect(`/${mine.slug}`);
    if (!mine.slug) redirect("/dashboard");
  } else if (me.role !== "admin") {
    // Nhân viên: chỉ công ty được admin phân (nixtech gán qua modal Người dùng)
    const ok = await checkUserCompanyAccess(me.userId, customer.id);
    if (!ok) redirect("/companies");
  }

  return (
    <CompanyWorkspace customer={customer} isCustomerUser={isCustomerUser} />
  );
}
