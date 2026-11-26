"use server";

import { cookies } from "next/headers";
import { supabase } from "@/lib/supabase";
import { getCurrentUser } from "@/lib/auth/permissions";

/**
 * Scope dữ liệu nghiệp vụ theo công ty.
 *
 * Trả về:
 *  - null  → không lọc (admin/staff chưa chọn công ty nào → xem tất cả)
 *  - Set<> → chỉ được thấy các dự án thuộc tập id này (rỗng = không thấy gì)
 *
 * Quy tắc:
 *  - User khách (role=customer): LUÔN scope đúng công ty của mình, bất chấp
 *    cookie — an toàn kể cả khi tự sửa cookie.
 *  - Admin: theo cookie "selected_company" (đặt qua selectCompany, có verify).
 *  - Nhân viên: theo cookie + PHẢI có dòng trong user_companies (nixtech
 *    phân quyền). Cookie tự gán mà không được phân → bỏ qua (xem tất cả như
 *    trước khi có tính năng này).
 */
export async function getDataScopeProjectIds(): Promise<Set<string> | null> {
  const me = await getCurrentUser();
  if (!me) return null;

  // 1) User khách: công ty của chính mình
  if (me.role === "customer") {
    const { data: u } = await supabase
      .from("users")
      .select("customer_id")
      .eq("id", me.userId)
      .single();
    if (!u?.customer_id) return new Set<string>();
    const { data } = await supabase
      .from("projects")
      .select("id")
      .eq("customer_id", u.customer_id);
    return new Set((data || []).map((p) => p.id));
  }

  // 2) Admin/nhân viên: công ty đang chọn qua cookie
  const slug = (await cookies()).get("selected_company")?.value;
  if (!slug) return null;

  const { data: cust } = await supabase
    .from("customers")
    .select("id")
    .eq("slug", slug)
    .single();
  if (!cust?.id) return null;

  // Nhân viên phải được phân quyền vào công ty (bảng user_companies)
  if (me.role !== "admin") {
    try {
      const { data: grant } = await supabase
        .from("user_companies")
        .select("customer_id")
        .eq("user_id", me.userId)
        .eq("customer_id", cust.id)
        .maybeSingle();
      if (!grant) return null; // cookie không hợp lệ → bỏ qua
    } catch {
      return null; // bảng chưa tồn tại (chưa chạy SQL mục 7) → bỏ qua cookie
    }
  }

  const { data } = await supabase
    .from("projects")
    .select("id")
    .eq("customer_id", cust.id);
  return new Set((data || []).map((p) => p.id));
}
